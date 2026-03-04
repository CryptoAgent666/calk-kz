import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TimerOff, Calculator, TrendingDown, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

export default function EarlyRepaymentCalculator() {
  const { t } = useTranslation('calculators');

  const [loanBalance, setLoanBalance] = useState<string>('');
  const [annualRate, setAnnualRate] = useState<string>('');
  const [remainingMonths, setRemainingMonths] = useState<string>('');
  const [earlyPaymentAmount, setEarlyPaymentAmount] = useState<string>('');
  const [strategy, setStrategy] = useState<'reduce-term' | 'reduce-payment'>('reduce-term');

  const [results, setResults] = useState({
    currentMonthlyPayment: 0,
    currentTotalPayment: 0,
    currentTotalInterest: 0,
    newBalance: 0,
    newMonthlyPayment: 0,
    newTerm: 0,
    newTotalPayment: 0,
    newTotalInterest: 0,
    interestSaved: 0,
    timeSavedMonths: 0,
    savingsPercentage: 0
  });

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('ru-KZ') + ' \u20B8';
  };

  const formatMonths = (months: number): string => {
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years > 0 && rem > 0) {
      return `${years} ${t('early-repayment.years')} ${rem} ${t('early-repayment.monthsShort')}`;
    }
    if (years > 0) {
      return `${years} ${t('early-repayment.years')}`;
    }
    return `${months} ${t('early-repayment.monthsShort')}`;
  };

  const generateExportData = () => {
    if (results.currentMonthlyPayment === 0) return null;

    return {
      title: t('early-repayment.title'),
      subtitle: strategy === 'reduce-term'
        ? t('early-repayment.strategy.reduceTerm')
        : t('early-repayment.strategy.reducePayment'),
      sections: [
        {
          title: t('early-repayment.export.parameters'),
          data: [
            { label: t('early-repayment.loanBalance'), value: formatNumber(parseFloat(loanBalance) || 0) },
            { label: t('early-repayment.annualRate'), value: `${annualRate}%` },
            { label: t('early-repayment.remainingMonths'), value: `${remainingMonths} ${t('early-repayment.monthsShort')}` },
            { label: t('early-repayment.earlyPaymentAmount'), value: formatNumber(parseFloat(earlyPaymentAmount) || 0) },
          ]
        },
        {
          title: t('early-repayment.export.before'),
          data: [
            { label: t('early-repayment.results.monthlyPayment'), value: formatNumber(results.currentMonthlyPayment) },
            { label: t('early-repayment.results.totalPayment'), value: formatNumber(results.currentTotalPayment) },
            { label: t('early-repayment.results.totalInterest'), value: formatNumber(results.currentTotalInterest) },
          ]
        },
        {
          title: t('early-repayment.export.after'),
          data: [
            { label: t('early-repayment.results.monthlyPayment'), value: formatNumber(results.newMonthlyPayment) },
            { label: t('early-repayment.results.newTerm'), value: `${results.newTerm} ${t('early-repayment.monthsShort')}` },
            { label: t('early-repayment.results.totalPayment'), value: formatNumber(results.newTotalPayment) },
            { label: t('early-repayment.results.totalInterest'), value: formatNumber(results.newTotalInterest) },
          ]
        },
        {
          title: t('early-repayment.export.savings'),
          data: [
            { label: t('early-repayment.results.interestSaved'), value: formatNumber(results.interestSaved) },
            { label: t('early-repayment.results.timeSaved'), value: `${results.timeSavedMonths} ${t('early-repayment.monthsShort')}` },
            { label: t('early-repayment.results.savingsPercentage'), value: `${results.savingsPercentage.toFixed(1)}%` },
          ]
        }
      ],
      footer: 'calk.kz'
    };
  };

  useEffect(() => {
    const P = parseFloat(loanBalance) || 0;
    const rateAnnual = parseFloat(annualRate) || 0;
    const N = parseInt(remainingMonths) || 0;
    const D = parseFloat(earlyPaymentAmount) || 0;

    if (P <= 0 || rateAnnual <= 0 || N <= 0 || D <= 0 || D >= P) {
      setResults({
        currentMonthlyPayment: 0,
        currentTotalPayment: 0,
        currentTotalInterest: 0,
        newBalance: 0,
        newMonthlyPayment: 0,
        newTerm: 0,
        newTotalPayment: 0,
        newTotalInterest: 0,
        interestSaved: 0,
        timeSavedMonths: 0,
        savingsPercentage: 0
      });
      return;
    }

    const r = rateAnnual / 100 / 12;
    const powRN = Math.pow(1 + r, N);

    const currentMonthlyPayment = P * (r * powRN) / (powRN - 1);
    const currentTotalPayment = currentMonthlyPayment * N;
    const currentTotalInterest = currentTotalPayment - P;

    const newBalance = P - D;

    let newMonthlyPayment: number;
    let newTerm: number;
    let newTotalPayment: number;
    let newTotalInterest: number;
    let timeSavedMonths: number;

    if (strategy === 'reduce-term') {
      newMonthlyPayment = currentMonthlyPayment;
      const logArg = newMonthlyPayment / (newMonthlyPayment - r * newBalance);
      if (logArg <= 0) {
        setResults({
          currentMonthlyPayment: 0,
          currentTotalPayment: 0,
          currentTotalInterest: 0,
          newBalance: 0,
          newMonthlyPayment: 0,
          newTerm: 0,
          newTotalPayment: 0,
          newTotalInterest: 0,
          interestSaved: 0,
          timeSavedMonths: 0,
          savingsPercentage: 0
        });
        return;
      }
      newTerm = Math.ceil(Math.log(logArg) / Math.log(1 + r));
      newTotalPayment = newMonthlyPayment * newTerm;
      newTotalInterest = newTotalPayment - newBalance;
      timeSavedMonths = N - newTerm;
    } else {
      newTerm = N;
      const powRNewTerm = Math.pow(1 + r, newTerm);
      newMonthlyPayment = newBalance * (r * powRNewTerm) / (powRNewTerm - 1);
      newTotalPayment = newMonthlyPayment * newTerm;
      newTotalInterest = newTotalPayment - newBalance;
      timeSavedMonths = 0;
    }

    const interestSaved = currentTotalInterest - newTotalInterest;
    const savingsPercentage = currentTotalInterest > 0
      ? (interestSaved / currentTotalInterest) * 100
      : 0;

    setResults({
      currentMonthlyPayment,
      currentTotalPayment,
      currentTotalInterest,
      newBalance,
      newMonthlyPayment,
      newTerm,
      newTotalPayment,
      newTotalInterest,
      interestSaved,
      timeSavedMonths,
      savingsPercentage
    });
  }, [loanBalance, annualRate, remainingMonths, earlyPaymentAmount, strategy]);

  const hasResults = results.currentMonthlyPayment > 0;

  const pieChartData = hasResults
    ? [
        {
          name: t('early-repayment.chart.interestSaved'),
          value: Math.round(results.interestSaved),
          color: '#22c55e'
        },
        {
          name: t('early-repayment.chart.remainingInterest'),
          value: Math.round(results.newTotalInterest),
          color: '#ef4444'
        }
      ].filter(item => item.value > 0)
    : [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
            <TimerOff className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('early-repayment.title')}</h1>
            <p className="text-gray-600">{t('early-repayment.description')}</p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-violet-600" />
            </div>
            <span>{t('early-repayment.inputTitle')}</span>
          </h2>

          <div className="space-y-6">
            {/* Loan balance slider */}
            <RangeSlider
              value={parseFloat(loanBalance) || 5000000}
              onChange={(v) => setLoanBalance(String(v))}
              min={500000}
              max={50000000}
              step={500000}
              label={t('early-repayment.loanBalance')}
              formatValue={(v) => formatNumber(v)}
              color="#8b5cf6"
            />

            {/* Annual rate input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('early-repayment.annualRate')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="50"
                  placeholder={t('early-repayment.annualRatePlaceholder')}
                  className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('early-repayment.annualRateHint')}</p>
            </div>

            {/* Remaining months input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('early-repayment.remainingMonths')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={remainingMonths}
                  onChange={(e) => setRemainingMonths(e.target.value)}
                  min="1"
                  max="360"
                  placeholder={t('early-repayment.remainingMonthsPlaceholder')}
                  className="w-full px-4 py-3 pr-16 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {t('early-repayment.monthsShort')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('early-repayment.remainingMonthsHint')}</p>
            </div>

            {/* Early payment amount slider */}
            <RangeSlider
              value={parseFloat(earlyPaymentAmount) || 500000}
              onChange={(v) => setEarlyPaymentAmount(String(v))}
              min={100000}
              max={Math.max(parseFloat(loanBalance) || 5000000, 200000) - 100000}
              step={100000}
              label={t('early-repayment.earlyPaymentAmount')}
              formatValue={(v) => formatNumber(v)}
              color="#8b5cf6"
            />

            {/* Strategy toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('early-repayment.strategy.title')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setStrategy('reduce-term')}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                    strategy === 'reduce-term'
                      ? 'border-violet-500 bg-violet-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <TimerOff className={`w-5 h-5 ${strategy === 'reduce-term' ? 'text-violet-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold text-sm ${strategy === 'reduce-term' ? 'text-violet-900' : 'text-gray-700'}`}>
                      {t('early-repayment.strategy.reduceTerm')}
                    </span>
                  </div>
                  <span className={`text-xs ${strategy === 'reduce-term' ? 'text-violet-700' : 'text-gray-500'}`}>
                    {t('early-repayment.strategy.reduceTermDesc')}
                  </span>
                </button>

                <button
                  onClick={() => setStrategy('reduce-payment')}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                    strategy === 'reduce-payment'
                      ? 'border-violet-500 bg-violet-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingDown className={`w-5 h-5 ${strategy === 'reduce-payment' ? 'text-violet-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold text-sm ${strategy === 'reduce-payment' ? 'text-violet-900' : 'text-gray-700'}`}>
                      {t('early-repayment.strategy.reducePayment')}
                    </span>
                  </div>
                  <span className={`text-xs ${strategy === 'reduce-payment' ? 'text-violet-700' : 'text-gray-500'}`}>
                    {t('early-repayment.strategy.reducePaymentDesc')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <span>{t('early-repayment.resultsTitle')}</span>
          </h2>

          {hasResults ? (
            <div className="space-y-6">
              {/* Before vs After comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                  <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-2">
                    {t('early-repayment.results.before')}
                  </div>
                  <div className="text-lg font-bold text-red-800">
                    {formatNumber(results.currentMonthlyPayment)}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {t('early-repayment.results.perMonth')}
                  </div>
                  <div className="mt-2 text-xs text-red-500">
                    {remainingMonths} {t('early-repayment.monthsShort')}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">
                    {t('early-repayment.results.after')}
                  </div>
                  <div className="text-lg font-bold text-green-800">
                    {formatNumber(results.newMonthlyPayment)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {t('early-repayment.results.perMonth')}
                  </div>
                  <div className="mt-2 text-xs text-green-500">
                    {results.newTerm} {t('early-repayment.monthsShort')}
                  </div>
                </div>
              </div>

              {/* Interest saved - big green highlight */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <div className="text-sm text-green-700 mb-1">{t('early-repayment.results.interestSaved')}</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatNumber(results.interestSaved)}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  {results.savingsPercentage.toFixed(1)}% {t('early-repayment.results.ofTotalInterest')}
                </div>
              </div>

              {/* Time saved (if reduce-term) */}
              {strategy === 'reduce-term' && results.timeSavedMonths > 0 && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-200">
                  <div className="text-sm text-violet-700 mb-1">{t('early-repayment.results.timeSaved')}</div>
                  <div className="text-2xl font-bold text-violet-600">
                    {formatMonths(results.timeSavedMonths)}
                  </div>
                </div>
              )}

              {/* Detailed breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {t('early-repayment.results.detailedBreakdown')}
                </h3>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('early-repayment.results.currentMonthlyPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.currentMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('early-repayment.results.newMonthlyPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.newMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('early-repayment.results.currentTotalPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.currentTotalPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('early-repayment.results.newTotalPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.newTotalPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('early-repayment.results.currentTotalInterest')}</span>
                  <span className="font-semibold text-red-600">{formatNumber(results.currentTotalInterest)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm">{t('early-repayment.results.newTotalInterest')}</span>
                  <span className="font-semibold text-green-600">{formatNumber(results.newTotalInterest)}</span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    {strategy === 'reduce-term'
                      ? t('early-repayment.recommendation.reduceTerm')
                      : t('early-repayment.recommendation.reducePayment')
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Calculator className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">{t('early-repayment.results.empty')}</p>
              <p className="text-gray-400 text-xs mt-1">{t('early-repayment.results.emptyHint')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Kazakhstan law info section */}
      <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-sm border border-amber-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('early-repayment.law.title')}
            </h3>
            <div className="space-y-2 text-sm text-amber-800">
              <p>{t('early-repayment.law.nopenalty')}</p>
              <p>{t('early-repayment.law.notice')}</p>
              <p>{t('early-repayment.law.source')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pie chart: interest saved vs remaining interest */}
      {hasResults && pieChartData.length > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={pieChartData}
            title={t('early-repayment.chart.title')}
            formatValue={formatNumber}
            height={300}
          />
        </div>
      )}

      {/* Export buttons */}
      {hasResults && (
        <div className="mt-6">
          <ExportButtons
            data={generateExportData()!}
            filename="early-repayment-calculation"
          />
        </div>
      )}

      {/* Tips section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('early-repayment.tips.title')}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-violet-800 mb-4 flex items-center space-x-2">
              <TimerOff className="w-5 h-5" />
              <span>{t('early-repayment.tips.reduceTermTitle')}</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.tips.reduceTermPoint1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.tips.reduceTermPoint2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.tips.reduceTermPoint3')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-purple-800 mb-4 flex items-center space-x-2">
              <TrendingDown className="w-5 h-5" />
              <span>{t('early-repayment.tips.reducePaymentTitle')}</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.tips.reducePaymentPoint1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.tips.reducePaymentPoint2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.tips.reducePaymentPoint3')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* When to pay early section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('early-repayment.when.title')}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-5">
            <h3 className="font-semibold text-green-900 mb-4">{t('early-repayment.when.beneficial.title')}</h3>
            <div className="space-y-2 text-sm text-green-800">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.beneficial.point1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.beneficial.point2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.beneficial.point3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.beneficial.point4')}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-5">
            <h3 className="font-semibold text-amber-900 mb-4">{t('early-repayment.when.consider.title')}</h3>
            <div className="space-y-2 text-sm text-amber-800">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.consider.point1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.consider.point2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.consider.point3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('early-repayment.when.consider.point4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expert advice */}
      <div className="mt-8 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl shadow-sm border border-violet-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{t('early-repayment.expert.initials')}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-violet-900 mb-2">{t('early-repayment.expert.title')}</h3>
            <p className="text-violet-800 text-sm leading-relaxed">
              {t('early-repayment.expert.description')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('early-repayment.faq.q1'), answer: t('early-repayment.faq.a1') },
          { question: t('early-repayment.faq.q2'), answer: t('early-repayment.faq.a2') },
          { question: t('early-repayment.faq.q3'), answer: t('early-repayment.faq.a3') },
          { question: t('early-repayment.faq.q4'), answer: t('early-repayment.faq.a4') },
          { question: t('early-repayment.faq.q5'), answer: t('early-repayment.faq.a5') }
        ]}
        sources={[
          { title: t('early-repayment.sources.civilCode'), url: 'https://online.zakon.kz/document/?doc_id=1006061' },
          { title: t('early-repayment.sources.nbk'), url: 'https://nationalbank.kz/ru/news/bazovaya-stavka' },
        ]}
      />

      {/* Embed widget */}
      <EmbedWidget
        calculatorId="early-repayment"
        calculatorTitle={t('early-repayment.title')}
      />
    </div>
  );
}
