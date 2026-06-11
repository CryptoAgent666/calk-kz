import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Calculator, TrendingUp, Info, Percent, Wallet, Coins } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

type ActivityType = 'standard' | 'agricultural' | 'social';

interface ActivityOption {
  id: ActivityType;
  labelKey: string;
  rate: number;
}

export default function CorporateIncomeTaxCalculator() {
  const { t } = useTranslation('calculators');

  const activities: ActivityOption[] = [
    { id: 'standard', labelKey: 'corporate-income-tax.activityStandard', rate: 20 },
    // С 01.01.2026 (новый НК РК): льготная ставка КПН для сельхозтоваропроизводителей снижена с 10% до 3%.
    { id: 'agricultural', labelKey: 'corporate-income-tax.activityAgricultural', rate: 3 },
    // С 01.01.2026 освобождение (0%) для организаций социальной сферы (образование, здравоохранение, фин. лизинг) отменено: 5% в 2026, 10% с 2027.
    { id: 'social', labelKey: 'corporate-income-tax.activitySocial', rate: 5 },
  ];

  const WITHHOLDING_RATE = 15;

  const [activity, setActivity] = useState<ActivityType>('standard');
  const [grossIncome, setGrossIncome] = useState<string>('50000000');
  const [deductions, setDeductions] = useState<string>('30000000');
  const [pastLosses, setPastLosses] = useState<string>('0');
  const [hasDividends, setHasDividends] = useState<boolean>(false);
  const [dividends, setDividends] = useState<string>('0');
  const [royalties, setRoyalties] = useState<string>('0');

  const [results, setResults] = useState({
    taxableIncome: 0,
    mainTax: 0,
    withholdingTax: 0,
    totalTax: 0,
    effectiveRate: 0,
    monthlyAdvance: 0,
    netProfit: 0,
    rate: 20,
  });

  useEffect(() => {
    const income = parseFloat(grossIncome) || 0;
    const deduct = parseFloat(deductions) || 0;
    const losses = parseFloat(pastLosses) || 0;
    const divs = hasDividends ? (parseFloat(dividends) || 0) : 0;
    const roy = parseFloat(royalties) || 0;

    const activityOption = activities.find((a) => a.id === activity) || activities[0];
    const rate = activityOption.rate;

    const taxableIncome = Math.max(0, income - deduct - losses);
    const mainTax = Math.round((taxableIncome * rate) / 100);
    const withholdingTax = Math.round(((divs + roy) * WITHHOLDING_RATE) / 100);
    const totalTax = mainTax + withholdingTax;
    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;
    const monthlyAdvance = Math.round(mainTax / 12);
    const netProfit = taxableIncome - mainTax;

    setResults({
      taxableIncome: Math.round(taxableIncome),
      mainTax,
      withholdingTax,
      totalTax,
      effectiveRate: Number(effectiveRate.toFixed(2)),
      monthlyAdvance,
      netProfit: Math.round(netProfit),
      rate,
    });
  }, [grossIncome, deductions, pastLosses, activity, hasDividends, dividends, royalties]);

  const formatCurrency = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (results.totalTax === 0 && results.taxableIncome === 0) return null;

    const activityOption = activities.find((a) => a.id === activity);

    return `${t('corporate-income-tax.exportTitle')}
─────────────────────────────
${t('corporate-income-tax.activityType')}: ${activityOption ? t(activityOption.labelKey) : ''}
${t('corporate-income-tax.grossIncome')}: ${formatCurrency(parseFloat(grossIncome) || 0)}
${t('corporate-income-tax.deductions')}: ${formatCurrency(parseFloat(deductions) || 0)}
${t('corporate-income-tax.pastLosses')}: ${formatCurrency(parseFloat(pastLosses) || 0)}
${t('corporate-income-tax.dividends')}: ${formatCurrency(hasDividends ? (parseFloat(dividends) || 0) : 0)}
${t('corporate-income-tax.royalties')}: ${formatCurrency(parseFloat(royalties) || 0)}

${t('corporate-income-tax.resultsTitle')}
─────────────────────────────
${t('corporate-income-tax.taxableIncome')}: ${formatCurrency(results.taxableIncome)}
${t('corporate-income-tax.mainTax')} (${results.rate}%): ${formatCurrency(results.mainTax)}
${t('corporate-income-tax.withholdingTax')} (${WITHHOLDING_RATE}%): ${formatCurrency(results.withholdingTax)}
${t('corporate-income-tax.totalTax')}: ${formatCurrency(results.totalTax)}
${t('corporate-income-tax.effectiveRate')}: ${results.effectiveRate}%
${t('corporate-income-tax.monthlyAdvance')}: ${formatCurrency(results.monthlyAdvance)}
${t('corporate-income-tax.netProfit')}: ${formatCurrency(results.netProfit)}
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="corporate-income-tax" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('corporate-income-tax.heading')}</h1>
            <p className="text-gray-600">{t('corporate-income-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {t('corporate-income-tax.warning')}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('corporate-income-tax.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Activity type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Building2 className="w-4 h-4 inline mr-1" />
                {t('corporate-income-tax.activityType')}
              </label>
              <div className="flex flex-wrap gap-2">
                {activities.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setActivity(opt.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      activity === opt.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(opt.labelKey)} — {opt.rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* Gross income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Wallet className="w-4 h-4 inline mr-1" />
                {t('corporate-income-tax.grossIncome')}
              </label>
              <RangeSlider
                value={parseFloat(grossIncome) || 0}
                onChange={(val) => setGrossIncome(String(val))}
                min={0}
                max={500000000}
                step={500000}
                formatValue={(v) => formatCurrency(v)}
                color="#6366f1"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                  placeholder={t('corporate-income-tax.enterGrossIncome')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Coins className="w-4 h-4 inline mr-1" />
                {t('corporate-income-tax.deductions')}
              </label>
              <RangeSlider
                value={parseFloat(deductions) || 0}
                onChange={(val) => setDeductions(String(val))}
                min={0}
                max={500000000}
                step={500000}
                formatValue={(v) => formatCurrency(v)}
                color="#6366f1"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder={t('corporate-income-tax.enterDeductions')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Past losses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {t('corporate-income-tax.pastLosses')}
              </label>
              <RangeSlider
                value={parseFloat(pastLosses) || 0}
                onChange={(val) => setPastLosses(String(val))}
                min={0}
                max={100000000}
                step={100000}
                formatValue={(v) => formatCurrency(v)}
                color="#6366f1"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={pastLosses}
                  onChange={(e) => setPastLosses(e.target.value)}
                  placeholder={t('corporate-income-tax.enterPastLosses')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Dividends to non-residents */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDividends}
                  onChange={(e) => setHasDividends(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-indigo-900">
                  {t('corporate-income-tax.hasDividends')}
                </span>
              </label>
              {hasDividends && (
                <div className="relative">
                  <input
                    type="number"
                    value={dividends}
                    onChange={(e) => setDividends(e.target.value)}
                    placeholder={t('corporate-income-tax.enterDividends')}
                    className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              )}
            </div>

            {/* Royalties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('corporate-income-tax.royalties')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={royalties}
                  onChange={(e) => setRoyalties(e.target.value)}
                  placeholder={t('corporate-income-tax.enterRoyalties')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('corporate-income-tax.royaltiesHint')}</p>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('corporate-income-tax.resultsTitle')}
          </h2>

          <div className="space-y-6">
            {/* Total tax — main result */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('corporate-income-tax.totalTax')}</span>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-700">{formatCurrency(results.totalTax)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('corporate-income-tax.effectiveRate')}: {results.effectiveRate}%
              </div>
            </div>

            {/* Taxable income */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('corporate-income-tax.taxableIncome')}</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(results.taxableIncome)}</div>
              </div>
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>

            {/* Main tax */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">
                  {t('corporate-income-tax.mainTax')} ({results.rate}%)
                </div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(results.mainTax)}</div>
              </div>
              <Percent className="w-8 h-8 text-gray-400" />
            </div>

            {/* Withholding tax */}
            {results.withholdingTax > 0 && (
              <div className="bg-amber-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-amber-700">
                    {t('corporate-income-tax.withholdingTax')} ({WITHHOLDING_RATE}%)
                  </div>
                  <div className="text-lg font-bold text-amber-900">{formatCurrency(results.withholdingTax)}</div>
                </div>
                <Percent className="w-8 h-8 text-amber-400" />
              </div>
            )}

            {/* Monthly advance */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-blue-600">{t('corporate-income-tax.monthlyAdvance')}</div>
                  <div className="text-xs text-blue-500">{t('corporate-income-tax.monthlyAdvanceHint')}</div>
                </div>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(results.monthlyAdvance)}</span>
              </div>
            </div>

            {/* Net profit */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-green-600">{t('corporate-income-tax.netProfit')}</div>
                  <div className="text-xs text-green-500">{t('corporate-income-tax.netProfitHint')}</div>
                </div>
                <span className="text-xl font-bold text-green-700">{formatCurrency(results.netProfit)}</span>
              </div>
            </div>

            {/* Info block */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('corporate-income-tax.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename={t('corporate-income-tax.exportFilename')}
        />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="corporate-income-tax" />
      <MethodologySection steps={getMethodology('corporate-income-tax')} />
      <FAQSection
        items={[
          { question: t('corporate-income-tax.faq.q1'), answer: t('corporate-income-tax.faq.a1') },
          { question: t('corporate-income-tax.faq.q2'), answer: t('corporate-income-tax.faq.a2') },
          { question: t('corporate-income-tax.faq.q3'), answer: t('corporate-income-tax.faq.a3') },
          { question: t('corporate-income-tax.faq.q4'), answer: t('corporate-income-tax.faq.a4') },
          { question: t('corporate-income-tax.faq.q5'), answer: t('corporate-income-tax.faq.a5') }
        ]}
      
          sources={getSources('corporate-income-tax')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget />
      <LastUpdated calculatorId="corporate-income-tax" />
    </div>
  );
}
