import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import InputField from '../InputField';
import SharePrintButtons from '../SharePrintButtons';
import { TaxPieChart, TrendLineChart, ProgressBar } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { ScenarioComparison } from '../ui/ScenarioComparison';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function CreditCalculator() {
  const { t } = useTranslation('calculators');
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(20);
  const [loanTerm, setLoanTerm] = useState<number>(24);
  const [showCharts, setShowCharts] = useState<boolean>(true);

  const [results, setResults] = useState({
    monthlyPayment: 0,
    totalPayment: 0,
    totalInterest: 0,
    payments: [] as Array<{month: number, payment: number, principal: number, interest: number, balance: number}>
  });

  const validateLoanAmount = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('credit.validation.invalidAmount');
    if (num <= 0) return t('credit.validation.amountPositive');
    if (num > 100000000) return t('credit.validation.amountTooLarge');
    return null;
  };

  const validateInterestRate = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('credit.validation.invalidRate');
    if (num <= 0) return t('credit.validation.ratePositive');
    if (num > 50) return t('credit.validation.rateMax');
    return null;
  };

  const validateLoanTerm = (value: string): string | null => {
    const num = parseInt(value);
    if (!value) return null;
    if (isNaN(num)) return t('credit.validation.invalidTerm');
    if (num <= 0) return t('credit.validation.termPositive');
    if (num > 360) return t('credit.validation.termMax');
    return null;
  };

  const generateExportData = () => {
    if (results.monthlyPayment === 0) return null;

    return `${t('credit.exportParameters')}
- ${t('credit.exportLoanAmount')} ${formatNumber(loanAmount)}
- ${t('credit.exportInterestRate')} ${interestRate}% ${t('credit.exportYearly')}
- ${t('credit.exportLoanTerm')} ${loanTerm} ${t('credit.exportMonths')}

${t('credit.exportResults')}
- ${t('credit.exportMonthlyPayment')} ${formatNumber(results.monthlyPayment)}
- ${t('credit.exportTotalPayment')} ${formatNumber(results.totalPayment)}
- ${t('credit.exportOverpayment')} ${formatNumber(results.totalInterest)}
- ${t('credit.exportOverpaymentPercent')} ${((results.totalInterest / (loanAmount || 1)) * 100).toFixed(1)}%

${t('credit.exportSchedule')}
${results.payments.slice(0, 12).map(p =>
  `${t('credit.exportMonth')} ${p.month}: ${formatNumber(p.payment)} (${t('credit.exportPrincipal')} ${formatNumber(p.principal)}, ${t('credit.exportInterest')} ${formatNumber(p.interest)}, ${t('credit.exportBalance')} ${formatNumber(p.balance)})`
).join('\n')}
${results.payments.length > 12 ? `${t('credit.andMore')} ${results.payments.length - 12} ${t('credit.payments')}` : ''}`;
  };

  const calculateCredit = (amount: number, rate: number, term: number) => {
    if (amount <= 0 || rate <= 0 || term <= 0) {
      return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0, payments: [] };
    }

    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = term;

    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - amount;

    const payments = [];
    let remainingBalance = amount;

    for (let i = 1; i <= numberOfPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      payments.push({
        month: i,
        payment: Math.round(monthlyPayment),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.round(Math.max(0, remainingBalance))
      });
    }

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      payments
    };
  };

  useEffect(() => {
    setResults(calculateCredit(loanAmount, interestRate, loanTerm));
  }, [loanAmount, interestRate, loanTerm]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  // Данные для круговой диаграммы
  const pieChartData = [
    { name: t('credit.chart.principal'), value: loanAmount, color: '#22c55e' },
    { name: t('credit.chart.interest'), value: results.totalInterest, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Данные для графика амортизации
  const amortizationData = results.payments
    .filter((_, index) => index % Math.ceil(results.payments.length / 12) === 0 || index === results.payments.length - 1)
    .map(p => ({
      name: `${p.month} ${t('credit.months')}`,
      balance: p.balance,
      principal: p.principal,
      interest: p.interest,
    }));

  // Данные для экспорта
  const exportData = {
    title: t('credit.exportTitle'),
    subtitle: t('credit.exportDescription'),
    sections: [
      {
        title: t('credit.parameters'),
        data: [
          { label: t('credit.loanAmount'), value: formatNumber(loanAmount) },
          { label: t('credit.interestRate'), value: `${interestRate}%` },
          { label: t('credit.loanTerm'), value: `${loanTerm} мес.` },
        ]
      },
      {
        title: t('credit.results.title'),
        data: [
          { label: t('credit.monthlyPayment'), value: formatNumber(results.monthlyPayment) },
          { label: t('credit.totalPayment'), value: formatNumber(results.totalPayment) },
          { label: t('credit.totalInterest'), value: formatNumber(results.totalInterest) },
          { label: t('credit.overPaymentPercent'), value: `${((results.totalInterest / (loanAmount || 1)) * 100).toFixed(1)}%` },
        ]
      }
    ],
    footer: 'calk.kz — Калькуляторы Казахстана'
  };

  // FAQ данные
  const faqItems = [
    { question: t('credit.faq.q1'), answer: t('credit.faq.a1') },
    { question: t('credit.faq.q2'), answer: t('credit.faq.a2') },
    { question: t('credit.faq.q3'), answer: t('credit.faq.a3') },
    { question: t('credit.faq.q4'), answer: t('credit.faq.a4') },
    { question: t('credit.faq.q5'), answer: t('credit.faq.a5') }
  ];

  // Методология расчета
  const methodologySteps = [
    {
      step: 1,
      title: t('credit.methodology.step1Title'),
      description: t('credit.methodology.step1Desc'),
      formula: t('credit.methodology.step1Formula')
    },
    {
      step: 2,
      title: t('credit.methodology.step2Title'),
      description: t('credit.methodology.step2Desc'),
      formula: 'P = S × (r × (1+r)^n) / ((1+r)^n - 1)'
    },
    {
      step: 3,
      title: t('credit.methodology.step3Title'),
      description: t('credit.methodology.step3Desc'),
      formula: t('credit.methodology.step3Formula')
    },
    {
      step: 4,
      title: t('credit.methodology.step4Title'),
      description: t('credit.methodology.step4Desc'),
      formula: t('credit.methodology.step4Formula')
    }
  ];

  // Параметры для сравнения сценариев
  const scenarioParamFields = [
    { key: 'amount', label: t('credit.scenarios.amount'), type: 'number' as const, min: 100000, max: 50000000, step: 100000, suffix: '₸' },
    { key: 'rate', label: t('credit.scenarios.rate'), type: 'number' as const, min: 5, max: 50, step: 0.5, suffix: '%' },
    { key: 'term', label: t('credit.scenarios.term'), type: 'number' as const, min: 6, max: 360, step: 6, suffix: t('credit.months') },
  ];

  const scenarioResultFields = [
    { key: 'monthlyPayment', label: t('credit.scenarios.monthlyPayment'), format: formatNumber, highlight: true },
    { key: 'totalPayment', label: t('credit.scenarios.totalPayment'), format: formatNumber },
    { key: 'totalInterest', label: t('credit.scenarios.overpayment'), format: formatNumber, higherIsBetter: false },
    { key: 'overpaymentPercent', label: t('credit.scenarios.overpaymentPercent'), format: (v: number) => `${v.toFixed(1)}%`, higherIsBetter: false },
  ];

  const calculateScenarioResults = (params: Record<string, number | string>) => {
    const amount = Number(params.amount) || 0;
    const rate = Number(params.rate) || 0;
    const term = Number(params.term) || 0;
    const result = calculateCredit(amount, rate, term);
    return {
      monthlyPayment: result.monthlyPayment,
      totalPayment: result.totalPayment,
      totalInterest: result.totalInterest,
      overpaymentPercent: amount > 0 ? (result.totalInterest / amount) * 100 : 0,
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('credit.heading')}</h1>
            <p className="text-gray-600">{t('credit.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="credit" />

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('credit.parameters')}</h2>

          <div className="space-y-6">
            {/* Интерактивные слайдеры */}
            <div>
              <RangeSlider
                value={loanAmount}
                onChange={setLoanAmount}
                min={100000}
                max={20000000}
                step={100000}
                label={t('credit.loanAmount')}
                formatValue={(v) => formatNumber(v)}
                color="#0ea5e9"
              />
            </div>

            <div>
              <RangeSlider
                value={interestRate}
                onChange={setInterestRate}
                min={5}
                max={50}
                step={0.5}
                label={t('credit.interestRate')}
                formatValue={(v) => `${v}%`}
                color="#f97316"
              />
            </div>

            <div>
              <RangeSlider
                value={loanTerm}
                onChange={setLoanTerm}
                min={6}
                max={120}
                step={6}
                label={t('credit.loanTerm')}
                formatValue={(v) => `${v} мес.`}
                color="#8b5cf6"
              />
            </div>

            {/* Точный ввод */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3">{t('credit.exactInputLabel', 'Или введите точные значения:')}</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Сумма"
                />
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ставка"
                  step="0.1"
                />
                <input
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value) || 0)}
                  className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Срок"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('credit.results.title')}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className={`p-2 rounded-lg transition-colors ${showCharts ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                title={showCharts ? 'Скрыть диаграммы' : 'Показать диаграммы'}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <ExportButtons data={exportData} filename="credit-calculation" compact />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{t('credit.monthlyPayment')}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">
                {formatNumber(results.monthlyPayment)}
              </div>
            </div>

            {/* Прогресс-бар переплаты */}
            {loanAmount > 0 && results.totalInterest > 0 && (
              <div className="space-y-2">
                <ProgressBar
                  value={results.totalInterest}
                  max={results.totalPayment}
                  label="Доля переплаты в общей сумме"
                  color="#ef4444"
                />
              </div>
            )}

            {results.monthlyPayment > 0 && (
              <SharePrintButtons
                title={t('credit.exportTitle')}
                description={t('credit.exportDescription')}
                results={generateExportData() || ''}
                disabled={!generateExportData()}
              />
            )}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm sm:text-base text-gray-600">{t('credit.totalPayment')}</span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatNumber(results.totalPayment)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm sm:text-base text-gray-600">{t('credit.totalInterest')}</span>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-red-600 text-sm sm:text-base">{formatNumber(results.totalInterest)}</span>
                </div>
              </div>
            </div>

            {loanAmount > 0 && results.totalPayment > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('credit.overPaymentPercent')}</h3>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {((results.totalInterest / loanAmount) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('credit.paymentSchedule')}</h2>

          {results.payments.length > 0 ? (
            <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
              {results.payments.slice(0, 12).map((payment) => (
                <div key={payment.month} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-xs sm:text-sm">
                  <span className="font-medium text-gray-700">{payment.month} {t('credit.months')}</span>
                  <div className="text-right">
                    <span className="text-gray-900 block">{formatNumber(payment.payment)}</span>
                    <span className="text-xs text-gray-500">
                      ОД: {formatNumber(payment.principal)} | %: {formatNumber(payment.interest)}
                    </span>
                  </div>
                </div>
              ))}
              {results.payments.length > 12 && (
                <div className="text-center py-2 text-gray-500 text-xs sm:text-sm">
                  {t('credit.andMore')} {results.payments.length - 12} {t('credit.payments')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
              {t('credit.paymentScheduleEmpty')}
            </div>
          )}
        </div>
      </div>

      {/* Диаграммы */}
      {showCharts && loanAmount > 0 && results.totalPayment > 0 && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <TaxPieChart
            data={pieChartData}
            title={t('credit.chart.paymentStructure')}
            formatValue={formatNumber}
          />
          
          {amortizationData.length > 0 && (
            <TrendLineChart
              data={amortizationData}
              dataKeys={[
                { key: 'balance', name: t('credit.chart.remainingDebt'), color: '#0ea5e9' },
              ]}
              title={t('credit.chart.debtRepayment')}
              formatValue={(v) => formatNumber(v)}
              showArea
            />
          )}
        </div>
      )}

      {/* Сравнение сценариев */}
      <ScenarioComparison
        title={t('credit.scenarios.compareTitle')}
        paramFields={scenarioParamFields}
        resultFields={scenarioResultFields}
        calculateResults={calculateScenarioResults}
        defaultParams={{ amount: loanAmount, rate: interestRate, term: loanTerm }}
        maxScenarios={3}
      />

      {/* Методология */}
      <CalculatorExamples calculatorId="credit" />
      <MethodologySection
        title={t('credit.methodology.title')}
        steps={methodologySteps}
      />

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('credit.bankRates')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('credit.halykBank')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('credit.consumerLoan')}</span>
                <span className="font-medium text-blue-700">16-24%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credit.autoLoan')}</span>
                <span className="font-medium text-blue-700">18-26%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credit.pledgeLoan')}</span>
                <span className="font-medium text-blue-700">14-20%</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {t('credit.bankInfo.halyk')}
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('credit.kaspiBank')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('credit.expressLoan')}</span>
                <span className="font-medium text-green-700">22-35%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credit.kaspiRed')}</span>
                <span className="font-medium text-green-700">39-49%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credit.autoLoan')}</span>
                <span className="font-medium text-green-700">19-28%</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {t('credit.bankInfo.kaspi')}
            </div>
          </div>

          <div className="border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-3">{t('credit.forteBank')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('credit.consumerLoan')}</span>
                <span className="font-medium text-teal-700">15-22%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credit.pledgeRealEstate')}</span>
                <span className="font-medium text-teal-700">12-18%</span>
              </div>
              <div className="flex justify-between">
                <span>{t('credit.businessLoan')}</span>
                <span className="font-medium text-teal-700">14-25%</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {t('credit.bankInfo.forte')}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('credit.bankRatesNote')}</strong> {t('credit.bankRatesText')}
          </p>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={faqItems}
        sources={[
          { title: 'Закон о банках РК', url: 'https://online.zakon.kz/document/?doc_id=31547359' },
          { title: 'ПКБ — Кредитная история', url: 'https://www.pkb.kz/' },
        ]}
      />

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('credit.tipsTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('credit.bestConditions')}</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.tips.creditHistory')}</strong> {t('credit.tips.creditHistoryText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.tips.downPayment')}</strong> {t('credit.tips.downPaymentText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.tips.pledge')}</strong> {t('credit.tips.pledgeText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.tips.salary')}</strong> {t('credit.tips.salaryText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.tips.compare')}</strong> {t('credit.tips.compareText')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('credit.importantPoints')}</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.warnings.effectiveRate')}</strong> {t('credit.warnings.effectiveRateText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.warnings.insurance')}</strong> {t('credit.warnings.insuranceText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.warnings.foreignCurrency')}</strong> {t('credit.warnings.foreignCurrencyText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.warnings.earlyRepayment')}</strong> {t('credit.warnings.earlyRepaymentText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('credit.warnings.paymentCapacity')}</strong> {t('credit.warnings.paymentCapacityText')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('credit.earlyRepaymentTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-3">{t('credit.earlyBenefitsTitle')}</h3>
            <div className="space-y-2 text-sm text-green-800">
              <div><strong>{t('credit.earlyBenefits.savings')}</strong> {t('credit.earlyBenefits.savingsText')}</div>
              <div><strong>{t('credit.earlyBenefits.reduction')}</strong> {t('credit.earlyBenefits.reductionText')}</div>
              <div><strong>{t('credit.earlyBenefits.history')}</strong> {t('credit.earlyBenefits.historyText')}</div>
              <div><strong>{t('credit.earlyBenefits.peace')}</strong> {t('credit.earlyBenefits.peaceText')}</div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-6">
            <h3 className="font-semibold text-amber-900 mb-3">{t('credit.earlyConsiderationsTitle')}</h3>
            <div className="space-y-2 text-sm text-amber-800">
              <div><strong>{t('credit.earlyConsiderations.lowRate')}</strong> {t('credit.earlyConsiderations.lowRateText')}</div>
              <div><strong>{t('credit.earlyConsiderations.taxDeductions')}</strong> {t('credit.earlyConsiderations.taxDeductionsText')}</div>
              <div><strong>{t('credit.earlyConsiderations.liquidity')}</strong> {t('credit.earlyConsiderations.liquidityText')}</div>
              <div><strong>{t('credit.earlyConsiderations.investment')}</strong> {t('credit.earlyConsiderations.investmentText')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">{t('credit.earlyExample')}</h4>
          <p className="text-sm text-blue-800">
            {t('credit.earlyExampleText')} <strong>{t('credit.earlyExampleAmount')}</strong> {t('credit.earlyExampleNote')}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-sm border border-blue-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">АЕ</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('credit.expertTitle')}</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              {t('credit.expertText')} <strong>{t('credit.expertName')}</strong> — {t('credit.expertRole')} <strong>{t('credit.expertPortal')}</strong>. {t('credit.expertNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Встраиваемый виджет */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="credit"
        calculatorTitle="Кредитный калькулятор"
      />
      <LastUpdated calculatorId="credit" />
    </div>
  );
}
