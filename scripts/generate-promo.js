#!/usr/bin/env node
// Render the Chrome Web Store promo images from assets/promo-*.html.
import { chromium } from 'playwright';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const IMAGES = [
  { html: 'promo-tile.html', out: 'promo-tile-440x280.png', width: 440, height: 280 },
  { html: 'promo-marquee.html', out: 'promo-marquee-1400x560.png', width: 1400, height: 560 },
];

const browser = await chromium.launch();
try {
  for (const { html, out, width, height } of IMAGES) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(pathToFileURL(join(assets, html)).href);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(assets, out) });
    await page.close();
    console.log(`✓ assets/${out}`);
  }
} finally {
  await browser.close();
}
