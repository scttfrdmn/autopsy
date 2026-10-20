import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type {
  ColumnWidths,
  GroupBy,
  ResizableColumn,
  SortColumn,
  SortDirection,
  TabMetrics,
} from '../../types';
import { MIN_COLUMN_WIDTHS } from '../../lib/constants';
import type { TabGroup } from '../../lib/view';
import { TabRow } from './TabRow';

interface Props {
  groups: TabGroup[];
  groupBy: GroupBy;
  collapsed: Set<string>;
  selected: Set<number>;
  focusedId: number | null;
  now: number;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  columnWidths: ColumnWidths;
  visibleCount: number;
  onSort: (column: SortColumn) => void;
  onResize: (widths: ColumnWidths) => void;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onToggleGroup: (key: string) => void;
  onSelectGroup: (key: string) => void;
  onActivate: (tab: TabMetrics) => void;
  onClose: (id: number) => void;
  onFocusRow: (id: number) => void;
}

const COLUMNS: Array<{ key: ResizableColumn; label: string; sort: SortColumn; title: string }> = [
  { key: 'title', label: 'Tab', sort: 'title', title: 'Tab title and site' },
  { key: 'age', label: 'Age', sort: 'age', title: 'How long the tab has been open' },
  {
    key: 'lastViewed',
    label: 'Viewed',
    sort: 'lastViewed',
    title: 'When you last switched to the tab',
  },
  {
    key: 'network',
    label: 'Network',
    sort: 'network',
    title: 'When the tab last made a network request',
  },
  {
    key: 'data',
    label: 'Data',
    sort: 'data',
    title: 'Data received and requests made since Autopsy started watching',
  },
];

const CHECK_WIDTH = 34;
const STATUS_WIDTH = 26;
const CLOSE_WIDTH = 30;

export function TabTable(props: Props) {
  const { groups, groupBy, collapsed, selected, focusedId, now, columnWidths } = props;
  // Widths while a drag is in progress; committed to preferences on mouseup.
  const [dragWidths, setDragWidths] = useState<ColumnWidths | null>(null);
  const widths = dragWidths ?? columnWidths;
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedVisible = props.visibleCount > 0 ? selected.size : 0;
  const allSelected = selectedVisible > 0 && selectedVisible === props.visibleCount;
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedVisible > 0 && !allSelected;
    }
  }, [selectedVisible, allSelected]);

  const startResize = (e: MouseEvent, column: ResizableColumn) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widths[column];
    let latest = widths;
    document.body.classList.add('resizing');

    const onMove = (ev: MouseEvent) => {
      const width = Math.max(MIN_COLUMN_WIDTHS[column], startWidth + ev.clientX - startX);
      latest = { ...latest, [column]: width };
      setDragWidths(latest);
    };
    const onUp = () => {
      document.body.classList.remove('resizing');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      props.onResize(latest);
      setDragWidths(null);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const totalWidth =
    CHECK_WIDTH + STATUS_WIDTH + CLOSE_WIDTH + Object.values(widths).reduce((a, b) => a + b, 0);

  return (
    <table class="tab-table" style={{ width: `max(100%, ${totalWidth}px)` }}>
      <colgroup>
        <col style={{ width: `${CHECK_WIDTH}px` }} />
        <col style={{ width: `${STATUS_WIDTH}px` }} />
        {COLUMNS.map(c => (
          <col key={c.key} style={{ width: `${widths[c.key]}px` }} />
        ))}
        <col style={{ width: `${CLOSE_WIDTH}px` }} />
      </colgroup>
      <thead>
        <tr>
          <th class="col-check">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={props.onToggleAll}
              aria-label="Select all visible tabs"
              title="Select all visible tabs"
            />
          </th>
          <th class="col-status" aria-label="Status" />
          {COLUMNS.map(c => {
            const active = props.sortColumn === c.sort;
            return (
              <th
                key={c.key}
                class={`col-${c.key}${active ? ' sorted' : ''}`}
                aria-sort={
                  active ? (props.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
                }
              >
                <button
                  class="th-button"
                  title={`${c.title} — click to sort`}
                  onClick={() => props.onSort(c.sort)}
                >
                  {c.label}
                  <span class="sort-arrow" aria-hidden="true">
                    {active ? (props.sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
                <span
                  class="resize-handle"
                  onMouseDown={e => startResize(e, c.key)}
                  aria-hidden="true"
                  title="Drag to resize"
                />
              </th>
            );
          })}
          <th class="col-close" aria-label="Close" />
        </tr>
      </thead>
      <tbody>
        {groups.map(group => {
          const isCollapsed = collapsed.has(group.key);
          return (
            <Fragment key={group.key}>
              {groupBy !== 'none' && (
                <tr class="group-header">
                  <td colSpan={8}>
                    <button
                      class="group-toggle"
                      aria-expanded={!isCollapsed}
                      onClick={() => props.onToggleGroup(group.key)}
                    >
                      <span class="chevron" aria-hidden="true">
                        {isCollapsed ? '▸' : '▾'}
                      </span>
                      <span class="group-name">{group.label}</span>
                      <span class="group-count">{group.tabs.length}</span>
                    </button>
                    <button class="link-button" onClick={() => props.onSelectGroup(group.key)}>
                      Select
                    </button>
                  </td>
                </tr>
              )}
              {!isCollapsed &&
                group.tabs.map(tab => (
                  <TabRow
                    key={tab.id}
                    tab={tab}
                    now={now}
                    selected={selected.has(tab.id)}
                    focused={focusedId === tab.id}
                    onToggle={props.onToggle}
                    onActivate={props.onActivate}
                    onClose={props.onClose}
                    onFocusRow={props.onFocusRow}
                  />
                ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
