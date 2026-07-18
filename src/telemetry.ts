/**
 * Воронка IAP «Убрать рекламу» → self-hosted DATA_HUB.
 *
 * Fire-and-forget, БЕЗ секрета в клиенте: эндпоинт принимает write-only ingest
 * (строгий allowlist типов на сервере), CORS открыт, авторизация не нужна — в
 * клиентский бандл (веб + OTA) секреты не кладём. Успех покупки отдельно НЕ
 * шлём — он и так придёт RevenueCat-webhook'ом, а rollup сводит
 * buy_rate = покупки ÷ показы.
 */
import { isScreenshotMode } from './utils/screenshotMode';

const TELEMETRY_URL = 'https://mydatahub.duckdns.org/webhooks/app-telemetry';
const APP_ID = 'calk.kz'; // ← calk.nz / calk.uz в своих репо

export type IapFunnelEvent =
  | 'paywall_shown'
  | 'purchase_tapped'
  | 'purchase_cancelled'
  | 'purchase_failed';

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* ignore */ }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Отправить один шаг воронки. Никогда не бросает и не блокирует UI покупки. */
export function emitIap(type: IapFunnelEvent): void {
  // Во время съёмки скриншотов сторов промо-UI скрыт — не засоряем воронку.
  if (isScreenshotMode()) return;
  try {
    void fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: { id: uuid(), type, app: APP_ID, ts: Date.now() } }),
      keepalive: true,
    }).catch(() => { /* никогда не мешать UI покупки */ });
  } catch {
    /* ignore */
  }
}
