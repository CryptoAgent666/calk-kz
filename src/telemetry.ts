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
  | 'offer_shown'
  | 'purchase_tapped'
  | 'purchase_cancelled'
  | 'purchase_failed'
  | 'purchase_unavailable';

/** Где пользователь увидел оффер или нажал «купить»:
 *  bar — синяя плашка над баннером, toast — предложение после интерстишела,
 *  menu — блок в боковом меню, offer — экран предложения (открывается из bar/toast). */
export type IapPlacement = 'bar' | 'toast' | 'menu' | 'offer';

/** Доп. поля события. Сервер принимает только allowlist (platform, store,
 *  product_id, code, placement, variant, bundle, install, target, ms), каждое режется до 64 символов —
 *  длинное сообщение об ошибке ужимаем до кода сами. */
export interface IapEventDetail {
  platform?: string;
  /** Код ошибки покупки; у paywall_shown с плашки — снимок устройства и посадки
   *  плашки (формат в utils/barGeometry.ts). */
  code?: string;
  placement?: IapPlacement;
  /** Вариант текста плашки (price / coffee) — чтобы сравнивать, что продаёт. */
  variant?: string;
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* ignore */ }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const INSTALL_KEY = 'calk_install_id';
let installCache: string | null = null;

/** Случайный id установки, без персональных данных: по нему видно путь одного устройства
 *  между бандлами. До 17.11.2026 его не было, и половина событий 1.7 на вшитом бандле
 *  не делилась на «свежие установки» и «устройства, у которых загрузка не доходит». */
function installId(): string {
  if (installCache) return installCache;
  try {
    installCache = localStorage.getItem(INSTALL_KEY);
    if (!installCache) {
      installCache = uuid();
      localStorage.setItem(INSTALL_KEY, installCache);
    }
  } catch {
    installCache = installCache || uuid();
  }
  return installCache;
}

function send(type: string, fields: Record<string, string | undefined>): void {
  try {
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v) extra[k] = String(v).slice(0, 64);
    }
    void fetch(TELEMETRY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: {
        id: uuid(), type, app: APP_ID, ts: Date.now(), bundle: __BUILD_VERSION__, install: installId(), ...extra,
      } }),
      keepalive: true,
    }).catch(() => { /* никогда не мешать UI */ });
  } catch {
    /* ignore */
  }
}

/** Отправить один шаг воронки. Никогда не бросает и не блокирует UI покупки.
 *  16.08.2026: 5/5 тапов ушли в purchase_failed в ту же секунду, а по голому
 *  типу события причину было не установить (гадали между старым OTA, девайсом
 *  без Play-сервисов и несконфигуренным SDK). Теперь шлём platform и code, а с
 *  24.09.2026 ещё место показа, вариант текста и версию бандла (по ней видно,
 *  дошёл ли OTA до устройств). */
export function emitIap(type: IapFunnelEvent, detail?: IapEventDetail): void {
  // Во время съёмки скриншотов сторов промо-UI скрыт — не засоряем воронку.
  if (isScreenshotMode()) return;
  send(type, {
    platform: detail?.platform,
    code: detail?.code,
    placement: detail?.placement,
    variant: detail?.variant,
  });
}

/** Шаги OTA-обновления (src/liveUpdates.ts). */
export type OtaEvent =
  | 'ota_download_started'
  | 'ota_downloaded'
  | 'ota_download_failed'
  /** На старте найдены оборванные загрузки прошлых запусков; code — сколько. */
  | 'ota_download_abandoned'
  /** Бандл сменился с прошлого запуска; code — прежний бандл. */
  | 'ota_applied';

export interface OtaEventDetail {
  platform: string;
  /** Бандл, который качаем или применили. */
  target?: string;
  ms?: number;
  code?: string;
}

export function emitOta(type: OtaEvent, detail: OtaEventDetail): void {
  if (isScreenshotMode()) return;
  send(type, {
    platform: detail.platform,
    target: detail.target,
    ms: detail.ms === undefined ? undefined : String(Math.round(detail.ms)),
    code: detail.code,
  });
}
