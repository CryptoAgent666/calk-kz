import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatLongDate } from '../../utils/localeFormat';

/**
 * Per-page lastUpdated date. Maps calculatorId → last meaningful update.
 * Updated when formula/rates/coefficients change (sync with /legal/updates/).
 */
const LAST_UPDATED: Record<string, string> = {
  // === НАЛОГИ (НК РК 2026 — 01.01.2026) ===
  'income-tax': '2026-01-01',
  'vat': '2026-01-01',
  'vat-threshold': '2026-01-01',
  'vehicle-tax': '2026-09-24', // срок уплаты налога за 2026 год — 1 апреля 2027
  'property-tax': '2026-01-01',
  'property-sale-tax': '2026-09-24', // ФНО 270.00 до 15.09, уплата до 25.09; ИПН 15% сверх 8 500 МРП
  'luxury-tax': '2026-01-01',
  'casino-winnings-tax': '2026-01-01',
  'corporate-income-tax': '2026-01-01',
  'crypto-tax': '2026-09-24', // ФНО 270.00 до 15.09 вместо 240.00; ИПН 15% сверх 8 500 МРП
  'rental-income-tax': '2026-09-24', // декларация 270.00 до 15.09 вместо 240.00
  'unified-payment': '2026-01-01',
  'tax-deductions': '2026-01-01',
  'enpf-threshold': '2026-07-11',
  'gph-tax': '2026-07-11',
  'production-calendar': '2026-07-11',
  'work-experience': '2026-07-11',
  'tip-split': '2026-07-11',
  'alcohol-blood': '2026-09-24', // КоАП 608 ч. 3-1: повторно 20 суток + 8 лет; порог 0,3‰ приостановлен
  'kdif-guarantee': '2026-07-11',
  'bad-habits-cost': '2026-07-11',
  'mortgage-compare': '2026-07-11',
  'mrp-converter': '2026-07-11',
  'house-heating': '2026-09-25', // пример 150 м²: 7,7 т угля
  'ip-payments': '2026-07-11',
  'dividend-tax': '2026-07-10',
  'self-employed': '2026-07-10',
  'mobile-transfers': '2026-07-10',
  'tax-regime-comparison': '2026-09-24', // соцплатежи ИП за себя 21 675 ₸ (было 17 000)
  'universal-declaration': '2026-01-01',
  'ip-simplified': '2026-09-24', // платежи за сотрудников: ИПН/ОПВ/ВОСМС из зарплаты, ОПВР/СО/ООСМС за счёт ИП, без СН
  'excise-tax': '2026-01-01',

  // === АВТО ===
  'customs-clearance': '2026-09-13',
  'recycling-fee': '2026-09-13',
  'registration-fee': '2026-01-01',
  'insurance-premium': '2026-09-10',
  'kasko': '2026-01-01',
  'parcel-customs': '2026-01-01',
  'vehicle-tco': '2026-05-01',  // топливо + Отау 1 мая
  'auto-leasing': '2026-01-01',
  'car-market-value': '2026-04-19',
  'car-transfer': '2026-09-24', // ОГПО: диапазон по двум территориальным коэффициентам (15–54 тыс. ₸)
  'fuel-cost': '2026-05-01',     // обновили цены КМГ
  'traffic-fines': '2026-01-01',
  'fancy-plates': '2026-09-25', // быстрый ответ по прейскуранту 15–285 МРП
  'tire-size': '2026-04-19',

  // === ФИНАНСЫ ===
  'credit': '2026-04-19',
  'deposit': '2026-04-19',
  'mortgage-specialized': '2026-04-19',
  'rent-vs-buy': '2026-04-19',
  'compound-interest': '2026-04-19',
  'refinancing': '2026-09-25', // примеры пересчитаны по аннуитету
  'microloan': '2026-04-19',
  'early-repayment': '2026-04-19',
  'otbasy-bank': '2026-05-01',
  'fire': '2026-04-19',
  'business-roi': '2026-04-19',
  'break-even': '2026-04-19',
  'margin-markup': '2026-04-19',
  'cashback': '2026-04-19',
  'debt-burden': '2026-04-19',
  'inflation': '2026-04-19',
  'cash-flow-gap': '2026-04-19',
  'franchise-payback': '2026-04-19',

  // === СОЦИАЛЬНЫЕ/ТРУДОВЫЕ ===
  'salary': '2026-09-15',  // СО не ниже 1 МЗП (ст. 245 СК); социальный вычет ст. 404 НК; режим «несколько сотрудников»
  'sick-leave': '2026-01-01',
  'maternity-benefits': '2026-01-01',
  'pension': '2026-01-01',
  'pension-annuity': '2026-04-19',
  'unemployment': '2026-01-01',
  'social-assistance': '2026-01-01',
  'gons': '2026-01-01',
  'alimony': '2026-01-01',
  'vacation-pay': '2026-04-19',
  'severance-pay': '2026-06-11',  // ИПН 15% свыше 8500 МРП/год; подтверждено: ОПВ+ВОСМС с обеих частей (ОСМС-льгота пособия отменена с 01.01.2026)
  'salary-reverse': '2026-09-15',  // СО не ниже 1 МЗП (ст. 245 СК)
  'business-trip': '2026-09-24', // суточные: НК ст. 366 + ПП № 256 вместо выдуманных 4–6 МРП
  'average-earnings': '2026-09-24', // командировки убраны: ТК ст. 127 — зарплата за рабочие дни
  'overtime': '2026-09-24', // норма 164 ч (1 968 ÷ 12), ставки работодателя 2026
  'second-job': '2026-09-24', // ставки работодателя 2026 в FAQ
  'teacher-salary': '2026-05-22',  // hotfix VOSMS

  // === ЮРИДИЧЕСКИЕ ===
  'court-fee': '2026-01-01',
  'penalty': '2026-05-03',  // обновили ставку пени
  'notary': '2026-05-22',  // hotfix расчёта
  'inheritance': '2026-04-19',
  'divorce': '2026-09-24', // ЗАГС — плата 6 900 ₸ (приказ № 175/НҚ), без мин. 0,5 МРП
  'property-division': '2026-09-24', // госпошлина 1%, не более 10 000 МРП, без минимума
  'statute-limitations': '2026-04-19',
  'bankruptcy': '2026-04-19',
  'moral-damage': '2026-09-25', // гонорар юриста 100–300 тыс. ₸

  // === СТРОИТЕЛЬСТВО ===
  'concrete-volume': '2026-04-19',
  'brick': '2026-04-19',
  'wallpaper': '2026-04-19',
  'flooring': '2026-04-19',
  'insulation': '2026-04-19',

  // === КОММУНАЛЬНЫЕ ===
  'electricity': '2026-01-01',
  'water': '2026-09-24', // единые тарифы Алматы/Астаны/Шымкента по приказам ДКРЕМ
  'heating': '2026-01-01',
  'gas': '2026-01-01',

  // === КОНВЕРТЕРЫ ===
  'currency-converter': '2026-05-04',  // курсы НБРК
  'time-converter': '2026-04-19',
  'number-to-words': '2026-04-19',
  'time-to-words': '2026-04-19',
  'age': '2026-04-19',
  'pet-age': '2026-04-19',
  'roman-numerals': '2026-04-19',
  'unit-converter': '2026-04-19',
  'timezone': '2026-04-19',
  'password-generator': '2026-05-22',  // hotfix дублей
  'qr-code-generator': '2026-04-19',

  // === РЕЛИГИОЗНЫЕ ===
  'zakat': '2026-09-25', // примеры: нисаб 511 700 ₸ по текущей цене серебра
  'kurban-sacrifice': '2026-04-19',
  'ramadan-sadaqah': '2026-05-22',
  'islamic-inheritance': '2026-04-19',
  'hajj': '2026-04-19',
  'islamic-mortgage': '2026-04-19',

  // === МАТЕМАТИКА ===
  'discount': '2026-04-19',
  'percentage': '2026-04-19',
  'leap-year': '2026-04-19',
  'date-calculator': '2026-04-19',

  // === ЗДОРОВЬЕ ===
  'bmi': '2026-04-19',
  'calories': '2026-04-19',
  'pregnancy': '2026-04-19',
  'body-fat': '2026-04-19',
  'sleep': '2026-04-19',
  'water-intake': '2026-04-19',

  // === ОБРАЗОВАНИЕ ===
  'ent-score': '2026-09-25', // пороги грантового конкурса 2026
  'gpa': '2026-04-19',

  // === СЕЛЬСКОЕ ХОЗЯЙСТВО ===
  'farm-land-tax': '2026-08-06',  // модель переведена на базовые ставки ст. 576 НК РК

  // === НЕДВИЖИМОСТЬ ===
  'fair-rental-price': '2026-04-19',
  'apartment-valuation': '2026-04-19',
  'cost-of-living': '2026-04-19',
};

interface LastUpdatedProps {
  calculatorId: string;
}

export function LastUpdated({ calculatorId }: LastUpdatedProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'kk' ? 'kk' : 'ru';
  const iso = LAST_UPDATED[calculatorId];
  if (!iso) return null;
  const formatted = formatLongDate(iso, lang);
  const label = lang === 'kk' ? 'Жаңартылды' : 'Обновлено';

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
      <Clock className="w-3.5 h-3.5" />
      <span>{label}: {formatted}</span>
    </div>
  );
}
