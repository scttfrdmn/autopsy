import { DAY, HOUR, MINUTE } from './constants';

/** Compact duration: "<1m", "5m", "3h", "2d", "6w", "4mo", "2y". */
export function formatDuration(ms: number): string {
  if (ms < MINUTE) return '<1m';
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h`;
  if (ms < 14 * DAY) return `${Math.floor(ms / DAY)}d`;
  if (ms < 60 * DAY) return `${Math.floor(ms / (7 * DAY))}w`;
  if (ms < 365 * DAY) return `${Math.floor(ms / (30 * DAY))}mo`;
  return `${Math.floor(ms / (365 * DAY))}y`;
}

/** "just now", "5m ago", "3h ago"; an em dash for unknown. */
export function formatRelative(timestamp: number | null, now: number): string {
  if (timestamp === null) return '—';
  const diff = Math.max(0, now - timestamp);
  if (diff < MINUTE) return 'just now';
  return `${formatDuration(diff)} ago`;
}

export function formatAbsolute(timestamp: number | null): string {
  if (timestamp === null) return '';
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
