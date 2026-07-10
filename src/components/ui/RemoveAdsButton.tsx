import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Sparkles } from 'lucide-react';
import {
  isAdFree,
  onAdFreeChange,
  buyRemoveAds,
  restorePurchases,
  getRemoveAdsPrice,
} from '../../purchases';

/**
 * Кнопка «Убрать рекламу навсегда» + «Восстановить покупку».
 * Рендерится ТОЛЬКО в нативном приложении (на сайте — null). Скрывается, когда
 * реклама уже отключена. Восстановление обязательно для Apple (Guideline 3.1.1).
 *
 * Разместить в меню/настройках или над нижним баннером, напр.:
 *   import { RemoveAdsButton } from './components/ui/RemoveAdsButton';
 *   <RemoveAdsButton />
 */
export function RemoveAdsButton() {
  const [adFree, setAdFree] = useState(isAdFree());
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => onAdFreeChange(setAdFree), []);
  useEffect(() => { void getRemoveAdsPrice().then(setPrice); }, []);

  // Только в приложении и только пока реклама не отключена.
  if (!Capacitor.isNativePlatform()) return null;
  if (adFree) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
        ✓ Реклама отключена
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
          ? 'Обработка…'
          : `Убрать рекламу навсегда${price ? ` — ${price}` : ''}`}
      </button>
      <button
        onClick={restore}
        disabled={busy !== null}
        className="mt-2 w-full text-center text-xs text-blue-700 underline disabled:opacity-60"
      >
        {busy === 'restore' ? 'Восстановление…' : 'Восстановить покупку'}
      </button>
    </div>
  );
}
