import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Skeleton, TablePagination, TextField, ThemeProvider, createTheme } from '@mui/material';
import { Archive, ArrowUpRight, CalendarClock, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { getArchives, restoreArchive } from '../../api/archives.api';
import type { ArchiveRecord, ArchiveEntity } from '../../api/archives.api';
const labels: Record<ArchiveEntity, string> = { users: 'Accounts', services: 'Services & products', 'shop-areas': 'Shop areas', appointments: 'Appointments & walk-ins', followups: 'Follow-up reminders' };
const theme = createTheme({ palette: { primary: { main: '#ad5871' } }, typography: { fontFamily: 'Poppins, sans-serif', button: { textTransform: 'none', fontWeight: 600 } }, shape: { borderRadius: 12 } });

export default function ArchivesPage() {
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<ArchiveRecord | null>(null);
  const [restoring, setRestoring] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setRecords(await getArchives()); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load archives.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => void refresh()); }, [refresh]);
  const rows = records.filter(record => (filter === 'all' || record.entity === filter) && `${record.name} ${record.detail || ''} ${record.id}`.toLowerCase().includes(search.trim().toLowerCase()));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / 8) - 1));
  return <ThemeProvider theme={theme}><div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8 space-y-6 text-[#49343a]">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ae7284]">Data & recovery</p><h1 className="page-title">Archives</h1><p className="page-subtitle">Deleted from your lists. Kept here for a fresh start.</p></div><Button startIcon={<RotateCcw size={16} />} disabled={loading || restoring} onClick={() => void refresh()}>Refresh</Button></header>
    {error && <Alert severity="error">{error}</Alert>}{success && <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>}
    <section className="flex flex-col items-start gap-5 sm:flex-row sm:items-center rounded-3xl border border-[#efdde3] bg-gradient-to-r from-[#fff0f4] to-[#fffaf2] p-6 sm:p-8">
      <span className="rounded-2xl bg-white p-4 text-[#b2687e]"><Archive size={28} /></span><div className="min-w-0 flex-1"><h2 className="text-xl font-semibold">Nothing here is lost.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#876f77]">Restore a record to return it to its original list, with its details and linked history intact.</p></div><div className="rounded-2xl bg-white/80 px-6 py-4"><p className="text-3xl font-semibold">{loading ? '—' : records.length}</p><p className="mt-1 text-xs text-[#876f77]">Archived records</p></div>
    </section>
    <section className="overflow-hidden rounded-3xl border border-[#efe3e7] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6"><div><h2 className="text-lg font-semibold">Archived records</h2><p className="mt-1 text-xs text-[#967f87]">Find a record and restore it whenever you need.</p></div><div className="flex w-full flex-wrap gap-3 sm:w-auto">
        <TextField size="small" select label="Record type" value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }} sx={{ minWidth: 205, flexGrow: 1 }}><MenuItem value="all">All types</MenuItem>{Object.entries(labels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
        <TextField size="small" label="Search records" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }} sx={{ flexGrow: 1 }} />
      </div></div>
      {loading ? <div className="space-y-3 p-6" role="status" aria-label="Loading archives">{[1, 2, 3].map(n => <Skeleton key={n} height={65} variant="rounded" />)}</div> : !rows.length ? <div className="border-t border-[#f3e9ed] p-12 text-center"><Archive className="mx-auto mb-4 text-[#b8778d]" size={32} /><h3 className="font-semibold">{error ? 'Archives could not be loaded' : records.length ? 'No matching records' : 'Your archives are clear'}</h3><p className="mt-2 text-sm text-[#967f87]">{error ? 'Use Refresh to try again.' : records.length ? 'Try another type or search term.' : 'Records you delete will appear here, ready to restore.'}</p></div> : <div className="divide-y divide-[#f3e9ed] border-t border-[#f3e9ed]">
        {rows.slice(currentPage * 8, (currentPage + 1) * 8).map(record => <article key={`${record.entity}-${record.id}`} className="flex flex-wrap items-center gap-4 px-5 py-5 transition hover:bg-[#fffafb] sm:px-6">
          <span className="hidden rounded-xl bg-[#fff3f6] p-3 text-[#b8778d] sm:block"><Archive size={19} /></span><div className="min-w-0 flex-1 basis-48"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-semibold">{record.name}</h3><Chip size="small" label={labels[record.entity]} sx={{ bgcolor: '#f8f0f3', color: '#a56b80', fontSize: 10 }} /></div><p className="mt-1 break-words text-xs text-[#967f87]">#{record.id}{record.detail ? ` · ${record.detail}` : ''}</p></div>
          <div className="min-w-44 text-xs text-[#876f77]"><p className="flex items-center gap-1.5"><CalendarClock size={13} />{new Date(record.deletedAt).toLocaleString()}</p><p className="mt-1 text-[11px] text-[#a18b93]">Archived by {record.deletedByName || 'Admin'}</p></div><Button variant="outlined" size="small" startIcon={<RotateCcw size={15} />} disabled={restoring} onClick={() => { setTarget(record); setError(''); }}>Restore</Button>
        </article>)}
      </div>}
      {!!rows.length && <TablePagination component="div" rowsPerPageOptions={[8]} rowsPerPage={8} count={rows.length} page={currentPage} onPageChange={(_, value) => setPage(value)} />}
    </section>
    
    <Dialog open={!!target} onClose={() => { if (!restoring) setTarget(null); }} fullWidth maxWidth="xs" aria-labelledby="restore-title"><DialogTitle id="restore-title">Restore this record?</DialogTitle><DialogContent><p className="text-sm text-[#876f77]"><strong className="text-[#49343a]">{target?.name}</strong> will return to {target ? labels[target.entity].toLowerCase() : 'its original list'}. Its previous status and linked records will be preserved.</p>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}</DialogContent><DialogActions sx={{ p: 2 }}><Button disabled={restoring} onClick={() => setTarget(null)}>Cancel</Button><Button variant="contained" disabled={restoring} startIcon={restoring ? <CircularProgress size={15} color="inherit" /> : <ArrowUpRight size={16} />} onClick={async () => {
      if (!target) return; setRestoring(true); setError('');
      try { await restoreArchive(target); setRecords(items => items.filter(item => item.entity !== target.entity || item.id !== target.id)); setSuccess(`${target.name} was restored successfully.`); setTarget(null); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to restore this record.'); }
      finally { setRestoring(false); }
    }}>{restoring ? 'Restoring…' : 'Restore record'}</Button></DialogActions></Dialog>
  </div></ThemeProvider>;
}
