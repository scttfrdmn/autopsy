import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { GroupBy, ShowFilter, SortColumn, SortDirection, TabMetrics } from '../types';
import { CONFIRM_THRESHOLD, DEFAULT_COLUMN_WIDTHS, UNDO_TIMEOUT } from '../lib/constants';
import { plural } from '../lib/format';
import { getStaleness } from '../lib/status';
import { downloadFile, toCSV, toJSON } from '../lib/export';
import {
  closable,
  duplicatesToClose,
  filterTabs,
  groupTabs,
  sortTabs,
  visibleIds,
} from '../lib/view';
import {
  activateTab,
  closeTabs,
  moveToNewWindow,
  restoreTabs,
  setPinned,
  type ClosedTab,
} from './actions';
import { usePreferences } from './hooks/usePreferences';
import { useTabs } from './hooks/useTabs';
import { useNow } from './hooks/useNow';
import { useTheme } from './hooks/useTheme';
import { Controls, Footer, Toolbar } from './components/Bars';
import { ConfirmDialog, HelpDialog, UndoToast, type ConfirmRequest } from './components/Dialogs';
import { Menu } from './components/Menu';
import { TabTable } from './components/TabTable';
import './popup.css';

/** Direction a column sorts in when first clicked: the end most useful for finding tabs to close. */
const DEFAULT_DIRECTION: Record<SortColumn, SortDirection> = {
  title: 'asc',
  age: 'desc',
  lastViewed: 'asc',
  network: 'desc',
  data: 'desc',
};

