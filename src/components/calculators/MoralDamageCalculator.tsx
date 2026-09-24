import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertTriangle } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP_2026 = 4325;

// Ориентиры компенсации морального вреда в РК (ст. 951–952 ГК РК) по категориям, в МРП.
// Закон и НП ВС РК № 7 сумм не устанавливают — только разумность и справедливость (п. 7–8).
// Диапазоны откалиброваны 13.09.2026 по ~60 решениям 2023–2026 гг. из пресс-релизов судов и СМИ
// (прежняя таблица завышала средний вред, честь, трудовые споры и задержание в 2,5–3 раза).
// Выборка смещена к резонансным делам, поэтому это ориентир, а не статистика.

type Category =
  | 'lightInjury'  // лёгкий вред здоровью
  | 'mediumInjury' // средний вред
  | 'severeInjury' // тяжкий вред
  | 'death'        // смерть близкого
  | 'honor'        // честь и достоинство (клевета)
  | 'privacy'      // нарушение неприкосновенности частной жизни
  | 'consumer'     // защита прав потребителей
  | 'labor'        // трудовой спор (увольнение, задержка)
  | 'adminArrest'  // незаконный административный арест (сутки)
  | 'illegalArrest'; // незаконное уголовное преследование, содержание под стражей

const CATEGORY_RANGES: Record<Category, { min: number; max: number; avg: number }> = {
  lightInjury:   { min: 25,  max: 150,  avg: 70 },   // 100–500 тыс ₸
  mediumInjury:  { min: 50,  max: 250,  avg: 110 },  // 200–750 тыс ₸
  severeInjury:  { min: 500, max: 2500, avg: 900 },  // 2,5–10 млн ₸ (II–III группа инвалидности)
  death:         { min: 700, max: 5000, avg: 1800 }, // 3–11,7 млн ₸ на истца
  honor:         { min: 5,   max: 150,  avg: 25 },   // 20–200 тыс ₸, частные лица
  privacy:       { min: 20,  max: 250,  avg: 50 },   // 80 тыс – 1 млн ₸
  consumer:      { min: 10,  max: 100,  avg: 25 },   // 50–250 тыс ₸
  labor:         { min: 5,   max: 70,   avg: 23 },   // восстановление на работе — стабильно 100 тыс ₸
  adminArrest:   { min: 30,  max: 120,  avg: 60 },   // 200–300 тыс ₸ за несколько суток
  illegalArrest: { min: 300, max: 2500, avg: 700 },  // 1,5–10 млн ₸, зависит от срока под стражей
};

// Госпошлина по НК РК 2026 (ст. 665, 668): освобождены иски о вреде здоровью, трудовые
// и о незаконном осуждении/аресте; по чести и достоинству — 1 % от суммы иска.
type FeeRule = 'exempt' | 'nonProperty' | 'percentOfClaim';
const COURT_FEE_RULE: Record<Category, FeeRule> = {
  lightInjury: 'exempt',
  mediumInjury: 'exempt',
  severeInjury: 'exempt',
  death: 'nonProperty',
  honor: 'percentOfClaim',
  privacy: 'nonProperty',
  consumer: 'nonProperty',
  labor: 'exempt',
  adminArrest: 'exempt',
  illegalArrest: 'exempt',
};

