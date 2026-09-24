import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Check, Sparkles, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { emitIap } from '../../telemetry';
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
import { OPEN_REMOVE_ADS_OFFER_EVENT, type OpenRemoveAdsOfferDetail } from '../../utils/removeAdsOffer';

type Notice = 'success' | 'unavailable' | 'failed' | 'restoreNone' | 'watchFailed' | null;

/**
 * Экран предложения между плашкой/тостом и системным окном оплаты.
 *
 * До 24.09.2026 тап по плашке сразу открывал окно App Store / Google Play:
 * 22 нажатия за 14–23.09 → 20 отмен через 3–18 с и ни одной покупки. Человек
 * не видел, что именно получает, а вариант «цена пары кофе» не показывал даже
 * цену (жали, чтобы её узнать). Здесь — что убирается, «навсегда, на всех
 * устройствах», цена до окна оплаты, бесплатная альтернатива (ролик) и
 * восстановление покупки.
 *
 * Рендерится один раз в Layout; только в приложении с модулем покупок.
 */
export function RemoveAdsOffer() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<string | undefined>();
  const [busy, setBusy] = useState<'buy' | 'watch' | 'restore' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const priceState = useRemoveAdsPrice();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const close = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(false);
    setNotice(null);
  }, []);

  const closeSoon = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(close, 1500);
  }, [close]);

  useEffect(() => {
    if (!purchasesAvailable()) return;
    const onOpen = (e: Event) => {
      if (isAdFree()) return;
      const detail = (e as CustomEvent<OpenRemoveAdsOfferDetail>).detail;
      setVariant(detail?.variant);
      setNotice(null);
      setOpen(true);
      emitIap('offer_shown', {
        platform: Capacitor.getPlatform(),
        placement: detail?.source,
        variant: detail?.variant,
      });
    };
    window.addEventListener(OPEN_REMOVE_ADS_OFFER_EVENT, onOpen);
    return () => {
      window.removeEventListener(OPEN_REMOVE_ADS_OFFER_EVENT, onOpen);
      clearTimeout(closeTimer.current);
    };
  }, []);

  // Покупка/восстановление могли пройти и мимо этого окна (синк с другого устройства).
  useEffect(() => onAdFreeChange((adFree) => {
    if (adFree) { setNotice('success'); closeSoon(); }
  }), [closeSoon]);

  if (!purchasesAvailable()) return null;

  const offerAvailable = priceState.status !== 'unavailable';
  const storeName = Capacitor.getPlatform() === 'ios' ? 'App Store' : 'Google Play';

  const buy = async () => {
    setBusy('buy');
    setNotice(null);
    try {
      const result = await buyRemoveAds('offer', variant);
      if (result === 'ok') { setNotice('success'); closeSoon(); }
      else if (result === 'unavailable') setNotice('unavailable');
      else if (result === 'failed') setNotice('failed');
      // cancelled: окно оставляем — человек мог передумать в окне оплаты
    } finally {
      setBusy(null);
    }
  };

  const watch = async () => {
    setBusy('watch');
    setNotice(null);
    try {
      const result = await watchAdForTempAdFree();
      if (result === 'ok') close();
      else if (result === 'failed' || result === 'unavailable') setNotice('watchFailed');
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    setBusy('restore');
    setNotice(null);
    try {
      const ok = await restorePurchases();
      if (ok) { setNotice('success'); closeSoon(); }
      else setNotice('restoreNone');
    } finally {
      setBusy(null);
    }
  };

  const points = [t('removeAds.offer.point1'), t('removeAds.offer.point2'), t('removeAds.offer.point3'), t('removeAds.offer.point4')];
  const tempActive = tempAdFreeActive();
  const tempHoursLeft = tempActive
    ? Math.max(1, Math.ceil((tempAdFreeUntil() - Date.now()) / 3600_000))
    : 0;

  return (
    <Modal open={open} onClose={close} labelledBy="remove-ads-offer-title">
      <div className="relative rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pb-5 pt-6 text-white">
        <button
          onClick={close}
          aria-label={t('removeAds.close')}
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <Sparkles className="mb-2 h-7 w-7 text-amber-300" />
        <h2 id="remove-ads-offer-title" className="text-xl font-bold leading-tight">
          {t('removeAds.offer.title')}
        </h2>
        <p className="mt-1 text-sm text-blue-100">{t('removeAds.offer.subtitle')}</p>
      </div>

      <div className="px-5 pb-5 pt-4">
        <ul className="space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm leading-snug text-gray-700">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {notice === 'success' ? (
          <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
            {t('removeAds.offer.thanks')}
          </p>
        ) : (
          <>
            {offerAvailable && (
              <>
                <button
                  onClick={buy}
                  disabled={busy !== null}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy === 'buy'
                    ? t('removeAds.processing')
                    : t('removeAds.offer.buy', { price: priceState.price })}
                </button>
                <p className="mt-2 text-center text-xs text-gray-500">
                  {t('removeAds.offer.payment', { store: storeName })}
                </p>
              </>
            )}

            {notice && (
              <p role="status" className="mt-3 text-center text-sm text-gray-600">
                {notice === 'unavailable' && t('removeAds.offer.unavailable')}
                {notice === 'failed' && t('removeAds.offer.failed')}
                {notice === 'restoreNone' && t('removeAds.offer.restoreNone')}
                {notice === 'watchFailed' && t('removeAds.watchFailed')}
              </p>
            )}

            {rewardedAvailable() && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                {tempActive ? (
                  <p className="text-center text-xs font-medium text-green-700">
                    {t('removeAds.tempActive', { hours: tempHoursLeft })}
                  </p>
                ) : (
                  <button
                    onClick={watch}
                    disabled={busy !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 disabled:opacity-60"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {busy === 'watch' ? t('removeAds.watching') : t('removeAds.watchAd', { hours: TEMP_AD_FREE_HOURS })}
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs">
              <button
                onClick={restore}
                disabled={busy !== null}
                className="text-blue-700 underline disabled:opacity-60"
              >
                {busy === 'restore' ? t('removeAds.restoring') : t('removeAds.restore')}
              </button>
              <button onClick={close} className="text-gray-500 hover:text-gray-700">
                {t('removeAds.offer.notNow')}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
