#!/usr/bin/env node
/**
 * Гейт «dist собран без .env»: сканирует dist/assets/*.js и падает, если в
 * бандл не попали ключи окружения (Vite без .env молча подставляет undefined
 * или заглушки из кода).
 *
 * Инцидент 18.09.2026: бандл 20260918082602 собран в worktree без .env —
 * ушли заглушки RevenueCat appl_XXXX/goog_XXXX (покупки в приложениях сломаны
 * через OTA) и не было VITE_SUPABASE_URL (конвертер валют падал с
 * «supabaseUrl is required»). Гейты 570 / prerender-errors это не видят.
 *
 * Вызывается из deploy-fast.sh и deploy.sh (до заливки сайта) и из
 * publish-app-bundle.mjs (до OTA). Руками: node scripts/check-dist-env.mjs [dist]
 *
 * Значения ключей не печатаются никогда — только имя переменной и что не так.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAIN_ENV = path.join(os.homedir(), 'Projects', 'KZ-CALK', '.env');

// Проверяем по форме значения, а не по «есть ли слово»: в исходниках supabase-js
// есть «supabase.com» и «project-ref.supabase.co» (сейчас минификация их
// выкидывает, но голый поиск «supabase.co» не должен от этого зависеть).
// У реального проекта ref — [a-z0-9] без дефисов; supabase.com не матчится по \b.
const CHECKS = [
  {
    env: 'VITE_RC_IOS_KEY',
    label: 'ключ RevenueCat iOS (appl_…)',
    placeholder: /appl_XXXX/,
    real: /\bappl_(?!XXXX)[A-Za-z0-9]{20,}/,
  },
  {
    env: 'VITE_RC_ANDROID_KEY',
    label: 'ключ RevenueCat Android (goog_…)',
    placeholder: /goog_XXXX/,
    real: /\bgoog_(?!XXXX)[A-Za-z0-9]{20,}/,
  },
  {
    env: 'VITE_SUPABASE_URL',
    label: 'хост проекта Supabase (https://<ref>.supabase.co)',
    real: /https:\/\/[a-z0-9]+\.supabase\.co\b/,
  },
  {
    env: 'VITE_SUPABASE_ANON_KEY',
    label: 'anon-ключ Supabase (JWT или sb_publishable_…)',
    real: /\beyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}|\bsb_publishable_\w{10,}/,
  },
];

/** Список проблем (без значений ключей); пустой — dist в порядке. */
export function findDistEnvProblems(distDir = path.join(ROOT, 'dist')) {
  const assetsDir = path.join(distDir, 'assets');
  const files = fs.existsSync(assetsDir)
    ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'))
    : [];
  if (files.length === 0) {
    const rel = path.relative(ROOT, assetsDir);
    return [`${rel.startsWith('..') ? assetsDir : rel}: нет ни одного .js — dist не собран`];
  }

  const sources = files.map((f) => ({ file: f, text: fs.readFileSync(path.join(assetsDir, f), 'utf-8') }));
  const problems = [];
  for (const c of CHECKS) {
    const withPlaceholder = c.placeholder ? sources.filter((s) => c.placeholder.test(s.text)).map((s) => s.file) : [];
    if (withPlaceholder.length) {
      problems.push(`${c.env}: ${c.label} — заглушка в ${withPlaceholder.join(', ')}`);
    } else if (!sources.some((s) => c.real.test(s.text))) {
      problems.push(`${c.env}: ${c.label} — нет ни в одном файле`);
    }
  }
  return problems;
}

export function distEnvErrorMessage(problems) {
  const inMain = path.resolve(ROOT) === path.dirname(MAIN_ENV);
  const fix = inMain
    ? `  Проверьте ${MAIN_ENV} (переменные выше должны быть заданы) и пересоберите:`
    : `  Скопируйте ~/Projects/KZ-CALK/.env в этот worktree и пересоберите:\n    cp ${MAIN_ENV} ${path.join(path.resolve(ROOT), '.env')}`;
  return [
    '❌ env-гейт: dist собран без ключей из .env — выкладка сайта и OTA-бандла запрещена.',
    '  Проверка dist/assets/*.js:',
    ...problems.map((p) => `  • ${p}`),
    '  (так 18.09.2026 ушёл бандл 20260918082602: покупки в приложениях сломаны, конвертер валют падал)',
    fix,
    '    npm run build:prerender',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const distDir = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));
  const problems = findDistEnvProblems(distDir);
  if (problems.length) {
    console.error(distEnvErrorMessage(problems));
    process.exit(1);
  }
  console.log(`✅ env-гейт: в ${path.relative(process.cwd(), distDir) || distDir}/assets есть ключи RevenueCat iOS/Android и Supabase URL/anon`);
}
