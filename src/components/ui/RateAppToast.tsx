import { useEffect, useRef, useState } from 'react';
import { X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isScreenshotMode } from '../../utils/screenshotMode';
import { OFFER_REVIEW_EVENT, requestAppReview, reviewAvailable, snoozeReviewOffer } from '../../appReview';

/** Пауза после события: даём человеку досчитать, не выскакиваем в момент навигации. */
const SHOW_DELAY_MS = 12000;
const AUTO_HIDE_MS = 10000;

/**
 * Ненавязчивый тост «Нравится Calk.kz? Оцените приложение» (native-only).
 * Показывается по событию из appReview.ts (≥5 калькуляторов, ≥2 дней, куллдаун
 * 90 дней), с задержкой 12 с и автоскрытием. Тап «Оценить» открывает системный
 * in-app review (App Store / Google Play), крестик/автоскрытие = снооз 90 дней.
 */
export function RateAppToast() {
  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  const timers = useRef<{ show?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    if (!reviewAvailable()) return;
    const onOffer = () => {
      clearTimeout(timers.current.show);
      timers.current.show = setTimeout(() => {
        setVisible(true);
        clearTimeout(timers.current.hide);
        timers.current.hide = setTimeout(() => {
          setVisible(false);
          snoozeReviewOffer();
        }, AUTO_HIDE_MS);
      }, SHOW_DELAY_MS);
    };
    window.addEventListener(OFFER_REVIEW_EVENT, onOffer);
    return () => {
      window.removeEventListener(OFFER_REVIEW_EVENT, onOffer);
      clearTimeout(timers.current.show);
      clearTimeout(timers.current.hide);
    };
  }, []);

  if (isScreenshotMode() || !reviewAvailable() || !visible) return null;

  const rate = () => {
    clearTimeout(timers.current.hide);
    setVisible(false);
    void requestAppReview();
  };
  const dismiss = () => {
    clearTimeout(timers.current.hide);
    setVisible(false);
    snoozeReviewOffer();
  };

  return (
    <div
      className="fixed left-1/2 z-[59] w-[92%] max-w-sm -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-2xl"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      role="status"
    >
      <div className="flex items-center gap-3">
        <Star className="h-5 w-5 flex-shrink-0 fill-amber-400 text-amber-400" />
        <div className="flex-1 text-sm">
          <div className="font-semibold">{t('rateApp.title')}</div>
          <button onClick={rate} className="text-blue-600 underline">
            {t('rateApp.cta')}
          </button>
        </div>
        <button onClick={dismiss} aria-label={t('rateApp.close')} className="p-1 opacity-60 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
