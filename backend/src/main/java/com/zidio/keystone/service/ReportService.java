package com.zidio.keystone.service;

import com.zidio.keystone.domain.User;
import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.domain.WorkOrderStatus;
import com.zidio.keystone.dto.ReportDtos.DashboardSummary;
import com.zidio.keystone.dto.ReportDtos.TechnicianLoad;
import com.zidio.keystone.repository.UserRepository;
import com.zidio.keystone.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final WorkOrderRepository workOrderRepository;
    private final UserRepository userRepository;

    public DashboardSummary dashboardSummary() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (WorkOrderStatus status : WorkOrderStatus.values()) {
            counts.put(status.name(), workOrderRepository.countByStatus(status));
        }

        List<WorkOrder> all = workOrderRepository.findAll();
        Instant now = Instant.now();

        long overdue = all.stream()
                .filter(w -> !w.getStatus().isTerminal())
                .filter(w -> w.getSlaDueAt() != null && w.getSlaDueAt().isBefore(now))
                .count();

        List<WorkOrder> closedLast30 = all.stream()
                .filter(w -> w.getStatus() == WorkOrderStatus.CLOSED)
                .filter(w -> w.getUpdatedAt().isAfter(now.minusSeconds(30L * 24 * 3600)))
                .toList();
        double compliance = closedLast30.isEmpty() ? 100.0 :
                100.0 * closedLast30.stream().filter(w -> !w.isSlaBreached()).count() / closedLast30.size();

        List<User> technicians = userRepository.findAll().stream()
                .filter(u -> u.getRole().name().equals("TECHNICIAN"))
                .toList();

        List<TechnicianLoad> byTechnician = technicians.stream().map(t -> {
            List<WorkOrder> assigned = all.stream().filter(w -> t.getId().equals(w.getAssignedTo())).toList();
            long open = assigned.stream().filter(w -> !w.getStatus().isTerminal()).count();
            long completed = assigned.stream()
                    .filter(w -> w.getStatus() == WorkOrderStatus.COMPLETED || w.getStatus() == WorkOrderStatus.CLOSED)
                    .count();
            return new TechnicianLoad(t.getId(), t.getName(), open, completed);
        }).toList();

        return new DashboardSummary(counts, overdue, Math.round(compliance * 10) / 10.0, byTechnician);
    }
}
