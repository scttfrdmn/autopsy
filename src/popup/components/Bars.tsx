import type { GroupBy, ShowFilter } from '../../types';
import { AGE_FILTERS, STATUS_LABELS } from '../../lib/constants';
import { formatRelative, plural } from '../../lib/format';
import { STATUS_ORDER } from '../../lib/status';
import { StatusIcon } from './StatusIcon';

interface ToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  menuOpen: boolean;
  onMenu: () => void;
}

export function Toolbar({ search, onSearch, menuOpen, onMenu }: ToolbarProps) {
  return (
    <header class="toolbar">
      <h1 class="brand">
        <span class="brand-mark" aria-hidden="true">
          ⚕
        </span>
        Autopsy
      </h1>
      <div class="search" role="search">
        <input
          type="search"
          class="search-input"
          placeholder="Search tabs"
          value={search}
          onInput={e => onSearch((e.target as HTMLInputElement).value)}
          aria-label="Search tabs by title or URL"
          aria-keyshortcuts="/"
        />
        <kbd class="search-hint" aria-hidden="true">
          /
        </kbd>
      </div>
      <button
        class={`icon-button menu-button${menuOpen ? ' on' : ''}`}
        onClick={onMenu}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Settings and tools"
        title="Settings and tools"
      >
        ⋯
      </button>
    </header>
  );
}

interface ControlsProps {
  show: ShowFilter;
  minAge: number;
  groupBy: GroupBy;
  onShow: (v: ShowFilter) => void;
  onMinAge: (v: number) => void;
  onGroupBy: (v: GroupBy) => void;
  total: number;
  shown: number;
  staleCount: number;
  duplicateCount: number;
  filtered: boolean;
  onClearFilters: () => void;
  onSelectStale: () => void;
  onCloseDuplicates: () => void;
}

export function Controls(p: ControlsProps) {
  return (
    <div class="controls">
      <div class="filters">
        <select
          class="select"
          value={p.show}
          onChange={e => p.onShow((e.target as HTMLSelectElement).value as ShowFilter)}
          aria-label="Show"
        >
          <option value="all">All tabs</option>
          <option value="stale">Stale only</option>
          <option value="idle-or-stale">Idle or stale</option>
          <option value="busy">Busy in background</option>
        </select>
        <select
          class="select"
          value={String(p.minAge)}
          onChange={e => p.onMinAge(Number((e.target as HTMLSelectElement).value))}
          aria-label="Minimum age"
        >
          {AGE_FILTERS.map(f => (
            <option key={f.value} value={String(f.value)}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          class="select"
          value={p.groupBy}
          onChange={e => p.onGroupBy((e.target as HTMLSelectElement).value as GroupBy)}
          aria-label="Group by"
        >
          <option value="none">No grouping</option>
          <option value="domain">Group by site</option>
          <option value="window">Group by window</option>
          <option value="status">Group by status</option>
        </select>
      </div>
      <div class="summary" aria-live="polite">
        {p.filtered ? (
          <>
            <span>
              {p.shown} of {p.total}
            </span>
            <button class="link-button" onClick={p.onClearFilters}>
              Clear
            </button>
          </>
        ) : (
          <span>{plural(p.total, 'tab')}</span>
        )}
        {p.staleCount > 0 && (
          <button
            class="link-button warn"
            onClick={p.onSelectStale}
            title="Select visible tabs not viewed for over a day"
          >
            Select {p.staleCount} stale
          </button>
        )}
        {p.duplicateCount > 0 && (
          <button
            class="link-button warn"
            onClick={p.onCloseDuplicates}
            title="Close extra copies of the same page, keeping the one you viewed most recently"
          >
            Close {plural(p.duplicateCount, 'duplicate')}
          </button>
        )}
      </div>
    </div>
  );
}

interface FooterProps {
  selectedCount: number;
  closableCount: number;
  lastUpdated: number;
  now: number;
  onRefresh: () => void;
  onPin: (pinned: boolean) => void;
  onMove: () => void;
  onClose: () => void;
  onClear: () => void;
}

export function Footer(p: FooterProps) {
  if (p.selectedCount > 0) {
    const skipped = p.selectedCount - p.closableCount;
    return (
      <footer class="footer selection-bar" aria-label="Selected tabs">
        <span class="selection-count">{p.selectedCount} selected</span>
        <button class="btn" onClick={() => p.onPin(true)}>
          Pin
        </button>
        <button class="btn" onClick={() => p.onPin(false)}>
          Unpin
        </button>
        <button class="btn" onClick={p.onMove}>
          Move to new window
        </button>
        <span class="spacer" />
        <button class="link-button" onClick={p.onClear}>
          Deselect
        </button>
        <button
          class="btn btn-danger"
          onClick={p.onClose}
          disabled={p.closableCount === 0}
          title={skipped > 0 ? `${plural(skipped, 'pinned tab')} will be kept` : undefined}
        >
          Close {p.closableCount}
        </button>
      </footer>
    );
  }

  return (
    <footer class="footer">
      <ul class="legend" aria-label="Status legend">
        {STATUS_ORDER.map(s => (
          <li key={s}>
            <StatusIcon status={s} />
            {STATUS_LABELS[s]}
          </li>
        ))}
        <li>
          <span class="busy-dot" aria-hidden="true" />
          Busy
        </li>
      </ul>
      <span class="spacer" />
      <button class="link-button subtle" onClick={p.onRefresh} title="Refresh now">
        Updated {formatRelative(p.lastUpdated, p.now)} ↻
      </button>
    </footer>
  );
}
