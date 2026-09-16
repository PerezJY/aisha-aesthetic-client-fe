import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCustomerAppointments } from '../api/appointments.api';
import { getCurrentUser } from '../utils/auth';
import { customerHistory } from '../utils/appointmentHistory';
import type { Appointment } from '../types';

const statusStyles: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  'no-show': 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
};

export default function History() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now);
  const customerId = getCurrentUser()?.id;

  useEffect(() => {
    let active = true;
    let request = 0;
    async function load() {
      const version = ++request;
      try {
        if (!customerId) throw new Error('Please sign in to view your appointment history.');
        const rows = await getCustomerAppointments(customerId);
        if (!active || version !== request) return;
        setAppointments(rows);
        setError('');
        setNow(Date.now());
      } catch (reason) {
        if (!active || version !== request) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load appointment history.');
      } finally {
        if (active && version === request) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [customerId, refreshKey]);

  const history = customerId ? customerHistory(appointments, customerId, now) : [];
  return <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="page-title">Appointment History</h1>
        <p className="page-subtitle">Your past appointments, including completed, cancelled, and no-show bookings.</p>
      </div>
      <button disabled={loading} aria-busy={loading} aria-label={loading ? 'Refreshing appointment history' : 'Refresh appointment history'} onClick={() => { setLoading(true); setRefreshKey(key => key + 1); }} className="inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#d77992] transition hover:bg-[#fff4f7] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:border-0 sm:bg-transparent sm:px-0 sm:py-1"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Refresh</button>
    </div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error} Use Refresh to try again.</p>}
    {loading ? <p role="status" className="text-[#92737c]">Loading appointment history…</p> : !error && history.length === 0 ?
      <div className="pink-card text-center text-[#80656d]">
        <CalendarDays className="mx-auto mb-3" />
        <p>No appointment history yet.</p>
        <Link to="/appointments" className="mt-3 inline-block font-semibold text-[#d77992] hover:underline">View upcoming appointments</Link>
      </div> : null}
    {!loading && !error && <div className="grid gap-4 lg:grid-cols-2">
      {history.map(item => {
        const status = item.status.trim().toLowerCase();
        const price = Number(item.price);
        return <article key={item.id} className="min-w-0 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-bold text-[#4b343b]">{item.serviceName}</h2>
              <p className="mt-2 flex min-w-0 items-start gap-2 break-words text-sm text-[#80656d]"><CalendarDays size={15} className="mt-0.5 shrink-0" />{item.date || 'Date not recorded'}</p>
              <p className="mt-2 flex min-w-0 items-start gap-2 break-words text-sm text-[#80656d]"><Clock3 size={15} className="mt-0.5 shrink-0" />{item.time || 'Time not recorded'}</p>
              <p className="mt-2 flex min-w-0 items-start gap-2 break-words text-sm text-[#80656d]"><MapPin size={15} className="mt-0.5 shrink-0" />{item.area || 'Branch not recorded'}</p>
              {item.employeeName && <p className="mt-2 break-words text-sm text-[#80656d]">Employee: {item.employeeName}</p>}
            </div>
            <span className="max-w-[42%] shrink-0 break-words text-right text-sm font-bold text-[#c18c2d]">{item.price != null && Number.isFinite(price) ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price) : 'Price unavailable'}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-pink-100 pt-4">
            <span className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>{status || 'Status not recorded'}</span>
            <span className="shrink-0 whitespace-nowrap text-xs text-[#92737c]">Booking #{item.id}</span>
          </div>
          {item.previousAppointmentId && <p className="mt-3 text-sm text-[#80656d]">Follow-up from your previous visit</p>}
          {status === 'completed' && <p className="mt-3 text-sm text-[#80656d]">Your follow-up will be arranged by our staff. You’ll receive a notification and email when it is scheduled.</p>}
        </article>;
      })}
    </div>}
  </div>;
}
