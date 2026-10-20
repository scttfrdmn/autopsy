import { memo } from 'preact/compat';
import type { TabMetrics } from '../../types';
import {
  formatAbsolute,
  formatBytes,
  formatDuration,
  formatRelative,
  plural,
} from '../../lib/format';
import { getAge, getStaleness, isBusy } from '../../lib/status';
import { StatusIcon } from './StatusIcon';

interface Props {
  tab: TabMetrics;
  now: number;
  selected: boolean;
  focused: boolean;
  onToggle: (id: number) => void;
  onActivate: (tab: TabMetrics) => void;
  onClose: (id: number) => void;
  onFocusRow: (id: number) => void;
}

function TabRowImpl({
  tab,
  now,
  selected,
  focused,
  onToggle,
  onActivate,
  onClose,
  onFocusRow,
}: Props) {
  const status = getStaleness(tab, now);
  const busy = isBusy(tab, now);
  const age = formatDuration(getAge(tab, now));
  const ageTitle =
    tab.created !== null
      ? `Opened ${formatAbsolute(tab.created)}`
      : `Opened before Autopsy started tracking it (at least ${age} ago)`;

  return (
    <tr
      class={`tab-row status-row-${status}${selected ? ' selected' : ''}${focused ? ' focused' : ''}`}
      data-tab-id={tab.id}
      tabIndex={focused ? 0 : -1}
      aria-selected={selected}
      onClick={() => onActivate(tab)}
      onFocus={() => onFocusRow(tab.id)}
    >
      <td class="col-check" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(tab.id)}
          aria-label={`Select ${tab.title}`}
          tabIndex={-1}
        />
      </td>
      <td class="col-status">
        <StatusIcon status={status} />
      </td>
      <td class="col-title">
        <div class="tab-info">
          {tab.favIconUrl ? (
            <img src={tab.favIconUrl} class="favicon" alt="" loading="lazy" />
          ) : (
            <span class="favicon favicon-fallback" aria-hidden="true" />
          )}
          <div class="tab-text">
            <div class="tab-title" title={tab.title}>
              <span class="tab-title-text">{tab.title}</span>
            </div>
            <div class="tab-meta">
              <span class="tab-host">{tab.hostname}</span>
              {tab.groupInfo && (
                <span class="badge" title="Chrome tab group">
                  <span class={`group-dot group-${tab.groupInfo.color}`} />
                  {tab.groupInfo.title || 'Group'}
                </span>
              )}
              {tab.isPinned && (
                <span class="badge" title="Pinned">
                  Pinned
                </span>
              )}
              {tab.isAudible && (
                <span class="badge" title="Playing audio">
                  Audio
                </span>
              )}
              {tab.isDiscarded && (
                <span class="badge" title="Unloaded by Chrome to save memory">
                  Asleep
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td class={`col-age${tab.created === null ? ' estimated' : ''}`} title={ageTitle}>
        {tab.created === null ? `≥${age}` : age}
      </td>
      <td
        class="col-viewed"
        title={tab.isActive ? 'Showing in its window' : formatAbsolute(tab.lastViewed)}
      >
        {tab.isActive ? 'Now' : formatRelative(tab.lastViewed, now)}
      </td>
      <td
        class="col-network"
        title={
          tab.network.lastActivity
            ? `Last request ${formatAbsolute(tab.network.lastActivity)}${busy ? ' — still busy in the background' : ''}`
            : 'No requests since Autopsy started watching'
        }
      >
        {busy && <span class="busy-dot" aria-label="Busy in background" />}
        {formatRelative(tab.network.lastActivity, now)}
      </td>
      <td class="col-data">
        <div>{formatBytes(tab.network.bytesReceived)}</div>
        {tab.network.requestCount > 0 && (
          <div class="subtle">{plural(tab.network.requestCount, 'req')}</div>
        )}
      </td>
      <td class="col-close">
        <button
          class="row-close"
          tabIndex={-1}
          aria-label={`Close ${tab.title}`}
          title="Close tab"
          onClick={e => {
            e.stopPropagation();
            onClose(tab.id);
          }}
        >
          ×
        </button>
      </td>
    </tr>
  );
}

export const TabRow = memo(TabRowImpl);