export function App() {
  const { prefs, loaded, update } = usePreferences();
  const data = useTabs();
  const now = useNow();
  useTheme(prefs.theme);

  const [search, setSearch] = useState('');
  const [show, setShow] = useState<ShowFilter>('all');
  const [minAge, setMinAge] = useState(0);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focusedId, setFocusedId] = useState<number | null>(null);
  // Mirrors focusedId synchronously so keys pressed faster than re-renders still see the latest row.
  const focusedRef = useRef<number | null>(null);
  const setFocus = useCallback((id: number | null) => {
    focusedRef.current = id;
    setFocusedId(id);
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [undo, setUndo] = useState<{ message: string; tabs: ClosedTab[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // --- Derived view -------------------------------------------------------
  const filtered = useMemo(
    () => filterTabs(data.tabs, { search, minAge, show }, now),
    [data.tabs, search, minAge, show, now]
  );
  const groups = useMemo(
    () =>
      groupTabs(
        sortTabs(filtered, prefs.sortColumn, prefs.sortDirection, now),
        groupBy,
        { windowIds: data.windowIds, focusedWindowId: data.focusedWindowId },
        now
      ),
    [
      filtered,
      prefs.sortColumn,
      prefs.sortDirection,
      groupBy,
      data.windowIds,
      data.focusedWindowId,
      now,
    ]
  );
  const visible = useMemo(() => visibleIds(groups, collapsed), [groups, collapsed]);
  const visibleTabs = useMemo(() => {
    const byId = new Map(data.tabs.map(t => [t.id, t]));
    return visible.map(id => byId.get(id)!);
  }, [visible, data.tabs]);

  const selectedTabs = useMemo(
    () => visibleTabs.filter(t => selected.has(t.id)),
    [visibleTabs, selected]
  );
  const closableSelected = closable(selectedTabs, prefs.protectPinned);
  const staleIds = closable(visibleTabs, prefs.protectPinned)
    .filter(t => getStaleness(t, now) === 'stale')
    .map(t => t.id);
  const duplicateIds = useMemo(
    () => duplicatesToClose(visibleTabs, prefs.protectPinned),
    [visibleTabs, prefs.protectPinned]
  );
  const filtersActive = search.trim() !== '' || show !== 'all' || minAge > 0;

  // Bulk actions only ever apply to tabs the user can see.
  useEffect(() => {
    const ids = new Set(visible);
    setSelected(prev => {
      const next = new Set([...prev].filter(id => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
    if (focusedRef.current !== null && !ids.has(focusedRef.current)) setFocus(null);
  }, [visible, setFocus]);

  // Give the focused row real DOM focus so screen readers and scrolling follow it.
  useEffect(() => {
    // Skip if a faster keypress already moved focus on; focusing this row would pull it back.
    if (focusedId === null || focusedRef.current !== focusedId) return;
    const row = tableRef.current?.querySelector<HTMLElement>(`tr[data-tab-id="${focusedId}"]`);
    if (row && document.activeElement !== row) row.focus({ preventScroll: true });
    row?.scrollIntoView({ block: 'nearest' });
  }, [focusedId]);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), UNDO_TIMEOUT);
    return () => clearTimeout(id);
  }, [undo]);

  // --- Actions ------------------------------------------------------------
  const doClose = async (ids: number[]) => {
    if (ids.length === 0) return;
    const closed = await closeTabs(ids);
    setSelected(prev => new Set([...prev].filter(id => !ids.includes(id))));
    setUndo({ message: `Closed ${plural(ids.length, 'tab')}`, tabs: closed });
    data.refresh();
  };

  const requestClose = (ids: number[], detail?: string) => {
    if (ids.length > CONFIRM_THRESHOLD || detail) {
      setConfirm({
        message: `Close ${plural(ids.length, 'tab')}?`,
        detail: detail ?? 'You can undo this for a few seconds.',
        actionLabel: `Close ${ids.length}`,
        onConfirm: () => doClose(ids),
      });
    } else {
      doClose(ids);
    }
  };

  const handleUndo = async () => {
    if (!undo) return;
    const tabs = undo.tabs;
    setUndo(null);
    await restoreTabs(tabs);
    data.refresh();
  };

  const closeDuplicates = () =>
    requestClose(
      duplicateIds,
      `Keeps the copy of each page you viewed most recently${prefs.protectPinned ? ' and all pinned tabs' : ''}. You can undo this for a few seconds.`
    );

  const toggleAll = () =>
    setSelected(selected.size === visible.length ? new Set() : new Set(visible));

  const clearFilters = () => {
    setSearch('');
    setShow('all');
    setMinAge(0);
  };

  const focusSearch = () => {
    setFocus(null);
    const input = searchRef.current?.querySelector('input');
    input?.focus();
    input?.select();
  };

  const moveFocus = (target: number | 'first' | 'last') => {
    if (visible.length === 0) return;
    const focused = focusedRef.current;
    const current = focused === null ? -1 : visible.indexOf(focused);
    let next: number;
    if (target === 'first') next = 0;
    else if (target === 'last') next = visible.length - 1;
    else if (current === -1) next = target > 0 ? 0 : visible.length - 1;
    else next = Math.min(visible.length - 1, Math.max(0, current + target));
    setFocus(visible[next]);
  };

  const exportTabs = (format: 'csv' | 'json') => {
    const date = new Date().toISOString().slice(0, 10);
    if (format === 'csv') downloadFile(toCSV(visibleTabs, now), `autopsy-${date}.csv`, 'text/csv');
    else downloadFile(toJSON(visibleTabs, now), `autopsy-${date}.json`, 'application/json');
  };

  const handleSort = (column: SortColumn) => {
    if (prefs.sortColumn === column) {
      update({ sortDirection: prefs.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      update({ sortColumn: column, sortDirection: DEFAULT_DIRECTION[column] });
    }
  };

  // Stable callbacks for memoized rows.
  const onToggle = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const onActivate = useCallback((tab: TabMetrics) => {
    activateTab(tab.id, tab.windowId);
  }, []);
  const closeRef = useRef(doClose);
  useLayoutEffect(() => {
    closeRef.current = doClose;
  });
  const onCloseRow = useCallback((id: number) => closeRef.current([id]), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // --- Keyboard -----------------------------------------------------------
  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const inField = target.matches('input[type="search"], input[type="text"], textarea, select');
    const onControl = target.matches('button, input, select, a');
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key;
    const handled = () => e.preventDefault();
    const focusedId = focusedRef.current;

    if (confirm) {
      if (key === 'Escape') {
        handled();
        setConfirm(null);
      }
      return;
    }
    if (helpOpen) {
      if (key === 'Escape' || key === '?') {
        handled();
        setHelpOpen(false);
      }
      return;
    }
    if (menuOpen) {
      if (key === 'Escape') {
        handled();
        setMenuOpen(false);
      }
      return;
    }

    if (mod && key.toLowerCase() === 'f') {
      handled();
      focusSearch();
      return;
    }
    if (mod && key.toLowerCase() === 'z' && !inField && undo) {
      handled();
      handleUndo();
      return;
    }
    if (key === 'Escape') {
      if (focusedId !== null) {
        handled();
        setFocus(null);
        (document.activeElement as HTMLElement | null)?.blur();
      } else if (search) {
        handled();
        setSearch('');
      } else if (selected.size > 0) {
        handled();
        setSelected(new Set());
      }
      return;
    }
    if (inField) {
      if (key === 'ArrowDown' && target.matches('input[type="search"]')) {
        handled();
        moveFocus('first');
      }
      return;
    }

    if (key === '?') {
      handled();
      setHelpOpen(true);
    } else if (key === '/') {
      handled();
      focusSearch();
    } else if (mod && key.toLowerCase() === 'a') {
      handled();
      toggleAll();
    } else if (key === 'ArrowDown' || key === 'j') {
      handled();
      moveFocus(1);
    } else if (key === 'ArrowUp' || key === 'k') {
      handled();
      moveFocus(-1);
    } else if (key === 'Home') {
      handled();
      moveFocus('first');
    } else if (key === 'End') {
      handled();
      moveFocus('last');
    } else if (onControl) {
      // Let buttons and checkboxes handle Space and Enter themselves.
    } else if (key === ' ' && focusedId !== null) {
      handled();
      onToggle(focusedId);
    } else if (key === 'Enter' && focusedId !== null) {
      handled();
      const tab = visibleTabs.find(t => t.id === focusedId);
      if (tab) onActivate(tab);
    } else if (key === 'Delete' || key === 'Backspace') {
      if (selected.size > 0) {
        handled();
        requestClose(closableSelected.map(t => t.id));
      } else if (focusedId !== null) {
        handled();
        moveFocus(1);
        doClose([focusedId]);
      }
    }
  };

  const keyRef = useRef(onKeyDown);
  useLayoutEffect(() => {
    keyRef.current = onKeyDown;
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  // --- Render -------------------------------------------------------------
  const ready = loaded && !data.loading;

  return (
    <div class="app" style={{ width: `${prefs.popupWidth}px` }}>
      <div ref={searchRef}>
        <Toolbar
          search={search}
          onSearch={setSearch}
          menuOpen={menuOpen}
          onMenu={() => setMenuOpen(o => !o)}
        />
      </div>
      {menuOpen && (
        <Menu
          prefs={prefs}
          onUpdate={update}
          onResetColumns={() => update({ columnWidths: DEFAULT_COLUMN_WIDTHS })}
          onExport={exportTabs}
          onHelp={() => setHelpOpen(true)}
          onClose={closeMenu}
        />
      )}
      <Controls
        show={show}
        minAge={minAge}
        groupBy={groupBy}
        onShow={setShow}
        onMinAge={setMinAge}
        onGroupBy={g => {
          setGroupBy(g);
          setCollapsed(new Set());
        }}
        total={data.tabs.length}
        shown={filtered.length}
        staleCount={staleIds.length}
        duplicateCount={duplicateIds.length}
        filtered={filtersActive}
        onClearFilters={clearFilters}
        onSelectStale={() => setSelected(new Set(staleIds))}
        onCloseDuplicates={closeDuplicates}
      />

      <div class="table-container" ref={tableRef}>
        {!ready ? (
          <div class="placeholder">
            <div class="spinner" />
            <p>Examining tabs…</p>
          </div>
        ) : data.error && data.tabs.length === 0 ? (
          <div class="placeholder">
            <p>Couldn't read your tabs: {data.error}</p>
            <button class="btn" onClick={data.refresh}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div class="placeholder">
            {filtersActive ? (
              <>
                <p>No tabs match these filters.</p>
                <button class="btn" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            ) : (
              <p>No tabs to examine.</p>
            )}
          </div>
        ) : (
          <TabTable
            groups={groups}
            groupBy={groupBy}
            collapsed={collapsed}
            selected={selected}
            focusedId={focusedId}
            now={now}
            sortColumn={prefs.sortColumn}
            sortDirection={prefs.sortDirection}
            columnWidths={prefs.columnWidths}
            visibleCount={visible.length}
            onSort={handleSort}
            onResize={columnWidths => update({ columnWidths })}
            onToggle={onToggle}
            onToggleAll={toggleAll}
            onToggleGroup={key =>
              setCollapsed(prev => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
              })
            }
            onSelectGroup={key => {
              const group = groups.find(g => g.key === key);
              if (group) setSelected(new Set(group.tabs.map(t => t.id)));
            }}
            onActivate={onActivate}
            onClose={onCloseRow}
            onFocusRow={setFocus}
          />
        )}
      </div>

      <Footer
        selectedCount={selectedTabs.length}
        closableCount={closableSelected.length}
        lastUpdated={data.lastUpdated}
        now={now}
        onRefresh={data.refresh}
        onPin={async pinned => {
          await setPinned(
            selectedTabs.map(t => t.id),
            pinned
          );
          data.refresh();
        }}
        onMove={async () => {
          await moveToNewWindow(selectedTabs.map(t => t.id));
          setSelected(new Set());
          data.refresh();
        }}
        onClose={() => requestClose(closableSelected.map(t => t.id))}
        onClear={() => setSelected(new Set())}
      />

      {undo && (
        <UndoToast message={undo.message} onUndo={handleUndo} onDismiss={() => setUndo(null)} />
      )}
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
      {confirm && <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
