import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONCURRENCY = parseInt(process.env.PRERENDER_CONCURRENCY || '4', 10);

function loadCalculatorCategories() {
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'calculators.ts');
  const source = fs.readFileSync(dataPath, 'utf-8');
  const categories = [];
  let currentCategory = null;

  for (const line of source.split('\n')) {
    const match = line.match(/^\s*id:\s*'([^']+)'/);
    if (!match) {
      continue;
    }

    const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    if (indent === 4) {
      currentCategory = { id: match[1], calculators: [] };
      categories.push(currentCategory);
      continue;
    }

    if (indent === 8 && currentCategory) {
      currentCategory.calculators.push({ id: match[1] });
    }
  }

  return categories;
}

function generateRoutes() {
  const routes = new Set([
    '/',
    '/legal/about',
    '/legal/contact',
    '/legal/privacy',
    '/legal/terms',
    '/legal/disclaimer',
    '/legal/updates'
  ]);

  const calculatorCategories = loadCalculatorCategories();
  calculatorCategories.forEach(category => {
    routes.add(`/category/${category.id}`);
    category.calculators.forEach(calc => {
      routes.add(`/calculator/${calc.id}`);
      routes.add(`/embed/${calc.id}`);
    });
  });

  return Array.from(routes);
}

// Block heavy/irrelevant resources for static HTML prerendering
// Hosts: ads, analytics, tracking
const blockedHosts = [
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'doubleclick.net',
  'www.google.com',
  'www.gstatic.com',
  'recaptcha.google.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'google-analytics.com',
  'stats.g.doubleclick.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'sentry.io',
  'browser.sentry-cdn.com',
  'ingest.sentry.io',
];

// Resource types not needed in static HTML
const blockedResourceTypes = new Set([
  'image',
  'media',
  'font',
  'websocket',
  'eventsource',
  'manifest',
  'beacon',
  'ping',
]);

