import type { ColumnWidths, Preferences } from '../types';

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Staleness thresholds, measured from when the tab was last viewed. */
export const RECENT_AFTER = 10 * MINUTE;
export const IDLE_AFTER = HOUR;
export const STALE_AFTER = DAY;

/** A background tab with a network request this recent is shown as busy. */
export const BUSY_WINDOW = MINUTE;

/** How long after a browser restart restored tabs may reclaim their previous ages. */
export const RESTORE_WINDOW = 10 * MINUTE;

export const REFRESH_INTERVAL = 10 * SECOND;
export const UNDO_TIMEOUT = 8 * SECOND;
export const CONFIRM_THRESHOLD = 5;

/** Chrome caps extension popups at 800×600. */
export const POPUP_WIDTHS = { S: 560, M: 680, L: 800 } as const;

export const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  title: 280,
  age: 72,
  lastViewed: 92,
  network: 92,
  data: 84,
};

export const MIN_COLUMN_WIDTHS: ColumnWidths = {
  title: 140,
  age: 56,
  lastViewed: 72,
  network: 72,
  data: 64,
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  popupWidth: POPUP_WIDTHS.L,
  columnWidths: DEFAULT_COLUMN_WIDTHS,
  protectPinned: true,
  sortColumn: 'lastViewed',
  sortDirection: 'asc',
};

export const AGE_FILTERS: Array<{ label: string; value: number }> = [
  { label: 'Any age', value: 0 },
  { label: 'Older than 1 day', value: DAY },
  { label: 'Older than 1 week', value: 7 * DAY },
  { label: 'Older than 2 weeks', value: 14 * DAY },
  { label: 'Older than 1 month', value: 30 * DAY },
  { label: 'Older than 3 months', value: 90 * DAY },
];

export const STATUS_LABELS = {
  active: 'Active',
  recent: 'Recent',
  idle: 'Idle',
  stale: 'Stale',
} as const;

export const STATUS_DESCRIPTIONS = {
  active: 'Showing in its window, or viewed in the last 10 minutes',
  recent: 'Viewed in the last hour',
  idle: 'Viewed in the last day',
  stale: 'Not viewed for over a day',
} as const;
