import type { Staleness, TabMetrics } from '../types';
import { BUSY_WINDOW, IDLE_AFTER, RECENT_AFTER, STALE_AFTER } from './constants';

export const STATUS_ORDER: Staleness[] = ['active', 'recent', 'idle', 'stale'];

/** Staleness is based on when the tab was last viewed; the tab showing in each window is always active. */
export function getStaleness(
  tab: Pick<TabMetrics, 'isActive' | 'lastViewed'>,
  now: number
): Staleness {
  if (tab.isActive) return 'active';
  const since = now - tab.lastViewed;
  if (since < RECENT_AFTER) return 'active';
  if (since < IDLE_AFTER) return 'recent';
  if (since < STALE_AFTER) return 'idle';
  return 'stale';
}

/** A background tab that is still making network requests. */
export function isBusy(tab: Pick<TabMetrics, 'isActive' | 'network'>, now: number): boolean {
  const last = tab.network.lastActivity;
  return !tab.isActive && last !== null && now - last < BUSY_WINDOW;
}

/** Best-known age: exact if the open time is known, otherwise a lower bound. */
export function getAge(tab: Pick<TabMetrics, 'created' | 'ageLowerBound'>, now: number): number {
  return now - (tab.created ?? tab.ageLowerBound);
}
