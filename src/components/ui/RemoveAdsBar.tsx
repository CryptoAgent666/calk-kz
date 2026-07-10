import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  isAdFree,
  onAdFreeChange,
  buyRemoveAds,
  getRemoveAdsPrice,
  purchasesAvailable,
  REMOVE_ADS_FALLBACK_PRICE,
} from '../../purchases';

const DISMISS_KEY = 'calk_removeads_bar_dismissed';

/**
 * Тонкая плашка «Убрать рекламу» НАД нативным AdMob-баннером (место 2 из 3).
 * Баннер — нативный оверлей внизу экрана, поэтому плашка позиционируется с
 * отступом от низа (высота баннера + safe-area). Ненавязчивая, с крестиком:
 * скрывается на текущую сессию (sessionStorage).
 *
 * Рендерится ТОЛЬКО в приложении и пока реклама не отключена.
 */
export function RemoveAdsBar() {
  const { t } = useTranslation('common');
  const [adFree, setAdFree] = useState(isAdFree());
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAdFreeChange(setAdFree), []);
  useEffect(() => { void getRemoveAdsPrice().then(setPrice); }, []);

  if (!purchasesAvailable() || adFree || dismissed) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };
  const buy = async () => {
    setBusy(true);
    try { await buyRemoveAds(); } finally { setBusy(false); }
  };

  return (
    <div
      className="fixed left-0 right-0 z-40 flex items-center justify-between gap-2 bg-blue-600 px-3 py-2 text-white shadow-lg"
      style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      role="region"
      aria-label={t('removeAds.remove')}
    >
      <button
        onClick={buy}
        disabled={busy}
        className="flex flex-1 items-center gap-2 text-sm font-medium disabled:opacity-70"
      >
        <Sparkles className="h-4 w-4 flex-shrink-0" />
        <span>{busy ? t('removeAds.processing') : `${t('removeAds.remove')} — ${price ?? REMOVE_ADS_FALLBACK_PRICE}`}</span>
      </button>
      <button onClick={dismiss} aria-label={t('removeAds.hide')} className="p-1 opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
