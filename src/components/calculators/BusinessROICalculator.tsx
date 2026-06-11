import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calculator, Briefcase, DollarSign, Info, Target, Award, AlertTriangle } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { pluralize } from '../../utils/pluralize';

type TaxRegime = 'simplified' | 'general' | 'self-employed';
type PeriodYears = 1 | 3 | 5;

interface TaxOption {
  id: TaxRegime;
  labelKey: string;
  rate: number;
}

export default function BusinessROICalculator() {
  const { t, i18n } = useTranslation('calculators');

  // СНР на основе патента (ст. 685 старого НК, ставка 1%) упразднён с 01.01.2026.
  // Преемник для бывших патентщиков — СНР для самозанятых: ИПН 0% с дохода
  // (соцплатежи 4% — ОПВ/ОПВР/СО/ОСМС — учитываются отдельно, не как налог).
  const taxOptions: TaxOption[] = [
    { id: 'self-employed', labelKey: 'business-roi.taxSelfEmployed', rate: 0 },
    { id: 'simplified', labelKey: 'business-roi.taxSimplified', rate: 0.04 },
    { id: 'general', labelKey: 'business-roi.taxGeneral', rate: 0.20 },
  ];

  const periodOptions: PeriodYears[] = [1, 3, 5];

  const [investments, setInvestments] = useState<string>('5000000');
  const [avgCheck, setAvgCheck] = useState<string>('15000');
  const [clientsPerMonth, setClientsPerMonth] = useState<string>('200');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('1500000');
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('simplified');
  const [period, setPeriod] = useState<PeriodYears>(3);
  const [discountRate, setDiscountRate] = useState<string>('12');

  const [results, setResults] = useState({
    monthlyRevenue: 0,
    grossProfit: 0,
    taxAmount: 0,
    netMonthlyProfit: 0,
    yearlyProfit: 0,
    periodProfit: 0,
    paybackMonths: 0,
    roiPercent: 0,
    npv: 0,
    breakEvenClients: 0,
    rating: 'neutral' as 'great' | 'normal' | 'poor' | 'neutral',
  });

  useEffect(() => {
    const inv = parseFloat(investments) || 0;
    const check = parseFloat(avgCheck) || 0;
    const clients = parseFloat(clientsPerMonth) || 0;
    const expenses = parseFloat(monthlyExpenses) || 0;
    const disc = parseFloat(discountRate) || 12;
    const taxRate = taxOptions.find((o) => o.id === taxRegime)?.rate ?? 0.04;

    const monthlyRevenue = check * clients;
    const grossProfit = monthlyRevenue - expenses;

    // Налог: упрощёнка — от выручки (4%); самозанятые — ИПН 0%; ОУР (КПН 20%) — от прибыли
    let taxAmount = 0;
    if (taxRegime === 'general') {
      taxAmount = grossProfit > 0 ? grossProfit * taxRate : 0;
    } else {
      taxAmount = monthlyRevenue * taxRate;
    }

    const netMonthlyProfit = grossProfit - taxAmount;
    const yearlyProfit = netMonthlyProfit * 12;
    const periodProfit = netMonthlyProfit * 12 * period;

    const paybackMonths =
      netMonthlyProfit > 0 && inv > 0 ? inv / netMonthlyProfit : 0;

    const roiPercent = inv > 0 ? (yearlyProfit / inv) * 100 * period : 0;

    // NPV: −Инвестиции + Σ годовая_прибыль / (1+r)^k
    let npv = -inv;
    const r = disc / 100;
    for (let k = 1; k <= period; k++) {
      npv += yearlyProfit / Math.pow(1 + r, k);
    }

    // Точка безубыточности (клиентов/мес): (расходы + налог_на_выручку) / чек
    // Для упрощённой/самозанятых: break = expenses / (check × (1 − taxRate))
    //   (у самозанятых taxRate = 0, поэтому break = expenses / check)
    // Для ОУР: break = expenses / check (налог берётся с прибыли)
    let breakEvenClients = 0;
    if (check > 0) {
      if (taxRegime === 'general') {
        breakEvenClients = expenses / check;
      } else {
        const effectiveCheck = check * (1 - taxRate);
        breakEvenClients = effectiveCheck > 0 ? expenses / effectiveCheck : 0;
      }
    }

    let rating: 'great' | 'normal' | 'poor' | 'neutral' = 'neutral';
    if (paybackMonths > 0) {
      if (paybackMonths < 12) rating = 'great';
      else if (paybackMonths <= 36) rating = 'normal';
      else rating = 'poor';
    } else if (netMonthlyProfit <= 0) {
      rating = 'poor';
    }

    setResults({
      monthlyRevenue: Math.round(monthlyRevenue),
      grossProfit: Math.round(grossProfit),
      taxAmount: Math.round(taxAmount),
      netMonthlyProfit: Math.round(netMonthlyProfit),
      yearlyProfit: Math.round(yearlyProfit),
      periodProfit: Math.round(periodProfit),
      paybackMonths: Number(paybackMonths.toFixed(1)),
      roiPercent: Number(roiPercent.toFixed(1)),
      npv: Math.round(npv),
      breakEvenClients: Math.ceil(breakEvenClients),
      rating,
    });
  }, [investments, avgCheck, clientsPerMonth, monthlyExpenses, taxRegime, period, discountRate]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const formatPayback = (months: number) => {
    if (months <= 0) return '—';
    const years = Math.floor(months / 12);
    const restMonths = Math.round(months - years * 12);
    const monthWord = pluralize(i18n.language, restMonths, 'месяц', 'месяца', 'месяцев');
    const yearWord = pluralize(i18n.language, years, 'год', 'года', 'лет');
    if (years === 0) return `${restMonths} ${monthWord}`;
    if (restMonths === 0) return `${years} ${yearWord}`;
    return `${years} ${yearWord} ${restMonths} ${monthWord}`;
  };

  const badgeMap = {
    great: { cls: 'bg-emerald-100 text-emerald-700', icon: Award, labelKey: 'business-roi.ratingGreat' },
    normal: { cls: 'bg-amber-100 text-amber-700', icon: Target, labelKey: 'business-roi.ratingNormal' },
    poor: { cls: 'bg-rose-100 text-rose-700', icon: AlertTriangle, labelKey: 'business-roi.ratingPoor' },
    neutral: { cls: 'bg-gray-100 text-gray-700', icon: Info, labelKey: 'business-roi.ratingNeutral' },
  } as const;
  const badge = badgeMap[results.rating];
  const BadgeIcon = badge.icon;

  const generateExportData = () => {
    if (results.monthlyRevenue === 0) return null;
    const tax = taxOptions.find((o) => o.id === taxRegime);

    return `${t('business-roi.exportTitle')}
─────────────────────────────
${t('business-roi.investments')}: ${formatCurrency(parseFloat(investments) || 0)}
${t('business-roi.avgCheck')}: ${formatCurrency(parseFloat(avgCheck) || 0)}
${t('business-roi.clientsPerMonth')}: ${clientsPerMonth}
${t('business-roi.monthlyExpenses')}: ${formatCurrency(parseFloat(monthlyExpenses) || 0)}
${t('business-roi.taxRegime')}: ${tax ? t(tax.labelKey) : ''}
${t('business-roi.period')}: ${period} ${t('business-roi.years')}

${t('business-roi.resultsTitle')}:
─────────────────────────────
${t('business-roi.monthlyRevenue')}: ${formatCurrency(results.monthlyRevenue)}
${t('business-roi.grossProfit')}: ${formatCurrency(results.grossProfit)}
${t('business-roi.netProfit')}: ${formatCurrency(results.netMonthlyProfit)}
${t('business-roi.yearlyProfit')}: ${formatCurrency(results.yearlyProfit)}
${t('business-roi.payback')}: ${formatPayback(results.paybackMonths)}
${t('business-roi.roi')}: ${results.roiPercent}%
${t('business-roi.npv')}: ${formatCurrency(results.npv)}
${t('business-roi.breakEven')}: ${results.breakEvenClients} ${t('business-roi.clientsMonth')}
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('business-roi.heading')}</h1>
            <p className="text-gray-600">{t('business-roi.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('business-roi.warning')}</p>
      </div>

      <QuickAnswer calculatorId="business-roi" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('business-roi.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Investments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {t('business-roi.investments')}
              </label>
              <RangeSlider
                value={parseFloat(investments) || 0}
                onChange={(val) => setInvestments(String(val))}
                min={500000}
                max={100000000}
                step={100000}
                formatValue={(v) => formatCurrency(v)}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={investments}
                  onChange={(e) => setInvestments(e.target.value)}
                  placeholder={t('business-roi.enterAmount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Average check */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('business-roi.avgCheck')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={avgCheck}
                  onChange={(e) => setAvgCheck(e.target.value)}
                  placeholder={t('business-roi.enterAmount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Clients per month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('business-roi.clientsPerMonth')}
              </label>
              <RangeSlider
                value={parseFloat(clientsPerMonth) || 0}
                onChange={(val) => setClientsPerMonth(String(val))}
                min={1}
                max={2000}
                step={1}
                formatValue={(v) => `${v}`}
                color="#10b981"
              />
              <input
                type="number"
                value={clientsPerMonth}
                onChange={(e) => setClientsPerMonth(e.target.value)}
                placeholder={t('business-roi.enterAmount')}
                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Monthly expenses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('business-roi.monthlyExpenses')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  placeholder={t('business-roi.enterAmount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">{t('business-roi.expensesHint')}</p>
            </div>

            {/* Tax regime */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('business-roi.taxRegime')}
              </label>
              <div className="flex flex-wrap gap-2">
                {taxOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTaxRegime(opt.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      taxRegime === opt.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('business-roi.period')}
              </label>
              <div className="flex gap-2">
                {periodOptions.map((y) => (
                  <button
                    key={y}
                    onClick={() => setPeriod(y)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      period === y
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {y} {t('business-roi.years')}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('business-roi.discountRate')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(e.target.value)}
                  step="0.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">{t('business-roi.discountHint')}</p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('business-roi.resultsTitle')}
          </h2>

          <div className="space-y-4">
            {/* Payback — hero KPI */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm text-gray-600 mb-1">{t('business-roi.payback')}</div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {formatPayback(results.paybackMonths)}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                  <BadgeIcon className="w-3.5 h-3.5" />
                  {t(badge.labelKey)}
                </div>
              </div>
              {results.paybackMonths > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  {t('business-roi.paybackHint', { count: Math.round(results.paybackMonths) })}
                </div>
              )}
            </div>

            {/* ROI */}
            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-blue-600">
                  {t('business-roi.roi')} ({period} {t('business-roi.years')})
                </div>
                <div className="text-2xl font-bold text-blue-700">{results.roiPercent}%</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>

            {/* Monthly numbers */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('business-roi.monthlyRevenue')}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(results.monthlyRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('business-roi.grossProfit')}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(results.grossProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('business-roi.taxAmount')}</span>
                <span className="text-sm font-semibold text-rose-600">
                  −{formatCurrency(results.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">
                  {t('business-roi.netProfit')}
                </span>
                <span className="text-base font-bold text-emerald-700">
                  {formatCurrency(results.netMonthlyProfit)}
                </span>
              </div>
            </div>

            {/* Yearly + NPV */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-xs text-purple-600 mb-1">{t('business-roi.yearlyProfit')}</div>
                <div className="text-base font-bold text-purple-700">
                  {formatCurrency(results.yearlyProfit)}
                </div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-xs text-indigo-600 mb-1">
                  {t('business-roi.npv')} ({period} {t('business-roi.years')})
                </div>
                <div
                  className={`text-base font-bold ${
                    results.npv >= 0 ? 'text-indigo-700' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(results.npv)}
                </div>
              </div>
            </div>

            {/* Break-even */}
            <div className="bg-orange-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-orange-600">{t('business-roi.breakEven')}</div>
                <div className="text-lg font-bold text-orange-700">
                  {results.breakEvenClients} {t('business-roi.clientsMonth')}
                </div>
              </div>
              <Target className="w-8 h-8 text-orange-400" />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('business-roi.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Chart + export */}
      {results.monthlyRevenue > 0 && parseFloat(investments) > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: t('business-roi.chartInvestments'), value: parseFloat(investments) || 0 },
              {
                name: t('business-roi.chartAccumulated'),
                value: Math.max(0, results.periodProfit),
              },
            ].filter((i) => i.value > 0)}
            title={t('business-roi.chartTitle')}
          />
          <ExportButtons data={generateExportData()} filename={t('business-roi.exportFilename')} />
        </div>
      )}

      <CalculatorExamples calculatorId="business-roi" />

      <MethodologySection steps={getMethodology('business-roi')} />
      <FAQSection
        items={[
          { question: t('business-roi.faq.q1'), answer: t('business-roi.faq.a1') },
          { question: t('business-roi.faq.q2'), answer: t('business-roi.faq.a2') },
          { question: t('business-roi.faq.q3'), answer: t('business-roi.faq.a3') },
          { question: t('business-roi.faq.q4'), answer: t('business-roi.faq.a4') },
          { question: t('business-roi.faq.q5'), answer: t('business-roi.faq.a5') },
        ]}
      
          sources={getSources('business-roi')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget />
      <LastUpdated calculatorId="business-roi" />
    </div>
  );
}
