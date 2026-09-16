import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  X,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

import {
  deleteAppointmentById,
  getCustomerAppointments,
  getEmployeeAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from '../../api/appointments.api';
import type {
  Appointment as AppointmentItem,
  AppointmentConfirmAction,
  AppointmentEditForm,
  AppointmentListTab,
} from '../../types';
import { getCurrentUser } from '../../utils/auth';
import NextSession from './components/NextSession';

function Appointments() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<AppointmentListTab>('upcoming');

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);

  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentItem | null>(null);

  const [editForm, setEditForm] = useState<AppointmentEditForm>({
    date: '',
    time: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = getCurrentUser();
  const canCreateNextSession = currentUser?.role === 'admin' || currentUser?.role === 'employee';

  const [confirmAction, setConfirmAction] =
    useState<AppointmentConfirmAction | null>(null);

  /*
   * Converts:
   * 10:00
   * 10:00 AM
   * 10:00 PM
   *
   * into a Date-compatible ISO time.
   */
  const parseAppointmentDate = useCallback((
    date: string,
    time: string
  ): Date | null => {
    if (!date || !time) return null;

    let normalizedTime = time.trim();

    // 12-hour format: 10:00 AM / 10:00 PM
    const twelveHourMatch = normalizedTime.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (twelveHourMatch) {
      let hour = Number(twelveHourMatch[1]);
      const minute = twelveHourMatch[2];
      const period = twelveHourMatch[3].toUpperCase();

      if (period === 'PM' && hour !== 12) {
        hour += 12;
      }

      if (period === 'AM' && hour === 12) {
        hour = 0;
      }

      normalizedTime = `${String(hour).padStart(2, '0')}:${minute}`;
    }

    // 24-hour format: 10:00 or 10:00:00
    const twentyFourHourMatch = normalizedTime.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?$/
    );

    if (!twentyFourHourMatch) {
      return null;
    }

    const hour = twentyFourHourMatch[1].padStart(2, '0');
    const minute = twentyFourHourMatch[2];

    const parsed = new Date(`${date}T${hour}:${minute}:00`);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }, []);

  const fetchAppointments = useCallback(async () => {
    const currentUser = getCurrentUser();

    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      // This page is shared by both the customer and employee routes.
      // Employees need their own assigned appointments, not the
      // appointments where they happen to share an id with a customer.
      const data =
        currentUser.role === 'employee'
          ? await getEmployeeAppointments(currentUser.id)
          : await getCustomerAppointments(currentUser.id);

      setAppointments(Array.isArray(data) ? data : []);
      setCurrentTime(Date.now());
    } catch (err) {
      console.error('Fetch appointments error:', err);

      setAppointments([]);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load appointments.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAppointments();
    });
  }, [fetchAppointments]);

  /*
   * Determine if appointment is still upcoming.
   */
  const isUpcoming = useCallback((appointment: AppointmentItem) => {
    if (appointment.status === 'cancelled') {
      return false;
    }

    const appointmentDateTime = parseAppointmentDate(
      appointment.date,
      appointment.time
    );

    if (!appointmentDateTime) {
      return false;
    }

    return appointmentDateTime.getTime() >= currentTime;
  }, [currentTime, parseAppointmentDate]);

  /*
   * Split appointments into Upcoming and Past.
   */
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        if (activeTab === 'upcoming') {
          return isUpcoming(appointment);
        }

        return (
          !isUpcoming(appointment) ||
          appointment.status === 'cancelled'
        );
      })
      .sort((a, b) => {
        const dateA = parseAppointmentDate(a.date, a.time);
        const dateB = parseAppointmentDate(b.date, b.time);

        if (!dateA || !dateB) return 0;

        return activeTab === 'upcoming'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
  }, [appointments, activeTab, isUpcoming]);

  const upcomingCount = useMemo(() => {
    return appointments.filter(isUpcoming).length;
  }, [appointments, isUpcoming]);

  const pastCount = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        !isUpcoming(appointment) ||
        appointment.status === 'cancelled'
    ).length;
  }, [appointments, isUpcoming]);

  const canCancelAppointment = (
    appointment: AppointmentItem
  ): { allowed: boolean; reason: string } => {
    if (appointment.status === 'cancelled') {
      return {
        allowed: false,
        reason: 'Already cancelled',
      };
    }

    const appointmentDateTime = parseAppointmentDate(
      appointment.date,
      appointment.time
    );

    if (!appointmentDateTime) {
      return {
        allowed: false,
        reason: 'Invalid appointment date or time',
      };
    }

    const now = new Date();

    const hoursDifference =
      (appointmentDateTime.getTime() - now.getTime()) /
      (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return {
        allowed: false,
        reason: `Only ${Math.max(
          0,
          Math.floor(hoursDifference)
        )} hours left - cannot cancel within 24 hours`,
      };
    }

    return {
      allowed: true,
      reason: '',
    };
  };

  const confirmAppointment = async (
    appointmentId: number
  ) => {
    setIsSubmitting(true);
    setError('');

    try {
      const currentUser = getCurrentUser();

      await updateAppointmentStatus(
        appointmentId,
        'confirmed',
        false,
        currentUser?.id
      );

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointmentId
            ? {
                ...item,
                status: 'confirmed',
              }
            : item
        )
      );

      setSelectedAppointment((current) =>
        current?.id === appointmentId
          ? {
              ...current,
              status: 'confirmed',
            }
          : current
      );

      setSuccess(
        'Appointment confirmed successfully!'
      );

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to confirm appointment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAppointment = async (
    appointmentId: number
  ) => {
    const appointment = appointments.find(
      (a) => a.id === appointmentId
    );

    if (!appointment) return;

    const { allowed, reason } =
      canCancelAppointment(appointment);

    if (!allowed) {
      setError(reason);
      return;
    }

    setConfirmAction({
      title: 'Cancel Appointment?',
      message:
        'Are you sure you want to cancel this appointment? You can reschedule it later if needed.',
      action: async () => {
        setIsSubmitting(true);
        setError('');

        try {
          const currentUser = getCurrentUser();

          await updateAppointmentStatus(
            appointmentId,
            'cancelled',
            false,
            currentUser?.id
          );

          setAppointments((current) =>
            current.map((item) =>
              item.id === appointmentId
                ? {
                    ...item,
                    status: 'cancelled',
                  }
                : item
            )
          );

          setSuccess(
            'Appointment cancelled successfully!'
          );

          setSelectedAppointment(null);
          setConfirmAction(null);

          setTimeout(() => {
            setSuccess('');
          }, 3000);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to cancel appointment.'
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      actionLabel: 'Yes, Cancel It',
      isDangerous: true,
    });
  };

  const startEditAppointment = (
    appointment: AppointmentItem
  ) => {
    setEditingAppointment(appointment);

    setEditForm({
      date: appointment.date,
      time: appointment.time,
    });

    setError('');
  };

  const saveEditAppointment = async () => {
    if (!editingAppointment) return;

    if (!editForm.date || !editForm.time) {
      setError('Please select a date and time.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateAppointment(editingAppointment.id, {
        date: editForm.date,
        time: editForm.time,
      });

      setAppointments((current) =>
        current.map((item) =>
          item.id === editingAppointment.id
            ? {
                ...item,
                date: editForm.date,
                time: editForm.time,
              }
            : item
        )
      );

      setSuccess(
        'Appointment updated successfully!'
      );

      setEditingAppointment(null);
      setSelectedAppointment(null);

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update appointment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAppointment = async (
    appointmentId: number
  ) => {
    setConfirmAction({
      title: 'Delete Appointment?',
      message:
        'Move this appointment to Archives? An admin can restore it later.',
      action: async () => {
        setIsSubmitting(true);
        setError('');

        try {
          await deleteAppointmentById(appointmentId);

          setAppointments((current) =>
            current.filter(
              (item) => item.id !== appointmentId
            )
          );

          setSuccess(
            'Appointment moved to Archives.'
          );

          setSelectedAppointment(null);
          setConfirmAction(null);

          setTimeout(() => {
            setSuccess('');
          }, 3000);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to delete appointment.'
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      actionLabel: 'Yes, Delete It',
      isDangerous: true,
    });
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-50 text-green-600';

      case 'cancelled':
        return 'bg-red-50 text-red-600';

      case 'completed':
        return 'bg-blue-50 text-blue-600';

      default:
        return 'bg-[#fff5df] text-[#b88a2c]';
    }
  };

  return (
    <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="page-title">
          My Appointments
        </h1>

        <p className="page-subtitle">
          Manage your upcoming appointments and booking
          status.
        </p>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          ✓ {success}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 flex-shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* TABS */}
      <div className="mb-6 flex gap-3 border-b border-pink-100">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'upcoming'
              ? 'border-[#df7f98] text-[#d77992]'
              : 'border-transparent text-[#92737c]'
          }`}
        >
          Upcoming
          <span className="ml-2 rounded-full bg-pink-50 px-2 py-0.5 text-xs">
            {upcomingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'past'
              ? 'border-[#df7f98] text-[#d77992]'
              : 'border-transparent text-[#92737c]'
          }`}
        >
          Past
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
            {pastCount}
          </span>
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-6 text-sm text-[#7c5b63]">
          Loading your appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-pink-200 bg-white p-8 text-center">
          <CalendarDays
            size={40}
            className="mx-auto mb-3 text-[#d77992]"
          />

          <h3 className="font-semibold text-[#4b343b]">
            {activeTab === 'upcoming'
              ? 'No upcoming appointments'
              : 'No past appointments'}
          </h3>

          <p className="mt-1 text-sm text-[#7c5b63]">
            {activeTab === 'upcoming'
              ? 'Your upcoming bookings will appear here.'
              : 'Your completed or past bookings will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map(
            (appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-[#4b343b]">
                        {appointment.serviceName}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-[#80656d] sm:grid-cols-3">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        {appointment.date}
                      </span>

                      <span className="flex items-center gap-2">
                        <Clock3 size={16} />
                        {appointment.time}
                      </span>

                      <span className="flex items-center gap-2">
                        <MapPin size={16} />
                        {appointment.area}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <p className="text-lg font-bold text-[#c18c2d]">
                      ₱{Number(appointment.price || 0).toLocaleString()}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAppointment(
                          appointment
                        )
                      }
                      className="secondary-btn px-4 py-2 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* PENDING CONFIRMATION */}
                {appointment.status ===
                  'pending' &&
                  activeTab === 'upcoming' && (
                    <div className="mt-5 flex flex-col gap-3 rounded-xl bg-[#fff6e7] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-[#8b6523]">
                          <CheckCircle2 size={17} />
                          Please confirm your appointment
                        </p>

                        <p className="mt-1 text-xs text-[#9b7d45]">
                          Confirm your booking to secure
                          your schedule.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          confirmAppointment(
                            appointment.id
                          )
                        }
                        disabled={isSubmitting}
                        className="rounded-xl bg-[#c18c2d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {isSubmitting
                          ? 'Confirming...'
                          : 'Confirm'}
                      </button>
                    </div>
                  )}
              </div>
            )
          )}
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedAppointment &&
        !editingAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-pink-100 bg-[#fff5f8] px-6 py-4">
                <h2 className="text-lg font-bold text-[#4b343b]">
                  Appointment Details
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAppointment(null)
                  }
                  className="text-[#92737c] hover:text-[#4b343b]"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                    Service
                  </p>

                  <p className="text-lg font-bold text-[#4b343b]">
                    {selectedAppointment.serviceName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                      Date
                    </p>

                    <p className="font-semibold text-[#4b343b]">
                      {selectedAppointment.date}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                      Time
                    </p>

                    <p className="font-semibold text-[#4b343b]">
                      {selectedAppointment.time}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                      Category
                    </p>

                    <p className="font-semibold text-[#4b343b]">
                      {selectedAppointment.category}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                      Area
                    </p>

                    <p className="font-semibold text-[#4b343b]">
                      {selectedAppointment.area}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                    Price
                  </p>

                  <p className="text-2xl font-bold text-[#c18c2d]">
                    ₱{Number(selectedAppointment.price || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-[#92737c]">
                    Status
                  </p>

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${getStatusClass(
                      selectedAppointment.status
                    )}`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>

                {selectedAppointment.notes && <p className="whitespace-pre-wrap">{selectedAppointment.notes}</p>}
                {canCreateNextSession && <NextSession key={selectedAppointment.id} appointment={selectedAppointment} onCreated={() => void fetchAppointments()} />}
                {/* ACTIONS */}
                <div className="space-y-3 border-t border-pink-100 pt-4">
                  {selectedAppointment.status !==
                    'cancelled' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          startEditAppointment(
                            selectedAppointment
                          )
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#fff5f8] px-4 py-3 font-semibold text-[#4b343b] transition-colors hover:bg-[#ffd4e0]"
                      >
                        <Edit2 size={18} />
                        Edit Appointment
                      </button>

                      {canCancelAppointment(
                        selectedAppointment
                      ).allowed ? (
                        <button
                          type="button"
                          onClick={() =>
                            cancelAppointment(
                              selectedAppointment.id
                            )
                          }
                          disabled={isSubmitting}
                          className="w-full rounded-lg bg-orange-50 px-4 py-3 font-semibold text-orange-600 transition-colors hover:bg-orange-100 disabled:opacity-50"
                        >
                          {isSubmitting
                            ? 'Cancelling...'
                            : 'Cancel Appointment'}
                        </button>
                      ) : (
                        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
                          <Clock3 size={16} className="inline" />{' '}
                          {
                            canCancelAppointment(
                              selectedAppointment
                            ).reason
                          }
                        </div>
                      )}
                    </>
                  )}

                  {getCurrentUser()?.role === 'admin' && <button
                    type="button"
                    onClick={() =>
                      deleteAppointment(
                        selectedAppointment.id
                      )
                    }
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    Move to Archives
                  </button>}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAppointment(null)
                    }
                    className="w-full rounded-lg bg-[#4b343b] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#6b544b]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* EDIT MODAL */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 bg-[#fff5f8] px-6 py-4">
              <h2 className="text-lg font-bold text-[#4b343b]">
                Edit Appointment
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditingAppointment(null)
                }
                className="text-[#92737c] hover:text-[#4b343b]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4b343b]">
                  Date
                </label>

                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-pink-200 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#4b343b]">
                  Time
                </label>

                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      time: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-pink-200 px-4 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setEditingAppointment(null)
                  }
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-semibold text-[#4b343b] hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveEditAppointment}
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-[#c18c2d] px-4 py-2 font-semibold text-white hover:bg-[#b07720] disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div
              className={`px-6 py-6 ${
                confirmAction.isDangerous
                  ? 'bg-gradient-to-r from-red-50 to-orange-50'
                  : 'bg-gradient-to-r from-[#fff5f8] to-[#ffe8ed]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    confirmAction.isDangerous
                      ? 'bg-red-100'
                      : 'bg-[#ffd4e0]'
                  }`}
                >
                  {confirmAction.isDangerous ? (
                    <AlertCircle
                      size={24}
                      className="text-red-600"
                    />
                  ) : (
                    <CheckCircle2
                      size={24}
                      className="text-[#d77992]"
                    />
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#4b343b]">
                    {confirmAction.title}
                  </h2>

                  <p className="mt-2 text-sm text-[#80656d]">
                    {confirmAction.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-pink-100 bg-white p-6">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction(null)
                }
                disabled={isSubmitting}
                className="flex-1 rounded-xl border-2 border-[#e9b5c3] bg-white px-4 py-3 font-semibold text-[#4b343b] hover:bg-[#fff5f8] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAction.action}
                disabled={isSubmitting}
                className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50 ${
                  confirmAction.isDangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#c18c2d] hover:bg-[#b07720]'
                }`}
              >
                {isSubmitting
                  ? 'Processing...'
                  : confirmAction.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
