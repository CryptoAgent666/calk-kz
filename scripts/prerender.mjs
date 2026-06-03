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
    timeout: 30000
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

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

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
    const context = await browser.createBrowserContext();
    // Pre-create 2 pages (one per locale) — reuse instead of newPage/close cycle
    const pages = {
      ru: await setupPage(context, 'ru'),
      kk: await setupPage(context, 'kk'),
    };

    try {
      while (true) {
        const currentIndex = jobIndex++;
        if (currentIndex >= jobs.length) break;
        const { route, lang } = jobs[currentIndex];

        try {
          const page = pages[lang.code];
          const filePath = await prerenderRoute(page, distPath, lang, route);
          completed += 1;
          if (completed % 10 === 0 || completed === total) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const rate = (completed / parseFloat(elapsed)).toFixed(1);
            console.log(`[${completed}/${total}] ${elapsed}s elapsed @ ${rate} pages/s (W${workerId}: ${route}${lang.query})`);
          }
        } catch (error) {
          errors.push({ route, lang: lang.code, error: error.message });
          completed += 1;
          console.error(`  ✗ Error prerendering ${route}${lang.query}:`, error.message);
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
