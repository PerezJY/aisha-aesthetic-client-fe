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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="page-title">Appointment History</h1>
        <p className="page-subtitle">Your past appointments, including completed, cancelled, and no-show bookings.</p>
      </div>
      <button disabled={loading} onClick={() => { setLoading(true); setRefreshKey(key => key + 1); }} className="flex items-center gap-2 text-sm font-semibold text-[#d77992] disabled:opacity-50"><RefreshCw size={17} />Refresh</button>
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
        return <article key={item.id} className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-[#4b343b]">{item.serviceName}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#80656d]"><CalendarDays size={15} />{item.date || 'Date not recorded'}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#80656d]"><Clock3 size={15} />{item.time || 'Time not recorded'}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#80656d]"><MapPin size={15} />{item.area || 'Branch not recorded'}</p>
              {item.employeeName && <p className="mt-2 text-sm text-[#80656d]">Employee: {item.employeeName}</p>}
            </div>
            <span className="shrink-0 text-sm font-bold text-[#c18c2d]">{item.price != null && Number.isFinite(price) ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price) : 'Price unavailable'}</span>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-pink-100 pt-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>{status || 'Status not recorded'}</span>
            <span className="text-xs text-[#92737c]">Booking #{item.id}</span>
          </div>
          {item.previousAppointmentId && <p className="mt-3 text-sm text-[#80656d]">Follow-up to appointment #{item.previousAppointmentId}</p>}
          {status === 'completed' && <p className="mt-3 text-sm text-[#80656d]">Your follow-up will be arranged by our staff. You’ll receive a notification and email when it is scheduled.</p>}
        </article>;
      })}
    </div>}
  </div>;
}
