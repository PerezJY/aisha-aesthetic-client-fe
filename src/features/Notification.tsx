import { useState } from 'react';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { clearCurrentUser, getCurrentUser } from '../utils/auth';

export default function Notification() {
  const { notifications, unreadCount, loading, error, refresh, markRead } = useNotifications();
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const isCustomer = getCurrentUser()?.role === 'customer';
  const customerMessage = (message: string) => {
    const safeMessage = message
      .replace(/\s*Follow-up to appointment\s*#\d+\.?/gi, '')
      .replace(/\s*(?:Instructions|A note from your specialist|Message|Note):[\s\S]*$/i, '')
      .trim();
    return /follow-up from your previous visit\.?$/i.test(safeMessage)
      ? safeMessage
      : `${safeMessage.replace(/[.\s]+$/, '')}. This is a follow-up from your previous visit.`;
  };
  async function read(id?: number) {
    setSaving(true);
    setActionError('');
    try { await markRead(id); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to mark notifications as read.'); }
    finally { setSaving(false); }
  }
  return <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0"><h1 className="page-title">Notifications</h1><p className="page-subtitle">Your booking updates and appointment reminders.</p></div>
      <div className="flex w-full flex-wrap gap-x-4 gap-y-2 sm:w-auto sm:justify-end">
        <button onClick={() => void refresh()} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#d77992]"><RefreshCw size={17} />Refresh</button>
        <button disabled={saving || !unreadCount || !!error} onClick={() => void read()} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#d77992] disabled:opacity-40"><CheckCheck size={17} />Mark all as read</button>
      </div>
    </div>
    {(error || actionError) && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error || actionError} {error.includes('sign in') && <Link to="/signin" onClick={clearCurrentUser} className="underline">Sign in again</Link>}
    </div>}
    {loading ? <p role="status" className="text-[#80656d]">Loading notifications…</p> : !error && notifications.length === 0 ?
      <div className="pink-card text-center text-[#80656d]"><Bell className="mx-auto mb-3" />No notifications yet. Booking updates will appear here.</div> : null}
    <div className="space-y-3">
      {notifications.map(notification => <article key={notification.id} className={`flex gap-3 rounded-2xl border p-4 shadow-sm sm:gap-4 sm:p-5 ${!notification.readAt ? 'border-pink-200 bg-[#fffafb]' : 'border-pink-100 bg-white'}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff2df] text-[#c18c2d]"><Bell size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1"><h2 className="min-w-0 flex-1 break-words font-semibold text-[#4b343b]">{notification.title}</h2>{!notification.readAt && <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#d77992]">Unread</span>}</div>
          <p className="mt-2 min-w-0 break-words [overflow-wrap:anywhere] text-sm leading-6 text-[#80656d]">{isCustomer && notification.kind === 'next-session' ? customerMessage(notification.message) : notification.message}</p>
          <time dateTime={notification.createdAt} className="mt-3 block break-words text-xs text-[#aa9198]">{new Date(notification.createdAt).toLocaleString()}</time>
          {!notification.readAt && <button disabled={saving} onClick={() => void read(notification.id)} className="mt-3 text-sm font-semibold text-[#d77992] hover:underline disabled:opacity-40">Mark as read</button>}
        </div>
      </article>)}
    </div>
  </div>;
}
