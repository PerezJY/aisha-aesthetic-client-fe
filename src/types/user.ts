import type { UserRole } from './global';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole | string;
  shopArea?: string;
  status?: string;
  phone?: string | null;
}

export interface Employee extends User {
  role: 'employee' | 'Employee' | string;
  shopArea: string;
  status: string;
}

export interface EmployeePayload {
  name: string;
  email: string;
  password?: string;
  role: string;
  shopArea: string;
}
