import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, AlertTriangle, Calendar, Percent, TrendingUp, Info, UserCheck, Award, BookOpen, BarChart3 } from 'lucide-react';
import InputField from '../InputField';
import SharePrintButtons from '../SharePrintButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, TrendLineChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';

type LoanType = 'online' | 'shortterm' | 'installment';
type TermUnit = 'days' | 'months';

interface CalculationResults {
  totalPayment: number;
  totalInterest: number;
  dailyRate: number;
  effectiveRate: number;
  monthlyPayment: number;
  payments: Array<{ period: number; payment: number; principal: number; interest: number; balance: number }>;
}

const LOAN_TYPES = {
  online: {
    name: 'microloan.loanTypes.online.name',
    description: 'microloan.loanTypes.online.description',
    maxAmount: 194625, // 45 МРП — лимит PDL с 2026
    maxTerm: 45,
    termUnit: 'days' as TermUnit,
    typicalRate: { min: 0.1, max: 0.3 }, // с 2026 не выше 0.3%/день
    rateLabel: 'microloan.loanTypes.online.rateLabel'
  },
  shortterm: {
    name: 'microloan.loanTypes.shortterm.name',
    description: 'microloan.loanTypes.shortterm.description',
    maxAmount: 194625,
    maxTerm: 45,
    termUnit: 'days' as TermUnit,
    typicalRate: { min: 0.1, max: 0.3 },
    rateLabel: 'microloan.loanTypes.shortterm.rateLabel'
  },
  installment: {
    name: 'microloan.loanTypes.installment.name',
    description: 'microloan.loanTypes.installment.description',
    maxAmount: 3000000,
    maxTerm: 12,
    termUnit: 'months' as TermUnit,
    typicalRate: { min: 15, max: 46 }, // регулярные МФО — ГЭСВ не выше 46%
    rateLabel: 'microloan.loanTypes.installment.rateLabel'
  }
};

