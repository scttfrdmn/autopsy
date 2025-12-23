#!/usr/bin/env node

/**
 * Generate 440×280 promotional tile for Chrome Web Store
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const htmlPath = join(projectRoot, 'assets', 'promo-tile.html');
const outputPath = join(projectRoot, 'assets', 'promo-tile-440x280.png');

async function generatePromoTile() {
  console.log('🎨 Generating promotional tile...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 440, height: 280 }
  });

  console.log('📄 Loading design from:', htmlPath);
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(1000); // Wait for fonts to load

  console.log('📸 Capturing 440×280 image...');
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  await browser.close();

  console.log('✅ Promotional tile generated!');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log('\n📝 Next step: Upload to Chrome Web Store as Small Tile (440×280)');
}

generatePromoTile().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
