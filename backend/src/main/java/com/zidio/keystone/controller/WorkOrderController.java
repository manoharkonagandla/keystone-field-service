package com.zidio.keystone.controller;

import com.zidio.keystone.domain.WorkOrderStatus;
import com.zidio.keystone.dto.WorkOrderDtos.*;
import com.zidio.keystone.service.WorkOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    // ---- Create ----

    @PostMapping("/work-orders")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public WorkOrderSummary create(@Valid @RequestBody CreateWorkOrderRequest request) {
        return workOrderService.create(request);
    }

    /** Customer self-service portal: raise a request for one of their own sites. */
    @PostMapping("/work-orders/customer-request")
    @PreAuthorize("hasRole('CUSTOMER')")
    public WorkOrderSummary createCustomerRequest(@Valid @RequestBody CustomerRequestCreate request) {
        return workOrderService.createCustomerRequest(request);
    }

    // ---- Read ----

    @GetMapping("/work-orders")
    @PreAuthorize("isAuthenticated()")
    public Page<WorkOrderSummary> list(@RequestParam(required = false) Long customerId,
                                        @RequestParam(required = false) Long assignedTo,
                                        @RequestParam(required = false) WorkOrderStatus status,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return workOrderService.list(customerId, assignedTo, status, page, size);
    }

    @GetMapping("/work-orders/board")
    @PreAuthorize("isAuthenticated()")
    public java.util.List<WorkOrderSummary> board() {
        return workOrderService.board();
    }

    @GetMapping("/work-orders/{id}")
    @PreAuthorize("isAuthenticated()")
    public WorkOrderDetail getById(@PathVariable Long id) {
        return workOrderService.getDetail(id);
    }

    // ---- Update (open jobs only) ----

    @PutMapping("/work-orders/{id}")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public WorkOrderSummary update(@PathVariable Long id, @RequestBody UpdateWorkOrderRequest request) {
        return workOrderService.update(id, request);
    }

    // ---- Dispatch ----

    @PostMapping("/work-orders/{id}/assign")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public WorkOrderSummary assign(@PathVariable Long id, @Valid @RequestBody AssignRequest request) {
        return workOrderService.assign(id, request.technicianId());
    }

    // ---- Lifecycle ----

    @PostMapping("/work-orders/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public WorkOrderSummary changeStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest request) {
        return workOrderService.changeStatus(id, request.toStatus(), request.note());
    }

    // ---- Parts & time (technician field view) ----

    @PostMapping("/work-orders/{id}/parts")
    @PreAuthorize("hasAnyRole('TECHNICIAN','DISPATCHER','MANAGER')")
    public WorkOrderDetail logParts(@PathVariable Long id, @Valid @RequestBody LogPartsRequest request) {
        return workOrderService.logParts(id, request.partId(), request.qtyUsed());
    }

    @PostMapping("/work-orders/{id}/time")
    @PreAuthorize("hasAnyRole('TECHNICIAN','DISPATCHER','MANAGER')")
    public WorkOrderDetail logTime(@PathVariable Long id, @Valid @RequestBody LogTimeRequest request) {
        return workOrderService.logTime(id, request.minutes(), request.note());
    }
}
