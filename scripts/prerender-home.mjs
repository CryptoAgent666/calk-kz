// Targeted prerender for just / (RU + KK). Used when main prerender misses home.
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST = path.join(__dirname, '..', 'dist');

async function startPreview() {
  const proc = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
  });
  // wait for "Local" url to appear
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('preview timeout')), 30000);
    proc.stdout.on('data', d => {
      if (d.toString().includes('Local')) { clearTimeout(t); resolve(); }
    });
    proc.stderr.on('data', d => process.stderr.write(d));
  });
  return proc;
}

async function main() {
  const previewProc = await startPreview();
  // Extra time for full server warmup
  await new Promise(r => setTimeout(r, 2000));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const langs = [
    { query: '', file: path.join(DIST, 'index.html') },
    { query: '?lang=kk', file: path.join(DIST, '__kk', 'index.html') },
  ];

  for (const lang of langs) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const url = `http://localhost:4173/${lang.query}`;
    console.log('Rendering', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('footer, main', { timeout: 5000 }).catch(() => {});
    const html = await page.content();
    const dir = path.dirname(lang.file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(lang.file, html);
    console.log('Saved', lang.file, html.length, 'bytes');
    await page.close();
  }

  await browser.close();
  previewProc.kill('SIGTERM');
}

main().catch(e => { console.error(e); process.exit(1); });
