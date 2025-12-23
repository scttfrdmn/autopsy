#!/usr/bin/env node

/**
 * Capture Chrome Web Store screenshots using Playwright
 *
 * This script:
 * 1. Launches Chrome with Autopsy extension loaded
 * 2. Creates test tabs with various characteristics
 * 3. Opens extension popup
 * 4. Captures screenshots of different features
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
  { url: 'https://typescript.org', wait: 260 },
  { url: 'https://react.dev', wait: 230 },
];

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting screenshot capture...\n');

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

  // Screenshot 1: Main Interface
  console.log('\n📸 Screenshot 1: Main Interface...');
  const popup1 = await context.newPage();
  await popup1.goto(popupUrl);
  await wait(2000); // Wait for data to load

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

  // Capture just the app element (removes white space)
  const appElement = await popup1.$('.app');
  if (appElement) {
    await appElement.screenshot({
      path: join(screenshotsPath, '01-main-interface.png')
    });
  } else {
    await popup1.screenshot({
      path: join(screenshotsPath, '01-main-interface.png'),
      fullPage: true
    });
  }
  console.log('   ✓ Saved: 01-main-interface.png');

  // Screenshot 2: Group by Domain
  console.log('\n📸 Screenshot 2: Group by Domain...');
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

  // Click group button to cycle to domain grouping
  try {
    const groupButton = await popup2.$('button[aria-label*="group"]');
    if (groupButton) {
      await groupButton.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not activate grouping, continuing...');
  }

  // Capture just the app element
  const appElement2 = await popup2.$('.app');
  if (appElement2) {
    await appElement2.screenshot({
      path: join(screenshotsPath, '02-group-by-domain.png')
    });
  } else {
    await popup2.screenshot({
      path: join(screenshotsPath, '02-group-by-domain.png'),
      fullPage: true
    });
  }
  console.log('   ✓ Saved: 02-group-by-domain.png');

  // Screenshot 3: Group by Status
  console.log('\n📸 Screenshot 3: Group by Status...');
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

  // Cycle to status grouping (click group button multiple times)
  try {
    const groupButton3 = await popup3.$('button[aria-label*="group"]');
    if (groupButton3) {
      await groupButton3.click();
      await wait(300);
      await groupButton3.click();
      await wait(300);
      await groupButton3.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not cycle grouping, continuing...');
  }

  // Capture just the app element
  const appElement3 = await popup3.$('.app');
  if (appElement3) {
    await appElement3.screenshot({
      path: join(screenshotsPath, '03-group-by-status.png')
    });
  } else {
    await popup3.screenshot({
      path: join(screenshotsPath, '03-group-by-status.png'),
      fullPage: true
    });
  }
  console.log('   ✓ Saved: 03-group-by-status.png');

  // Screenshot 4: Bulk Operations (with selections)
  console.log('\n📸 Screenshot 4: Bulk Operations...');
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

  // Select several tabs
  try {
    const checkboxes = await popup4.$$('input[type="checkbox"]');
    for (let i = 0; i < Math.min(5, checkboxes.length); i++) {
      await checkboxes[i].check();
      await wait(100);
    }
    await wait(500);
  } catch (e) {
    console.log('   ⚠ Could not select tabs, continuing...');
  }

  // Capture just the app element
  const appElement4 = await popup4.$('.app');
  if (appElement4) {
    await appElement4.screenshot({
      path: join(screenshotsPath, '04-bulk-operations.png')
    });
  } else {
    await popup4.screenshot({
      path: join(screenshotsPath, '04-bulk-operations.png'),
      fullPage: true
    });
  }
  console.log('   ✓ Saved: 04-bulk-operations.png');

  // Screenshot 5: Light Theme
  console.log('\n📸 Screenshot 5: Light Theme...');
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

  // Toggle to light theme (click theme button twice)
  try {
    const themeButton = await popup5.$('button[aria-label*="theme"]');
    if (themeButton) {
      await themeButton.click();
      await wait(300);
      await themeButton.click();
      await wait(500);
    }
  } catch (e) {
    console.log('   ⚠ Could not change theme, continuing...');
  }

  // Capture just the app element
  const appElement5 = await popup5.$('.app');
  if (appElement5) {
    await appElement5.screenshot({
      path: join(screenshotsPath, '05-light-theme.png')
    });
  } else {
    await popup5.screenshot({
      path: join(screenshotsPath, '05-light-theme.png'),
      fullPage: true
    });
  }
  console.log('   ✓ Saved: 05-light-theme.png');

  console.log('\n✅ All screenshots captured successfully!');
  console.log(`📁 Screenshots saved to: ${screenshotsPath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Review screenshots in screenshots/ folder');
  console.log('   2. Resize if needed to exactly 1280x800');
  console.log('   3. Upload to Chrome Web Store');

  // Close browser
  await wait(2000);
  await context.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
