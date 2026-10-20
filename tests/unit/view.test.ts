import { describe, expect, it } from 'vitest';
import type { TabMetrics } from '../../src/types';
import {
  closable,
  duplicatesToClose,
  filterTabs,
  groupTabs,
  sortTabs,
  visibleIds,
} from '../../src/lib/view';
import { getAge, getStaleness, isBusy } from '../../src/lib/status';
import { csvField, toCSV } from '../../src/lib/export';
import { formatBytes, formatDuration, formatRelative } from '../../src/lib/format';
import { getHostname, isHiddenUrl } from '../../src/lib/url';

const NOW = 1_700_000_000_000;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let nextId = 1;
function makeTab(over: Partial<TabMetrics> = {}): TabMetrics {
  const id = over.id ?? nextId++;
  return {
    id,
    title: `Tab ${id}`,
    url: `https://site${id}.test/`,
    hostname: `site${id}.test`,
    windowId: 1,
    index: id,
    created: NOW - DAY,
    ageLowerBound: NOW - DAY,
    lastViewed: NOW - 2 * HOUR,
    network: { requestCount: 0, bytesReceived: 0, lastActivity: null, firstActivity: null },
    isActive: false,
    isPinned: false,
    isAudible: false,
    isDiscarded: false,
    groupInfo: null,
    ...over,
  };
}

describe('status', () => {
  it('derives staleness from last viewed', () => {
    expect(getStaleness(makeTab({ lastViewed: NOW - 5 * MIN }), NOW)).toBe('active');
    expect(getStaleness(makeTab({ lastViewed: NOW - 30 * MIN }), NOW)).toBe('recent');
    expect(getStaleness(makeTab({ lastViewed: NOW - 5 * HOUR }), NOW)).toBe('idle');
    expect(getStaleness(makeTab({ lastViewed: NOW - 3 * DAY }), NOW)).toBe('stale');
  });

  it('treats the tab showing in its window as active however long ago it was switched to', () => {
    expect(getStaleness(makeTab({ isActive: true, lastViewed: NOW - 9 * DAY }), NOW)).toBe(
      'active'
    );
  });

  it('flags background tabs with recent requests as busy', () => {
    const network = {
      requestCount: 1,
      bytesReceived: 0,
      lastActivity: NOW - 10_000,
      firstActivity: null,
    };
    expect(isBusy(makeTab({ network }), NOW)).toBe(true);
    expect(isBusy(makeTab({ network, isActive: true }), NOW)).toBe(false);
  });

  it('uses the lower bound when the open time is unknown', () => {
    expect(getAge(makeTab({ created: null, ageLowerBound: NOW - 3 * DAY }), NOW)).toBe(3 * DAY);
  });
});

describe('filterTabs', () => {
  const tabs = [
    makeTab({ id: 100, title: 'GitHub', lastViewed: NOW - 3 * DAY }),
    makeTab({
      id: 101,
      title: 'Docs',
      url: 'https://docs.test/github',
      lastViewed: NOW - 5 * HOUR,
    }),
    makeTab({ id: 102, title: 'News', created: NOW - HOUR, lastViewed: NOW }),
  ];

  it('searches title and URL', () => {
    expect(
      filterTabs(tabs, { search: 'github', minAge: 0, show: 'all' }, NOW).map(t => t.id)
    ).toEqual([100, 101]);
  });
  it('filters by status', () => {
    expect(filterTabs(tabs, { search: '', minAge: 0, show: 'stale' }, NOW).map(t => t.id)).toEqual([
      100,
    ]);
    expect(filterTabs(tabs, { search: '', minAge: 0, show: 'idle-or-stale' }, NOW)).toHaveLength(2);
  });
  it('filters by minimum age', () => {
    expect(
      filterTabs(tabs, { search: '', minAge: 12 * HOUR, show: 'all' }, NOW).map(t => t.id)
    ).toEqual([100, 101]);
  });
});

describe('sortTabs', () => {
  it('sorts stalest first and breaks ties by position', () => {
    const a = makeTab({ id: 200, lastViewed: NOW - DAY, index: 2 });
    const b = makeTab({ id: 201, lastViewed: NOW - 2 * DAY, index: 1 });
    const c = makeTab({ id: 202, lastViewed: NOW - DAY, index: 0 });
    expect(sortTabs([a, b, c], 'lastViewed', 'asc', NOW).map(t => t.id)).toEqual([201, 202, 200]);
  });
});

