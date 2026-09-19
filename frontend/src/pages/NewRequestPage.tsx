import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteApi, WorkOrderApi } from '../api/keystone';
import type { Site } from '../types';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export default function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.customerId) {
      SiteApi.listByCustomer(user.customerId).then(setSites);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteId) return;
    setError(null);
    setBusy(true);
    try {
      const created = await WorkOrderApi.createCustomerRequest(title, description, Number(siteId));
      navigate(`/work-orders/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to raise request');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Raise a Request</h1>
      <p className="subtitle">Tell us what's going on and we'll get a technician on it.</p>

      <form className="card" style={{ maxWidth: 480 }} onSubmit={handleSubmit}>
        <div className="field">
          <label>Site</label>
          <select value={siteId} onChange={(e) => setSiteId(Number(e.target.value))} required>
            <option value="">Select a site...</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>What's the issue?</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. AC not cooling" />
        </div>
        <div className="field">
          <label>Details (optional)</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
