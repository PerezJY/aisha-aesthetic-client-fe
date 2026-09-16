import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Chip, CircularProgress, InputAdornment, LinearProgress, Skeleton, TablePagination, TextField, ThemeProvider, createTheme } from '@mui/material';
import { Archive, ArrowDownToLine, CalendarClock, Check, ChevronDown, Clock3, Database, FileArchive, HardDrive, Info, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { createBackup, downloadBackup, getBackups } from '../../api/backups.api';
import type { BackupStatus } from '../../api/backups.api';

const theme = createTheme({
  palette: { primary: { main: '#ad5871' }, text: { primary: '#49343a', secondary: '#876f77' } },
  typography: { fontFamily: 'Poppins, sans-serif', button: { textTransform: 'none', fontWeight: 600 } },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { padding: '10px 18px' } } },
    MuiChip: { styleOverrides: { root: { fontSize: 11, fontWeight: 600 } } },
  },
});
const dateLabel = (value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const timeLabel = (value: string) => new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
const sizeLabel = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
type Filter = 'all' | 'automatic' | 'manual';

export default function DatabaseBackupsPage() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const refreshVersion = useRef({ version: 0 });

  const refresh = useCallback(async () => {
    const version = ++refreshVersion.current.version;
    setRefreshing(true);
    try {
      const data = await getBackups();
      if (version === refreshVersion.current.version) { setStatus(data); setError(''); }
    } catch (reason) {
      if (version === refreshVersion.current.version) setError(reason instanceof Error ? reason.message : 'Unable to load backups.');
    } finally {
      if (version === refreshVersion.current.version) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    const requests = refreshVersion.current;
    queueMicrotask(() => void refresh());
    const timer = setInterval(() => void refresh(), 30000);
    return () => { clearInterval(timer); requests.version++; };
  }, [refresh]);

  async function handleCreate() {
    setCreating(true); setError(''); setSuccess('');
    try {
      await createBackup();
      setSuccess('Your backup is ready. Download a copy to keep it somewhere safe.');
      setFilter('all'); setSearch(''); setPage(0);
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create backup.'); }
    finally { setCreating(false); }
  }

  async function handleDownload(name: string) {
    setDownloading(name); setError('');
    try { await downloadBackup(name); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to download backup.'); }
    finally { setDownloading(null); }
  }

  const backups = [...(status?.backups || [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latest = backups[0];
  const totalSize = backups.reduce((total, backup) => total + backup.size, 0);
  const filtered = backups.filter(backup => (filter === 'all' || backup.kind === filter) &&
    `${backup.name} ${backup.kind} ${dateLabel(backup.createdAt)}`.toLowerCase().includes(search.trim().toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1));
  const busy = creating || !!status?.busy;
  const statusLabel = !status ? 'Status unavailable' : busy ? 'Backup in progress' : status.lastError ? 'Needs attention' : status.enabled ? 'Automatic backups on' : 'Automatic backups off';

  return <ThemeProvider theme={theme}>
    <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8 space-y-6 text-[#49343a]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ae7284]">Data & recovery</p>
          <h1 className="page-title">Database Backups</h1>
          <p className="page-subtitle">Keeping your data safe and protected</p>
        </div>
        <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Plus size={18} />}
          onClick={() => void handleCreate()} disabled={loading || busy || !status} sx={{ mt: { xs: 0, sm: 2 }, px: 2.5, py: 1.4 }}>
          {busy ? 'Creating backup…' : 'Create backup'}
        </Button>
      </header>

      {error && <Alert severity="error" onClose={() => setError('')} action={<Button color="inherit" size="small" disabled={refreshing} onClick={() => void refresh()}>Retry</Button>}>{error}</Alert>}
      {success && <Alert severity="success" role="status" onClose={() => setSuccess('')}>{success}</Alert>}
      {status?.lastError && <Alert severity="warning">{status.lastError}</Alert>}

      <section aria-label="Backup overview" className="relative overflow-hidden rounded-3xl border border-[#efdde3] bg-gradient-to-br from-[#fff0f4] via-[#fff8f9] to-[#fffaf2]">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/55" aria-hidden="true" />
        <div className="relative grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/80 text-[#b2687e] shadow-sm"><ShieldCheck size={25} aria-hidden="true" /></div>
            <div className="min-w-0">
              {loading ? <Skeleton width={160} /> : <span className={`inline-flex items-center gap-2 text-xs font-semibold ${status?.lastError ? 'text-amber-700' : status?.enabled ? 'text-[#52765f]' : 'text-[#876f77]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status?.lastError ? 'bg-amber-500' : status?.enabled ? 'bg-[#6e967c]' : 'bg-[#ad929b]'}`} />{statusLabel}
              </span>}
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Recovery starts with a saved copy.</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#876f77]">Your data stays safe with regular backups</p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#876f77]">
                <Clock3 size={14} aria-hidden="true" /><span>Latest backup</span>
                {loading ? <Skeleton width={130} /> : <span className="font-medium text-[#60434e]">{latest ? `${dateLabel(latest.createdAt)} · ${timeLabel(latest.createdAt)}` : status ? 'No backups yet' : 'Unavailable'}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            <div className="rounded-2xl border border-white bg-white/75 p-5">
              <Archive size={19} className="mb-4 text-[#b47a8b]" aria-hidden="true" />
              <p className="text-3xl font-semibold tracking-tight">{loading ? <Skeleton width={45} /> : status ? backups.length.toString().padStart(2, '0') : '—'}</p>
              <p className="mt-1 text-xs text-[#876f77]">Saved backups</p>
            </div>
            <div className="rounded-2xl border border-white bg-white/75 p-5">
              <HardDrive size={19} className="mb-4 text-[#b47a8b]" aria-hidden="true" />
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{loading ? <Skeleton width={90} /> : status ? sizeLabel(totalSize) : '—'}</p>
              <p className="mt-1 text-xs text-[#876f77]">Backup storage used</p>
            </div>
          </div>
        </div>
        {busy && <LinearProgress aria-label="Creating database backup" />}
      </section>

      <section aria-label="Backup schedule" className="grid gap-4 md:grid-cols-3">
        {[
          { icon: <RefreshCw size={18} />, label: 'Automatic schedule', value: status ? status.enabled ? `Every ${status.intervalHours} hours` : 'Turned off' : 'Unavailable', note: 'Runs while your server is online.' },
          { icon: <CalendarClock size={18} />, label: 'Next scheduled backup', value: status ? !status.enabled ? 'Not scheduled' : status.nextBackupAt ? `${dateLabel(status.nextBackupAt)} · ${timeLabel(status.nextBackupAt)}` : 'Due now' : 'Unavailable', note: 'Missed runs catch up when the server starts.' },
          { icon: <Archive size={18} />, label: 'Retention policy', value: status ? `${status.retentionCount} copies per type` : 'Unavailable', note: 'Manual and automatic copies are kept separately.' },
        ].map(item => <div key={item.label} className="rounded-2xl border border-[#efe3e7] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#967782]"><span className="text-[#b77a8d]">{item.icon}</span>{item.label}</div>
          <p className="text-sm font-semibold">{loading ? <Skeleton width="70%" /> : item.value}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#967f87]">{item.note}</p>
        </div>)}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#efe3e7] bg-white shadow-[0_4px_24px_-16px_rgba(85,44,59,0.2)]" aria-labelledby="backup-history-title">
        <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-6 sm:px-6">
          <div><h2 id="backup-history-title" className="text-lg font-semibold">Backup history</h2><p className="mt-1 text-xs text-[#967f87]">Your saved recovery copies, newest first.</p></div>
          <Button size="small" onClick={() => void refresh()} disabled={refreshing} startIcon={<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />}>
            {refreshing ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 pb-5 sm:px-6">
          <div role="group" aria-label="Filter backup type" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#f8f3f5] p-1">
            {(['all', 'automatic', 'manual'] as const).map(type => <button key={type} type="button" style={{ fontSize: 12 }} aria-pressed={filter === type} onClick={() => { setFilter(type); setPage(0); }}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad5871] ${filter === type ? 'bg-white text-[#a6536c] shadow-sm' : 'text-[#967f87] hover:text-[#60434e]'}`}>
              {type === 'all' ? 'All backups' : type === 'automatic' ? 'Automatic' : 'Manual'}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${filter === type ? 'bg-[#fff0f4]' : 'bg-[#eee7ea]'}`}>{type === 'all' ? backups.length : backups.filter(b => b.kind === type).length}</span>
            </button>)}
          </div>
          <TextField size="small" placeholder="Search backups…" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }}
            slotProps={{ htmlInput: { 'aria-label': 'Search backups by filename, type, or date' }, input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
            sx={{ width: { xs: '100%', sm: 240 }, '& .MuiInputBase-root': { fontSize: 12 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#eadfe3' } }} />
        </div>
        {loading ? <div role="status" aria-label="Loading backups" className="space-y-3 px-6 pb-6">{[1, 2, 3].map(row => <Skeleton key={row} variant="rounded" height={66} />)}</div> : !status || filtered.length === 0 ?
          <div className="border-t border-[#f3e9ed] px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff3f6] text-[#b77a8d]">{search || filter !== 'all' ? <Search size={25} /> : <Database size={25} />}</div>
            <h3 className="font-semibold">{!status ? 'Unable to load backups' : backups.length ? 'No matching backups' : 'Your first backup starts here'}</h3>
            <p className="mx-auto mb-4 mt-2 max-w-sm text-sm leading-relaxed text-[#967f87]">{!status ? 'Refresh the list to try again.' : backups.length ? 'Try a different search or show all backup types.' : 'Save a snapshot of your database so you have a recovery copy ready.'}</p>
            {!status ? <Button onClick={() => void refresh()} disabled={refreshing}>Try again</Button> : backups.length ? <Button onClick={() => { setSearch(''); setFilter('all'); setPage(0); }}>Clear filters</Button> : <Button variant="outlined" startIcon={<Plus size={16} />} disabled={busy} onClick={() => void handleCreate()}>Create first backup</Button>}
          </div> : <>
            <div className="divide-y divide-[#f0e6ea] border-t border-[#f0e6ea] sm:hidden">
              {filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage).map(backup => <article key={backup.name} className="space-y-3 px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold"><FileArchive size={17} className="text-[#b8778d]" />{dateLabel(backup.createdAt)}</span>
                  <Chip size="small" label={backup.kind === 'automatic' ? 'Automatic' : 'Manual'} sx={{ bgcolor: '#f8f0f3', color: '#a56b80' }} />
                </div>
                <p className="break-all text-[10px] text-[#967f87]">{backup.name}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-[#876f77]">{timeLabel(backup.createdAt)} · {sizeLabel(backup.size)}</p>
                  <Button size="small" variant="outlined" disabled={!!downloading} onClick={() => void handleDownload(backup.name)}
                    aria-label={`Download ${backup.kind} backup from ${dateLabel(backup.createdAt)} at ${timeLabel(backup.createdAt)}`}
                    startIcon={downloading === backup.name ? <CircularProgress size={14} color="inherit" /> : <ArrowDownToLine size={14} />}
                    sx={{ fontSize: 11, py: 0.5, px: 1.2, borderColor: '#ebd9e0' }}>{downloading === backup.name ? 'Downloading…' : 'Download'}</Button>
                </div>
              </article>)}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-y border-[#f0e6ea] bg-[#fdfafb] text-[10px] uppercase tracking-wider text-[#987d87]"><tr>
                  <th scope="col" className="px-6 py-3 font-medium">Backup file</th><th scope="col" className="px-4 py-3 font-medium">Created</th><th scope="col" className="px-4 py-3 font-medium">Type</th><th scope="col" className="px-4 py-3 font-medium">Size</th><th scope="col" className="px-6 py-3 text-right font-medium">Action</th>
                </tr></thead>
                <tbody>{filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage).map(backup => <tr key={backup.name} className="border-b border-[#f5edf0] transition-colors last:border-0 hover:bg-[#fffafb]">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f0e1e6] bg-[#fff6f8] text-[#b8778d]"><FileArchive size={19} /></div><div className="min-w-0">
                    <div className="flex items-center gap-2"><p className="whitespace-nowrap text-xs font-semibold">Database snapshot</p>{backup.name === latest?.name && <span className="rounded bg-[#eef5f0] px-1.5 py-0.5 text-[9px] font-medium text-[#5f8069]">Latest</span>}</div>
                    <p title={backup.name} className="mt-1 max-w-[210px] truncate text-[10px] text-[#a18b93]">{backup.name}</p>
                  </div></div></td>
                  <td className="whitespace-nowrap px-4 py-4"><p className="text-xs font-medium">{dateLabel(backup.createdAt)}</p><p className="mt-1 text-[11px] text-[#a18b93]">{timeLabel(backup.createdAt)}</p></td>
                  <td className="px-4 py-4"><Chip size="small" label={backup.kind === 'automatic' ? 'Automatic' : 'Manual'} sx={backup.kind === 'automatic' ? { bgcolor: '#f4edf8', color: '#9172a3' } : { bgcolor: '#fdf2e8', color: '#ae875b' }} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-[#876f77]">{sizeLabel(backup.size)}</td>
                  <td className="px-6 py-4 text-right"><Button size="small" variant="outlined" onClick={() => void handleDownload(backup.name)} disabled={!!downloading}
                    aria-label={`Download ${backup.kind} backup from ${dateLabel(backup.createdAt)} at ${timeLabel(backup.createdAt)}`}
                    startIcon={downloading === backup.name ? <CircularProgress size={14} color="inherit" /> : <ArrowDownToLine size={15} />} sx={{ fontSize: 11, borderColor: '#ebd9e0', whiteSpace: 'nowrap', px: 1.5, py: 0.8 }}>
                    {downloading === backup.name ? 'Downloading…' : 'Download'}
                  </Button></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0e6ea] px-5 py-1 sm:px-6">
              <span className="flex items-center gap-1.5 py-3 text-[10px] text-[#a18b93]"><Check size={12} />Updates every 30 seconds</span>
              <TablePagination component="div" count={filtered.length} page={currentPage} onPageChange={(_, value) => setPage(value)} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 25]}
                onRowsPerPageChange={event => { setRowsPerPage(Number(event.target.value)); setPage(0); }} sx={{ border: 0, '& .MuiToolbar-root': { pl: 0 }, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: 11 } }} />
            </div>
          </>}
      </section>

      <details className="group rounded-2xl border border-[#ede3d4] bg-[#fffcf6]">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-5 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <Info size={19} className="shrink-0 text-[#ba975d]" /><span className="flex-1">A safer place for your backup<span className="mt-1 block text-xs font-normal text-[#998873]">Keep an extra copy outside this server.</span></span><ChevronDown size={17} className="text-[#998873] transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-[#f1e8da] px-5 py-4 text-xs leading-relaxed text-[#998873]">
          <p>Keep a copy of your backup in a secure location, such as another device or cloud storage. Make sure only authorized people can access it</p>
          <p>Your database backup includes customer and account records. Uploaded photos are stored separately and need to be backed up separately</p>
          <p>Need to restore a backup? Contact your server administrator and follow the recovery steps in the backend README</p>
        </div>
      </details>
    </div>
  </ThemeProvider>;
}