export default function MicroloanCalculator() {
  const { t } = useTranslation('calculators');
  const [loanType, setLoanType] = useState<LoanType>('online');
  const [amount, setAmount] = useState<string>('100000');
  const [rate, setRate] = useState<string>('0.25');
  const [term, setTerm] = useState<string>('15');
  const [commission, setCommission] = useState<string>('0');

  const [results, setResults] = useState<CalculationResults | null>(null);

  const currentLoanType = LOAN_TYPES[loanType];

  const validateAmount = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('microloan.validation.invalidAmount');
    if (num < 1000) return t('microloan.validation.minAmount');
    if (num > currentLoanType.maxAmount) return t('microloan.validation.maxAmount', { max: currentLoanType.maxAmount.toLocaleString('ru-KZ') });
    return null;
  };

  const validateRate = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('microloan.validation.invalidRate');
    if (num <= 0) return t('microloan.validation.rateGreaterThanZero');
    if (currentLoanType.termUnit === 'days' && num > 2) return t('microloan.validation.maxDailyRate');
    if (currentLoanType.termUnit === 'months' && num > 100) return t('microloan.validation.maxAnnualRate');
    return null;
  };

  const validateTerm = (value: string): string | null => {
    const num = parseInt(value);
    if (!value) return null;
    if (isNaN(num)) return t('microloan.validation.invalidTerm');
    if (num < 1) return t('microloan.validation.minTerm');
    if (num > currentLoanType.maxTerm) {
      return t('microloan.validation.maxTerm', {
        max: currentLoanType.maxTerm,
        unit: currentLoanType.termUnit === 'days' ? t('microloan.units.days') : t('microloan.units.months')
      });
    }
    return null;
  };

  const validateCommission = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('microloan.validation.invalidCommission');
    if (num < 0) return t('microloan.validation.commissionNonNegative');
    return null;
  };

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (!results) return null;

    const termLabel = currentLoanType.termUnit === 'days' ? t('microloan.units.days') : t('microloan.units.months');

    return `${t('microloan.export.title')}
========================

${t('microloan.export.loanType')}: ${t(currentLoanType.name)}

${t('microloan.export.parameters')}:
- ${t('microloan.export.loanAmount')}: ${formatNumber(parseFloat(amount) || 0)}
- ${t('microloan.export.interestRate')}: ${rate}${t(currentLoanType.rateLabel)}
- ${t('microloan.export.term')}: ${term} ${termLabel}
- ${t('microloan.export.commission')}: ${formatNumber(parseFloat(commission) || 0)}

${t('microloan.export.results')}:
- ${t('microloan.export.totalPayment')}: ${formatNumber(results.totalPayment)}
- ${t('microloan.export.overpayment')}: ${formatNumber(results.totalInterest)}
- ${t('microloan.export.dailyRate')}: ${results.dailyRate.toFixed(3)}%
- ${t('microloan.export.effectiveRate')}: ${results.effectiveRate.toFixed(1)}%
${results.monthlyPayment > 0 ? `- ${t('microloan.export.monthlyPayment')}: ${formatNumber(results.monthlyPayment)}` : ''}

${t('microloan.export.important')}:
- ${t('microloan.export.maxRate')}
- ${t('microloan.export.onlineLimit')}
- ${t('microloan.export.readContract')}

${t('microloan.export.calculatedOn')} ${new Date().toLocaleDateString('ru-KZ')}
${t('microloan.export.calculator')}: Calk.kz`;
  };

  useEffect(() => {
    const loanAmount = parseFloat(amount) || 0;
    const loanRate = parseFloat(rate) || 0;
    const loanTerm = parseInt(term) || 0;
    const loanCommission = parseFloat(commission) || 0;

    if (loanAmount > 0 && loanRate > 0 && loanTerm > 0) {
      let totalInterest: number;
      let dailyRate: number;
      let effectiveRate: number;
      let monthlyPayment = 0;
      const payments: CalculationResults['payments'] = [];

      if (currentLoanType.termUnit === 'days') {
        dailyRate = loanRate;
        totalInterest = loanAmount * (dailyRate / 100) * loanTerm;

        const maxInterest = loanAmount;
        if (loanType === 'online' && totalInterest > maxInterest) {
          totalInterest = maxInterest;
        }

        effectiveRate = (Math.pow(1 + dailyRate / 100, 365) - 1) * 100;

        let balance = loanAmount;
        const dailyPrincipal = loanAmount / loanTerm;
        for (let i = 1; i <= loanTerm; i++) {
          const interest = balance * (dailyRate / 100);
          const principal = dailyPrincipal;
          balance -= principal;
          payments.push({
            period: i,
            payment: Math.round(principal + interest),
            principal: Math.round(principal),
            interest: Math.round(interest),
            balance: Math.round(Math.max(0, balance))
          });
        }
      } else {
        const annualRate = loanRate;
        const monthlyRate = annualRate / 100 / 12;
        dailyRate = annualRate / 365;
        effectiveRate = annualRate;

        if (monthlyRate > 0) {
          monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
                          (Math.pow(1 + monthlyRate, loanTerm) - 1);
        } else {
          monthlyPayment = loanAmount / loanTerm;
        }

        totalInterest = monthlyPayment * loanTerm - loanAmount;

        let balance = loanAmount;
        for (let i = 1; i <= loanTerm; i++) {
          const interest = balance * monthlyRate;
          const principal = monthlyPayment - interest;
          balance -= principal;
          payments.push({
            period: i,
            payment: Math.round(monthlyPayment),
            principal: Math.round(principal),
            interest: Math.round(interest),
            balance: Math.round(Math.max(0, balance))
          });
        }
      }

      const totalPayment = loanAmount + totalInterest + loanCommission;

      setResults({
        totalPayment,
        totalInterest: totalInterest + loanCommission,
        dailyRate,
        effectiveRate,
        monthlyPayment,
        payments
      });
    } else {
      setResults(null);
    }
  }, [amount, rate, term, commission, loanType, currentLoanType.termUnit]);

  const getOverpaymentWarning = () => {
    if (!results) return null;
    const loanAmount = parseFloat(amount) || 0;
    const overpaymentPercent = (results.totalInterest / loanAmount) * 100;

    if (overpaymentPercent > 100) {
      return {
        level: 'danger',
        message: t('microloan.warnings.danger', { percent: overpaymentPercent.toFixed(0) })
      };
    } else if (overpaymentPercent > 50) {
      return {
        level: 'warning',
        message: t('microloan.warnings.warning', { percent: overpaymentPercent.toFixed(0) })
      };
    } else if (overpaymentPercent > 20) {
      return {
        level: 'caution',
        message: t('microloan.warnings.caution', { percent: overpaymentPercent.toFixed(0) })
      };
    }
    return null;
  };

  const warning = getOverpaymentWarning();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('microloan.title')}</h1>
            <p className="text-gray-600">{t('microloan.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('microloan.loanTypeTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.keys(LOAN_TYPES) as LoanType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setLoanType(type);
                setAmount('');
                setRate('');
                setTerm('');
              }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                loanType === type
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{t(LOAN_TYPES[type].name)}</div>
              <div className="text-sm text-gray-600 mt-1">{t(LOAN_TYPES[type].description)}</div>
              <div className="text-xs text-orange-600 mt-2">
                {t('microloan.rate')}: {LOAN_TYPES[type].typicalRate.min}-{LOAN_TYPES[type].typicalRate.max}{t(LOAN_TYPES[type].rateLabel)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <QuickAnswer calculatorId="microloan" />
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('microloan.loanParameters')}</h2>

          <div className="space-y-5">
            <div>
              <InputField
                label={t('microloan.fields.amount')}
                value={amount}
                onChange={setAmount}
                type="number"
                placeholder={`${t('microloan.upTo')} ${currentLoanType.maxAmount.toLocaleString('ru-KZ')}`}
                suffix="₸"
                validation={validateAmount}
                hint={`${t('microloan.maximum')} ${currentLoanType.maxAmount.toLocaleString('ru-KZ')} ₸`}
              />
              <RangeSlider
                value={parseFloat(amount) || 0}
                onChange={(val) => setAmount(String(val))}
                min={10000}
                max={currentLoanType.maxAmount}
                step={5000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#f97316"
              />
            </div>

            <InputField
              label={`${t('microloan.fields.rate')} (${t(currentLoanType.rateLabel)})`}
              value={rate}
              onChange={setRate}
              type="number"
              placeholder={`${currentLoanType.typicalRate.min}-${currentLoanType.typicalRate.max}`}
              step="0.1"
              suffix={currentLoanType.termUnit === 'days' ? t('microloan.perDay') : t('microloan.perYear')}
              validation={validateRate}
              hint={`${t('microloan.typicalRate')}: ${currentLoanType.typicalRate.min}-${currentLoanType.typicalRate.max}${t(currentLoanType.rateLabel)}`}
            />

            <InputField
              label={`${t('microloan.fields.term')} (${currentLoanType.termUnit === 'days' ? t('microloan.units.days') : t('microloan.units.months')})`}
              value={term}
              onChange={setTerm}
              type="number"
              placeholder={`${t('microloan.upTo')} ${currentLoanType.maxTerm}`}
              suffix={currentLoanType.termUnit === 'days' ? t('microloan.units.daysShort') : t('microloan.units.monthsShort')}
              validation={validateTerm}
              hint={`${t('microloan.maximum')} ${currentLoanType.maxTerm} ${currentLoanType.termUnit === 'days' ? t('microloan.units.days') : t('microloan.units.months')}`}
            />

            <InputField
              label={t('microloan.fields.commission')}
              value={commission}
              onChange={setCommission}
              type="number"
              placeholder="0"
              suffix="₸"
              validation={validateCommission}
              hint={t('microloan.commissionHint')}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('microloan.calculationResults')}</h2>

          {results ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Banknote className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">{t('microloan.results.totalToReturn')}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-orange-700">
                  {formatNumber(results.totalPayment)}
                </div>
              </div>

              {warning && (
                <div className={`rounded-lg p-4 flex items-start space-x-3 ${
                  warning.level === 'danger' ? 'bg-red-50 text-red-800' :
                  warning.level === 'warning' ? 'bg-amber-50 text-amber-800' :
                  'bg-yellow-50 text-yellow-800'
                }`}>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{warning.message}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('microloan.results.overpayment')}</span>
                  <span className="font-semibold text-red-600">{formatNumber(results.totalInterest)}</span>
                </div>

                {results.monthlyPayment > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('microloan.results.monthlyPayment')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.monthlyPayment)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('microloan.results.dailyRate')}</span>
                  <span className="font-semibold text-gray-900">{results.dailyRate.toFixed(3)}%</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <span>{t('microloan.results.effectiveRate')}</span>
                    <Info className="w-4 h-4 text-gray-400" />
                  </span>
                  <span className={`font-semibold ${results.effectiveRate > 100 ? 'text-red-600' : 'text-gray-900'}`}>
                    {results.effectiveRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Диаграмма структуры платежа */}
              <TaxPieChart
                data={[
                  { name: 'Основной долг', value: parseFloat(amount) || 0 },
                  { name: 'Переплата', value: results.totalInterest },
                ]}
                title="Структура выплат"
              />

              {/* Экспорт результатов */}
              <ExportButtons
                data={{
                  title: 'Расчёт микрозайма',
                  subtitle: t(currentLoanType.name),
                  sections: [
                    {
                      title: 'Параметры',
                      data: [
                        { label: 'Сумма займа', value: `${parseFloat(amount).toLocaleString()} ₸` },
                        { label: 'Ставка', value: `${rate}%` },
                        { label: 'Срок', value: `${term} ${currentLoanType.termUnit === 'days' ? 'дней' : 'мес.'}` },
                      ]
                    },
                    {
                      title: 'Результаты',
                      data: [
                        { label: 'К возврату', value: `${results.totalPayment.toLocaleString()} ₸` },
                        { label: 'Переплата', value: `${results.totalInterest.toLocaleString()} ₸` },
                        { label: 'Эффективная ставка', value: `${results.effectiveRate.toFixed(1)}%` },
                      ]
                    }
                  ],
                  footer: 'Расчёт выполнен на calk.kz'
                }}
                filename="microloan-calculation"
              />

              <SharePrintButtons
                title={t('microloan.shareTitle')}
                description={t('microloan.shareDescription')}
                results={generateExportData() || ''}
                disabled={!generateExportData()}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('microloan.enterParameters')}
            </div>
          )}
        </div>
      </div>

      {results && results.payments.length > 0 && currentLoanType.termUnit === 'months' && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span>{t('microloan.paymentSchedule.title')}</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">{t('microloan.paymentSchedule.month')}</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">{t('microloan.paymentSchedule.payment')}</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">{t('microloan.paymentSchedule.principal')}</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">{t('microloan.paymentSchedule.interest')}</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">{t('microloan.paymentSchedule.balance')}</th>
                </tr>
              </thead>
              <tbody>
                {results.payments.map((p) => (
                  <tr key={p.period} className="border-b border-gray-100">
                    <td className="py-2 px-2 font-medium">{p.period}</td>
                    <td className="py-2 px-2 text-right">{formatNumber(p.payment)}</td>
                    <td className="py-2 px-2 text-right text-green-600">{formatNumber(p.principal)}</td>
                    <td className="py-2 px-2 text-right text-red-600">{formatNumber(p.interest)}</td>
                    <td className="py-2 px-2 text-right">{formatNumber(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('microloan.popularMFO.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-3">{t('microloan.popularMFO.solva.name')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.amount')}:</span>
                <span className="font-medium">{t('microloan.popularMFO.solva.amount')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.term')}:</span>
                <span className="font-medium">{t('microloan.popularMFO.solva.term')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.rate')}:</span>
                <span className="font-medium text-orange-700">{t('microloan.popularMFO.solva.rate')}</span>
              </div>
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('microloan.popularMFO.crediton.name')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.amount')}:</span>
                <span className="font-medium">{t('microloan.popularMFO.crediton.amount')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.term')}:</span>
                <span className="font-medium">{t('microloan.popularMFO.crediton.term')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.rate')}:</span>
                <span className="font-medium text-green-700">{t('microloan.popularMFO.crediton.rate')}</span>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('microloan.popularMFO.kredit7.name')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.amount')}:</span>
                <span className="font-medium">{t('microloan.popularMFO.kredit7.amount')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.term')}:</span>
                <span className="font-medium">{t('microloan.popularMFO.kredit7.term')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('microloan.popularMFO.rate')}:</span>
                <span className="font-medium text-blue-700">{t('microloan.popularMFO.kredit7.rate')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>{t('microloan.popularMFO.warning.title')}:</strong> {t('microloan.popularMFO.warning.text')}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('microloan.legalRestrictions.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-5">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
              <Percent className="w-5 h-5" />
              <span>{t('microloan.legalRestrictions.rateRestrictions.title')}</span>
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span dangerouslySetInnerHTML={{ __html: t('microloan.legalRestrictions.rateRestrictions.maxRate') }} />
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span dangerouslySetInnerHTML={{ __html: t('microloan.legalRestrictions.rateRestrictions.onlineLimit') }} />
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span dangerouslySetInnerHTML={{ __html: t('microloan.legalRestrictions.rateRestrictions.gesv') }} />
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.legalRestrictions.rateRestrictions.noHidden')}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-5">
            <h3 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>{t('microloan.legalRestrictions.borrowerRights.title')}</span>
            </h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.legalRestrictions.borrowerRights.earlyRepayment')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.legalRestrictions.borrowerRights.cancelPeriod')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.legalRestrictions.borrowerRights.fullInfo')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.legalRestrictions.borrowerRights.complaint')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('microloan.whenToTake.title')}</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-green-800 mb-4">{t('microloan.whenToTake.suitable.title')}</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.suitable.urgent')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.suitable.confident')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.suitable.bankRefused')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.suitable.creditHistory')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-800 mb-4">{t('microloan.whenToTake.avoid.title')}</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.avoid.noPlan')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.avoid.repayDebts')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.avoid.largePurchases')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('microloan.whenToTake.avoid.bankOption')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <strong>{t('microloan.whenToTake.important.title')}:</strong> {t('microloan.whenToTake.important.text')}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-sm border border-orange-200 p-6">
        <h3 className="text-lg font-semibold text-orange-900 mb-4">{t('microloan.whatIsGESV.title')}</h3>
        <p className="text-orange-800 text-sm leading-relaxed mb-4">
          <strong>{t('microloan.whatIsGESV.definition')}</strong> - {t('microloan.whatIsGESV.description')}
        </p>
        <p className="text-orange-800 text-sm leading-relaxed">
          {t('microloan.whatIsGESV.example')} <strong>{t('microloan.whatIsGESV.exampleRate')}</strong> {t('microloan.whatIsGESV.conclusion')}
        </p>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <UserCheck className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('microloan.expert.title')}</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <span className="text-3xl font-bold text-teal-700">{t('microloan.expert.initials')}</span>
            </div>
          </div>

          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('microloan.expert.name')}</h3>
            <p className="text-teal-700 font-medium text-sm mb-3">
              {t('microloan.expert.position')}
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center space-x-1 text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full">
                <Award className="w-3.5 h-3.5" />
                <span>{t('microloan.expert.experience')}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('microloan.expert.education')}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-teal-500">
              <p className="text-gray-700 text-sm italic leading-relaxed">
                {t('microloan.expert.quote')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">200+</div>
              <div className="text-xs text-gray-600 mt-1">{t('microloan.expert.stats.calculations')}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">50+</div>
              <div className="text-xs text-gray-600 mt-1">{t('microloan.expert.stats.publications')}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">10+</div>
              <div className="text-xs text-gray-600 mt-1">{t('microloan.expert.stats.years')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-teal-800">
              <strong>{t('microloan.expert.methodology.title')}</strong> {t('microloan.expert.methodology.text')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="microloan" />
      <MethodologySection steps={getMethodology('microloan')} />
      <FAQSection
        items={[
          { question: t('microloan.faq.q1'), answer: t('microloan.faq.a1') },
          { question: t('microloan.faq.q2'), answer: t('microloan.faq.a2') },
          { question: t('microloan.faq.q3'), answer: t('microloan.faq.a3') },
          { question: t('microloan.faq.q4'), answer: t('microloan.faq.a4') },
          { question: t('microloan.faq.q5'), answer: t('microloan.faq.a5') }
        ]}
        sources={[
          { title: 'АРРФР — Реестр МФО', url: 'https://finreg.kz/' },
          { title: 'Закон о микрофинансовой деятельности', url: 'https://online.zakon.kz/document/?doc_id=31106926' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="microloan"
        calculatorTitle="Калькулятор микрокредита"
      />
      <LastUpdated calculatorId="microloan" />
    </div>
  );
}
