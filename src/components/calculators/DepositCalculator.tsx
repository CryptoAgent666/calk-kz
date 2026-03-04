import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PiggyBank, Calculator, TrendingUp, Percent, Calendar, DollarSign, Info, Target, BarChart3 } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { TaxPieChart, TrendLineChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { ScenarioComparison } from '../ui/ScenarioComparison';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function DepositCalculator() {
  const { t } = useTranslation('calculators');
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('');
  const [termValue, setTermValue] = useState<string>('');
  const [termUnit, setTermUnit] = useState<'months' | 'years'>('years');
  const [nominalRate, setNominalRate] = useState<string>('');
  const [capitalizationPeriod, setCapitalizationPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [showCharts, setShowCharts] = useState<boolean>(true);

  const [results, setResults] = useState({
    simpleInterestAmount: 0,
    simpleInterestEarnings: 0,
    compoundAmount: 0,
    compoundEarnings: 0,
    finalAmountWithContributions: 0,
    totalContributions: 0,
    totalEarningsWithContributions: 0,
    effectiveRate: 0,
    capitalizationBonus: 0,
    contributionBonus: 0
  });

  const calculateDeposit = () => {
    const principal = parseFloat(initialAmount) || 0;
    const contribution = parseFloat(monthlyContribution) || 0;
    const termInMonths = termUnit === 'years' ? (parseFloat(termValue) || 0) * 12 : parseFloat(termValue) || 0;
    const termInYears = termInMonths / 12;
    const annualRate = (parseFloat(nominalRate) || 0) / 100;

    if (principal <= 0 || termInMonths <= 0 || annualRate <= 0) {
      setResults({
        simpleInterestAmount: 0, simpleInterestEarnings: 0,
        compoundAmount: 0, compoundEarnings: 0,
        finalAmountWithContributions: 0, totalContributions: 0, totalEarningsWithContributions: 0,
        effectiveRate: 0, capitalizationBonus: 0, contributionBonus: 0
      });
      return;
    }

    const periodsPerYear = {
      'monthly': 12,
      'quarterly': 4,
      'yearly': 1
    }[capitalizationPeriod];

    const simpleInterestAmount = principal * (1 + annualRate * termInYears);
    const simpleInterestEarnings = simpleInterestAmount - principal;

    const compoundAmount = principal * Math.pow(1 + annualRate / periodsPerYear, periodsPerYear * termInYears);
    const compoundEarnings = compoundAmount - principal;

    const effectiveRate = Math.pow(1 + annualRate / periodsPerYear, periodsPerYear) - 1;

    let finalAmountWithContributions = compoundAmount;
    let totalContributions = 0;

    if (contribution > 0) {
      for (let month = 1; month <= termInMonths; month++) {
        const remainingMonths = termInMonths - month;
        const remainingYears = remainingMonths / 12;

        if (remainingYears > 0) {
          const contributionWithInterest = contribution * Math.pow(1 + annualRate / periodsPerYear, periodsPerYear * remainingYears);
          finalAmountWithContributions += contributionWithInterest;
        } else {
          finalAmountWithContributions += contribution;
        }

        totalContributions += contribution;
      }
    }

    const totalEarningsWithContributions = finalAmountWithContributions - principal - totalContributions;

    const capitalizationBonus = compoundEarnings - simpleInterestEarnings;
    const contributionBonus = finalAmountWithContributions - compoundAmount;

    setResults({
      simpleInterestAmount: Math.round(simpleInterestAmount),
      simpleInterestEarnings: Math.round(simpleInterestEarnings),
      compoundAmount: Math.round(compoundAmount),
      compoundEarnings: Math.round(compoundEarnings),
      finalAmountWithContributions: Math.round(finalAmountWithContributions),
      totalContributions: Math.round(totalContributions),
      totalEarningsWithContributions: Math.round(totalEarningsWithContributions),
      effectiveRate: effectiveRate * 100,
      capitalizationBonus: Math.round(capitalizationBonus),
      contributionBonus: Math.round(contributionBonus)
    });
  };

  useEffect(() => {
    calculateDeposit();
  }, [initialAmount, monthlyContribution, termValue, termUnit, nominalRate, capitalizationPeriod]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatPercent = (num: number) => {
    return num.toFixed(2) + '%';
  };

  const getCapitalizationPeriodText = () => {
    return t(`calculators:deposit.capitalizationOptions.${capitalizationPeriod}`);
  };

  const generateExportData = () => {
    if (results.finalAmountWithContributions === 0) return '';

    return `${t('deposit.exportParameters')}
- ${t('deposit.initialAmount')}: ${formatNumber(parseFloat(initialAmount) || 0)}
- ${t('deposit.monthlyContribution')}: ${formatNumber(parseFloat(monthlyContribution) || 0)}
- ${t('deposit.termLabel')}: ${termValue} ${termUnit === 'years' ? t('deposit.termYears') : t('deposit.termMonths')}
- ${t('deposit.nominalRate')}: ${nominalRate}%
- ${t('deposit.capitalizationPeriod')}: ${getCapitalizationPeriodText()}

${t('deposit.exportResults')}
- ${t('deposit.initialAmountLabel')}: ${formatNumber(parseFloat(initialAmount) || 0)}
${results.totalContributions > 0 ? `- ${t('deposit.totalContributions')}: ${formatNumber(results.totalContributions)}` : ''}
- ${t('deposit.earnedInterest')}: ${formatNumber(results.totalEarningsWithContributions)}
- ${t('deposit.finalAmount')}: ${formatNumber(results.finalAmountWithContributions)}

${t('deposit.exportComparison')}
- ${t('deposit.nominalRateLabel')}: ${formatPercent(parseFloat(nominalRate) || 0)}
- ${t('deposit.effectiveRateLabel')}: ${formatPercent(results.effectiveRate)}
${results.capitalizationBonus > 0 ? `- ${t('deposit.additionalIncome')}: ${formatNumber(results.capitalizationBonus)}` : ''}`;
  };

  // Данные для круговой диаграммы
  const pieChartData = results.finalAmountWithContributions > 0 ? [
    { name: 'Начальный вклад', value: parseFloat(initialAmount) || 0, color: '#0ea5e9' },
    { name: 'Пополнения', value: results.totalContributions, color: '#22c55e' },
    { name: 'Начисленные проценты', value: results.totalEarningsWithContributions, color: '#f97316' },
  ].filter(item => item.value > 0) : [];

  // Данные для графика роста
  const growthData = (() => {
    const principal = parseFloat(initialAmount) || 0;
    const contribution = parseFloat(monthlyContribution) || 0;
    const termInMonths = termUnit === 'years' ? (parseFloat(termValue) || 0) * 12 : parseFloat(termValue) || 0;
    const annualRate = (parseFloat(nominalRate) || 0) / 100;
    
    if (principal <= 0 || termInMonths <= 0) return [];
    
    const data = [];
    const years = Math.ceil(termInMonths / 12);
    
    for (let year = 0; year <= years; year++) {
      const months = Math.min(year * 12, termInMonths);
      const yearsElapsed = months / 12;
      const amount = principal * Math.pow(1 + annualRate / 12, months) + 
                    (contribution > 0 ? contribution * ((Math.pow(1 + annualRate / 12, months) - 1) / (annualRate / 12)) : 0);
      data.push({
        name: `${year} год`,
        amount: Math.round(amount),
      });
    }
    return data;
  })();

  // Данные для экспорта
  const exportDataForPDF = {
    title: t('deposit.heading'),
    subtitle: t('deposit.subtitle'),
    sections: [
      {
        title: t('deposit.parametersTitle'),
        data: [
          { label: t('deposit.initialAmount'), value: formatNumber(parseFloat(initialAmount) || 0) },
          { label: t('deposit.monthlyContribution'), value: formatNumber(parseFloat(monthlyContribution) || 0) },
          { label: t('deposit.termLabel'), value: `${termValue} ${termUnit === 'years' ? 'лет' : 'мес.'}` },
          { label: t('deposit.nominalRate'), value: `${nominalRate}%` },
        ]
      },
      {
        title: t('deposit.resultsTitle'),
        data: [
          { label: t('deposit.finalAmount'), value: formatNumber(results.finalAmountWithContributions) },
          { label: t('deposit.earnedInterest'), value: formatNumber(results.totalEarningsWithContributions) },
          { label: t('deposit.effectiveRateLabel'), value: formatPercent(results.effectiveRate) },
        ]
      }
    ],
    footer: 'calk.kz — Калькуляторы Казахстана'
  };

  // FAQ данные
  const faqItems = [
    { question: t('deposit.faq.q1'), answer: t('deposit.faq.a1') },
    { question: t('deposit.faq.q2'), answer: t('deposit.faq.a2') },
    { question: t('deposit.faq.q3'), answer: t('deposit.faq.a3') },
    { question: t('deposit.faq.q4'), answer: t('deposit.faq.a4') },
    { question: t('deposit.faq.q5'), answer: t('deposit.faq.a5') }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('deposit.heading')}</h1>
            <p className="text-gray-600">{t('deposit.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('deposit.parametersTitle')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deposit.initialAmount')}
              </label>
              <RangeSlider
                value={parseFloat(initialAmount) || 0}
                onChange={(val) => setInitialAmount(String(val))}
                min={100000}
                max={50000000}
                step={100000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="initialAmount"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder={t('deposit.initialAmountPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="monthlyContribution" className="block text-sm font-medium text-gray-700 mb-2">
                {t('deposit.monthlyContribution')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="monthlyContribution"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  placeholder={t('deposit.monthlyContributionPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deposit.termLabel')}
              </label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={termValue}
                    onChange={(e) => setTermValue(e.target.value)}
                    placeholder={t('deposit.termPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div className="flex border border-gray-300 rounded-lg w-full sm:w-auto">
                  <button
                    onClick={() => setTermUnit('months')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      termUnit === 'months'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } rounded-l-lg flex-1 sm:flex-initial`}
                  >
                    {t('deposit.termMonths')}
                  </button>
                  <button
                    onClick={() => setTermUnit('years')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      termUnit === 'years'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } rounded-r-lg flex-1 sm:flex-initial`}
                  >
                    {t('deposit.termYears')}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="nominalRate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('deposit.nominalRate')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="nominalRate"
                  value={nominalRate}
                  onChange={(e) => setNominalRate(e.target.value)}
                  placeholder={t('deposit.nominalRatePlaceholder')}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('deposit.capitalizationPeriod')}
              </label>
              <div className="space-y-2">
                {[
                  { value: 'monthly', label: t('deposit.capitalizationOptions.monthly'), description: t('deposit.capitalizationOptions.monthlyDesc') },
                  { value: 'quarterly', label: t('deposit.capitalizationOptions.quarterly'), description: t('deposit.capitalizationOptions.quarterlyDesc') },
                  { value: 'yearly', label: t('deposit.capitalizationOptions.yearly'), description: t('deposit.capitalizationOptions.yearlyDesc') }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="capitalization"
                      value={option.value}
                      checked={capitalizationPeriod === option.value}
                      onChange={(e) => setCapitalizationPeriod(e.target.value as any)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} <span className="text-gray-500">({option.description})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('deposit.capitalizationInfo')}</h3>
              <p className="text-sm text-blue-800">
                {t('deposit.capitalizationDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('deposit.finalResultTitle')}</h2>

            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('deposit.finalAmount')}</span>
                <div className="flex items-center space-x-2">
                  <Target className="w-6 h-6 text-pink-600" />
                  <span className="text-2xl font-bold text-pink-700">
                    {formatNumber(results.finalAmountWithContributions)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('deposit.includingInterest')}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('deposit.initialAmountLabel')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(parseFloat(initialAmount) || 0)}</span>
              </div>

              {results.totalContributions > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('deposit.totalContributions')}</span>
                  <span className="font-semibold text-blue-600">{formatNumber(results.totalContributions)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('deposit.earnedInterest')}</span>
                <span className="font-semibold text-green-600">{formatNumber(results.totalEarningsWithContributions)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('deposit.ratesComparisonTitle')}</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
                <div>
                  <span className="font-medium text-gray-900">{t('deposit.nominalRateLabel')}</span>
                  <div className="text-xs text-gray-500">{t('deposit.nominalRateDesc')}</div>
                </div>
                <span className="text-lg font-bold text-gray-700">{formatPercent(parseFloat(nominalRate) || 0)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                <div>
                  <span className="font-medium text-green-900">{t('deposit.effectiveRateLabel')}</span>
                  <div className="text-xs text-green-600">{t('deposit.effectiveRateDesc')} {getCapitalizationPeriodText()}</div>
                </div>
                <span className="text-lg font-bold text-green-700">{formatPercent(results.effectiveRate)}</span>
              </div>

              <div className="text-center text-sm text-gray-600">
                {t('deposit.rateDifference')} <span className="font-semibold text-green-600">
                  +{formatPercent(results.effectiveRate - (parseFloat(nominalRate) || 0))}
                </span>
              </div>
            </div>
          </div>

          {results.capitalizationBonus > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('deposit.capitalizationBonusTitle')}</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('deposit.incomeWithoutCapitalization')}</span>
                  <span className="text-gray-900">{formatNumber(results.simpleInterestEarnings)}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('deposit.incomeWithCapitalization')}</span>
                  <span className="text-green-600">{formatNumber(results.compoundEarnings)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                  <span className="font-semibold text-green-900">{t('deposit.additionalIncome')}</span>
                  <span className="text-lg font-bold text-green-700">{formatNumber(results.capitalizationBonus)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results.finalAmountWithContributions > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('deposit.exportTitle')}
            description={t('deposit.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('deposit.examplesTitle')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('deposit.bank1')}</h3>
            <div className="space-y-1 text-sm">
              <div>{t('deposit.nominalShort')} <span className="font-medium">14.1%</span></div>
              <div>{t('deposit.effectiveShort')} <span className="font-medium text-green-600">15.3%</span></div>
              <div className="text-xs text-gray-500">{t('deposit.withMonthlyCapitalization')}</div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('deposit.bank2')}</h3>
            <div className="space-y-1 text-sm">
              <div>{t('deposit.nominalShort')} <span className="font-medium">13.5%</span></div>
              <div>{t('deposit.effectiveShort')} <span className="font-medium text-green-600">14.4%</span></div>
              <div className="text-xs text-gray-500">{t('deposit.withMonthlyCapitalization')}</div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('deposit.bank3')}</h3>
            <div className="space-y-1 text-sm">
              <div>{t('deposit.nominalShort')} <span className="font-medium">12.8%</span></div>
              <div>{t('deposit.effectiveShort')} <span className="font-medium text-green-600">13.6%</span></div>
              <div className="text-xs text-gray-500">{t('deposit.withMonthlyCapitalization')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('deposit.whyEffectiveHigher')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('deposit.effectiveRateExplanation')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграммы */}
      {showCharts && pieChartData.length > 0 && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <TaxPieChart
            data={pieChartData}
            title="Структура депозита"
            formatValue={formatNumber}
          />
          
          {growthData.length > 1 && (
            <TrendLineChart
              data={growthData}
              dataKeys={[{ key: 'amount', name: 'Сумма на счете', color: '#22c55e' }]}
              title="Рост накоплений по годам"
              formatValue={(v) => formatNumber(v)}
              showArea
            />
          )}
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={faqItems}
        sources={[
          { title: t('deposit.sources.kdif'), url: 'https://www.kdif.kz/' },
          { title: t('deposit.sources.nationalBank'), url: 'https://nationalbank.kz/' },
        ]}
      />

      <div className="mt-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl shadow-sm border border-pink-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">АЕ</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-pink-900 mb-2">{t('credit.expertTitle')}</h3>
            <p className="text-pink-800 text-sm leading-relaxed">
              {t('deposit.expertText')} <strong>{t('deposit.expertName')}</strong> — {t('deposit.expertRole')} <strong>{t('deposit.expertPortal')}</strong>. {t('deposit.expertNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Экспорт результатов */}
      {results && results.finalAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт депозита',
              subtitle: `Ставка ${rate}% годовых`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Начальная сумма', value: `${parseFloat(amount).toLocaleString()} ₸` },
                    { label: 'Срок', value: `${term} мес.` },
                    { label: 'Начисленные проценты', value: `${results.interestEarned.toLocaleString()} ₸` },
                    { label: 'Итого', value: `${results.finalAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="deposit-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="deposit"
        calculatorTitle="Депозитный калькулятор"
      />
    </div>
  );
}
