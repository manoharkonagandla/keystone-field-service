package com.zidio.keystone.repository;

import com.zidio.keystone.domain.WorkOrder;
import com.zidio.keystone.domain.WorkOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    Optional<WorkOrder> findByCode(String code);

    long countByStatus(WorkOrderStatus status);

    @Query("""
        select w from WorkOrder w
        where (:customerId is null or w.customerId = :customerId)
          and (:assignedTo is null or w.assignedTo = :assignedTo)
          and (:status is null or w.status = :status)
        order by w.createdAt desc
        """)
    Page<WorkOrder> search(@Param("customerId") Long customerId,
                            @Param("assignedTo") Long assignedTo,
                            @Param("status") WorkOrderStatus status,
                            Pageable pageable);

    List<WorkOrder> findByStatusNotInAndSlaDueAtBeforeAndSlaBreachedFalse(
            List<WorkOrderStatus> excludedStatuses, Instant now);

    List<WorkOrder> findByAssignedTo(Long assignedTo);

    List<WorkOrder> findByStatusIn(List<WorkOrderStatus> statuses);
}
