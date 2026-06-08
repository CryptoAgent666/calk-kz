#!/usr/bin/env node
/**
 * Генерация скриншотов для App Store (чистые + промо с подписями).
 *
 * Запуск:
 *   1. npm run build
 *   2. npx vite preview --port 4173 (в отдельном терминале / в фоне)
 *   3. node scripts/generate-app-store-screenshots.mjs
 *
 * Размеры (Apple):
 *   - iPhone 6.5" (1242×2688), 6.9" (1320×2868), iPad 13" (2064×2752)
 *   PNG-и в screenshots/<device>/.
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'screenshots');
const BASE_URL = 'http://localhost:4173';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const DEVICES = [
  { name: '6.5', width: 1242, height: 2688, scale: 3 },
  { name: '6.9', width: 1320, height: 2868, scale: 3 },
  { name: 'ipad-13', width: 2064, height: 2752, scale: 2, isTablet: true },
];

// promo: подпись-фича (с \n для переноса) → промо-стиль; без promo → чистая страница.
const PAGES = [
  { name: '01-home',       url: '/',                                 promo: 'Все калькуляторы\nКазахстана', g: 0 },
  { name: '02-salary',     url: '/calculator/salary/',               promo: 'Зарплата и налоги\nпо НК РК 2026', g: 1 },
  { name: '03-property',   url: '/calculator/property-tax/',         promo: 'Налоговые ставки\nактуальны на 2026', g: 2 },
  { name: '04-mortgage',   url: '/calculator/mortgage-specialized/', promo: 'Кредиты и ипотека —\nточный расчёт ГЭСВ', g: 3 },
  { name: '05-vat',        url: '/calculator/vat/' },              // чистая
  { name: '06-deductions', url: '/calculator/tax-deductions/' },   // чистая
];

const GRADIENTS = [
  'linear-gradient(160deg,#4f46e5 0%,#7c3aed 100%)',
  'linear-gradient(160deg,#0ea5e9 0%,#2563eb 100%)',
  'linear-gradient(160deg,#059669 0%,#0d9488 100%)',
  'linear-gradient(160deg,#7c3aed 0%,#db2777 100%)',
];

async function captureApp(browser, device, url) {
  const tab = await browser.newPage();
  const cssW = Math.floor(device.width / device.scale);
  const cssH = Math.floor(device.height / device.scale);
  await tab.setViewport({ width: cssW, height: cssH, deviceScaleFactor: device.scale, isMobile: !device.isTablet, hasTouch: true });
  await tab.setUserAgent(device.isTablet ? IPAD_UA : IPHONE_UA);
  await tab.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2', timeout: 40000 });
  await tab.evaluate(() => {
    document.querySelectorAll('ins.adsbygoogle,[class*="adsense"],[role="dialog"],[class*="cookie"]').forEach(el => el.remove());
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 900));
  const b64 = await tab.screenshot({ encoding: 'base64', fullPage: false });
  await tab.close();
  return b64;
}

async function renderPromo(browser, device, caption, appB64, gradient) {
  const tab = await browser.newPage();
  const cssW = Math.floor(device.width / device.scale);
  const cssH = Math.floor(device.height / device.scale);
  await tab.setViewport({ width: cssW, height: cssH, deviceScaleFactor: device.scale });
  const capFont = device.isTablet ? Math.round(cssW * 0.072) : Math.round(cssW * 0.105);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${cssW}px;height:${cssH}px;background:${gradient};
      font-family:-apple-system,'SF Pro Display','Helvetica Neue',Inter,sans-serif;
      overflow:hidden;display:flex;flex-direction:column;align-items:center}
    .cap{color:#fff;text-align:center;font-weight:800;font-size:${capFont}px;line-height:1.16;
      padding:${Math.round(cssH * 0.05)}px ${Math.round(cssW * 0.07)}px ${Math.round(cssH * 0.025)}px;
      white-space:pre-line;letter-spacing:-0.5px;text-shadow:0 2px 24px rgba(0,0,0,.18)}
    .frame{flex:1;width:${Math.round(cssW * 0.86)}px;
      border-radius:${Math.round(cssW * 0.07)}px ${Math.round(cssW * 0.07)}px 0 0;
      overflow:hidden;background:#fff;
      box-shadow:0 ${Math.round(cssH * 0.012)}px ${Math.round(cssH * 0.06)}px rgba(0,0,0,.35);
      border:1px solid rgba(255,255,255,.25)}
    .frame img{width:100%;display:block}
  </style></head><body>
    <div class="cap">${caption}</div>
    <div class="frame"><img src="data:image/png;base64,${appB64}"></div>
  </body></html>`;
  await tab.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 300));
  const buf = await tab.screenshot({ fullPage: false });
  await tab.close();
  return buf;
}

async function shoot() {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const device of DEVICES) {
    console.log(`\n📱 ${device.name} (${device.width}×${device.height})`);
    const dir = path.join(OUT, device.name);
    await mkdir(dir, { recursive: true });
    for (const page of PAGES) {
      try {
        const appB64 = await captureApp(browser, device, page.url);
        const file = path.join(dir, `${page.name}.png`);
        if (page.promo) {
          const buf = await renderPromo(browser, device, page.promo, appB64, GRADIENTS[page.g % GRADIENTS.length]);
          const { writeFile } = await import('fs/promises');
          await writeFile(file, buf);
          console.log(`  ✓ ${page.name}.png (промо)`);
        } else {
          const { writeFile } = await import('fs/promises');
          await writeFile(file, Buffer.from(appB64, 'base64'));
          console.log(`  ✓ ${page.name}.png (чистый)`);
        }
      } catch (err) {
        console.error(`  ✗ ${page.name}: ${err.message}`);
      }
    }
  }
  await browser.close();
  console.log(`\n✅ Готово → ${OUT}`);
}

shoot().catch(err => { console.error(err); process.exit(1); });
