import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    '/legal/disclaimer'
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

async function prerender() {
  const distPath = path.join(__dirname, '..', 'dist');
  const port = 4173;
  const languages = [
    { code: 'ru', query: '', outputPrefix: '' },
    { code: 'kk', query: '?lang=kk', outputPrefix: '__kk' }
  ];

  console.log('Starting prerendering...');
  console.log(`Dist path: ${distPath}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
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
    'stats.g.doubleclick.net'
  ];

  const routes = generateRoutes();
  console.log(`Prerendering ${routes.length * languages.length} routes...`);

  let completed = 0;

  for (const route of routes) {
    for (const lang of languages) {
      try {
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', request => {
          try {
            const requestUrl = new URL(request.url());
            const isBlocked = blockedHosts.some(host => requestUrl.hostname === host || requestUrl.hostname.endsWith(`.${host}`));
            if (isBlocked) {
              request.abort();
              return;
            }
          } catch (error) {
            // ignore parsing errors and continue
          }
          request.continue();
        });

        await page.evaluateOnNewDocument(language => {
          try {
            localStorage.setItem('i18nextLng', language);
          } catch (error) {
            // ignore storage errors
          }
        }, lang.code);

        const url = `http://localhost:${port}${route}${lang.query}`;

        completed += 1;
        console.log(`[${completed}/${routes.length * languages.length}] Prerendering: ${route}${lang.query}`);

        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        const expectedLang = lang.code === 'kk' ? 'kk' : 'ru';
        await page.waitForFunction(
          langCode => document.documentElement.lang === langCode,
          { timeout: 10000 },
          expectedLang
        ).catch(() => {});

        await new Promise(resolve => setTimeout(resolve, 1500));

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
        console.log(`  ✓ Saved to: ${filePath}`);

        await page.close();
      } catch (error) {
        console.error(`  ✗ Error prerendering ${route}${lang.query}:`, error.message);
      }
    }
  }

  await browser.close();
  console.log('Prerendering complete!');
}

prerender().catch(error => {
  console.error('Prerender failed:', error);
  process.exit(1);
});