describe('groupTabs', () => {
  it('labels windows by position and marks the focused one', () => {
    const tabs = [makeTab({ windowId: 30 }), makeTab({ windowId: 12 })];
    const groups = groupTabs(tabs, 'window', { windowIds: [12, 30], focusedWindowId: 30 }, NOW);
    expect(groups.map(g => g.label)).toEqual(['Window 1', 'Window 2 (this window)']);
  });

  it('orders status groups from active to stale', () => {
    const tabs = [makeTab({ lastViewed: NOW - 3 * DAY }), makeTab({ isActive: true })];
    expect(
      groupTabs(tabs, 'status', { windowIds: [1], focusedWindowId: 1 }, NOW).map(g => g.key)
    ).toEqual(['active', 'stale']);
  });

  it('excludes collapsed groups from visible ids', () => {
    const tabs = [makeTab({ id: 300, hostname: 'a' }), makeTab({ id: 301, hostname: 'b' })];
    const groups = groupTabs(tabs, 'domain', { windowIds: [1], focusedWindowId: 1 }, NOW);
    expect(visibleIds(groups, new Set(['a']))).toEqual([301]);
  });
});

describe('duplicatesToClose', () => {
  it('keeps the most recently viewed copy and never closes protected pinned tabs', () => {
    const url = 'https://dup.test/';
    const old = makeTab({ id: 400, url, lastViewed: NOW - DAY });
    const recent = makeTab({ id: 401, url, lastViewed: NOW - HOUR });
    const pinned = makeTab({ id: 402, url, lastViewed: NOW - 2 * DAY, isPinned: true });
    // The pinned copy is preferred as the keeper, so both others close.
    expect(duplicatesToClose([old, recent, pinned], true).sort()).toEqual([400, 401]);
    const unpinned = [old, recent];
    expect(duplicatesToClose(unpinned, true)).toEqual([400]);
  });

  it('keeps the active copy', () => {
    const url = 'https://dup2.test/';
    const active = makeTab({ id: 410, url, isActive: true, lastViewed: NOW - DAY });
    const other = makeTab({ id: 411, url, lastViewed: NOW - MIN });
    expect(duplicatesToClose([active, other], true)).toEqual([411]);
  });

  it('protects pinned tabs from bulk close', () => {
    const tabs = [makeTab({ isPinned: true }), makeTab()];
    expect(closable(tabs, true)).toHaveLength(1);
    expect(closable(tabs, false)).toHaveLength(2);
  });
});

describe('export', () => {
  it('quotes fields with commas, quotes or newlines', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField(null)).toBe('');
  });

  it('escapes URLs as well as titles', () => {
    const csv = toCSV([makeTab({ title: 'T', url: 'https://x.test/?a=1,2' })], NOW);
    expect(csv.split('\r\n')[1]).toContain('"https://x.test/?a=1,2"');
  });
});

describe('format', () => {
  it('formats durations compactly', () => {
    expect(formatDuration(30_000)).toBe('<1m');
    expect(formatDuration(5 * MIN)).toBe('5m');
    expect(formatDuration(3 * HOUR)).toBe('3h');
    expect(formatDuration(3 * DAY)).toBe('3d');
    expect(formatDuration(21 * DAY)).toBe('3w');
    expect(formatDuration(120 * DAY)).toBe('4mo');
  });
  it('formats relative times', () => {
    expect(formatRelative(null, NOW)).toBe('—');
    expect(formatRelative(NOW - 1000, NOW)).toBe('just now');
    expect(formatRelative(NOW - 2 * HOUR, NOW)).toBe('2h ago');
  });
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('—');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('url', () => {
  it('never throws on odd URLs', () => {
    expect(getHostname('https://a.test/x')).toBe('a.test');
    expect(getHostname('chrome://newtab/')).toBe('chrome://newtab');
    expect(getHostname('file:///tmp/x.html')).toBe('Local file');
    expect(getHostname('not a url')).toBe('not a url');
  });
  it('hides only Autopsy itself, devtools and URL-less tabs', () => {
    const own = 'chrome-extension://abc/';
    expect(isHiddenUrl('chrome-extension://abc/index.html', own)).toBe(true);
    expect(isHiddenUrl('chrome://newtab/', own)).toBe(false);
    expect(isHiddenUrl('', own)).toBe(true);
  });
});
