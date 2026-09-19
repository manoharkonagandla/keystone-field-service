package com.zidio.keystone.service;

import com.zidio.keystone.domain.*;
import com.zidio.keystone.dto.WorkOrderDtos.*;
import com.zidio.keystone.exception.ApiException;
import com.zidio.keystone.repository.*;
import com.zidio.keystone.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final PartUsageRepository partUsageRepository;
    private final TimeLogRepository timeLogRepository;
    private final PartRepository partRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final CustomerRepository customerRepository;
    private final CurrentUser currentUser;
    private final NotificationService notificationService;

    @Value("${keystone.sla.minutes.URGENT:240}")
    private long slaUrgentMinutes;
    @Value("${keystone.sla.minutes.HIGH:480}")
    private long slaHighMinutes;
    @Value("${keystone.sla.minutes.MEDIUM:1440}")
    private long slaMediumMinutes;
    @Value("${keystone.sla.minutes.LOW:4320}")
    private long slaLowMinutes;

    // ---------- Create ----------

    @Transactional
    public WorkOrderSummary create(CreateWorkOrderRequest request) {
        if (!customerRepository.existsById(request.customerId())) {
            throw ApiException.badRequest("Customer does not exist: " + request.customerId());
        }
        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> ApiException.badRequest("Site does not exist: " + request.siteId()));
        if (!site.getCustomerId().equals(request.customerId())) {
            throw ApiException.badRequest("Site does not belong to the given customer");
        }

        WorkOrder wo = WorkOrder.builder()
                .title(request.title())
                .description(request.description())
                .priority(request.priority())
                .status(WorkOrderStatus.NEW)
                .customerId(request.customerId())
                .siteId(request.siteId())
                .createdBy(currentUser.id())
                .slaDueAt(Instant.now().plus(Duration.ofMinutes(slaMinutesFor(request.priority()))))
                .build();

        wo = workOrderRepository.save(wo);
        wo.setCode("WO-" + (1000 + wo.getId()));
        wo = workOrderRepository.save(wo);

        writeHistory(wo.getId(), null, WorkOrderStatus.NEW, "Work order raised");

        return toSummary(wo);
    }

    /** Customer self-service request creation - restricted to the caller's own customer/site. */
    @Transactional
    public WorkOrderSummary createCustomerRequest(CustomerRequestCreate request) {
        Long callerCustomerId = currentUser.customerId();
        Site site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> ApiException.badRequest("Site does not exist: " + request.siteId()));
        if (!site.getCustomerId().equals(callerCustomerId)) {
            throw ApiException.forbidden("You may only raise requests for your own sites");
        }

        WorkOrder wo = WorkOrder.builder()
                .title(request.title())
                .description(request.description())
                .priority(Priority.MEDIUM)
                .status(WorkOrderStatus.NEW)
                .customerId(callerCustomerId)
                .siteId(request.siteId())
                .createdBy(currentUser.id())
                .slaDueAt(Instant.now().plus(Duration.ofMinutes(slaMinutesFor(Priority.MEDIUM))))
                .build();

        wo = workOrderRepository.save(wo);
        wo.setCode("WO-" + (1000 + wo.getId()));
        wo = workOrderRepository.save(wo);

        writeHistory(wo.getId(), null, WorkOrderStatus.NEW, "Raised via customer portal");

        return toSummary(wo);
    }

    // ---------- Read ----------

    public Page<WorkOrderSummary> list(Long customerIdFilter, Long assignedToFilter,
                                        WorkOrderStatus statusFilter, int page, int size) {
        String role = currentUser.role();
        Long effectiveCustomerId = customerIdFilter;
        Long effectiveAssignedTo = assignedToFilter;

        if ("CUSTOMER".equals(role)) {
            effectiveCustomerId = currentUser.customerId(); // always scoped to own org
        } else if ("TECHNICIAN".equals(role)) {
            effectiveAssignedTo = currentUser.id(); // technicians only see their own jobs
        }

        Page<WorkOrder> result = workOrderRepository.search(
                effectiveCustomerId, effectiveAssignedTo, statusFilter, PageRequest.of(page, size));
        return result.map(this::toSummary);
    }

    public List<WorkOrderSummary> board() {
        String role = currentUser.role();
        List<WorkOrderStatus> openStatuses = List.of(
                WorkOrderStatus.NEW, WorkOrderStatus.ASSIGNED,
                WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.ON_HOLD, WorkOrderStatus.COMPLETED);

        List<WorkOrder> orders = workOrderRepository.findByStatusIn(openStatuses);

        if ("TECHNICIAN".equals(role)) {
            Long uid = currentUser.id();
            orders = orders.stream().filter(w -> uid.equals(w.getAssignedTo())).toList();
        } else if ("CUSTOMER".equals(role)) {
            Long cid = currentUser.customerId();
            orders = orders.stream().filter(w -> cid.equals(w.getCustomerId())).toList();
        }

        return orders.stream().map(this::toSummary).toList();
    }

    public WorkOrderDetail getDetail(Long id) {
        WorkOrder wo = getEntityOrThrow(id);
        assertCanView(wo);

        List<StatusHistoryItem> history = historyRepository.findByWorkOrderIdOrderByChangedAtAsc(id).stream()
                .map(h -> new StatusHistoryItem(h.getFromStatus(), h.getToStatus(), h.getChangedBy(), h.getChangedAt(), h.getNote()))
                .toList();

        List<PartUsage> usages = partUsageRepository.findByWorkOrderId(id);
        List<PartUsageItem> partItems = usages.stream().map(u -> {
            Part part = partRepository.findById(u.getPartId()).orElse(null);
            BigDecimal lineCost = part == null ? BigDecimal.ZERO : part.getUnitCost().multiply(BigDecimal.valueOf(u.getQtyUsed()));
            return new PartUsageItem(u.getPartId(), part == null ? "Unknown" : part.getName(), u.getQtyUsed(), lineCost);
        }).toList();
        BigDecimal totalPartsCost = partItems.stream().map(PartUsageItem::lineCost).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<TimeLog> logs = timeLogRepository.findByWorkOrderId(id);
        List<TimeLogItem> timeItems = logs.stream()
                .map(t -> new TimeLogItem(t.getTechnicianId(), t.getMinutes(), t.getNote(), t.getLoggedAt()))
                .toList();
        int totalMinutes = logs.stream().mapToInt(TimeLog::getMinutes).sum();

        return new WorkOrderDetail(
                wo.getId(), wo.getCode(), wo.getTitle(), wo.getDescription(), wo.getPriority(), wo.getStatus(),
                wo.getCustomerId(), wo.getSiteId(), wo.getAssignedTo(), wo.getSlaDueAt(), wo.isSlaBreached(),
                wo.getCreatedAt(), wo.getUpdatedAt(), history, partItems, timeItems, totalPartsCost, totalMinutes);
    }

    // ---------- Update (open jobs only) ----------

    @Transactional
    public WorkOrderSummary update(Long id, UpdateWorkOrderRequest request) {
        WorkOrder wo = getEntityOrThrow(id);
        if (wo.getStatus().isTerminal()) {
            throw ApiException.conflict("Cannot edit a work order that is CLOSED or CANCELLED");
        }
        if (request.title() != null && !request.title().isBlank()) wo.setTitle(request.title());
        if (request.description() != null) wo.setDescription(request.description());
        if (request.priority() != null) {
            wo.setPriority(request.priority());
            wo.setSlaDueAt(wo.getCreatedAt().plus(Duration.ofMinutes(slaMinutesFor(request.priority()))));
        }
        wo = workOrderRepository.save(wo);
        return toSummary(wo);
    }

    // ---------- Dispatch / assignment ----------

    @Transactional
    public WorkOrderSummary assign(Long id, Long technicianId) {
        WorkOrder wo = getEntityOrThrow(id);
        if (wo.getStatus().isTerminal()) {
            throw ApiException.conflict("Cannot assign a work order that is CLOSED or CANCELLED");
        }
        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> ApiException.badRequest("Technician not found: " + technicianId));
        if (tech.getRole() != Role.TECHNICIAN) {
            throw ApiException.badRequest("User " + technicianId + " is not a technician");
        }

        WorkOrderStatus previousStatus = wo.getStatus();
        wo.setAssignedTo(technicianId);

        if (wo.getStatus() == WorkOrderStatus.NEW) {
            wo.setStatus(WorkOrderStatus.ASSIGNED);
        }
        // If already ASSIGNED/IN_PROGRESS/ON_HOLD, this is a reassignment - status unchanged.

        wo = workOrderRepository.save(wo);

        if (previousStatus != wo.getStatus()) {
            writeHistory(wo.getId(), previousStatus, wo.getStatus(), "Assigned to technician #" + technicianId);
        } else {
            writeHistory(wo.getId(), previousStatus, wo.getStatus(), "Reassigned to technician #" + technicianId);
        }

        notificationService.notify(tech.getEmail(), "New job assigned: " + wo.getCode(),
                "You have been assigned work order " + wo.getCode() + " - " + wo.getTitle());

        return toSummary(wo);
    }

    // ---------- Status transitions ----------

    @Transactional
    public WorkOrderSummary changeStatus(Long id, WorkOrderStatus target, String note) {
        WorkOrder wo = getEntityOrThrow(id);
        WorkOrderStatus current = wo.getStatus();

        if (!current.canTransitionTo(target)) {
            throw ApiException.conflict("Illegal transition: " + current + " -> " + target);
        }

        assertRoleCanTransition(wo, current, target);

        wo.setStatus(target);
        wo = workOrderRepository.save(wo);
        writeHistory(wo.getId(), current, target, note);

        return toSummary(wo);
    }

    private void assertRoleCanTransition(WorkOrder wo, WorkOrderStatus from, WorkOrderStatus to) {
        String role = currentUser.role();
        Long uid = currentUser.id();
        boolean isAssignedTechnician = uid.equals(wo.getAssignedTo());
        boolean isManagerOrDispatcher = "MANAGER".equals(role) || "DISPATCHER".equals(role);

        // CLOSE: manager only
        if (to == WorkOrderStatus.CLOSED) {
            if (!"MANAGER".equals(role)) {
                throw ApiException.forbidden("Only a manager can close a work order");
            }
            return;
        }
        // CANCEL: dispatcher/manager only
        if (to == WorkOrderStatus.CANCELLED) {
            if (!isManagerOrDispatcher) {
                throw ApiException.forbidden("Only a dispatcher or manager can cancel a work order");
            }
            return;
        }
        // START / HOLD / RESUME / COMPLETE: assigned technician (or manager override)
        if (from == WorkOrderStatus.ASSIGNED && to == WorkOrderStatus.IN_PROGRESS
                || from == WorkOrderStatus.IN_PROGRESS && to == WorkOrderStatus.ON_HOLD
                || from == WorkOrderStatus.ON_HOLD && to == WorkOrderStatus.IN_PROGRESS
                || from == WorkOrderStatus.IN_PROGRESS && to == WorkOrderStatus.COMPLETED) {
            if (!isAssignedTechnician && !"MANAGER".equals(role)) {
                throw ApiException.forbidden("Only the assigned technician (or a manager) can perform this transition");
            }
            return;
        }
        // REOPEN: manager or assigned technician
        if (from == WorkOrderStatus.COMPLETED && to == WorkOrderStatus.IN_PROGRESS) {
            if (!isAssignedTechnician && !"MANAGER".equals(role)) {
                throw ApiException.forbidden("Only the assigned technician or a manager can reopen a work order");
            }
            return;
        }
        // Fallback: dispatcher/manager only
        if (!isManagerOrDispatcher) {
            throw ApiException.forbidden("You do not have permission to perform this transition");
        }
    }

    // ---------- Parts & time (transactional) ----------

    @Transactional
    public WorkOrderDetail logParts(Long id, Long partId, int qtyUsed) {
        WorkOrder wo = getEntityOrThrow(id);
        assertCanLogWork(wo);
        if (qtyUsed <= 0) {
            throw ApiException.badRequest("Quantity used must be positive");
        }

        Part part = partRepository.findById(partId)
                .orElseThrow(() -> ApiException.notFound("Part not found: " + partId));

        if (part.getStockQty() < qtyUsed) {
            throw ApiException.conflict("Insufficient stock for part " + part.getSku()
                    + " (have " + part.getStockQty() + ", need " + qtyUsed + ")");
        }

        // Single transaction: decrement stock AND record usage together.
        part.setStockQty(part.getStockQty() - qtyUsed);
        partRepository.save(part);

        PartUsage usage = PartUsage.builder()
                .workOrderId(id)
                .partId(partId)
                .qtyUsed(qtyUsed)
                .loggedBy(currentUser.id())
                .build();
        partUsageRepository.save(usage);

        return getDetail(id);
    }

    @Transactional
    public WorkOrderDetail logTime(Long id, int minutes, String note) {
        WorkOrder wo = getEntityOrThrow(id);
        assertCanLogWork(wo);
        if (minutes <= 0) {
            throw ApiException.badRequest("Minutes must be positive");
        }

        TimeLog log = TimeLog.builder()
                .workOrderId(id)
                .technicianId(currentUser.id())
                .minutes(minutes)
                .note(note)
                .build();
        timeLogRepository.save(log);

        return getDetail(id);
    }

    private void assertCanLogWork(WorkOrder wo) {
        if (wo.getStatus().isTerminal()) {
            throw ApiException.conflict("Cannot log work against a CLOSED or CANCELLED work order");
        }
        String role = currentUser.role();
        if ("TECHNICIAN".equals(role) && !currentUser.id().equals(wo.getAssignedTo())) {
            throw ApiException.forbidden("You can only log work against jobs assigned to you");
        }
        if ("CUSTOMER".equals(role)) {
            throw ApiException.forbidden("Customers cannot log parts or time");
        }
    }

    // ---------- View authorisation ----------

    private void assertCanView(WorkOrder wo) {
        String role = currentUser.role();
        if ("CUSTOMER".equals(role) && !currentUser.customerId().equals(wo.getCustomerId())) {
            throw ApiException.forbidden("You cannot view another customer's work orders");
        }
        if ("TECHNICIAN".equals(role) && !currentUser.id().equals(wo.getAssignedTo())) {
            throw ApiException.forbidden("You can only view jobs assigned to you");
        }
    }

    // ---------- SLA breach scan (used by scheduler) ----------

    @Transactional
    public List<WorkOrder> flagSlaBreaches() {
        List<WorkOrderStatus> excluded = List.of(WorkOrderStatus.CLOSED, WorkOrderStatus.CANCELLED);
        List<WorkOrder> breached = workOrderRepository
                .findByStatusNotInAndSlaDueAtBeforeAndSlaBreachedFalse(excluded, Instant.now());
        for (WorkOrder wo : breached) {
            wo.setSlaBreached(true);
            workOrderRepository.save(wo);
            if (wo.getAssignedTo() != null) {
                userRepository.findById(wo.getAssignedTo()).ifPresent(tech ->
                        notificationService.notify(tech.getEmail(), "SLA breach: " + wo.getCode(),
                                "Work order " + wo.getCode() + " has breached its SLA due date."));
            }
        }
        return breached;
    }

    // ---------- Helpers ----------

    private long slaMinutesFor(Priority priority) {
        return switch (priority) {
            case URGENT -> slaUrgentMinutes;
            case HIGH -> slaHighMinutes;
            case MEDIUM -> slaMediumMinutes;
            case LOW -> slaLowMinutes;
        };
    }

    private void writeHistory(Long workOrderId, WorkOrderStatus from, WorkOrderStatus to, String note) {
        WorkOrderStatusHistory h = WorkOrderStatusHistory.builder()
                .workOrderId(workOrderId)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(currentUser.id())
                .note(note)
                .build();
        historyRepository.save(h);
    }

    private WorkOrder getEntityOrThrow(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Work order not found: " + id));
    }

    private WorkOrderSummary toSummary(WorkOrder wo) {
        return new WorkOrderSummary(wo.getId(), wo.getCode(), wo.getTitle(), wo.getPriority(), wo.getStatus(),
                wo.getCustomerId(), wo.getSiteId(), wo.getAssignedTo(), wo.getSlaDueAt(), wo.isSlaBreached(),
                wo.getCreatedAt());
    }
}
