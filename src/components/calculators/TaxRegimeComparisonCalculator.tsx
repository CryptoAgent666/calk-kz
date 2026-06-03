import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Calculator, TrendingUp, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ComparisonBarChart } from '../ui/ChartComponents';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP = 4_325;
const MZP = 85_000;

// Единый платёж (упрощёнка) — 4% от дохода (с 2026); базовая ставка 4% (2% ИПН + 2% СН), акимат вправе снизить до 2%
// ОУР — ИПН 10%/15% от прибыли; все соцплатежи отдельно
// ЕСП — фикс 1 МРП/мес (город) или 0.5 МРП/мес (село)
// Розничный налог — 4% от дохода (отдельные виды розницы)

interface RegimeResult {
  regimeKey: string;
  tax: number;
  socialPayments: number;
  total: number;
  effectiveRate: number;
  available: boolean;
  limitNote?: string;
}

export default function TaxRegimeComparisonCalculator() {
  const { t } = useTranslation('calculators');

  const [monthlyRevenue, setMonthlyRevenue] = useState<string>('1000000');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('400000');
  const [hasEmployees, setHasEmployees] = useState(false);
  const [isRural, setIsRural] = useState(false);

  const results = useMemo((): RegimeResult[] => {
    const revenue = parseFloat(monthlyRevenue) || 0;
    const expenses = parseFloat(monthlyExpenses) || 0;
    const profit = Math.max(0, revenue - expenses);

    if (revenue <= 0) return [];

    const annualRevenue = revenue * 12;
    const semiAnnualRevenue = revenue * 6;

    // ИП — социальные платежи за себя (минимальная база)
    const selfOPV = Math.round(MZP * 0.10);       // 8 500
    const selfVOSMS = Math.round(MZP * 0.02);     // 1 700
    const selfSO = Math.round(MZP * 0.05);        // 4 250
    const selfOOSMS = Math.round(MZP * 0.03);     // 2 550
    const baseSocialMonthly = selfOPV + selfVOSMS + selfSO + selfOOSMS; // 17 000

    // 1. Упрощёнка (СНР на основе упрощённой декларации)
    const simplifiedLimit = 300_000 * MRP; // 600 000 МРП/год → 300 000 МРП/полугодие = ~1.298 млрд ₸ (НК РК 2026)
    const simplifiedAvailable = semiAnnualRevenue <= simplifiedLimit;
    const simplifiedTax = Math.round(revenue * 0.04); // 4% от дохода (с 01.01.2026: 2% ИПН + 2% СН)
    const simplifiedSocial = baseSocialMonthly;
    const simplifiedTotal = simplifiedTax + simplifiedSocial;

    // 2. ОУР (Общеустановленный режим)
    const ourTaxBase = profit;
    // Прогрессивный ИПН: 10% до 8500 МРП/год, 15% сверх
    const annualThreshold = 8_500 * MRP;
    const monthlyThreshold = annualThreshold / 12;
    let ourIPN: number;
    if (ourTaxBase <= monthlyThreshold) {
      ourIPN = Math.round(ourTaxBase * 0.10);
    } else {
      ourIPN = Math.round(monthlyThreshold * 0.10 + (ourTaxBase - monthlyThreshold) * 0.15);
    }
    const ourSocial = baseSocialMonthly;
    const ourTotal = ourIPN + ourSocial;

    // 3. ЕСП (Единый совокупный платёж) — только без наёмных работников
    const espAvailable = !hasEmployees;
    const espMonthly = isRural ? Math.round(0.5 * MRP) : MRP;
    const espTotal = espMonthly;

    // 4. Розничный налог — 4% (для отдельных видов деятельности)
    const retailTax = Math.round(revenue * 0.04);
    const retailSocial = baseSocialMonthly;
    const retailTotal = retailTax + retailSocial;

    return [
      {
        regimeKey: 'simplified',
        tax: simplifiedTax,
        socialPayments: simplifiedSocial,
        total: simplifiedTotal,
        effectiveRate: revenue > 0 ? (simplifiedTotal / revenue) * 100 : 0,
        available: simplifiedAvailable,
        limitNote: !simplifiedAvailable ? t('tax-regime.limitSimplified') : undefined,
      },
      {
        regimeKey: 'general',
        tax: ourIPN,
        socialPayments: ourSocial,
        total: ourTotal,
        effectiveRate: revenue > 0 ? (ourTotal / revenue) * 100 : 0,
        available: true,
      },
      {
        regimeKey: 'esp',
        tax: espMonthly,
        socialPayments: 0,
        total: espTotal,
        effectiveRate: revenue > 0 ? (espTotal / revenue) * 100 : 0,
        available: espAvailable,
        limitNote: !espAvailable ? t('tax-regime.limitESP') : undefined,
      },
      {
        regimeKey: 'retail',
        tax: retailTax,
        socialPayments: retailSocial,
        total: retailTotal,
        effectiveRate: revenue > 0 ? (retailTotal / revenue) * 100 : 0,
        available: true,
      },
    ];
  }, [monthlyRevenue, monthlyExpenses, hasEmployees, isRural, t]);

  const bestRegime = useMemo(() => {
    const available = results.filter((r) => r.available);
    if (available.length === 0) return null;
    return available.reduce((best, curr) => (curr.total < best.total ? curr : best));
  }, [results]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const chartData = useMemo(() => {
    return results.map((r) => ({
      name: t(`tax-regime.regimes.${r.regimeKey}`),
      value: r.total,
    }));
  }, [results, t]);

  const generateExportData = () => {
    if (results.length === 0) return null;
    return {
      title: t('tax-regime.exportTitle'),
      sections: [
        {
          title: t('tax-regime.parameters'),
          data: [
            { label: t('tax-regime.monthlyRevenue'), value: formatCurrency(parseFloat(monthlyRevenue) || 0) },
            { label: t('tax-regime.monthlyExpenses'), value: formatCurrency(parseFloat(monthlyExpenses) || 0) },
          ],
        },
        ...results.map((r) => ({
          title: t(`tax-regime.regimes.${r.regimeKey}`),
          data: [
            { label: t('tax-regime.taxAmount'), value: formatCurrency(r.tax) },
            { label: t('tax-regime.socialPayments'), value: formatCurrency(r.socialPayments) },
            { label: t('tax-regime.totalPayments'), value: formatCurrency(r.total) },
            { label: t('tax-regime.effectiveRate'), value: r.effectiveRate.toFixed(1) + '%' },
          ],
        })),
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="tax-regime-comparison" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('tax-regime.heading')}</h1>
            <p className="text-gray-600">{t('tax-regime.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('tax-regime.warning')}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('tax-regime.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Monthly revenue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tax-regime.monthlyRevenue')}
              </label>
              <RangeSlider
                value={parseFloat(monthlyRevenue) || 0}
                onChange={(val) => setMonthlyRevenue(String(val))}
                min={100000}
                max={10000000}
                step={100000}
                formatValue={(v) => `${(v / 1000000).toFixed(1)} ${t('tax-regime.mln')}`}
                color="#6366f1"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸/{t('tax-regime.month')}</span>
                </div>
              </div>
            </div>

            {/* Monthly expenses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tax-regime.monthlyExpenses')}
              </label>
              <RangeSlider
                value={parseFloat(monthlyExpenses) || 0}
                onChange={(val) => setMonthlyExpenses(String(val))}
                min={0}
                max={parseFloat(monthlyRevenue) || 5000000}
                step={50000}
                formatValue={(v) => `${(v / 1000000).toFixed(1)} ${t('tax-regime.mln')}`}
                color="#6366f1"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸/{t('tax-regime.month')}</span>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEmployees}
                  onChange={(e) => setHasEmployees(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t('tax-regime.hasEmployees')}</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRural}
                  onChange={(e) => setIsRural(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{t('tax-regime.isRural')}</span>
              </label>
            </div>

            {/* Reference rates */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">{t('tax-regime.currentRates')}</h3>
              <ul className="text-xs text-indigo-700 space-y-1">
                <li>• {t('tax-regime.rateSimplified')}</li>
                <li>• {t('tax-regime.rateGeneral')}</li>
                <li>• {t('tax-regime.rateESP')}</li>
                <li>• {t('tax-regime.rateRetail')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('tax-regime.resultsTitle')}
          </h2>

          {results.length > 0 ? (
            <div className="space-y-4">
              {/* Best regime highlight */}
              {bestRegime && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">{t('tax-regime.bestRegime')}</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {t(`tax-regime.regimes.${bestRegime.regimeKey}`)}
                  </div>
                  <div className="text-sm text-green-600">
                    {formatCurrency(bestRegime.total)}/{t('tax-regime.month')} ({bestRegime.effectiveRate.toFixed(1)}%)
                  </div>
                </div>
              )}

              {/* Regime cards */}
              {results.map((r) => (
                <div
                  key={r.regimeKey}
                  className={`rounded-lg p-4 border-2 ${
                    bestRegime?.regimeKey === r.regimeKey
                      ? 'border-green-300 bg-green-50/50'
                      : r.available
                      ? 'border-gray-100 bg-gray-50'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {t(`tax-regime.regimes.${r.regimeKey}`)}
                        {bestRegime?.regimeKey === r.regimeKey && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {t('tax-regime.optimal')}
                          </span>
                        )}
                      </div>
                      {!r.available && r.limitNote && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600">{r.limitNote}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(r.total)}</div>
                      <div className="text-xs text-gray-500">{r.effectiveRate.toFixed(1)}% {t('tax-regime.ofRevenue')}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      {t('tax-regime.taxAmount')}: <span className="font-medium">{formatCurrency(r.tax)}</span>
                    </div>
                    <div>
                      {t('tax-regime.socialPayments')}: <span className="font-medium">{formatCurrency(r.socialPayments)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="mt-4">
                  <ComparisonBarChart
                    data={chartData}
                    dataKeys={[{ key: 'value', name: t('tax-regime.chartTitle'), color: '#0ea5e9' }]}
                    title={t('tax-regime.chartTitle')}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              {t('tax-regime.enterData')}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 text-sm text-gray-600">
        <Info className="w-4 h-4 inline mr-1" />
        {t('tax-regime.infoNote')}
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('tax-regime.faq.q1'), answer: t('tax-regime.faq.a1') },
          { question: t('tax-regime.faq.q2'), answer: t('tax-regime.faq.a2') },
          { question: t('tax-regime.faq.q3'), answer: t('tax-regime.faq.a3') },
          { question: t('tax-regime.faq.q4'), answer: t('tax-regime.faq.a4') },
          { question: t('tax-regime.faq.q5'), answer: t('tax-regime.faq.a5') },
        ]}
      
          sources={getSources('tax-regime-comparison')}
        />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="tax-regime" calculatorTitle={t('tax-regime.heading')} />
      <LastUpdated calculatorId="tax-regime-comparison" />
    </div>
  );
}
