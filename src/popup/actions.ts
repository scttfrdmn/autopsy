/** Chrome-side tab operations used by the popup. */

export interface ClosedTab {
  url: string;
  windowId: number;
  index: number;
  pinned: boolean;
}

/** Close tabs, returning what's needed to restore them. */
export async function closeTabs(ids: number[]): Promise<ClosedTab[]> {
  if (ids.length === 0) return [];
  const wanted = new Set(ids);
  const tabs = (await chrome.tabs.query({})).filter(t => t.id !== undefined && wanted.has(t.id));
  const closed = tabs
    .map(t => ({
      url: t.url || t.pendingUrl || '',
      windowId: t.windowId,
      index: t.index,
      pinned: t.pinned,
    }))
    .filter(t => t.url);
  await chrome.tabs.remove(tabs.map(t => t.id!));
  return closed;
}

/** Reopen closed tabs in their original window and position when that window still exists. */
export async function restoreTabs(closed: ClosedTab[]): Promise<void> {
  const windows = new Set((await chrome.windows.getAll()).map(w => w.id));
  const ordered = [...closed].sort((a, b) => a.windowId - b.windowId || a.index - b.index);
  for (const tab of ordered) {
    const sameWindow = windows.has(tab.windowId);
    await chrome.tabs.create({
      url: tab.url,
      pinned: tab.pinned,
      active: false,
      ...(sameWindow ? { windowId: tab.windowId, index: tab.index } : {}),
    });
  }
}

export async function setPinned(ids: number[], pinned: boolean): Promise<void> {
  await Promise.all(ids.map(id => chrome.tabs.update(id, { pinned })));
}

export async function moveToNewWindow(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const [first, ...rest] = ids;
  const win = await chrome.windows.create({ tabId: first, focused: true });
  if (rest.length && win?.id !== undefined) {
    await chrome.tabs.move(rest, { windowId: win.id, index: -1 });
  }
}

export async function activateTab(tabId: number, windowId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(windowId, { focused: true });
}
