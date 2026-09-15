import type { HistoryPoint, ZoneDetail, ZoneSummary } from '@workspace/api-client-react';

export const SEED_ZONE: ZoneDetail = {
  id: 1,
  name: 'GRA Phase 2',
  parentArea: 'Port Harcourt',
  status: 'MIXED',
  onCount: 8,
  offCount: 3,
  totalReports: 11,
  lastConfirmedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  minutesAgo: 8,
  isStale: false,
  centerLat: 4.8156,
  centerLng: 7.0498,
  radiusM: 1800,
};

export const SEED_ZONES: ZoneSummary[] = [
  SEED_ZONE,
  {
    id: 2,
    name: 'New GRA',
    parentArea: 'Port Harcourt',
    status: 'ON',
    onCount: 14,
    offCount: 2,
    totalReports: 16,
    lastConfirmedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    minutesAgo: 4,
    isStale: false,
  },
  {
    id: 3,
    name: 'Rumuola',
    parentArea: 'Port Harcourt',
    status: 'OFF',
    onCount: 1,
    offCount: 12,
    totalReports: 13,
    lastConfirmedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    minutesAgo: 12,
    isStale: false,
  },
];

export const SEED_HISTORY: HistoryPoint[] = [
  { at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), onCount: 8, offCount: 3, status: 'MIXED' },
  { at: new Date(Date.now() - 35 * 60 * 1000).toISOString(), onCount: 9, offCount: 1, status: 'ON' },
  { at: new Date(Date.now() - 65 * 60 * 1000).toISOString(), onCount: 3, offCount: 7, status: 'OFF' },
  { at: new Date(Date.now() - 95 * 60 * 1000).toISOString(), onCount: 2, offCount: 10, status: 'OFF' },
  { at: new Date(Date.now() - 125 * 60 * 1000).toISOString(), onCount: 11, offCount: 0, status: 'ON' },
];

export function getDeviceId(): string {
  const key = 'upnepa-device-id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = `device-${crypto.randomUUID().slice(0, 8)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export function formatMinutes(minutesAgo: number | null): string {
  if (minutesAgo === null || minutesAgo === undefined) return 'No recent confirmation';
  if (minutesAgo < 1) return 'Confirmed just now';
  if (minutesAgo === 1) return 'Confirmed 1 min ago';
  if (minutesAgo < 60) return `Confirmed ${minutesAgo} mins ago`;
  const hours = Math.floor(minutesAgo / 60);
  return `Confirmed ${hours}h ago`;
}

export function statusLabel(status: ZoneSummary['status']): string {
  return status === 'STALE' ? 'STALE' : status === 'NONE' ? 'NO SIGNAL' : status;
}

export function statusTone(status: ZoneSummary['status']): string {
  if (status === 'ON') return 'status-on';
  if (status === 'OFF') return 'status-off';
  if (status === 'STALE') return 'status-stale';
  if (status === 'MIXED') return 'status-mixed';
  return 'status-none';
}

export function formatDate(value: string | null): string {
  if (!value) return 'Not yet';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatTime(value: string | null): string {
  if (!value) return 'No signal';
  return new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}