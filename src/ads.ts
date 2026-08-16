import { Capacitor } from '@capacitor/core';
import { isAdFree, onAdFreeChange } from './purchases';

/**
 * Нативная реклама AdMob для приложения (баннер снизу + интерстишал).
 *
 * - Работает ТОЛЬКО в нативном приложении (на сайте calk.kz реклама — AdSense,
 *   она грузится отдельно и здесь не трогается; на вебе этот модуль = no-op,
 *   нативный плагин даже не загружается).
 * - По политике Google в приложениях используется AdMob, не AdSense.
 *
 * Статус ID: Android + iOS — БОЕВЫЕ (Calk.kz, pub-4859241862365215).
 *  App ID: Android → AndroidManifest APPLICATION_ID, iOS → Info.plist GADApplicationIdentifier.
 *
 * ⚠️ IS_TESTING оставлен true: при реальных ID НЕЛЬЗЯ тапать собственную рекламу
 *    на своём устройстве (бан аккаунта AdMob). Перед финальной заливкой в стор
 *    поставь IS_TESTING = false (или зарегистрируй своё устройство как test device).
 */

const AD_IDS = {
  ios: {
    // ✅ Боевые (Calk.kz iOS). appId → Info.plist GADApplicationIdentifier.
    appId: 'ca-app-pub-4859241862365215~9297974937',
    banner: 'ca-app-pub-4859241862365215/3230270353',
    interstitial: 'ca-app-pub-4859241862365215/1375252885',
    // ✅ Боевой Rewarded (Calk.kz iOS).
    rewarded: 'ca-app-pub-4859241862365215/4563633320',
  },
  android: {
    // ✅ Боевые (Calk.kz Android). appId → AndroidManifest APPLICATION_ID.
    appId: 'ca-app-pub-4859241862365215~1247260374',
    banner: 'ca-app-pub-4859241862365215/3241878642',
    interstitial: 'ca-app-pub-4859241862365215/2108760371',
    // ✅ Боевой Rewarded (Calk.kz Android).
    rewarded: 'ca-app-pub-4859241862365215/9166007134',
  },
};

// false = боевые объявления (продакшн-сборка для сторов).
// ⚠️ С боевыми ID НЕ тапай свою рекламу на своём устройстве — бан аккаунта AdMob.
//    Для собственного QA собери debug и зарегистрируй устройство как test device.
const IS_TESTING = false;

// ── Временное отключение рекламы за просмотр rewarded-ролика ─────────────────
// Награда: N часов без баннера и интерстишелов НА ЭТОМ УСТРОЙСТВЕ — локальный
// localStorage-таймер, между устройствами НЕ синхронизируется (в отличие от
// купленного ad_free) и не должен. Намеренно не конкурирует с покупкой: даёт
// распробовать жизнь без рекламы и подводит к «навсегда за 999 ₸».
//
// 6 часов: покрывает «полдня» задач (справедливо за 30-секундный ролик), но к
// следующему дню реклама возвращается — показы копятся, а покупка «навсегда»
// не обесценивается. 12–24 ч = один ролик закрывает все сессии эпизодического
// пользователя и режет и рекламу, и покупки. Длительность — единственный
// источник правды, UI подставляет {{hours}} отсюда.
export const TEMP_AD_FREE_HOURS = 6;
const TEMP_AD_FREE_KEY = 'calk_ads_free_until';

// Интерстишал не чаще одного раза в этот интервал (UX + требования сторов).
const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;
// Не показывать интерстишал до N-й навигации (не доставать сразу после запуска).
const INTERSTITIAL_MIN_NAVIGATIONS = 3;

let interstitialReady = false;
let tempUntilMem = 0;
let adsReturnTimer: ReturnType<typeof setTimeout> | undefined;
let navCount = 0;
let interstitialShownCount = 0;

function platformIds() {
  const p = Capacitor.getPlatform();
  return p === 'ios' ? AD_IDS.ios : AD_IDS.android;
}

/** Таймстамп окончания временного (за ролик) периода без рекламы, 0 если нет. */
export function tempAdFreeUntil(): number {
  let stored = 0;
  try { stored = Number(localStorage.getItem(TEMP_AD_FREE_KEY) || '0'); } catch { /* mem-фолбэк */ }
  return Math.max(stored, tempUntilMem);
}

/** Активен ли временный период без рекламы (за просмотр ролика). */
export function tempAdFreeActive(): boolean {
  return Date.now() < tempAdFreeUntil();
}

/** Rewarded доступен в этой сборке? (native + ID юнита создан). Гейт кнопки в UI. */
export function rewardedAvailable(): boolean {
  return Capacitor.isNativePlatform() && !!platformIds().rewarded;
}

/** Когда период истечёт — вернуть рекламу (баннер + интерстишалы) без перезапуска. */
function scheduleAdsReturn(): void {
  const left = tempAdFreeUntil() - Date.now();
  if (left <= 0) return;
  clearTimeout(adsReturnTimer);
  adsReturnTimer = setTimeout(() => {
    if (!isAdFree() && !tempAdFreeActive()) void initAds();
  }, left + 1000);
}

export type WatchAdResult = 'ok' | 'cancelled' | 'unavailable' | 'failed';

/**
 * Показать rewarded-ролик и, если досмотрен, выдать TEMP_AD_FREE_HOURS часов
 * без рекламы. Награда — ТОЛЬКО по событию Rewarded (пользователь досмотрел);
 * закрытие раньше времени = 'cancelled' и ничего не выдаём (правила AdMob).
 */
