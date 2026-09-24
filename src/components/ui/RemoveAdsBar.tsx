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
import { useMounted } from '../../hooks/useMounted';
import { openRemoveAdsOffer } from '../../utils/removeAdsOffer';

const DISMISS_KEY = 'calk_removeads_bar_dismissed';
const VARIANT_KEY = 'calk_removeads_bar_variant';
const SESSIONS_KEY = 'calk_removeads_bar_sessions';

/**
 * Текст плашки чередуется по сессиям: цена ↔ кофейный тейк.
 * Выбор фиксируется на сессию (sessionStorage), счётчик сессий — localStorage.
 */
function pickBarVariant(): 'price' | 'coffee' {
  try {
    const cached = sessionStorage.getItem(VARIANT_KEY);
    if (cached === 'price' || cached === 'coffee') return cached;
    const n = Number(localStorage.getItem(SESSIONS_KEY) || '0') + 1;
    localStorage.setItem(SESSIONS_KEY, String(n));
    const variant = n % 2 === 0 ? 'coffee' : 'price';
    sessionStorage.setItem(VARIANT_KEY, variant);
    return variant;
  } catch {
    return 'price';
  }
}

/**
 * Тонкая плашка «Убрать рекламу» НАД нативным AdMob-баннером (место 2 из 3).
 * Баннер — нативный оверлей внизу экрана, поэтому плашка позиционируется с
 * отступом от низа (высота баннера + safe-area). Ненавязчивая, с крестиком:
 * скрывается на текущую сессию (sessionStorage).
 *
 * Тап открывает экран предложения (RemoveAdsOffer), а не сразу окно оплаты.
 * Цена видна в обоих вариантах текста: «кофейный» без цены собирал тапы
 * «узнать, сколько стоит», которые тут же отменялись в окне стора.
 *
 * Рендерится ТОЛЬКО в приложении и пока реклама не отключена.
 */
export function RemoveAdsBar() {
  const { t } = useTranslation('common');
  const [adFree, setAdFree] = useState(isAdFree());
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [variant] = useState(pickBarVariant);
  const priceState = useRemoveAdsPrice();
  // Статика пререндера снята как сайт (плашки нет) — в приложении первый
  // рендер обязан с ней совпасть, поэтому плашка появляется после маунта.
  const mounted = useMounted();

  useEffect(() => onAdFreeChange(setAdFree), []);

  // Воронка: один показ оффера при первом появлении плашки в сессии.
  const shownRef = useRef(false);
  useEffect(() => {
    if (shownRef.current || !mounted) return;
    if (isScreenshotMode() || !purchasesAvailable() || adFree || dismissed) return;
    // Показ засчитываем, когда стор подтвердил продукт: на 'loading' плашка
    // мелькает с запасной ценой и на устройстве без биллинга тут же пропадает —
    // такой «показ» раздувал знаменатель воронки.
    if (priceState.status !== 'ready') return;
    shownRef.current = true;
    emitIap('paywall_shown', { platform: Capacitor.getPlatform(), placement: 'bar', variant });
  }, [mounted, adFree, dismissed, priceState.status, variant]);

  if (!mounted || isScreenshotMode() || !purchasesAvailable() || adFree || dismissed) return null;
  // Стор ничего не отдал → плашку не рисуем совсем (тап вёл бы в тупик).
  if (priceState.status === 'unavailable') return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  const label = variant === 'coffee'
    ? t('removeAds.barCoffee', { price: priceState.price })
    : `${t('removeAds.remove')} — ${priceState.price}`;

  return (
    <div
      className="calk-slide-up fixed left-0 right-0 z-40 flex items-center justify-between gap-2 bg-blue-600 px-3 py-2 text-white shadow-lg"
      // Посадка над нативным AdMob-баннером. SizeChanged в admob@8 НЕ приходит
      // (сим-QA calk-usa 26.08.2026), поэтому --admob-banner-height обычно пуст:
      // минимум 96px держит бар выше адаптивного баннера в любом случае,
      // а var уточняет позицию вверх, если событие всё же сработает.
      style={{ bottom: 'calc(max(var(--admob-banner-height, 0px), 96px) + env(safe-area-inset-bottom, 0px) + 6px)' }}
      role="region"
      aria-label={t('removeAds.remove')}
    >
      <button
        onClick={() => openRemoveAdsOffer('bar', variant)}
        className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
      >
        {variant === 'price' && <Sparkles className="h-4 w-4 flex-shrink-0" />}
        <span>{label}</span>
      </button>
      <button onClick={dismiss} aria-label={t('removeAds.hide')} className="p-1 opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
