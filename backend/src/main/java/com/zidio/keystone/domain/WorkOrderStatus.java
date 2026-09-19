package com.zidio.keystone.domain;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum WorkOrderStatus {
    NEW,
    ASSIGNED,
    IN_PROGRESS,
    ON_HOLD,
    COMPLETED,
    CLOSED,
    CANCELLED;

    private static final Map<WorkOrderStatus, Set<WorkOrderStatus>> TRANSITIONS = new EnumMap<>(WorkOrderStatus.class);

    static {
        TRANSITIONS.put(NEW, EnumSet.of(ASSIGNED, CANCELLED));
        TRANSITIONS.put(ASSIGNED, EnumSet.of(IN_PROGRESS, CANCELLED));
        TRANSITIONS.put(IN_PROGRESS, EnumSet.of(ON_HOLD, COMPLETED));
        TRANSITIONS.put(ON_HOLD, EnumSet.of(IN_PROGRESS));
        TRANSITIONS.put(COMPLETED, EnumSet.of(CLOSED, IN_PROGRESS)); // IN_PROGRESS = reopen
        TRANSITIONS.put(CLOSED, EnumSet.noneOf(WorkOrderStatus.class));
        TRANSITIONS.put(CANCELLED, EnumSet.noneOf(WorkOrderStatus.class));
    }

    public boolean canTransitionTo(WorkOrderStatus target) {
        return TRANSITIONS.getOrDefault(this, EnumSet.noneOf(WorkOrderStatus.class)).contains(target);
    }

    public boolean isTerminal() {
        return this == CLOSED || this == CANCELLED;
    }
}
