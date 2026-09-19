import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkOrderApi } from '../api/keystone';
import type { WorkOrderSummary } from '../types';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';

export default function TechnicianJobsPage() {
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    WorkOrderApi.board().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>My Jobs</h1>
      <p className="subtitle">Work orders assigned to you. Tap a job to start, log parts/time, or complete it.</p>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <div className="card">You have no open jobs right now.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Code</th><th>Title</th><th>Priority</th><th>Status</th><th>SLA due</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.code}</td>
                <td>{o.title}</td>
                <td><PriorityBadge priority={o.priority} /></td>
                <td><StatusBadge status={o.status} /> <SlaBadge breached={o.slaBreached} /></td>
                <td>{o.slaDueAt ? new Date(o.slaDueAt).toLocaleString() : '—'}</td>
                <td><button className="link" onClick={() => navigate(`/work-orders/${o.id}`)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
