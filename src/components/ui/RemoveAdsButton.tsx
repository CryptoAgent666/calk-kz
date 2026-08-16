import { useEffect, useState } from 'react';
import { Sparkles, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  isAdFree,
  onAdFreeChange,
  buyRemoveAds,
  restorePurchases,
  purchasesAvailable,
} from '../../purchases';
import { useRemoveAdsPrice } from '../../hooks/useRemoveAdsPrice';
import {
  rewardedAvailable,
  watchAdForTempAdFree,
  tempAdFreeActive,
  tempAdFreeUntil,
  TEMP_AD_FREE_HOURS,
} from '../../ads';

/**
 * Кнопка «Убрать рекламу навсегда» + «Восстановить покупку» (место 1 из 3).
 * Подключена в Layout → мобильное slide-out меню (native-only секция).
 * Рендерится ТОЛЬКО в нативном приложении (на сайте — null). Скрывается, когда
 * реклама уже отключена. Восстановление обязательно для Apple (Guideline 3.1.1).
 */
export function RemoveAdsButton() {
  const { t } = useTranslation('common');
  const [adFree, setAdFree] = useState(isAdFree());
  const [busy, setBusy] = useState<'buy' | 'restore' | 'watch' | null>(null);
  const [watchFailed, setWatchFailed] = useState(false);
  // Тик после просмотра ролика: tempAdFreeActive() читается вне React-состояния.
  const [, setTick] = useState(0);
  const priceState = useRemoveAdsPrice();

  useEffect(() => onAdFreeChange(setAdFree), []);

  // Только в приложении С нативным модулем покупок (не в старых бинарях после OTA).
  if (!purchasesAvailable()) return null;
  if (adFree) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
        {t('removeAds.disabled')}
      </div>
    );
  }

  const buy = async () => {
    setBusy('buy');
    try { await buyRemoveAds(); } finally { setBusy(null); }
  };
  const restore = async () => {
    setBusy('restore');
    try { await restorePurchases(); } finally { setBusy(null); }
  };
  const watch = async () => {
    setBusy('watch');
    setWatchFailed(false);
    try {
      const result = await watchAdForTempAdFree();
      // Отмену (закрыл ролик раньше) молчим — это осознанный выбор пользователя.
      if (result === 'failed' || result === 'unavailable') setWatchFailed(true);
    } finally {
      setBusy(null);
      setTick((n) => n + 1);
    }
  };

  const tempActive = tempAdFreeActive();
  const tempHoursLeft = tempActive
    ? Math.max(1, Math.ceil((tempAdFreeUntil() - Date.now()) / 3600_000))
    : 0;

  // Стор не отдал продукт — оффер не рисуем вообще (иначе тап ведёт в тупик).
  // Кнопка восстановления остаётся: она обязательна для Apple и от цены не зависит.
  const offerAvailable = priceState.status !== 'unavailable';

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
      {offerAvailable && (
        <>
          <p className="mb-3 text-center text-sm font-semibold leading-snug text-blue-900">
            {t('removeAds.pitch')}
          </p>
          <button
            onClick={buy}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {busy === 'buy'
              ? t('removeAds.processing')
              : `${t('removeAds.removeForever')} — ${priceState.price}`}
          </button>
          <p className="mt-2 text-center text-xs text-gray-500">{t('removeAds.oneTime')}</p>
        </>
      )}

      {/* Бесплатная альтернатива покупке: ролик даёт TEMP_AD_FREE_HOURS часов
          без рекламы. Показываем только когда блок Rewarded заведён в AdMob. */}
      {rewardedAvailable() && (
        <div className={offerAvailable ? 'mt-3 border-t border-blue-200 pt-3' : ''}>
          {tempActive ? (
            <p className="text-center text-xs font-medium text-green-700">
              {t('removeAds.tempActive', { hours: tempHoursLeft })}
            </p>
          ) : (
            <>
              <button
                onClick={watch}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
              >
                <PlayCircle className="h-4 w-4" />
                {busy === 'watch'
                  ? t('removeAds.watching')
                  : t('removeAds.watchAd', { hours: TEMP_AD_FREE_HOURS })}
              </button>
              {watchFailed && (
                <p className="mt-1 text-center text-xs text-gray-500">{t('removeAds.watchFailed')}</p>
              )}
            </>
          )}
        </div>
      )}
      <button
        onClick={restore}
        disabled={busy !== null}
        className="mt-2 w-full text-center text-xs text-blue-700 underline disabled:opacity-60"
      >
        {busy === 'restore' ? t('removeAds.restoring') : t('removeAds.restore')}
      </button>
    </div>
  );
}
