import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkOrderApi } from '../api/keystone';
import type { WorkOrderSummary } from '../types';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';

export default function CustomerPortalPage() {
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    WorkOrderApi.list({ size: 50 }).then((data) => {
      setOrders(data.content);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>My Requests</h1>
      <p className="subtitle">Status and history of your organisation's service requests.</p>
      <button onClick={() => navigate('/new-request')} style={{ marginBottom: 20 }}>
        + Raise a Request
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <div className="card">You haven't raised any requests yet.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Code</th><th>Title</th><th>Priority</th><th>Status</th><th>Raised</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.code}</td>
                <td>{o.title}</td>
                <td><PriorityBadge priority={o.priority} /></td>
                <td><StatusBadge status={o.status} /> <SlaBadge breached={o.slaBreached} /></td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td><button className="link" onClick={() => navigate(`/work-orders/${o.id}`)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
