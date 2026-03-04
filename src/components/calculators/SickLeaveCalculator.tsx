import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HeartPulse, Calculator, Wallet, AlertTriangle, Info, TrendingDown, FileText, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function SickLeaveCalculator() {
  const { t } = useTranslation('calculators');
  const [averageMonthlyIncome, setAverageMonthlyIncome] = useState<string>('');
  const [sickDays, setSickDays] = useState<string>('');
  const [monthsWorked, setMonthsWorked] = useState<string>('12');
  const [sickLeaveType, setSickLeaveType] = useState<'regular' | 'occupational'>('regular');
  const [hasLessThanYear, setHasLessThanYear] = useState<boolean>(false);

  const [results, setResults] = useState({
    averageDailyIncome: 0,
    grossBenefit: 0,
    opv: 0,
    ipn: 0,
    vosms: 0,
    totalDeductions: 0,
    netBenefit: 0,
    isAtLimit: false,
    monthlyLimit: 0,
    effectiveRate: 0,
    daysInMonth: 0,
    proportionalLimit: 0
  });

  const MRP = 4325;
  const MAX_BENEFIT_MRP = 25;
  const MONTHLY_LIMIT = MAX_BENEFIT_MRP * MRP;
  const OPV_RATE = 0.10;
  const IPN_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const AVERAGE_DAYS_IN_MONTH = 30;

  const calculateSickLeave = () => {
    const income = parseFloat(averageMonthlyIncome) || 0;
    const days = parseFloat(sickDays) || 0;
    const months = parseFloat(monthsWorked) || 12;

    if (income <= 0 || days <= 0 || months <= 0) {
      setResults({
        averageDailyIncome: 0,
        grossBenefit: 0,
        opv: 0,
        ipn: 0,
        vosms: 0,
        totalDeductions: 0,
        netBenefit: 0,
        isAtLimit: false,
        monthlyLimit: MONTHLY_LIMIT,
        effectiveRate: 0,
        daysInMonth: 0,
        proportionalLimit: 0
      });
      return;
    }

    const totalIncome = income * Math.min(months, 12);
    const totalDaysWorked = Math.min(months, 12) * AVERAGE_DAYS_IN_MONTH;
    const averageDailyIncome = totalIncome / totalDaysWorked;

    let grossBenefit = averageDailyIncome * days;

    const daysInMonth = Math.ceil(days / AVERAGE_DAYS_IN_MONTH * AVERAGE_DAYS_IN_MONTH);
    const proportionalLimit = (MONTHLY_LIMIT / AVERAGE_DAYS_IN_MONTH) * days;

    let isAtLimit = false;

    if (sickLeaveType === 'regular') {
      if (grossBenefit > proportionalLimit) {
        grossBenefit = proportionalLimit;
        isAtLimit = true;
      }
    }

    const opv = grossBenefit * OPV_RATE;
    const ipn = grossBenefit * IPN_RATE;
    const vosms = grossBenefit * VOSMS_RATE;
    const totalDeductions = opv + ipn + vosms;
    const netBenefit = grossBenefit - totalDeductions;

    const effectiveRate = grossBenefit > 0 ? (totalDeductions / grossBenefit) * 100 : 0;

    setResults({
      averageDailyIncome: Math.round(averageDailyIncome),
      grossBenefit: Math.round(grossBenefit),
      opv: Math.round(opv),
      ipn: Math.round(ipn),
      vosms: Math.round(vosms),
      totalDeductions: Math.round(totalDeductions),
      netBenefit: Math.round(netBenefit),
      isAtLimit,
      monthlyLimit: MONTHLY_LIMIT,
      effectiveRate: Number(effectiveRate.toFixed(2)),
      daysInMonth,
      proportionalLimit: Math.round(proportionalLimit)
    });
  };

  useEffect(() => {
    calculateSickLeave();
  }, [averageMonthlyIncome, sickDays, monthsWorked, sickLeaveType, hasLessThanYear]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (!averageMonthlyIncome || !sickDays || parseFloat(averageMonthlyIncome) <= 0 || parseFloat(sickDays) <= 0) {
      return '';
    }

    return `${t('sick-leave.exportTitle')}

${t('sick-leave.exportInputData')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('sick-leave.averageMonthlyIncome')}: ${formatNumber(parseFloat(averageMonthlyIncome))}
• ${t('sick-leave.sickDaysCount')}: ${sickDays} ${t('sick-leave.days')}
• ${t('sick-leave.monthsWorked')}: ${monthsWorked} ${t('sick-leave.months')}
• ${t('sick-leave.sickLeaveType')}: ${sickLeaveType === 'regular' ? t('sick-leave.regularDisease') : t('sick-leave.occupationalDisease')}

${t('sick-leave.benefitCalculation')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('sick-leave.averageDailyIncome')}: ${formatNumber(results.averageDailyIncome)}
• ${t('sick-leave.grossBenefit')}: ${formatNumber(results.grossBenefit)}
${results.isAtLimit ? `⚠ ${t('sick-leave.limitApplied')} ${formatNumber(results.proportionalLimit)} (${sickDays} ${t('sick-leave.days')} × ${formatNumber(Math.round(MONTHLY_LIMIT / AVERAGE_DAYS_IN_MONTH))}/${t('sick-leave.day')})` : ''}

${t('sick-leave.deductions')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('sick-leave.opv')} (10%): ${formatNumber(results.opv)}
• ${t('sick-leave.ipn')} (10%): ${formatNumber(results.ipn)}
• ${t('sick-leave.vosms')} (2%): ${formatNumber(results.vosms)}
• ${t('sick-leave.totalDeductions')}: ${formatNumber(results.totalDeductions)}
• ${t('sick-leave.effectiveRate')}: ${results.effectiveRate}%

${t('sick-leave.finalPayment')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ${t('sick-leave.netBenefit')}: ${formatNumber(results.netBenefit)}

${t('sick-leave.referenceInfo')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('sick-leave.maxMonthlyPayment')}: ${formatNumber(MONTHLY_LIMIT)} (${MAX_BENEFIT_MRP} ${t('sick-leave.mrp')})
• ${t('sick-leave.mrp2026')}: ${formatNumber(MRP)}

${t('sick-leave.calculationBasis')}:
- ${t('sick-leave.laborCode')}
- ${t('sick-leave.socialCode')}
- ${t('sick-leave.currentNorms2025')}

${t('sick-leave.calculationDate')}: ${new Date().toLocaleDateString('ru-KZ')}
`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('sick-leave.title')}</h1>
            <p className="text-gray-600">{t('sick-leave.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-red-600" />
              {t('sick-leave.inputData')}
            </h2>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">{t('sick-leave.howToCalculateIncome')}</p>
                    <p>{t('sick-leave.incomeCalculationInfo')}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('sick-leave.averageMonthlyIncomeLabel')}
                </label>
                <RangeSlider
                  value={parseFloat(averageMonthlyIncome) || 0}
                  onChange={(val) => setAverageMonthlyIncome(String(val))}
                  min={100000}
                  max={2000000}
                  step={50000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#ef4444"
                />
                <input
                  type="number"
                  value={averageMonthlyIncome}
                  onChange={(e) => setAverageMonthlyIncome(e.target.value)}
                  className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder={t('sick-leave.incomePlaceholder')}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">{t('sick-leave.incomeHint')}</p>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="lessThanYear"
                  checked={hasLessThanYear}
                  onChange={(e) => {
                    setHasLessThanYear(e.target.checked);
                    if (!e.target.checked) {
                      setMonthsWorked('12');
                    }
                  }}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="lessThanYear" className="text-sm font-medium text-gray-700 cursor-pointer">
                  {t('sick-leave.lessThan12Months')}
                </label>
              </div>

              {hasLessThanYear && (
                <div className="pl-4 border-l-2 border-red-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sick-leave.monthsWorkedLabel')}
                  </label>
                  <input
                    type="number"
                    value={monthsWorked}
                    onChange={(e) => setMonthsWorked(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder={t('sick-leave.monthsPlaceholder')}
                    min="1"
                    max="12"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('sick-leave.monthsHint')}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('sick-leave.sickDaysLabel')}
                </label>
                <input
                  type="number"
                  value={sickDays}
                  onChange={(e) => setSickDays(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder={t('sick-leave.daysPlaceholder')}
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">{t('sick-leave.daysHint')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('sick-leave.sickLeaveTypeLabel')}
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSickLeaveType('regular')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      sickLeaveType === 'regular'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <HeartPulse className={`w-5 h-5 ${sickLeaveType === 'regular' ? 'text-red-600' : 'text-gray-400'}`} />
                      <h3 className="font-semibold">{t('sick-leave.regularDisease')}</h3>
                    </div>
                    <p className="text-xs text-gray-600">{t('sick-leave.regularDiseaseDescription')}</p>
                    <p className="text-xs text-red-600 mt-1 font-medium">{t('sick-leave.maxLimit')}</p>
                  </button>

                  <button
                    onClick={() => setSickLeaveType('occupational')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      sickLeaveType === 'occupational'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className={`w-5 h-5 ${sickLeaveType === 'occupational' ? 'text-red-600' : 'text-gray-400'}`} />
                      <h3 className="font-semibold">{t('sick-leave.occupationalDisease')}</h3>
                    </div>
                    <p className="text-xs text-gray-600">{t('sick-leave.occupationalDiseaseDescription')}</p>
                    <p className="text-xs text-green-600 mt-1 font-medium">{t('sick-leave.fullPaymentNoLimit')}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {results.netBenefit > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-red-600" />
                  {t('sick-leave.detailedCalculation')}
                </h2>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-900">{t('sick-leave.averageDailyWage')}</span>
                      <span className="text-lg font-bold text-blue-900">{formatNumber(results.averageDailyIncome)}</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {t('sick-leave.calculatedBasedOn')} {hasLessThanYear ? monthsWorked : '12'} {t('sick-leave.months')}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{t('sick-leave.grossAmount')}</span>
                      <span className="text-lg font-bold text-gray-900">{formatNumber(results.grossBenefit)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatNumber(results.averageDailyIncome)} × {sickDays} {t('sick-leave.days')}
                      {results.isAtLimit && ` (${t('sick-leave.limitAppliedShort')})`}
                    </p>
                  </div>

                  {results.isAtLimit && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-900">
                          <p className="font-semibold mb-1">{t('sick-leave.legislativeLimitApplied')}</p>
                          <p>
                            {t('sick-leave.maxPaymentIs')} {MAX_BENEFIT_MRP} {t('sick-leave.mrp')} {t('sick-leave.perMonth')} ({formatNumber(MONTHLY_LIMIT)}).
                            {t('sick-leave.forDays')} {sickDays} {t('sick-leave.daysLimit')} {formatNumber(results.proportionalLimit)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      {t('sick-leave.deductionsFromBenefit')}
                    </h3>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('sick-leave.opv')} (10%)</span>
                        <span className="font-medium text-gray-900">{formatNumber(results.opv)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('sick-leave.ipn')} (10%)</span>
                        <span className="font-medium text-gray-900">{formatNumber(results.ipn)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('sick-leave.vosms')} (2%)</span>
                        <span className="font-medium text-gray-900">{formatNumber(results.vosms)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                        <span className="text-gray-900">{t('sick-leave.totalDeductionsLabel')}</span>
                        <span className="text-red-600">{formatNumber(results.totalDeductions)}</span>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        {t('sick-leave.effectiveRateLabel')}: {results.effectiveRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  {t('sick-leave.referenceInformation')}
                </h2>

                <div className="space-y-4 text-sm text-gray-700">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">{t('sick-leave.legislativeBase')}</h3>
                    <ul className="space-y-1 text-blue-800">
                      <li>• {t('sick-leave.laborCodeItem')}</li>
                      <li>• {t('sick-leave.socialCodeItem')}</li>
                      <li>• {t('sick-leave.mrp2026Item')}: {formatNumber(MRP)}</li>
                      <li>• {t('sick-leave.maxPaymentItem')}: {MAX_BENEFIT_MRP} {t('sick-leave.mrp')} ({formatNumber(MONTHLY_LIMIT)}/{t('sick-leave.month')})</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">{t('sick-leave.whoPaysSickLeave')}</h3>
                    <p className="text-green-800">
                      {t('sick-leave.employerPaysInfo')}
                    </p>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <h3 className="font-semibold text-teal-900 mb-2">{t('sick-leave.specialCases')}</h3>
                    <p className="text-teal-800">
                      {t('sick-leave.specialCasesInfo')}
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">{t('sick-leave.electronicSickLeave')}</h3>
                    <p className="text-yellow-800">
                      {t('sick-leave.electronicSickLeaveInfo')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <Wallet className="w-6 h-6" />
                <h3 className="text-lg font-semibold">{t('sick-leave.finalPaymentTitle')}</h3>
              </div>

              {results.netBenefit > 0 ? (
                <>
                  <div className="mb-6">
                    <div className="text-sm opacity-90 mb-1">{t('sick-leave.amountToPay')}</div>
                    <div className="text-3xl font-bold">{formatNumber(results.netBenefit)}</div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">{t('sick-leave.grossSum')}:</span>
                      <span className="font-semibold">{formatNumber(results.grossBenefit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">{t('sick-leave.deductionsLabel')}:</span>
                      <span className="font-semibold">-{formatNumber(results.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="opacity-90">{t('sick-leave.sickDaysLabel')}:</span>
                      <span className="font-semibold">{sickDays}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <SharePrintButtons
                      title={t('sick-leave.shareTitle')}
                      description={t('sick-leave.shareDescription')}
                      results={generateExportData()}
                      disabled={!generateExportData()}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm opacity-90">{t('sick-leave.fillDataPrompt')}</p>
                </div>
              )}
            </div>

            {results.netBenefit > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  {t('sick-leave.paymentStructure')}
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('sick-leave.netPayment')}</span>
                      <span className="font-semibold text-green-600">
                        {((results.netBenefit / results.grossBenefit) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(results.netBenefit / results.grossBenefit) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t('sick-leave.deductionsLabel')}</span>
                      <span className="font-semibold text-red-600">{results.effectiveRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${results.effectiveRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-gray-500">{t('sick-leave.opv')}</div>
                        <div className="font-semibold text-gray-900">10%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">{t('sick-leave.ipn')}</div>
                        <div className="font-semibold text-gray-900">10%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-500">{t('sick-leave.vosms')}</div>
                        <div className="font-semibold text-gray-900">2%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('sick-leave.faq.q1'), answer: t('sick-leave.faq.a1') },
          { question: t('sick-leave.faq.q2'), answer: t('sick-leave.faq.a2') },
          { question: t('sick-leave.faq.q3'), answer: t('sick-leave.faq.a3') },
          { question: t('sick-leave.faq.q4'), answer: t('sick-leave.faq.a4') },
          { question: t('sick-leave.faq.q5'), answer: t('sick-leave.faq.a5') }
        ]}
        sources={[
          { title: t('sick-leave.sources.gfss'), url: 'https://gfss.kz/' },
          { title: t('sick-leave.sources.laborCode'), url: 'https://online.zakon.kz/document/?doc_id=38910832' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.netBenefit > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('sick-leave.chartLabel'), value: results.netBenefit },
            ]}
            title={t('sick-leave.chartTitle')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.netBenefit > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('sick-leave.exportReportTitle'),
              subtitle: `${sickDays} ${t('sick-leave.days')}`,
              sections: [
                {
                  title: t('sick-leave.resultsTitle'),
                  data: [
                    { label: t('sick-leave.daysOfSickness'), value: sickDays },
                    { label: t('sick-leave.averageDailyWage'), value: `${results.averageDailyIncome.toLocaleString()} ₸` },
                    { label: t('sick-leave.finalPayment'), value: `${results.netBenefit.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('sick-leave.exportFooter')
            }}
            filename="sick-leave-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="sick-leave"
        calculatorTitle={t('sick-leave.title')}
      />
    </div>
  );
}
