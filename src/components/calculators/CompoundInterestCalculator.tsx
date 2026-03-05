import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calculator, DollarSign, Target, BarChart3, PieChart, Info, AlertTriangle, Percent, Calendar } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { TaxPieChart, TrendLineChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

interface YearlyData {
  year: number;
  personalContributions: number;
  interestEarned: number;
  totalAmount: number;
  yearlyInterest: number;
}

export default function CompoundInterestCalculator() {
  const { t } = useTranslation('calculators');
  const [initialDeposit, setInitialDeposit] = useState<number>(500000);
  const [regularContribution, setRegularContribution] = useState<number>(25000);
  const [contributionFrequency, setContributionFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [annualRate, setAnnualRate] = useState<number>(14);
  const [investmentYears, setInvestmentYears] = useState<number>(10);
  const [compoundingFrequency, setCompoundingFrequency] = useState<'monthly' | 'quarterly' | 'semiannually' | 'annually'>('monthly');
  const [currency, setCurrency] = useState<'KZT' | 'USD' | 'EUR'>('KZT');

  const [results, setResults] = useState({
    finalAmount: 0,
    totalPersonalContributions: 0,
    totalInterestEarned: 0,
    effectiveReturn: 0,
    totalReturn: 0,
    yearlyData: [] as YearlyData[]
  });

  const currencies = [
    { code: 'KZT', symbol: '₸', name: t('compound-interest.kzt') },
    { code: 'USD', symbol: '$', name: t('compound-interest.usd') },
    { code: 'EUR', symbol: '€', name: t('compound-interest.eur') }
  ];

  const compoundingOptions = [
    { id: 'monthly', periodsPerYear: 12 },
    { id: 'quarterly', periodsPerYear: 4 },
    { id: 'semiannually', periodsPerYear: 2 },
    { id: 'annually', periodsPerYear: 1 }
  ];

  const calculateCompoundInterest = () => {
    const principal = initialDeposit;
    const monthlyContrib = contributionFrequency === 'monthly' ? regularContribution : 0;
    const yearlyContrib = contributionFrequency === 'yearly' ? regularContribution : regularContribution * 12;
    const rate = annualRate / 100;
    const years = investmentYears;

    const compoundingOption = compoundingOptions.find(option => option.id === compoundingFrequency);
    const compoundingPeriods = compoundingOption?.periodsPerYear || 12;

    let currentAmount = principal;
    let totalContributions = principal;
    const yearlyData: YearlyData[] = [];

    for (let year = 1; year <= years; year++) {
      const startOfYearAmount = currentAmount;

      if (contributionFrequency === 'monthly') {
        for (let month = 1; month <= 12; month++) {
          const periodsInMonth = compoundingPeriods / 12;
          currentAmount *= Math.pow(1 + rate / compoundingPeriods, periodsInMonth);

          currentAmount += monthlyContrib;
          totalContributions += monthlyContrib;
        }
      } else {
        currentAmount += yearlyContrib;
        totalContributions += yearlyContrib;

        currentAmount *= Math.pow(1 + rate / compoundingPeriods, compoundingPeriods);
      }

      const yearlyInterest = currentAmount - startOfYearAmount - yearlyContrib;

      yearlyData.push({
        year,
        personalContributions: totalContributions,
        interestEarned: currentAmount - totalContributions,
        totalAmount: currentAmount,
        yearlyInterest
      });
    }

    const finalAmount = currentAmount;
    const totalInterestEarned = finalAmount - totalContributions;
    const effectiveReturn = totalContributions > 0 ? (totalInterestEarned / totalContributions) * 100 : 0;
    const totalReturn = totalContributions > 0 ? ((finalAmount / totalContributions) - 1) * 100 : 0;

    setResults({
      finalAmount: Math.round(finalAmount),
      totalPersonalContributions: Math.round(totalContributions),
      totalInterestEarned: Math.round(totalInterestEarned),
      effectiveReturn: Number(effectiveReturn.toFixed(2)),
      totalReturn: Number(totalReturn.toFixed(2)),
      yearlyData
    });
  };

  useEffect(() => {
    calculateCompoundInterest();
  }, [initialDeposit, regularContribution, contributionFrequency, annualRate, investmentYears, compoundingFrequency]);

  const formatNumber = (num: number) => {
    const selectedCurrency = currencies.find(c => c.code === currency);
    return num.toLocaleString('ru-KZ') + ' ' + (selectedCurrency?.symbol || '₸');
  };

  const formatPercent = (num: number) => {
    return num.toFixed(2) + '%';
  };

  const generateExportData = () => {
    const selectedCurrency = currencies.find(c => c.code === currency);
    const contributionFreqText = contributionFrequency === 'monthly' ? t('compound-interest.monthly').toLowerCase() : t('compound-interest.yearly').toLowerCase();
    const compoundingFreqText = t(`calculators:compound-interest.compound${compoundingFrequency.charAt(0).toUpperCase() + compoundingFrequency.slice(1)}`);

    return `${t('compound-interest.basicParameters')}:
- ${t('compound-interest.initialDeposit')}: ${formatNumber(initialDeposit)}
- ${t('compound-interest.regularContribution')}: ${formatNumber(regularContribution)} (${contributionFreqText})
- ${t('compound-interest.annualRate')}: ${annualRate}%
- ${t('compound-interest.investmentYears')}: ${investmentYears} ${t('compound-interest.years')}
- ${t('compound-interest.compoundingPeriod')}: ${compoundingFreqText}
- ${t('compound-interest.currency')}: ${selectedCurrency?.name}

${t('compound-interest.results')}:
- ${t('compound-interest.finalAmount')}: ${formatNumber(results.finalAmount)}
- ${t('compound-interest.yourContributions')}: ${formatNumber(results.totalPersonalContributions)}
- ${t('compound-interest.interestEarned')}: ${formatNumber(results.totalInterestEarned)}
- ${t('compound-interest.effectiveReturn')}: ${formatPercent(results.effectiveReturn)}
- ${t('compound-interest.total')}: ${formatPercent(results.totalReturn)}

${t('compound-interest.yearlyBreakdown')}:
${results.yearlyData.map(data =>
  `${t('compound-interest.year')} ${data.year}: ${formatNumber(data.totalAmount)} (${t('compound-interest.interest').toLowerCase()}: ${formatNumber(data.interestEarned)})`
).join('\n')}`;
  };

  const SimpleChart = ({ data }: { data: YearlyData[] }) => {
    if (data.length === 0) return null;

    const maxAmount = Math.max(...data.map(d => d.totalAmount));

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0</span>
          <span>{formatNumber(maxAmount)}</span>
        </div>
        {data.map((yearData, index) => {
          const contributionsWidth = (yearData.personalContributions / maxAmount) * 100;
          const interestWidth = (yearData.interestEarned / maxAmount) * 100;

          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span>{t('compound-interest.year')} {yearData.year}</span>
                <span className="font-medium">{formatNumber(yearData.totalAmount)}</span>
              </div>
              <div className="flex h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs"
                  style={{ width: `${contributionsWidth}%` }}
                  title={`${t('compound-interest.yourContributions')}: ${formatNumber(yearData.personalContributions)}`}
                >
                  {contributionsWidth > 25 && <span>{t('compound-interest.yourContributions')}</span>}
                </div>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs"
                  style={{ width: `${interestWidth}%` }}
                  title={`${t('compound-interest.interest')}: ${formatNumber(yearData.interestEarned)}`}
                >
                  {interestWidth > 25 && <span>{t('compound-interest.interest')}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('compound-interest.heading')}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t('compound-interest.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 sm:w-6 h-5 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">
              {t('compound-interest.infoTitle')}
            </h3>
            <div className="text-green-800 space-y-2 text-sm sm:text-base">
              <p>{t('compound-interest.infoText1')}</p>
              <p>{t('compound-interest.infoText2')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.basicParameters')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('compound-interest.currency')}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => setCurrency(curr.code as any)}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-center ${
                        currency === curr.code
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-base sm:text-lg mb-1">{curr.symbol}</div>
                      <div className="text-xs sm:text-sm font-medium">{curr.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('compound-interest.initialDeposit')}
                  </label>
                  <span className="text-sm font-semibold text-green-600">
                    {formatNumber(initialDeposit)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10,000 {currencies.find(c => c.code === currency)?.symbol}</span>
                  <span>10,000,000 {currencies.find(c => c.code === currency)?.symbol}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('compound-interest.regularContribution')}
                  </label>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatNumber(regularContribution)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500000"
                  step="5000"
                  value={regularContribution}
                  onChange={(e) => setRegularContribution(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>500,000 {currencies.find(c => c.code === currency)?.symbol}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('compound-interest.contributionFrequency')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setContributionFrequency('monthly')}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      contributionFrequency === 'monthly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{t('compound-interest.monthly')}</div>
                    <div className="text-xs text-gray-600">{t('compound-interest.monthlyDescription')}</div>
                  </button>
                  <button
                    onClick={() => setContributionFrequency('yearly')}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      contributionFrequency === 'yearly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{t('compound-interest.yearly')}</div>
                    <div className="text-xs text-gray-600">{t('compound-interest.yearlyDescription')}</div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('compound-interest.annualRate')}
                  </label>
                  <span className="text-sm font-semibold text-teal-600">
                    {formatPercent(annualRate)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="0.1"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1%</span>
                  <span>30%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('compound-interest.averageRateHint')}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('compound-interest.investmentYears')}
                  </label>
                  <span className="text-sm font-semibold text-orange-600">
                    {investmentYears} {t('compound-interest.years')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={investmentYears}
                  onChange={(e) => setInvestmentYears(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 {t('compound-interest.year')}</span>
                  <span>50 {t('compound-interest.years')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('compound-interest.compoundingPeriod')}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {compoundingOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setCompoundingFrequency(option.id as any)}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-left ${
                        compoundingFrequency === option.id
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium text-xs sm:text-sm">{t(`calculators:compound-interest.compound${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`)}</div>
                      <div className="text-xs text-gray-600">{t(`calculators:compound-interest.compound${option.id.charAt(0).toUpperCase() + option.id.slice(1)}Desc`)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.capitalGrowthDynamics')}</h2>

            {results.yearlyData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>{t('compound-interest.yourContributions')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>{t('compound-interest.interest')}</span>
                  </div>
                </div>

                <div className="max-h-64 sm:max-h-96 overflow-y-auto">
                  <SimpleChart data={results.yearlyData} />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">{t('compound-interest.chartWillBeShown')}</div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.results')}</h2>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">{t('compound-interest.finalAmount')}</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                    <span className="text-xl sm:text-2xl font-bold text-green-700 break-all">{formatNumber(results.finalAmount)}</span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {t('compound-interest.capitalAfter')} {investmentYears} {t('compound-interest.years')}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                  <span className="text-gray-600 text-sm sm:text-base">{t('compound-interest.yourContributions')}</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base break-all">{formatNumber(results.totalPersonalContributions)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                  <span className="text-gray-600 text-sm sm:text-base">{t('compound-interest.interestEarned')}</span>
                  <span className="font-semibold text-green-600 text-sm sm:text-base break-all">{formatNumber(results.totalInterestEarned)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 space-y-1 sm:space-y-0">
                  <span className="text-gray-600 text-sm sm:text-base">{t('compound-interest.effectiveReturn')}</span>
                  <span className="font-semibold text-teal-600 text-sm sm:text-base">{formatPercent(results.effectiveReturn)}</span>
                </div>
              </div>

              <SharePrintButtons
                title={t('compound-interest.exportTitle')}
                description={t('compound-interest.exportDescription')}
                results={generateExportData()}
                disabled={results.finalAmount === 0}
                className="mt-4"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.efficiencyAnalysis')}</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                  {t('compound-interest.compoundPowerTitle')}
                </h3>
                <div className="text-blue-800 text-xs sm:text-sm space-y-1">
                  <div>• {t('compound-interest.capitalGrew')} {results.totalPersonalContributions > 0 ? (results.finalAmount / results.totalPersonalContributions).toFixed(1) : '0'} {t('compound-interest.times')}</div>
                  <div>• {t('compound-interest.interestPercentage')} {results.finalAmount > 0 ? ((results.totalInterestEarned / results.finalAmount) * 100).toFixed(1) : '0'}% {t('compound-interest.ofTotal')}</div>
                  <div>• {t('compound-interest.averageAnnualProfit')} {investmentYears > 0 ? formatNumber(results.totalInterestEarned / investmentYears) : formatNumber(0)}</div>
                </div>
              </div>

              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="font-semibold text-teal-900 mb-2 text-sm sm:text-base">
                  {t('compound-interest.capitalizationImpactTitle')}
                </h3>
                <div className="text-teal-800 text-xs sm:text-sm">
                  {t(`calculators:compound-interest.compound${compoundingFrequency.charAt(0).toUpperCase() + compoundingFrequency.slice(1)}`).charAt(0).toUpperCase() + t(`calculators:compound-interest.compound${compoundingFrequency.charAt(0).toUpperCase() + compoundingFrequency.slice(1)}`).slice(1)} {t('compound-interest.capitalizationImpactText')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.yearlyData.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.yearlyBreakdown')}</h2>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-full responsive-table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('compound-interest.year')}</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('compound-interest.yourContributions')}</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('compound-interest.interest')}</th>
                  <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('compound-interest.total')}</th>
                </tr>
              </thead>
              <tbody>
                {results.yearlyData.map((yearData) => (
                  <tr key={yearData.year} className="border-b border-gray-100">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm">{t('compound-interest.year')} {yearData.year}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm">{formatNumber(yearData.personalContributions)}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm text-green-600">{formatNumber(yearData.interestEarned)}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-right font-semibold text-xs sm:text-sm">{formatNumber(yearData.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.investmentOpportunitiesKZ')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">🏦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('compound-interest.bankDeposits')}</h3>
            <div className="text-gray-600 text-xs sm:text-sm space-y-1">
              <div>{t('compound-interest.yield')} <strong>13-15%</strong></div>
              <div>{t('compound-interest.guarantees')}</div>
              <div>{t('compound-interest.risk')} {t('compound-interest.minimalRisk')}</div>
            </div>
          </div>

          <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">📈</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('compound-interest.kase')}</h3>
            <div className="text-gray-600 text-xs sm:text-sm space-y-1">
              <div>{t('compound-interest.yield')} <strong>10-25%</strong></div>
              <div>{t('compound-interest.instruments')}</div>
              <div>{t('compound-interest.risk')} {t('compound-interest.moderateRisk')}</div>
            </div>
          </div>

          <div className="text-center p-4 sm:p-6 bg-teal-50 rounded-lg sm:col-span-2 lg:col-span-1">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">💎</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('compound-interest.alternativeInvestments')}</h3>
            <div className="text-gray-600 text-xs sm:text-sm space-y-1">
              <div>{t('compound-interest.realEstateGold')}</div>
              <div>{t('compound-interest.yield')} <strong>5-20%</strong></div>
              <div>{t('compound-interest.risk')} {t('compound-interest.variousRisk')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.practicalTips')}</h2>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('compound-interest.maxEfficiency')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('compound-interest.importantPoints')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.warning1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.warning2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.warning3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('compound-interest.warning4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('compound-interest.disclaimer')}
              </h3>
              <p className="text-amber-800 text-xs sm:text-sm">
                {t('compound-interest.disclaimerText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.compoundVsSimple')}</h2>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3 text-sm sm:text-base">{t('compound-interest.compoundInterestYourResult')}</h3>
            <div className="text-green-800 text-xs sm:text-sm space-y-2">
              <p>
                <strong>{t('compound-interest.principle')}</strong> {t('compound-interest.compoundPrinciple')}
              </p>
              <p>
                <strong>{t('compound-interest.yourResult')}</strong> {formatNumber(results.finalAmount)}
              </p>
              <p>
                <strong>{t('compound-interest.formula')}</strong> {t('compound-interest.compoundFormula')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">{t('compound-interest.simpleInterestComparison')}</h3>
            <div className="text-gray-700 text-xs sm:text-sm space-y-2">
              <p>
                <strong>{t('compound-interest.principle')}</strong> {t('compound-interest.simplePrinciple')}
              </p>
              <p>
                <strong>{t('compound-interest.wouldBe')}</strong> {formatNumber(
                  results.totalPersonalContributions + (initialDeposit * (annualRate / 100) * investmentYears)
                )}
              </p>
              <p>
                <strong>{t('compound-interest.difference')}</strong> <span className="text-green-600 font-semibold">
                  +{formatNumber(results.totalInterestEarned - (initialDeposit * (annualRate / 100) * investmentYears))}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <PieChart className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('compound-interest.whyCompoundBetter')}
              </h3>
              <p className="text-blue-800 text-xs sm:text-sm">
                {t('compound-interest.whyCompoundBetterText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('compound-interest.aboutCompound')}</h2>

        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">{t('compound-interest.whatIsCompound')}</h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-4">
                {t('compound-interest.whatIsCompoundText')}
              </p>

              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('compound-interest.examplesOfUse')}</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>{t('compound-interest.example1')}</li>
                <li>{t('compound-interest.example2')}</li>
                <li>{t('compound-interest.example3')}</li>
                <li>{t('compound-interest.example4')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">{t('compound-interest.financialInstruments')}</h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-4">
                {t('compound-interest.financialInstrumentsText')}
              </p>

              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('compound-interest.keyFeatures')}</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>{t('compound-interest.feature1')}</li>
                <li>{t('compound-interest.feature2')}</li>
                <li>{t('compound-interest.feature3')}</li>
                <li>{t('compound-interest.feature4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('compound-interest.faq.q1'), answer: t('compound-interest.faq.a1') },
          { question: t('compound-interest.faq.q2'), answer: t('compound-interest.faq.a2') },
          { question: t('compound-interest.faq.q3'), answer: t('compound-interest.faq.a3') },
          { question: t('compound-interest.faq.q4'), answer: t('compound-interest.faq.a4') },
          { question: t('compound-interest.faq.q5'), answer: t('compound-interest.faq.a5') }
        ]}
        sources={[
          { title: 'KASE — Доходность инструментов', url: 'https://kase.kz/' },
          { title: 'Финансовая грамотность НБК', url: 'https://nationalbank.kz/' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.finalAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('compound-interest.chart.initialAmount'), value: initialDeposit },
              { name: t('compound-interest.chart.interestEarned'), value: results.totalInterestEarned },
            ]}
            title={t('compound-interest.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.finalAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('compound-interest.title'),
              subtitle: `${t('compound-interest.annualRate')}: ${annualRate}%`,
              sections: [
                {
                  title: t('compound-interest.results'),
                  data: [
                    { label: t('compound-interest.initialDeposit'), value: `${initialDeposit.toLocaleString()} ₸` },
                    { label: t('compound-interest.finalAmount'), value: `${results.finalAmount.toLocaleString()} ₸` },
                    { label: t('compound-interest.interestEarned'), value: `${results.totalInterestEarned.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'calk.kz'
            }}
            filename="compound-interest-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="compound-interest"
        calculatorTitle={t('compound-interest.title')}
      />
    </div>
  );
}
