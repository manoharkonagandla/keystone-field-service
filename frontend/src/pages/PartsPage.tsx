import React, { useEffect, useState } from 'react';
import { PartApi } from '../api/keystone';
import type { Part } from '../types';
import { ApiError } from '../api/client';

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unitCost, setUnitCost] = useState(0);
  const [stockQty, setStockQty] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setParts(await PartApi.list());
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await PartApi.create(name, sku, unitCost, stockQty);
      setName(''); setSku(''); setUnitCost(0); setStockQty(0);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add part');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>Parts Inventory</h1>
      <p className="subtitle">Stock levels used for parts logging on work orders.</p>

      <div className="grid grid-2">
        <div className="card">
          <table>
            <thead><tr><th>Name</th><th>SKU</th><th>Unit Cost</th><th>Stock</th></tr></thead>
            <tbody>
              {parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.sku}</td><td>${p.unitCost.toFixed(2)}</td><td>{p.stockQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>Add Part</h2>
          {error && <p className="error-text">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="field"><label>SKU</label><input value={sku} onChange={(e) => setSku(e.target.value)} required /></div>
            <div className="field"><label>Unit cost ($)</label><input type="number" step="0.01" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} required /></div>
            <div className="field"><label>Starting stock</label><input type="number" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} required /></div>
            <button disabled={busy} type="submit">Add Part</button>
          </form>
        </div>
      </div>
    </div>
  );
}