export async function watchAdForTempAdFree(): Promise<WatchAdResult> {
  if (!rewardedAvailable()) return 'unavailable';
  if (isAdFree() || tempAdFreeActive()) return 'ok'; // выдавать нечего — уже без рекламы
  try {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
    await AdMob.prepareRewardVideoAd({ adId: platformIds().rewarded, isTesting: IS_TESTING });

    let rewarded = false;
    const handles = [
      await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { rewarded = true; }),
    ];
    // Ждём закрытия ролика (или провала показа). Страховочный таймаут — чтобы
    // кнопка не зависла в busy, если платформа не пришлёт Dismissed.
    const closed = new Promise<void>((resolve) => {
      const finish = () => resolve();
      void AdMob.addListener(RewardAdPluginEvents.Dismissed, finish).then((h) => handles.push(h));
      void AdMob.addListener(RewardAdPluginEvents.FailedToShow, finish).then((h) => handles.push(h));
      setTimeout(finish, 5 * 60 * 1000);
    });

    await AdMob.showRewardVideoAd();
    await closed;
    handles.forEach((h) => { void h.remove(); });

    if (!rewarded) return 'cancelled';

    tempUntilMem = Date.now() + TEMP_AD_FREE_HOURS * 3600_000;
    try {
      localStorage.setItem(TEMP_AD_FREE_KEY, String(tempUntilMem));
    } catch { /* приватный режим — mem-зеркало доживёт до конца сессии */ }
    void hideAds();
    scheduleAdsReturn();
    return 'ok';
  } catch (e) {
    console.error('[admob] rewarded не показался:', e);
    return 'failed';
  }
}

async function prepareInterstitial(): Promise<void> {
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareInterstitial({ adId: platformIds().interstitial, isTesting: IS_TESTING });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
}

/**
 * Реальная высота нативного AdMob-баннера → CSS-переменная. RemoveAdsBar
 * позиционируется по ней, а не по хардкоду (адаптивный баннер 50–90px
 * в зависимости от устройства).
 */
function setBannerHeightVar(px: number): void {
  try {
    document.documentElement.style.setProperty('--admob-banner-height', `${Math.max(0, Math.round(px))}px`);
  } catch {
    /* ignore */
  }
}

/** Скрыть и убрать баннер (напр. сразу после покупки «Убрать рекламу»). */
export async function hideAds(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.hideBanner();
    await AdMob.removeBanner();
  } catch {
    /* ignore */
  } finally {
    setBannerHeightVar(0);
  }
}

/** Инициализация рекламы при старте приложения. No-op на вебе. */
export async function initAds(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  // Пользователь купил «Убрать рекламу» → не грузим и не показываем ничего.
  if (isAdFree()) return;
  // Активен временный период за просмотр ролика — рекламу не поднимаем,
  // но ставим таймер, чтобы она вернулась ровно по истечении срока.
  if (tempAdFreeActive()) { scheduleAdsReturn(); return; }

  let mod: typeof import('@capacitor-community/admob');
  try {
    mod = await import('@capacitor-community/admob');
  } catch {
    return;
  }
  const { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } = mod;

  try {
    await AdMob.initialize({ initializeForTesting: IS_TESTING });

    // iOS App Tracking Transparency — Apple требует запрос перед таргет-рекламой.
    if (Capacitor.getPlatform() === 'ios') {
      try {
        const { status } = await AdMob.trackingAuthorizationStatus();
        if (status === 'notDetermined') {
          await AdMob.requestTrackingAuthorization();
        }
      } catch {
        /* ignore */
      }
    }

    // GDPR/UMP-согласие (для EEA; в KZ обычно не показывается).
    try {
      await AdMob.requestConsentInfo();
    } catch {
      /* ignore */
    }

    // Фактическая высота баннера (приходит после загрузки и при поворотах).
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
      setBannerHeightVar(info.height);
    });

    // Баннер снизу (адаптивный).
    await AdMob.showBanner({
      adId: platformIds().banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: IS_TESTING,
    });

    // Подготовить первый интерстишал заранее.
    void prepareInterstitial();

    // Если пользователь купит «Убрать рекламу» во время сессии — убрать баннер сразу.
    onAdFreeChange((adFree) => { if (adFree) void hideAds(); });
  } catch {
    // Реклама не критична — приложение работает и без неё.
  }
}

/**
 * Показать интерстишал, если можно (частотный лимит + минимум навигаций).
 * Вызывается при смене маршрута; на вебе и без готового объявления — no-op.
 */
export async function maybeShowInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isAdFree()) return;
  if (tempAdFreeActive()) return; // награда за ролик снимает и интерстишалы
  navCount += 1;
  if (navCount < INTERSTITIAL_MIN_NAVIGATIONS || !interstitialReady) return;

  const last = Number(localStorage.getItem('ads_last_interstitial') || '0');
  if (Date.now() - last < INTERSTITIAL_MIN_INTERVAL_MS) return;

  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.showInterstitial();
    localStorage.setItem('ads_last_interstitial', String(Date.now()));
    interstitialReady = false;

    // После каждого 3-го полноэкранного интерстишела — ненавязчиво предложить
    // убрать рекламу (в момент, когда она только что помешала). RemoveAdsToast слушает.
    interstitialShownCount += 1;
    if (interstitialShownCount % 3 === 0) {
      window.dispatchEvent(new CustomEvent('calk:suggest-remove-ads'));
    }

    void prepareInterstitial(); // подготовить следующий
  } catch {
    /* ignore */
  }
}
