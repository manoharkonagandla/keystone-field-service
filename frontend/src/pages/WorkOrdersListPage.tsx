import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkOrderApi, CustomerApi, SiteApi } from '../api/keystone';
import type { Customer, Site, WorkOrderStatus, WorkOrderSummary, Priority } from '../types';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import { ApiError } from '../api/client';

const STATUSES: WorkOrderStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function WorkOrdersListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [siteId, setSiteId] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const result = await WorkOrderApi.list({
      status: statusFilter || undefined,
      page,
      size: 10,
    });
    setOrders(result.content);
    setTotalPages(result.totalPages);
  }

  useEffect(() => { load(); }, [page, statusFilter]);
  useEffect(() => { CustomerApi.list().then((p) => setCustomers(p.content)); }, []);
  useEffect(() => {
    if (customerId) SiteApi.listByCustomer(Number(customerId)).then(setSites);
    else setSites([]);
  }, [customerId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !siteId) return;
    setError(null);
    setBusy(true);
    try {
      const created = await WorkOrderApi.create(title, description, priority, Number(customerId), Number(siteId));
      setShowForm(false);
      setTitle(''); setDescription(''); setCustomerId(''); setSiteId('');
      navigate(`/work-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create work order');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Work Orders</h1>
      <p className="subtitle">Full list — searchable by status, paginated.</p>

      <div className="actions-row" style={{ marginBottom: 16 }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as WorkOrderStatus | ''); setPage(0); }} style={{ width: 200 }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ New Work Order'}</button>
      </div>

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <div className="grid grid-2">
            <div className="field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="field">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Customer</label>
              <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))} required>
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Site</label>
              <select value={siteId} onChange={(e) => setSiteId(Number(e.target.value))} required disabled={!customerId}>
                <option value="">Select site...</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>Description</label><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          {error && <p className="error-text">{error}</p>}
          <button disabled={busy} type="submit">Create Work Order</button>
        </form>
      )}

      <table>
        <thead><tr><th>Code</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th><th></th></tr></thead>
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

      <div className="actions-row" style={{ marginTop: 16 }}>
        <button className="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span style={{ alignSelf: 'center' }}>Page {page + 1} of {Math.max(totalPages, 1)}</span>
        <button className="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
