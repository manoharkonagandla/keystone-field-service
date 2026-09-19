import { api } from './client';
import type {
  LoginResponse, UserSummary, Customer, Site, Part,
  WorkOrderSummary, WorkOrderDetail, DashboardSummary, ApiPage,
  Priority, WorkOrderStatus,
} from '../types';

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
};

export const UserApi = {
  me: () => api.get<UserSummary>('/users/me'),
  listByRole: (role?: string) =>
    api.get<UserSummary[]>(`/users${role ? `?role=${role}` : ''}`),
};

export const CustomerApi = {
  list: (search?: string) => {
    const qs = new URLSearchParams({ size: '100' });
    if (search) qs.set('search', search);
    return api.get<ApiPage<Customer>>(`/customers?${qs.toString()}`);
  },
  create: (name: string, contactEmail?: string) =>
    api.post<Customer>('/customers', { name, contactEmail }),
};

export const SiteApi = {
  listByCustomer: (customerId: number) =>
    api.get<Site[]>(`/customers/${customerId}/sites`),
  create: (customerId: number, name: string, address?: string) =>
    api.post<Site>('/sites', { customerId, name, address }),
};

export const PartApi = {
  list: () => api.get<Part[]>('/parts'),
  create: (name: string, sku: string, unitCost: number, stockQty: number) =>
    api.post<Part>('/parts', { name, sku, unitCost, stockQty }),
};

export const WorkOrderApi = {
  list: (params: { customerId?: number; assignedTo?: number; status?: WorkOrderStatus; page?: number; size?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
    return api.get<ApiPage<WorkOrderSummary>>(`/work-orders?${qs.toString()}`);
  },
  board: () => api.get<WorkOrderSummary[]>('/work-orders/board'),
  getById: (id: number) => api.get<WorkOrderDetail>(`/work-orders/${id}`),
  create: (title: string, description: string, priority: Priority, customerId: number, siteId: number) =>
    api.post<WorkOrderSummary>('/work-orders', { title, description, priority, customerId, siteId }),
  update: (id: number, title: string, description: string, priority: Priority) =>
    api.put<WorkOrderSummary>(`/work-orders/${id}`, { title, description, priority }),
  createCustomerRequest: (title: string, description: string, siteId: number) =>
    api.post<WorkOrderSummary>('/work-orders/customer-request', { title, description, siteId }),
  assign: (id: number, technicianId: number) =>
    api.post<WorkOrderSummary>(`/work-orders/${id}/assign`, { technicianId }),
  changeStatus: (id: number, toStatus: WorkOrderStatus, note?: string) =>
    api.post<WorkOrderSummary>(`/work-orders/${id}/status`, { toStatus, note }),
  logParts: (id: number, partId: number, qtyUsed: number) =>
    api.post<WorkOrderDetail>(`/work-orders/${id}/parts`, { partId, qtyUsed }),
  logTime: (id: number, minutes: number, note?: string) =>
    api.post<WorkOrderDetail>(`/work-orders/${id}/time`, { minutes, note }),
};

export const ReportApi = {
  summary: () => api.get<DashboardSummary>('/reports/summary'),
};
