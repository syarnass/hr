// Bentuk response API NestJS (lihat *.select.ts di repo backend).

export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: number;
  employeeNumber: string;
  position: string;
  department: string;
  joinDate: string;
  managerId: number | null;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "email" | "role" | "isActive">;
  manager: {
    id: number;
    employeeNumber: string;
    position: string;
    user: { name: string };
  } | null;
}

export interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    employeeNumber: string;
    managerId: number | null;
    user: { id: number; name: string };
  };
  approver: { id: number; name: string } | null;
}

export interface LeaveBalance {
  employeeId: number;
  year: number;
  quota: number;
  used: number;
  pending: number;
  remaining: number;
  available: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
