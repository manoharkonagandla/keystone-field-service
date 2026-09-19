import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LoginResponse, Role } from '../types';
import { AuthApi } from '../api/keystone';

interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'keystone_user';
const TOKEN_KEY = 'keystone_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (raw && token) {
      setUser(JSON.parse(raw));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res: LoginResponse = await AuthApi.login(email, password);
    const authUser: AuthUser = {
      userId: res.userId,
      name: res.name,
      email: res.email,
      role: res.role,
      customerId: res.customerId,
    };
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
