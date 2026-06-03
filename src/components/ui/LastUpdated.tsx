import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Per-page lastUpdated date. Maps calculatorId → last meaningful update.
 * Updated when formula/rates/coefficients change (sync with /legal/updates/).
 */
const LAST_UPDATED: Record<string, string> = {
  // === НАЛОГИ (НК РК 2026 — 01.01.2026) ===
  'income-tax': '2026-01-01',
  'vat': '2026-01-01',
  'vat-threshold': '2026-01-01',
  'vehicle-tax': '2026-01-01',
  'property-tax': '2026-01-01',
  'property-sale-tax': '2026-01-01',
  'luxury-tax': '2026-01-01',
  'casino-winnings-tax': '2026-01-01',
  'corporate-income-tax': '2026-01-01',
  'crypto-tax': '2026-01-01',
  'rental-income-tax': '2026-01-01',
  'unified-payment': '2026-01-01',
  'esp-self-employed': '2026-01-01',
  'tax-deductions': '2026-01-01',
  'tax-regime-comparison': '2026-01-01',
  'universal-declaration': '2026-01-01',
  'ip-simplified': '2026-01-01',
  'excise-tax': '2026-01-01',

  // === АВТО ===
  'customs-clearance': '2026-01-01',
  'recycling-fee': '2026-01-01',
  'registration-fee': '2026-01-01',
  'insurance-premium': '2026-01-01',
  'kasko': '2026-01-01',
  'parcel-customs': '2026-01-01',
  'vehicle-tco': '2026-05-01',  // топливо + Отау 1 мая
  'auto-leasing': '2026-01-01',
  'car-market-value': '2026-04-19',
  'car-transfer': '2026-01-01',
  'fuel-cost': '2026-05-01',     // обновили цены КМГ
  'traffic-fines': '2026-01-01',
  'fancy-plates': '2026-01-01',
  'tire-size': '2026-04-19',

  // === ФИНАНСЫ ===
  'credit': '2026-04-19',
  'deposit': '2026-04-19',
  'mortgage-specialized': '2026-04-19',
  'rent-vs-buy': '2026-04-19',
  'compound-interest': '2026-04-19',
  'refinancing': '2026-04-19',
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
  'salary': '2026-01-01',
  'sick-leave': '2026-01-01',
  'maternity-benefits': '2026-01-01',
  'pension': '2026-01-01',
  'pension-annuity': '2026-04-19',
  'unemployment': '2026-01-01',
  'social-assistance': '2026-01-01',
  'gons': '2026-01-01',
  'alimony': '2026-01-01',
  'vacation-pay': '2026-04-19',
  'severance-pay': '2026-04-19',
  'salary-reverse': '2026-04-19',
  'business-trip': '2026-04-19',
  'average-earnings': '2026-04-19',
  'overtime': '2026-04-19',
  'second-job': '2026-04-19',
  'teacher-salary': '2026-05-22',  // hotfix VOSMS

  // === ЮРИДИЧЕСКИЕ ===
  'court-fee': '2026-01-01',
  'penalty': '2026-05-03',  // обновили ставку пени
  'notary': '2026-05-22',  // hotfix расчёта
  'inheritance': '2026-04-19',
  'divorce': '2026-04-19',
  'property-division': '2026-04-19',
  'statute-limitations': '2026-04-19',
  'bankruptcy': '2026-04-19',
  'moral-damage': '2026-04-19',

  // === СТРОИТЕЛЬСТВО ===
  'concrete-volume': '2026-04-19',
  'brick': '2026-04-19',
  'wallpaper': '2026-04-19',
  'flooring': '2026-04-19',
  'insulation': '2026-04-19',

  // === КОММУНАЛЬНЫЕ ===
  'electricity': '2026-01-01',
  'water': '2026-01-01',
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
  'zakat': '2026-04-19',
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
  'ent-score': '2026-04-19',
  'gpa': '2026-04-19',

  // === СЕЛЬСКОЕ ХОЗЯЙСТВО ===
  'farm-land-tax': '2026-05-22',  // hotfix дублей в примерах

  // === НЕДВИЖИМОСТЬ ===
  'fair-rental-price': '2026-04-19',
  'apartment-valuation': '2026-04-19',
  'cost-of-living': '2026-04-19',
};

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                   'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_KK = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
                   'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

function formatDate(iso: string, lang: 'ru' | 'kk'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = lang === 'kk' ? MONTHS_KK : MONTHS_RU;
  return `${d} ${months[m - 1]} ${y}`;
}

interface LastUpdatedProps {
  calculatorId: string;
}

export function LastUpdated({ calculatorId }: LastUpdatedProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'kk' ? 'kk' : 'ru';
  const iso = LAST_UPDATED[calculatorId];
  if (!iso) return null;
  const formatted = formatDate(iso, lang);
  const label = lang === 'kk' ? 'Жаңартылды' : 'Обновлено';

  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
      <Clock className="w-3.5 h-3.5" />
      <span>{label}: {formatted}</span>
    </div>
  );
}
