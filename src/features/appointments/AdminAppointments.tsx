import { useEffect, useMemo, useRef, useState } from 'react';
import NextSession from './components/NextSession';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, ChevronLeft, ChevronRight, History, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

import {
  deleteAppointmentById,
  getAdminAppointments,
  getAppointmentStatusHistory,
  updateAppointmentStatus,
} from '../../api/appointments.api';
import { getCurrentUser } from '../../utils/auth';
import { employeeDisplayName } from '../../utils/employeeDisplay';

import type { Appointment } from '../../types';

// Mirrors the backend's `type` query param (?type=appointment | walkin | all)
type TypeFilter = 'appointment' | 'walkin' | 'all';

// Mirrors the backend's `status` query param (case/whitespace-insensitive there)
type StatusFilter =
  | 'all'
  | 'Pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

const PAGE_SIZE = 10;

function AdminAppointments() {
  const [sessionAppointment, setSessionAppointment] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentIds, setSelectedAppointmentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // URL / DASHBOARD FILTER
  // =========================================================

  const [searchParams, setSearchParams] = useSearchParams();
  const dashboardFilter = (searchParams.get('filter') || '').toLowerCase();

  const isDashboardFilter = [
    'today',
    'upcoming',
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'no-show',
  ].includes(dashboardFilter);

  const dashboardStatusMap: Record<string, StatusFilter> = {
    pending: 'Pending',
    confirmed: 'confirmed',
    completed: 'completed',
    cancelled: 'cancelled',
    'no-show': 'no-show',
  };

  // =========================================================
  // FILTERS
  // =========================================================

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('appointment');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // When coming from the Admin Dashboard, automatically select
  // Type = All so BOTH online appointments and walk-ins are included.
  // For status filters, automatically select the matching status.
  useEffect(() => {
    if (!isDashboardFilter) {
      return;
    }

    setTypeFilter('all');
    setStatusFilter(dashboardStatusMap[dashboardFilter] || 'all');
  }, [dashboardFilter, isDashboardFilter]);

  // Effective values used by the UI and API request.
  // Dashboard filters always force Type = All.
  const effectiveTypeFilter: TypeFilter = isDashboardFilter
    ? 'all'
    : typeFilter;

  const effectiveStatusFilter: StatusFilter = isDashboardFilter
    ? dashboardStatusMap[dashboardFilter] || 'all'
    : statusFilter;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);

        const params: { type?: string; status?: string } = {};

        // IMPORTANT:
        // Dashboard filters must include BOTH online appointments
        // and walk-ins, so use type=all.
        if (effectiveTypeFilter !== 'appointment') {
          params.type = effectiveTypeFilter;
        }

        // For dashboard status filters, let the backend return all types
        // and apply the status/date filter consistently below.
        if (!isDashboardFilter && effectiveStatusFilter !== 'all') {
          params.status = effectiveStatusFilter;
        }

        const data = await getAdminAppointments(params);

        setSelectedAppointmentIds([]);
        setAppointments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching appointments:', error);

        setAppointments([]);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load',
          text: 'Unable to load appointment records.',
          confirmButtonColor: '#df7f98',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [effectiveTypeFilter, effectiveStatusFilter, isDashboardFilter]);

  const normalizeStatus = (status?: string | null) =>
    String(status || '')
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-');

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredAppointments = useMemo(() => {
    if (!isDashboardFilter) {
      return appointments;
    }

    const today = getLocalDateString();

    return appointments.filter((appointment) => {
      const status = normalizeStatus(appointment.status);
      const date = String(appointment.date || '').slice(0, 10);

      switch (dashboardFilter) {
        case 'today':
          return (
            date === today &&
            status !== 'cancelled' &&
            status !== 'no-show'
          );

        case 'upcoming':
          return (
            date > today &&
            status !== 'cancelled' &&
            status !== 'completed' &&
            status !== 'no-show'
          );

        case 'pending':
          return status === 'pending' || status === 'pending-approval';

        case 'confirmed':
          return status === 'confirmed';

        case 'completed':
          return status === 'completed';

        case 'cancelled':
          return status === 'cancelled';

        case 'no-show':
          return status === 'no-show';

        default:
          return true;
      }
    });
  }, [appointments, dashboardFilter, isDashboardFilter]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / PAGE_SIZE)
  );

  // Reset to page 1 whenever filters change or the data set changes
  // (new fetch, delete, etc.) so the user isn't stranded on a page
  // that no longer has data.
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, appointments.length, dashboardFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, currentPage]);

  const filteredAppointmentIds = useMemo(
    () => filteredAppointments.map((appointment) => appointment.id),
    [filteredAppointments]
  );
  const selectedFilteredCount = selectedAppointmentIds.filter((id) =>
    filteredAppointmentIds.includes(id)
  ).length;
  const allFilteredSelected =
    filteredAppointmentIds.length > 0 &&
    selectedFilteredCount === filteredAppointmentIds.length;
  const someFilteredSelected =
    selectedFilteredCount > 0 && !allFilteredSelected;
  const selectAllRef = useRef<HTMLInputElement>(null);
  const tableSelectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
    if (tableSelectAllRef.current) {
      tableSelectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleAppointmentSelection = (appointmentId: number) => {
    setSelectedAppointmentIds((selected) =>
      selected.includes(appointmentId)
        ? selected.filter((id) => id !== appointmentId)
        : [...selected, appointmentId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedAppointmentIds((selected) =>
      allFilteredSelected
        ? selected.filter((id) => !filteredAppointmentIds.includes(id))
        : Array.from(new Set([...selected, ...filteredAppointmentIds]))
    );
  };

  const rangeStart =
    filteredAppointments.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(
    currentPage * PAGE_SIZE,
    filteredAppointments.length
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const updateStatus = async (
    appointmentId: number,
    nextStatus: string
  ) => {
    try {
      const currentAdmin = getCurrentUser();

      await updateAppointmentStatus(
        appointmentId,
        nextStatus,
        true,
        currentAdmin?.id
      );

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointmentId
            ? {
              ...item,
              status: nextStatus,
            }
            : item
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Appointment status changed to ${nextStatus}.`,
        confirmButtonColor: '#df7f98',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error(
        'Error updating appointment status:',
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to update appointment status.';

      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: message,
        confirmButtonColor: '#df7f98',
      });
    }
  };


  const deleteAppointment = async (
    appointmentId: number,
    customerName: string
  ) => {
    const displayCustomerName =
      customerName || 'this customer';

    const result = await Swal.fire({
      title: 'Delete Appointment?',
      text: `Move the appointment for ${displayCustomerName} to Archives? You can restore it later.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#c1433f',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while the appointment is being deleted.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await deleteAppointmentById(appointmentId);

      setAppointments((current) =>
        current.filter(
          (item) => item.id !== appointmentId
        )
      );

      await Swal.fire({
        icon: 'success',
        title: 'Moved to Archives',
        text: `Appointment for ${displayCustomerName} has been moved to Archives.`,
        confirmButtonColor: '#df7f98',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        'Error deleting appointment:',
        error
      );

      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Unable to delete the appointment. Please try again.',
        confirmButtonColor: '#df7f98',
      });
    }
  };

  const deleteSelectedAppointments = async () => {
    const selectedIds = selectedAppointmentIds.filter((id) =>
      filteredAppointmentIds.includes(id)
    );
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Delete Selected Appointments?',
      text: `Move ${selectedIds.length} appointment${selectedIds.length === 1 ? '' : 's'} to Archives? You can restore them later.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Selected',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#c1433f',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Deleting...',
      text: 'Please wait while appointments are being moved to Archives.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const results = await Promise.allSettled(
      selectedIds.map((id) => deleteAppointmentById(id))
    );
    const deletedIds = selectedIds.filter((_, index) => results[index].status === 'fulfilled');
    const failedCount = selectedIds.length - deletedIds.length;

    setAppointments((current) => current.filter((item) => !deletedIds.includes(item.id)));
    setSelectedAppointmentIds((selected) => selected.filter((id) => !deletedIds.includes(id)));

    await Swal.fire({
      icon: failedCount === 0 ? 'success' : 'warning',
      title: failedCount === 0 ? 'Moved to Archives' : 'Partial Delete',
      text: failedCount === 0
        ? `${deletedIds.length} appointment${deletedIds.length === 1 ? '' : 's'} moved to Archives.`
        : `${deletedIds.length} moved to Archives; ${failedCount} could not be deleted and remain visible.`,
      confirmButtonColor: '#df7f98',
      timer: failedCount === 0 ? 1800 : undefined,
      showConfirmButton: failedCount !== 0,
    });
  };

  // =========================================================
  // STATUS HISTORY (mini audit trail)
  // =========================================================

  const viewStatusHistory = async (appointment: Appointment) => {
    const customerLabel =
      appointment.customerName || `Customer #${appointment.customerId}`;

    Swal.fire({
      title: 'Loading history...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const entries = await getAppointmentStatusHistory(appointment.id);

      const rowsHtml =
        entries.length === 0
          ? `<p class="text-sm text-gray-500 py-4">No status changes recorded yet.</p>`
          : `
            <div class="text-left text-sm max-h-80 overflow-y-auto">
              ${entries
            .map(
              (entry) => `
                    <div class="border-b border-pink-100 py-2.5">
                      <div class="font-semibold text-[#5b3e45]">
                        ${entry.oldStatus} &rarr; ${entry.newStatus}
                      </div>
                      <div class="text-xs text-[#92737c] mt-0.5">
                        by ${entry.changedByName || 'Unknown user'}
                        &middot;
                        ${new Date(entry.changedAt).toLocaleString()}
                      </div>
                    </div>
                  `
            )
            .join('')}
            </div>
          `;

      Swal.fire({
        icon: undefined,
        title: `Status History  ${customerLabel}`,
        html: rowsHtml,
        confirmButtonText: 'Close',
        confirmButtonColor: '#df7f98',
        width: 480,
      });
    } catch (error) {
      console.error('Error fetching status history:', error);

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load',
        text: 'Unable to load status history for this appointment.',
        confirmButtonColor: '#df7f98',
      });
    }
  };

  const HistoryButton = ({ appointment }: { appointment: Appointment }) => (
    <button
      type="button"
      onClick={() => viewStatusHistory(appointment)}
      className="flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-[#fff0f4] px-2.5 py-2 text-xs font-semibold text-[#c15d78] transition hover:bg-[#ffe0e8]"
    >
      <History size={13} />
      History
    </button>
  );

  const DeleteButton = ({ appointment }: { appointment: Appointment }) => (
    <button
      type="button"
      onClick={() =>
        deleteAppointment(
          appointment.id,
          appointment.customerName || `Customer #${appointment.customerId}`
        )
      }
      className="flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-[#fee5e5] px-2.5 py-2 text-xs font-semibold text-[#c1433f] transition hover:bg-[#fdd5d5]"
    >
      <Trash2 size={13} />
      Delete
    </button>
  );

  const NextSessionButton = ({ appointment }: { appointment: Appointment }) => (
    appointment.itemType === 'Product' ? null :
    <button
      type="button"
      onClick={() => setSessionAppointment(appointment)}
      className="flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-[#eef2ff] px-2.5 py-2 text-xs font-semibold text-[#4f46e5] transition hover:bg-[#e0e7ff]"
    >
      <CalendarClock size={13} />
      Next session
      {appointment.previousAppointmentId && (
        <span className="font-normal text-[#6366f1]">
          · #{appointment.previousAppointmentId}
        </span>
      )}
    </button>
  );

  const formatAppointmentType = (
    appointmentType?: string | null
  ) => {
    if (!appointmentType) {
      return 'Online';
    }

    if (
      appointmentType.toLowerCase() === 'walkin' ||
      appointmentType.toLowerCase() === 'walk-in'
    ) {
      return 'Walk-in';
    }

    return 'Online';
  };

  const getAppointmentTypeClass = (
    appointmentType?: string | null
  ) => {
    if (
      appointmentType &&
      (
        appointmentType.toLowerCase() === 'walkin' ||
        appointmentType.toLowerCase() === 'walk-in'
      )
    ) {
      return 'bg-[#fff5df] text-[#b88a2c]';
    }

    return 'bg-[#f3e8ff] text-[#7e4ba8]';
  };

  const hasActiveFilters =
    isDashboardFilter ||
    typeFilter !== 'appointment' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setTypeFilter('appointment');
    setStatusFilter('all');

    if (isDashboardFilter) {
      setSearchParams({}, { replace: true });
    }
  };

  // A small reusable status <select>, shared by both the mobile card
  // layout and the desktop table so the two views can't drift apart.
  const StatusSelect = ({ appointment }: { appointment: Appointment }) => (
    <select
      value={appointment.status}
      onChange={(event) => updateStatus(appointment.id, event.target.value)}
      className="w-full min-w-0 rounded-lg border border-pink-100 bg-[#fffafb] px-3 py-2 text-xs outline-none transition focus:border-[#df7f98] focus:ring-1 focus:ring-[#df7f98]"
    >
      <option value="Pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
      <option value="no-show">No Show</option>
    </select>
  );


  return (
    <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
      {sessionAppointment && <div role="dialog" aria-modal="true" aria-label="Next session details" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5">
          <button type="button" onClick={() => setSessionAppointment(null)} className="mb-3 rounded-lg border px-3 py-2">Close</button>
          <NextSession key={sessionAppointment.id} appointment={sessionAppointment} onCreated={session => setAppointments(items => [...items, session])} />
        </div>
      </div>}
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="page-title">
          Admin Appointments
        </h1>

        <p className="page-subtitle">
          Review all appointment records and update status.
        </p>

        {isDashboardFilter && (
          <div className="mt-2 inline-flex rounded-full bg-[#fff0f4] px-3 py-1.5 text-xs font-semibold text-[#c15d78]">
            Showing: {dashboardFilter === 'today'
              ? 'Today’s Appointments'
              : dashboardFilter === 'upcoming'
                ? 'Upcoming Appointments'
                : dashboardFilter === 'pending'
                  ? 'Pending Appointments'
                  : dashboardFilter === 'confirmed'
                    ? 'Confirmed Appointments'
                    : dashboardFilter === 'completed'
                      ? 'Completed Appointments'
                      : dashboardFilter === 'cancelled'
                        ? 'Cancelled Appointments'
                        : 'No Show Appointments'}
          </div>
        )}
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
          {/* TYPE FILTER */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#92737c]">
              Type
            </label>

            <select
              value={effectiveTypeFilter}
              onChange={(event) => {
                setSelectedAppointmentIds([]);
                if (isDashboardFilter) {
                  setSearchParams({}, { replace: true });
                }
                setTypeFilter(event.target.value as TypeFilter);
              }}
              className="w-full rounded-lg border border-pink-100 bg-[#fffafb] px-3 py-2 text-sm outline-none transition focus:border-[#df7f98] focus:ring-1 focus:ring-[#df7f98] sm:w-auto sm:min-w-[150px]"
            >
              <option value="appointment">Appointments</option>
              <option value="walkin">Walk-ins</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#92737c]">
              Status
            </label>

            <select
              value={effectiveStatusFilter}
              onChange={(event) => {
                setSelectedAppointmentIds([]);
                if (isDashboardFilter) {
                  setSearchParams({}, { replace: true });
                }
                setStatusFilter(event.target.value as StatusFilter);
              }}
              className="w-full rounded-lg border border-pink-100 bg-[#fffafb] px-3 py-2 text-sm outline-none transition focus:border-[#df7f98] focus:ring-1 focus:ring-[#df7f98] sm:w-auto sm:min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {filteredAppointments.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-[#745d65]">
              <input ref={selectAllRef} type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} aria-label="Select all filtered appointments" className="h-4 w-4 accent-[#df7f98]" />
              Select all
            </label>
          )}
          <button type="button" onClick={deleteSelectedAppointments} disabled={selectedFilteredCount === 0} className="flex items-center gap-1.5 rounded-lg bg-[#c1433f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#a93633] disabled:cursor-not-allowed disabled:opacity-40">
            <Trash2 size={13} /> Delete Selected{selectedFilteredCount > 0 ? ` (${selectedFilteredCount})` : ''}
          </button>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-[#c15d78] transition hover:bg-[#fff0f4]">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          LOADING
      ====================================================== */}
      {loading ? (
        <div className="rounded-2xl border border-pink-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Loading appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        /* ========================================
            EMPTY STATE
        ======================================== */
        <div className="rounded-2xl border border-dashed border-pink-200 bg-[#fffafb] p-10 text-center shadow-sm">
          <p className="font-semibold text-[#5b3e45]">
            No appointments found.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================
              MOBILE / TABLET: CARD LIST (below lg)
          ======================================== */}
          <div className="flex flex-col gap-3 lg:hidden">
            {paginatedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <input type="checkbox" checked={selectedAppointmentIds.includes(appointment.id)} onChange={() => toggleAppointmentSelection(appointment.id)} aria-label={`Select appointment for ${appointment.customerName || `Customer #${appointment.customerId}`}`} className="mt-1 h-4 w-4 accent-[#df7f98]" />
                    <div className="min-w-0">
                    <p
                      className="truncate font-semibold text-[#5b3e45]"
                      title={
                        appointment.customerName ||
                        `Customer #${appointment.customerId}`
                      }
                    >
                      {appointment.customerName ||
                        `Customer #${appointment.customerId}`}
                    </p>

                    {appointment.customerEmail && (
                      <p
                        className="mt-0.5 truncate text-xs text-gray-500"
                        title={appointment.customerEmail}
                      >
                        {appointment.customerEmail}
                      </p>
                    )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getAppointmentTypeClass(
                      appointment.appointmentType
                    )}`}
                  >
                    {formatAppointmentType(appointment.appointmentType)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <p className="text-[#92737c]">Service</p>
                    <p
                      className="truncate font-medium text-[#5b3e45]"
                      title={appointment.serviceName}
                    >
                      {appointment.serviceName}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#92737c]">Area</p>
                    <p
                      className="truncate font-medium text-[#5b3e45]"
                      title={appointment.area}
                    >
                      {appointment.area}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#92737c]">Assigned Employee</p>
                    <p
                      className="truncate font-medium text-[#5b3e45]"
                      title={
                        employeeDisplayName(appointment.employeeName, appointment.employeeId)
                      }
                    >
                      {employeeDisplayName(appointment.employeeName, appointment.employeeId)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#92737c]">Date</p>
                    <p className="font-medium text-[#5b3e45]">
                      {appointment.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#92737c]">Time</p>
                    <p className="font-medium text-[#5b3e45]">
                      {appointment.time}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#92737c]">Price</p>
                    <p className="font-bold text-[#5b3e45]">
                      PHP{' '}
                      {Number(appointment.price || 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#92737c]">Status</p>
                    <span className="inline-flex rounded-full bg-[#fff5df] px-2 py-0.5 text-[11px] font-semibold uppercase text-[#b88a2c]">
                      {appointment.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusSelect appointment={appointment} />
                  <HistoryButton appointment={appointment} />
                  <NextSessionButton appointment={appointment} />
                  <DeleteButton appointment={appointment} />
                </div>
              </div>
            ))}
          </div>

          {/* ========================================
              DESKTOP: TABLE (lg and up)
          ======================================== */}
          <div className="hidden overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-[#fff4f6] text-[#5b3e45]">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold"><input ref={tableSelectAllRef} type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} aria-label="Select all filtered appointments" className="h-4 w-4 accent-[#df7f98]" /></th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Customer</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Type</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Service</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Date</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Time</th>
                    <th className="hidden whitespace-nowrap px-4 py-3 font-semibold xl:table-cell">
                      Area
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">
                      Assigned Employee
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Price</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                    <th className="min-w-[340px] whitespace-nowrap px-4 py-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-pink-100 transition hover:bg-[#fffafb]"
                    >
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedAppointmentIds.includes(appointment.id)} onChange={() => toggleAppointmentSelection(appointment.id)} aria-label={`Select appointment for ${appointment.customerName || `Customer #${appointment.customerId}`}`} className="h-4 w-4 accent-[#df7f98]" /></td>
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div
                          className="max-w-[160px] truncate font-medium text-[#5b3e45]"
                          title={
                            appointment.customerName ||
                            `Customer #${appointment.customerId}`
                          }
                        >
                          {appointment.customerName ||
                            `Customer #${appointment.customerId}`}
                        </div>

                        {appointment.customerEmail && (
                          <div
                            className="mt-0.5 max-w-[160px] truncate text-xs text-gray-500"
                            title={appointment.customerEmail}
                          >
                            {appointment.customerEmail}
                          </div>
                        )}
                      </td>

                      {/* Appointment Type */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getAppointmentTypeClass(
                            appointment.appointmentType
                          )}`}
                        >
                          {formatAppointmentType(
                            appointment.appointmentType
                          )}
                        </span>
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3">
                        <span
                          className="block max-w-[140px] truncate font-medium text-[#5b3e45]"
                          title={appointment.serviceName}
                        >
                          {appointment.serviceName}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {appointment.date}
                      </td>

                      {/* Time */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {appointment.time}
                      </td>

                      {/* Area */}
                      <td className="hidden px-4 py-3 xl:table-cell">
                        <span
                          className="block max-w-[110px] truncate"
                          title={appointment.area}
                        >
                          {appointment.area}
                        </span>
                      </td>

                      {/* Assigned Employee */}
                      <td className="px-4 py-3">
                        <span
                          className="block max-w-[140px] truncate font-medium text-[#5b3e45]"
                          title={
                            employeeDisplayName(appointment.employeeName, appointment.employeeId)
                          }
                        >
                          {employeeDisplayName(appointment.employeeName, appointment.employeeId)}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap px-4 py-3">
                        PHP{' '}
                        {Number(appointment.price || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex whitespace-nowrap rounded-full bg-[#fff5df] px-2.5 py-1 text-xs font-semibold uppercase text-[#b88a2c]">
                          {appointment.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="min-w-[340px] px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-[130px] shrink-0">
                            <StatusSelect appointment={appointment} />
                          </div>
                          <HistoryButton appointment={appointment} />
                          <NextSessionButton appointment={appointment} />
                          <DeleteButton appointment={appointment} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================
    PAGINATION
======================================== */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-[#92737c]">
                Showing {rangeStart}–{rangeEnd} of {filteredAppointments.length}
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-200 bg-white text-[#c15d78] transition hover:bg-[#fff0f4] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((page, index) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-[#92737c]">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${page === currentPage
                        ? 'bg-[#df7f98] text-white'
                        : 'border border-pink-200 bg-white text-[#745d65] hover:bg-[#fff0f4]'
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-pink-200 bg-white text-[#c15d78] transition hover:bg-[#fff0f4] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default AdminAppointments;
