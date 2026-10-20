/** Pure filtering, sorting, grouping and bulk-action selection for the tab table. */
import type {
  GroupBy,
  ShowFilter,
  SortColumn,
  SortDirection,
  Staleness,
  TabMetrics,
} from '../types';
import { STATUS_LABELS } from './constants';
import { STATUS_ORDER, getAge, getStaleness, isBusy } from './status';

export interface FilterOptions {
  search: string;
  minAge: number;
  show: ShowFilter;
}

export function filterTabs(tabs: TabMetrics[], opts: FilterOptions, now: number): TabMetrics[] {
  const query = opts.search.trim().toLowerCase();
  return tabs.filter(tab => {
    if (opts.minAge > 0 && getAge(tab, now) < opts.minAge) return false;
    if (opts.show !== 'all') {
      const status = getStaleness(tab, now);
      if (opts.show === 'stale' && status !== 'stale') return false;
      if (opts.show === 'idle-or-stale' && status !== 'idle' && status !== 'stale') return false;
      if (opts.show === 'busy' && !isBusy(tab, now)) return false;
    }
    if (
      query &&
      !tab.title.toLowerCase().includes(query) &&
      !tab.url.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });
}

const sortValue = (tab: TabMetrics, column: SortColumn, now: number): string | number => {
  switch (column) {
    case 'title':
      return tab.title.toLowerCase();
    case 'age':
      return getAge(tab, now);
    case 'lastViewed':
      return tab.lastViewed;
    case 'network':
      return tab.network.lastActivity ?? 0;
    case 'data':
      return tab.network.bytesReceived;
  }
};

export function sortTabs(
  tabs: TabMetrics[],
  column: SortColumn,
  direction: SortDirection,
  now: number
): TabMetrics[] {
  const sign = direction === 'asc' ? 1 : -1;
  return [...tabs].sort((a, b) => {
    const av = sortValue(a, column, now);
    const bv = sortValue(b, column, now);
    const cmp = av > bv ? 1 : av < bv ? -1 : 0;
    // Stable tie-break by window and position so rows don't jump between refreshes.
    return sign * cmp || a.windowId - b.windowId || a.index - b.index;
  });
}

export interface TabGroup {
  key: string;
  label: string;
  tabs: TabMetrics[];
}

export interface GroupContext {
  /** Window ids in display order (ascending), for "Window 1, 2, …" labels. */
  windowIds: number[];
  focusedWindowId: number | null;
}

export function groupTabs(
  tabs: TabMetrics[],
  groupBy: GroupBy,
  ctx: GroupContext,
  now: number
): TabGroup[] {
  if (groupBy === 'none') return [{ key: 'all', label: 'All tabs', tabs }];

  const groups = new Map<string, TabMetrics[]>();
  for (const tab of tabs) {
    const key =
      groupBy === 'domain'
        ? tab.hostname
        : groupBy === 'window'
          ? String(tab.windowId)
          : getStaleness(tab, now);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tab);
  }

  const entries = [...groups.entries()];
  if (groupBy === 'status') {
    entries.sort(
      ([a], [b]) => STATUS_ORDER.indexOf(a as Staleness) - STATUS_ORDER.indexOf(b as Staleness)
    );
  } else if (groupBy === 'window') {
    entries.sort(([a], [b]) => Number(a) - Number(b));
  } else {
    entries.sort(([ka, a], [kb, b]) => b.length - a.length || ka.localeCompare(kb));
  }

  return entries.map(([key, groupTabsList]) => {
    let label = key;
    if (groupBy === 'status') label = STATUS_LABELS[key as Staleness];
    if (groupBy === 'window') {
      const n = ctx.windowIds.indexOf(Number(key)) + 1;
      label = `Window ${n || '?'}${Number(key) === ctx.focusedWindowId ? ' (this window)' : ''}`;
    }
    return { key, label, tabs: groupTabsList };
  });
}

/** Ids of rows the user can actually see, in display order. */
export function visibleIds(groups: TabGroup[], collapsed: Set<string>): number[] {
  return groups.filter(g => !collapsed.has(g.key)).flatMap(g => g.tabs.map(t => t.id));
}

/**
 * Duplicate tabs to close: same URL, keeping the active or most recently viewed copy.
 * Pinned tabs are never closed when protected.
 */
export function duplicatesToClose(tabs: TabMetrics[], protectPinned: boolean): number[] {
  const byUrl = new Map<string, TabMetrics[]>();
  for (const tab of tabs) {
    if (!byUrl.has(tab.url)) byUrl.set(tab.url, []);
    byUrl.get(tab.url)!.push(tab);
  }
  const close: number[] = [];
  for (const copies of byUrl.values()) {
    if (copies.length < 2) continue;
    const [, ...rest] = [...copies].sort(
      (a, b) =>
        Number(b.isActive) - Number(a.isActive) ||
        Number(b.isPinned) - Number(a.isPinned) ||
        b.lastViewed - a.lastViewed
    );
    for (const tab of rest) {
      if (!(protectPinned && tab.isPinned)) close.push(tab.id);
    }
  }
  return close;
}

/** Remove protected (pinned) tabs from a bulk-close set. */
export function closable(tabs: TabMetrics[], protectPinned: boolean): TabMetrics[] {
  return protectPinned ? tabs.filter(t => !t.isPinned) : tabs;
}