export default function MoralDamageCalculator() {
  const { t } = useTranslation('calculators');
  const [category, setCategory] = useState<Category>('labor');
  const [severity, setSeverity] = useState<number>(50); // 0-100 (низкая-высокая)
  const [hasEvidence, setHasEvidence] = useState<boolean>(true);
  const [hasWitnesses, setHasWitnesses] = useState<boolean>(false);
  const [longTermEffect, setLongTermEffect] = useState<boolean>(false);

  const results = useMemo(() => {
    const range = CATEGORY_RANGES[category];
    // Кусочно-линейно через среднее: 0 % → min, 50 % → avg, 100 % → max. Суммы в практике
    // скошены к низу диапазона, и прямая min→max ставила бы середину слайдера сильно выше типичной.
    let baseMRP = severity <= 50
      ? range.min + (range.avg - range.min) * (severity / 50)
      : range.avg + (range.max - range.avg) * ((severity - 50) / 50);

    // Модификаторы
    if (hasEvidence) baseMRP *= 1.15; // +15%
    if (hasWitnesses) baseMRP *= 1.10; // +10%
    if (longTermEffect) baseMRP *= 1.25; // +25%

    // Не выше верхней границы наблюдаемой практики
    baseMRP = Math.min(baseMRP, range.max);

    const amountKZT = baseMRP * MRP_2026;

    const feeRule = COURT_FEE_RULE[category];
    const courtFee = feeRule === 'exempt' ? 0
      : feeRule === 'percentOfClaim' ? amountKZT * 0.01
      : 0.5 * MRP_2026;

    // Гонорар юриста — обычно 10-20% от суммы удовлетворённого иска или фикс
    // Верх не ниже фиксированного минимума: у малых категорий 20 % суммы меньше 100 000 ₸.
    const lawyerFeeMin = 100000;
    // Верх — 300 000 ₸ или 20% суммы, если она больше (как в FAQ: «100 000–300 000 ₸
    // за ведение дела или 10–20% от удовлетворённой суммы»); раньше на малых суммах
    // выходило «100 000 ₸ — 100 000 ₸».
    const lawyerFeeMax = Math.max(300000, Math.round(amountKZT * 0.2));

    return {
      estimatedMRP: Math.round(baseMRP),
      estimatedKZT: Math.round(amountKZT),
      rangeMin: range.min,
      rangeMax: range.max,
      rangeAvg: range.avg,
      courtFee: Math.round(courtFee),
      feeRule,
      lawyerFeeMin,
      lawyerFeeMax,
    };
  }, [category, severity, hasEvidence, hasWitnesses, longTermEffect]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  const categories: Category[] = [
    'lightInjury', 'mediumInjury', 'severeInjury', 'death',
    'honor', 'privacy', 'consumer', 'labor', 'adminArrest', 'illegalArrest'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="moral-damage" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('moral-damage.title')}</h1>
          <p className="text-gray-600">{t('moral-damage.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('moral-damage.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('moral-damage.category')}</label>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`p-3 rounded-lg border text-left ${category === c ? 'bg-violet-50 border-violet-500' : 'bg-white border-gray-300'}`}>
                  <div className="text-sm font-medium">{t(`moral-damage.categories.${c}`)}</div>
                  <div className="text-xs text-gray-500">
                    {CATEGORY_RANGES[c].min}-{CATEGORY_RANGES[c].max} МРП ({formatNumber(CATEGORY_RANGES[c].avg * MRP_2026)} ср.)
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('moral-damage.severity')}: {severity}%
            </label>
            <input type="range" min="0" max="100" value={severity}
              onChange={e => setSeverity(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{t('moral-damage.low')}</span>
              <span>{t('moral-damage.medium')}</span>
              <span>{t('moral-damage.high')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" checked={hasEvidence} onChange={e => setHasEvidence(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('moral-damage.evidence')} (+15%)</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" checked={hasWitnesses} onChange={e => setHasWitnesses(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('moral-damage.witnesses')} (+10%)</span>
            </label>
            <label className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" checked={longTermEffect} onChange={e => setLongTermEffect(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('moral-damage.longTerm')} (+25%)</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('moral-damage.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-6 border-2 border-violet-300">
            <div className="text-sm text-gray-600">{t('moral-damage.estimatedAmount')}</div>
            <div className="text-4xl font-bold text-violet-700">{formatNumber(results.estimatedKZT)}</div>
            <div className="text-xs text-gray-500 mt-1">= {results.estimatedMRP} МРП</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <div className="font-medium mb-1">{t('moral-damage.rangeInfo')}</div>
            <div>{t('moral-damage.min')}: {formatNumber(results.rangeMin * MRP_2026)} ({results.rangeMin} МРП)</div>
            <div>{t('moral-damage.avg')}: {formatNumber(results.rangeAvg * MRP_2026)} ({results.rangeAvg} МРП)</div>
            <div>{t('moral-damage.max')}: {formatNumber(results.rangeMax * MRP_2026)} ({results.rangeMax} МРП)</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="text-sm font-medium text-amber-900 mb-2">{t('moral-damage.courtCosts')}</div>
            <div className="text-xs space-y-1 text-amber-800">
              <div>{t('moral-damage.courtFee')}: {formatNumber(results.courtFee)} ({t(`moral-damage.feeRule_${results.feeRule}`)})</div>
              <div>{t('moral-damage.lawyerFee')}: {formatNumber(results.lawyerFeeMin)} — {formatNumber(results.lawyerFeeMax)}</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-900">
                <div className="font-medium mb-1">{t('moral-damage.warning')}</div>
                <div className="text-xs">{t('moral-damage.warningText')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('moral-damage.title'),
            subtitle: t(`moral-damage.categories.${category}`),
            sections: [{ title: t('moral-damage.resultsTitle'), data: [
              { label: t('moral-damage.estimatedAmount'), value: formatNumber(results.estimatedKZT) },
              { label: t('moral-damage.rangeInfo'), value: `${results.rangeMin}-${results.rangeMax} МРП` },
              { label: t('moral-damage.courtFee'), value: formatNumber(results.courtFee) },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="moral-damage"
        />
      </div>

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <MethodologySection calculatorId="moral-damage" />
      <FAQSection items={[
        { question: t('moral-damage.faq.q1'), answer: t('moral-damage.faq.a1') },
        { question: t('moral-damage.faq.q2'), answer: t('moral-damage.faq.a2') },
        { question: t('moral-damage.faq.q3'), answer: t('moral-damage.faq.a3') },
        { question: t('moral-damage.faq.q4'), answer: t('moral-damage.faq.a4') },
        { question: t('moral-damage.faq.q5'), answer: t('moral-damage.faq.a5') },
      ]} 
          sources={getSources('moral-damage')}
        />
      <EmbedWidget calculatorId="moral-damage" calculatorTitle={t('moral-damage.title')} />
      <LastUpdated calculatorId="moral-damage" />
    </div>
  );
}
