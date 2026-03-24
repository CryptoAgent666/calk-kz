import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://calk.kz';
const TODAY = new Date().toISOString().split('T')[0];

function loadCalculatorCategories() {
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'calculators.ts');
  const source = fs.readFileSync(dataPath, 'utf-8');
  const categories = [];
  let currentCategory = null;

  for (const line of source.split('\n')) {
    const match = line.match(/^\s*id:\s*'([^']+)'/);
    if (!match) continue;

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

function urlEntry(loc, { changefreq = 'weekly', priority = '0.5', lastmod = TODAY } = {}) {
  const ruUrl = loc;
  // For __kk pages, the kk URL is the loc itself; for ru pages, derive kk URL
  const isKk = loc.includes('/__kk/');
  const kkUrl = isKk ? loc : loc.replace(BASE_URL, `${BASE_URL}/__kk`);
  const ruUrlClean = isKk ? loc.replace('/__kk', '') : loc;

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="${ruUrlClean}" />
    <xhtml:link rel="alternate" hreflang="kk" href="${kkUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${ruUrlClean}" />
  </url>`;
}

function generateSitemap() {
  const categories = loadCalculatorCategories();
  const entries = [];

  // Homepage — both languages
  entries.push(urlEntry(`${BASE_URL}/`, { changefreq: 'daily', priority: '1.0' }));
  entries.push(urlEntry(`${BASE_URL}/__kk/`, { changefreq: 'daily', priority: '1.0' }));

  // Categories
  for (const cat of categories) {
    entries.push(urlEntry(`${BASE_URL}/category/${cat.id}/`, { changefreq: 'weekly', priority: '0.9' }));
    entries.push(urlEntry(`${BASE_URL}/__kk/category/${cat.id}/`, { changefreq: 'weekly', priority: '0.9' }));
  }

  // Calculators (deduplicate — some calculators appear in multiple categories)
  const seenCalcIds = new Set();
  for (const cat of categories) {
    for (const calc of cat.calculators) {
      if (seenCalcIds.has(calc.id)) continue;
      seenCalcIds.add(calc.id);
      entries.push(urlEntry(`${BASE_URL}/calculator/${calc.id}/`, { changefreq: 'monthly', priority: '0.8' }));
      entries.push(urlEntry(`${BASE_URL}/__kk/calculator/${calc.id}/`, { changefreq: 'monthly', priority: '0.8' }));
    }
  }

  // Legal pages
  const legalPages = ['about', 'contact', 'privacy', 'terms', 'disclaimer'];
  for (const page of legalPages) {
    entries.push(urlEntry(`${BASE_URL}/legal/${page}/`, { changefreq: 'monthly', priority: '0.3' }));
    entries.push(urlEntry(`${BASE_URL}/__kk/legal/${page}/`, { changefreq: 'monthly', priority: '0.3' }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml);

  const urlCount = entries.length;
  console.log(`Sitemap generated: ${urlCount} URLs (${urlCount / 2} ru + ${urlCount / 2} kk)`);
  console.log(`Saved to: ${outputPath}`);
}

generateSitemap();
