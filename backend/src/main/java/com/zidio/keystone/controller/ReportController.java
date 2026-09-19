package com.zidio.keystone.controller;

import com.zidio.keystone.dto.ReportDtos.DashboardSummary;
import com.zidio.keystone.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAGER','DISPATCHER')")
    public DashboardSummary summary() {
        return reportService.dashboardSummary();
    }
}
