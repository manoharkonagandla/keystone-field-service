import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import BoardPage from './pages/BoardPage';
import WorkOrdersListPage from './pages/WorkOrdersListPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import CustomersSitesPage from './pages/CustomersSitesPage';
import PartsPage from './pages/PartsPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import TechnicianJobsPage from './pages/TechnicianJobsPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import NewRequestPage from './pages/NewRequestPage';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RoleHome() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'TECHNICIAN') return <TechnicianJobsPage />;
  if (user.role === 'CUSTOMER') return <CustomerPortalPage />;
  return <BoardPage />; // DISPATCHER / MANAGER
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<RequireAuth><RoleHome /></RequireAuth>} />

          <Route path="/work-orders" element={
            <RequireAuth>
              <RequireRole roles={['DISPATCHER', 'MANAGER']}><WorkOrdersListPage /></RequireRole>
            </RequireAuth>
          } />

          <Route path="/work-orders/:id" element={<RequireAuth><WorkOrderDetailPage /></RequireAuth>} />

          <Route path="/customers" element={
            <RequireAuth>
              <RequireRole roles={['DISPATCHER', 'MANAGER']}><CustomersSitesPage /></RequireRole>
            </RequireAuth>
          } />

          <Route path="/parts" element={
            <RequireAuth>
              <RequireRole roles={['MANAGER']}><PartsPage /></RequireRole>
            </RequireAuth>
          } />

          <Route path="/dashboard" element={
            <RequireAuth>
              <RequireRole roles={['MANAGER']}><ManagerDashboardPage /></RequireRole>
            </RequireAuth>
          } />

          <Route path="/new-request" element={
            <RequireAuth>
              <RequireRole roles={['CUSTOMER']}><NewRequestPage /></RequireRole>
            </RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
