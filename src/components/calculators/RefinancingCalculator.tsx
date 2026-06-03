import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Calendar, Percent, BarChart3 } from 'lucide-react';
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
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';

interface CalculationResults {
  currentMonthlyPayment: number;
  currentTotalPayment: number;
  currentTotalInterest: number;
  newMonthlyPayment: number;
  newTotalPayment: number;
  newTotalInterest: number;
  monthlyDifference: number;
  totalSavings: number;
  netSavings: number;
  breakEvenMonths: number;
  isWorthIt: boolean;
}

export default function RefinancingCalculator() {
  const { t } = useTranslation('calculators');
  const [remainingBalance, setRemainingBalance] = useState<string>('5000000');
  const [currentRate, setCurrentRate] = useState<string>('18');
  const [remainingTerm, setRemainingTerm] = useState<string>('60');
  const [newRate, setNewRate] = useState<string>('12');
  const [newTerm, setNewTerm] = useState<string>('60');
  const [refinancingCosts, setRefinancingCosts] = useState<string>('0');

  const [results, setResults] = useState<CalculationResults | null>(null);

  const validateAmount = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('refinancing.validation.validAmount');
    if (num <= 0) return t('refinancing.validation.amountGreaterThanZero');
    if (num > 500000000) return t('refinancing.validation.amountTooLarge');
    return null;
  };

  const validateRate = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('refinancing.validation.validRate');
    if (num <= 0) return t('refinancing.validation.rateGreaterThanZero');
    if (num > 50) return t('refinancing.validation.rateMax50');
    return null;
  };

  const validateTerm = (value: string): string | null => {
    const num = parseInt(value);
    if (!value) return null;
    if (isNaN(num)) return t('refinancing.validation.validTerm');
    if (num <= 0) return t('refinancing.validation.termGreaterThanZero');
    if (num > 360) return t('refinancing.validation.maxTerm360');
    return null;
  };

  const validateCosts = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('refinancing.validation.validAmount');
    if (num < 0) return t('refinancing.validation.negativeAmount');
    return null;
  };

  const calculateMonthlyPayment = (principal: number, annualRate: number, months: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
           (Math.pow(1 + monthlyRate, months) - 1);
  };

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (!results) return null;

    return `${t('refinancing.export.title')}
=====================================

${t('refinancing.export.currentLoan')}:
- ${t('refinancing.export.remainingBalance')}: ${formatNumber(parseFloat(remainingBalance) || 0)}
- ${t('refinancing.export.interestRate')}: ${currentRate}${t('refinancing.export.annualPercent')}
- ${t('refinancing.export.remainingTerm')}: ${remainingTerm} ${t('refinancing.export.months')}
- ${t('refinancing.export.monthlyPayment')}: ${formatNumber(results.currentMonthlyPayment)}
- ${t('refinancing.export.totalPayment')}: ${formatNumber(results.currentTotalPayment)}
- ${t('refinancing.export.interestOverpayment')}: ${formatNumber(results.currentTotalInterest)}

${t('refinancing.export.newLoan')}:
- ${t('refinancing.export.amount')}: ${formatNumber(parseFloat(remainingBalance) || 0)}
- ${t('refinancing.export.newRate')}: ${newRate}${t('refinancing.export.annualPercent')}
- ${t('refinancing.export.newTerm')}: ${newTerm} ${t('refinancing.export.months')}
- ${t('refinancing.export.monthlyPayment')}: ${formatNumber(results.newMonthlyPayment)}
- ${t('refinancing.export.totalPayment')}: ${formatNumber(results.newTotalPayment)}
- ${t('refinancing.export.interestOverpayment')}: ${formatNumber(results.newTotalInterest)}

${t('refinancing.export.refinancingCosts')}:
- ${t('refinancing.export.feesAndExpenses')}: ${formatNumber(parseFloat(refinancingCosts) || 0)}

${t('refinancing.export.result')}:
- ${t('refinancing.export.paymentChange')}: ${results.monthlyDifference > 0 ? '-' : '+'}${formatNumber(Math.abs(results.monthlyDifference))}
- ${t('refinancing.export.interestSavings')}: ${formatNumber(results.totalSavings)}
- ${t('refinancing.export.netBenefit')}: ${formatNumber(results.netSavings)}
- ${t('refinancing.export.breakEvenPeriod')}: ${results.breakEvenMonths > 0 ? results.breakEvenMonths + ' ' + t('refinancing.export.monthsShort') : t('refinancing.export.immediatelyProfitable')}

${t('refinancing.export.conclusion')}: ${results.isWorthIt ? t('refinancing.export.refinancingProfitable') : t('refinancing.export.refinancingNotRecommended')}

${t('refinancing.export.calculatedOn')} ${new Date().toLocaleDateString('ru-KZ')}
${t('refinancing.export.calculator')}: Calk.kz`;
  };

  useEffect(() => {
    const balance = parseFloat(remainingBalance) || 0;
    const curRate = parseFloat(currentRate) || 0;
    const remTerm = parseInt(remainingTerm) || 0;
    const nRate = parseFloat(newRate) || 0;
    const nTerm = parseInt(newTerm) || 0;
    const costs = parseFloat(refinancingCosts) || 0;

    if (balance > 0 && curRate > 0 && remTerm > 0 && nRate > 0 && nTerm > 0) {
      const currentMonthly = calculateMonthlyPayment(balance, curRate, remTerm);
      const currentTotal = currentMonthly * remTerm;
      const currentInterest = currentTotal - balance;

      const newMonthly = calculateMonthlyPayment(balance, nRate, nTerm);
      const newTotal = newMonthly * nTerm;
      const newInterest = newTotal - balance;

      const monthlyDiff = currentMonthly - newMonthly;
      const totalSav = currentInterest - newInterest;
      const netSav = totalSav - costs;

      let breakEven = 0;
      if (monthlyDiff > 0 && costs > 0) {
        breakEven = Math.ceil(costs / monthlyDiff);
      }

      setResults({
        currentMonthlyPayment: currentMonthly,
        currentTotalPayment: currentTotal,
        currentTotalInterest: currentInterest,
        newMonthlyPayment: newMonthly,
        newTotalPayment: newTotal,
        newTotalInterest: newInterest,
        monthlyDifference: monthlyDiff,
        totalSavings: totalSav,
        netSavings: netSav,
        breakEvenMonths: breakEven,
        isWorthIt: netSav > 0
      });
    } else {
      setResults(null);
    }
  }, [remainingBalance, currentRate, remainingTerm, newRate, newTerm, refinancingCosts]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('refinancing.title')}</h1>
            <p className="text-gray-600">{t('refinancing.description')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="refinancing" />
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <span>{t('refinancing.currentLoan.title')}</span>
          </h2>

          <div className="space-y-5">
            <InputField
              label={t('refinancing.currentLoan.remainingBalance')}
              value={remainingBalance}
              onChange={setRemainingBalance}
              type="number"
              placeholder={t('refinancing.currentLoan.remainingBalancePlaceholder')}
              suffix="₸"
              validation={validateAmount}
              hint={t('refinancing.currentLoan.remainingBalanceHint')}
            />

            <InputField
              label={t('refinancing.currentLoan.currentRate')}
              value={currentRate}
              onChange={setCurrentRate}
              type="number"
              placeholder={t('refinancing.currentLoan.currentRatePlaceholder')}
              step="0.1"
              suffix="%"
              validation={validateRate}
              hint={t('refinancing.currentLoan.currentRateHint')}
            />

            <InputField
              label={t('refinancing.currentLoan.remainingTerm')}
              value={remainingTerm}
              onChange={setRemainingTerm}
              type="number"
              placeholder={t('refinancing.currentLoan.remainingTermPlaceholder')}
              suffix={t('refinancing.currentLoan.monthsShort')}
              validation={validateTerm}
              hint={t('refinancing.currentLoan.remainingTermHint')}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span>{t('refinancing.newLoan.title')}</span>
          </h2>

          <div className="space-y-5">
            <InputField
              label={t('refinancing.newLoan.newRate')}
              value={newRate}
              onChange={setNewRate}
              type="number"
              placeholder={t('refinancing.newLoan.newRatePlaceholder')}
              step="0.1"
              suffix="%"
              validation={validateRate}
              hint={t('refinancing.newLoan.newRateHint')}
            />

            <InputField
              label={t('refinancing.newLoan.newTerm')}
              value={newTerm}
              onChange={setNewTerm}
              type="number"
              placeholder={t('refinancing.newLoan.newTermPlaceholder')}
              suffix={t('refinancing.newLoan.monthsShort')}
              validation={validateTerm}
              hint={t('refinancing.newLoan.newTermHint')}
            />

            <InputField
              label={t('refinancing.newLoan.refinancingCosts')}
              value={refinancingCosts}
              onChange={setRefinancingCosts}
              type="number"
              placeholder="0"
              suffix="₸"
              validation={validateCosts}
              hint={t('refinancing.newLoan.refinancingCostsHint')}
            />
          </div>
        </div>
      </div>

      {results && (
        <div className="mt-8 space-y-6">
          <div className={`rounded-xl shadow-sm border p-6 ${
            results.isWorthIt
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              {results.isWorthIt ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
              <h3 className={`text-xl font-bold ${results.isWorthIt ? 'text-green-800' : 'text-red-800'}`}>
                {results.isWorthIt ? t('refinancing.results.profitable') : t('refinancing.results.notRecommended')}
              </h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className={`rounded-lg p-4 ${results.isWorthIt ? 'bg-white/70' : 'bg-white/70'}`}>
                <div className="text-sm text-gray-600 mb-1">{t('refinancing.results.netBenefit')}</div>
                <div className={`text-2xl font-bold ${results.netSavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {results.netSavings >= 0 ? '+' : ''}{formatNumber(results.netSavings)}
                </div>
              </div>
              <div className={`rounded-lg p-4 ${results.isWorthIt ? 'bg-white/70' : 'bg-white/70'}`}>
                <div className="text-sm text-gray-600 mb-1">{t('refinancing.results.paymentChange')}</div>
                <div className={`text-2xl font-bold ${results.monthlyDifference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {results.monthlyDifference >= 0 ? '-' : '+'}{formatNumber(Math.abs(results.monthlyDifference))}
                </div>
              </div>
              <div className={`rounded-lg p-4 ${results.isWorthIt ? 'bg-white/70' : 'bg-white/70'}`}>
                <div className="text-sm text-gray-600 mb-1">{t('refinancing.results.breakEvenPeriod')}</div>
                <div className="text-2xl font-bold text-gray-800">
                  {results.breakEvenMonths > 0 ? `${results.breakEvenMonths} ${t('refinancing.results.monthsShort')}` : t('refinancing.results.immediately')}
                </div>
              </div>
            </div>

            <SharePrintButtons
              title={t('refinancing.share.title')}
              description={t('refinancing.share.description')}
              results={generateExportData() || ''}
              disabled={!generateExportData()}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <span>{t('refinancing.comparison.currentLoan')}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('refinancing.comparison.monthlyPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.currentMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('refinancing.comparison.totalPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.currentTotalPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('refinancing.comparison.interestOverpayment')}</span>
                  <span className="font-semibold text-red-600">{formatNumber(results.currentTotalInterest)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Percent className="w-5 h-5 text-green-500" />
                <span>{t('refinancing.comparison.newLoan')}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('refinancing.comparison.monthlyPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.newMonthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('refinancing.comparison.totalPayment')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.newTotalPayment)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('refinancing.comparison.interestOverpayment')}</span>
                  <span className="font-semibold text-green-600">{formatNumber(results.newTotalInterest)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('refinancing.comparison.refinancingCosts')}</span>
                  <span className="font-semibold text-orange-600">{formatNumber(parseFloat(refinancingCosts) || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('refinancing.banks.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('refinancing.banks.halykBank.name')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('refinancing.banks.halykBank.refinancing')}</span>
                <span className="font-medium text-blue-700">{t('refinancing.banks.halykBank.rate')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('refinancing.banks.halykBank.commission')}</span>
                <span className="font-medium text-blue-700">{t('refinancing.banks.halykBank.commissionRate')}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {t('refinancing.banks.halykBank.description')}
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('refinancing.banks.kaspiBank.name')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('refinancing.banks.kaspiBank.refinancing')}</span>
                <span className="font-medium text-green-700">{t('refinancing.banks.kaspiBank.rate')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('refinancing.banks.kaspiBank.commission')}</span>
                <span className="font-medium text-green-700">{t('refinancing.banks.kaspiBank.commissionRate')}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {t('refinancing.banks.kaspiBank.description')}
            </div>
          </div>

          <div className="border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-3">{t('refinancing.banks.forteBank.name')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('refinancing.banks.forteBank.refinancing')}</span>
                <span className="font-medium text-teal-700">{t('refinancing.banks.forteBank.rate')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('refinancing.banks.forteBank.commission')}</span>
                <span className="font-medium text-teal-700">{t('refinancing.banks.forteBank.commissionRate')}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              {t('refinancing.banks.forteBank.description')}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('refinancing.banks.important')}</strong> {t('refinancing.banks.disclaimer')}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('refinancing.whenProfitable.title')}</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-green-800 mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{t('refinancing.whenProfitable.profitable.title')}</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.profitable.point1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.profitable.point2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.profitable.point3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.profitable.point4')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.profitable.point5')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-800 mb-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{t('refinancing.whenProfitable.notProfitable.title')}</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.notProfitable.point1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.notProfitable.point2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.notProfitable.point3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.notProfitable.point4')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.whenProfitable.notProfitable.point5')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('refinancing.costs.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-amber-50 rounded-lg p-5">
            <h3 className="font-semibold text-amber-900 mb-4">{t('refinancing.costs.typical.title')}</h3>
            <div className="space-y-3 text-sm text-amber-800">
              <div className="flex justify-between items-center">
                <span>{t('refinancing.costs.typical.issueFee')}</span>
                <span className="font-medium">{t('refinancing.costs.typical.issueFeeValue')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('refinancing.costs.typical.propertyAppraisal')}</span>
                <span className="font-medium">{t('refinancing.costs.typical.propertyAppraisalValue')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('refinancing.costs.typical.collateralInsurance')}</span>
                <span className="font-medium">{t('refinancing.costs.typical.collateralInsuranceValue')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('refinancing.costs.typical.notaryServices')}</span>
                <span className="font-medium">{t('refinancing.costs.typical.notaryServicesValue')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('refinancing.costs.typical.collateralRegistration')}</span>
                <span className="font-medium">{t('refinancing.costs.typical.collateralRegistrationValue')}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-5">
            <h3 className="font-semibold text-blue-900 mb-4">{t('refinancing.costs.required.title')}</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.costs.required.document1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.costs.required.document2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.costs.required.document3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.costs.required.document4')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('refinancing.costs.required.document5')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма сравнения и экспорт */}
      {results && (
        <div className="mt-8 space-y-6">
          <ComparisonBarChart
            data={[
              {
                name: t('refinancing.chart.currentLoan'),
                monthlyPayment: results.currentMonthlyPayment,
                totalInterest: results.currentTotalInterest
              },
              {
                name: t('refinancing.chart.refinancing'),
                monthlyPayment: results.newMonthlyPayment,
                totalInterest: results.newTotalInterest
              }
            ]}
            dataKeys={[
              { key: 'monthlyPayment', name: t('refinancing.chart.monthlyPayment'), color: '#f97316' },
              { key: 'totalInterest', name: t('refinancing.chart.totalInterest'), color: '#ef4444' }
            ]}
            title={t('refinancing.chart.title')}
            height={300}
          />
          <ExportButtons
            data={{
              title: t('refinancing.title'),
              subtitle: results.isWorthIt ? t('refinancing.results.profitable') : t('refinancing.results.notRecommended'),
              sections: [
                {
                  title: t('refinancing.chart.currentLoan'),
                  data: [
                    { label: t('refinancing.chart.monthlyPayment'), value: `${results.currentMonthlyPayment.toLocaleString()} ₸` },
                    { label: t('refinancing.chart.totalInterest'), value: `${results.currentTotalInterest.toLocaleString()} ₸` },
                  ]
                },
                {
                  title: t('refinancing.chart.refinancing'),
                  data: [
                    { label: t('refinancing.chart.newPayment'), value: `${results.newMonthlyPayment.toLocaleString()} ₸` },
                    { label: t('refinancing.chart.savings'), value: `${results.totalSavings.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'calk.kz'
            }}
            filename="refinancing-calculation"
          />
        </div>
      )}

      <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{t('refinancing.expert.initials')}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-900 mb-2">{t('refinancing.expert.title')}</h3>
            <p className="text-emerald-800 text-sm leading-relaxed">
              {t('refinancing.expert.description')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="refinancing" />
      <MethodologySection steps={getMethodology('refinancing')} />
      <FAQSection
        items={[
          { question: t('refinancing.faq.q1'), answer: t('refinancing.faq.a1') },
          { question: t('refinancing.faq.q2'), answer: t('refinancing.faq.a2') },
          { question: t('refinancing.faq.q3'), answer: t('refinancing.faq.a3') },
          { question: t('refinancing.faq.q4'), answer: t('refinancing.faq.a4') },
          { question: t('refinancing.faq.q5'), answer: t('refinancing.faq.a5') }
        ]}
        sources={[
          { title: 'Нацбанк РК — Базовая ставка', url: 'https://nationalbank.kz/ru/news/bazovaya-stavka' },
          { title: 'Сравнение условий рефинансирования', url: 'https://finprom.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="refinancing"
        calculatorTitle="Калькулятор рефинансирования"
      />
      <LastUpdated calculatorId="refinancing" />
    </div>
  );
}
