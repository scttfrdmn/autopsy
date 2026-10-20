export type Staleness = 'active' | 'recent' | 'idle' | 'stale';

export interface NetworkActivity {
  requestCount: number;
  bytesReceived: number;
  lastActivity: number | null;
  firstActivity: number | null;
}

export interface NetworkStats {
  [tabId: number]: NetworkActivity;
}

/** What the worker remembers about each open tab (persisted in chrome.storage.local). */
export interface TabRecord {
  url: string;
  /** When the tab was opened, or null if it predates Autopsy's tracking. */
  created: number | null;
  /** When Autopsy first saw the tab. A lower bound for age when `created` is null. */
  firstSeen: number;
  /** Rank of the tab's window among open windows, ordered by window id. Stable across restarts. */
  windowOrdinal: number;
  index: number;
  /** Set on tabs created during session restore that may still be matched to a previous record. */
  provisional?: boolean;
}

export type TabRecords = Record<string, TabRecord>;

export interface Snapshot {
  records: TabRecords;
  stats: NetworkStats;
  /** Screenshot builds only: fake values Chrome won't let us set. */
  overrides?: Record<string, { lastViewed?: number }>;
}

export interface TabMetrics {
  id: number;
  title: string;
  url: string;
  hostname: string;
  favIconUrl?: string;
  windowId: number;
  index: number;

  /** When the tab was opened, if known. */
  created: number | null;
  /** Lower bound for tab age, used when `created` is unknown. */
  ageLowerBound: number;
  /** Last time the tab became active in its window (Chrome's tab.lastAccessed). */
  lastViewed: number;

  network: NetworkActivity;

  isActive: boolean;
  isPinned: boolean;
  isAudible: boolean;
  isDiscarded: boolean;

  groupInfo: {
    id: number;
    title?: string;
    color: string;
  } | null;
}

export type SortColumn = 'title' | 'age' | 'lastViewed' | 'network' | 'data';

export type SortDirection = 'asc' | 'desc';

export type GroupBy = 'none' | 'domain' | 'window' | 'status';

export type ThemePreference = 'dark' | 'light' | 'system';

export type ShowFilter = 'all' | 'stale' | 'idle-or-stale' | 'busy';

export interface ColumnWidths {
  title: number;
  age: number;
  lastViewed: number;
  network: number;
  data: number;
}

export type ResizableColumn = keyof ColumnWidths;

export interface Preferences {
  theme: ThemePreference;
  popupWidth: number;
  columnWidths: ColumnWidths;
  protectPinned: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}
