import { useEffect, useRef, type ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id заголовка внутри карточки — для aria-labelledby. */
  labelledBy: string;
  children: ReactNode;
}

/**
 * Модальное окно для приложения и сайта: затемнение, карточка по центру,
 * закрытие по фону, Escape и аппаратной «Назад» на Android.
 *
 * Карточка центрируется в области НАД нативным AdMob-баннером: он рисуется
 * поверх WebView внизу экрана, и кнопки нижнего листа ушли бы под него
 * (та же посадка, что у RemoveAdsBar: SizeChanged в admob@8 не приходит,
 * поэтому минимум 96px). На сайте баннера нет — отступ просто поднимает
 * карточку чуть выше центра.
 */
export function Modal({ open, onClose, labelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Фокус — на само окно (для VoiceOver/TalkBack и клавиатуры), а не на кнопку:
  // программный фокус кнопки в WKWebView рисует рамку, как будто её уже нажали.
  useEffect(() => { if (open) dialogRef.current?.focus(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);

    // Пока окно открыто, фон не прокручивается.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Android «Назад»: пока висит слушатель, Capacitor НЕ делает history.back —
    // закрываем окно вместо ухода со страницы; после снятия поведение прежнее.
    let removeBack: (() => void) | undefined;
    let cancelled = false;
    if (Capacitor.getPlatform() === 'android') {
      void import('@capacitor/app').then(({ App }) =>
        App.addListener('backButton', () => onClose()).then((h) => {
          if (cancelled) void h.remove();
          else removeBack = () => { void h.remove(); };
        }),
      ).catch(() => { /* без плагина — просто без аппаратной «Назад» */ });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      removeBack?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 'calc(max(var(--admob-banner-height, 0px), 96px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="calk-slide-up max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
