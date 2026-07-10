import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  isAdFree,
  onAdFreeChange,
  buyRemoveAds,
  restorePurchases,
  getRemoveAdsPrice,
  purchasesAvailable,
  REMOVE_ADS_FALLBACK_PRICE,
} from '../../purchases';

/**
 * Кнопка «Убрать рекламу навсегда» + «Восстановить покупку» (место 1 из 3).
 * Подключена в Layout → мобильное slide-out меню (native-only секция).
 * Рендерится ТОЛЬКО в нативном приложении (на сайте — null). Скрывается, когда
 * реклама уже отключена. Восстановление обязательно для Apple (Guideline 3.1.1).
 */
export function RemoveAdsButton() {
  const { t } = useTranslation('common');
  const [adFree, setAdFree] = useState(isAdFree());
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => onAdFreeChange(setAdFree), []);
  useEffect(() => { void getRemoveAdsPrice().then(setPrice); }, []);

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

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
      <button
        onClick={buy}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {busy === 'buy'
          ? t('removeAds.processing')
          : `${t('removeAds.removeForever')} — ${price ?? REMOVE_ADS_FALLBACK_PRICE}`}
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">{t('removeAds.oneTime')}</p>
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
