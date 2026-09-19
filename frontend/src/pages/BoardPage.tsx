import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkOrderApi } from '../api/keystone';
import type { WorkOrderStatus, WorkOrderSummary } from '../types';
import { PriorityBadge, SlaBadge } from '../components/Badges';

const COLUMNS: WorkOrderStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

export default function BoardPage() {
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const data = await WorkOrderApi.board();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1>Work Order Board</h1>
      <p className="subtitle">Open jobs across all customers, grouped by status.</p>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <div className="card">No open work orders right now.</div>
      ) : (
        <div className="kanban">
          {COLUMNS.map((status) => (
            <div className="kanban-col" key={status}>
              <h3>{status.replace('_', ' ')} ({orders.filter((o) => o.status === status).length})</h3>
              {orders.filter((o) => o.status === status).map((o) => (
                <div className="wo-card" key={o.id} onClick={() => navigate(`/work-orders/${o.id}`)}>
                  <div className="code">{o.code}</div>
                  <div className="title">{o.title}</div>
                  <PriorityBadge priority={o.priority} /> <SlaBadge breached={o.slaBreached} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
