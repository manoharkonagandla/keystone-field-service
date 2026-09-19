import React from 'react';
import type { Priority, WorkOrderStatus } from '../types';

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge badge-${priority}`}>{priority}</span>;
}

export function SlaBadge({ breached }: { breached: boolean }) {
  if (!breached) return null;
  return <span className="badge badge-breach">SLA BREACH</span>;
}
