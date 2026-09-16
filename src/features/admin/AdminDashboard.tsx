import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAdminAppointments } from '../../api/appointments.api';
import type { Appointment } from '../../types';

interface DashboardCounts {
  todayAppointments: number;
  upcomingAppointments: number;
  pendingApproval: number;
  confirmed: number;

  completed: number;
  cancelled: number;
  noShow: number;
}

const initialCounts: DashboardCounts = {
  todayAppointments: 0,
  upcomingAppointments: 0,
  pendingApproval: 0,
  confirmed: 0,

  completed: 0,
  cancelled: 0,
  noShow: 0,
};

function AdminDashboard() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counts, setCounts] =
    useState<DashboardCounts>(initialCounts);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // =========================================================
  // GET LOCAL DATE
  // IMPORTANT:
  // We do NOT use new Date("YYYY-MM-DD")
  // because timezone conversion can shift the date.
  // =========================================================

  const getLocalDateString = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      today.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // NORMALIZE STATUS
  // Handles:
  // pending
  // Pending
  // pending approval
  // pending_approval
  // confirmed
  // no-show
  // no_show
  // etc.
  // =========================================================

  const normalizeStatus = (status?: string | null) => {
    return String(status || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  };

  // =========================================================
  // LOAD APPOINTMENTS
  //
  // Uses the shared `getAdminAppointments` API helper (same one the
  // Admin Appointments page uses) instead of a raw fetch() against a
  // locally-guessed base URL — that mismatch was why no data showed
  // up here.
  // =========================================================

  const loadAppointments = useCallback(async () => {
    try {
      setError('');

      // The backend excludes walk-ins by default when `type` is
      // omitted (it falls back to `type=appointment`). The dashboard
      // needs the full picture — both online appointments and
      // walk-ins — so we explicitly ask for `all`.
      const data = await getAdminAppointments({ type: 'all' });

      const appointmentData: Appointment[] =
        Array.isArray(data) ? data : [];

      setAppointments(appointmentData);

      // -----------------------------------------------------
      // CALCULATE DASHBOARD COUNTS
      // -----------------------------------------------------

      const today = getLocalDateString();

      let todayAppointments = 0;
      let upcomingAppointments = 0;
      let pendingApproval = 0;
      let confirmed = 0;

      let completed = 0;
      let cancelled = 0;
      let noShow = 0;

      appointmentData.forEach((appointment) => {
        const appointmentDate = String(
          appointment.date || ''
        ).slice(0, 10);

        const status = normalizeStatus(
          appointment.status
        );

        // ===================================================
        // STATUS COUNTS
        // ===================================================

        if (
          status === 'pending' ||
          status === 'pendingapproval'
        ) {
          pendingApproval++;
        }

        if (status === 'confirmed') {
          confirmed++;
        }

        if (status === 'completed') {
          completed++;
        }

        if (
          status === 'cancelled' ||
          status === 'canceled'
        ) {
          cancelled++;
        }

        if (
          status === 'noshow' ||
          status === 'noattendance'
        ) {
          noShow++;
        }

        // ===================================================
        // TODAY'S APPOINTMENTS
        //
        // Count actual bookings scheduled today.
        //
        // Cancelled and no-show appointments are excluded
        // because they are no longer active appointments.
        // ===================================================

        const isCancelled =
          status === 'cancelled' ||
          status === 'canceled';

        const isNoShow =
          status === 'noshow' ||
          status === 'noattendance';

        if (
          appointmentDate === today &&
          !isCancelled &&
          !isNoShow
        ) {
          todayAppointments++;
        }

        // ===================================================
        // UPCOMING APPOINTMENTS
        //
        // Future date only.
        //
        // Exclude:
        // - cancelled
        // - completed
        // - no-show
        // ===================================================

        const isCompleted =
          status === 'completed';

        if (
          appointmentDate > today &&
          !isCancelled &&
          !isCompleted &&
          !isNoShow
        ) {
          upcomingAppointments++;
        }
      });

      setCounts({
        todayAppointments,
        upcomingAppointments,
        pendingApproval,
        confirmed,
        completed,
        cancelled,
        noShow,
      });
    } catch (err) {
      console.error(
        'Failed to load dashboard appointments:',
        err
      );

      setError(
        'Unable to load appointment data.'
      );

      setAppointments([]);
      setCounts(initialCounts);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadAppointments();
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // TODAY'S APPOINTMENT LIST
  // =========================================================

  const todaysAppointments = useMemo(() => {
    const today = getLocalDateString();

    return appointments
      .filter((appointment) => {
        const appointmentDate = String(
          appointment.date || ''
        ).slice(0, 10);

        const status = normalizeStatus(
          appointment.status
        );

        const isCancelled =
          status === 'cancelled' ||
          status === 'canceled';

        const isNoShow =
          status === 'noshow' ||
          status === 'noattendance';

        return (
          appointmentDate === today &&
          !isCancelled &&
          !isNoShow
        );
      })
      .sort((a, b) => {
        return String(a.time || '').localeCompare(
          String(b.time || '')
        );
      });
  }, [appointments]);

  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (time: string) => {
    if (!time) {
      return '--';
    }

    const [hoursString, minutesString] =
      time.split(':');

    const hours = Number(hoursString);
    const minutes = Number(minutesString);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const renderStatusBadge = (
    status: string
  ) => {
    const normalized = normalizeStatus(status);

    if (normalized === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf9f1] px-2.5 py-1 text-xs font-semibold text-[#2f7d59]">
          <CheckCircle2 size={13} />
          Confirmed
        </span>
      );
    }

    if (
      normalized === 'completed'
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#4169a1]">
          <CheckCircle2 size={13} />
          Completed
        </span>
      );
    }

    if (
      normalized === 'cancelled' ||
      normalized === 'canceled'
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">
          <XCircle size={13} />
          Cancelled
        </span>
      );
    }

    if (
      normalized === 'noshow' ||
      normalized === 'noattendance'
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          <AlertCircle size={13} />
          No Show
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4e5] px-2.5 py-1 text-xs font-semibold text-[#b87918]">
        <Clock3 size={13} />
        Pending
      </span>
    );
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-[#d77992]"
            />

            <p className="mt-3 text-sm text-[#92737c]">
              Loading dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:mb-8">
        <div>
          <h1 className="page-title">
            Admin Dashboard
          </h1>

          <p className="page-subtitle">
            Overview of customer appointments and bookings
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#d77992] transition hover:bg-[#fff7f9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? 'animate-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={18} className="shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* TODAY */}
        <button
          type="button"
          onClick={() =>
            navigate('/admin-appointments?filter=today')
          }
          className="pink-card flex w-full cursor-pointer flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d77992] active:scale-[0.98]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#92737c] sm:text-sm">
                Today's Appointments
              </p>

              <p className="mt-2 text-2xl font-bold text-[#4b343b] sm:mt-3 sm:text-3xl">
                {counts.todayAppointments}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0f4] text-[#d77992] sm:h-10 sm:w-10">
              <CalendarDays size={18} />
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[#d77992]">
            <span className="hidden sm:inline">View appointments</span>
            <span className="sm:hidden">View</span>
            <ChevronRight size={14} />
          </p>
        </button>

        {/* UPCOMING */}
        <button
          type="button"
          onClick={() =>
            navigate('/admin-appointments?filter=upcoming')
          }
          className="pink-card flex w-full cursor-pointer flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d77992] active:scale-[0.98]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#92737c] sm:text-sm">
                Upcoming Appointments
              </p>

              <p className="mt-2 text-2xl font-bold text-[#4b343b] sm:mt-3 sm:text-3xl">
                {counts.upcomingAppointments}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0f4] text-[#d77992] sm:h-10 sm:w-10">
              <Clock3 size={18} />
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[#d77992]">
            <span className="hidden sm:inline">View appointments</span>
            <span className="sm:hidden">View</span>
            <ChevronRight size={14} />
          </p>
        </button>

        {/* PENDING */}
        <button
          type="button"
          onClick={() =>
            navigate('/admin-appointments?filter=pending')
          }
          className="pink-card flex w-full cursor-pointer flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d77992] active:scale-[0.98]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#92737c] sm:text-sm">
                Pending Approval
              </p>

              <p className="mt-2 text-2xl font-bold text-[#4b343b] sm:mt-3 sm:text-3xl">
                {counts.pendingApproval}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff4e5] text-[#b87918] sm:h-10 sm:w-10">
              <AlertCircle size={18} />
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[#d77992]">
            <span className="hidden sm:inline">Review bookings</span>
            <span className="sm:hidden">Review</span>
            <ChevronRight size={14} />
          </p>
        </button>

        {/* CONFIRMED */}
        <button
          type="button"
          onClick={() =>
            navigate('/admin-appointments?filter=confirmed')
          }
          className="pink-card flex w-full cursor-pointer flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d77992] active:scale-[0.98]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[#92737c] sm:text-sm">
                Confirmed
              </p>

              <p className="mt-2 text-2xl font-bold text-[#4b343b] sm:mt-3 sm:text-3xl">
                {counts.confirmed}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf9f1] text-[#2f7d59] sm:h-10 sm:w-10">
              <UserCheck size={18} />
            </div>
          </div>

          <p className="mt-3 flex items-center gap-1 text-xs font-medium text-[#d77992]">
            <span className="hidden sm:inline">View confirmed</span>
            <span className="sm:hidden">View</span>
            <ChevronRight size={14} />
          </p>
        </button>
      </div>

      {/* =====================================================
          TODAY'S APPOINTMENTS
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:mt-8 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#4b343b]">
              Today's Appointments
            </h2>

            <p className="mt-1 text-sm text-[#92737c]">
              {getLocalDateString()}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/admin-appointments?filter=today')
            }
            className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[#d77992] hover:underline sm:self-auto"
          >
            View All
            <ChevronRight size={15} />
          </button>
        </div>

        {todaysAppointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-pink-200 bg-[#fffafb] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f4] text-[#d77992]">
              <CalendarDays size={22} />
            </div>

            <p className="mt-3 font-semibold text-[#4b343b]">
              No appointments today
            </p>

            <p className="mt-1 text-sm text-[#92737c]">
              There are no active customer bookings scheduled for today.
            </p>
          </div>
        ) : (
          <>
            {/* ========================================
                MOBILE / TABLET: CARD LIST (below md)
            ======================================== */}
            <div className="flex flex-col gap-3 md:hidden">
              {todaysAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-pink-100 bg-[#fffafb] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold text-[#4b343b]">
                      <Clock3 size={15} className="text-[#d77992]" />
                      {formatTime(appointment.time)}
                    </div>

                    {renderStatusBadge(appointment.status)}
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-[#4b343b]">
                      {appointment.customerName || 'Customer'}
                    </p>

                    {appointment.customerEmail && (
                      <p className="mt-0.5 text-xs text-[#92737c]">
                        {appointment.customerEmail}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p className="text-[#92737c]">Service</p>
                      <p className="truncate font-medium text-[#5d424a]">
                        {appointment.serviceName}
                      </p>
                    </div>

                    <div>
                      <p className="text-[#92737c]">Area</p>
                      <p className="truncate font-medium text-[#745d65]">
                        {appointment.area}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ========================================
                DESKTOP: TABLE (md and up)
            ======================================== */}
            <div className="hidden overflow-x-auto rounded-xl border border-pink-100 md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-pink-100 bg-[#fff8fa] text-xs uppercase tracking-wide text-[#92737c]">
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Service</th>
                    <th className="px-4 py-3 font-semibold">Area</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {todaysAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-b border-pink-50 last:border-0 hover:bg-[#fffafb]"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2 font-semibold text-[#4b343b]">
                          <Clock3 size={15} className="text-[#d77992]" />
                          {formatTime(appointment.time)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[160px] truncate font-semibold text-[#4b343b]">
                          {appointment.customerName || 'Customer'}
                        </p>

                        {appointment.customerEmail && (
                          <p className="max-w-[160px] truncate text-xs text-[#92737c]">
                            {appointment.customerEmail}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[150px] truncate font-medium text-[#5d424a]">
                          {appointment.serviceName}
                        </p>

                        <p className="text-xs text-[#92737c]">
                          {appointment.category}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-sm text-[#745d65]">
                        {appointment.area}
                      </td>

                      <td className="px-4 py-3">
                        {renderStatusBadge(appointment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          APPOINTMENT STATUS
      ====================================================== */}

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 xl:grid-cols-2">
        <div className="pink-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f4] text-[#d77992]">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#4b343b]">
                Appointment Status
              </h2>

              <p className="text-xs text-[#92737c]">
                Based on actual customer bookings
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {/* COMPLETED */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbff] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <CheckCircle2 size={16} className="shrink-0 text-[#4169a1]" />
                Completed Appointments
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.completed}
              </span>
            </div>

            {/* CANCELLED */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <XCircle size={16} className="shrink-0 text-red-500" />
                Cancelled Appointments
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.cancelled}
              </span>
            </div>

            {/* NO SHOW */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <AlertCircle size={16} className="shrink-0 text-gray-500" />
                No Show Appointments
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.noShow}
              </span>
            </div>

            {/* TOTAL */}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#fff8fa] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6d4a54]">
                <Users size={16} className="shrink-0 text-[#d77992]" />
                Total Bookings
              </div>

              <span className="shrink-0 font-bold text-[#d77992]">
                {appointments.length}
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================
            BOOKING SUMMARY
        ==================================================== */}

        <div className="pink-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f4] text-[#d77992]">
              <UserCheck size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#4b343b]">
                Booking Summary
              </h2>

              <p className="text-xs text-[#92737c]">
                Current customer booking status
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {/* PENDING */}
            <button
              type="button"
              onClick={() => navigate('/admin-appointments?filter=pending')}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#fff4e5] px-4 py-3 text-left transition hover:brightness-95"
            >
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <AlertCircle size={16} className="shrink-0 text-[#b87918]" />
                Pending Approval
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.pendingApproval}
              </span>
            </button>

            {/* CONFIRMED */}
            <button
              type="button"
              onClick={() => navigate('/admin-appointments?filter=confirmed')}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#edf9f1] px-4 py-3 text-left transition hover:brightness-95"
            >
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <CheckCircle2 size={16} className="shrink-0 text-[#2f7d59]" />
                Confirmed
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.confirmed}
              </span>
            </button>

            {/* TODAY */}
            <button
              type="button"
              onClick={() => navigate('/admin-appointments?filter=upcoming')}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#fff8fa] px-4 py-3 text-left transition hover:brightness-95"
            >
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <CalendarDays size={16} className="shrink-0 text-[#d77992]" />
                Today's Appointments
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.todayAppointments}
              </span>
            </button>

            {/* UPCOMING */}
            <button
              type="button"
              onClick={() => navigate('/admin-appointments')}
              className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#fff8fa] px-4 py-3 text-left transition hover:brightness-95"
            >
              <div className="flex items-center gap-2 text-sm text-[#6d4a54]">
                <Clock3 size={16} className="shrink-0 text-[#d77992]" />
                Upcoming Appointments
              </div>

              <span className="shrink-0 font-bold text-[#4b343b]">
                {counts.upcomingAppointments}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;