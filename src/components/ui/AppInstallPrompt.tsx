import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isScreenshotMode } from '../../utils/screenshotMode';

/**
 * Ненавязчивое предложение скачать приложение — ТОЛЬКО в мобильном браузере
 * (не в самом приложении, не на десктопе). Определяет платформу по UA и ведёт
 * в нужный стор. Пич: калькуляторы работают офлайн (проверено — весь расчётный
 * JS зашит в бандл), рекламу можно отключить покупкой.
 *
 * Ненавязчивость: показ через 5 c после загрузки, крестик глушит на 14 дней,
 * тап «Скачать» — тоже снооз (не долбить вернувшихся).
 */
const SNOOZE_KEY = 'calk_appinstall_snooze_ts';
const SNOOZE_MS = 14 * 24 * 3600 * 1000;
const SHOW_DELAY_MS = 5000;

const STORE_URL = {
  ios: 'https://apps.apple.com/kz/app/calk-kz/id6770814234',
  android: 'https://play.google.com/store/apps/details?id=calk.kz',
} as const;

type MobilePlatform = keyof typeof STORE_URL;

function getMobilePlatform(): MobilePlatform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return null;
}

export function AppInstallPrompt() {
  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  const [platform] = useState(getMobilePlatform);

  useEffect(() => {
    // Не в приложении, не в режиме скриншотов, только мобильный браузер.
    if (Capacitor.isNativePlatform() || isScreenshotMode() || !platform) return;
    let snoozedAt = 0;
    try { snoozedAt = Number(localStorage.getItem(SNOOZE_KEY) || '0'); } catch { /* ignore */ }
    if (snoozedAt && Date.now() - snoozedAt < SNOOZE_MS) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [platform]);

  if (!visible || !platform) return null;

  const snooze = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch { /* ignore */ }
    setVisible(false);
  };
  const install = () => {
    snooze();
    window.open(STORE_URL[platform], '_blank', 'noopener');
  };

  return (
    <div
      className="calk-slide-up fixed left-1/2 z-[55] w-[94%] max-w-md -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      role="region"
      aria-label={t('appInstall.title')}
    >
      <button
        onClick={snooze}
        aria-label={t('appInstall.close')}
        className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <img
          src="/icon-192.png"
          alt="Calk.kz"
          width={48}
          height={48}
          className="h-12 w-12 flex-shrink-0 rounded-xl shadow-sm"
          loading="lazy"
          decoding="async"
        />
        <div className="min-w-0 flex-1 pr-4">
          <div className="font-semibold text-gray-900">{t('appInstall.title')}</div>
          <p className="mt-0.5 text-sm leading-snug text-gray-600">{t('appInstall.pitch')}</p>
          <button
            onClick={install}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            {t('appInstall.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}
