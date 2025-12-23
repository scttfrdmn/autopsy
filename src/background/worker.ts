import type { NetworkStats } from '../types';

// In-memory network stats (lightweight)
const networkStats: NetworkStats = {};

// Tab instance metadata for better age tracking
interface TabInstance {
  url: string;
  windowId: number;
  index: number;
  created: number;
  lastSeen: number;
}

// Create a fingerprint for tab matching across restarts
const createFingerprint = (url: string, windowId: number, index: number): string => {
  return `${url}#${windowId}#${index}`;
};

// Track tab creation times with instance metadata
chrome.tabs.onCreated.addListener(tab => {
  if (tab.id && tab.url) {
    const now = Date.now();
    const fingerprint = createFingerprint(tab.url, tab.windowId, tab.index);

    // Store tab instance data
    chrome.storage.local.set({
      [`tab_${tab.id}_created`]: now,
      [`url_${tab.url}_first_seen`]: now,
      [`instance_${fingerprint}`]: {
        url: tab.url,
        windowId: tab.windowId,
        index: tab.index,
        created: now,
        lastSeen: now,
      } as TabInstance,
    });
  }
});

// Initialize tab ages for existing tabs with improved matching
const initializeTabAges = async () => {
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const storage = await chrome.storage.local.get(null);

  // Clean up old instance data (older than 30 days)
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const keysToRemove: string[] = [];

  for (const key in storage) {
    if (key.startsWith('instance_')) {
      const instance = storage[key] as TabInstance;
      if (instance.lastSeen < thirtyDaysAgo) {
        keysToRemove.push(key);
      }
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }

  // Match existing tabs to stored instances
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;

    const fingerprint = createFingerprint(tab.url, tab.windowId, tab.index);
    let tabAge = now;

    // Try to find matching instance by fingerprint
    const instanceKey = `instance_${fingerprint}`;
    if (storage[instanceKey]) {
      const instance = storage[instanceKey] as TabInstance;
      tabAge = instance.created;

      // Update last seen
      chrome.storage.local.set({
        [instanceKey]: { ...instance, lastSeen: now },
      });
    } else {
      // Try to find similar instance (same URL, different position)
      let bestMatch: TabInstance | null = null;
      let bestMatchAge = now;

      for (const key in storage) {
        if (key.startsWith('instance_') && key.includes(tab.url)) {
          const instance = storage[key] as TabInstance;
          if (instance.url === tab.url && instance.windowId === tab.windowId) {
            // Found a tab with same URL in same window - likely repositioned
            if (instance.created < bestMatchAge) {
              bestMatch = instance;
              bestMatchAge = instance.created;
            }
          }
        }
      }

      if (bestMatch) {
        tabAge = bestMatch.created;
      } else {
        // Fall back to URL first-seen
        const urlKey = `url_${tab.url}_first_seen`;
        if (storage[urlKey]) {
          tabAge = storage[urlKey];
        }
      }

      // Create new instance for this tab
      chrome.storage.local.set({
        [instanceKey]: {
          url: tab.url,
          windowId: tab.windowId,
          index: tab.index,
          created: tabAge,
          lastSeen: now,
        } as TabInstance,
      });
    }

    // Set tab created time
    chrome.storage.local.set({
      [`tab_${tab.id}_created`]: tabAge,
    });
  }
};

// Run on startup and installation
chrome.runtime.onStartup.addListener(initializeTabAges);
chrome.runtime.onInstalled.addListener(initializeTabAges);

// Track URL changes to maintain history
chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.url && tab.id) {
    const now = Date.now();

    // Check if we've seen this URL before
    const result = await chrome.storage.local.get(`url_${tab.url}_first_seen`);
    if (!result[`url_${tab.url}_first_seen`]) {
      // First time seeing this URL
      await chrome.storage.local.set({
        [`url_${tab.url}_first_seen`]: now,
      });
    }

    // Update instance data for URL change
    const fingerprint = createFingerprint(tab.url, tab.windowId, tab.index);
    await chrome.storage.local.set({
      [`instance_${fingerprint}`]: {
        url: tab.url,
        windowId: tab.windowId,
        index: tab.index,
        created: now, // New URL means new instance
        lastSeen: now,
      } as TabInstance,
      [`tab_${tab.id}_created`]: now,
    });
  }
});

// Track tab moves to update instance fingerprints
chrome.tabs.onMoved.addListener(async (tabId, moveInfo) => {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url) return;

  const now = Date.now();
  const oldFingerprint = createFingerprint(tab.url, moveInfo.windowId, moveInfo.fromIndex);
  const newFingerprint = createFingerprint(tab.url, moveInfo.windowId, moveInfo.toIndex);

  // Get existing instance data
  const storage = await chrome.storage.local.get(`instance_${oldFingerprint}`);
  const oldInstance = storage[`instance_${oldFingerprint}`] as TabInstance | undefined;

  if (oldInstance) {
    // Move instance to new fingerprint
    await chrome.storage.local.set({
      [`instance_${newFingerprint}`]: {
        ...oldInstance,
        index: moveInfo.toIndex,
        lastSeen: now,
      },
    });
    await chrome.storage.local.remove(`instance_${oldFingerprint}`);
  }
});

// Track tab attachment (moved between windows)
chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url) return;

  const now = Date.now();
  const newFingerprint = createFingerprint(tab.url, attachInfo.newWindowId, attachInfo.newPosition);

  // Try to find existing instance in old window
  const storage = await chrome.storage.local.get(null);
  let existingInstance: TabInstance | null = null;

  for (const key in storage) {
    if (key.startsWith('instance_')) {
      const instance = storage[key] as TabInstance;
      if (instance.url === tab.url) {
        existingInstance = instance;
        await chrome.storage.local.remove(key);
        break;
      }
    }
  }

  // Create/update instance in new window
  await chrome.storage.local.set({
    [`instance_${newFingerprint}`]: {
      url: tab.url,
      windowId: attachInfo.newWindowId,
      index: attachInfo.newPosition,
      created: existingInstance?.created || now,
      lastSeen: now,
    } as TabInstance,
  });
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener(async tabId => {
  await chrome.storage.local.remove(`tab_${tabId}_created`);
  delete networkStats[tabId];

  // Note: We keep instance data for potential tab restoration
  // Cleanup happens in initializeTabAges (30 day TTL)
});

// Track network activity (lightweight - only count and timing)
chrome.webRequest.onCompleted.addListener(
  details => {
    const tabId = details.tabId;
    if (tabId === -1) return; // Skip non-tab requests

    if (!networkStats[tabId]) {
      networkStats[tabId] = {
        requestCount: 0,
        bytesReceived: 0,
        lastActivity: null,
        firstActivity: null,
      };
    }

    const stats = networkStats[tabId];

    // Update timing
    stats.lastActivity = details.timeStamp;
    if (!stats.firstActivity) {
      stats.firstActivity = details.timeStamp;
    }

    // Update counts
    stats.requestCount++;

    // Try to get content length (not always present)
    if (details.responseHeaders) {
      const contentLength = details.responseHeaders.find(
        h => h.name.toLowerCase() === 'content-length'
      );
      if (contentLength?.value) {
        stats.bytesReceived += parseInt(contentLength.value, 10);
      }
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Expose network stats to popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getNetworkStats') {
    sendResponse({ stats: networkStats });
    return true;
  }
});
