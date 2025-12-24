import { chromium } from 'playwright';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1400, height: 560 }
  });

  const htmlPath = join(__dirname, '../../autopsy-store-assets/assets/promo-marquee.html');
  await page.goto(`file://${htmlPath}`);

  await page.screenshot({
    path: join(__dirname, '../../autopsy-store-assets/assets/promo-marquee-1400x560.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Marquee image generated: ../autopsy-store-assets/assets/promo-marquee-1400x560.png');
})();
