export type Role = 'DISPATCHER' | 'TECHNICIAN' | 'MANAGER' | 'CUSTOMER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
}

export interface Customer {
  id: number;
  name: string;
  contactEmail: string | null;
}

export interface Site {
  id: number;
  customerId: number;
  name: string;
  address: string | null;
}

export interface Part {
  id: number;
  name: string;
  sku: string;
  unitCost: number;
  stockQty: number;
}

export interface WorkOrderSummary {
  id: number;
  code: string;
  title: string;
  priority: Priority;
  status: WorkOrderStatus;
  customerId: number;
  siteId: number;
  assignedTo: number | null;
  slaDueAt: string | null;
  slaBreached: boolean;
  createdAt: string;
}

export interface StatusHistoryItem {
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  changedBy: number | null;
  changedAt: string;
  note: string | null;
}

export interface PartUsageItem {
  partId: number;
  partName: string;
  qtyUsed: number;
  lineCost: number;
}

export interface TimeLogItem {
  technicianId: number;
  minutes: number;
  note: string | null;
  loggedAt: string;
}

export interface WorkOrderDetail extends WorkOrderSummary {
  description: string | null;
  updatedAt: string;
  history: StatusHistoryItem[];
  partsUsed: PartUsageItem[];
  timeLogs: TimeLogItem[];
  totalPartsCost: number;
  totalMinutes: number;
}

export interface DashboardSummary {
  countsByStatus: Record<string, number>;
  overdueCount: number;
  slaComplianceLast30Days: number;
  byTechnician: {
    technicianId: number;
    technicianName: string;
    openJobs: number;
    completedJobs: number;
  }[];
}

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
