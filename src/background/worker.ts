import type { NetworkStats } from '../types';

// In-memory network stats (lightweight)
const networkStats: NetworkStats = {};

// Track tab creation times
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) {
    chrome.storage.local.set({
      [`tab_${tab.id}_created`]: Date.now()
    });
  }
});

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`tab_${tabId}_created`);
  delete networkStats[tabId];
});

// Track network activity (lightweight - only count and timing)
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const tabId = details.tabId;
    if (tabId === -1) return; // Skip non-tab requests
    
    if (!networkStats[tabId]) {
      networkStats[tabId] = {
        requestCount: 0,
        bytesReceived: 0,
        lastActivity: null,
        firstActivity: null
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

console.log('Autopsy background worker initialized');
