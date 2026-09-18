/**
 * Детерминированное форматирование дат и чисел для ru/kk.
 *
 * НЕ передавать 'kk-KZ' в toLocaleString / toLocaleDateString / Intl: вывод
 * зависит от ICU конкретного браузера, а статика снята puppeteer'ом.
 *  - Chrome for Testing 141 (пререндер) kk не знает → en-US: «September 2026», «9/18/2026»;
 *  - Chrome 152+ знает kk-KZ, но без данных: «2026 M09», «2026-09-18»;
 *  - Safari / Firefox (полный CLDR): «2026 ж. қыркүйек», «18.09.2026», «250 575,5».
 * Текст статики ≠ первого клиентского рендера → #425 + #423 (React выбрасывает
 * пререндер и перерисовывает весь root) на КАЖДОЙ странице /__kk/ — так было на
 * проде 18.09.2026, когда Chrome обновился до версии с kk-KZ.
 *
 * Поэтому месяцы — своими массивами, числа — через ru-KZ (формат тот же, что в
 * казахском CLDR: неразрывный пробел между разрядами, запятая перед дробью;
 * ru есть в ICU любого браузера).
 */

export type UiLang = 'ru' | 'kk';

export const toUiLang = (language: string | undefined): UiLang => (language === 'kk' ? 'kk' : 'ru');

/** Локаль для чисел на обоих языках. */
export const NUMBER_LOCALE = 'ru-KZ';

const MONTHS_RU_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_RU_NOMINATIVE = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const MONTHS_KK = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

type DateInput = Date | string;

/** 'YYYY-MM-DD' разбирается как календарная дата (без сдвига часового пояса). */
function parts(date: DateInput): [number, number, number] {
  if (typeof date === 'string') {
    const [y, m, d] = date.slice(0, 10).split('-').map(Number);
    return [y, m - 1, d];
  }
  return [date.getFullYear(), date.getMonth(), date.getDate()];
}

/** «18 сентября 2026» / «18 қыркүйек 2026». */
export function formatLongDate(date: DateInput, lang: UiLang): string {
  const [y, m, d] = parts(date);
  const months = lang === 'kk' ? MONTHS_KK : MONTHS_RU_GENITIVE;
  return `${d} ${months[m]} ${y}`;
}

/** «18 сентября» / «18 қыркүйек». */
export function formatDayMonth(date: DateInput, lang: UiLang): string {
  const [, m, d] = parts(date);
  return `${d} ${(lang === 'kk' ? MONTHS_KK : MONTHS_RU_GENITIVE)[m]}`;
}

/** «сентябрь 2026 г.» / «2026 ж. қыркүйек». */
export function formatMonthYear(date: DateInput, lang: UiLang): string {
  const [y, m] = parts(date);
  return lang === 'kk' ? `${y} ж. ${MONTHS_KK[m]}` : `${MONTHS_RU_NOMINATIVE[m]} ${y} г.`;
}

/** «18.09.2026» — одинаково на обоих языках. */
export function formatShortDate(date: DateInput): string {
  const [y, m, d] = parts(date);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d)}.${p(m + 1)}.${y}`;
}
