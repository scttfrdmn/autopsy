#!/usr/bin/env node

/**
 * Capture Chrome Web Store screenshots using Playwright
 * Updated for v0.21.0 with keyboard navigation features
 *
 * This script:
 * 1. Launches Chrome with Autopsy extension loaded
 * 2. Creates test tabs with various characteristics
 * 3. Opens extension popup
 * 4. Captures screenshots of different features including new keyboard navigation
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distPath = join(projectRoot, 'dist');
const screenshotsPath = join(projectRoot, 'screenshots');

// Create screenshots directory
if (!existsSync(screenshotsPath)) {
  mkdirSync(screenshotsPath);
}

// Test URLs with variety
const testUrls = [
  { url: 'https://github.com', wait: 100 },
  { url: 'https://github.com/trending', wait: 200 },
  { url: 'https://stackoverflow.com', wait: 150 },
  { url: 'https://stackoverflow.com/questions', wait: 250 },
  { url: 'https://developer.mozilla.org', wait: 180 },
  { url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', wait: 220 },
  { url: 'https://news.ycombinator.com', wait: 120 },
  { url: 'https://www.reddit.com', wait: 160 },
  { url: 'https://www.reddit.com/r/programming', wait: 190 },
  { url: 'https://twitter.com', wait: 130 },
  { url: 'https://medium.com', wait: 170 },
  { url: 'https://dev.to', wait: 140 },
  { url: 'https://npmjs.com', wait: 210 },
  { url: 'https://www.typescriptlang.org', wait: 260 },
  { url: 'https://react.dev', wait: 230 },
];

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting screenshot capture for v0.21.0...\n');

  // Launch browser with extension
  console.log('📦 Loading extension from:', distPath);
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${distPath}`,
      `--load-extension=${distPath}`,
      '--no-sandbox',
    ],
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log('📑 Creating test tabs...');

  // Create tabs with staggered timing for age variety
  for (const { url, wait: waitTime } of testUrls) {
    const tab = await context.newPage();
    try {
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log(`   ✓ ${url}`);
    } catch (error) {
      console.log(`   ⚠ ${url} (failed, skipping)`);
    }
    await wait(waitTime);
  }

  // Wait for tabs to settle and accumulate different statuses
  console.log('\n⏳ Waiting for tabs to accumulate status variety (10 seconds)...');
  await wait(10000);

  // Get extension ID
  console.log('\n🔍 Finding extension ID...');

  // Look for service worker or background page
  let extensionId = null;
  const serviceWorkers = context.serviceWorkers();

  for (const sw of serviceWorkers) {
    const url = sw.url();
    if (url.includes('chrome-extension://')) {
      extensionId = new URL(url).host;
      break;
    }
  }

  // If not found in service workers, wait a bit and check all pages
  if (!extensionId) {
    await wait(2000);
    const pages = context.pages();
    for (const p of pages) {
      const url = p.url();
      if (url.includes('chrome-extension://')) {
        extensionId = new URL(url).host;
        break;
      }
    }
  }

  if (!extensionId) {
    console.error('❌ Extension not found! Make sure it is built.');
    console.log('   Available pages:', context.pages().map(p => p.url()));
    console.log('   Service workers:', serviceWorkers.map(sw => sw.url()));
    await context.close();
    return;
  }

  console.log('✓ Extension ID:', extensionId);

  const popupUrl = `chrome-extension://${extensionId}/index.html`;
  console.log('✓ Popup URL:', popupUrl);

  // Clear extension storage to reset tab ages
  console.log('\n🗑️  Clearing extension storage...');
  const clearPage = await context.newPage();
  await clearPage.goto(popupUrl);
  await clearPage.evaluate(() => {
    return chrome.storage.local.clear();
  });
  await clearPage.close();
  console.log('✓ Storage cleared');
  await wait(1000); // Wait for storage to clear

  // Set realistic fake ages and network activity for variety in screenshots
  console.log('📅 Setting realistic tab ages and activity...');
  const setupPage = await context.newPage();
  await setupPage.goto(popupUrl);

  // Send message to background worker to set fake data
  await setupPage.evaluate(() => {
    return chrome.tabs.query({}).then(tabs => {
      const now = Date.now();

      // Varied ages for realism
      const ages = [
        5 * 60 * 1000,              // 5 minutes
        15 * 60 * 1000,             // 15 minutes
        45 * 60 * 1000,             // 45 minutes
        2 * 60 * 60 * 1000,         // 2 hours
        5 * 60 * 60 * 1000,         // 5 hours
        1 * 24 * 60 * 60 * 1000,    // 1 day
        3 * 24 * 60 * 60 * 1000,    // 3 days
        7 * 24 * 60 * 60 * 1000,    // 7 days
        14 * 24 * 60 * 60 * 1000,   // 14 days
        30 * 24 * 60 * 60 * 1000,   // 30 days
      ];

      // Activity patterns for varied statuses
      const activityPatterns = [
        { lastActivity: now - 10 * 1000, requestCount: 15, bytesReceived: 256000 },         // Active (< 30s)
        { lastActivity: now - 60 * 1000, requestCount: 8, bytesReceived: 128000 },          // Recent (1min)
        { lastActivity: now - 5 * 60 * 1000, requestCount: 5, bytesReceived: 64000 },       // Recent (5min)
        { lastActivity: now - 45 * 60 * 1000, requestCount: 3, bytesReceived: 32000 },      // Idle (45min)
        { lastActivity: now - 2 * 60 * 60 * 1000, requestCount: 2, bytesReceived: 16000 },  // Idle (2h)
        { lastActivity: now - 6 * 60 * 60 * 1000, requestCount: 1, bytesReceived: 8000 },   // Inactive (6h)
        { lastActivity: now - 24 * 60 * 60 * 1000, requestCount: 0, bytesReceived: 0 },     // Inactive (1d)
        { lastActivity: null, requestCount: 0, bytesReceived: 0 },                          // Inactive (never)
      ];

      const storageData = {};
      const networkStatsData = {};

      tabs.forEach((tab, index) => {
        if (tab.id && tab.url && !tab.url.startsWith('chrome-extension://') && tab.url !== 'about:blank') {
          // Set varied age
          const ageOffset = ages[index % ages.length];
          const created = now - ageOffset;
          storageData[`tab_${tab.id}_created`] = created;

          // ALSO set instance fingerprint to prevent background worker from overwriting
          // Fingerprint format: url#windowId#index (matches worker.ts createFingerprint)
          const fingerprint = `${tab.url}#${tab.windowId}#${tab.index}`;
          storageData[`instance_${fingerprint}`] = {
            url: tab.url,
            windowId: tab.windowId,
            index: tab.index,
            created: created,
            lastSeen: now,
          };

          // Set varied activity
          const activity = activityPatterns[index % activityPatterns.length];
          networkStatsData[tab.id] = {
            requestCount: activity.requestCount,
            bytesReceived: activity.bytesReceived,
            lastActivity: activity.lastActivity,
            firstActivity: created,
          };
        }
      });

      // Set storage data
      return chrome.storage.local.set(storageData).then(() => {
        // Send network stats to background worker
        return chrome.runtime.sendMessage({
          action: 'setFakeNetworkStats',
          stats: networkStatsData
        });
      });
    });
  });

  await setupPage.close();
  console.log('✓ Realistic ages and activity set');
  await wait(4000); // Wait longer for data to propagate to all contexts

  // Screenshot 1: Main Interface
  console.log('\n📸 Screenshot 1: Main Interface...');
  const popup1 = await context.newPage();
  await popup1.goto(popupUrl);
  await wait(3000); // Wait for data to load completely

  // Set to large width (L button)
  try {
    await popup1.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Sort by age to show variety
  try {
    const ageHeader = await popup1.$('th:has-text("Age")');
    if (ageHeader) {
      await ageHeader.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not sort by age, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup1.screenshot({
    path: join(screenshotsPath, '01-main-interface.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 01-main-interface.png');

  // Screenshot 2: Keyboard Navigation (NEW for v0.21.0)
  console.log('\n📸 Screenshot 2: Keyboard Navigation (NEW)...');
  const popup2 = await context.newPage();
  await popup2.goto(popupUrl);
  await wait(2000);

  // Set to large width
  try {
    await popup2.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Press arrow down a few times to show focus indicator
  try {
    await popup2.keyboard.press('ArrowDown');
    await wait(300);
    await popup2.keyboard.press('ArrowDown');
    await wait(300);
    await popup2.keyboard.press('ArrowDown');
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not navigate with keyboard, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup2.screenshot({
    path: join(screenshotsPath, '02-keyboard-navigation.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 02-keyboard-navigation.png');

  // Screenshot 3: Help Modal with Keyboard Shortcuts (NEW for v0.21.0)
  console.log('\n📸 Screenshot 3: Help Modal with Keyboard Shortcuts (NEW)...');
  const popup3 = await context.newPage();
  await popup3.goto(popupUrl);
  await wait(2000);

  // Set to large width
  try {
    await popup3.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Open help modal
  try {
    const helpButton = await popup3.$('button[aria-label="Help"]');
    if (helpButton) {
      await helpButton.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not open help modal, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup3.screenshot({
    path: join(screenshotsPath, '03-help-keyboard-shortcuts.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 03-help-keyboard-shortcuts.png');

  // Screenshot 4: Group by Domain
  console.log('\n📸 Screenshot 4: Group by Domain...');
  const popup4 = await context.newPage();
  await popup4.goto(popupUrl);
  await wait(2000);

  // Set to large width
  try {
    await popup4.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Click group button to cycle to domain grouping
  try {
    const groupButton = await popup4.$('button[aria-label*="group"]');
    if (groupButton) {
      await groupButton.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not activate grouping, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup4.screenshot({
    path: join(screenshotsPath, '04-group-by-domain.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 04-group-by-domain.png');

  // Screenshot 5: Group by Status
  console.log('\n📸 Screenshot 5: Group by Status...');
  const popup5 = await context.newPage();
  await popup5.goto(popupUrl);
  await wait(2000);

  // Set to large width
  try {
    await popup5.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Cycle to status grouping (click group button multiple times)
  try {
    const groupButton5 = await popup5.$('button[aria-label*="group"]');
    if (groupButton5) {
      await groupButton5.click();
      await wait(300);
      await groupButton5.click();
      await wait(300);
      await groupButton5.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not cycle grouping, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup5.screenshot({
    path: join(screenshotsPath, '05-group-by-status.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 05-group-by-status.png');

  // Screenshot 6: Bulk Operations (with selections)
  console.log('\n📸 Screenshot 6: Bulk Operations...');
  const popup6 = await context.newPage();
  await popup6.goto(popupUrl);
  await wait(2000);

  // Set to large width
  try {
    await popup6.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Select several tabs
  try {
    const checkboxes = await popup6.$$('input[type="checkbox"]');
    for (let i = 0; i < Math.min(5, checkboxes.length); i++) {
      await checkboxes[i].check();
      await wait(100);
    }
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not select tabs, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup6.screenshot({
    path: join(screenshotsPath, '06-bulk-operations.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 06-bulk-operations.png');

  // Screenshot 7: Light Theme
  console.log('\n📸 Screenshot 7: Light Theme...');
  const popup7 = await context.newPage();
  await popup7.goto(popupUrl);
  await wait(2000);

  // Set to large width
  try {
    await popup7.click('[aria-label="Set large width"]', { timeout: 5000 });
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not set width, continuing...');
  }

  // Toggle to light theme (click theme button twice)
  try {
    const themeButton = await popup7.$('button[aria-label*="theme"]');
    if (themeButton) {
      await themeButton.click();
      await wait(300);
      await themeButton.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not change theme, continuing...');
  }

  // Capture the full page at viewport size (1280x800)
  await popup7.screenshot({
    path: join(screenshotsPath, '07-light-theme.png'),
    fullPage: false
  });
  console.log('   ✓ Saved: 07-light-theme.png');

  console.log('\n✅ All screenshots captured successfully!');
  console.log(`📁 Screenshots saved to: ${screenshotsPath}`);
  console.log('\n📝 v0.21.0 Screenshots:');
  console.log('   01 - Main Interface (updated)');
  console.log('   02 - Keyboard Navigation (NEW - shows focus indicator)');
  console.log('   03 - Help Modal with Keyboard Shortcuts (NEW)');
  console.log('   04 - Group by Domain (updated)');
  console.log('   05 - Group by Status (updated)');
  console.log('   06 - Bulk Operations (updated)');
  console.log('   07 - Light Theme (updated with improved contrast)');
  console.log('\n📝 Next steps:');
  console.log('   1. Review screenshots in screenshots/ folder');
  console.log('   2. All should be 1280x800 (Chrome Web Store requirement)');
  console.log('   3. Upload to Chrome Web Store');

  // Close browser
  await wait(2000);
  await context.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
