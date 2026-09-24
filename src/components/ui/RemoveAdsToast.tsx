import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isScreenshotMode } from '../../utils/screenshotMode';
import { emitIap } from '../../telemetry';
import {
  isAdFree,
  onAdFreeChange,
  purchasesAvailable,
} from '../../purchases';
import { useRemoveAdsPrice } from '../../hooks/useRemoveAdsPrice';
import { openRemoveAdsOffer } from '../../utils/removeAdsOffer';

/** Событие «предложить убрать рекламу» — шлётся из ads.ts, когда закрыли первый за сессию интерстишал. */
export const SUGGEST_REMOVE_ADS_EVENT = 'calk:suggest-remove-ads';

const AUTO_HIDE_MS = 8000;
// Не чаще раза в сутки: регулярного пользователя — главного покупателя — не донимаем.
const COOLDOWN_MS = 24 * 3600 * 1000;
const LAST_SHOWN_KEY = 'calk_removeads_toast_ts';

function cooledDown(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(LAST_SHOWN_KEY) || '0') >= COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markShown(): void {
  try { localStorage.setItem(LAST_SHOWN_KEY, String(Date.now())); } catch { /* ignore */ }
}

/**
 * Маленький тост «Надоела реклама? Убрать за …» СВЕРХУ экрана (место 3 из 3).
 * Появляется, когда пользователь закрыл полноэкранную рекламу, — в момент,
 * когда она только что помешала, — не чаще раза в сутки. Тап открывает экран
 * предложения. Автоскрытие через 8 с. Рендерится только в приложении и пока
 * есть реклама.
 */
export function RemoveAdsToast() {
  const { t } = useTranslation('common');
  const [adFree, setAdFree] = useState(isAdFree());
  const [visible, setVisible] = useState(false);
  const priceState = useRemoveAdsPrice();

  useEffect(() => onAdFreeChange(setAdFree), []);

  // Статус цены читаем через ref: слушатель события вешается один раз.
  const priceStatusRef = useRef(priceState.status);
  useEffect(() => { priceStatusRef.current = priceState.status; }, [priceState.status]);

  useEffect(() => {
    if (!purchasesAvailable()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSuggest = () => {
      if (isScreenshotMode() || isAdFree()) return;
      if (priceStatusRef.current === 'unavailable') return; // стор не отдал продукт
      if (!cooledDown()) return;
      markShown();
      setVisible(true);
      emitIap('paywall_shown', { platform: Capacitor.getPlatform(), placement: 'toast' });
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    };
    window.addEventListener(SUGGEST_REMOVE_ADS_EVENT, onSuggest);
    return () => {
      window.removeEventListener(SUGGEST_REMOVE_ADS_EVENT, onSuggest);
      clearTimeout(timer);
    };
  }, []);

  if (isScreenshotMode() || !purchasesAvailable() || adFree || !visible) return null;
  if (priceState.status === 'unavailable') return null;

  const openOffer = () => {
    setVisible(false);
    openRemoveAdsOffer('toast');
  };

  return (
    <div
      className="fixed left-1/2 z-[60] w-[92%] max-w-sm -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-2xl"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 flex-shrink-0 text-amber-400" />
        <div className="flex-1 text-sm">
          <div className="font-semibold">{t('removeAds.tired')}</div>
          <button onClick={openOffer} className="text-left text-blue-300 underline">
            {t('removeAds.removeForPrice', { price: priceState.price })}
          </button>
        </div>
        <button onClick={() => setVisible(false)} aria-label={t('removeAds.close')} className="p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
