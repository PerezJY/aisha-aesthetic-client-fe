import { useEffect, useState } from 'react';
import { createNextSession, getNextSessions } from '../../../api/appointments.api';
import { getServices } from '../../../api/services.api';
import { getEmployees } from '../../../api/users.api';
import type { Appointment, Employee, Service } from '../../../types';

export default function NextSession({ appointment, onCreated }: {
  appointment: Appointment; onCreated?: (session: Appointment) => void;
}) {
  const [resolvedItemType, setResolvedItemType] = useState(appointment.itemType);
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [serviceId, setServiceId] = useState(String(appointment.serviceId || ''));
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  useEffect(() => {
    let active = true;
    if (appointment.itemType === 'Product') return () => { active = false; };
    getNextSessions(appointment.id).then(data => { if (active) setSessions(data); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load next sessions.'); });
    return () => { active = false; };
  }, [appointment.id]);
  useEffect(() => {
    if (appointment.itemType) return;
    getServices().then(catalog => {
      const item = catalog.find(entry => entry.id === appointment.serviceId);
      if (item) setResolvedItemType(item.type || 'Service');
    }).catch(() => { /* Legacy appointments default to Service behavior. */ });
  }, [appointment.itemType, appointment.serviceId]);
  async function showForm() {
    setOpen(true); setLoading(true); setError(''); setSuccess('');
    try {
      const [catalog, staff] = await Promise.all([getServices(), getEmployees()]);
      setServices(catalog.filter(item => item.status === 'active'));
      setEmployees(staff.filter(item => (!item.status || item.status.toLowerCase() === 'active') &&
        item.shopArea?.trim().toLowerCase() === appointment.area.trim().toLowerCase()));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load booking options.'); }
    finally { setLoading(false); }
  }
  const eligible = ['pending', 'confirmed', 'completed'].includes(appointment.status.toLowerCase());
  const field = 'mt-1 w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm';
  if (resolvedItemType === 'Product') return null;
  return <section className="space-y-3 rounded-xl border border-pink-100 bg-[#fffafb] p-4 text-sm text-[#5b3e45]">
    <h3 className="font-semibold">Next Session / Follow-up Appointment</h3>
    {appointment.previousAppointmentId && <p>Previous appointment: #{appointment.previousAppointmentId}</p>}
    {sessions.map(session => <div key={session.id} className="rounded-lg bg-white p-3">
      <p className="font-semibold">#{session.id} · {session.serviceName}</p>
      <p>{session.date} at {session.time} · {session.status}</p>
      <p>{session.employeeName || 'Employee to be assigned'}</p>
      {session.notes && <p className="whitespace-pre-wrap">{session.notes}</p>}
    </div>)}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {success && <p role="status" className="text-green-700">{success}</p>}
    {!open && eligible && <button type="button" onClick={() => void showForm()} className="rounded-lg bg-[#df7f98] px-4 py-2 font-semibold text-white">Schedule next session</button>}
    {open && <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError('');
      try {
        const session = await createNextSession(appointment.id, { date, time, serviceId: Number(serviceId), employeeId: employeeId ? Number(employeeId) : null, notes });
        setSessions(items => [...items, session]); setOpen(false); setDate(''); setTime(''); setNotes('');
        setSuccess('Next session saved. Staff notifications created; email is queued when enabled.');
        onCreated?.(session);
      } catch (err) { setError(err instanceof Error ? err.message : 'Unable to schedule next session.'); }
      finally { setBusy(false); }
    }}>
      <p>Linked to #{appointment.id} · {appointment.serviceName} · {appointment.date}. Branch: {appointment.area}. Times are Philippine time.</p>
      <fieldset disabled={busy || loading} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label>Date<input required type="date" value={date} min={new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)} className={field} /></label>
          <label>Time<input required type="time" value={time} onChange={e => setTime(e.target.value)} className={field} /></label>
        </div>
        <label className="block">Service/product<select required value={serviceId} onChange={e => setServiceId(e.target.value)} className={field}>
          <option value="">Select service or product</option>
          {services.map(item => <option key={item.id} value={item.id}>{item.name} · ₱{item.price}</option>)}
        </select></label>
        <label className="block">Assigned employee (optional)<select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className={field}>
          <option value="">Assign later</option>
          {employees.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        <label className="block">Notes/instructions<textarea maxLength={5000} value={notes} onChange={e => setNotes(e.target.value)} className={field} rows={3} /></label>
        <button className="rounded-lg bg-[#df7f98] px-4 py-2 font-semibold text-white" type="submit">{busy ? 'Saving…' : loading ? 'Loading…' : 'Save next session'}</button>
      </fieldset>
      <button type="button" disabled={busy} onClick={() => setOpen(false)} className="px-3 py-2">Cancel</button>
    </form>}
  </section>;
}
