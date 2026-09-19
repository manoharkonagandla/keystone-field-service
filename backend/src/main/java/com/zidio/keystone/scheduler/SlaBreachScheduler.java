package com.zidio.keystone.scheduler;

import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Scheduled job (F7) that flags work orders at risk of, or in, SLA breach.
 * Runs every 5 minutes - no external/paid service required.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class SlaBreachScheduler {

    private final WorkOrderService workOrderService;

    @Scheduled(fixedRate = 5 * 60 * 1000)
    public void checkSlaBreaches() {
        List<WorkOrder> breached = workOrderService.flagSlaBreaches();
        if (!breached.isEmpty()) {
            log.info("SLA breach scan flagged {} work order(s)", breached.size());
        }
    }
}
