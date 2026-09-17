import {
  CalendarDays,
  Eye,
  MapPin,
  PhilippinePeso,
  Scissors,
  User,
  UserCheck,
} from 'lucide-react';

import type {
  DashboardMobileDetailProps,
  EmployeeAppointmentListProps,
} from '../../../types';
import {
  formatAppointmentDate,
  formatPeso,
} from '../utils/appointmentDashboard';
import EmployeeStatusBadge from './EmployeeStatusBadge';
import { employeeDisplayName } from '../../../utils/employeeDisplay';

function EmployeeAppointmentList({
  appointments,
  onSelectAppointment,
}: EmployeeAppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="p-10 text-center">
        <CalendarDays size={42} className="mx-auto mb-3 text-gray-300" />
        <h3 className="font-semibold text-gray-700">No appointments found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try changing the tab or status filter.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-5 py-3 font-semibold">Service</th>
              <th className="px-5 py-3 font-semibold">Schedule</th>
              <th className="px-5 py-3 font-semibold">Area</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {appointment.customerName ||
                          `Customer #${appointment.customerId}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.customerEmail || 'No email available'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.customerPhone || 'No phone available'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <p className="font-semibold text-gray-800">
                    {appointment.serviceName}
                  </p>
                  <p className="text-xs text-gray-500">{appointment.category}</p>
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-gray-800">
                    {formatAppointmentDate(appointment.date)}
                  </p>
                  <p className="text-xs text-gray-500">{appointment.time}</p>
                </td>

                <td className="px-5 py-4 text-gray-700">{appointment.area}</td>
                <td className="px-5 py-4 font-semibold text-gray-800">
                  {formatPeso(appointment.price)}
                </td>
                <td className="px-5 py-4">
                  <EmployeeStatusBadge status={appointment.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectAppointment(appointment)}
                    className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600 transition hover:bg-pink-100"
                  >
                    <Eye size={15} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="rounded-2xl border border-gray-100 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-500">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-800">
                    {appointment.customerName ||
                      `Customer #${appointment.customerId}`}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {appointment.customerEmail || 'No email available'}
                  </p>
                </div>
              </div>
              <EmployeeStatusBadge status={appointment.status} />
            </div>

            <MobileDetail icon={<Scissors size={17} />} label="Service">
              <p className="font-medium text-gray-800">{appointment.serviceName}</p>
              <p className="text-xs text-gray-500">{appointment.category}</p>
            </MobileDetail>

            <MobileDetail icon={<CalendarDays size={17} />} label="Schedule">
              <p className="font-medium text-gray-800">
                {formatAppointmentDate(appointment.date)}
              </p>
              <p className="text-xs text-gray-500">{appointment.time}</p>
            </MobileDetail>

            <MobileDetail icon={<MapPin size={17} />} label="Shop Area">
              <p className="font-medium text-gray-800">{appointment.area}</p>
            </MobileDetail>

         <MobileDetail icon={<UserCheck size={17} />} label="Assigned Employee"
        >
          <p className="font-medium text-gray-800">
            {employeeDisplayName(appointment.employeeName, appointment.employeeId)}
          </p>
        </MobileDetail>

            <MobileDetail icon={<PhilippinePeso size={17} />} label="Price">
              <p className="font-semibold text-gray-800">
                {formatPeso(appointment.price)}
              </p>
            </MobileDetail>

            <button
              type="button"
              onClick={() => onSelectAppointment(appointment)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
            >
              <Eye size={17} />
              View Appointment
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function MobileDetail({
  children,
  icon,
  label,
}: DashboardMobileDetailProps) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-pink-500">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {children}
      </div>
    </div>
  );
}

export default EmployeeAppointmentList;
