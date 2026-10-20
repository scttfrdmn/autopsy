import type { TabMetrics } from '../types';
import { DAY } from './constants';
import { getAge, getStaleness } from './status';

const iso = (t: number | null) => (t === null ? '' : new Date(t).toISOString());

/** RFC 4180 field: quote when needed, double embedded quotes. */
export function csvField(value: string | number | boolean | null): string {
  const s = value === null ? '' : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(tabs: TabMetrics[], now: number): string {
  const headers = [
    'Title',
    'URL',
    'Domain',
    'Window ID',
    'Status',
    'Age (days)',
    'Age known',
    'Opened',
    'Last viewed',
    'Last network activity',
    'Requests',
    'Bytes received',
    'Pinned',
    'Audible',
    'Discarded',
    'Group',
  ];
  const rows = tabs.map(tab =>
    [
      tab.title,
      tab.url,
      tab.hostname,
      tab.windowId,
      getStaleness(tab, now),
      (getAge(tab, now) / DAY).toFixed(2),
      tab.created !== null,
      iso(tab.created),
      iso(tab.lastViewed),
      iso(tab.network.lastActivity),
      tab.network.requestCount,
      tab.network.bytesReceived,
      tab.isPinned,
      tab.isAudible,
      tab.isDiscarded,
      tab.groupInfo?.title ?? '',
    ]
      .map(csvField)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

export function toJSON(tabs: TabMetrics[], now: number): string {
  return JSON.stringify(
    tabs.map(tab => ({
      title: tab.title,
      url: tab.url,
      domain: tab.hostname,
      windowId: tab.windowId,
      status: getStaleness(tab, now),
      ageMs: getAge(tab, now),
      ageKnown: tab.created !== null,
      opened: iso(tab.created) || null,
      lastViewed: iso(tab.lastViewed),
      isPinned: tab.isPinned,
      isAudible: tab.isAudible,
      isDiscarded: tab.isDiscarded,
      group: tab.groupInfo,
      network: {
        requestCount: tab.network.requestCount,
        bytesReceived: tab.network.bytesReceived,
        lastActivity: iso(tab.network.lastActivity) || null,
        firstActivity: iso(tab.network.firstActivity) || null,
      },
    })),
    null,
    2
  );
}

export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
