/**
 * Tab age bookkeeping. Chrome exposes no tab creation time, so Autopsy records it in
 * onCreated and carries it across browser restarts by matching restored tabs to the
 * previous session's records. Tab and window ids change on restart, so matching uses
 * the URL first, then position (window rank, tab index).
 *
 * Everything here is pure so it can be unit-tested; the worker owns storage and events.
 */
import type { TabRecord, TabRecords } from '../types';

export interface LiveTab {
  id: number;
  url: string;
  windowId: number;
  index: number;
}

export interface PoolEntry extends TabRecord {
  tabId: number;
}

export interface RecordState {
  records: TabRecords;
  /** Previous session's records, waiting to be claimed by restored tabs. */
  pool: PoolEntry[];
  /** Pool entries can only be claimed before this time. */
  poolExpires: number;
}

export const EMPTY_STATE: RecordState = { records: {}, pool: [], poolExpires: 0 };

/** Rank windows by id; restored windows keep their relative order across restarts. */
export function windowOrdinals(tabs: LiveTab[]): Map<number, number> {
  const ids = [...new Set(tabs.map(t => t.windowId))].sort((a, b) => a - b);
  return new Map(ids.map((id, i) => [id, i]));
}

/** Start a new browser session: last session's records become the restore pool. */
export function beginSession(state: RecordState, now: number, restoreWindow: number): RecordState {
  const pool: PoolEntry[] = Object.entries(state.records).map(([id, rec]) => ({
    ...rec,
    provisional: false,
    tabId: Number(id),
  }));
  return { records: {}, pool, poolExpires: now + restoreWindow };
}

function poolActive(state: RecordState, now: number): boolean {
  return state.pool.length > 0 && now < state.poolExpires;
}

/** Remove and return the best previous-session match for a tab, if any. */
export function claimFromPool(
  pool: PoolEntry[],
  tab: LiveTab,
  windowOrdinal: number
): { match: PoolEntry | null; pool: PoolEntry[] } {
  let best = -1;
  let bestScore = Infinity;
  pool.forEach((entry, i) => {
    if (entry.url !== tab.url) return;
    // Same tab id (extension reload/update keeps ids) is a certain match.
    const score =
      entry.tabId === tab.id
        ? -1
        : Math.abs(entry.windowOrdinal - windowOrdinal) * 10_000 +
          Math.abs(entry.index - tab.index);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  if (best === -1) return { match: null, pool };
  return { match: pool[best], pool: pool.filter((_, i) => i !== best) };
}

/** Record a tab that was just opened. */
export function recordCreated(
  state: RecordState,
  tab: LiveTab,
  ordinal: number,
  now: number
): RecordState {
  let pool = state.pool;
  let record: TabRecord;

  if (poolActive(state, now) && tab.url) {
    const claimed = claimFromPool(pool, tab, ordinal);
    pool = claimed.pool;
    if (claimed.match) {
      record = {
        ...stripPool(claimed.match),
        url: tab.url,
        windowOrdinal: ordinal,
        index: tab.index,
      };
      return { ...state, pool, records: { ...state.records, [tab.id]: record } };
    }
  }

  record = {
    url: tab.url,
    created: now,
    firstSeen: now,
    windowOrdinal: ordinal,
    index: tab.index,
    // While restoring, a tab created without a URL may still match a previous record.
    provisional: poolActive(state, now) || undefined,
  };
  return { ...state, pool, records: { ...state.records, [tab.id]: record } };
}

function stripPool(entry: PoolEntry): TabRecord {
  const { tabId: _tabId, provisional: _p, ...rest } = entry;
  return rest;
}

/**
 * Bring records in line with the tabs that are actually open: update positions and URLs,
 * claim previous-session ages for restored tabs, add unknown tabs, drop closed ones.
 * Navigation never changes `created`.
 */
export function reconcile(state: RecordState, tabs: LiveTab[], now: number): RecordState {
  const ordinals = windowOrdinals(tabs);
  const active = poolActive(state, now);
  let pool = active ? state.pool : [];
  const records: TabRecords = {};

  const ordered = [...tabs].sort(
    (a, b) => ordinals.get(a.windowId)! - ordinals.get(b.windowId)! || a.index - b.index
  );

  // Exact id matches first so they can't be stolen by a same-URL neighbour.
  if (active) {
    for (const tab of ordered) {
      if (state.records[tab.id] && !state.records[tab.id].provisional) continue;
      const exact = pool.findIndex(e => e.tabId === tab.id && e.url === tab.url);
      if (exact !== -1) {
        records[tab.id] = {
          ...stripPool(pool[exact]),
          windowOrdinal: ordinals.get(tab.windowId)!,
          index: tab.index,
        };
        pool = pool.filter((_, i) => i !== exact);
      }
    }
  }

  for (const tab of ordered) {
    if (records[tab.id]) continue;
    const ordinal = ordinals.get(tab.windowId)!;
    const existing = state.records[tab.id];

    if (existing && !existing.provisional) {
      records[tab.id] = {
        ...existing,
        url: tab.url || existing.url,
        windowOrdinal: ordinal,
        index: tab.index,
      };
      continue;
    }

    if (active && tab.url) {
      const claimed = claimFromPool(pool, tab, ordinal);
      pool = claimed.pool;
      if (claimed.match) {
        records[tab.id] = {
          ...stripPool(claimed.match),
          url: tab.url,
          windowOrdinal: ordinal,
          index: tab.index,
        };
        continue;
      }
    }

    if (existing) {
      // Provisional record with no match: keep its open time; finalize once restore is over.
      const { provisional: _p, ...rest } = existing;
      records[tab.id] = {
        ...rest,
        url: tab.url || existing.url,
        windowOrdinal: ordinal,
        index: tab.index,
      };
      if (active) records[tab.id].provisional = true;
      continue;
    }

    // A tab Autopsy never saw open (it predates install, or the event was missed).
    records[tab.id] = {
      url: tab.url,
      created: null,
      firstSeen: now,
      windowOrdinal: ordinal,
      index: tab.index,
    };
    // Its URL may not be known yet during restore; let a later pass claim a previous record.
    if (active) records[tab.id].provisional = true;
  }

  return { records, pool, poolExpires: pool.length ? state.poolExpires : 0 };
}

/** Keys written by v0.22 and earlier, which grew without bound. */
export function isLegacyKey(key: string): boolean {
  return key.startsWith('tab_') || key.startsWith('url_') || key.startsWith('instance_');
}

/** Carry over what v0.22 knew about currently open tabs. */
export function migrateLegacy(
  storage: Record<string, unknown>,
  tabs: LiveTab[],
  now: number
): { state: RecordState; removeKeys: string[] } {
  const ordinals = windowOrdinals(tabs);
  const records: TabRecords = {};
  for (const tab of tabs) {
    const legacy = storage[`tab_${tab.id}_created`];
    const created = typeof legacy === 'number' && legacy <= now ? legacy : null;
    records[tab.id] = {
      url: tab.url,
      created,
      firstSeen: created ?? now,
      windowOrdinal: ordinals.get(tab.windowId)!,
      index: tab.index,
    };
  }
  return {
    state: { records, pool: [], poolExpires: 0 },
    removeKeys: Object.keys(storage).filter(isLegacyKey),
  };
}
