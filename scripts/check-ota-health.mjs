#!/usr/bin/env node
/**
 * OTA health-check для calk.kz (нативные iOS/Android приложения).
 *
 * Проверяет, что канал OTA живой и свежий:
 *   1) https://calk.kz/app-updates/latest.json отдаёт application/json
 *      (а НЕ text/html — SPA-fallback = манифест снесён/не залит → OTA мёртв);
 *   2) в манифесте валидная version (timestamp YYYYMMDDHHmmss) и не старше
 *      MAX_AGE_DAYS (давно не публиковали → возможно забыли `npm run publish:app`);
 *   3) bundle-<version>.zip доступен (HTTP 200, application/zip).
 *
 * При любой проблеме шлёт алерт в Telegram (если заданы TELEGRAM_BOT_TOKEN и
 * TELEGRAM_CHAT_ID в окружении, напр. из /opt/data_hub/calk-constants/secrets/alerts.env),
 * иначе печатает в stderr. Exit code 1 при проблеме, 0 если всё ок — удобно для cron.
 *
 * Запуск:  node scripts/check-ota-health.mjs   (или npm run check:ota)
 * Cron:    0 9 * * *  cd /path/KZ-CALK && node scripts/check-ota-health.mjs
 */

const MANIFEST_URL = 'https://calk.kz/app-updates/latest.json';
const MAX_AGE_DAYS = Number(process.env.OTA_MAX_AGE_DAYS || 21);

function parseVersionTs(v) {
  // YYYYMMDDHHmmss → Date (UTC)
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(v || ''));
  if (!m) return null;
  const [, Y, Mo, D, H, Mi, S] = m;
  return new Date(Date.UTC(+Y, +Mo - 1, +D, +H, +Mi, +S));
}

async function telegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    console.error('(Telegram не настроен — TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID отсутствуют; печатаю локально)');
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error('Telegram send failed:', e?.message);
  }
}

async function main() {
  const problems = [];
  let manifest = null;

  // 1) манифест: JSON, не HTML
  try {
    const res = await fetch(`${MANIFEST_URL}?cb=${Date.now()}`, { cache: 'no-store' });
    const ctype = res.headers.get('content-type') || '';
    if (!res.ok) {
      problems.push(`latest.json HTTP ${res.status}`);
    } else if (!ctype.includes('application/json')) {
      problems.push(`latest.json отдаёт "${ctype}" вместо application/json — вероятно SPA-fallback, манифест снесён (mirror --delete?) или не залит. OTA НЕ работает.`);
    } else {
      manifest = await res.json().catch(() => null);
      if (!manifest?.version || !manifest?.url) problems.push('latest.json без version/url');
    }
  } catch (e) {
    problems.push(`latest.json недоступен: ${e?.message}`);
  }

  // 2) свежесть версии
  if (manifest?.version) {
    const d = parseVersionTs(manifest.version);
    if (!d) {
      problems.push(`невалидная version "${manifest.version}" (ожидается YYYYMMDDHHmmss)`);
    } else {
      const ageDays = (Date.now() - d.getTime()) / 86400000;
      if (ageDays > MAX_AGE_DAYS) {
        problems.push(`OTA-бандл старый: ${ageDays.toFixed(0)} дн (> ${MAX_AGE_DAYS}). Последняя публикация ${manifest.version}. Возможно, забыли \`npm run publish:app\` после деплоя.`);
      }
    }
  }

  // 3) bundle доступен
  if (manifest?.url) {
    try {
      const res = await fetch(manifest.url, { method: 'HEAD', cache: 'no-store' });
      const ctype = res.headers.get('content-type') || '';
      if (!res.ok) problems.push(`bundle zip HTTP ${res.status} (${manifest.url})`);
      else if (!ctype.includes('zip')) problems.push(`bundle отдаёт "${ctype}" вместо application/zip`);
    } catch (e) {
      problems.push(`bundle недоступен: ${e?.message}`);
    }
  }

  if (problems.length) {
    const msg = `🔴 calk.kz OTA health FAILED:\n• ${problems.join('\n• ')}\n\nПочинка: npm run build:prerender && ./deploy.sh (deploy.sh теперь сам зовёт publish:app).`;
    console.error(msg);
    await telegram(msg);
    process.exit(1);
  }

  console.log(`✅ OTA ok — v${manifest.version} (${manifest.url}), свежесть в пределах ${MAX_AGE_DAYS} дн.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('check-ota-health crashed:', e?.message);
  process.exit(1);
});
