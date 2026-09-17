export type AppointmentStatus =
  | 'Pending'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface Appointment {
  itemType?: 'Service' | 'Product';
  previousAppointmentId?: number | null;
  id: number;
  customerId: number;
  employeeId?: number | null;
  serviceId?: number;
  serviceName: string;
  category: string;
  date: string;
  time: string;
  area: string;
  price: number;
  status: AppointmentStatus | string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerShopArea?: string | null;
  employeeName?: string | null;
  employeeEmail?: string | null;
  employeeShopArea?: string | null;
  notes?: string | null;
  createdAt?: string;
  appointmentType?: string | null;
}

export type AppointmentStatusUpdate = Pick<Appointment, 'status'>;

export interface AppointmentStatusHistoryEntry {
  id: number;
  appointmentId: number;
  oldStatus: string;
  newStatus: string;
  changedBy: number | null;
  changedByName: string | null;
  changedAt: string;
}

export interface BookingPayload {
  customerId: number;
  serviceId: number;
  serviceName: string;
  category: string;
  date: string;
  time: string;
  area: string;
  price: number;
}

export type AppointmentScope =
  | { role: 'admin' }
  | { role: 'customer'; userId: number }
  | { role: 'employee'; userId: number };

export type AppointmentListTab = 'upcoming' | 'past';

export interface AppointmentCardProps {
  appointment: Appointment;
}

export interface AppointmentEditForm {
  date: string;
  time: string;
}

export interface AppointmentConfirmAction {
  title: string;
  message: string;
  action: () => void;
  actionLabel: string;
  isDangerous: boolean;
}
