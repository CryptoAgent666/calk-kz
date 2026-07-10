import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  isAdFree,
  onAdFreeChange,
  buyRemoveAds,
  getRemoveAdsPrice,
  REMOVE_ADS_FALLBACK_PRICE,
} from '../../purchases';

/** Событие «предложить убрать рекламу» — шлётся из ads.ts после каждого 3-го интерстишела. */
export const SUGGEST_REMOVE_ADS_EVENT = 'calk:suggest-remove-ads';

const AUTO_HIDE_MS = 6000;

/**
 * Маленький тост «Надоела реклама? Убрать за …» СВЕРХУ экрана (место 3 из 3).
 * Появляется после каждого 3-го полноэкранного интерстишела — в момент, когда
 * реклама только что помешала (лучшая конверсия), но не чаще и ненавязчиво.
 * Автоскрытие через 6 c. Рендерится только в приложении и пока есть реклама.
 */
export function RemoveAdsToast() {
  const { t } = useTranslation('common');
  const [adFree, setAdFree] = useState(isAdFree());
  const [visible, setVisible] = useState(false);
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAdFreeChange(setAdFree), []);
  useEffect(() => { void getRemoveAdsPrice().then(setPrice); }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSuggest = () => {
      if (isAdFree()) return;
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    };
    window.addEventListener(SUGGEST_REMOVE_ADS_EVENT, onSuggest);
    return () => {
      window.removeEventListener(SUGGEST_REMOVE_ADS_EVENT, onSuggest);
      clearTimeout(timer);
    };
  }, []);

  if (!Capacitor.isNativePlatform() || adFree || !visible) return null;

  const buy = async () => {
    setBusy(true);
    try {
      const ok = await buyRemoveAds();
      if (ok) setVisible(false);
    } finally {
      setBusy(false);
    }
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
          <button onClick={buy} disabled={busy} className="text-blue-300 underline disabled:opacity-70">
            {busy ? t('removeAds.processing') : t('removeAds.removeForPrice', { price: price ?? REMOVE_ADS_FALLBACK_PRICE })}
          </button>
        </div>
        <button onClick={() => setVisible(false)} aria-label={t('removeAds.close')} className="p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
