#!/usr/bin/env node

/**
 * Generate 1400×560 promotional marquee for Chrome Web Store
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const htmlPath = join(projectRoot, 'assets', 'promo-marquee.html');
const outputPath = join(projectRoot, 'assets', 'promo-marquee-1400x560.png');

async function generatePromoMarquee() {
  console.log('🎨 Generating promotional marquee...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1400, height: 560 }
  });

  console.log('📄 Loading design from:', htmlPath);
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(1500); // Wait for fonts and rendering

  console.log('📸 Capturing 1400×560 image...');
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  await browser.close();

  console.log('✅ Promotional marquee generated!');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log('\n📝 Next step: Upload to Chrome Web Store as Marquee (1400×560)');
}

generatePromoMarquee().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