function shouldBlockRequest(request) {
  // Block irrelevant resource types
  if (blockedResourceTypes.has(request.resourceType())) {
    return true;
  }
  // Block known ad/tracking hosts
  try {
    const requestUrl = new URL(request.url());
    return blockedHosts.some(host =>
      requestUrl.hostname === host || requestUrl.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

async function setupPage(context, langCode) {
  const page = await context.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (shouldBlockRequest(request)) {
      request.abort().catch(() => {});
      return;
    }
    request.continue().catch(() => {});
  });

  await page.evaluateOnNewDocument(language => {
    try {
      localStorage.setItem('i18nextLng', language);
    } catch {
      // ignore storage errors
    }
    // Метка «это снимок для статики»: компоненты, которые на клиенте при первом
    // рендере показывают плейсхолдер (чарты в ui/ChartComponents), не должны
    // попасть в HTML уже отрендеренными — иначе гидратация валится структурно.
    window.__PRERENDER__ = true;
  }, langCode);

  // Cache static assets (CSS/JS chunks) — reuse between page loads
  await page.setCacheEnabled(true);

  return page;
}

async function prerenderRoute(page, distPath, lang, route) {
  const port = 4173;
  const url = `http://localhost:${port}${route}${lang.query}`;

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  const expectedLang = lang.code === 'kk' ? 'kk' : 'ru';
  // Ждём смены языка до 15с. Если не сменился — БРАКОВАННАЯ страница,
  // регистрируем в errors[] и пропускаем (вместо silent .catch получим запись в prerender-errors.json).
  let langSwitched = true;
  try {
    await page.waitForFunction(
      langCode => document.documentElement.lang === langCode,
      { timeout: 15000 },
      expectedLang
    );
  } catch {
    langSwitched = false;
  }
  if (!langSwitched) {
    throw new Error(`lang did not switch to ${expectedLang} within 15s (got ${await page.evaluate(() => document.documentElement.lang)})`);
  }

  // Wait for hydration markers in parallel (footer + main)
  await Promise.all([
    page.waitForSelector('footer', { timeout: 3000 }).catch(() => {}),
    page.waitForSelector('main', { timeout: 3000 }).catch(() => {}),
  ]);

  await page.evaluate(() => {
    document.querySelectorAll('meta[http-equiv="origin-trial"]').forEach(el => el.remove());
    document.querySelectorAll('script[src*="pagead/managed"]').forEach(el => el.remove());
    document.querySelectorAll('ins.adsbygoogle').forEach(el => el.remove());
    document.querySelectorAll('iframe[id^="aswift_"], iframe[id^="google_esf"]').forEach(el => el.remove());
    document.querySelectorAll('iframe[src*="googleads"], iframe[src*="doubleclick"], iframe[src*="recaptcha"]').forEach(el => el.remove());
  });

  // КРИТИЧНО для гидратации: JSX вида `{count} {word}` даёт НЕСКОЛЬКО соседних
  // текстовых узлов, а сериализация DOM в HTML (page.content()) склеивает их в
  // один — при hydrateRoot React ждёт отдельные узлы и валит mismatch (#418),
  // затем #423 «весь root переключается на клиентский рендер», т.е. пререндер
  // фактически обесценивается. React SSR ставит в таких местах разделитель
  // `<!-- -->`; воспроизводим его вручную ПЕРЕД снятием HTML.
  await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return 0;
    const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE']);
    const elements = [root, ...root.querySelectorAll('*')];
    let inserted = 0;
    for (const el of elements) {
      if (SKIP.has(el.tagName)) continue;
      const kids = Array.from(el.childNodes);
      for (let i = 0; i < kids.length - 1; i++) {
        if (kids[i].nodeType === Node.TEXT_NODE && kids[i + 1].nodeType === Node.TEXT_NODE) {
          el.insertBefore(document.createComment(''), kids[i + 1]);
          inserted++;
        }
      }
    }
    return inserted;
  });

  const html = await page.content();
  const normalizedRoute = route === '/' ? '' : route.replace(/^\/+/, '');
  const outputRoot = lang.outputPrefix ? path.join(distPath, lang.outputPrefix) : distPath;
  const filePath = route === '/'
    ? path.join(outputRoot, 'index.html')
    : path.join(outputRoot, normalizedRoute, 'index.html');
  const fileDir = path.dirname(filePath);

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  fs.writeFileSync(filePath, html);
  return filePath;
}

