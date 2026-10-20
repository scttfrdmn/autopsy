import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { Snapshot, TabMetrics } from '../../types';
import { REFRESH_INTERVAL } from '../../lib/constants';
import { getHostname, isHiddenUrl } from '../../lib/url';

const EMPTY_NETWORK = {
  requestCount: 0,
  bytesReceived: 0,
  lastActivity: null,
  firstActivity: null,
};

export interface TabData {
  tabs: TabMetrics[];
  windowIds: number[];
  focusedWindowId: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  refresh: () => Promise<void>;
}

async function fetchTabs(): Promise<
  Omit<TabData, 'loading' | 'error' | 'lastUpdated' | 'refresh'>
> {
  const [allTabs, groups, snapshot, focused] = await Promise.all([
    chrome.tabs.query({}),
    chrome.tabGroups.query({}),
    chrome.runtime.sendMessage({ action: 'getSnapshot' }) as Promise<Snapshot>,
    chrome.windows.getLastFocused({ windowTypes: ['normal'] }).catch(() => null),
  ]);
  const now = Date.now();
  const groupMap = new Map(groups.map(g => [g.id, g]));
  const ownOrigin = chrome.runtime.getURL('');
  const windowIds = [...new Set(allTabs.map(t => t.windowId))].sort((a, b) => a - b);

  const tabs: TabMetrics[] = [];
  for (const tab of allTabs) {
    const url = tab.url || tab.pendingUrl || '';
    if (tab.id === undefined || isHiddenUrl(url, ownOrigin)) continue;
    const record = snapshot?.records?.[tab.id];
    const lastViewed = snapshot?.overrides?.[tab.id]?.lastViewed ?? tab.lastAccessed ?? now;
    const group = tab.groupId >= 0 ? groupMap.get(tab.groupId) : undefined;

    tabs.push({
      id: tab.id,
      title: tab.title || url,
      url,
      hostname: getHostname(url),
      favIconUrl: tab.favIconUrl || undefined,
      windowId: tab.windowId,
      index: tab.index,
      created: record?.created ?? null,
      // The tab existed when Autopsy first saw it and when it was last viewed.
      ageLowerBound: Math.min(record?.firstSeen ?? now, lastViewed),
      lastViewed,
      network: snapshot?.stats?.[tab.id] ?? EMPTY_NETWORK,
      isActive: tab.active,
      isPinned: tab.pinned,
      isAudible: tab.audible ?? false,
      isDiscarded: tab.discarded,
      groupInfo: group ? { id: group.id, title: group.title, color: group.color } : null,
    });
  }

  return { tabs, windowIds, focusedWindowId: focused?.id ?? null };
}

export function useTabs(): TabData {
  const [data, setData] = useState<Omit<TabData, 'refresh'>>(() => ({
    tabs: [],
    windowIds: [],
    focusedWindowId: null,
    loading: true,
    error: null,
    lastUpdated: Date.now(),
  }));
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    // Coalesce overlapping refreshes from timers and tab events.
    inFlight.current ??= fetchTabs()
      .then(result => setData({ ...result, loading: false, error: null, lastUpdated: Date.now() }))
      .catch((e: unknown) =>
        setData(prev => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e.message : 'Could not read tabs',
        }))
      )
      .finally(() => {
        inFlight.current = null;
      });
    return inFlight.current;
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);

    // Reflect tab changes immediately instead of waiting for the next refresh.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      clearTimeout(pending);
      pending = setTimeout(refresh, 250);
    };
    const events = [
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onMoved,
      chrome.tabs.onAttached,
      chrome.tabs.onActivated,
    ] as Array<chrome.events.Event<() => void>>;
    const onUpdated = (_id: number, info: chrome.tabs.OnUpdatedInfo) => {
      if (info.url || info.title || info.pinned !== undefined || info.discarded !== undefined)
        onChange();
    };
    events.forEach(e => e.addListener(onChange));
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      clearInterval(interval);
      clearTimeout(pending);
      events.forEach(e => e.removeListener(onChange));
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [refresh]);

  return { ...data, refresh };
}
