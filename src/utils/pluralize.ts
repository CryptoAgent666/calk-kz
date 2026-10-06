/**
 * Русская плюрализация: 1 калькулятор / 2-4 калькулятора / 5+ калькуляторов
 *
 * @param n      число
 * @param one    форма для 1 (и для 21, 31, ...)
 * @param few    форма для 2-4 (и для 22-24, 32-34, ...)
 * @param many   форма для 0, 5-20, 25-30, ...
 *
 * @example
 *   pluralizeRu(1, 'калькулятор', 'калькулятора', 'калькуляторов') // → 'калькулятор'
 *   pluralizeRu(2, 'калькулятор', 'калькулятора', 'калькуляторов') // → 'калькулятора'
 *   pluralizeRu(5, 'калькулятор', 'калькулятора', 'калькуляторов') // → 'калькуляторов'
 *   pluralizeRu(11, 'минута', 'минуты', 'минут')                   // → 'минут'
 */
export function pluralizeRu(n: number, one: string, few: string, many: string): string {
  // Дробные числа всегда используют форму "few" (1.5 года, 19.2 года, 21.8 года)
  const absN = Math.abs(n);
  if (absN % 1 !== 0) {
    return few;
  }

  const num = Math.floor(absN);
  const mod100 = num % 100;
  const mod10 = num % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }
  return many;
}

/** Русские формы единиц, которые компоненты передают в pluralize() напрямую. */
const RU_UNIT_TO_KK: Record<string, string> = {
  'лет': 'жыл', 'года': 'жыл', 'год': 'жыл',
  'месяцев': 'ай', 'месяца': 'ай', 'месяц': 'ай',
  'дней': 'күн', 'дня': 'күн', 'день': 'күн',
  'недель': 'апта', 'недели': 'апта', 'неделя': 'апта',
  'часов': 'сағат', 'часа': 'сағат', 'час': 'сағат',
  'калькуляторов': 'калькулятор', 'калькулятора': 'калькулятор', 'калькулятор': 'калькулятор',
};

/**
 * Казахский язык не имеет грамматического числа в том же смысле, что и русский —
 * слова имеют единую форму после числа. Возвращает "many" форму для всех.
 * Если вызывающий код передал русские формы («год/года/лет»), отдаём казахское слово:
 * раньше на kk-страницах выходило «Зейнетақы жасы: 63 лет» (calkcheck 06.10.2026).
 */
export function pluralizeKk(_n: number, _one: string, _few: string, many: string): string {
  return RU_UNIT_TO_KK[many] ?? many;
}

/**
 * Выбор плюрализатора по текущей локали i18next.
 *
 * @example
 *   import i18n from '../i18n/config';
 *   const word = pluralize(i18n.language, count, 'калькулятор', 'калькулятора', 'калькуляторов');
 */
export function pluralize(lang: string, n: number, one: string, few: string, many: string): string {
  if (lang === 'kk') return pluralizeKk(n, one, few, many);
  return pluralizeRu(n, one, few, many);
}