async function prerender() {
  const distPath = path.join(__dirname, '..', 'dist');
  const languages = [
    { code: 'ru', query: '', outputPrefix: '' },
    { code: 'kk', query: '?lang=kk', outputPrefix: '__kk' }
  ];

  console.log('Starting prerendering...');
  console.log(`Dist path: ${distPath}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  // Браузер может умереть целиком (OOM: «Connection closed» на всех воркерах
  // разом — 2026-08-02 так каскадом легли 141 маршрут после 429 успешных).
  // Поэтому не держим один экземпляр, а умеем перезапускать: ensureBrowser()
  // возвращает живой browser, перезапуская Chrome при необходимости; параллельные
  // вызовы из воркеров сливаются в один relaunch через общий промис.
  let browser = null;
  let relaunchPromise = null;

  async function ensureBrowser() {
    if (browser && browser.isConnected()) return browser;
    if (!relaunchPromise) {
      relaunchPromise = (async () => {
        if (browser) await browser.close().catch(() => {});
        console.warn('  ⟳ перезапуск Chrome...');
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      })().finally(() => { relaunchPromise = null; });
    }
    await relaunchPromise;
    return browser;
  }

  await ensureBrowser();

  const routes = generateRoutes();

  // Build job queue: each job = { route, lang }
  const jobs = [];
  for (const route of routes) {
    for (const lang of languages) {
      jobs.push({ route, lang });
    }
  }
  const total = jobs.length;
  console.log(`Prerendering ${total} routes with ${CONCURRENCY} workers...`);

  let completed = 0;
  let jobIndex = 0;
  const errors = [];
  const startTime = Date.now();

  async function worker(workerId) {
    // Each worker uses its own browser context for isolation
    // (separate localStorage, cookies, cache)
    let context = await browser.createBrowserContext();
    // Pre-create 2 pages (one per locale) — reuse instead of newPage/close cycle
    let pages = {
      ru: await setupPage(context, 'ru'),
      kk: await setupPage(context, 'kk'),
    };

    try {
      while (true) {
        const currentIndex = jobIndex++;
        if (currentIndex >= jobs.length) break;
        const { route, lang } = jobs[currentIndex];

        // Ретрай транзиентных таймаутов (networkidle2 изредка не доходит до idle на
        // случайной странице). 3 попытки — иначе частичный dist ломает deploy --delete.
        const MAX_RETRIES = 2; // 1 + 2 ретрая = 3 попытки
        let ok = false;
        let lastError = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            await prerenderRoute(pages[lang.code], distPath, lang, route);
            ok = true;
            break;
          } catch (error) {
            lastError = error;
            // Detached page/frame (краш вкладки Chrome): переиспользуемая page
            // мертва навсегда — без пересоздания каскадом падают ВСЕ оставшиеся
            // роуты воркера (2026-07-10: 484 роута после смерти на /calculator/vat).
            // Если умер весь браузер (Connection closed) — перезапускаем Chrome
            // и пересоздаём контекст воркера целиком.
            if (/detached|Target closed|Session closed|disconnected|Connection closed|Protocol error/i.test(error.message)) {
              await ensureBrowser();
              try {
                await pages[lang.code].close().catch(() => {});
                pages[lang.code] = await setupPage(context, lang.code);
              } catch {
                // контекст умер вместе с браузером — новый контекст + обе страницы
                try {
                  await context.close().catch(() => {});
                  context = await browser.createBrowserContext();
                  pages = {
                    ru: await setupPage(context, 'ru'),
                    kk: await setupPage(context, 'kk'),
                  };
                  console.warn(`  ⟳ W${workerId}: контекст пересоздан после смерти браузера`);
                } catch (recreateErr) {
                  console.warn(`  ⚠ W${workerId}: не удалось пересоздать контекст: ${recreateErr.message}`);
                }
              }
            }
            if (attempt < MAX_RETRIES) {
              console.warn(`  ⟳ retry ${attempt + 1}/${MAX_RETRIES} ${route}${lang.query}: ${error.message}`);
            }
          }
        }
        completed += 1;
        if (ok) {
          if (completed % 10 === 0 || completed === total) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (completed / parseFloat(elapsed)).toFixed(1);
            console.log(`[${completed}/${total}] ${elapsed}s elapsed @ ${rate} pages/s (W${workerId}: ${route}${lang.query})`);
          }
        } else {
          errors.push({ route, lang: lang.code, error: lastError.message });
          console.error(`  ✗ Error prerendering ${route}${lang.query} (after ${MAX_RETRIES + 1} attempts):`, lastError.message);
        }
      }
    } finally {
      // Close pages and context
      for (const page of Object.values(pages)) {
        await page.close().catch(() => {});
      }
      await context.close().catch(() => {});
    }
  }

  // Spawn N workers in parallel
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i + 1));
  }
  await Promise.all(workers);

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nPrerendering complete in ${elapsed}s (${(total / parseFloat(elapsed)).toFixed(2)} pages/sec)`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} errors occurred:`);
    errors.forEach(e => console.error(`  - ${e.route} (${e.lang}): ${e.error}`));
    const errorReport = path.join(distPath, 'prerender-errors.json');
    fs.writeFileSync(errorReport, JSON.stringify(errors, null, 2));
    process.exit(1);
  }
}

prerender().catch(error => {
  console.error('Prerender failed:', error);
  process.exit(1);
});
