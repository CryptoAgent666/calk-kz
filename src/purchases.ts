import { Capacitor } from '@capacitor/core';
import { emitIap } from './telemetry';

/**
 * RevenueCat: разовая покупка «Убрать рекламу» (non-consumable / durable one-time).
 *
 * Модель: в дашборде RevenueCat entitlement `ad_free` привязан к продукту
 * `removeads` (App Store non-consumable + Google Play one-time durable).
 * Покупка одна, навсегда, привязана к Apple ID / Google-аккаунту → переживает
 * переустановку и работает на всех устройствах пользователя (через restore).
 *
 * - На вебе (сайт calk.kz) — полный no-op: нативный плагин не грузится.
 * - Статус ad-free кэшируется в localStorage, чтобы isAdFree() отвечал
 *   СИНХРОННО и мгновенно (важно для гейта рекламы до ответа сети / офлайн).
 *
 * ⚠️ Это нативный плагин — доедет до пользователей только новой сборкой в
 *    стор (НЕ через OTA). IAP ревьюится вместе со сборкой.
 */

const ENTITLEMENT_ID = 'ad_free';
const REMOVE_ADS_PRODUCT_ID = 'removeads';
const CACHE_KEY = 'calk_ad_free';

/**
 * Покупки доступны только когда в БИНАРЕ зарегистрирован нативный модуль
 * RevenueCat. Критично для OTA: JS-бандл прилетает и в старые сборки
 * (v1.2 без RevenueCat) — без этого гейта там показывались бы мёртвые
 * кнопки «Убрать рекламу» (native bridge отсутствует, покупка невозможна).
 */
export function purchasesAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Purchases');
}

/** Запасная цена для UI, пока RevenueCat не вернул локализованную (getRemoveAdsPrice).
 *  Держать в синхроне с ценой продукта в App Store Connect / Google Play (сейчас 999 ₸).
 *  Живая цена приходит из стора автоматически — это только на миг загрузки/оффлайн. */
export const REMOVE_ADS_FALLBACK_PRICE = '999 ₸';

// Публичные SDK-ключи RevenueCat (Project Settings → API keys, по одному на
// платформу). Их МОЖНО держать в клиенте — это НЕ секретные `sk_`-ключи.
// Задать через .env (VITE_RC_*) или вписать напрямую вместо плейсхолдеров.
const RC_API_KEYS = {
  ios: import.meta.env.VITE_RC_IOS_KEY ?? 'appl_XXXXXXXXXXXXXXXXXXXXXXXX',
  android: import.meta.env.VITE_RC_ANDROID_KEY ?? 'goog_XXXXXXXXXXXXXXXXXXXXXXXX',
};

function readCache(): boolean {
  try { return localStorage.getItem(CACHE_KEY) === '1'; } catch { return false; }
}
function writeCache(v: boolean): void {
  try { localStorage.setItem(CACHE_KEY, v ? '1' : '0'); } catch { /* ignore */ }
}

let adFree = readCache();
const listeners = new Set<(v: boolean) => void>();

/** Синхронно: реклама отключена? Читает кэш — мгновенно и офлайн. */
export function isAdFree(): boolean {
  return adFree;
}

