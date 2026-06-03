import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Target } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { LastUpdated } from '../ui/LastUpdated';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { QuickAnswer } from '../ui/QuickAnswer';
import { pluralize } from '../../utils/pluralize';

type FIREType = 'lean' | 'regular' | 'fat';
const WITHDRAWAL_RATE: Record<FIREType, number> = {
  lean: 0.04,     // Lean FIRE — 4% (стандарт)
  regular: 0.04,  // Regular FIRE — 4%
  fat: 0.035,     // Fat FIRE — 3.5% (консервативнее)
};

export default function FIRECalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [currentAge, setCurrentAge] = useState<string>('30');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('300000');
  const [currentSavings, setCurrentSavings] = useState<string>('2000000');
  const [monthlySaving, setMonthlySaving] = useState<string>('150000');
  const [annualReturn, setAnnualReturn] = useState<string>('8');
  const [fireType, setFireType] = useState<FIREType>('regular');

  const results = useMemo(() => {
    const age = parseFloat(currentAge) || 0;
    const expenses = parseFloat(monthlyExpenses) || 0;
    const savings = parseFloat(currentSavings) || 0;
    const save = parseFloat(monthlySaving) || 0;
    const ret = (parseFloat(annualReturn) || 0) / 100;
    if (expenses <= 0 || age <= 0) return null;

    // FIRE число = 25× годовые расходы (правило 4%) или 28.57× (3.5%)
    const wr = WITHDRAWAL_RATE[fireType];
    const fireNumber = (expenses * 12) / wr;

    // Симуляция: сколько лет до FIRE с учётом сложного процента
    const monthlyReturn = ret / 12;
    let balance = savings;
    let months = 0;
    const maxMonths = 12 * 80; // максимум 80 лет
    while (balance < fireNumber && months < maxMonths) {
      balance = balance * (1 + monthlyReturn) + save;
      months++;
    }

    const years = months / 12;
    const ageAtFIRE = age + years;
    const achieved = balance >= fireNumber;

    // Сколько уже накоплено по отношению к цели
    const progress = Math.min(100, (savings / fireNumber) * 100);

    // Альтернативные сценарии (больше/меньше сбережений)
    const scenarios = [0.5, 0.75, 1, 1.25, 1.5].map(mult => {
      let b = savings;
      let m = 0;
      const s = save * mult;
      while (b < fireNumber && m < maxMonths) {
        b = b * (1 + monthlyReturn) + s;
        m++;
      }
      return {
        monthlySaving: Math.round(save * mult),
        years: (m / 12).toFixed(1),
        ageAtFIRE: (age + m / 12).toFixed(1),
      };
    });

    return {
      fireNumber: Math.round(fireNumber),
      years: years.toFixed(1),
      ageAtFIRE: ageAtFIRE.toFixed(0),
      balance: Math.round(balance),
      achieved,
      progress: progress.toFixed(1),
      scenarios,
      withdrawalMonthly: Math.round(fireNumber * wr / 12),
    };
  }, [currentAge, monthlyExpenses, currentSavings, monthlySaving, annualReturn, fireType]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="fire" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('fire.title')}</h1>
          <p className="text-gray-600">{t('fire.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('fire.parameters')}</h2>

          <RangeSlider label={t('fire.currentAge')} value={parseFloat(currentAge) || 0}
            onChange={v => setCurrentAge(String(v))} min={18} max={70} step={1} formatValue={v => `${v} ${pluralize(i18n.language, v, 'год', 'года', 'лет')}`} />
          <RangeSlider label={t('fire.monthlyExpenses')} value={parseFloat(monthlyExpenses) || 0}
            onChange={v => setMonthlyExpenses(String(v))} min={50000} max={3000000} step={10000} formatValue={formatNumber} />
          <RangeSlider label={t('fire.currentSavings')} value={parseFloat(currentSavings) || 0}
            onChange={v => setCurrentSavings(String(v))} min={0} max={500000000} step={100000} formatValue={formatNumber} />
          <RangeSlider label={t('fire.monthlySaving')} value={parseFloat(monthlySaving) || 0}
            onChange={v => setMonthlySaving(String(v))} min={0} max={2000000} step={10000} formatValue={formatNumber} />
          <RangeSlider label={t('fire.annualReturn')} value={parseFloat(annualReturn) || 0}
            onChange={v => setAnnualReturn(String(v))} min={1} max={20} step={0.5} formatValue={v => `${v}%`} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fire.type')}</label>
            <div className="space-y-2">
              {(['lean', 'regular', 'fat'] as FIREType[]).map(f => (
                <button key={f} onClick={() => setFireType(f)}
                  className={`w-full p-3 rounded-lg border text-left ${fireType === f ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}>
                  <div className="text-sm font-medium">{t(`fire.types.${f}`)}</div>
                  <div className="text-xs text-gray-500">{t(`fire.typesHint.${f}`)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('fire.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
                <div className="text-sm text-gray-600">{t('fire.fireNumber')}</div>
                <div className="text-3xl font-bold text-red-700">{formatNumber(results.fireNumber)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  = {monthlyExpenses} ₸/мес × 12 × {fireType === 'fat' ? '28.6' : '25'}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-orange-700" />
                  <span className="text-sm text-orange-900 font-medium">{t('fire.timeToFire')}</span>
                </div>
                <div className="text-3xl font-bold text-orange-700">{results.years} {pluralize(i18n.language, parseFloat(results.years), 'год', 'года', 'лет')}</div>
                <div className="text-sm text-orange-800">{t('fire.atAge')}: {results.ageAtFIRE} {pluralize(i18n.language, results.ageAtFIRE, 'год', 'года', 'лет')}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2 text-sm">
                  <span>{t('fire.progress')}</span>
                  <span className="font-semibold">{results.progress}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${results.progress}%` }} />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="font-medium text-blue-900 mb-1">{t('fire.whenAchieved')}</div>
                <div className="text-blue-800">{t('fire.monthlyFromCapital')}: <strong>{formatNumber(results.withdrawalMonthly)}</strong></div>
                <div className="text-xs text-blue-700 mt-1">{t('fire.withdrawalNote')}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">{t('fire.scenarios')}</div>
                <div className="space-y-1 text-xs">
                  {results.scenarios.map((s, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-2 flex justify-between">
                      <span>{t('fire.saving')}: {formatNumber(s.monthlySaving)}</span>
                      <span className="font-semibold">{s.years} {pluralize(i18n.language, parseFloat(s.years), 'год', 'года', 'лет')} ({s.ageAtFIRE} {pluralize(i18n.language, s.ageAtFIRE, 'год', 'года', 'лет')})</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('fire.title'),
              subtitle: t(`fire.types.${fireType}`),
              sections: [{ title: t('fire.resultsTitle'), data: [
                { label: t('fire.fireNumber'), value: formatNumber(results.fireNumber) },
                { label: t('fire.timeToFire'), value: `${results.years} ${pluralize(i18n.language, parseFloat(results.years), 'год', 'года', 'лет')}` },
                { label: t('fire.atAge'), value: `${results.ageAtFIRE} лет` },
                { label: t('fire.monthlyFromCapital'), value: formatNumber(results.withdrawalMonthly) },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="fire"
          />
        </div>
      )}

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="fire" />
      <MethodologySection steps={getMethodology('fire')} />
      <FAQSection items={[
        { question: t('fire.faq.q1'), answer: t('fire.faq.a1') },
        { question: t('fire.faq.q2'), answer: t('fire.faq.a2') },
        { question: t('fire.faq.q3'), answer: t('fire.faq.a3') },
        { question: t('fire.faq.q4'), answer: t('fire.faq.a4') },
        { question: t('fire.faq.q5'), answer: t('fire.faq.a5') },
      ]} />
      <EmbedWidget calculatorId="fire" calculatorTitle={t('fire.title')} />
      <LastUpdated calculatorId="fire" />
    </div>
  );
}
