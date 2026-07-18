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

/** Запасная цена для UI, пока RevenueCat не вернул локализованную (getRemoveAdsPrice). */
export const REMOVE_ADS_FALLBACK_PRICE = '2 490 ₸';

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

/** Локализованная цена продукта (напр. «990 ₸») для кнопки, или null. */
export async function getRemoveAdsPrice(): Promise<string | null> {
  if (!purchasesAvailable()) return null;
  try {
    const { Purchases } = await loadSdk();
    const { products } = await Purchases.getProducts({ productIdentifiers: [REMOVE_ADS_PRODUCT_ID] });
    return products[0]?.priceString ?? null;
  } catch {
    return null;
  }
}

/** Купить «Убрать рекламу». true — успех (или уже куплено). */
export async function buyRemoveAds(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  emitIap('purchase_tapped');
  try {
    const { Purchases } = await loadSdk();
    const { products } = await Purchases.getProducts({ productIdentifiers: [REMOVE_ADS_PRODUCT_ID] });
    if (!products.length) return false;
    const { customerInfo } = await Purchases.purchaseStoreProduct({ product: products[0] });
    const ok = hasEntitlement(customerInfo);
    setAdFree(ok);
    return ok;
  } catch (e) {
    // Отмена пользователем — не ошибка; для воронки различаем отмену и сбой.
    emitIap((e as { userCancelled?: boolean })?.userCancelled ? 'purchase_cancelled' : 'purchase_failed');
    return false;
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
