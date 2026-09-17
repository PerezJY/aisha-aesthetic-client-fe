import { API_BASE_URL, apiRequest, authFetch } from './client';

export interface DatabaseBackup {
  name: string;
  kind: 'automatic' | 'manual';
  size: number;
  createdAt: string;
}

export interface BackupStatus {
  backups: DatabaseBackup[];
  enabled: boolean;
  intervalHours: number;
  retentionCount: number;
  busy: boolean;
  lastError: string | null;
  nextBackupAt: string | null;
}

export const getBackups = () => apiRequest<BackupStatus>('/api/backups');
export const createBackup = () => apiRequest<DatabaseBackup>('/api/backups', { method: 'POST' });
export async function restoreBackup(file: File) {
  const body = new FormData(); body.append('backup', file);
  const response = await authFetch(`${API_BASE_URL}/api/backups/restore`, { method: 'POST', body });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to restore backup.');
  return data as { message: string };
}

export async function downloadBackup(name: string) {
  const response = await authFetch(`${API_BASE_URL}/api/backups/${encodeURIComponent(name)}/download`);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Unable to download backup. Please try again.');
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
