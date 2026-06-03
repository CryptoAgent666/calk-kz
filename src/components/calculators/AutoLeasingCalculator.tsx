import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calculator, TrendingUp, Info, Percent, Building2, User, Shield } from 'lucide-react';
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

interface Preset {
  key: string;
  price: number;
}

type Purpose = 'commercial' | 'individual';

export default function AutoLeasingCalculator() {
  const { t } = useTranslation('calculators');

  const presets: Preset[] = [
    { key: 'auto-leasing.presetBudget', price: 9_500_000 },
    { key: 'auto-leasing.presetMidsize', price: 18_000_000 },
    { key: 'auto-leasing.presetPremium', price: 42_000_000 },
    { key: 'auto-leasing.presetCommercial', price: 14_000_000 },
  ];

  const [carPrice, setCarPrice] = useState<string>('15000000');
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [annualRate, setAnnualRate] = useState<number>(18);
  const [residualPct, setResidualPct] = useState<number>(25);
  const [includeKasko, setIncludeKasko] = useState<boolean>(false);
  const [purpose, setPurpose] = useState<Purpose>('commercial');

  const [results, setResults] = useState({
    downPaymentAmount: 0,
    monthlyPayment: 0,
    residualAmount: 0,
    totalPayments: 0,
    overpayment: 0,
    effectiveRate: 0,
    creditMonthly: 0,
    creditTotal: 0,
    diff: 0,
    leasingBetter: true,
  });

  useEffect(() => {
    const price = parseFloat(carPrice) || 0;
    if (price <= 0 || termMonths <= 0) {
      setResults({
        downPaymentAmount: 0,
        monthlyPayment: 0,
        residualAmount: 0,
        totalPayments: 0,
        overpayment: 0,
        effectiveRate: 0,
        creditMonthly: 0,
        creditTotal: 0,
        diff: 0,
        leasingBetter: true,
      });
      return;
    }

    const effectiveRateAnnual = includeKasko ? annualRate + 4 : annualRate;
    const r = effectiveRateAnnual / 100 / 12;
    const n = termMonths;

    const downPaymentAmount = price * (downPaymentPct / 100);
    const residualAmount = price * (residualPct / 100);

    // Финансируемая сумма (без первоначального взноса)
    const financed = price - downPaymentAmount;
    // Текущая стоимость остаточного платежа (дисконтируем в начало)
    const residualPV = residualAmount / Math.pow(1 + r, n);
    // Тело платежа (без выкупа)
    const principal = financed - residualPV;

    // Аннуитетный платёж
    const monthlyPayment =
      r > 0
        ? (principal * r) / (1 - Math.pow(1 + r, -n))
        : principal / n;

    const totalPayments = downPaymentAmount + monthlyPayment * n + residualAmount;
    const overpayment = totalPayments - price;
    const effectiveRate = (overpayment / price / (termMonths / 12)) * 100;

    // Сравнение с автокредитом: та же ставка, тот же срок, тот же первоначальный взнос, без остаточной
    const creditPrincipal = price - downPaymentAmount;
    const creditMonthly =
      r > 0
        ? (creditPrincipal * r) / (1 - Math.pow(1 + r, -n))
        : creditPrincipal / n;
    const creditTotal = downPaymentAmount + creditMonthly * n;

    const diff = Math.abs(totalPayments - creditTotal);
    const leasingBetter = totalPayments < creditTotal;

    setResults({
      downPaymentAmount: Math.round(downPaymentAmount),
      monthlyPayment: Math.round(monthlyPayment),
      residualAmount: Math.round(residualAmount),
      totalPayments: Math.round(totalPayments),
      overpayment: Math.round(overpayment),
      effectiveRate: Number(effectiveRate.toFixed(2)),
      creditMonthly: Math.round(creditMonthly),
      creditTotal: Math.round(creditTotal),
      diff: Math.round(diff),
      leasingBetter,
    });
  }, [carPrice, downPaymentPct, termMonths, annualRate, residualPct, includeKasko]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => ({
    title: t('auto-leasing.exportTitle'),
    sections: [
      {
        title: t('auto-leasing.parameters'),
        data: [
          { label: t('auto-leasing.carPrice'), value: formatCurrency(parseFloat(carPrice) || 0) },
          {
            label: t('auto-leasing.downPayment'),
            value: `${downPaymentPct}% (${formatCurrency(results.downPaymentAmount)})`,
          },
          { label: t('auto-leasing.term'), value: `${termMonths} ${t('auto-leasing.months')}` },
          { label: t('auto-leasing.rate'), value: `${annualRate}%` },
          {
            label: t('auto-leasing.residualValue'),
            value: `${residualPct}% (${formatCurrency(results.residualAmount)})`,
          },
          { label: t('auto-leasing.includeKasko'), value: includeKasko ? '+' : '-' },
        ],
      },
      {
        title: t('auto-leasing.resultsTitle'),
        data: [
          { label: t('auto-leasing.monthlyPayment'), value: formatCurrency(results.monthlyPayment) },
          { label: t('auto-leasing.totalPayments'), value: formatCurrency(results.totalPayments) },
          { label: t('auto-leasing.overpayment'), value: formatCurrency(results.overpayment) },
          { label: t('auto-leasing.effectiveRate'), value: `${results.effectiveRate}%` },
        ],
      },
      {
        title: t('auto-leasing.comparisonTitle'),
        data: [
          { label: t('auto-leasing.creditMonthly'), value: formatCurrency(results.creditMonthly) },
          { label: t('auto-leasing.creditTotal'), value: formatCurrency(results.creditTotal) },
        ],
      },
    ],
    footer: 'calk.kz',
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('auto-leasing.heading')}</h1>
            <p className="text-gray-600">{t('auto-leasing.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('auto-leasing.warning')}</p>
      </div>

      {/* Two-column layout */}
      <QuickAnswer calculatorId="auto-leasing" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('auto-leasing.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Car price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-1" />
                {t('auto-leasing.carPrice')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={carPrice}
                  onChange={(e) => setCarPrice(e.target.value)}
                  placeholder={t('auto-leasing.carPricePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-3">
                {t('auto-leasing.quickPresets')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setCarPrice(String(p.price))}
                    className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    {t(p.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Down payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auto-leasing.downPayment')}
              </label>
              <RangeSlider
                value={downPaymentPct}
                onChange={setDownPaymentPct}
                min={10}
                max={40}
                step={1}
                formatValue={(v) => `${v}%`}
                color="#6366f1"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(results.downPaymentAmount)}
              </div>
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auto-leasing.term')}
              </label>
              <RangeSlider
                value={termMonths}
                onChange={setTermMonths}
                min={12}
                max={60}
                step={6}
                formatValue={(v) => `${v} ${t('auto-leasing.months')}`}
                color="#6366f1"
              />
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="w-4 h-4 inline mr-1" />
                {t('auto-leasing.rate')}
              </label>
              <RangeSlider
                value={annualRate}
                onChange={setAnnualRate}
                min={15}
                max={22}
                step={0.5}
                formatValue={(v) => `${v}%`}
                color="#6366f1"
              />
            </div>

            {/* Residual value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auto-leasing.residualValue')}
              </label>
              <RangeSlider
                value={residualPct}
                onChange={setResidualPct}
                min={0}
                max={50}
                step={5}
                formatValue={(v) => `${v}%`}
                color="#6366f1"
              />
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(results.residualAmount)}
              </div>
            </div>

            {/* KASKO */}
            <label className="flex items-center space-x-3 cursor-pointer bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={includeKasko}
                onChange={(e) => setIncludeKasko(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700">{t('auto-leasing.includeKasko')}</span>
            </label>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('auto-leasing.purpose')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPurpose('commercial')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    purpose === 'commercial'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-1" />
                  {t('auto-leasing.purposeCommercial')}
                </button>
                <button
                  onClick={() => setPurpose('individual')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    purpose === 'individual'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-1" />
                  {t('auto-leasing.purposeIndividual')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('auto-leasing.resultsTitle')}
          </h2>

          <div className="space-y-4">
            {/* Main result: monthly payment */}
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">
                  {t('auto-leasing.monthlyPayment')}
                </span>
                <span className="text-2xl font-bold text-indigo-700">
                  {formatCurrency(results.monthlyPayment)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {termMonths} {t('auto-leasing.months')} · {annualRate}
                {includeKasko ? '+4' : ''}%
              </div>
            </div>

            {/* Down payment */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('auto-leasing.downPaymentAmount')}</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(results.downPaymentAmount)}
              </span>
            </div>

            {/* Residual */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('auto-leasing.residualAmount')}</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(results.residualAmount)}
              </span>
            </div>

            {/* Total */}
            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-blue-700">{t('auto-leasing.totalPayments')}</span>
              <span className="text-xl font-bold text-blue-800">
                {formatCurrency(results.totalPayments)}
              </span>
            </div>

            {/* Overpayment */}
            <div className="bg-red-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-red-700">{t('auto-leasing.overpayment')}</span>
              <span className="text-xl font-bold text-red-700">
                {formatCurrency(results.overpayment)}
              </span>
            </div>

            {/* Effective rate */}
            <div className="bg-purple-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-purple-700">{t('auto-leasing.effectiveRate')}</span>
              <span className="text-lg font-bold text-purple-800">{results.effectiveRate}%</span>
            </div>

            {/* Comparison block */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                {t('auto-leasing.comparisonTitle')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-600">{t('auto-leasing.creditMonthly')}</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(results.creditMonthly)}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-600">{t('auto-leasing.creditTotal')}</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(results.creditTotal)}
                  </span>
                </div>
                <div
                  className={`rounded-lg p-3 text-sm font-medium ${
                    results.leasingBetter
                      ? 'bg-green-50 text-green-800'
                      : 'bg-orange-50 text-orange-800'
                  }`}
                >
                  {results.leasingBetter
                    ? `${t('auto-leasing.leasingBetter')}: ${formatCurrency(results.diff)}`
                    : `${t('auto-leasing.creditBetter')}: ${formatCurrency(results.diff)}`}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-indigo-900 mb-1">
                    {t('auto-leasing.recommendation')}
                  </div>
                  <div className="text-sm text-indigo-800">
                    {purpose === 'commercial' || results.leasingBetter
                      ? t('auto-leasing.recommendLeasing')
                      : t('auto-leasing.recommendCredit')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('auto-leasing.exportFilename')} />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="auto-leasing" />
      <MethodologySection steps={getMethodology('auto-leasing')} />
      <FAQSection
        items={[
          { question: t('auto-leasing.faq.q1'), answer: t('auto-leasing.faq.a1') },
          { question: t('auto-leasing.faq.q2'), answer: t('auto-leasing.faq.a2') },
          { question: t('auto-leasing.faq.q3'), answer: t('auto-leasing.faq.a3') },
          { question: t('auto-leasing.faq.q4'), answer: t('auto-leasing.faq.a4') },
          { question: t('auto-leasing.faq.q5'), answer: t('auto-leasing.faq.a5') },
        ]}
      
          sources={getSources('auto-leasing')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget calculatorId="auto-leasing" calculatorTitle={t('auto-leasing.heading')} />
      <LastUpdated calculatorId="auto-leasing" />
    </div>
  );
}
