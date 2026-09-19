import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WorkOrderApi, UserApi, PartApi } from '../api/keystone';
import type { WorkOrderDetail, WorkOrderStatus, UserSummary, Part, Priority } from '../types';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

const NEXT_STEPS: Record<WorkOrderStatus, { to: WorkOrderStatus; label: string }[]> = {
  NEW: [
    { to: 'CANCELLED', label: 'Cancel' },
  ],
  ASSIGNED: [
    { to: 'IN_PROGRESS', label: 'Start Work' },
    { to: 'CANCELLED', label: 'Cancel' },
  ],
  IN_PROGRESS: [
    { to: 'ON_HOLD', label: 'Put On Hold' },
    { to: 'COMPLETED', label: 'Mark Complete' },
  ],
  ON_HOLD: [
    { to: 'IN_PROGRESS', label: 'Resume' },
  ],
  COMPLETED: [
    { to: 'CLOSED', label: 'Close (Manager)' },
    { to: 'IN_PROGRESS', label: 'Reopen' },
  ],
  CLOSED: [],
  CANCELLED: [],
};

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [technicians, setTechnicians] = useState<UserSummary[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');

  const [selectedTech, setSelectedTech] = useState<number | ''>('');
  const [selectedPart, setSelectedPart] = useState<number | ''>('');
  const [qty, setQty] = useState(1);
  const [minutes, setMinutes] = useState(15);
  const [note, setNote] = useState('');

  async function load() {
    if (!id) return;
    const data = await WorkOrderApi.getById(Number(id));
    setWo(data);
  }

  useEffect(() => {
    load();
    if (user?.role === 'DISPATCHER' || user?.role === 'MANAGER') {
      UserApi.listByRole('TECHNICIAN').then(setTechnicians).catch(() => {});
    }
    if (user?.role !== 'CUSTOMER') {
      PartApi.list().then(setParts).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function runAction(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (!wo) return <div>Loading...</div>;

  const canEdit = (user?.role === 'DISPATCHER' || user?.role === 'MANAGER')
    && wo.status !== 'CLOSED' && wo.status !== 'CANCELLED';
  const canAssign = (user?.role === 'DISPATCHER' || user?.role === 'MANAGER')
    && wo.status !== 'CLOSED' && wo.status !== 'CANCELLED';

  function startEdit() {
    setEditTitle(wo!.title);
    setEditDescription(wo!.description || '');
    setEditPriority(wo!.priority);
    setEditing(true);
  }

  async function saveEdit() {
    await runAction(() => WorkOrderApi.update(wo!.id, editTitle, editDescription, editPriority));
    setEditing(false);
  }
  const canLogWork = user?.role !== 'CUSTOMER'
    && wo.status !== 'CLOSED' && wo.status !== 'CANCELLED'
    && (user?.role !== 'TECHNICIAN' || user?.userId === wo.assignedTo);

  return (
    <div>
      <button className="secondary" onClick={() => navigate(-1)}>&larr; Back</button>
      <h1 style={{ marginTop: 12 }}>{wo.code} &mdash; {wo.title}</h1>
      <p className="subtitle">
        <StatusBadge status={wo.status} /> {' '}
        <PriorityBadge priority={wo.priority} /> {' '}
        <SlaBadge breached={wo.slaBreached} />
      </p>

      {error && <p className="error-text">{error}</p>}

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Details</h2>

          {editing ? (
            <div>
              <div className="field">
                <label>Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
              <div className="actions-row">
                <button disabled={busy} onClick={saveEdit}>Save Changes</button>
                <button className="secondary" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p>{wo.description || <em>No description provided.</em>}</p>
              {canEdit && (
                <button className="secondary" onClick={startEdit} style={{ marginBottom: 12 }}>
                  Edit Title / Priority / Description
                </button>
              )}
            </>
          )}

          <p><strong>Site ID:</strong> {wo.siteId}</p>
          <p><strong>SLA due:</strong> {wo.slaDueAt ? new Date(wo.slaDueAt).toLocaleString() : '—'}</p>
          <p><strong>Assigned to:</strong> {wo.assignedTo ?? 'Unassigned'}</p>
          <p><strong>Created:</strong> {new Date(wo.createdAt).toLocaleString()}</p>

          {canAssign && (
            <div className="actions-row">
              <select value={selectedTech} onChange={(e) => setSelectedTech(Number(e.target.value))} style={{ width: 200 }}>
                <option value="">Select technician...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button
                disabled={busy || !selectedTech}
                onClick={() => runAction(() => WorkOrderApi.assign(wo.id, Number(selectedTech)))}
              >
                {wo.assignedTo ? 'Reassign' : 'Assign'}
              </button>
            </div>
          )}

          <h2>Lifecycle</h2>
          <div className="actions-row">
            {NEXT_STEPS[wo.status].map((step) => (
              <button
                key={step.to}
                disabled={busy}
                className={step.to === 'CANCELLED' ? 'danger' : ''}
                onClick={() => runAction(() => WorkOrderApi.changeStatus(wo.id, step.to))}
              >
                {step.label}
              </button>
            ))}
            {NEXT_STEPS[wo.status].length === 0 && <em>No further transitions — this job is terminal.</em>}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Status History</h2>
          <table>
            <thead><tr><th>From</th><th>To</th><th>When</th><th>Note</th></tr></thead>
            <tbody>
              {wo.history.map((h, i) => (
                <tr key={i}>
                  <td>{h.fromStatus || '—'}</td>
                  <td>{h.toStatus}</td>
                  <td>{new Date(h.changedAt).toLocaleString()}</td>
                  <td>{h.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canLogWork && (
        <div className="grid grid-2">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Log Parts Used</h2>
            <div className="field">
              <label>Part</label>
              <select value={selectedPart} onChange={(e) => setSelectedPart(Number(e.target.value))}>
                <option value="">Select part...</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (stock: {p.stockQty})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Quantity</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <button
              disabled={busy || !selectedPart}
              onClick={() => runAction(() => WorkOrderApi.logParts(wo.id, Number(selectedPart), qty))}
            >
              Log Parts
            </button>

            {wo.partsUsed.length > 0 && (
              <table style={{ marginTop: 16 }}>
                <thead><tr><th>Part</th><th>Qty</th><th>Cost</th></tr></thead>
                <tbody>
                  {wo.partsUsed.map((p, i) => (
                    <tr key={i}><td>{p.partName}</td><td>{p.qtyUsed}</td><td>${p.lineCost.toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <p><strong>Total parts cost:</strong> ${wo.totalPartsCost.toFixed(2)}</p>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Log Time</h2>
            <div className="field">
              <label>Minutes</label>
              <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do?" />
            </div>
            <button
              disabled={busy}
              onClick={() => runAction(() => WorkOrderApi.logTime(wo.id, minutes, note))}
            >
              Log Time
            </button>

            {wo.timeLogs.length > 0 && (
              <table style={{ marginTop: 16 }}>
                <thead><tr><th>Minutes</th><th>Note</th><th>When</th></tr></thead>
                <tbody>
                  {wo.timeLogs.map((t, i) => (
                    <tr key={i}><td>{t.minutes}</td><td>{t.note || ''}</td><td>{new Date(t.loggedAt).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <p><strong>Total time logged:</strong> {wo.totalMinutes} minutes</p>
          </div>
        </div>
      )}
    </div>
  );
}
