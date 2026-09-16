import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  PhilippinePeso,
  Scissors,
  User,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

import type {
  DashboardFieldProps,
  DashboardIconSectionProps,
  EmployeeAppointmentDetailsModalProps,
} from '../../../types';
import {
  formatAppointmentDate,
  formatPeso,
} from '../utils/appointmentDashboard';
import EmployeeStatusBadge from './EmployeeStatusBadge';
import NextSession from '../../appointments/components/NextSession';
import { employeeDisplayName } from '../../../utils/employeeDisplay';

function EmployeeAppointmentDetailsModal({
  activeTab,
  appointment,
  onClose,
  onUpdateStatus,
}: EmployeeAppointmentDetailsModalProps) {
  const canUpdate =
    appointment.status?.toLowerCase() === 'pending' && activeTab === 'upcoming';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Appointment Details
            </h2>
            <p className="text-xs text-gray-500">Appointment #{appointment.id}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <InfoSection icon={<User size={18} />} title="Customer Information">
            <p className="text-lg font-bold text-gray-800">
              {appointment.customerName || `Customer #${appointment.customerId}`}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Mail size={15} />
              <span>{appointment.customerEmail || 'No email available'}</span>
            </div>
            {appointment.customerShopArea && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={15} />
                <span>Customer Area: {appointment.customerShopArea}</span>
              </div>
            )}
          </InfoSection>

          <InfoSection icon={<Scissors size={18} />} title="Service Information">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Service" value={appointment.serviceName} />
              <Field label="Category" value={appointment.category} />
            </div>
          </InfoSection>

          <InfoSection icon={<CalendarDays size={18} />} title="Schedule">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Date"
                value={formatAppointmentDate(appointment.date)}
              />
              <Field label="Time" value={appointment.time} />
            </div>
          </InfoSection>

          <InfoSection icon={<MapPin size={18} />} title="Shop Area">
            <p className="font-semibold text-gray-800">{appointment.area}</p>
          </InfoSection>

          <InfoSection icon={<UserCheck size={18} />} title="Assigned Employee">
            <p className="font-semibold text-gray-800">
              {employeeDisplayName(appointment.employeeName, appointment.employeeId)}
            </p>
            {appointment.employeeEmail && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Mail size={15} />
                <span>{appointment.employeeEmail}</span>
              </div>
            )}
            {appointment.employeeShopArea && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={15} />
                <span>{appointment.employeeShopArea}</span>
              </div>
            )}
          </InfoSection>

          <InfoSection icon={<PhilippinePeso size={18} />} title="Price">
            <p className="text-2xl font-bold text-gray-800">
              {formatPeso(appointment.price)}
            </p>
          </InfoSection>

          <InfoSection icon={<Clock3 size={18} />} title="Status">
            <EmployeeStatusBadge status={appointment.status} />
          </InfoSection>

          {appointment.notes && (
            <div>
              <h3 className="mb-3 font-semibold text-gray-800">Notes</h3>
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                {appointment.notes}
              </div>
            </div>
          )}

          <NextSession key={appointment.id} appointment={appointment} />
          {canUpdate && (
            <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                <CheckCircle2 size={18} />
                Confirm Appointment
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <XCircle size={18} />
                Decline Appointment
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoSection({
  children,
  icon,
  title,
}: DashboardIconSectionProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-pink-500">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="rounded-xl bg-gray-50 p-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: DashboardFieldProps) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export default EmployeeAppointmentDetailsModal;
