package com.zidio.keystone.dto;

import com.zidio.keystone.domain.Priority;
import com.zidio.keystone.domain.WorkOrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class WorkOrderDtos {

    public record CreateWorkOrderRequest(
            @NotBlank String title,
            String description,
            @NotNull Priority priority,
            @NotNull Long customerId,
            @NotNull Long siteId
    ) {}

    public record UpdateWorkOrderRequest(
            String title,
            String description,
            Priority priority
    ) {}

    public record AssignRequest(
            @NotNull Long technicianId
    ) {}

    public record StatusChangeRequest(
            @NotNull WorkOrderStatus toStatus,
            String note
    ) {}

    public record LogPartsRequest(
            @NotNull Long partId,
            @NotNull Integer qtyUsed
    ) {}

    public record LogTimeRequest(
            @NotNull Integer minutes,
            String note
    ) {}

    public record CustomerRequestCreate(
            @NotBlank String title,
            String description,
            @NotNull Long siteId
    ) {}

    public record StatusHistoryItem(
            WorkOrderStatus fromStatus,
            WorkOrderStatus toStatus,
            Long changedBy,
            Instant changedAt,
            String note
    ) {}

    public record PartUsageItem(
            Long partId,
            String partName,
            Integer qtyUsed,
            BigDecimal lineCost
    ) {}

    public record TimeLogItem(
            Long technicianId,
            Integer minutes,
            String note,
            Instant loggedAt
    ) {}

    public record WorkOrderSummary(
            Long id,
            String code,
            String title,
            Priority priority,
            WorkOrderStatus status,
            Long customerId,
            Long siteId,
            Long assignedTo,
            Instant slaDueAt,
            boolean slaBreached,
            Instant createdAt
    ) {}

    public record WorkOrderDetail(
            Long id,
            String code,
            String title,
            String description,
            Priority priority,
            WorkOrderStatus status,
            Long customerId,
            Long siteId,
            Long assignedTo,
            Instant slaDueAt,
            boolean slaBreached,
            Instant createdAt,
            Instant updatedAt,
            List<StatusHistoryItem> history,
            List<PartUsageItem> partsUsed,
            List<TimeLogItem> timeLogs,
            BigDecimal totalPartsCost,
            Integer totalMinutes
    ) {}
}
