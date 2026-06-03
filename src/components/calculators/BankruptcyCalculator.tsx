import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP_2026 = 4325;

// Закон о банкротстве физлиц (введён с 03.03.2023)
// 3 процедуры:
// 1. Внесудебное банкротство — долг до 1600 МРП, нет имущества/доходов, срок просрочки ≥12 мес, через ЦОН бесплатно
// 2. Судебное банкротство — долг от 1600 МРП, через суд
// 3. Восстановление платёжеспособности — реструктуризация долга через суд
// Последствия: 5 лет нельзя брать кредиты, 7 лет запись в КИП

type Procedure = 'extraJudicial' | 'judicial' | 'restructuring' | 'none';

export default function BankruptcyCalculator() {
  const { t } = useTranslation('calculators');
  const [totalDebt, setTotalDebt] = useState<string>('5000000');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('200000');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('150000');
  const [overdueMonths, setOverdueMonths] = useState<string>('12');
  const [hasProperty, setHasProperty] = useState<boolean>(false);
  const [propertyValue, setPropertyValue] = useState<string>('0');

  const results = useMemo(() => {
    const debt = parseFloat(totalDebt) || 0;
    const income = parseFloat(monthlyIncome) || 0;
    const expenses = parseFloat(monthlyExpenses) || 0;
    const overdue = parseFloat(overdueMonths) || 0;
    const propVal = hasProperty ? parseFloat(propertyValue) || 0 : 0;

    const disposableIncome = Math.max(0, income - expenses);
    const debtToIncomeMonths = disposableIncome > 0 ? debt / disposableIncome : Infinity;

    // Определяем подходящую процедуру
    let procedure: Procedure = 'none';
    let reason = '';

    const EXTRA_JUDICIAL_LIMIT = 1600 * MRP_2026; // 6 920 000 ₸

    if (debt > 0 && overdue >= 12 && debt <= EXTRA_JUDICIAL_LIMIT && !hasProperty && disposableIncome < 1 * MRP_2026) {
      procedure = 'extraJudicial';
      reason = t('bankruptcy.reasons.extraJudicial');
    } else if (debt > EXTRA_JUDICIAL_LIMIT && overdue >= 3 && disposableIncome < debt / 60) {
      procedure = 'judicial';
      reason = t('bankruptcy.reasons.judicial');
    } else if (debt > 0 && disposableIncome >= debt / 60 && disposableIncome < debt / 12) {
      procedure = 'restructuring';
      reason = t('bankruptcy.reasons.restructuring');
    } else if (debt > 0 && disposableIncome >= debt / 12) {
      procedure = 'none';
      reason = t('bankruptcy.reasons.none');
    } else {
      procedure = 'judicial';
      reason = t('bankruptcy.reasons.consult');
    }

    // Стоимость процедур (ориентир)
    const costs = {
      extraJudicial: 0, // бесплатно через ЦОН
      judicial: 300000, // юрист + госпошлина + фин. управляющий
      restructuring: 250000,
      none: 0,
    };

    return {
      debtToIncomeMonths: isFinite(debtToIncomeMonths) ? Math.round(debtToIncomeMonths) : null,
      disposableIncome,
      procedure,
      reason,
      cost: costs[procedure],
      debt,
      extraJudicialLimit: EXTRA_JUDICIAL_LIMIT,
      overLimit: debt > EXTRA_JUDICIAL_LIMIT,
    };
  }, [totalDebt, monthlyIncome, monthlyExpenses, overdueMonths, hasProperty, propertyValue, t]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="bankruptcy" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-700 rounded-lg flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('bankruptcy.title')}</h1>
          <p className="text-gray-600">{t('bankruptcy.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('bankruptcy.parameters')}</h2>

          <RangeSlider label={t('bankruptcy.totalDebt')} value={parseFloat(totalDebt) || 0}
            onChange={v => setTotalDebt(String(v))} min={100000} max={100000000} step={100000} formatValue={formatNumber} />
          <RangeSlider label={t('bankruptcy.monthlyIncome')} value={parseFloat(monthlyIncome) || 0}
            onChange={v => setMonthlyIncome(String(v))} min={0} max={2000000} step={10000} formatValue={formatNumber} />
          <RangeSlider label={t('bankruptcy.monthlyExpenses')} value={parseFloat(monthlyExpenses) || 0}
            onChange={v => setMonthlyExpenses(String(v))} min={0} max={2000000} step={10000} formatValue={formatNumber} />
          <RangeSlider label={t('bankruptcy.overdueMonths')} value={parseFloat(overdueMonths) || 0}
            onChange={v => setOverdueMonths(String(v))} min={0} max={60} step={1} formatValue={v => `${v} мес`} />

          <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" checked={hasProperty} onChange={e => setHasProperty(e.target.checked)} className="h-4 w-4" />
            <span className="text-sm font-medium">{t('bankruptcy.hasProperty')}</span>
          </label>

          {hasProperty && (
            <RangeSlider label={t('bankruptcy.propertyValue')} value={parseFloat(propertyValue) || 0}
              onChange={v => setPropertyValue(String(v))} min={0} max={50000000} step={100000} formatValue={formatNumber} />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('bankruptcy.resultsTitle')}</h2>

          <div className={`rounded-lg p-6 border-2 ${
            results.procedure === 'none' ? 'bg-green-50 border-green-300' :
            results.procedure === 'extraJudicial' ? 'bg-blue-50 border-blue-300' :
            'bg-amber-50 border-amber-300'
          }`}>
            <div className="text-sm text-gray-600">{t('bankruptcy.recommendation')}</div>
            <div className={`text-xl font-bold mt-1 ${
              results.procedure === 'none' ? 'text-green-700' :
              results.procedure === 'extraJudicial' ? 'text-blue-700' :
              'text-amber-700'
            }`}>
              {t(`bankruptcy.procedures.${results.procedure}`)}
            </div>
            <div className="text-sm mt-2">{results.reason}</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('bankruptcy.totalDebtLabel')}</span>
              <span className="font-semibold">{formatNumber(results.debt)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('bankruptcy.disposableIncome')}</span>
              <span className="font-semibold">{formatNumber(results.disposableIncome)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('bankruptcy.payoffTime')}</span>
              <span className="font-semibold">
                {results.debtToIncomeMonths !== null ? `~${Math.round(results.debtToIncomeMonths / 12)} ${t('bankruptcy.years')}` : '—'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('bankruptcy.extraJudicialLimit')}</span>
              <span className="font-semibold">{formatNumber(results.extraJudicialLimit)}</span>
            </div>
          </div>

          {results.cost > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-900">{t('bankruptcy.procedureCost')}</div>
              <div className="text-2xl font-bold text-amber-700">~{formatNumber(results.cost)}</div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-900">
                <div className="font-medium mb-1">{t('bankruptcy.consequences')}</div>
                <ul className="text-xs space-y-0.5 list-disc list-inside">
                  <li>{t('bankruptcy.cons1')}</li>
                  <li>{t('bankruptcy.cons2')}</li>
                  <li>{t('bankruptcy.cons3')}</li>
                  <li>{t('bankruptcy.cons4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('bankruptcy.title'),
            sections: [{ title: t('bankruptcy.resultsTitle'), data: [
              { label: t('bankruptcy.recommendation'), value: t(`bankruptcy.procedures.${results.procedure}`) },
              { label: t('bankruptcy.totalDebtLabel'), value: formatNumber(results.debt) },
              { label: t('bankruptcy.procedureCost'), value: results.cost > 0 ? formatNumber(results.cost) : '0' },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="bankruptcy"
        />
      </div>

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="bankruptcy" />
      <MethodologySection steps={getMethodology('bankruptcy')} />
      <FAQSection items={[
        { question: t('bankruptcy.faq.q1'), answer: t('bankruptcy.faq.a1') },
        { question: t('bankruptcy.faq.q2'), answer: t('bankruptcy.faq.a2') },
        { question: t('bankruptcy.faq.q3'), answer: t('bankruptcy.faq.a3') },
        { question: t('bankruptcy.faq.q4'), answer: t('bankruptcy.faq.a4') },
        { question: t('bankruptcy.faq.q5'), answer: t('bankruptcy.faq.a5') },
      ]} 
          sources={getSources('bankruptcy')}
        />
      <EmbedWidget calculatorId="bankruptcy" calculatorTitle={t('bankruptcy.title')} />
      <LastUpdated calculatorId="bankruptcy" />
    </div>
  );
}
