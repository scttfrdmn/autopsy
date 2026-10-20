#!/usr/bin/env node
/**
 * Capture Chrome Web Store screenshots (1280×800) of the popup.
 *
 * Uses the screenshot build (`npm run build:screenshots` → dist-screenshots/), which accepts
 * fake ages, view times and network stats. Sites are served from fake local pages, so no
 * network is needed and the output is deterministic.
 *
 *   npm run screenshots
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist-screenshots');
const out = join(root, 'screenshots');
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('Missing dist-screenshots/. Run `npm run build:screenshots` first.');
  process.exit(1);
}
mkdirSync(out, { recursive: true });

// [url, title, favicon colour, letter, opened ago, viewed ago, requests, bytes, network ago]
const TABS = [
  ['https://github.com/preactjs/preact', 'preactjs/preact: Fast 3kB React alternative', '#24292f', 'G', 9 * DAY, 2 * MIN, 48, 1_900_000, 5_000],
  ['https://github.com/trending', 'Trending repositories on GitHub today', '#24292f', 'G', 3 * DAY, 26 * HOUR, 12, 640_000, 26 * HOUR],
  ['https://developer.mozilla.org/en-US/docs/Web/API/Tabs', 'Tabs API - MDN Web Docs', '#1b1b1b', 'M', 21 * DAY, 40 * MIN, 22, 820_000, 40 * MIN],
  ['https://developer.mozilla.org/en-US/docs/Web/CSS/grid', 'CSS grid layout - MDN Web Docs', '#1b1b1b', 'M', 45 * DAY, 12 * DAY, 18, 540_000, 12 * DAY],
  ['https://news.ycombinator.com/', 'Hacker News', '#ff6600', 'Y', 2 * DAY, 3 * HOUR, 9, 61_000, 30_000],
  ['https://www.nytimes.com/', 'The New York Times - Breaking News', '#000000', 'T', 6 * DAY, 4 * DAY, 230, 9_400_000, 20_000],
  ['https://docs.google.com/document/d/1', 'Q4 planning notes - Google Docs', '#1a73e8', 'D', 14 * DAY, 15 * MIN, 140, 3_200_000, 12_000],
  ['https://mail.google.com/mail/u/0/', 'Inbox (3) - Gmail', '#ea4335', 'M', 30 * DAY, 8 * MIN, 410, 12_600_000, 3_000],
  ['https://stackoverflow.com/questions/1', 'How do I debounce in TypeScript? - Stack Overflow', '#f48024', 'S', 8 * DAY, 8 * DAY, 31, 1_100_000, 8 * DAY],
  ['https://stackoverflow.com/questions/1', 'How do I debounce in TypeScript? - Stack Overflow', '#f48024', 'S', 2 * HOUR, 2 * HOUR, 30, 1_050_000, 2 * HOUR],
  ['https://www.youtube.com/watch?v=1', 'Designing calm interfaces - YouTube', '#ff0000', 'Y', 5 * DAY, 2 * DAY, 96, 48_000_000, 2 * DAY],
  ['https://react.dev/learn', 'Quick Start - React', '#149eca', 'R', 60 * DAY, 20 * DAY, 14, 420_000, 20 * DAY],
  ['https://www.typescriptlang.org/docs/', 'TypeScript Documentation', '#3178c6', 'T', 33 * DAY, 9 * DAY, 11, 380_000, 9 * DAY],
  ['https://en.wikipedia.org/wiki/Autopsy', 'Autopsy - Wikipedia', '#636466', 'W', null, 70 * DAY, 0, 0, null],
  ['https://figma.com/file/1', 'Autopsy redesign - Figma', '#a259ff', 'F', 4 * DAY, 50 * MIN, 77, 6_800_000, 50 * MIN],
];

const favicon = (color, letter) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="${color}"/><text x="8" y="12" font-family="Arial" font-weight="bold" font-size="11" fill="#fff" text-anchor="middle">${letter}</text></svg>`
  )}`;

const wait = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const xtmp = join(homedir(), '.xtmp');
  const profile = mkdtempSync(join(existsSync(xtmp) ? xtmp : tmpdir(), 'autopsy-shots-'));
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  try {
    await context.route(/^https:\/\//, route => {
      const url = route.request().url();
      const spec = TABS.find(t => t[0] === url);
      const title = spec?.[1] ?? 'Page';
      const icon = spec ? favicon(spec[2], spec[3]) : '';
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><title>${title}</title><link rel="icon" href="${icon}"><h1>${title}</h1>`,
      });
    });

    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    const extensionId = new URL(worker.url()).host;
    const popupUrl = `chrome-extension://${extensionId}/index.html`;

    for (const [url] of TABS) {
      const page = await context.newPage();
      await page.goto(url);
    }
    await wait(1000);

    // Group two tabs like a real Chrome tab group.
    const setup = await context.newPage();
    await setup.goto(popupUrl);
    await setup.evaluate(async ({ tabs, MIN }) => {
      const now = Date.now();
      const all = await chrome.tabs.query({});
      const records = {};
      const stats = {};
      const overrides = {};
      tabs.forEach(([url, , , , opened, viewed, requests, bytes, network], i) => {
        const tab = all.filter(t => t.url === url)[i > 0 && tabs[i - 1][0] === url ? 1 : 0];
        if (!tab) return;
        records[tab.id] = {
          url,
          created: opened === null ? null : now - opened,
          firstSeen: opened === null ? now - 3 * 24 * 60 * MIN : now - opened,
          windowOrdinal: 0,
          index: tab.index,
        };
        overrides[tab.id] = { lastViewed: now - viewed };
        if (requests) {
          stats[tab.id] = {
            requestCount: requests,
            bytesReceived: bytes,
            lastActivity: now - network,
            firstActivity: now - opened,
          };
        }
      });
      await chrome.runtime.sendMessage({ action: 'setFakeData', records, stats, overrides });
      const docs = all.filter(t => t.url.includes('google.com')).map(t => t.id);
      const group = await chrome.tabs.group({ tabIds: docs });
      await chrome.tabGroups.update(group, { title: 'Work', color: 'blue' });
      const pinned = all.find(t => t.url.includes('mail.google.com'));
      if (pinned) await chrome.tabs.update(pinned.id, { pinned: true });
    }, { tabs: TABS, MIN });
    await setup.close();

    const popup = await context.newPage();
    await popup.setViewportSize({ width: 800, height: 600 });
    await popup.goto(popupUrl);
    await popup.waitForSelector('tr.tab-row');
    const app = popup.locator('.app');

    const shoot = async (name, prepare) => {
      await popup.reload();
      await popup.waitForSelector('tr.tab-row');
      if (prepare) await prepare();
      await wait(250);
      const png = await app.screenshot();
      await compose(context, png, join(out, name));
      console.log(`  ✓ ${name}`);
    };
    const setTheme = async theme => {
      await popup.evaluate(async t => {
        const { preferences = {} } = await chrome.storage.local.get('preferences');
        await chrome.storage.local.set({ preferences: { ...preferences, theme: t } });
      }, theme);
    };

    await setTheme('dark');
    await shoot('01-main-interface.png');
    await shoot('02-keyboard-navigation.png', async () => {
      await popup.keyboard.press('ArrowDown');
      await popup.keyboard.press('ArrowDown');
      await popup.keyboard.press('Space');
      await popup.keyboard.press('ArrowDown');
      await popup.keyboard.press('ArrowDown');
      await popup.keyboard.press('Space');
    });
    await shoot('03-help-keyboard-shortcuts.png', () => popup.keyboard.press('?'));
    await shoot('04-group-by-domain.png', () => popup.selectOption('select[aria-label="Group by"]', 'domain'));
    await shoot('05-group-by-status.png', () => popup.selectOption('select[aria-label="Group by"]', 'status'));
    await shoot('06-bulk-operations.png', () =>
      popup.getByRole('button', { name: /Select \d+ stale/ }).click()
    );
    await shoot('08-settings-menu.png', () => popup.getByRole('button', { name: 'Settings and tools' }).click());
    await setTheme('light');
    await shoot('07-light-theme.png');
    await setTheme('system');
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

/** Center the popup on a 1280×800 canvas with a soft shadow, as the store expects. */
async function compose(context, png, path) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(`
    <body style="margin:0;width:1280px;height:800px;display:grid;place-items:center;
      background:linear-gradient(135deg,#0d1b2a 0%,#12343b 100%)">
      <img src="data:image/png;base64,${png.toString('base64')}"
        style="border-radius:10px;box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06)">
    </body>`);
  await page.screenshot({ path });
  await page.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
