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

type Category =
  | 'general' | 'contract' | 'loan' | 'salary' | 'damage'
  | 'family' | 'tax' | 'labor' | 'adminFine' | 'criminal'
  | 'inheritance' | 'property';

interface Rule {
  years: number;
  months?: number;
  days?: number;
  article: string;
}

const RULES: Record<Category, Rule> = {
  general:      { years: 3, article: 'ст. 178 ГК РК' },
  contract:     { years: 3, article: 'ст. 178 ГК РК' },
  loan:         { years: 3, article: 'ст. 178 ГК РК' },
  salary:       { years: 1, article: 'ст. 164 ТК РК' },
  damage:       { years: 3, article: 'ст. 178 ГК РК' },
  family:       { years: 3, article: 'ст. 9 КоБС РК' },
  tax:          { years: 5, article: 'ст. 48 НК РК' },
  labor:        { years: 0, months: 3, article: 'ст. 160 ТК РК' }, // 3 месяца
  adminFine:    { years: 1, article: 'ст. 62 КоАП РК' },
  criminal:     { years: 2, article: 'ст. 71 УК РК (небольшая тяжесть)' },
  inheritance:  { years: 0, months: 6, article: 'ст. 1072 ГК РК (принятие)' },
  property:     { years: 10, article: 'ст. 240 ГК РК' },
};

function addYearsAndMonths(date: Date, years: number, months: number, days: number = 0): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() + days);
  return d;
}

export default function StatuteLimitationsCalculator() {
  const { t } = useTranslation('calculators');
  const [category, setCategory] = useState<Category>('general');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const results = useMemo(() => {
    if (!eventDate) return null;
    const start = new Date(eventDate);
    if (isNaN(start.getTime())) return null;

    const rule = RULES[category];
    const expiryDate = addYearsAndMonths(start, rule.years, rule.months || 0, rule.days || 0);
    const today = new Date();
    const msRemaining = expiryDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    return {
      expiryDate: expiryDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
      daysRemaining: Math.abs(daysRemaining),
      isExpired,
      rule,
    };
  }, [category, eventDate]);

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
                  {RULES[c].years ? `${RULES[c].years} ${t('statute-limitations.years')}` : `${RULES[c].months} ${t('statute-limitations.months')}`}
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

        {results && (
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
                      ? t('statute-limitations.expiredDaysAgo', { days: results.daysRemaining })
                      : t('statute-limitations.daysRemaining', { days: results.daysRemaining })}
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
                  {results.rule.years ? `${results.rule.years} ${t('statute-limitations.yearsWord')}` : ''}
                  {results.rule.months ? ` ${results.rule.months} ${t('statute-limitations.monthsWord')}` : ''}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('statute-limitations.article')}</span>
                <span className="font-semibold">{results.rule.article}</span>
              </div>
            </div>
          </>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          💡 {t('statute-limitations.info')}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('statute-limitations.title'),
              subtitle: t(`statute-limitations.categories.${category}`),
              sections: [{ title: t('statute-limitations.resultsTitle'), data: [
                { label: t('statute-limitations.status'), value: results.isExpired ? 'Истёк' : 'Активен' },
                { label: t('statute-limitations.expiryDate'), value: results.expiryDate },
                { label: t('statute-limitations.article'), value: results.rule.article },
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
