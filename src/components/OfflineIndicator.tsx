import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { useNativeFeatures } from '../hooks/useNativeFeatures';

/**
 * Индикатор оффлайн-режима для нативных приложений.
 *
 * Показывает баннер сверху когда сеть пропала. Калькуляторы работают
 * полностью оффлайн, поэтому даём пользователю спокойствие — расчёты
 * по-прежнему работают.
 *
 * Apple любит когда приложение явно сообщает об offline state.
 */
export function OfflineIndicator() {
  const { t, i18n } = useTranslation('common');
  const { isNative, isOnline } = useNativeFeatures();

  // На вебе скрываем — там есть browser-native offline UI
  if (!isNative || isOnline) return null;

  const text = i18n.language === 'kk'
    ? 'Желі жоқ — есептегіштер офлайн жұмыс істейді'
    : 'Нет сети — калькуляторы работают офлайн';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top, 0.5rem)' }}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
