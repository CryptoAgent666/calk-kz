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
  | 'purchase_failed'
  | 'purchase_unavailable';

/** Доп. поля события. Сервер принимает только allowlist (platform, store,
 *  product_id, code), каждое режется до 64 символов — длинное сообщение об
 *  ошибке ужимаем до кода сами. */
export interface IapEventDetail {
  platform?: string;
  code?: string;
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* ignore */ }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Отправить один шаг воронки. Никогда не бросает и не блокирует UI покупки.
 *  16.08.2026: 5/5 тапов ушли в purchase_failed в ту же секунду, а по голому
 *  типу события причину было не установить (гадали между старым OTA, девайсом
 *  без Play-сервисов и несконфигуренным SDK). Теперь шлём platform и code. */
export function emitIap(type: IapFunnelEvent, detail?: IapEventDetail): void {
  // Во время съёмки скриншотов сторов промо-UI скрыт — не засоряем воронку.
  if (isScreenshotMode()) return;
  try {
    void fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: {
        id: uuid(), type, app: APP_ID, ts: Date.now(),
        ...(detail?.platform ? { platform: detail.platform } : {}),
        ...(detail?.code ? { code: String(detail.code).slice(0, 64) } : {}),
      } }),
      keepalive: true,
    }).catch(() => { /* никогда не мешать UI покупки */ });
  } catch {
    /* ignore */
  }
}
