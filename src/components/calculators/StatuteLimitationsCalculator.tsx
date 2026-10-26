import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';
import { formatLongDate, toUiLang } from '../../utils/localeFormat';
import { isWorkingDay, parseIsoDate } from '../../utils/workingTime';

/**
 * Согласование числительного с существительным.
 * Раньше выводилось «1 года», «7 года», «2 месяцев» — форма бралась одна на все
 * числа. В казахском форма действительно одна, в русском их три.
 */
function pluralForm(n: number): 'one' | 'few' | 'many' {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'many';
  if (mod10 === 1) return 'one';
  if (mod10 >= 2 && mod10 <= 4) return 'few';
  return 'many';
}

type Category =
  | 'general' | 'contract' | 'loan' | 'salary' | 'damage'
  | 'family' | 'tax' | 'labor' | 'adminFine' | 'criminal'
  | 'inheritance' | 'property';

interface Rule {
  /** Давность не распространяется (КоБС ст. 8 п. 1 и т. п.) — дату окончания не считаем. */
  noLimit?: boolean;
  years: number;
  months?: number;
  days?: number;
  article: string;
  articleKk: string;
}

const RULES: Record<Category, Rule> = {
  general:      { years: 3, article: 'ст. 178 ГК РК', articleKk: 'ҚР АК 178-бабы' },
  contract:     { years: 3, article: 'ст. 178 ГК РК', articleKk: 'ҚР АК 178-бабы' },
  loan:         { years: 3, article: 'ст. 178 ГК РК', articleKk: 'ҚР АК 178-бабы' },
  // Ст. 160 ТК (1 год) — в истолковании НП Конституционного суда от 08.06.2026 № 81-НП: зарплату и иные
  // выплаты по оплате труда взыскивают в пределах общего 3-летнего срока (ст. 178 ГК). Было: «1 год, ст. 164».
  salary:       { years: 3, article: 'ст. 178 ГК, ст. 160 ТК (НП КС № 81-НП от 08.06.2026)', articleKk: 'АК 178-бабы, ЕК 160-бабы (ҚР СК № 81-НҚ 08.06.2026)' },
  damage:       { years: 3, article: 'ст. 178 ГК РК (вред жизни и здоровью — без давности, ст. 187 пп. 3)', articleKk: 'ҚР АК 178-бабы (өмір мен денсаулыққа зиян — мерзімсіз, 187-бап 3) тт.)' },
  // КоБС ст. 8 п. 1: давность на семейные требования не распространяется (кроме сроков, установленных
  // самим Кодексом, напр. ст. 37 п. 6). Было «3 года, ст. 9» — ст. 9 об условиях заключения брака.
  family:       { noLimit: true, years: 0, article: 'ст. 8 п. 1 КоБС РК', articleKk: 'ҚР НОБК 8-бабы 1-т.' },
  tax:          { years: 3, article: 'ст. 65 НК РК (5 лет — крупный бизнес/недропользователи)', articleKk: 'ҚР СК 65-бабы (5 жыл — ірі бизнес/жер қойнауын пайдаланушылар)' }, // НК РК 2026 (№214-VIII): по умолч. 3 года
  labor:        { years: 0, months: 1, article: 'ст. 160 ТК РК (восстановление → согласит. комиссия)', articleKk: 'ҚР ЕК 160-бабы (жұмысқа қайта алу → келісім комиссиясы)' }, // 1 мес в комиссию; 2 мес в суд; иные споры — 1 год
  adminFine:    { years: 0, months: 2, article: 'ст. 62 КоАП РК (общий срок; 1 год — налоги/таможня для физлиц)', articleKk: 'ӘҚБтК 62-бабы (жалпы мерзім; жеке тұлғаларға салық/кеден — 1 жыл)' }, // общий срок давности — 2 месяца
  criminal:     { years: 2, article: 'ст. 71 УК РК (небольшая тяжесть)', articleKk: 'ҚР ҚК 71-бабы (онша ауыр емес)' },
  inheritance:  { years: 0, months: 6, article: 'ст. 1072-2 ГК РК (принятие)', articleKk: 'ҚР АК 1072-2-бабы (қабылдау)' },
  property:     { years: 7, article: 'ст. 240 ГК РК (недвижимость; иное имущество — 5 лет)', articleKk: 'ҚР АК 240-бабы (жылжымайтын мүлік; өзге мүлік — 5 жыл)' }, // приобретательная давность: 7 лет недвижимость / 5 лет иное
};

/**
 * Окончание срока по ГК ст. 174–175: срок в годах/месяцах истекает в соответствующее число последнего
 * месяца; если такого числа нет — в последний день месяца (31.10 + 1 мес = 30.11, а не 01.12, как давал
 * setMonth); если последний день нерабочий — в ближайший рабочий день. Праздники в isWorkingDay — по
 * календарю 2026 года, для других лет учитываются только выходные.
 */
function addYearsAndMonths(date: Date, years: number, months: number, days: number = 0): Date {
  const total = date.getMonth() + months;
  const y = date.getFullYear() + years + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = new Date(y, m, Math.min(date.getDate(), lastDay));
  d.setDate(d.getDate() + days);
  while (!isWorkingDay(d)) d.setDate(d.getDate() + 1);
  return d;
}

