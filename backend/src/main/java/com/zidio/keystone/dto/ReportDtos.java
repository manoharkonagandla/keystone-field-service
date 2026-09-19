package com.zidio.keystone.dto;

import java.util.List;
import java.util.Map;

public class ReportDtos {

    public record DashboardSummary(
            Map<String, Long> countsByStatus,
            long overdueCount,
            double slaComplianceLast30Days,
            List<TechnicianLoad> byTechnician
    ) {}

    public record TechnicianLoad(
            Long technicianId,
            String technicianName,
            long openJobs,
            long completedJobs
    ) {}
}
