import type { BrowserContext, Page } from '@playwright/test';
import { expect, openPopup, test } from './fixtures';

async function openTabs(context: BrowserContext, site: string, names: string[]) {
  for (const name of names) {
    const page = await context.newPage();
    await page.goto(`${site}/${name}`);
  }
}

const rows = (popup: Page) => popup.locator('tr.tab-row');
const focusedTitle = (popup: Page) => popup.locator('tr.tab-row.focused .tab-title-text');
const tabCount = (popup: Page) =>
  popup.evaluate(
    async () =>
      (await chrome.tabs.query({})).filter(t => (t.url || t.pendingUrl)?.startsWith('http')).length
  );

test('keyboard navigation works from the first keypress', async ({ ext, site, pageErrors }) => {
  await openTabs(ext.context, site, ['alpha', 'bravo', 'charlie']);
  const popup = await openPopup(ext.context, ext.extensionId);
  await expect(rows(popup)).toHaveCount(3);
  const titles = await popup.locator('tr.tab-row .tab-title-text').allTextContents();

  await popup.keyboard.press('ArrowDown');
  await expect(focusedTitle(popup)).toHaveText(titles[0]);
  await popup.keyboard.press('ArrowDown');
  await popup.keyboard.press('ArrowDown');
  await expect(focusedTitle(popup)).toHaveText(titles[2]);
  await popup.keyboard.press('ArrowUp');
  await expect(focusedTitle(popup)).toHaveText(titles[1]);

  await popup.keyboard.press('Space');
  await expect(popup.locator('tr.tab-row.selected')).toHaveCount(1);
  await expect(popup.locator('.selection-count')).toHaveText('1 selected');

  await popup.keyboard.press('?');
  await expect(popup.getByRole('dialog', { name: 'Help' })).toBeVisible();
  await popup.keyboard.press('Escape');
  await expect(popup.getByRole('dialog')).toHaveCount(0);

  await popup.keyboard.press('/');
  await expect(popup.locator('.search-input')).toBeFocused();
  await popup.keyboard.type('brav');
  await expect(rows(popup)).toHaveCount(1);
  await popup.keyboard.press('Escape');
  await expect(rows(popup)).toHaveCount(3);

  expect(pageErrors).toEqual([]);
});

test('closing tabs can be undone', async ({ ext, site }) => {
  await openTabs(ext.context, site, ['one', 'two', 'three']);
  const popup = await openPopup(ext.context, ext.extensionId);
  await expect(rows(popup)).toHaveCount(3);

  await rows(popup).nth(0).locator('input[type=checkbox]').check();
  await rows(popup).nth(1).locator('input[type=checkbox]').check();
  await popup.getByRole('button', { name: 'Close 2' }).click();
  await expect(rows(popup)).toHaveCount(1);
  expect(await tabCount(popup)).toBe(1);

  await popup.locator('.toast').getByRole('button', { name: 'Undo' }).click();
  await expect(rows(popup)).toHaveCount(3);
  expect(await tabCount(popup)).toBe(3);
});

test('bulk close skips pinned tabs and selection ignores hidden rows', async ({ ext, site }) => {
  await openTabs(ext.context, site, ['keep', 'drop', 'other']);
  const popup = await openPopup(ext.context, ext.extensionId);
  await popup.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ title: 'Page keep' });
    await chrome.tabs.update(tab.id!, { pinned: true });
  });
  await expect(popup.locator('.badge', { hasText: 'Pinned' })).toHaveCount(1);

  await popup.locator('thead input[type=checkbox]').check();
  await expect(popup.locator('.selection-count')).toHaveText('3 selected');
  await expect(popup.getByRole('button', { name: 'Close 2' })).toBeVisible();

  // Filtering hides rows; hidden rows drop out of the selection.
  await popup.locator('.search-input').fill('drop');
  await expect(popup.locator('.selection-count')).toHaveText('1 selected');
  await popup.getByRole('button', { name: 'Close 1' }).click();
  await popup.locator('.search-input').fill('');
  await expect(rows(popup)).toHaveCount(2);
  await expect(popup.locator('.tab-title-text', { hasText: 'Page keep' })).toBeVisible();
  await expect(popup.locator('.tab-title-text', { hasText: 'Page other' })).toBeVisible();
});

test('close duplicates keeps one copy of each page', async ({ ext, site }) => {
  await openTabs(ext.context, site, ['dup', 'dup', 'dup', 'solo']);
  const popup = await openPopup(ext.context, ext.extensionId);
  await popup.getByRole('button', { name: 'Close 2 duplicates' }).click();
  await popup.getByRole('dialog').getByRole('button', { name: 'Close 2' }).click();
  await expect(rows(popup)).toHaveCount(2);
});

test('tab age survives navigation and network stats survive the worker stopping', async ({
  ext,
  site,
}) => {
  const page = await ext.context.newPage();
  await page.goto(`${site}/start`);
  const popup = await openPopup(ext.context, ext.extensionId);

  const snapshot = () =>
    popup.evaluate(() => chrome.runtime.sendMessage({ action: 'getSnapshot' }));
  const tabId = await popup.evaluate(
    async () => (await chrome.tabs.query({ title: 'Page start' }))[0].id!
  );
  const before = await snapshot();
  const created = before.records[tabId].created;
  expect(created).toEqual(expect.any(Number));

  await page.goto(`${site}/elsewhere`);
  await popup.waitForTimeout(800);
  const after = await snapshot();
  expect(after.records[tabId].created).toBe(created);
  expect(after.records[tabId].url).toContain('/elsewhere');
  const requests = after.stats[tabId].requestCount;
  expect(requests).toBeGreaterThanOrEqual(2);

  // Let the throttled save run, then stop the worker the way Chrome does when idle.
  await popup.waitForTimeout(2500);
  const cdp = await ext.context.newCDPSession(popup);
  await cdp.send('ServiceWorker.enable');
  await cdp.send('ServiceWorker.stopAllWorkers');
  await popup.waitForTimeout(500);

  const restarted = await snapshot();
  expect(restarted.stats[tabId].requestCount).toBe(requests);
  expect(restarted.records[tabId].created).toBe(created);
});

test('settings menu toggles, closes on Escape and changes theme', async ({ ext, site }) => {
  await openTabs(ext.context, site, ['menu']);
  const popup = await openPopup(ext.context, ext.extensionId);
  const button = popup.getByRole('button', { name: 'Settings and tools' });
  const menu = popup.getByRole('menu');

  await button.click();
  await expect(menu).toBeVisible();
  await button.click();
  await expect(menu).toHaveCount(0);

  await button.click();
  await popup.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);

  await button.click();
  await menu.getByRole('button', { name: 'Light' }).click();
  await expect(popup.locator('html')).toHaveAttribute('data-theme', 'light');
  await popup.locator('.tab-table').click({ position: { x: 5, y: 5 } });
  await expect(menu).toHaveCount(0);
});
