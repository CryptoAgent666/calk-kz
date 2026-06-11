import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, TrendingUp, Info, Building2, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
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

type PropertyType = 'residential' | 'commercial';
type TaxRegime = 'individual' | 'patent' | 'simplified';

interface RegimeResult {
  regime: TaxRegime;
  incomeTax: number;
  socialPayments: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
}

export default function RentalIncomeTaxCalculator() {
  const { t } = useTranslation('calculators');

  // Константы 2026
  const MRP = 4325; // МРП 2026
  const MZP = 85000; // МЗП 2026
  const VOSMS_FIXED = 5950; // ВОСМС за себя
  const OPV_MAX_BASE = 50 * MZP;
  const SO_MAX_BASE = 7 * MZP;
  // СНР на основе патента УПРАЗДНЁН с 01.01.2026 (из 7 СНР осталось 3).
  // Преемник — СНР для самозанятых (без регистрации ИП): ИПН 0% + соцплатежи 4% от дохода
  // (ОПВ 1% + ОПВР 1% + СО 1% + ОСМС 1%), учёт через мобильное приложение.
  // Лимит дохода — 300 МРП в МЕСЯЦ (≈1 297 500 ₸ при МРП 4325), а не полугодовой лимит патента.
  const SELF_EMPLOYED_RATE = 0.04; // суммарные соцплатежи самозанятого: 4% от дохода
  const SELF_EMPLOYED_LIMIT_MONTHLY = 300 * MRP;
  const SIMPLIFIED_LIMIT_HALFYEAR = 300000 * MRP;

  const [monthlyRent, setMonthlyRent] = useState<string>('200000');
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [selectedRegime, setSelectedRegime] = useState<TaxRegime>('individual');
  const [rentalMonths, setRentalMonths] = useState<string>('12');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<boolean>(false);
  const [utilitiesAmount, setUtilitiesAmount] = useState<string>('25000');

  const [results, setResults] = useState({
    yearlyIncome: 0,
    taxableIncome: 0,
    incomeTax: 0,
    socialPayments: 0,
    totalTax: 0,
    netIncome: 0,
    effectiveRate: 0,
  });

  const [comparison, setComparison] = useState<RegimeResult[]>([]);

  const calculateForRegime = (
    regime: TaxRegime,
    taxableIncome: number,
    months: number
  ): RegimeResult => {
    let incomeTax = 0;
    let socialPayments = 0;

    if (regime === 'individual') {
      // ИПН 10% от арендной платы
      incomeTax = taxableIncome * 0.10;
      socialPayments = 0;
    } else if (regime === 'patent') {
      // Патентный СНР упразднён с 01.01.2026 → режим для самозанятых.
      // ИПН 0%; единственный платёж — соцплатежи 4% от дохода
      // (ОПВ 1% + ОПВР 1% + СО 1% + ОСМС 1%), удерживаемые с фактического дохода.
      incomeTax = 0;
      socialPayments = taxableIncome * SELF_EMPLOYED_RATE;
    } else {
      // Упрощёнка: 4% от дохода (ИПН/КПН, НК РК 2026; акимат вправе изменить ±50%)
      incomeTax = taxableIncome * 0.04;
      const base = Math.min(MZP, OPV_MAX_BASE);
      const baseSO = Math.min(MZP, SO_MAX_BASE);
      const opv = base * 0.10;
      const opvr = base * 0.035;
      const so = baseSO * 0.05;
      const vosms = VOSMS_FIXED;
      socialPayments = (opv + opvr + so + vosms) * months;
    }

    const totalTax = incomeTax + socialPayments;
    const netIncome = taxableIncome - totalTax;
    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

    return {
      regime,
      incomeTax: Math.round(incomeTax),
      socialPayments: Math.round(socialPayments),
      totalTax: Math.round(totalTax),
      netIncome: Math.round(netIncome),
      effectiveRate: Number(effectiveRate.toFixed(2)),
    };
  };

  useEffect(() => {
    const rent = parseFloat(monthlyRent) || 0;
    const months = parseFloat(rentalMonths) || 12;
    const util = parseFloat(utilitiesAmount) || 0;

    if (rent <= 0) {
      setResults({
        yearlyIncome: 0,
        taxableIncome: 0,
        incomeTax: 0,
        socialPayments: 0,
        totalTax: 0,
        netIncome: 0,
        effectiveRate: 0,
      });
      setComparison([]);
      return;
    }

    const yearlyIncome = rent * months;
    const utilityDeduction = utilitiesIncluded ? util * months : 0;
    const taxableIncome = Math.max(0, yearlyIncome - utilityDeduction);

    const individual = calculateForRegime('individual', taxableIncome, months);
    const patent = calculateForRegime('patent', taxableIncome, months);
    const simplified = calculateForRegime('simplified', taxableIncome, months);

    const selected =
      selectedRegime === 'individual'
        ? individual
        : selectedRegime === 'patent'
        ? patent
        : simplified;

    setResults({
      yearlyIncome: Math.round(yearlyIncome),
      taxableIncome: Math.round(taxableIncome),
      incomeTax: selected.incomeTax,
      socialPayments: selected.socialPayments,
      totalTax: selected.totalTax,
      netIncome: selected.netIncome,
      effectiveRate: selected.effectiveRate,
    });

    setComparison([individual, patent, simplified]);
  }, [monthlyRent, rentalMonths, utilitiesIncluded, utilitiesAmount, selectedRegime, propertyType]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  // Рекомендация: режим с минимальной эффективной ставкой
  const bestRegime = comparison.length
    ? comparison.reduce((a, b) => (a.totalTax < b.totalTax ? a : b))
    : null;

  // Самозанятые: лимит проверяется по МЕСЯЧНОМУ доходу (300 МРП/мес), не по полугодию.
  const patentLimitExceeded = (parseFloat(monthlyRent) || 0) > SELF_EMPLOYED_LIMIT_MONTHLY;
  const simplifiedLimitExceeded = results.yearlyIncome / 2 > SIMPLIFIED_LIMIT_HALFYEAR;

  const regimeLabel = (r: TaxRegime) => t(`rental-income-tax.regime.${r}`);

  const generateExportData = () => {
    if (results.yearlyIncome === 0) return null;
    return `${t('rental-income-tax.exportTitle')}
─────────────────────────────
${t('rental-income-tax.monthlyRent')}: ${formatCurrency(parseFloat(monthlyRent) || 0)}
${t('rental-income-tax.propertyType')}: ${t(`rental-income-tax.property.${propertyType}`)}
${t('rental-income-tax.selectedRegime')}: ${regimeLabel(selectedRegime)}
${t('rental-income-tax.rentalMonths')}: ${rentalMonths}

${t('rental-income-tax.resultsTitle')}:
─────────────────────────────
${t('rental-income-tax.yearlyIncome')}: ${formatCurrency(results.yearlyIncome)}
${t('rental-income-tax.taxableIncome')}: ${formatCurrency(results.taxableIncome)}
${t('rental-income-tax.incomeTax')}: ${formatCurrency(results.incomeTax)}
${t('rental-income-tax.socialPayments')}: ${formatCurrency(results.socialPayments)}
${t('rental-income-tax.totalTax')}: ${formatCurrency(results.totalTax)}
${t('rental-income-tax.netIncome')}: ${formatCurrency(results.netIncome)}
${t('rental-income-tax.effectiveRate')}: ${results.effectiveRate}%
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="rental-income-tax" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('rental-income-tax.heading')}</h1>
            <p className="text-gray-600">{t('rental-income-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          {t('rental-income-tax.warning')}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('rental-income-tax.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Monthly rent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Wallet className="w-4 h-4 inline mr-1" />
                {t('rental-income-tax.monthlyRent')}
              </label>
              <RangeSlider
                value={parseFloat(monthlyRent) || 0}
                onChange={(val) => setMonthlyRent(String(val))}
                min={20000}
                max={2000000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString('ru-KZ')} ₸`}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder={t('rental-income-tax.enterRent')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸/{t('rental-income-tax.month')}</span>
                </div>
              </div>
            </div>

            {/* Property type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Building2 className="w-4 h-4 inline mr-1" />
                {t('rental-income-tax.propertyType')}
              </label>
              <div className="flex gap-2">
                {(['residential', 'commercial'] as PropertyType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setPropertyType(pt)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      propertyType === pt
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(`rental-income-tax.property.${pt}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tax regime */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('rental-income-tax.selectedRegime')}
              </label>
              <div className="space-y-2">
                {(['individual', 'patent', 'simplified'] as TaxRegime[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegime(r)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      selectedRegime === r
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{t(`rental-income-tax.regime.${r}`)}</div>
                    <div className="text-xs text-gray-600 mt-1">{t(`rental-income-tax.regimeDesc.${r}`)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rental months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('rental-income-tax.rentalMonths')}
              </label>
              <RangeSlider
                value={parseFloat(rentalMonths) || 0}
                onChange={(val) => setRentalMonths(String(val))}
                min={1}
                max={12}
                step={1}
                formatValue={(v) => `${v} ${t('rental-income-tax.months')}`}
                color="#3b82f6"
              />
            </div>

            {/* Utilities */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-center cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={utilitiesIncluded}
                  onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {t('rental-income-tax.utilitiesIncluded')}
                </span>
              </label>
              {utilitiesIncluded && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {t('rental-income-tax.utilitiesAmount')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={utilitiesAmount}
                      onChange={(e) => setUtilitiesAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-xs">₸/{t('rental-income-tax.month')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('rental-income-tax.resultsTitle')}
          </h2>

          <div className="space-y-4">
            {/* Total tax — main */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('rental-income-tax.totalTax')}</span>
                <span className="text-2xl font-bold text-blue-700">{formatCurrency(results.totalTax)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {t('rental-income-tax.regime.' + selectedRegime)} · {t('rental-income-tax.effectiveRate')}: {results.effectiveRate}%
              </div>
            </div>

            {/* Yearly income */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">{t('rental-income-tax.yearlyIncome')}</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(results.yearlyIncome)}</div>
            </div>

            {/* Taxable income */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">{t('rental-income-tax.taxableIncome')}</div>
              <div className="text-lg font-bold text-gray-900">{formatCurrency(results.taxableIncome)}</div>
            </div>

            {/* Income tax */}
            <div className="bg-orange-50 rounded-lg p-4 flex justify-between items-center">
              <div className="text-sm text-orange-700">{t('rental-income-tax.incomeTax')}</div>
              <div className="text-lg font-bold text-orange-700">{formatCurrency(results.incomeTax)}</div>
            </div>

            {/* Social payments */}
            {results.socialPayments > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 flex justify-between items-center">
                <div className="text-sm text-purple-700">{t('rental-income-tax.socialPayments')}</div>
                <div className="text-lg font-bold text-purple-700">{formatCurrency(results.socialPayments)}</div>
              </div>
            )}

            {/* Net income */}
            <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center border border-green-200">
              <div>
                <div className="text-sm text-green-700">{t('rental-income-tax.netIncome')}</div>
                <div className="text-xs text-green-600">{t('rental-income-tax.netIncomeHint')}</div>
              </div>
              <div className="text-xl font-bold text-green-700">{formatCurrency(results.netIncome)}</div>
            </div>

            {/* Recommendation */}
            {bestRegime && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-blue-900">
                      {t('rental-income-tax.recommendation')}: {t(`rental-income-tax.regime.${bestRegime.regime}`)}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {t('rental-income-tax.recommendationHint', { amount: formatCurrency(bestRegime.totalTax) })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Limit warnings */}
            {patentLimitExceeded && selectedRegime === 'patent' && (
              <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 border border-red-200">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {t('rental-income-tax.patentLimitExceeded')}
              </div>
            )}
            {simplifiedLimitExceeded && selectedRegime === 'simplified' && (
              <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 border border-red-200">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {t('rental-income-tax.simplifiedLimitExceeded')}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('rental-income-tax.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      {comparison.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('rental-income-tax.comparisonTitle')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 px-2 text-gray-600 font-medium">{t('rental-income-tax.table.regime')}</th>
                  <th className="py-3 px-2 text-gray-600 font-medium text-right">{t('rental-income-tax.table.incomeTax')}</th>
                  <th className="py-3 px-2 text-gray-600 font-medium text-right">{t('rental-income-tax.table.social')}</th>
                  <th className="py-3 px-2 text-gray-600 font-medium text-right">{t('rental-income-tax.table.total')}</th>
                  <th className="py-3 px-2 text-gray-600 font-medium text-right">{t('rental-income-tax.table.netIncome')}</th>
                  <th className="py-3 px-2 text-gray-600 font-medium text-right">{t('rental-income-tax.table.effectiveRate')}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => {
                  const isBest = bestRegime && row.regime === bestRegime.regime;
                  return (
                    <tr
                      key={row.regime}
                      className={`border-b border-gray-100 ${isBest ? 'bg-green-50' : ''}`}
                    >
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {t(`rental-income-tax.regime.${row.regime}`)}
                        {isBest && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                            {t('rental-income-tax.best')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-700">{formatCurrency(row.incomeTax)}</td>
                      <td className="py-3 px-2 text-right text-gray-700">{formatCurrency(row.socialPayments)}</td>
                      <td className="py-3 px-2 text-right font-semibold text-gray-900">{formatCurrency(row.totalTax)}</td>
                      <td className="py-3 px-2 text-right text-green-700">{formatCurrency(row.netIncome)}</td>
                      <td className="py-3 px-2 text-right text-gray-700">{row.effectiveRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <Info className="w-3 h-3 inline mr-1" />
            {t('rental-income-tax.tableNote')}
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('rental-income-tax.exportFilename')} />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="rental-income-tax" />
      <MethodologySection steps={getMethodology('rental-income-tax')} />
      <FAQSection
        items={[
          { question: t('rental-income-tax.faq.q1'), answer: t('rental-income-tax.faq.a1') },
          { question: t('rental-income-tax.faq.q2'), answer: t('rental-income-tax.faq.a2') },
          { question: t('rental-income-tax.faq.q3'), answer: t('rental-income-tax.faq.a3') },
          { question: t('rental-income-tax.faq.q4'), answer: t('rental-income-tax.faq.a4') },
          { question: t('rental-income-tax.faq.q5'), answer: t('rental-income-tax.faq.a5') },
        ]}
      
          sources={getSources('rental-income-tax')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget />
      <LastUpdated calculatorId="rental-income-tax" />
    </div>
  );
}
