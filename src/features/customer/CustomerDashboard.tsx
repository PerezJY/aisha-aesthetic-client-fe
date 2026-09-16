import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Chip, Skeleton, ThemeProvider, createTheme } from '@mui/material';
import { ArrowRight, Bell, CalendarDays, Check, Clock3, Heart, History, MapPin, Plus, RefreshCw, Sparkles, UserRound } from 'lucide-react';
import { getCustomerAppointments } from '../../api/appointments.api';
import type { Appointment } from '../../types';
import { getCurrentUser } from '../../utils/auth';
import { useNotifications } from '../../hooks/useNotifications';
import { customerOverview } from '../../utils/customerOverview';
import { employeeDisplayName } from '../../utils/employeeDisplay';

const theme = createTheme({ palette: { primary: { main: '#ad5871' } }, typography: { fontFamily: 'Poppins, sans-serif', button: { textTransform: 'none', fontWeight: 600 } }, shape: { borderRadius: 12 } });
const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fff4de', color: '#a37d35' }, confirmed: { bg: '#eaf4ed', color: '#5c8768' },
  completed: { bg: '#eef3f9', color: '#6885a4' }, cancelled: { bg: '#fbecef', color: '#b3697d' }, 'no-show': { bg: '#f2edf7', color: '#9477ad' },
};
function StatusChip({ status }: { status: string }) {
  const key = status.trim().toLowerCase();
  const colors = statusColors[key] || { bg: '#f4f0f2', color: '#967f87' };
  return <Chip size="small" label={key} sx={{ bgcolor: colors.bg, color: colors.color, fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }} />;
}
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const customerId = currentUser?.id;
  const { notifications, unreadCount, error: notificationError, loading: notificationsLoading } = useNotifications();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!customerId) { navigate('/signin'); return; }
    let active = true;
    let request = 0;
    async function load() {
      const version = ++request;
      try {
        const data = await getCustomerAppointments(customerId!);
        if (active && version === request) { setAppointments(data); setError(''); setNow(Date.now()); }
      } catch (reason) { if (active && version === request) setError(reason instanceof Error ? reason.message : 'Unable to load your appointments.'); }
      finally { if (active && version === request) setLoading(false); }
    }
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    window.addEventListener('focus', load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', load); };
  }, [customerId, navigate, refreshKey]);
  const { upcoming, completed, followups, recent } = customerOverview(appointments, customerId || 0, now);
  const next = upcoming[0];
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || 'there';
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now); date.setDate(1); date.setMonth(date.getMonth() - 5 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { label: date.toLocaleDateString(undefined, { month: 'short' }), count: completed.filter(a => a.date.startsWith(key)).length };
  });
  const maxVisits = Math.max(1, ...months.map(m => m.count));
  return <ThemeProvider theme={theme}><div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8 space-y-6 text-[#49343a]">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ae7284]">Your personal beauty space</p><h1 className="page-title">Hello, {firstName}<span className="text-[#c78498]">.</span></h1><p className="page-subtitle">A little time for yourself. Everything you need, right here.</p></div><Button component={Link} to="/booking" variant="contained" startIcon={<Plus size={18} />} sx={{ px: 2.5, py: 1.4 }}>Book an appointment</Button></header>
    {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => { setLoading(true); setRefreshKey(key => key + 1); }}>Retry</Button>}>{error}</Alert>}
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <section className="relative overflow-hidden rounded-3xl border border-[#efdde3] bg-gradient-to-br from-[#ffedf3] via-[#fff6f8] to-[#fffaf2] p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-12 h-56 w-56 rounded-full border-[30px] border-white/55" />
        <div className="relative"><div className="mb-6 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-medium text-[#b07488]"><CalendarDays size={17} />Your next appointment</span>{next && !loading && !error && <StatusChip status={next.status} />}</div>
          {loading ? <div className="space-y-3"><Skeleton width="65%" height={40} /><Skeleton width="80%" /><Skeleton height={70} /></div> : error ? <><h2 className="text-2xl font-semibold">Let's reconnect.</h2><p className="mt-3 text-sm text-[#967f87]">Retry above to see your latest schedule.</p></> : next ? <>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{next.serviceName}</h2><p className="mt-2 text-sm text-[#967f87]">{next.previousAppointmentId ? `Your follow-up to appointment #${next.previousAppointmentId}` : 'Your next moment of self-care is on the calendar.'}</p>
            <div className="my-5 flex flex-wrap gap-x-6 gap-y-3 text-sm"><span className="flex items-center gap-2"><CalendarDays size={16} className="text-[#b8778d]" />{formatDate(next.date)}</span><span className="flex items-center gap-2"><Clock3 size={16} className="text-[#b8778d]" />{next.time}</span></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#967f87]"><span className="flex items-center gap-1.5"><MapPin size={14} />{next.area}</span><span className="flex items-center gap-1.5"><UserRound size={14} />{employeeDisplayName(next.employeeName, next.employeeId, false)}</span></div>
            {next.notes && <p className="mt-4 rounded-xl bg-white/60 p-3 text-xs leading-relaxed text-[#876f77]">{next.notes}</p>}
            <Button component={Link} to="/appointments" endIcon={<ArrowRight size={16} />} sx={{ mt: 3, px: 0 }}>View appointment details</Button>
          </> : <><h2 className="max-w-sm text-2xl font-semibold sm:text-3xl">Make room for a little self-care.</h2><p className="mt-3 max-w-md text-sm leading-relaxed text-[#967f87]">No upcoming appointments yet. Explore our services and choose a time that works for you.</p><Button component={Link} to="/booking" endIcon={<ArrowRight size={16} />} sx={{ mt: 3, px: 0 }}>Find your next treatment</Button></>}
        </div>
      </section>
      <section className="flex flex-col justify-between rounded-3xl border border-[#efe3e7] bg-white p-6 sm:p-7"><div><span className="mb-4 inline-flex rounded-2xl bg-[#fff4e5] p-3 text-[#be995a]"><Sparkles size={23} /></span><h2 className="text-lg font-semibold">Keep your care going.</h2><p className="mt-3 text-sm leading-relaxed text-[#967f87]">Our team will arrange your next session after your service is completed.</p></div><div className="mt-5"><p className="flex items-start gap-2 text-xs leading-relaxed text-[#967f87]"><Check size={14} className="mt-0.5 shrink-0 text-[#81a28b]" />You’ll receive a notification and email when your follow-up is scheduled.</p></div></section>
    </div>
    <section aria-label="Your appointment overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Upcoming appointments', count: upcoming.length, icon: CalendarDays, color: '#b8778d', bg: '#fff0f4', link: '/appointments' },
        { label: 'Completed visits', count: completed.length, icon: Heart, color: '#7e9b86', bg: '#eff5f0', link: '/history' },
        { label: 'Upcoming follow-ups', count: followups.length, icon: RefreshCw, color: '#ab8dba', bg: '#f5eff8', link: '/appointments' },
        { label: 'Unread notifications', count: unreadCount, icon: Bell, color: '#b99a64', bg: '#fff6e9', link: '/notifications' },
      ].map(item => <Link key={item.label} to={item.link} className="rounded-2xl border border-[#efe3e7] bg-white p-4 transition hover:border-[#d8acba] sm:p-5"><div className="mb-4 flex items-center justify-between"><span className="rounded-xl p-2" style={{ color: item.color, background: item.bg }}><item.icon size={18} /></span><ArrowRight size={14} className="text-[#ccb4bc]" /></div><p className="text-3xl font-semibold">{(item.link === '/notifications' ? notificationsLoading : loading) ? <Skeleton width={40} /> : (item.link === '/notifications' ? notificationError : error) ? '—' : item.count.toString().padStart(2, '0')}</p><p className="mt-2 text-xs text-[#967f87]">{item.label}</p></Link>)}
    </section>
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <section className="overflow-hidden rounded-3xl border border-[#efe3e7] bg-white"><div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6"><div><h2 className="text-lg font-semibold">Your appointments</h2><p className="mt-1 text-xs text-[#967f87]">A quick look at your recent bookings.</p></div><Button component={Link} to="/appointments" size="small">View all</Button></div>
        {loading ? <div className="space-y-3 p-6">{[1, 2, 3].map(i => <Skeleton key={i} height={60} variant="rounded" />)}</div> : error ? <p className="p-6 text-sm text-[#967f87]">Your bookings are temporarily unavailable.</p> : !recent.length ? <div className="p-8 text-center"><CalendarDays className="mx-auto mb-3 text-[#c48a9c]" /><p className="text-sm text-[#967f87]">Your bookings will appear here.</p><Button component={Link} to="/booking" sx={{ mt: 1 }}>Explore services</Button></div> : <div className="divide-y divide-[#f5edf0]">{recent.slice(0, 4).map(appointment => <div key={appointment.id} className="flex flex-wrap items-center gap-3 px-6 py-4"><span className="rounded-xl bg-[#fff4f7] p-3 text-[#bf8498]"><CalendarDays size={18} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{appointment.serviceName}</p><p className="mt-1 text-[11px] leading-relaxed text-[#967f87]">{formatDate(appointment.date)} · {appointment.time}</p>{appointment.previousAppointmentId && <p className="mt-1 text-[10px] text-[#b07488]">Follow-up session</p>}</div><StatusChip status={appointment.status} /></div>)}</div>}
        <Link to="/history" className="flex items-center gap-2 border-t border-[#f5edf0] bg-[#fffafb] px-6 py-4 text-xs font-medium text-[#ae6e83]"><History size={15} />View your service history<ArrowRight size={14} className="ml-auto" /></Link>
      </section>
      <section className="rounded-3xl border border-[#efe3e7] bg-white p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Latest updates</h2><Bell size={18} className="text-[#c397a6]" /></div>
        {notificationError ? <Alert severity="error">{notificationError}</Alert> : notificationsLoading ? <Skeleton height={120} /> : !notifications.length ? <div className="py-7 text-center"><span className="mb-3 inline-flex rounded-2xl bg-[#fff5e9] p-3 text-[#b99a64]"><Bell size={23} /></span><p className="text-sm text-[#967f87]">You're all caught up.</p><p className="mt-2 text-xs text-[#ad949d]">Booking updates and reminders will appear here.</p></div> : <div className="space-y-4">{notifications.slice(0, 3).map(notification => <div key={notification.id} className="flex items-start gap-3"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${notification.readAt ? 'bg-[#ded1d7]' : 'bg-[#c18096]'}`} /><div><p className="text-xs font-semibold">{notification.title}</p><p className="mt-1 text-xs leading-relaxed text-[#967f87]">{notification.message}</p></div></div>)}</div>}
        <Button component={Link} to="/notifications" endIcon={<ArrowRight size={15} />} sx={{ mt: 3, px: 0 }}>All notifications</Button>
      </section>
    </div>
    <section className="rounded-3xl border border-[#efe3e7] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Your visits, over time</h2><p className="mt-1 text-xs text-[#967f87]">Completed visits in the last six months.</p></div><span className="rounded-full bg-[#fff2f6] px-3 py-1 text-xs font-medium text-[#b07488]">{error ? 'Unavailable' : `${months.reduce((sum, month) => sum + month.count, 0)} visits`}</span></div>
      {loading ? <Skeleton variant="rounded" height={140} sx={{ mt: 3 }} /> : error ? <p className="py-8 text-sm text-[#967f87]">Visit history is temporarily unavailable.</p> : <div className="mt-6 flex h-36 items-end gap-3 sm:gap-8" role="img" aria-label={months.map(m => `${m.label}: ${m.count} completed visits`).join(', ')}>{months.map(month => <div key={month.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-[#ad949d]">{month.count}</span><div className="w-full max-w-20 rounded-t-lg bg-gradient-to-t from-[#d99aae] to-[#f4d5df]" style={{ height: `${month.count ? Math.max(12, month.count / maxVisits * 85) : 3}px` }} /><span className="text-[11px] text-[#967f87]">{month.label}</span></div>)}</div>}
    </section>
  </div></ThemeProvider>;
}
