import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE: Record<string, { to: string; label: string }[]> = {
  DISPATCHER: [
    { to: '/', label: 'Board' },
    { to: '/work-orders', label: 'Work Orders' },
    { to: '/customers', label: 'Customers & Sites' },
  ],
  MANAGER: [
    { to: '/', label: 'Board' },
    { to: '/work-orders', label: 'Work Orders' },
    { to: '/customers', label: 'Customers & Sites' },
    { to: '/parts', label: 'Parts' },
    { to: '/dashboard', label: 'Dashboard' },
  ],
  TECHNICIAN: [
    { to: '/', label: 'My Jobs' },
  ],
  CUSTOMER: [
    { to: '/', label: 'My Requests' },
    { to: '/new-request', label: 'Raise a Request' },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <>{children}</>;

  const links = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">KEYSTONE</div>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}>
            {l.label}
          </NavLink>
        ))}
        <div className="user-box">
          <div><strong>{user.name}</strong></div>
          <div>{user.role}</div>
          <button
            className="secondary"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </div>
      <div className="main-content">{children}</div>
    </div>
  );
}
