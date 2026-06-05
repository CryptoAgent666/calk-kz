import { Capacitor } from '@capacitor/core';

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
  },
  android: {
    // ✅ Боевые (Calk.kz Android). appId → AndroidManifest APPLICATION_ID.
    appId: 'ca-app-pub-4859241862365215~1247260374',
    banner: 'ca-app-pub-4859241862365215/3241878642',
    interstitial: 'ca-app-pub-4859241862365215/2108760371',
  },
};

// false = боевые объявления (продакшн-сборка для сторов).
// ⚠️ С боевыми ID НЕ тапай свою рекламу на своём устройстве — бан аккаунта AdMob.
//    Для собственного QA собери debug и зарегистрируй устройство как test device.
const IS_TESTING = false;

// Интерстишал не чаще одного раза в этот интервал (UX + требования сторов).
const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;
// Не показывать интерстишал до N-й навигации (не доставать сразу после запуска).
const INTERSTITIAL_MIN_NAVIGATIONS = 3;

let interstitialReady = false;
let navCount = 0;

function platformIds() {
  const p = Capacitor.getPlatform();
  return p === 'ios' ? AD_IDS.ios : AD_IDS.android;
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

/** Инициализация рекламы при старте приложения. No-op на вебе. */
export async function initAds(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  let mod: typeof import('@capacitor-community/admob');
  try {
    mod = await import('@capacitor-community/admob');
  } catch {
    return;
  }
  const { AdMob, BannerAdPosition, BannerAdSize } = mod;

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
  navCount += 1;
  if (navCount < INTERSTITIAL_MIN_NAVIGATIONS || !interstitialReady) return;

  const last = Number(localStorage.getItem('ads_last_interstitial') || '0');
  if (Date.now() - last < INTERSTITIAL_MIN_INTERVAL_MS) return;

  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.showInterstitial();
    localStorage.setItem('ads_last_interstitial', String(Date.now()));
    interstitialReady = false;
    void prepareInterstitial(); // подготовить следующий
  } catch {
    /* ignore */
  }
}
