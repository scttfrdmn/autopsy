import { describe, expect, it } from 'vitest';
import {
  EMPTY_STATE,
  beginSession,
  claimFromPool,
  migrateLegacy,
  recordCreated,
  reconcile,
  windowOrdinals,
  type LiveTab,
  type RecordState,
} from '../../src/lib/tabRecords';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;
const RESTORE = 10 * 60_000;

const tab = (id: number, url: string, windowId = 1, index = 0): LiveTab => ({
  id,
  url,
  windowId,
  index,
});

function sessionWith(tabs: LiveTab[], created: number): RecordState {
  let state = EMPTY_STATE;
  for (const t of tabs)
    state = recordCreated(state, t, windowOrdinals(tabs).get(t.windowId)!, created);
  return reconcile(state, tabs, created);
}

describe('windowOrdinals', () => {
  it('ranks windows by id', () => {
    const ords = windowOrdinals([tab(1, 'a', 50), tab(2, 'b', 7), tab(3, 'c', 50)]);
    expect(ords.get(7)).toBe(0);
    expect(ords.get(50)).toBe(1);
  });
});

describe('recordCreated', () => {
  it('records the open time', () => {
    const state = recordCreated(EMPTY_STATE, tab(1, 'https://a.test'), 0, T0);
    expect(state.records[1]).toMatchObject({ created: T0, firstSeen: T0, url: 'https://a.test' });
    expect(state.records[1].provisional).toBeUndefined();
  });

  it('claims a previous-session record while restoring', () => {
    const prev = sessionWith([tab(10, 'https://a.test', 100, 0)], T0);
    const restored = beginSession(prev, T0 + 5 * HOUR, RESTORE);
    const state = recordCreated(restored, tab(1, 'https://a.test', 3, 0), 0, T0 + 5 * HOUR);
    expect(state.records[1].created).toBe(T0);
    expect(state.pool).toHaveLength(0);
  });

  it('does not claim after the restore window', () => {
    const prev = sessionWith([tab(10, 'https://a.test')], T0);
    const restored = beginSession(prev, T0 + HOUR, RESTORE);
    const later = T0 + HOUR + RESTORE + 1;
    const state = recordCreated(restored, tab(1, 'https://a.test'), 0, later);
    expect(state.records[1].created).toBe(later);
  });
});

describe('reconcile', () => {
  it('keeps the open time when a tab navigates', () => {
    const state = sessionWith([tab(1, 'https://a.test')], T0);
    const next = reconcile(state, [tab(1, 'https://b.test')], T0 + HOUR);
    expect(next.records[1]).toMatchObject({ created: T0, url: 'https://b.test' });
  });

  it('drops closed tabs', () => {
    const state = sessionWith([tab(1, 'https://a.test'), tab(2, 'https://b.test', 1, 1)], T0);
    const next = reconcile(state, [tab(2, 'https://b.test')], T0 + 1);
    expect(Object.keys(next.records)).toEqual(['2']);
  });

  it('marks tabs it never saw open as unknown', () => {
    const next = reconcile(EMPTY_STATE, [tab(1, 'https://a.test')], T0);
    expect(next.records[1]).toMatchObject({ created: null, firstSeen: T0 });
  });

  it('restores ages across a browser restart even though ids change', () => {
    const before = [
      tab(10, 'https://a.test', 500, 0),
      tab(11, 'https://b.test', 500, 1),
      tab(12, 'https://a.test', 501, 0),
    ];
    let prev = sessionWith(before.slice(0, 2), T0);
    prev = recordCreated(prev, before[2], 1, T0 + HOUR);
    prev = reconcile(prev, before, T0 + HOUR);

    const now = T0 + 24 * HOUR;
    const after = [
      tab(1, 'https://a.test', 7, 0),
      tab(2, 'https://b.test', 7, 1),
      tab(3, 'https://a.test', 8, 0),
    ];
    const state = reconcile(beginSession(prev, now, RESTORE), after, now);
    expect(state.records[1].created).toBe(T0);
    expect(state.records[2].created).toBe(T0);
    // Same URL in the second window keeps its own (later) age.
    expect(state.records[3].created).toBe(T0 + HOUR);
    expect(state.pool).toHaveLength(0);
  });

  it('prefers an exact id match after an extension reload', () => {
    const before = [tab(5, 'https://a.test', 1, 0), tab(6, 'https://a.test', 1, 1)];
    let prev = recordCreated(EMPTY_STATE, before[0], 0, T0);
    prev = recordCreated(prev, before[1], 0, T0 + HOUR);
    prev = reconcile(prev, before, T0 + HOUR);
    // Positions swapped, ids kept.
    const after = [tab(6, 'https://a.test', 1, 0), tab(5, 'https://a.test', 1, 1)];
    const state = reconcile(beginSession(prev, T0 + 2 * HOUR, RESTORE), after, T0 + 2 * HOUR);
    expect(state.records[5].created).toBe(T0);
    expect(state.records[6].created).toBe(T0 + HOUR);
  });

  it('lets a tab whose URL was unknown claim its record once the URL arrives', () => {
    const prev = sessionWith([tab(10, 'https://a.test')], T0);
    const now = T0 + HOUR;
    let state = beginSession(prev, now, RESTORE);
    state = reconcile(state, [tab(1, '')], now);
    expect(state.records[1].provisional).toBe(true);
    state = reconcile(state, [tab(1, 'https://a.test')], now + 1000);
    expect(state.records[1]).toMatchObject({ created: T0, url: 'https://a.test' });
    expect(state.records[1].provisional).toBeUndefined();
  });

  it('finalizes provisional records after the restore window', () => {
    const prev = sessionWith([tab(10, 'https://a.test')], T0);
    let state = beginSession(prev, T0, RESTORE);
    state = recordCreated(state, tab(1, 'https://new.test'), 0, T0 + 1);
    expect(state.records[1].provisional).toBe(true);
    state = reconcile(state, [tab(1, 'https://new.test')], T0 + RESTORE + 1);
    expect(state.records[1].provisional).toBeUndefined();
    expect(state.records[1].created).toBe(T0 + 1);
    expect(state.pool).toHaveLength(0);
  });
});

describe('claimFromPool', () => {
  it('picks the closest position among same-URL entries', () => {
    const pool = [
      { url: 'u', created: 1, firstSeen: 1, windowOrdinal: 0, index: 0, tabId: 1 },
      { url: 'u', created: 2, firstSeen: 2, windowOrdinal: 0, index: 5, tabId: 2 },
    ];
    const { match, pool: rest } = claimFromPool(pool, tab(99, 'u', 1, 4), 0);
    expect(match?.created).toBe(2);
    expect(rest).toHaveLength(1);
  });
});

describe('migrateLegacy', () => {
  it('keeps v0.22 open times for current tabs and removes every legacy key', () => {
    const storage = {
      tab_1_created: T0,
      tab_99_created: T0,
      'url_https://a.test_first_seen': T0,
      'instance_https://a.test#1#0': {},
      preferences: { theme: 'dark' },
    };
    const { state, removeKeys } = migrateLegacy(
      storage,
      [tab(1, 'https://a.test'), tab(2, 'https://b.test')],
      T0 + HOUR
    );
    expect(state.records[1].created).toBe(T0);
    expect(state.records[2].created).toBeNull();
    expect(removeKeys.sort()).toEqual(
      [
        'instance_https://a.test#1#0',
        'tab_1_created',
        'tab_99_created',
        'url_https://a.test_first_seen',
      ].sort()
    );
  });
});
