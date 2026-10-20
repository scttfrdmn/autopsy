import type { NetworkStats, Snapshot, TabRecords } from '../types';
import { RESTORE_WINDOW } from '../lib/constants';
import {
  EMPTY_STATE,
  beginSession,
  migrateLegacy,
  recordCreated,
  reconcile,
  windowOrdinals,
  type LiveTab,
  type RecordState,
} from '../lib/tabRecords';

const STATE_KEY = 'tabState';
const SCHEMA_KEY = 'schemaVersion';
const SCHEMA_VERSION = 2;
// chrome.storage.session is cleared when the browser restarts or the extension reloads,
// which is exactly when tab ids change and previous records need re-matching.
const SESSION_FLAG = 'sessionActive';
const STATS_KEY = 'networkStats';

const STATS_SAVE_DELAY = 2000;
const RECONCILE_DELAY = 500;

let state: RecordState = EMPTY_STATE;
// Network stats live in memory and are mirrored to session storage so they survive
// Chrome stopping this worker when idle.
let stats: NetworkStats = {};
let screenshotOverrides: Snapshot['overrides'];

const liveTabs = async (): Promise<LiveTab[]> => {
  const tabs = await chrome.tabs.query({});
  return tabs
    .filter((t): t is chrome.tabs.Tab & { id: number } => t.id !== undefined && t.id >= 0)
    .map(t => ({
      id: t.id,
      url: t.url || t.pendingUrl || '',
      windowId: t.windowId,
      index: t.index,
    }));
};

const saveState = () => chrome.storage.local.set({ [STATE_KEY]: state });

const init = async () => {
  const [local, session] = await Promise.all([
    chrome.storage.local.get(null),
    chrome.storage.session.get([SESSION_FLAG, STATS_KEY]),
  ]);
  const now = Date.now();
  stats = (session[STATS_KEY] as NetworkStats | undefined) ?? {};

  let migrated = false;
  if (local[SCHEMA_KEY] !== SCHEMA_VERSION) {
    const result = migrateLegacy(local, await liveTabs(), now);
    state = result.state;
    migrated = true;
    if (result.removeKeys.length) await chrome.storage.local.remove(result.removeKeys);
    await chrome.storage.local.set({ [SCHEMA_KEY]: SCHEMA_VERSION });
  } else {
    state = (local[STATE_KEY] as RecordState | undefined) ?? EMPTY_STATE;
  }

  if (!session[SESSION_FLAG]) {
    if (!migrated) state = beginSession(state, now, RESTORE_WINDOW);
    await chrome.storage.session.set({ [SESSION_FLAG]: true });
  }

  const tabs = await liveTabs();
  if (tabs.length) state = reconcile(state, tabs, now);
  await saveState();
};

const ready = init();

// Serialize every state change so concurrent events can't overwrite each other.
let queue: Promise<void> = Promise.resolve();
const mutate = (fn: (s: RecordState) => RecordState | Promise<RecordState>) => {
  queue = queue
    .then(async () => {
      await ready;
      state = await fn(state);
      await saveState();
    })
    .catch(() => {
      // Keep the queue alive; the next reconcile repairs any missed update.
    });
  return queue;
};

const reconcileNow = () =>
  mutate(async s => {
    const tabs = await liveTabs();
    // No tabs means the browser is shutting down: keep records for the next session.
    return tabs.length ? reconcile(s, tabs, Date.now()) : s;
  });

let reconcileTimer: ReturnType<typeof setTimeout> | undefined;
const scheduleReconcile = () => {
  clearTimeout(reconcileTimer);
  reconcileTimer = setTimeout(reconcileNow, RECONCILE_DELAY);
};

let statsTimer: ReturnType<typeof setTimeout> | undefined;
const scheduleStatsSave = () => {
  if (statsTimer) return;
  statsTimer = setTimeout(() => {
    statsTimer = undefined;
    chrome.storage.session.set({ [STATS_KEY]: stats });
  }, STATS_SAVE_DELAY);
};

chrome.runtime.onStartup.addListener(() => void ready);
chrome.runtime.onInstalled.addListener(() => void ready);

chrome.tabs.onCreated.addListener(tab => {
  if (tab.id === undefined) return;
  const id = tab.id;
  mutate(async s => {
    const ordinal = windowOrdinals(await liveTabs()).get(tab.windowId) ?? 0;
    const live = {
      id,
      url: tab.url || tab.pendingUrl || '',
      windowId: tab.windowId,
      index: tab.index,
    };
    return recordCreated(s, live, ordinal, Date.now());
  });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  // URL changes update the record's URL; they never reset the tab's age.
  if (changeInfo.url) scheduleReconcile();
});

chrome.tabs.onMoved.addListener(scheduleReconcile);
chrome.tabs.onAttached.addListener(scheduleReconcile);
chrome.tabs.onDetached.addListener(scheduleReconcile);

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  if (stats[removedTabId]) {
    stats[addedTabId] = stats[removedTabId];
    delete stats[removedTabId];
    scheduleStatsSave();
  }
  mutate(s => {
    const records: TabRecords = { ...s.records };
    if (records[removedTabId]) {
      records[addedTabId] = records[removedTabId];
      delete records[removedTabId];
    }
    return { ...s, records };
  });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (stats[tabId]) {
    delete stats[tabId];
    scheduleStatsSave();
  }
  // Tabs closing with their window may be the browser quitting; keep them for restore.
  if (!removeInfo.isWindowClosing) scheduleReconcile();
});

chrome.webRequest.onCompleted.addListener(
  details => {
    const { tabId } = details;
    if (tabId < 0) return;
    ready.then(() => {
      const entry = (stats[tabId] ??= {
        requestCount: 0,
        bytesReceived: 0,
        lastActivity: null,
        firstActivity: null,
      });
      entry.requestCount++;
      entry.lastActivity = details.timeStamp;
      entry.firstActivity ??= details.timeStamp;
      // Cached responses didn't cross the network; content-length is the only size available.
      if (!details.fromCache) {
        const length = details.responseHeaders?.find(
          h => h.name.toLowerCase() === 'content-length'
        );
        const bytes = length?.value ? parseInt(length.value, 10) : 0;
        if (bytes > 0) entry.bytesReceived += bytes;
      }
      scheduleStatsSave();
    });
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.action === 'getSnapshot') {
    clearTimeout(reconcileTimer);
    reconcileNow().then(() => {
      const snapshot: Snapshot = { records: state.records, stats, overrides: screenshotOverrides };
      sendResponse(snapshot);
    });
    return true;
  }

  // Screenshot builds only; compiled out of the production bundle.
  if (import.meta.env.MODE === 'screenshots' && request?.action === 'setFakeData') {
    mutate(s => ({ ...s, records: { ...s.records, ...request.records } })).then(() => {
      stats = request.stats ?? {};
      screenshotOverrides = request.overrides;
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});
