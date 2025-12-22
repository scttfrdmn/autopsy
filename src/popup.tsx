import { useState, useEffect } from 'preact/hooks';
import type { TabMetrics, SortColumn, SortDirection, NetworkStats } from './types';
import './popup.css';

export function App() {
  const [tabs, setTabs] = useState<TabMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('lastAccessed');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [ageFilter, setAgeFilter] = useState<number>(0); // 0 = no filter, value in milliseconds
  const [customAgeDays, setCustomAgeDays] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentlyClosed, setRecentlyClosed] = useState<chrome.tabs.Tab[]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);

  useEffect(() => {
    loadTabData();

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      loadTabData();
    }, 10000);

    // Force re-render every second to update "X ago" displays
    const updateInterval = setInterval(() => {
      setLastUpdated(prev => prev);
    }, 1000);

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Cmd/Ctrl+A - Select all (when not in input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' &&
          !(e.target as HTMLElement).matches('input, textarea')) {
        e.preventDefault();
        toggleSelectAll();
        return;
      }

      // Delete/Backspace - Close selected tabs (when not in input)
      if ((e.key === 'Delete' || e.key === 'Backspace') &&
          !(e.target as HTMLElement).matches('input, textarea') &&
          selectedTabs.size > 0) {
        e.preventDefault();
        closeSelectedTabs();
        return;
      }

      // Escape - Clear search or selection
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (selectedTabs.size > 0) {
          setSelectedTabs(new Set());
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(updateInterval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTabs, searchQuery]);

  const loadTabData = async () => {
    try {
      // Get all tabs
      const allTabs = await chrome.tabs.query({});
      
      // Get network stats from background worker
      const response = await chrome.runtime.sendMessage({ action: 'getNetworkStats' });
      const networkStats: NetworkStats = response.stats || {};
      
      // Get stored creation times
      const storage = await chrome.storage.local.get(null);

      // Build tab metrics
      const metrics: TabMetrics[] = allTabs.map(tab => {
        const createdKey = `tab_${tab.id}_created`;
        const created = storage[createdKey] || null;

        // Get network stats
        const network = networkStats[tab.id!] || {
          requestCount: 0,
          bytesReceived: 0,
          lastActivity: null,
          firstActivity: null
        };
        
        return {
          id: tab.id!,
          title: tab.title || 'Untitled',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl,
          windowId: tab.windowId,
          created,
          lastAccessed: (tab as any).lastAccessed || Date.now(),
          networkActivity: network,
          memoryUsage: null,
          isActive: tab.active || false,
          isPinned: tab.pinned || false,
          isAudible: tab.audible || false
        };
      });
      
      setTabs(metrics);
      setLoading(false);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error loading tab data:', error);
      setLoading(false);
    }
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const filteredTabs = tabs.filter(tab => {
    // Age filter
    if (ageFilter > 0) {
      const age = tab.created ? Date.now() - tab.created : null;
      if (!age || age < ageFilter) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = tab.title.toLowerCase().includes(query);
      const urlMatch = tab.url.toLowerCase().includes(query);
      if (!titleMatch && !urlMatch) return false;
    }

    return true;
  });

  const sortedTabs = [...filteredTabs].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortColumn) {
      case 'title':
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case 'created':
        aVal = a.created || 0;
        bVal = b.created || 0;
        break;
      case 'lastAccessed':
        aVal = a.lastAccessed;
        bVal = b.lastAccessed;
        break;
      case 'memory':
        aVal = a.memoryUsage || 0;
        bVal = b.memoryUsage || 0;
        break;
      case 'networkActivity':
        aVal = a.networkActivity.lastActivity || 0;
        bVal = b.networkActivity.lastActivity || 0;
        break;
      case 'requestCount':
        aVal = a.networkActivity.requestCount;
        bVal = b.networkActivity.requestCount;
        break;
      case 'bytesTransferred':
        aVal = a.networkActivity.bytesReceived;
        bVal = b.networkActivity.bytesReceived;
        break;
      default:
        return 0;
    }
    
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '—';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityStatus = (tab: TabMetrics): 'active' | 'recent' | 'idle' | 'dead' => {
    const now = Date.now();
    const lastNet = tab.networkActivity.lastActivity;
    
    if (!lastNet) return 'dead';
    
    const diff = now - lastNet;
    if (diff < 10000) return 'active'; // < 10 sec
    if (diff < 300000) return 'recent'; // < 5 min
    if (diff < 3600000) return 'idle'; // < 1 hour
    return 'dead';
  };

  const closeFilteredTabs = async () => {
    if (ageFilter === 0 || filteredTabs.length === 0) return;

    if (filteredTabs.length > 5) {
      const confirmed = confirm(`Close ${filteredTabs.length} filtered tabs?`);
      if (!confirmed) return;
    }

    const tabIds = filteredTabs.map(t => t.id);
    await chrome.tabs.remove(tabIds);
    setTabs(tabs.filter(t => !tabIds.includes(t.id)));
    setAgeFilter(0); // Reset filter after closing
  };

  const toggleTabSelection = (tabId: number) => {
    const newSelected = new Set(selectedTabs);
    if (newSelected.has(tabId)) {
      newSelected.delete(tabId);
    } else {
      newSelected.add(tabId);
    }
    setSelectedTabs(newSelected);
  };

  const selectAllDeadTabs = () => {
    const deadTabIds = sortedTabs
      .filter(t => getActivityStatus(t) === 'dead')
      .map(t => t.id);
    setSelectedTabs(new Set(deadTabIds));
  };

  const toggleSelectAll = () => {
    if (selectedTabs.size === sortedTabs.length) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(sortedTabs.map(t => t.id)));
    }
  };

  const closeSelectedTabs = async () => {
    if (selectedTabs.size === 0) return;

    if (selectedTabs.size > 5) {
      const confirmed = confirm(`Close ${selectedTabs.size} tabs?`);
      if (!confirmed) return;
    }

    // Store tabs for undo
    const tabIds = Array.from(selectedTabs);
    const closingTabs = await chrome.tabs.query({});
    const tabsToClose = closingTabs.filter(t => t.id && tabIds.includes(t.id));
    setRecentlyClosed(tabsToClose);
    setShowUndoToast(true);

    // Close tabs
    await chrome.tabs.remove(tabIds);
    setTabs(tabs.filter(t => !tabIds.includes(t.id)));
    setSelectedTabs(new Set());

    // Hide toast after 5 seconds
    setTimeout(() => {
      setShowUndoToast(false);
      setRecentlyClosed([]);
    }, 5000);
  };

  const undoClose = async () => {
    for (const tab of recentlyClosed) {
      await chrome.tabs.create({
        url: tab.url,
        pinned: tab.pinned,
        index: tab.index
      });
    }
    setShowUndoToast(false);
    setRecentlyClosed([]);
    loadTabData();
  };

  if (loading) {
    return (
      <div class="app loading">
        <div class="spinner"></div>
        <p>Analyzing tabs...</p>
      </div>
    );
  }

  const deadTabs = sortedTabs.filter(t => getActivityStatus(t) === 'dead').length;

  return (
    <div class="app">
      <header class="header">
        <div class="header-content">
          <h1>
            <span class="logo">⚕</span>
            Autopsy
          </h1>
          <div class="search-box">
            <input
              type="text"
              class="search-input"
              placeholder="Search tabs..."
              value={searchQuery}
              onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            />
            {searchQuery && (
              <button class="search-clear" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
          <div class="stats">
            <div class="stat">
              <span class="stat-value">{sortedTabs.length}</span>
              <span class="stat-label">{ageFilter > 0 || searchQuery ? 'filtered' : 'tabs'}</span>
            </div>
            <div class="stat warning">
              <span class="stat-value">{deadTabs}</span>
              <span class="stat-label">dead</span>
            </div>
          </div>
        </div>
      </header>

      <div class="table-container">
        <table class="tab-table">
          <thead>
            <tr>
              <th class="col-checkbox">
                <input
                  type="checkbox"
                  checked={sortedTabs.length > 0 && selectedTabs.size === sortedTabs.length}
                  onChange={toggleSelectAll}
                  class="tab-checkbox"
                  title="Select all"
                />
              </th>
              <th class="col-status" title="🟢 Active (10s) | 🔵 Recent (5m) | 🟡 Idle (1h) | 🔴 Dead (>1h)">?</th>
              <th class="col-title" onClick={() => handleSort('title')}>
                Tab {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-time" onClick={() => handleSort('created')}>
                Tab Age {sortColumn === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-timestamp" onClick={() => handleSort('networkActivity')}>
                Last Activity {sortColumn === 'networkActivity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-number" onClick={() => handleSort('requestCount')}>
                Requests {sortColumn === 'requestCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-number" onClick={() => handleSort('bytesTransferred')} title="Network data transferred - high values indicate resource-heavy tabs">
                Data {sortColumn === 'bytesTransferred' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTabs.length === 0 ? (
              <tr>
                <td colSpan={7} class="empty-state">
                  {ageFilter > 0 ? 'No tabs match this age filter' : 'No tabs open'}
                </td>
              </tr>
            ) : (
              sortedTabs.map(tab => {
                const status = getActivityStatus(tab);
                const age = tab.created ? Date.now() - tab.created : null;

                return (
                <tr
                  key={tab.id}
                  class={`tab-row ${status} ${tab.isActive ? 'is-active' : ''} ${selectedTabs.has(tab.id) ? 'selected' : ''}`}
                  onClick={async () => {
                    await chrome.windows.update(tab.windowId, { focused: true });
                    await chrome.tabs.update(tab.id, { active: true });
                  }}
                >
                  <td class="col-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTabs.has(tab.id)}
                      onChange={() => toggleTabSelection(tab.id)}
                      class="tab-checkbox"
                    />
                  </td>
                  <td class="col-status">
                    <div class={`status-indicator ${status}`} title={status}></div>
                  </td>
                  <td class="col-title">
                    <div class="tab-info">
                      {tab.favIconUrl && <img src={tab.favIconUrl} class="favicon" alt="" />}
                      <div class="tab-text">
                        <div class="tab-title">{tab.title}</div>
                        <div class="tab-url">{new URL(tab.url).hostname}</div>
                      </div>
                    </div>
                  </td>
                  <td class="col-time">{formatTime(age)}</td>
                  <td class="col-timestamp">{formatTimestamp(tab.networkActivity.lastActivity)}</td>
                  <td class="col-number">
                    {tab.networkActivity.requestCount ?? 0}
                  </td>
                  <td class="col-number">
                    {formatBytes(tab.networkActivity.bytesReceived)}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="status-indicator active"></div>
          <span>Active (&lt;10s)</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator recent"></div>
          <span>Recent (&lt;5m)</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator idle"></div>
          <span>Idle (&lt;1h)</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator dead"></div>
          <span>Dead (&gt;1h)</span>
        </div>
      </div>

      <footer class="footer">
        <div class="footer-left">
          <button class="btn-select-dead" onClick={selectAllDeadTabs}>
            Select All Dead
          </button>
          {selectedTabs.size > 0 && (
            <button class="btn-close-selected" onClick={closeSelectedTabs}>
              Close {selectedTabs.size} Selected
            </button>
          )}
        </div>
        <div class="footer-right">
          <div class="filter-controls">
            <label class="filter-label">Show tabs older than:</label>
            <select
              class="filter-select"
              value={showCustomInput ? 'custom' : ageFilter}
              onInput={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                if (val === 'custom') {
                  setShowCustomInput(true);
                  setAgeFilter(0);
                } else {
                  setShowCustomInput(false);
                  setAgeFilter(Number(val));
                }
              }}
            >
              <option value="0">All tabs</option>
              <option value={172800000}>2 days</option>
              <option value={604800000}>1 week</option>
              <option value={1209600000}>2 weeks</option>
              <option value={2592000000}>1 month</option>
              <option value="custom">Custom...</option>
            </select>
            {showCustomInput && (
              <>
                <input
                  type="number"
                  class="custom-age-input"
                  placeholder="Days"
                  value={customAgeDays}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setCustomAgeDays(val);
                    const days = parseInt(val, 10);
                    if (!isNaN(days) && days > 0) {
                      setAgeFilter(days * 86400000);
                    } else {
                      setAgeFilter(0);
                    }
                  }}
                  min="1"
                />
                <span class="filter-label">days</span>
              </>
            )}
            {ageFilter > 0 && filteredTabs.length > 0 && (
              <button class="btn-close-filtered" onClick={closeFilteredTabs}>
                Close {filteredTabs.length} Filtered
              </button>
            )}
          </div>
          <div class="refresh-section">
            <button class="btn-refresh" onClick={loadTabData}>
              ↻ Refresh
            </button>
            <span class="last-updated">
              Updated {formatTime(Date.now() - lastUpdated)}
            </span>
          </div>
        </div>
      </footer>

      {showUndoToast && (
        <div class="undo-toast">
          <span>Closed {recentlyClosed.length} tab{recentlyClosed.length !== 1 ? 's' : ''}</span>
          <button class="btn-undo" onClick={undoClose}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
