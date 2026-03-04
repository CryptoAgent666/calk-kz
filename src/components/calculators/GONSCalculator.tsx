import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Calculator, PiggyBank, TrendingUp, Baby, Users, DollarSign, Info, AlertTriangle, Target, BookOpen, Star, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, TrendLineChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';

export default function GONSCalculator() {
  const { t } = useTranslation('calculators');
  const [initialDeposit, setInitialDeposit] = useState<string>('');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('');
  const [savingPeriodYears, setSavingPeriodYears] = useState<string>('');
  const [childCategory, setChildCategory] = useState<'regular' | 'priority'>('regular');
  const [bankRate, setBankRate] = useState<string>('5.5');

  const [results, setResults] = useState({
    totalContributions: 0,
    bankReward: 0,
    totalStatePremium: 0,
    finalAmount: 0,
    statePremiumRate: 0,
    maxPremiumBase: 0,
    effectiveReturn: 0,
    isMinimumMet: false,
    yearlyBreakdown: [] as Array<{
      year: number,
      contributions: number,
      bankReward: number,
      statePremium: number,
      total: number
    }>
  });

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const MIN_INITIAL_DEPOSIT = 3 * MRP_2026; // 12,738 тенге
  const MAX_PREMIUM_BASE_YEARLY = 100 * MRP_2026; // 424,600 тенге в год
  const REGULAR_PREMIUM_RATE = 0.05; // 5% для обычных категорий
  const PRIORITY_PREMIUM_RATE = 0.07; // 7% для льготных категорий

  const calculateGONS = () => {
    const initial = parseFloat(initialDeposit) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const years = parseInt(savingPeriodYears) || 0;
    const annualBankRate = (parseFloat(bankRate) || 0) / 100;

    if (initial < MIN_INITIAL_DEPOSIT || years < 3 || years > 20) {
      setResults({
        totalContributions: 0, bankReward: 0, totalStatePremium: 0, finalAmount: 0,
        statePremiumRate: 0, maxPremiumBase: 0, effectiveReturn: 0, isMinimumMet: false,
        yearlyBreakdown: []
      });
      return;
    }

    const isMinimumMet = initial >= MIN_INITIAL_DEPOSIT;
    const statePremiumRate = childCategory === 'priority' ? PRIORITY_PREMIUM_RATE : REGULAR_PREMIUM_RATE;

    // Расчет по годам
    let currentBalance = initial;
    let totalContributions = initial;
    let totalBankReward = 0;
    let totalStatePremium = 0;
    const yearlyBreakdown = [];

    for (let year = 1; year <= years; year++) {
      // Ежемесячные пополнения за год
      const yearlyContributions = monthly * 12;
      totalContributions += yearlyContributions;

      // Среднегодовой баланс для расчета банковского вознаграждения
      const averageBalance = currentBalance + (yearlyContributions / 2);
      const yearlyBankReward = averageBalance * annualBankRate;
      totalBankReward += yearlyBankReward;

      // Баланс для расчета государственной премии (взносы пользователя без банковского вознаграждения)
      const contributionsForPremium = Math.min(initial + (monthly * 12 * year), MAX_PREMIUM_BASE_YEARLY * year);

      // Государственная премия за год (только с взносов пользователя, не превышающих лимит)
      const yearlyStatePremium = Math.min(yearlyContributions, MAX_PREMIUM_BASE_YEARLY) * statePremiumRate;
      totalStatePremium += yearlyStatePremium;

      // Обновляем текущий баланс
      currentBalance += yearlyContributions + yearlyBankReward + yearlyStatePremium;

      yearlyBreakdown.push({
        year,
        contributions: Math.round(totalContributions),
        bankReward: Math.round(totalBankReward),
        statePremium: Math.round(totalStatePremium),
        total: Math.round(currentBalance)
      });
    }

    const finalAmount = currentBalance;
    const effectiveReturn = totalContributions > 0 ? ((finalAmount - totalContributions) / totalContributions) * 100 : 0;

    setResults({
      totalContributions: Math.round(totalContributions),
      bankReward: Math.round(totalBankReward),
      totalStatePremium: Math.round(totalStatePremium),
      finalAmount: Math.round(finalAmount),
      statePremiumRate: statePremiumRate * 100,
      maxPremiumBase: MAX_PREMIUM_BASE_YEARLY,
      effectiveReturn: Number(effectiveReturn.toFixed(2)),
      isMinimumMet,
      yearlyBreakdown
    });
  };

  useEffect(() => {
    calculateGONS();
  }, [initialDeposit, monthlyContribution, savingPeriodYears, childCategory, bankRate]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount.toLocaleString()} ${t('gons.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  const formatPercent = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const childCategories = [
    {
      id: 'regular',
      name: t('gons.regularCategory'),
      rate: 5,
      description: t('gons.regularCategoryDescription'),
      examples: t('gons.regularCategoryExamples')
    },
    {
      id: 'priority',
      name: t('gons.priorityCategory'),
      rate: 7,
      description: t('gons.priorityCategoryDescription'),
      examples: t('gons.priorityCategoryExamples')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('gons.title')}</h1>
            <p className="text-gray-600">{t('gons.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Important Info */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('gons.infoTitle')}
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                {t('gons.infoDescription')}
              </p>
              <p>
                <strong>{t('gons.minimumDeposit')}:</strong> {formatMRP(3)} •
                <strong>{t('gons.statePremium')}:</strong> {REGULAR_PREMIUM_RATE * 100}% {t('gons.or')} {PRIORITY_PREMIUM_RATE * 100}% •
                <strong>{t('gons.premiumLimit')}:</strong> {formatMRP(100)} {t('gons.perYear')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.savingParameters')}</h2>

          <div className="space-y-6">
            {/* Initial Deposit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('gons.initialDepositAmount')}
              </label>
              <RangeSlider
                value={parseFloat(initialDeposit) || 0}
                onChange={(val) => setInitialDeposit(String(val))}
                min={10000}
                max={5000000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#14b8a6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="initialDeposit"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  placeholder={t('gons.enterAmount')}
                  min={MIN_INITIAL_DEPOSIT}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('gons.minimum')}: {formatMRP(3)}
              </p>
            </div>

            {/* Monthly Contribution */}
            <div>
              <label htmlFor="monthlyContribution" className="block text-sm font-medium text-gray-700 mb-2">
                {t('gons.monthlyContribution')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="monthlyContribution"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder={t('gons.plannedMonthlyAmount')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Saving Period */}
            <div>
              <label htmlFor="savingPeriodYears" className="block text-sm font-medium text-gray-700 mb-2">
                {t('gons.savingPeriod')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="savingPeriodYears"
                  value={savingPeriodYears}
                  onChange={(e) => setSavingPeriodYears(e.target.value)}
                  placeholder={t('gons.numberOfYears')}
                  min="3"
                  max="20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('gons.years')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('gons.from3to20years')}
              </p>
            </div>

            {/* Child Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('gons.childSocialCategory')}
              </label>
              <div className="space-y-3">
                {childCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setChildCategory(category.id as any)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      childCategory === category.id
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {category.id === 'priority' ? (
                        <Star className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-600" />
                      )}
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <div className="text-sm opacity-75">{t('gons.statePremiumRate')}: {category.rate}%</div>
                      </div>
                    </div>
                    <p className="text-sm mb-1">{category.description}</p>
                    <div className="text-xs opacity-75">{category.examples}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Rate */}
            <div>
              <label htmlFor="bankRate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('gons.bankRewardRate')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="bankRate"
                  value={bankRate}
                  onChange={(e) => setBankRate(e.target.value)}
                  placeholder={t('gons.rewardRate')}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('gons.bankRateNote')}
              </p>
            </div>

            <div className="bg-teal-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-teal-900 mb-2">{t('gons.gonsFeatures')}:</h3>
              <div className="text-xs text-teal-800 space-y-1">
                <p>• {t('gons.feature1')}</p>
                <p>• {t('gons.feature2')}</p>
                <p>• {t('gons.feature3')}: {formatNumber(MAX_PREMIUM_BASE_YEARLY)} {t('gons.perYear')}</p>
                <p>• {t('gons.feature4')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.savingsForecast')}</h2>

          {results.isMinimumMet && results.finalAmount > 0 ? (
            <div className="space-y-6">
              {/* Final Amount */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">{t('gons.totalEducationAmount')}</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-6 h-6 text-teal-600" />
                    <span className="text-2xl font-bold text-teal-700">{formatNumber(results.finalAmount)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {t('gons.forYearsOfSaving', { years: savingPeriodYears })}
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('gons.savingsStructure')}:</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                    <div className="flex items-center space-x-2">
                      <PiggyBank className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">{t('gons.yourContributions')}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-700">{formatNumber(results.totalContributions)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">{t('gons.bankReward')}</span>
                    </div>
                    <span className="text-lg font-bold text-green-700">{formatNumber(results.bankReward)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-teal-50 rounded-lg px-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-teal-600" />
                      <span className="font-medium text-teal-900">
                        {t('gons.statePremiumWithRate', { rate: results.statePremiumRate })}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-teal-700">{formatNumber(results.totalStatePremium)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t('gons.savingsEfficiency')}:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('gons.totalReturn')}: <strong>{formatPercent(results.effectiveReturn)}</strong></div>
                  <div>{t('gons.incomeFromStateAndBank')}: <strong>{formatNumber(results.bankReward + results.totalStatePremium)}</strong></div>
                  <div>{t('gons.savingPeriodYears')}: <strong>{savingPeriodYears} {t('gons.years')}</strong></div>
                </div>
              </div>

              {/* Category Benefits */}
              <div className={`rounded-lg p-4 ${
                childCategory === 'priority' ? 'bg-teal-50 border border-teal-200' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  {childCategory === 'priority' ? (
                    <Star className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-medium mb-1 ${
                      childCategory === 'priority' ? 'text-teal-900' : 'text-blue-900'
                    }`}>
                      {childCategories.find(c => c.id === childCategory)?.name}
                    </h4>
                    <p className={`text-sm ${
                      childCategory === 'priority' ? 'text-teal-800' : 'text-blue-800'
                    }`}>
                      {childCategories.find(c => c.id === childCategory)?.description}
                      <br />
                      <strong>{t('gons.examples')}:</strong> {childCategories.find(c => c.id === childCategory)?.examples}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!results.isMinimumMet && initialDeposit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-900">{t('gons.insufficientInitialDeposit')}</h3>
                      <p className="text-red-800 text-sm">
                        {t('gons.minimumInitialDepositMessage', { amount: formatMRP(3) })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center py-8 text-gray-500">
                {t('gons.enterCorrectParameters')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Breakdown */}
      {results.yearlyBreakdown.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.savingsDynamicsByYear')}</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('gons.year')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('gons.yourContributions')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('gons.bankRewardShort')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('gons.statePremiumShort')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('gons.totalSaved')}</th>
                </tr>
              </thead>
              <tbody>
                {results.yearlyBreakdown.map((year) => (
                  <tr key={year.year} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{year.year}</td>
                    <td className="py-3 px-4 text-right text-sm">{formatNumber(year.contributions)}</td>
                    <td className="py-3 px-4 text-right text-sm text-green-600">{formatNumber(year.bankReward)}</td>
                    <td className="py-3 px-4 text-right text-sm text-teal-600">{formatNumber(year.statePremium)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatNumber(year.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Benefits and Features */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.gonsAdvantages')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('gons.stateSupport')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gons.stateSupportDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('gons.bankRewardTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gons.bankRewardDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('gons.targetedUse')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gons.targetedUseDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Examples and Tips */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.savingExamples')}</h2>

        <div className="space-y-6">
          {/* Example 1 */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('gons.example1Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('gons.parameters')}:</div>
                <div className="text-gray-900">{t('gons.firstDeposit')}: 50,000 ₸</div>
                <div className="text-gray-900">{t('gons.monthly')}: 10,000 ₸</div>
                <div className="text-gray-900">{t('gons.term')}: 10 {t('gons.years')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('gons.yourContributions')}:</div>
                <div className="text-gray-900">1,250,000 ₸</div>
                <div className="text-xs text-gray-600">50,000 + (10,000 × 120)</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('gons.income')}:</div>
                <div className="text-gray-900">{t('gons.bank')} (5.5%): ~400,000 ₸</div>
                <div className="text-gray-900">{t('gons.state')} (5%): ~62,500 ₸</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('gons.total')}:</div>
                <div className="text-lg font-bold text-blue-600">~1,712,500 ₸</div>
                <div className="text-xs text-blue-600">{t('gons.profitability')}: +37%</div>
              </div>
            </div>
          </div>

          {/* Example 2 */}
          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-3">{t('gons.example2Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('gons.parameters')}:</div>
                <div className="text-gray-900">{t('gons.firstDeposit')}: 30,000 ₸</div>
                <div className="text-gray-900">{t('gons.monthly')}: 15,000 ₸</div>
                <div className="text-gray-900">{t('gons.term')}: 8 {t('gons.years')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('gons.yourContributions')}:</div>
                <div className="text-gray-900">1,470,000 ₸</div>
                <div className="text-xs text-gray-600">30,000 + (15,000 × 96)</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('gons.income')}:</div>
                <div className="text-gray-900">{t('gons.bank')} (5.5%): ~450,000 ₸</div>
                <div className="text-gray-900">{t('gons.state')} (7%): ~103,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('gons.total')}:</div>
                <div className="text-lg font-bold text-teal-600">~2,023,000 ₸</div>
                <div className="text-xs text-teal-600">{t('gons.profitability')}: +38%</div>
              </div>
            </div>
          </div>

          {/* Example 3 */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('gons.example3Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('gons.parameters')}:</div>
                <div className="text-gray-900">{t('gons.firstDeposit')}: 100,000 ₸</div>
                <div className="text-gray-900">{t('gons.monthly')}: 50,000 ₸</div>
                <div className="text-gray-900">{t('gons.term')}: 5 {t('gons.years')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('gons.yourContributions')}:</div>
                <div className="text-gray-900">3,100,000 ₸</div>
                <div className="text-xs text-gray-600">{t('gons.veryLargeContributions')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('gons.restrictions')}:</div>
                <div className="text-gray-900">{t('gons.premiumMaxWith')} {formatNumber(MAX_PREMIUM_BASE_YEARLY)}/{t('gons.year')}</div>
                <div className="text-xs text-amber-600">{t('gons.notFromAllAmount')}</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('gons.total')}:</div>
                <div className="text-lg font-bold text-green-600">~4,050,000 ₸</div>
                <div className="text-xs text-green-600">{t('gons.profitability')}: +31%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('gons.importantInfo')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('gons.participationConditions')}:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('gons.condition1')}</li>
                  <li>{t('gons.condition2')}</li>
                  <li>{t('gons.condition3')}: {formatMRP(3)}</li>
                  <li>{t('gons.condition4')}: 3 {t('gons.years')}</li>
                  <li>{t('gons.condition5')}: 20 {t('gons.years')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('gons.fundsUsage')}:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('gons.usage1')}</li>
                  <li>{t('gons.usage2')}</li>
                  <li>{t('gons.usage3')}</li>
                  <li>{t('gons.usage4')}</li>
                  <li>{t('gons.usage5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('gons.taxBenefits')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('gons.taxBenefitsDescription')}
                <br />
                <strong>{t('gons.mrpFor2026')}:</strong> {formatNumber(MRP_2026)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Participants */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.participatingBanks')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Halyk Bank</h3>
            <div className="space-y-1 text-sm">
              <div>{t('gons.rate')}: <span className="font-medium text-green-600">5.5% {t('gons.perAnnum')}</span></div>
              <div>{t('gons.capitalization')}: {t('gons.monthly')}</div>
              <div className="text-xs text-gray-500">{t('gons.bank1Description')}</div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Kaspi Bank</h3>
            <div className="space-y-1 text-sm">
              <div>{t('gons.rate')}: <span className="font-medium text-green-600">5.0% {t('gons.perAnnum')}</span></div>
              <div>{t('gons.capitalization')}: {t('gons.monthly')}</div>
              <div className="text-xs text-gray-500">{t('gons.bank2Description')}</div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Forte Bank</h3>
            <div className="space-y-1 text-sm">
              <div>{t('gons.rate')}: <span className="font-medium text-green-600">6.0% {t('gons.perAnnum')}</span></div>
              <div>{t('gons.capitalization')}: {t('gons.monthly')}</div>
              <div className="text-xs text-gray-500">{t('gons.bank3Description')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('gons.bankChoice')}:</strong> {t('gons.bankChoiceDescription')}
          </p>
        </div>
      </div>

      {/* Calculation Tips */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gons.planningTips')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('gons.forMaximumBenefit')}:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.tip3', { amount: formatNumber(MAX_PREMIUM_BASE_YEARLY) })}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('gons.importantRestrictions')}:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.restriction1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.restriction2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.restriction3', { amount: formatNumber(MAX_PREMIUM_BASE_YEARLY) })}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('gons.restriction4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('gons.infoRelevance')}
              </h3>
              <p className="text-amber-800 text-sm">
                {t('gons.infoRelevanceDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма и экспорт */}
      {results.finalAmount > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: t('gons.yourContributions'), value: results.totalContributions },
              { name: t('gons.bankRewardTitle'), value: results.bankReward },
              { name: t('gons.statePremiumTitle'), value: results.totalStatePremium },
            ]}
            title={t('gons.savingsStructure')}
          />
          <ExportButtons
            data={{
              title: t('gons.gonsCalculation'),
              subtitle: `${t('gons.for')} ${savingPeriodYears} ${t('gons.years')}`,
              sections: [
                {
                  title: t('gons.parameters'),
                  data: [
                    { label: t('gons.initialDeposit'), value: `${parseFloat(initialDeposit || '0').toLocaleString()} ₸` },
                    { label: t('gons.monthlyContribution'), value: `${parseFloat(monthlyContribution || '0').toLocaleString()} ₸` },
                    { label: t('gons.bankRateLabel'), value: `${bankRate}%` },
                  ]
                },
                {
                  title: t('gons.results'),
                  data: [
                    { label: t('gons.totalContributions'), value: `${results.totalContributions.toLocaleString()} ₸` },
                    { label: t('gons.statePremiumTitle'), value: `${results.totalStatePremium.toLocaleString()} ₸` },
                    { label: t('gons.finalAmount'), value: `${results.finalAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="gons-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('gons.faq.q1'), answer: t('gons.faq.a1') },
          { question: t('gons.faq.q2'), answer: t('gons.faq.a2') },
          { question: t('gons.faq.q3'), answer: t('gons.faq.a3') },
          { question: t('gons.faq.q4'), answer: t('gons.faq.a4') },
          { question: t('gons.faq.q5'), answer: t('gons.faq.a5') }
        ]}
        sources={[
          { title: 'ENIC — Образовательные накопления', url: 'https://enic.kz/' },
          { title: 'Закон об образовании РК', url: 'https://online.zakon.kz/document/?doc_id=30118747' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="gons"
        calculatorTitle="Калькулятор ГОНС"
      />
    </div>
  );
}
