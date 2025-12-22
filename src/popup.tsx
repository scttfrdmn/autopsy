import { useState, useEffect } from 'preact/hooks';
import type { TabMetrics, SortColumn, SortDirection, NetworkStats } from './types';
import './popup.css';

export function App() {
  const [tabs, setTabs] = useState<TabMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('lastAccessed');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [ageFilter, setAgeFilter] = useState<number>(0); // 0 = no filter, value in milliseconds
  const [selectedTabs, setSelectedTabs] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadTabData();
  }, []);

  const loadTabData = async () => {
    try {
      // Get all tabs
      const allTabs = await chrome.tabs.query({});
      
      // Get network stats from background worker
      const response = await chrome.runtime.sendMessage({ action: 'getNetworkStats' });
      const networkStats: NetworkStats = response.stats || {};
      
      // Get stored creation times
      const storage = await chrome.storage.local.get(null);
      
      // Get memory info
      let processes: { [key: string]: any } = {};
      try {
        processes = await (chrome as any).processes.getProcessInfo([], true);
      } catch (e) {
        console.warn('Memory info unavailable:', e);
      }
      
      // Build tab metrics
      const metrics: TabMetrics[] = allTabs.map(tab => {
        const createdKey = `tab_${tab.id}_created`;
        const created = storage[createdKey] || null;
        
        // Find process for memory usage
        let memoryUsage: number | null = null;
        if (tab.id) {
          const process = Object.values(processes).find(p => 
            p.tabs && p.tabs.includes(tab.id!)
          );
          memoryUsage = process?.privateMemory || null;
        }
        
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
          memoryUsage,
          isActive: tab.active || false,
          isPinned: tab.pinned || false,
          isAudible: tab.audible || false
        };
      });
      
      setTabs(metrics);
      setLoading(false);
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

  const filteredTabs = ageFilter > 0
    ? tabs.filter(tab => {
        const age = tab.created ? Date.now() - tab.created : null;
        return age !== null && age >= ageFilter;
      })
    : tabs;

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

  const closeSelectedTabs = async () => {
    if (selectedTabs.size === 0) return;

    const tabIds = Array.from(selectedTabs);
    await chrome.tabs.remove(tabIds);
    setTabs(tabs.filter(t => !tabIds.includes(t.id)));
    setSelectedTabs(new Set());
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
  const totalMemory = sortedTabs.reduce((sum, t) => sum + (t.memoryUsage || 0), 0);

  return (
    <div class="app">
      <header class="header">
        <div class="header-content">
          <h1>
            <span class="logo">⚕</span>
            Autopsy
          </h1>
          <div class="stats">
            <div class="stat">
              <span class="stat-value">{sortedTabs.length}</span>
              <span class="stat-label">{ageFilter > 0 ? 'filtered' : 'tabs'}</span>
            </div>
            <div class="stat warning">
              <span class="stat-value">{deadTabs}</span>
              <span class="stat-label">dead</span>
            </div>
            <div class="stat">
              <span class="stat-value">{formatBytes(totalMemory)}</span>
              <span class="stat-label">memory</span>
            </div>
          </div>
        </div>
      </header>

      <div class="table-container">
        <table class="tab-table">
          <thead>
            <tr>
              <th class="col-checkbox"></th>
              <th class="col-status" title="🟢 Active (10s) | 🔵 Recent (5m) | 🟡 Idle (1h) | 🔴 Dead (>1h)">?</th>
              <th class="col-title" onClick={() => handleSort('title')}>
                Tab {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-timestamp" onClick={() => handleSort('created')}>
                Opened {sortColumn === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-time" onClick={() => handleSort('created')}>
                Age {sortColumn === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-timestamp" onClick={() => handleSort('networkActivity')}>
                Last Activity {sortColumn === 'networkActivity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-number" onClick={() => handleSort('requestCount')}>
                Requests {sortColumn === 'requestCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-number" onClick={() => handleSort('bytesTransferred')}>
                Data {sortColumn === 'bytesTransferred' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-memory" onClick={() => handleSort('memory')}>
                Memory {sortColumn === 'memory' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTabs.map(tab => {
              const status = getActivityStatus(tab);
              const age = tab.created ? Date.now() - tab.created : null;
              
              return (
                <tr
                  key={tab.id}
                  class={`tab-row ${status} ${tab.isActive ? 'is-active' : ''} ${selectedTabs.has(tab.id) ? 'selected' : ''}`}
                  onClick={() => toggleTabSelection(tab.id)}
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
                  <td class="col-timestamp">{formatTimestamp(tab.created)}</td>
                  <td class="col-time">{formatTime(age)}</td>
                  <td class="col-timestamp">{formatTimestamp(tab.networkActivity.lastActivity)}</td>
                  <td class="col-number">
                    {tab.networkActivity.requestCount || '—'}
                  </td>
                  <td class="col-number">
                    {formatBytes(tab.networkActivity.bytesReceived)}
                  </td>
                  <td class="col-memory">{formatBytes(tab.memoryUsage)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
              value={ageFilter}
              onInput={(e) => setAgeFilter(Number((e.target as HTMLSelectElement).value))}
            >
              <option value="0">All tabs</option>
              <option value={172800000}>2 days</option>
              <option value={604800000}>1 week</option>
              <option value={1209600000}>2 weeks</option>
              <option value={2592000000}>1 month</option>
            </select>
            {ageFilter > 0 && filteredTabs.length > 0 && (
              <button class="btn-close-filtered" onClick={closeFilteredTabs}>
                Close {filteredTabs.length} Filtered
              </button>
            )}
          </div>
          <button class="btn-refresh" onClick={loadTabData}>
            ↻ Refresh
          </button>
        </div>
      </footer>
    </div>
  );
}
