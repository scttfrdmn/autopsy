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
  const [groupBy, setGroupBy] = useState<'none' | 'domain' | 'window' | 'status'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [popupWidth, setPopupWidth] = useState(800);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');

  useEffect(() => {
    // Load saved preferences
    chrome.storage.local.get(['popupWidth', 'theme']).then(result => {
      if (result.popupWidth) {
        setPopupWidth(result.popupWidth);
      }
      if (result.theme) {
        setTheme(result.theme);
      }
    });

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
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === 'a' &&
        !(e.target as HTMLElement).matches('input, textarea')
      ) {
        e.preventDefault();
        toggleSelectAll();
        return;
      }

      // Delete/Backspace - Close selected tabs (when not in input)
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !(e.target as HTMLElement).matches('input, textarea') &&
        selectedTabs.size > 0
      ) {
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

      // Get tab groups
      const tabGroups = await chrome.tabGroups.query({});
      const groupMap = new Map(tabGroups.map(g => [g.id, g]));

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
          firstActivity: null,
        };

        // Get tab group info
        const group =
          tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && groupMap.get(tab.groupId)
            ? groupMap.get(tab.groupId)!
            : null;

        return {
          id: tab.id!,
          title: tab.title || 'Untitled',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl,
          windowId: tab.windowId,
          created,
          lastAccessed:
            (tab as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed || Date.now(),
          networkActivity: network,
          memoryUsage: null,
          isActive: tab.active || false,
          isPinned: tab.pinned || false,
          isAudible: tab.audible || false,
          isDiscarded: tab.discarded || false,
          groupInfo: group
            ? {
                id: group.id,
                title: group.title,
                color: group.color,
              }
            : null,
        };
      });

      setTabs(metrics);
      setLoading(false);
      setLastUpdated(Date.now());
    } catch {
      // Silently fail - extension will retry
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
    let aVal: string | number;
    let bVal: string | number;

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

  // Group tabs based on groupBy mode
  const groupedTabs =
    groupBy !== 'none'
      ? sortedTabs.reduce(
          (groups, tab) => {
            let groupKey: string;

            if (groupBy === 'domain') {
              groupKey = new URL(tab.url).hostname;
            } else if (groupBy === 'window') {
              groupKey = `window-${tab.windowId}`;
            } else if (groupBy === 'status') {
              groupKey = getActivityStatus(tab);
            } else {
              groupKey = 'other';
            }

            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push(tab);
            return groups;
          },
          {} as Record<string, TabMetrics[]>
        )
      : {};

  const sortedGroups = Object.entries(groupedTabs).sort(([keyA, tabsA], [keyB, tabsB]) => {
    // For status grouping, sort by priority: active > recent > idle > dead
    if (groupBy === 'status') {
      const statusOrder = { active: 0, recent: 1, idle: 2, dead: 3 };
      return (
        statusOrder[keyA as keyof typeof statusOrder] -
        statusOrder[keyB as keyof typeof statusOrder]
      );
    }
    // For other grouping modes, sort by tab count (descending)
    return tabsB.length - tabsA.length;
  });

  const toggleGroup = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey);
    } else {
      newCollapsed.add(groupKey);
    }
    setCollapsedGroups(newCollapsed);
  };

  const selectGroup = (groupKey: string) => {
    const groupTabs = groupedTabs[groupKey] || [];
    setSelectedTabs(new Set(groupTabs.map(t => t.id)));
  };

  const cycleGroupMode = () => {
    const modes: Array<'none' | 'domain' | 'window' | 'status'> = [
      'none',
      'domain',
      'window',
      'status',
    ];
    const currentIndex = modes.indexOf(groupBy);
    const nextIndex = (currentIndex + 1) % modes.length;
    setGroupBy(modes[nextIndex]);
    setCollapsedGroups(new Set()); // Clear collapsed state when changing mode
  };

  const getGroupLabel = (groupKey: string): string => {
    if (groupBy === 'domain') {
      return groupKey;
    } else if (groupBy === 'window') {
      const windowId = parseInt(groupKey.replace('window-', ''));
      const windowTabs = sortedTabs.filter(t => t.windowId === windowId);
      const focused = windowTabs.some(t => t.isActive);
      return `Window ${windowId}${focused ? ' (Current)' : ''}`;
    } else if (groupBy === 'status') {
      const statusLabels = {
        active: 'Active (<10s)',
        recent: 'Recent (<5m)',
        idle: 'Idle (<1h)',
        dead: 'Dead (>1h)',
      };
      return statusLabels[groupKey as keyof typeof statusLabels] || groupKey;
    }
    return groupKey;
  };

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
      minute: '2-digit',
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

  const findDuplicates = () => {
    const urlMap = new Map<string, TabMetrics[]>();
    tabs.forEach(tab => {
      const url = tab.url;
      if (!urlMap.has(url)) {
        urlMap.set(url, []);
      }
      urlMap.get(url)!.push(tab);
    });

    // Return only URLs with duplicates
    return Array.from(urlMap.entries())
      .filter(([, tabs]) => tabs.length > 1)
      .map(([url, tabs]) => ({ url, tabs }));
  };

  const closeDuplicates = async () => {
    const duplicates = findDuplicates();
    if (duplicates.length === 0) {
      alert('No duplicate tabs found');
      return;
    }

    // Keep newest tab of each duplicate set, close older ones
    const tabsToClose: number[] = [];
    duplicates.forEach(({ tabs: dupTabs }) => {
      // Sort by created time, keep newest
      const sorted = [...dupTabs].sort((a, b) => (b.created || 0) - (a.created || 0));
      // Close all except the first (newest)
      sorted.slice(1).forEach(tab => tabsToClose.push(tab.id));
    });

    const confirmed = confirm(
      `Close ${tabsToClose.length} duplicate tabs? (Keeping newest of each)`
    );
    if (!confirmed) return;

    await chrome.tabs.remove(tabsToClose);
    setTabs(tabs.filter(t => !tabsToClose.includes(t.id)));
  };

  const bulkPin = async () => {
    if (selectedTabs.size === 0) return;
    const tabIds = Array.from(selectedTabs);
    await Promise.all(tabIds.map(id => chrome.tabs.update(id, { pinned: true })));
    setTabs(tabs.map(t => (tabIds.includes(t.id) ? { ...t, isPinned: true } : t)));
  };

  const bulkUnpin = async () => {
    if (selectedTabs.size === 0) return;
    const tabIds = Array.from(selectedTabs);
    await Promise.all(tabIds.map(id => chrome.tabs.update(id, { pinned: false })));
    setTabs(tabs.map(t => (tabIds.includes(t.id) ? { ...t, isPinned: false } : t)));
  };

  const moveToNewWindow = async () => {
    if (selectedTabs.size === 0) return;

    const tabIds = Array.from(selectedTabs);
    const firstTabId = tabIds[0];

    // Create new window with first tab
    const newWindow = await chrome.windows.create({ tabId: firstTabId });

    // Move remaining tabs to new window
    if (tabIds.length > 1) {
      await chrome.tabs.move(tabIds.slice(1), { windowId: newWindow.id, index: -1 });
    }

    // Clear selection and refresh
    setSelectedTabs(new Set());
    loadTabData();
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
    const deadTabIds = sortedTabs.filter(t => getActivityStatus(t) === 'dead').map(t => t.id);
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
        index: tab.index,
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

  const saveWidth = async (width: number) => {
    setPopupWidth(width);
    await chrome.storage.local.set({ popupWidth: width });
  };

  const getEffectiveTheme = (): 'dark' | 'light' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return theme;
  };

  const cycleTheme = async () => {
    const modes: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
    const currentIndex = modes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newTheme = modes[nextIndex];
    setTheme(newTheme);
    await chrome.storage.local.set({ theme: newTheme });
  };

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme();
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [theme]);

  const exportToCSV = () => {
    const headers = [
      'Tab ID',
      'Title',
      'URL',
      'Domain',
      'Window ID',
      'Tab Age (days)',
      'Last Accessed',
      'Status',
      'Is Pinned',
      'Is Audible',
      'Is Discarded',
      'Group',
      'Request Count',
      'Bytes Transferred',
      'Last Network Activity',
    ];

    const rows = sortedTabs.map(tab => {
      const status = getActivityStatus(tab);
      const age = tab.created ? (Date.now() - tab.created) / (1000 * 60 * 60 * 24) : null;
      const domain = new URL(tab.url).hostname;

      return [
        tab.id,
        `"${tab.title.replace(/"/g, '""')}"`, // Escape quotes
        `"${tab.url}"`,
        domain,
        tab.windowId,
        age ? age.toFixed(2) : '',
        tab.lastAccessed ? new Date(tab.lastAccessed).toISOString() : '',
        status,
        tab.isPinned ? 'Yes' : 'No',
        tab.isAudible ? 'Yes' : 'No',
        tab.isDiscarded ? 'Yes' : 'No',
        tab.groupInfo?.title || '',
        tab.networkActivity.requestCount,
        tab.networkActivity.bytesReceived,
        tab.networkActivity.lastActivity
          ? new Date(tab.networkActivity.lastActivity).toISOString()
          : '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(csv, `autopsy-export-${timestamp}.csv`, 'text/csv');
  };

  const exportToJSON = () => {
    const data = sortedTabs.map(tab => {
      const status = getActivityStatus(tab);
      const age = tab.created ? Date.now() - tab.created : null;
      const domain = new URL(tab.url).hostname;

      return {
        id: tab.id,
        title: tab.title,
        url: tab.url,
        domain,
        windowId: tab.windowId,
        ageMs: age,
        ageDays: age ? (age / (1000 * 60 * 60 * 24)).toFixed(2) : null,
        created: tab.created,
        lastAccessed: tab.lastAccessed,
        status,
        isPinned: tab.isPinned,
        isAudible: tab.isAudible,
        isDiscarded: tab.isDiscarded,
        group: tab.groupInfo
          ? {
              id: tab.groupInfo.id,
              title: tab.groupInfo.title,
              color: tab.groupInfo.color,
            }
          : null,
        networkActivity: {
          requestCount: tab.networkActivity.requestCount,
          bytesReceived: tab.networkActivity.bytesReceived,
          lastActivity: tab.networkActivity.lastActivity,
          firstActivity: tab.networkActivity.firstActivity,
        },
      };
    });

    const json = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(json, `autopsy-export-${timestamp}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTabRow = (tab: TabMetrics) => {
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
        role="row"
        aria-label={`${tab.title}, ${status}`}
      >
        <td class="col-checkbox" onClick={e => e.stopPropagation()} role="cell">
          <input
            type="checkbox"
            checked={selectedTabs.has(tab.id)}
            onChange={() => toggleTabSelection(tab.id)}
            class="tab-checkbox"
            aria-label={`Select ${tab.title}`}
          />
        </td>
        <td class="col-status" role="cell">
          <div
            class={`status-indicator ${status}`}
            role="img"
            aria-label={`Status: ${status}`}
            title={status}
          ></div>
        </td>
        <td class="col-title">
          <div class="tab-info">
            {tab.favIconUrl && <img src={tab.favIconUrl} class="favicon" alt="" />}
            <div class="tab-text">
              <div class="tab-title">
                {tab.groupInfo && (
                  <span
                    class={`group-indicator group-${tab.groupInfo.color}`}
                    title={tab.groupInfo.title || `Group (${tab.groupInfo.color})`}
                    aria-label={`Tab group: ${tab.groupInfo.title || tab.groupInfo.color}`}
                  ></span>
                )}
                {tab.title}
                {tab.isDiscarded && (
                  <span class="suspended-badge" title="Tab suspended by Chrome to save memory">
                    💤
                  </span>
                )}
              </div>
              <div class="tab-url">{new URL(tab.url).hostname}</div>
            </div>
          </div>
        </td>
        <td class="col-time">{formatTime(age)}</td>
        <td class="col-timestamp">{formatTimestamp(tab.networkActivity.lastActivity)}</td>
        <td class="col-number">{tab.networkActivity.requestCount ?? 0}</td>
        <td class="col-number">{formatBytes(tab.networkActivity.bytesReceived)}</td>
      </tr>
    );
  };

  return (
    <div class="app" role="main" style={`width: ${popupWidth}px`}>
      <header class="header" role="banner">
        <div class="header-content">
          <h1>
            <span class="logo" aria-hidden="true">
              ⚕
            </span>
            Autopsy
          </h1>
          <div class="search-box" role="search">
            <input
              type="text"
              class="search-input"
              placeholder="Search tabs..."
              value={searchQuery}
              onInput={e => setSearchQuery((e.target as HTMLInputElement).value)}
              aria-label="Search tabs by title or URL"
            />
            {searchQuery && (
              <button
                class="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            class={`btn-group-toggle ${groupBy !== 'none' ? 'active' : ''}`}
            onClick={cycleGroupMode}
            aria-label={`Cycle grouping mode (current: ${groupBy})`}
            title={`Group by: ${groupBy} (click to cycle)`}
          >
            {groupBy === 'none'
              ? '⚏'
              : groupBy === 'domain'
                ? '🌐'
                : groupBy === 'window'
                  ? '🪟'
                  : '📊'}
          </button>
          <button
            class="btn-theme-toggle"
            onClick={cycleTheme}
            aria-label={`Cycle theme (current: ${theme})`}
            title={`Theme: ${theme} (click to cycle)`}
          >
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
          </button>
          <div class="stats" role="status" aria-live="polite">
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

      <div class="table-container" role="region" aria-label="Tab list">
        <table class="tab-table" role="table">
          <thead>
            <tr>
              <th class="col-checkbox">
                <input
                  type="checkbox"
                  checked={sortedTabs.length > 0 && selectedTabs.size === sortedTabs.length}
                  onChange={toggleSelectAll}
                  class="tab-checkbox"
                  aria-label="Select all tabs"
                  title="Select all"
                />
              </th>
              <th
                class="col-status"
                title="Status indicator: circle=active, diamond=recent, square=idle, x=dead"
              >
                <span aria-label="Status">?</span>
              </th>
              <th class="col-title" onClick={() => handleSort('title')}>
                Tab {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-time" onClick={() => handleSort('created')}>
                Tab Age {sortColumn === 'created' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-timestamp" onClick={() => handleSort('networkActivity')}>
                Last Activity{' '}
                {sortColumn === 'networkActivity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th class="col-number" onClick={() => handleSort('requestCount')}>
                Requests {sortColumn === 'requestCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                class="col-number"
                onClick={() => handleSort('bytesTransferred')}
                title="Network data transferred - high values indicate resource-heavy tabs"
              >
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
            ) : groupBy !== 'none' ? (
              // Grouped view
              sortedGroups.map(([groupKey, tabs]) => {
                const isCollapsed = collapsedGroups.has(groupKey);
                const groupLabel = getGroupLabel(groupKey);
                return (
                  <>
                    <tr class="group-header" key={`group-${groupKey}`}>
                      <td
                        colSpan={7}
                        onClick={() => toggleGroup(groupKey)}
                        class="group-header-cell"
                      >
                        <span class="group-toggle">{isCollapsed ? '▸' : '▾'}</span>
                        <span class="group-name">{groupLabel}</span>
                        <span class="group-count">({tabs.length})</span>
                        <button
                          class="btn-select-group"
                          onClick={e => {
                            e.stopPropagation();
                            selectGroup(groupKey);
                          }}
                          aria-label={`Select all ${tabs.length} tabs from ${groupLabel}`}
                        >
                          Select All
                        </button>
                      </td>
                    </tr>
                    {!isCollapsed && tabs.map(tab => renderTabRow(tab))}
                  </>
                );
              })
            ) : (
              // Flat view
              sortedTabs.map(tab => renderTabRow(tab))
            )}
          </tbody>
        </table>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="status-indicator active"></div>
          <span>● Active (&lt;10s)</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator recent"></div>
          <span>◆ Recent (&lt;5m)</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator idle"></div>
          <span>■ Idle (&lt;1h)</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator dead"></div>
          <span>✕ Dead (&gt;1h)</span>
        </div>
      </div>

      <footer class="footer" role="contentinfo">
        <div class="footer-left">
          <button
            class="btn-select-dead"
            onClick={selectAllDeadTabs}
            aria-label="Select all dead tabs"
          >
            Select All Dead
          </button>
          {selectedTabs.size > 0 && (
            <>
              <button
                class="btn-bulk-action"
                onClick={bulkPin}
                aria-label={`Pin ${selectedTabs.size} selected tabs`}
              >
                📌 Pin
              </button>
              <button
                class="btn-bulk-action"
                onClick={bulkUnpin}
                aria-label={`Unpin ${selectedTabs.size} selected tabs`}
              >
                📌̸ Unpin
              </button>
              <button
                class="btn-bulk-action"
                onClick={moveToNewWindow}
                aria-label={`Move ${selectedTabs.size} selected tabs to new window`}
              >
                🪟 Move to Window
              </button>
              <button
                class="btn-close-selected"
                onClick={closeSelectedTabs}
                aria-label={`Close ${selectedTabs.size} selected tabs`}
              >
                Close {selectedTabs.size} Selected
              </button>
            </>
          )}
          <button
            class="btn-close-duplicates"
            onClick={closeDuplicates}
            aria-label="Close duplicate tabs"
          >
            Close Duplicates
          </button>
        </div>
        <div class="footer-right">
          <div class="filter-controls">
            <label class="filter-label" htmlFor="age-filter">
              Show tabs older than:
            </label>
            <select
              id="age-filter"
              class="filter-select"
              value={showCustomInput ? 'custom' : ageFilter}
              aria-label="Filter tabs by age"
              onInput={e => {
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
                  aria-label="Custom age in days"
                  onInput={e => {
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
              <button
                class="btn-close-filtered"
                onClick={closeFilteredTabs}
                aria-label={`Close ${filteredTabs.length} filtered tabs`}
              >
                Close {filteredTabs.length} Filtered
              </button>
            )}
          </div>
          <div class="refresh-section">
            <button class="btn-refresh" onClick={loadTabData} aria-label="Refresh tab data">
              ↻ Refresh
            </button>
            <span class="last-updated">Updated {formatTime(Date.now() - lastUpdated)}</span>
          </div>
          <div class="width-controls">
            <label class="filter-label">Width:</label>
            <button
              class={`btn-width ${popupWidth === 600 ? 'active' : ''}`}
              onClick={() => saveWidth(600)}
              aria-label="Set small width"
            >
              S
            </button>
            <button
              class={`btn-width ${popupWidth === 800 ? 'active' : ''}`}
              onClick={() => saveWidth(800)}
              aria-label="Set medium width"
            >
              M
            </button>
            <button
              class={`btn-width ${popupWidth === 1000 ? 'active' : ''}`}
              onClick={() => saveWidth(1000)}
              aria-label="Set large width"
            >
              L
            </button>
          </div>
          <div class="export-controls">
            <label class="filter-label">Export:</label>
            <button
              class="btn-export"
              onClick={exportToCSV}
              aria-label="Export tab data to CSV"
              title="Export to CSV for spreadsheet analysis"
            >
              📊 CSV
            </button>
            <button
              class="btn-export"
              onClick={exportToJSON}
              aria-label="Export tab data to JSON"
              title="Export to JSON for programmatic processing"
            >
              📄 JSON
            </button>
          </div>
        </div>
      </footer>

      {showUndoToast && (
        <div class="undo-toast" role="alert" aria-live="assertive">
          <span>
            Closed {recentlyClosed.length} tab{recentlyClosed.length !== 1 ? 's' : ''}
          </span>
          <button
            class="btn-undo"
            onClick={undoClose}
            aria-label={`Undo close ${recentlyClosed.length} tabs`}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
