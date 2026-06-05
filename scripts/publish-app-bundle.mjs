#!/usr/bin/env node
/**
 * Публикует текущий dist как OTA-бандл для нативного приложения:
 *   1) берёт версию из dist/build-version.json;
 *   2) зипует содержимое dist/ → bundle-<version>.zip (index.html в корне zip);
 *   3) пишет latest.json = { version, url, builtAt };
 *   4) заливает bundle-<version>.zip и latest.json в calk.kz/app-updates/ по FTP
 *      (использует .env.deploy, как deploy.sh).
 *
 * Запуск: npm run publish:app   (после build:prerender)
 *
 * Приложение (src/liveUpdates.ts) на старте читает latest.json и, если версия
 * новее вшитой/применённой, скачивает zip и применяет при следующем резюме —
 * без релиза в App Store / Google Play.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const REMOTE_SUBDIR = 'app-updates';
const BASE_URL = 'https://calk.kz';

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

// --- 1. версия ---
const bvPath = path.join(DIST, 'build-version.json');
if (!fs.existsSync(bvPath)) die('dist/build-version.json не найден — сначала `npm run build:prerender`.');
const { version, builtAt } = JSON.parse(fs.readFileSync(bvPath, 'utf-8'));
if (!version) die('пустая версия в build-version.json');

// --- 2. zip (index.html в корне архива) ---
const work = fs.mkdtempSync(path.join(tmpdir(), 'calk-bundle-'));
const zipPath = path.join(work, `bundle-${version}.zip`);
console.log(`📦 Зипую dist → ${path.basename(zipPath)} …`);
execFileSync('zip', ['-qr', zipPath, '.', '-x', '.DS_Store'], { cwd: DIST, stdio: 'inherit' });
const zipSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);

// --- 3. latest.json ---
const manifest = {
  version,
  url: `${BASE_URL}/${REMOTE_SUBDIR}/bundle-${version}.zip`,
  builtAt: builtAt || new Date().toISOString(),
};
const manifestPath = path.join(work, 'latest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// --- 4. FTP upload (.env.deploy) ---
const envPath = path.join(ROOT, '.env.deploy');
if (!fs.existsSync(envPath)) die('.env.deploy не найден');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const { FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_DIR } = env;
if (!FTP_HOST || !FTP_USER || !FTP_PASS || !FTP_REMOTE_DIR) die('в .env.deploy нет FTP_* переменных');

const remoteDir = `${FTP_REMOTE_DIR.replace(/\/$/, '')}/${REMOTE_SUBDIR}`;
const lftpScript = `
set ftp:ssl-allow yes
set ftp:ssl-force no
set ssl:verify-certificate no
set net:timeout 30
open -u ${FTP_USER},${FTP_PASS} ${FTP_HOST}
mkdir -p ${remoteDir}
cd ${remoteDir}
put -O . ${zipPath}
put -O . ${manifestPath}
quit
`;
console.log(`🚀 Заливаю в ${FTP_HOST}:${remoteDir} (zip ${zipSize} МБ) …`);
try {
  execFileSync('lftp', ['-c', lftpScript], { stdio: 'inherit' });
} catch {
  die('lftp upload не удался');
}

fs.rmSync(work, { recursive: true, force: true });
console.log(`✅ Опубликован OTA-бандл v${version}`);
console.log(`   manifest: ${BASE_URL}/${REMOTE_SUBDIR}/latest.json`);
console.log(`   bundle:   ${manifest.url}`);
console.log(`   Приложения подхватят его при следующем запуске/резюме.`);
