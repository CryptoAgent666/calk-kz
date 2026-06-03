import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Calculator,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Building2,
  Clock,
  Info,
} from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function CashFlowGapCalculator() {
  const { t } = useTranslation('calculators');

  const [monthlyRevenue, setMonthlyRevenue] = useState<string>('15000000');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('12000000');
  const [dso, setDso] = useState<string>('45');
  const [dpo, setDpo] = useState<string>('15');
  const [dio, setDio] = useState<string>('20');
  const [growth, setGrowth] = useState<string>('0');

  const [results, setResults] = useState({
    cashCycle: 0,
    gapSize: 0,
    recommended: 0,
    dailyRevenue: 0,
    dailyExpenses: 0,
    gap10: 0,
    gap20: 0,
    gap50: 0,
  });

  useEffect(() => {
    const revenue = parseFloat(monthlyRevenue) || 0;
    const expenses = parseFloat(monthlyExpenses) || 0;
    const dsoDays = parseFloat(dso) || 0;
    const dpoDays = parseFloat(dpo) || 0;
    const dioDays = parseFloat(dio) || 0;

    if (revenue <= 0) {
      setResults({
        cashCycle: 0,
        gapSize: 0,
        recommended: 0,
        dailyRevenue: 0,
        dailyExpenses: 0,
        gap10: 0,
        gap20: 0,
        gap50: 0,
      });
      return;
    }

    const dailyRevenue = revenue / 30;
    const dailyExpenses = expenses / 30;
    const cashCycle = dsoDays + dioDays - dpoDays;
    const gapSize = Math.max(0, dailyRevenue * cashCycle);
    const recommended = gapSize * 1.25;

    const growthFactor10 = 1.1;
    const growthFactor20 = 1.2;
    const growthFactor50 = 1.5;

    setResults({
      cashCycle: Math.round(cashCycle),
      gapSize: Math.round(gapSize),
      recommended: Math.round(recommended),
      dailyRevenue: Math.round(dailyRevenue),
      dailyExpenses: Math.round(dailyExpenses),
      gap10: Math.round(gapSize * growthFactor10),
      gap20: Math.round(gapSize * growthFactor20),
      gap50: Math.round(gapSize * growthFactor50),
    });
  }, [monthlyRevenue, monthlyExpenses, dso, dpo, dio, growth]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const tips: string[] = [];
  const dsoNum = parseFloat(dso) || 0;
  const dpoNum = parseFloat(dpo) || 0;
  const dioNum = parseFloat(dio) || 0;
  const revenueNum = parseFloat(monthlyRevenue) || 0;
  const expensesNum = parseFloat(monthlyExpenses) || 0;

  if (dsoNum > 30) tips.push(t('cash-flow-gap.tipDsoHigh', { days: dsoNum }));
  if (dpoNum < 15) tips.push(t('cash-flow-gap.tipDpoLow', { days: dpoNum }));
  if (dioNum > 45) tips.push(t('cash-flow-gap.tipDioHigh', { days: dioNum }));
  if (expensesNum > revenueNum && revenueNum > 0) tips.push(t('cash-flow-gap.tipExpensesHigh'));
  if (tips.length === 0 && revenueNum > 0) tips.push(t('cash-flow-gap.tipAllGood'));

  const generateExportData = () => {
    if (results.gapSize === 0 && results.cashCycle === 0) return null;
    return `${t('cash-flow-gap.exportTitle')}
─────────────────────────────
${t('cash-flow-gap.monthlyRevenue')}: ${formatCurrency(revenueNum)}
${t('cash-flow-gap.monthlyExpenses')}: ${formatCurrency(expensesNum)}
DSO: ${dso} ${t('cash-flow-gap.days')}
DPO: ${dpo} ${t('cash-flow-gap.days')}
DIO: ${dio} ${t('cash-flow-gap.days')}

${t('cash-flow-gap.resultsTitle')}:
─────────────────────────────
${t('cash-flow-gap.cashCycle')}: ${results.cashCycle} ${t('cash-flow-gap.days')}
${t('cash-flow-gap.gapSize')}: ${formatCurrency(results.gapSize)}
${t('cash-flow-gap.recommended')}: ${formatCurrency(results.recommended)}
${t('cash-flow-gap.dailyRevenue')}: ${formatCurrency(results.dailyRevenue)}
${t('cash-flow-gap.dailyExpenses')}: ${formatCurrency(results.dailyExpenses)}
─────────────────────────────
calk.kz`;
  };

  const cycleIsPositive = results.cashCycle > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="cash-flow-gap" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('cash-flow-gap.heading')}</h1>
            <p className="text-gray-600">{t('cash-flow-gap.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {t('cash-flow-gap.warning')}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('cash-flow-gap.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Monthly revenue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                {t('cash-flow-gap.monthlyRevenue')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                  step="100000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('cash-flow-gap.tenge')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('cash-flow-gap.monthlyRevenueHint')}</p>
            </div>

            {/* Monthly expenses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cash-flow-gap.monthlyExpenses')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  step="100000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('cash-flow-gap.tenge')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('cash-flow-gap.monthlyExpensesHint')}</p>
            </div>

            {/* DSO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                {t('cash-flow-gap.dso')}
              </label>
              <RangeSlider
                value={parseFloat(dso) || 0}
                onChange={(v) => setDso(String(v))}
                min={0}
                max={120}
                step={1}
                formatValue={(v) => `${v} ${t('cash-flow-gap.days')}`}
                color="#f59e0b"
              />
              <p className="text-xs text-gray-500 mt-2">{t('cash-flow-gap.dsoHint')}</p>
            </div>

            {/* DPO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                {t('cash-flow-gap.dpo')}
              </label>
              <RangeSlider
                value={parseFloat(dpo) || 0}
                onChange={(v) => setDpo(String(v))}
                min={0}
                max={120}
                step={1}
                formatValue={(v) => `${v} ${t('cash-flow-gap.days')}`}
                color="#f59e0b"
              />
              <p className="text-xs text-gray-500 mt-2">{t('cash-flow-gap.dpoHint')}</p>
            </div>

            {/* DIO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                {t('cash-flow-gap.dio')}
              </label>
              <RangeSlider
                value={parseFloat(dio) || 0}
                onChange={(v) => setDio(String(v))}
                min={0}
                max={180}
                step={1}
                formatValue={(v) => `${v} ${t('cash-flow-gap.days')}`}
                color="#f59e0b"
              />
              <p className="text-xs text-gray-500 mt-2">{t('cash-flow-gap.dioHint')}</p>
            </div>

            {/* Growth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {t('cash-flow-gap.growth')}
              </label>
              <RangeSlider
                value={parseFloat(growth) || 0}
                onChange={(v) => setGrowth(String(v))}
                min={0}
                max={50}
                step={1}
                formatValue={(v) => `${v} ${t('cash-flow-gap.percent')}`}
                color="#f59e0b"
              />
              <p className="text-xs text-gray-500 mt-2">{t('cash-flow-gap.growthHint')}</p>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('cash-flow-gap.resultsTitle')}
          </h2>

          <div className="space-y-6">
            {/* Gap size — main */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">
                  {t('cash-flow-gap.gapSize')}
                </span>
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-700">
                    {formatCurrency(results.gapSize)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">{t('cash-flow-gap.gapSizeDesc')}</div>
            </div>

            {/* Cash cycle */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <div className="text-sm text-gray-600">{t('cash-flow-gap.cashCycle')}</div>
                  <div className="text-xs text-gray-500">{t('cash-flow-gap.cashCycleDesc')}</div>
                </div>
                <span
                  className={`text-xl font-bold ${
                    cycleIsPositive ? 'text-orange-700' : 'text-green-700'
                  }`}
                >
                  {results.cashCycle} {t('cash-flow-gap.days')}
                </span>
              </div>
              <div
                className={`text-xs mt-2 ${
                  cycleIsPositive ? 'text-orange-600' : 'text-green-600'
                }`}
              >
                {cycleIsPositive
                  ? t('cash-flow-gap.positiveCycle')
                  : t('cash-flow-gap.negativeCycle')}
              </div>
            </div>

            {/* Recommended capital */}
            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-blue-600">{t('cash-flow-gap.recommended')}</div>
                <div className="text-xs text-blue-500">{t('cash-flow-gap.recommendedDesc')}</div>
              </div>
              <span className="text-xl font-bold text-blue-700">
                {formatCurrency(results.recommended)}
              </span>
            </div>

            {/* Daily revenue + expenses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-600">{t('cash-flow-gap.dailyRevenue')}</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(results.dailyRevenue)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-600">{t('cash-flow-gap.dailyExpenses')}</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(results.dailyExpenses)}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('cash-flow-gap.cashCycleDesc')} = {dso} + {dio} − {dpo} = {results.cashCycle}{' '}
              {t('cash-flow-gap.days')}
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <Lightbulb className="w-5 h-5 inline mr-2 text-amber-500" />
            {t('cash-flow-gap.tipsTitle')}
          </h2>
          <ul className="space-y-3">
            {tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start bg-amber-50 border border-amber-100 rounded-lg p-3"
              >
                <span className="text-amber-600 mr-2 mt-0.5">•</span>
                <span className="text-sm text-gray-800">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forecast */}
      {results.gapSize > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            <TrendingUp className="w-5 h-5 inline mr-2 text-orange-500" />
            {t('cash-flow-gap.forecastTitle')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">{t('cash-flow-gap.forecastDesc')}</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <div className="text-sm text-amber-700">{t('cash-flow-gap.growth10')}</div>
              <div className="text-lg font-bold text-orange-700 mt-1">
                {formatCurrency(results.gap10)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <div className="text-sm text-amber-700">{t('cash-flow-gap.growth20')}</div>
              <div className="text-lg font-bold text-orange-700 mt-1">
                {formatCurrency(results.gap20)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <div className="text-sm text-amber-700">{t('cash-flow-gap.growth50')}</div>
              <div className="text-lg font-bold text-orange-700 mt-1">
                {formatCurrency(results.gap50)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternatives */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('cash-flow-gap.alternativesTitle')}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">
              {t('cash-flow-gap.altOverdraft')}
            </div>
            <div className="text-sm text-gray-600">{t('cash-flow-gap.altOverdraftDesc')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">
              {t('cash-flow-gap.altFactoring')}
            </div>
            <div className="text-sm text-gray-600">{t('cash-flow-gap.altFactoringDesc')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">
              {t('cash-flow-gap.altTaxDelay')}
            </div>
            <div className="text-sm text-gray-600">{t('cash-flow-gap.altTaxDelayDesc')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-1">
              {t('cash-flow-gap.altSupplier')}
            </div>
            <div className="text-sm text-gray-600">{t('cash-flow-gap.altSupplierDesc')}</div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename={t('cash-flow-gap.exportFilename')}
        />
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('cash-flow-gap.faq.q1'), answer: t('cash-flow-gap.faq.a1') },
          { question: t('cash-flow-gap.faq.q2'), answer: t('cash-flow-gap.faq.a2') },
          { question: t('cash-flow-gap.faq.q3'), answer: t('cash-flow-gap.faq.a3') },
          { question: t('cash-flow-gap.faq.q4'), answer: t('cash-flow-gap.faq.a4') },
          { question: t('cash-flow-gap.faq.q5'), answer: t('cash-flow-gap.faq.a5') },
        ]}
      
          sources={getSources('cash-flow-gap')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget />
      <LastUpdated calculatorId="cash-flow-gap" />
    </div>
  );
}
