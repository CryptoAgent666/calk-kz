/**
 * Снимок устройства и посадки плашки «Убрать рекламу» для телеметрии — одной строкой
 * в поле `code` события paywall_shown (сервер принимает только свой список полей,
 * каждое до 64 символов, поэтому новое поле без правки сервера не дошло бы).
 *
 * Зачем: 27.11.2026 на эмуляторе Android 16 при трёх кнопках навигации баннер закрыл
 * нижние 11 dp плашки, а путь реальных устройств (WebView 140+, где Capacitor
 * раскладывает окно иначе) эмулятор не воспроизводит. В событиях не было ни версии
 * системы, ни размеров — проверить на живых устройствах было нечем.
 *
 * Формат — пары «буква + число» через точку:
 *   a16.w133.v412.h815.s915.b0.c0.n64.g102.k40
 *   a / i — версия Android (старшая) / iOS (старшая_младшая)
 *   w     — старшая версия WebView (Chrome), только Android
 *   v, h  — ширина и высота вьюпорта; s — screen.height (CSS px)
 *   b     — env(safe-area-inset-bottom); c — --safe-area-inset-bottom от Capacitor
 *   n     — --admob-banner-height
 *   g     — от низа плашки до низа вьюпорта; k — высота плашки
 * Величина, которую прочитать не удалось, пропускается вместе с буквой.
 */
export interface BarGeometryInput {
  userAgent: string;
  innerWidth: number;
  innerHeight: number;
  screenHeight: number;
  safeBottom: number | null;
  capSafeBottom: number | null;
  bannerHeight: number | null;
  barBottom: number | null;
  barHeight: number | null;
}

function px(value: string | null | undefined): number | null {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) ? n : null;
}

function pair(letter: string, value: number | null): string | null {
  return value === null || !Number.isFinite(value) ? null : `${letter}${Math.round(value)}`;
}

/** Чистая часть: из уже прочитанных величин собрать строку. */
export function encodeBarGeometry(input: BarGeometryInput): string {
  const ua = input.userAgent;
  const android = /Android (\d+)/.exec(ua);
  const ios = /(?:iPhone|iPad|iPod)[^)]*? OS (\d+)_(\d+)/.exec(ua);
  const chrome = /Chrome\/(\d+)/.exec(ua);
  const parts = [
    android ? `a${android[1]}` : ios ? `i${ios[1]}_${ios[2]}` : null,
    android && chrome ? `w${chrome[1]}` : null,
    pair('v', input.innerWidth),
    pair('h', input.innerHeight),
    pair('s', input.screenHeight),
    pair('b', input.safeBottom),
    pair('c', input.capSafeBottom),
    pair('n', input.bannerHeight),
    pair('g', input.barBottom),
    pair('k', input.barHeight),
  ];
  return parts.filter(Boolean).join('.');
}

/**
 * Прочитать величины со страницы. `bottom` берём из вычисленного стиля, а не из
 * getBoundingClientRect: плашка появляется с анимацией сдвига, и прямоугольник в первые
 * 0,35 с на 16 px ниже итогового места.
 * Никогда не бросает: телеметрия не должна мешать показу плашки.
 */
export function readBarGeometry(bar: HTMLElement | null): string | undefined {
  try {
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;bottom:env(safe-area-inset-bottom,0px)';
    document.body.appendChild(probe);
    const safeBottom = px(getComputedStyle(probe).bottom);
    probe.remove();
    return encodeBarGeometry({
      userAgent: navigator.userAgent,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      screenHeight: window.screen.height,
      safeBottom,
      capSafeBottom: px(root.getPropertyValue('--safe-area-inset-bottom')),
      bannerHeight: px(root.getPropertyValue('--admob-banner-height')),
      barBottom: bar ? px(getComputedStyle(bar).bottom) : null,
      barHeight: bar ? bar.offsetHeight : null,
    }) || undefined;
  } catch {
    return undefined;
  }
}
