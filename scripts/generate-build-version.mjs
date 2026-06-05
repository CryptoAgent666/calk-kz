#!/usr/bin/env node
/**
 * Пишет public/build-version.json с сортируемой версией текущей сборки.
 * Эту версию несёт каждый веб-бандл (вшитый в приложение и OTA) — по ней
 * src/liveUpdates.ts сравнивает «свежесть» с манифестом на сервере.
 * Запускается в начале build / build:prerender.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const d = new Date();
const p = (n) => String(n).padStart(2, '0');
// Формат YYYYMMDDHHmmss (UTC) — одинаковая длина → лексикографическое сравнение = хронологическое.
const version =
  `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
  `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;

const out = path.join(__dirname, '..', 'public', 'build-version.json');
fs.writeFileSync(out, JSON.stringify({ version, builtAt: d.toISOString() }) + '\n');
console.log(`✅ build-version: ${version}`);
