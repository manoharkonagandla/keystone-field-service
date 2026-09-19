import React, { useEffect, useState } from 'react';
import { CustomerApi, SiteApi } from '../api/keystone';
import type { Customer, Site } from '../types';
import { ApiError } from '../api/client';

export default function CustomersSitesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadCustomers(search?: string) {
    const page = await CustomerApi.list(search);
    setCustomers(page.content);
    if (page.content.length > 0 && selectedCustomer === null) {
      setSelectedCustomer(page.content[0].id);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  // Debounce search so we don't fire a request on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => {
      loadCustomers(searchTerm || undefined);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    if (selectedCustomer) {
      SiteApi.listByCustomer(selectedCustomer).then(setSites);
    }
  }, [selectedCustomer]);

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await CustomerApi.create(newCustomerName, newCustomerEmail || undefined);
      setNewCustomerName('');
      setNewCustomerEmail('');
      await loadCustomers();
      setSelectedCustomer(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create customer');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer) return;
    setError(null);
    setBusy(true);
    try {
      await SiteApi.create(selectedCustomer, newSiteName, newSiteAddress || undefined);
      setNewSiteName('');
      setNewSiteAddress('');
      const updated = await SiteApi.listByCustomer(selectedCustomer);
      setSites(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create site');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Customers &amp; Sites</h1>
      <p className="subtitle">Manage the organisations Meridian serves and their building locations.</p>

      {error && <p className="error-text">{error}</p>}

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Customers</h2>
          <div className="field">
            <input
              placeholder="Search customers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <table>
            <thead><tr><th>Name</th><th>Contact</th><th></th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} style={{ background: c.id === selectedCustomer ? '#ece9fc' : undefined }}>
                  <td>{c.name}</td>
                  <td>{c.contactEmail || '—'}</td>
                  <td><button className="link" onClick={() => setSelectedCustomer(c.id)}>View sites</button></td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={3}>{searchTerm ? 'No customers match your search.' : 'No customers yet.'}</td></tr>
              )}
            </tbody>
          </table>

          <h2>Add Customer</h2>
          <form onSubmit={handleCreateCustomer}>
            <div className="field">
              <label>Name</label>
              <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Contact email (optional)</label>
              <input value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} type="email" />
            </div>
            <button disabled={busy} type="submit">Add Customer</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Sites {selectedCustomer && `— ${customers.find((c) => c.id === selectedCustomer)?.name}`}</h2>
          <table>
            <thead><tr><th>Name</th><th>Address</th></tr></thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id}><td>{s.name}</td><td>{s.address || '—'}</td></tr>
              ))}
              {sites.length === 0 && <tr><td colSpan={2}>No sites yet.</td></tr>}
            </tbody>
          </table>

          <h2>Add Site</h2>
          <form onSubmit={handleCreateSite}>
            <div className="field">
              <label>Site name</label>
              <input value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} required disabled={!selectedCustomer} />
            </div>
            <div className="field">
              <label>Address (optional)</label>
              <input value={newSiteAddress} onChange={(e) => setNewSiteAddress(e.target.value)} disabled={!selectedCustomer} />
            </div>
            <button disabled={busy || !selectedCustomer} type="submit">Add Site</button>
          </form>
        </div>
      </div>
    </div>
  );
}
