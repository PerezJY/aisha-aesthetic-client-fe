import { useState } from 'react';
import { Alert, Button, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { saveBackupSchedule, type BackupFrequency, type BackupSchedule, type BackupStatus } from '../../../api/backups.api';

export default function BackupScheduleSettings({ status, onSaved }: {
  status: BackupStatus; onSaved: (settings: BackupSchedule) => void;
}) {
  const [draft, setDraft] = useState<BackupSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const settings = draft ?? { enabled: status.enabled, frequency: status.frequency ?? 'daily' };
  const change = (patch: Partial<BackupSchedule>) => {
    setDraft({ ...settings, ...patch }); setSuccess(''); setError('');
  };
  return <section className="rounded-3xl border border-[#efe3e7] bg-white p-5 sm:p-6" aria-labelledby="schedule-settings-title">
    <h2 id="schedule-settings-title" className="text-lg font-semibold">Automatic backup settings</h2>
    <p className="mt-1 text-sm text-[#876f77]">Choose how often your database is saved automatically.</p>
    <form className="mt-4 space-y-4" onSubmit={async event => {
      event.preventDefault(); setSaving(true); setError(''); setSuccess('');
      try {
        const saved = await saveBackupSchedule(settings);
        onSaved(saved); setDraft(null);
        setSuccess(saved.enabled ? 'Schedule saved. The server will check it within one minute.' : 'Automatic backups turned off. You can still create a manual backup.');
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save schedule.'); }
      finally { setSaving(false); }
    }}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <FormControlLabel control={<Switch checked={settings.enabled} disabled={saving} onChange={event => change({ enabled: event.target.checked })} />} label="Enable automatic backups" />
      <div className="flex flex-wrap items-start gap-4">
        <TextField select label="Backup frequency" value={settings.frequency} disabled={saving} onChange={event => change({ frequency: event.target.value as BackupFrequency })} sx={{ minWidth: 220 }}>
          <MenuItem value="daily">Daily — every day</MenuItem>
          <MenuItem value="weekly">Weekly — every week</MenuItem>
          <MenuItem value="monthly">Monthly — every month</MenuItem>
          <MenuItem value="yearly">Yearly — every year</MenuItem>
        </TextField>
        <Button type="submit" variant="contained" disabled={saving || !draft} sx={{ py: 1.8 }}>{saving ? 'Saving…' : 'Save schedule'}</Button>
      </div>
      {!status.frequency && <p className="text-xs text-[#876f77]">Current server setting: every {status.intervalHours} hours. Choose a frequency to replace it.</p>}
      <p className="text-xs leading-relaxed text-[#876f77]">The next backup is calculated from the last automatic backup. Monthly and yearly schedules use Philippine calendar dates, moving to the last day when a month is shorter. If there is no automatic backup, or one is overdue, it runs on the next server check. The server must be running; missed backups run after restart. Manual backups do not change the schedule.</p>
    </form>
  </section>;
}
