import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Calculator,
  Target,
  Info,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

type TaxRate = 0 | 4 | 10;

interface Results {
  contributionMargin: number;
  marginPercent: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  safetyMargin: number;
  monthlyProfit: number;
  expectedRevenue: number;
  valid: boolean;
}

export default function BreakEvenCalculator() {
  const { t } = useTranslation('calculators');

  const [price, setPrice] = useState<string>('10000');
  const [variableCost, setVariableCost] = useState<string>('6000');
  const [fixedCost, setFixedCost] = useState<string>('500000');
  const [expectedVolume, setExpectedVolume] = useState<string>('200');
  const [taxRate, setTaxRate] = useState<TaxRate>(0);

  const [results, setResults] = useState<Results>({
    contributionMargin: 0,
    marginPercent: 0,
    breakEvenUnits: 0,
    breakEvenRevenue: 0,
    safetyMargin: 0,
    monthlyProfit: 0,
    expectedRevenue: 0,
    valid: false,
  });

  useEffect(() => {
    const p = parseFloat(price) || 0;
    const vc = parseFloat(variableCost) || 0;
    const fc = parseFloat(fixedCost) || 0;
    const vol = parseFloat(expectedVolume) || 0;
    const taxCoef = taxRate / 100;

    // Учитываем налог как уменьшение эффективной цены
    const effectivePrice = p * (1 - taxCoef);
    const contributionMargin = effectivePrice - vc;
    const marginPercent = effectivePrice > 0 ? (contributionMargin / effectivePrice) * 100 : 0;

    if (contributionMargin <= 0 || p <= 0) {
      setResults({
        contributionMargin: Math.round(contributionMargin),
        marginPercent: Number(marginPercent.toFixed(2)),
        breakEvenUnits: 0,
        breakEvenRevenue: 0,
        safetyMargin: 0,
        monthlyProfit: 0,
        expectedRevenue: 0,
        valid: false,
      });
      return;
    }

    const breakEvenUnits = Math.ceil(fc / contributionMargin);
    const breakEvenRevenue = breakEvenUnits * p;
    const expectedRevenue = vol * p;
    const safetyMargin =
      expectedRevenue > 0 ? ((expectedRevenue - breakEvenRevenue) / expectedRevenue) * 100 : 0;
    const monthlyProfit = vol * contributionMargin - fc;

    setResults({
      contributionMargin: Math.round(contributionMargin),
      marginPercent: Number(marginPercent.toFixed(2)),
      breakEvenUnits,
      breakEvenRevenue: Math.round(breakEvenRevenue),
      safetyMargin: Number(safetyMargin.toFixed(1)),
      monthlyProfit: Math.round(monthlyProfit),
      expectedRevenue: Math.round(expectedRevenue),
      valid: true,
    });
  }, [price, variableCost, fixedCost, expectedVolume, taxRate]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const getRecommendation = () => {
    if (!results.valid) {
      return { kind: 'danger', text: t('break-even.invalidMargin') };
    }
    if (results.monthlyProfit < 0) {
      return { kind: 'danger', text: t('break-even.lossText') };
    }
    if (results.safetyMargin >= 30) {
      return { kind: 'safe', text: t('break-even.safeText') };
    }
    if (results.safetyMargin >= 10) {
      return { kind: 'normal', text: t('break-even.normalText') };
    }
    return { kind: 'risky', text: t('break-even.riskyText') };
  };

  const rec = getRecommendation();

  const numberInput = (
    value: string,
    setValue: (v: string) => void,
    min: number,
    max: number,
    step: number,
    suffix: string,
    formatSlider: (v: number) => string,
  ) => (
    <>
      <RangeSlider
        value={parseFloat(value) || 0}
        onChange={(val) => setValue(String(val))}
        min={min}
        max={max}
        step={step}
        formatValue={formatSlider}
        color="#0ea5e9"
      />
      <div className="relative mt-3">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">{suffix}</span>
        </div>
      </div>
    </>
  );

  const generateExportData = () => {
    if (!results.valid) return null;

    return `${t('break-even.exportTitle')}
─────────────────────────────
${t('break-even.pricePerUnit')}: ${formatCurrency(parseFloat(price) || 0)}
${t('break-even.variableCost')}: ${formatCurrency(parseFloat(variableCost) || 0)}
${t('break-even.fixedCost')}: ${formatCurrency(parseFloat(fixedCost) || 0)}
${t('break-even.expectedVolume')}: ${expectedVolume} ${t('break-even.unit')}
${t('break-even.taxRate')}: ${taxRate}%

${t('break-even.resultsTitle')}:
─────────────────────────────
${t('break-even.contributionMargin')}: ${formatCurrency(results.contributionMargin)}
${t('break-even.marginPercent')}: ${results.marginPercent}%
${t('break-even.breakEvenUnits')}: ${results.breakEvenUnits} ${t('break-even.unit')}
${t('break-even.breakEvenRevenue')}: ${formatCurrency(results.breakEvenRevenue)}
${t('break-even.safetyMargin')}: ${results.safetyMargin}%
${t('break-even.monthlyProfit')}: ${formatCurrency(results.monthlyProfit)}
─────────────────────────────
calk.kz`;
  };

  // Данные для упрощённой "схемы" графика
  const chartMaxVolume = Math.max(results.breakEvenUnits * 2, parseFloat(expectedVolume) || 0);
  const bePosition =
    chartMaxVolume > 0 ? Math.min((results.breakEvenUnits / chartMaxVolume) * 100, 95) : 50;
  const expectedPosition =
    chartMaxVolume > 0
      ? Math.min(((parseFloat(expectedVolume) || 0) / chartMaxVolume) * 100, 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('break-even.heading')}</h1>
            <p className="text-gray-600">{t('break-even.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('break-even.warning')}</p>
      </div>

      {/* Two-column layout */}
      <QuickAnswer calculatorId="break-even" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('break-even.parameters')}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Wallet className="w-4 h-4 inline mr-1" />
                {t('break-even.pricePerUnit')}
              </label>
              {numberInput(price, setPrice, 100, 200000, 100, '₸', (v) => `${v.toLocaleString('ru-KZ')} ₸`)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('break-even.variableCost')}
              </label>
              {numberInput(variableCost, setVariableCost, 0, 150000, 100, '₸', (v) => `${v.toLocaleString('ru-KZ')} ₸`)}
              <p className="text-xs text-gray-500 mt-1">{t('break-even.variableCostHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('break-even.fixedCost')}
              </label>
              {numberInput(fixedCost, setFixedCost, 0, 10000000, 10000, `₸${t('break-even.perMonth')}`, (v) => `${v.toLocaleString('ru-KZ')} ₸`)}
              <p className="text-xs text-gray-500 mt-1">{t('break-even.fixedCostHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('break-even.expectedVolume')}
              </label>
              {numberInput(
                expectedVolume,
                setExpectedVolume,
                0,
                5000,
                10,
                `${t('break-even.unit')}${t('break-even.perMonth')}`,
                (v) => `${v} ${t('break-even.unit')}`,
              )}
            </div>

            {/* Tax rate selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('break-even.taxRate')}
              </label>
              <div className="flex flex-wrap gap-2">
                {([0, 4, 10] as TaxRate[]).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setTaxRate(rate)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      taxRate === rate
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {rate === 0
                      ? t('break-even.taxNone')
                      : rate === 4
                      ? t('break-even.taxSimplified')
                      : t('break-even.taxGeneral')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Target className="w-5 h-5 inline mr-2" />
            {t('break-even.resultsTitle')}
          </h2>

          <div className="space-y-4">
            {/* Main result: break-even units */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('break-even.breakEvenUnits')}</span>
                <div className="flex items-center space-x-2">
                  <Target className="w-6 h-6 text-sky-600" />
                  <span className="text-2xl font-bold text-sky-700">
                    {results.valid ? results.breakEvenUnits.toLocaleString('ru-KZ') : '—'} {t('break-even.unit')}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('break-even.breakEvenRevenue')}:{' '}
                <span className="font-semibold">{results.valid ? formatCurrency(results.breakEvenRevenue) : '—'}</span>
              </div>
            </div>

            {/* Contribution margin */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('break-even.contributionMargin')}</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(results.contributionMargin)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{t('break-even.marginPercent')}</div>
                <div className="text-lg font-bold text-gray-900">{results.marginPercent}%</div>
              </div>
            </div>

            {/* Safety margin */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-indigo-600">{t('break-even.safetyMargin')}</div>
                  <div className="text-xs text-indigo-500">{formatCurrency(results.expectedRevenue)}</div>
                </div>
                <span className={`text-xl font-bold ${
                  results.safetyMargin >= 30 ? 'text-emerald-700' : results.safetyMargin >= 10 ? 'text-sky-700' : 'text-rose-700'
                }`}>
                  {results.valid ? `${results.safetyMargin}%` : '—'}
                </span>
              </div>
            </div>

            {/* Monthly profit */}
            <div
              className={`rounded-lg p-4 flex justify-between items-center ${
                results.monthlyProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
              }`}
            >
              <div className={`text-sm ${results.monthlyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t('break-even.monthlyProfit')}
              </div>
              <span className={`text-xl font-bold ${results.monthlyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {results.valid ? formatCurrency(results.monthlyProfit) : '—'}
              </span>
            </div>

            {/* Visual chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('break-even.chartTitle')}
              </div>
              <div className="relative h-24 bg-white rounded border border-gray-200 overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 h-full bg-gradient-to-r from-sky-100 to-sky-200 opacity-60"
                  style={{ width: `${expectedPosition}%` }}
                />
                {results.valid && (
                  <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-rose-500" style={{ left: `${bePosition}%` }}>
                    <span className="absolute -top-1 left-1 text-[10px] font-semibold text-rose-600 whitespace-nowrap bg-white px-1 rounded">
                      {t('break-even.breakEvenPoint')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0 {t('break-even.unit')}</span>
                <span>{Math.round(chartMaxVolume).toLocaleString('ru-KZ')} {t('break-even.unit')}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <span className="flex items-center"><span className="w-3 h-3 bg-sky-200 rounded mr-1" />{t('break-even.revenueLine')}</span>
                <span className="flex items-center"><span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 mr-1" />{t('break-even.breakEvenPoint')}</span>
              </div>
            </div>

            {/* Recommendation */}
            <div
              className={`rounded-lg p-4 border ${
                rec.kind === 'safe' ? 'bg-emerald-50 border-emerald-200'
                : rec.kind === 'normal' ? 'bg-sky-50 border-sky-200'
                : rec.kind === 'risky' ? 'bg-amber-50 border-amber-200'
                : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex items-start">
                {rec.kind === 'safe' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                    rec.kind === 'normal' ? 'text-sky-600' : rec.kind === 'risky' ? 'text-amber-600' : 'text-rose-600'
                  }`} />
                )}
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{t('break-even.recommendation')}</div>
                  <div className="text-sm text-gray-700">{rec.text}</div>
                </div>
              </div>
            </div>

            {/* Info block */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('break-even.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename={t('break-even.exportFilename')}
        />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="break-even" />
      <MethodologySection steps={getMethodology('break-even')} />
      <FAQSection
        items={[
          { question: t('break-even.faq.q1'), answer: t('break-even.faq.a1') },
          { question: t('break-even.faq.q2'), answer: t('break-even.faq.a2') },
          { question: t('break-even.faq.q3'), answer: t('break-even.faq.a3') },
          { question: t('break-even.faq.q4'), answer: t('break-even.faq.a4') },
          { question: t('break-even.faq.q5'), answer: t('break-even.faq.a5') },
        ]}
      
          sources={getSources('break-even')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget />
      <LastUpdated calculatorId="break-even" />
    </div>
  );
}