/** Подписка на изменение статуса (UI, скрытие баннера после покупки). Возвращает unsubscribe. */
export function onAdFreeChange(cb: (v: boolean) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function setAdFree(v: boolean): void {
  if (v === adFree) return;
  adFree = v;
  writeCache(v);
  listeners.forEach((cb) => { try { cb(v); } catch { /* ignore */ } });
}

async function loadSdk() {
  return import('@revenuecat/purchases-capacitor');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasEntitlement(customerInfo: any): boolean {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

/** Инициализация RevenueCat при старте приложения. No-op на вебе и в бинарях без модуля. */
export async function initPurchases(): Promise<void> {
  if (!purchasesAvailable()) return;

  let Purchases: typeof import('@revenuecat/purchases-capacitor').Purchases;
  try {
    ({ Purchases } = await loadSdk());
  } catch {
    return;
  }

  try {
    const platform = Capacitor.getPlatform();
    const apiKey = platform === 'ios' ? RC_API_KEYS.ios : RC_API_KEYS.android;
    await Purchases.configure({ apiKey });

    // Любые изменения entitlement (покупка, restore, синк с другого устройства).
    await Purchases.addCustomerInfoUpdateListener((info) => {
      setAdFree(hasEntitlement(info));
    });

    // Актуализировать статус из стора (тихо подтягивает и уже совершённые покупки).
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      setAdFree(hasEntitlement(customerInfo));
    } catch {
      /* офлайн — остаёмся на закэшированном значении */
    }
  } catch {
    /* конфиг не удался → безопасный дефолт: реклама показывается */
  }
}

type PurchasesSdk = Awaited<ReturnType<typeof loadSdk>>['Purchases'];
type ProductCategory = NonNullable<Parameters<PurchasesSdk['getProducts']>[0]['type']>;

/**
 * КРИТИЧНО: `type` обязателен.
 *
 * Нативный Android-плагин при отсутствии параметра подставляет подписку
 * (PurchasesPlugin.kt: `val type = call.getString("type") ?: "SUBSCRIPTION"`),
 * то есть спрашивает у Google Play подписку `removeads`, которой не существует —
 * «Убрать рекламу» это разовая покупка. Play возвращает пустой список → цена
 * null → покупка невозможна. На iOS параметр игнорируется, поэтому там всё
 * работало с первого дня и баг был не виден.
 *
 * Enum PRODUCT_CATEGORY лежит в транзитивной зависимости SDK, поэтому берём
 * литерал, а тип выводим из сигнатуры самого getProducts.
 */
const NON_SUBSCRIPTION = 'NON_SUBSCRIPTION' as ProductCategory;

/** Единая точка запроса продукта — и для цены, и для покупки (тип не разъедется). */
async function fetchRemoveAdsProduct(Purchases: PurchasesSdk) {
  const { products } = await Purchases.getProducts({
    productIdentifiers: [REMOVE_ADS_PRODUCT_ID],
    type: NON_SUBSCRIPTION,
  });
  return products[0] ?? null;
}

/** Локализованная цена продукта (напр. «999 ₸»), или null если стор её не отдал. */
export async function getRemoveAdsPrice(): Promise<string | null> {
  if (!purchasesAvailable()) return null;
  try {
    const { Purchases } = await loadSdk();
    const product = await fetchRemoveAdsProduct(Purchases);
    return product?.priceString ?? null;
  } catch {
    return null;
  }
}

/**
 * Результат покупки. Голый boolean не годился: «пользователь передумал» и
 * «стор не отдал продукт» требуют разного разговора с пользователем.
 */
export type BuyResult = 'ok' | 'cancelled' | 'unavailable' | 'failed';

/** Купить «Убрать рекламу». */
export async function buyRemoveAds(): Promise<BuyResult> {
  if (!purchasesAvailable()) return 'unavailable';
  emitIap('purchase_tapped');
  try {
    const { Purchases } = await loadSdk();
    const product = await fetchRemoveAdsProduct(Purchases);
    if (!product) return 'unavailable';
    const { customerInfo } = await Purchases.purchaseStoreProduct({ product });
    const ok = hasEntitlement(customerInfo);
    setAdFree(ok);
    return ok ? 'ok' : 'failed';
  } catch (e) {
    // Отмена пользователем — не ошибка; для воронки различаем отмену и сбой.
    const cancelled = !!(e as { userCancelled?: boolean })?.userCancelled;
    emitIap(cancelled ? 'purchase_cancelled' : 'purchase_failed');
    return cancelled ? 'cancelled' : 'failed';
  }
}

/** Восстановить покупку — ОБЯЗАТЕЛЬНАЯ кнопка для Apple (Guideline 3.1.1). */
export async function restorePurchases(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  try {
    const { Purchases } = await loadSdk();
    const { customerInfo } = await Purchases.restorePurchases();
    const ok = hasEntitlement(customerInfo);
    setAdFree(ok);
    return ok;
  } catch {
    return false;
  }
}