export default function StatuteLimitationsCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const lang = toUiLang(i18n.language);
  const [category, setCategory] = useState<Category>('general');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const results = useMemo(() => {
    if (!eventDate) return null;
    const start = parseIsoDate(eventDate);
    if (!start) return null;

    const rule = RULES[category];
    if (rule.noLimit) return { noLimit: true as const, expiryDate: '', daysRemaining: 0, isExpired: false, rule };
    const expiryDate = addYearsAndMonths(start, rule.years, rule.months || 0, rule.days || 0);
    const today = new Date();
    const msRemaining = expiryDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    return {
      noLimit: false as const,
      expiryDate: formatLongDate(expiryDate, lang),
      daysRemaining: Math.abs(daysRemaining),
      isExpired,
      rule,
    };
  }, [category, eventDate, lang]);

  const daysText = results
    ? `${results.daysRemaining} ${t(`statute-limitations.daysWord_${pluralForm(results.daysRemaining)}`)}`
    : '';

  const categories: Category[] = [
    'general', 'contract', 'loan', 'salary', 'damage',
    'family', 'tax', 'labor', 'adminFine', 'criminal',
    'inheritance', 'property'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="statute-limitations" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('statute-limitations.title')}</h1>
          <p className="text-gray-600">{t('statute-limitations.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('statute-limitations.category')}</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`p-3 rounded-lg border text-sm text-left ${category === c ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-300'}`}>
                <div className="font-medium">{t(`statute-limitations.categories.${c}`)}</div>
                <div className={`text-xs ${category === c ? 'text-slate-200' : 'text-gray-500'}`}>
                  {RULES[c].noLimit ? t('statute-limitations.noLimitShort') : RULES[c].years ? `${RULES[c].years} ${t('statute-limitations.years')}` : `${RULES[c].months} ${t('statute-limitations.months')}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('statute-limitations.eventDate')}</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
          <p className="text-xs text-gray-500 mt-1">{t('statute-limitations.eventDateHint')}</p>
        </div>

        {results && results.noLimit && (
          <div className="rounded-lg p-6 border-2 bg-blue-50 border-blue-300">
            <div className="text-sm text-gray-600">{t('statute-limitations.status')}</div>
            <div className="text-2xl font-bold text-blue-700">{t('statute-limitations.noLimitShort')}</div>
            <div className="text-sm mt-2">{t('statute-limitations.noLimitFamily')}</div>
          </div>
        )}

        {results && !results.noLimit && (
          <>
            <div className={`rounded-lg p-6 border-2 ${results.isExpired ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
              <div className="flex items-start gap-3">
                {results.isExpired ? (
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="text-sm text-gray-600">{t('statute-limitations.status')}</div>
                  <div className={`text-2xl font-bold ${results.isExpired ? 'text-red-700' : 'text-green-700'}`}>
                    {results.isExpired ? t('statute-limitations.expired') : t('statute-limitations.active')}
                  </div>
                  <div className="text-sm mt-2">
                    {results.isExpired
                      ? t('statute-limitations.expiredDaysAgo', { days: daysText })
                      : t('statute-limitations.daysRemaining', { days: daysText })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('statute-limitations.expiryDate')}</span>
                <span className="font-semibold">{results.expiryDate}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('statute-limitations.period')}</span>
                <span className="font-semibold">
                  {results.rule.years ? `${results.rule.years} ${t(`statute-limitations.yearsWord_${pluralForm(results.rule.years)}`)}` : ''}
                  {results.rule.months ? ` ${results.rule.months} ${t(`statute-limitations.monthsWord_${pluralForm(results.rule.months)}`)}` : ''}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('statute-limitations.article')}</span>
                <span className="font-semibold">{lang === 'kk' ? results.rule.articleKk : results.rule.article}</span>
              </div>
            </div>
          </>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          💡 {t('statute-limitations.info')}
        </div>
      </div>

      {results && !results.noLimit && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('statute-limitations.title'),
              subtitle: t(`statute-limitations.categories.${category}`),
              sections: [{ title: t('statute-limitations.resultsTitle'), data: [
                { label: t('statute-limitations.status'), value: results.isExpired ? t('statute-limitations.expired') : t('statute-limitations.active') },
                { label: t('statute-limitations.expiryDate'), value: results.expiryDate },
                { label: t('statute-limitations.article'), value: lang === 'kk' ? results.rule.articleKk : results.rule.article },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="statute-limitations"
          />
        </div>
      )}

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <FAQSection items={[
        { question: t('statute-limitations.faq.q1'), answer: t('statute-limitations.faq.a1') },
        { question: t('statute-limitations.faq.q2'), answer: t('statute-limitations.faq.a2') },
        { question: t('statute-limitations.faq.q3'), answer: t('statute-limitations.faq.a3') },
        { question: t('statute-limitations.faq.q4'), answer: t('statute-limitations.faq.a4') },
        { question: t('statute-limitations.faq.q5'), answer: t('statute-limitations.faq.a5') },
      ]} 
          sources={getSources('statute-limitations')}
        />
      <EmbedWidget calculatorId="statute-limitations" calculatorTitle={t('statute-limitations.title')} />
      <LastUpdated calculatorId="statute-limitations" />
    </div>
  );
}
