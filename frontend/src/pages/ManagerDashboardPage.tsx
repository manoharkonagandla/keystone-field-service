import React, { useEffect, useState } from 'react';
import { ReportApi } from '../api/keystone';
import type { DashboardSummary } from '../types';

export default function ManagerDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    ReportApi.summary().then(setSummary);
  }, []);

  if (!summary) return <div>Loading dashboard...</div>;

  const counts = summary.countsByStatus;

  return (
    <div>
      <h1>Manager Dashboard</h1>
      <p className="subtitle">Live operational view across all customers and technicians.</p>

      <div className="grid grid-4">
        <div className="stat-card">
          <div className="num">{summary.overdueCount}</div>
          <div className="label">Overdue / SLA at risk</div>
        </div>
        <div className="stat-card">
          <div className="num">{summary.slaComplianceLast30Days}%</div>
          <div className="label">SLA compliance (30 days)</div>
        </div>
        <div className="stat-card">
          <div className="num">{(counts.NEW || 0) + (counts.ASSIGNED || 0) + (counts.IN_PROGRESS || 0) + (counts.ON_HOLD || 0)}</div>
          <div className="label">Open jobs</div>
        </div>
        <div className="stat-card">
          <div className="num">{counts.CLOSED || 0}</div>
          <div className="label">Closed all-time</div>
        </div>
      </div>

      <h2>Work Orders by Status</h2>
      <div className="card">
        <table>
          <thead><tr>{Object.keys(counts).map((s) => <th key={s}>{s}</th>)}</tr></thead>
          <tbody><tr>{Object.values(counts).map((v, i) => <td key={i}>{v}</td>)}</tr></tbody>
        </table>
      </div>

      <h2>By Technician</h2>
      <div className="card">
        {summary.byTechnician.length === 0 ? (
          <p>No technicians yet.</p>
        ) : (
          <table>
            <thead><tr><th>Technician</th><th>Open Jobs</th><th>Completed/Closed</th></tr></thead>
            <tbody>
              {summary.byTechnician.map((t) => (
                <tr key={t.technicianId}>
                  <td>{t.technicianName}</td>
                  <td>{t.openJobs}</td>
                  <td>{t.completedJobs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
