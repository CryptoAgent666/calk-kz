import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserMinus, Calculator, Info, AlertTriangle, FileText } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

export default function SeverancePayCalculator() {
  const { t } = useTranslation('calculators');

  const [monthlyIncome, setMonthlyIncome] = useState<string>('250000');
  const [workMonths, setWorkMonths] = useState<number>(12);
  const [usedVacationDays, setUsedVacationDays] = useState<number>(0);
  const [dismissalReason, setDismissalReason] = useState<'own-will' | 'employer' | 'reduction' | 'liquidation' | 'agreement'>('own-will');
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);

  const [results, setResults] = useState({
    earnedVacationDays: 0,
    unusedVacationDays: 0,
    averageDailyPay: 0,
    vacationCompensation: 0,
    severancePay: 0,
    grossTotal: 0,
    opv: 0,
    vosms: 0,
    standardDeduction: 0,
    taxableIncome: 0,
    ipn: 0,
    totalDeductions: 0,
    netTotal: 0
  });

  const MRP = 4325;
  const MZP = 85000;
  const OPV_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const IPN_RATE = 0.10;
  const STANDARD_DEDUCTION = 30 * MRP;
  const ANNUAL_VACATION_DAYS = 24;
  const CALENDAR_DAYS_PER_MONTH = 29.3;

  const calculateSeverance = () => {
    const income = parseFloat(monthlyIncome) || 0;

    if (income <= 0) {
      setResults({
        earnedVacationDays: 0,
        unusedVacationDays: 0,
        averageDailyPay: 0,
        vacationCompensation: 0,
        severancePay: 0,
        grossTotal: 0,
        opv: 0,
        vosms: 0,
        standardDeduction: 0,
        taxableIncome: 0,
        ipn: 0,
        totalDeductions: 0,
        netTotal: 0
      });
      return;
    }

    const averageDailyPay = income / CALENDAR_DAYS_PER_MONTH;

    // Vacation compensation
    const earnedVacationDays = Math.round(ANNUAL_VACATION_DAYS * workMonths / 12);
    const unusedVacationDays = Math.max(0, earnedVacationDays - usedVacationDays);
    const vacationCompensation = averageDailyPay * unusedVacationDays;

    // Severance pay depends on reason
    let severancePay = 0;
    if (dismissalReason === 'reduction' || dismissalReason === 'liquidation') {
      severancePay = income * 1; // 1 month average salary (art. 131 TK RK)
    } else if (dismissalReason === 'employer') {
      severancePay = income * 1; // 1 month compensation
    } else if (dismissalReason === 'agreement') {
      severancePay = income * 1; // Negotiable, default 1 month
    }
    // own-will = 0 severance

    const grossTotal = vacationCompensation + severancePay;

    // Deductions (apply to total)
    const opvBase = Math.min(grossTotal, 50 * MZP);
    const opv = opvBase * OPV_RATE;

    const vosmsBase = Math.min(grossTotal, 10 * MZP);
    const vosms = vosmsBase * VOSMS_RATE;

    const standardDeduction = (isResident && isPrimaryJob) ? Math.min(STANDARD_DEDUCTION, Math.max(0, grossTotal - opv - vosms)) : 0;

    const taxableIncome = Math.max(0, grossTotal - opv - vosms - standardDeduction);
    const ipn = taxableIncome * IPN_RATE;

    const totalDeductions = opv + vosms + ipn;
    const netTotal = grossTotal - totalDeductions;

    setResults({
      earnedVacationDays,
      unusedVacationDays,
      averageDailyPay: Math.round(averageDailyPay),
      vacationCompensation: Math.round(vacationCompensation),
      severancePay: Math.round(severancePay),
      grossTotal: Math.round(grossTotal),
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      standardDeduction: Math.round(standardDeduction),
      taxableIncome: Math.round(taxableIncome),
      ipn: Math.round(ipn),
      totalDeductions: Math.round(totalDeductions),
      netTotal: Math.round(netTotal)
    });
  };

  useEffect(() => {
    calculateSeverance();
  }, [monthlyIncome, workMonths, usedVacationDays, dismissalReason, isResident, isPrimaryJob]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const getDismissalReasonLabel = (reason: string) => {
    switch (reason) {
      case 'own-will': return t('severance-pay.reasonOwnWill');
      case 'agreement': return t('severance-pay.reasonAgreement');
      case 'reduction': return t('severance-pay.reasonReduction');
      case 'liquidation': return t('severance-pay.reasonLiquidation');
      case 'employer': return t('severance-pay.reasonEmployer');
      default: return '';
    }
  };

  const generateExportData = () => {
    if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) {
      return '';
    }

    return `${t('severance-pay.exportTitle')}

${t('severance-pay.exportInputData')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('severance-pay.monthlyIncomeLabel')}: ${formatNumber(parseFloat(monthlyIncome))}
• ${t('severance-pay.workMonthsLabel')}: ${workMonths} ${t('severance-pay.months')}
• ${t('severance-pay.usedVacationDaysLabel')}: ${usedVacationDays} ${t('severance-pay.days')}
• ${t('severance-pay.dismissalReasonLabel')}: ${getDismissalReasonLabel(dismissalReason)}

${t('severance-pay.calculationResults')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('severance-pay.averageDailyPay')}: ${formatNumber(results.averageDailyPay)}
• ${t('severance-pay.earnedVacationDays')}: ${results.earnedVacationDays} ${t('severance-pay.days')}
• ${t('severance-pay.unusedVacationDays')}: ${results.unusedVacationDays} ${t('severance-pay.days')}
• ${t('severance-pay.vacationCompensation')}: ${formatNumber(results.vacationCompensation)}
• ${t('severance-pay.severancePay')}: ${formatNumber(results.severancePay)}
• ${t('severance-pay.grossTotal')}: ${formatNumber(results.grossTotal)}

${t('severance-pay.deductionsTitle')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ${t('severance-pay.opv')} (10%): ${formatNumber(results.opv)}
• ${t('severance-pay.vosms')} (2%): ${formatNumber(results.vosms)}
• ${t('severance-pay.ipn')} (10%): ${formatNumber(results.ipn)}
• ${t('severance-pay.totalDeductions')}: ${formatNumber(results.totalDeductions)}

${t('severance-pay.finalPayment')}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${t('severance-pay.netTotal')}: ${formatNumber(results.netTotal)}

${t('severance-pay.calculationDate')}: ${new Date().toLocaleDateString('ru-KZ')}
`;
  };

  const dismissalReasons: { key: 'own-will' | 'agreement' | 'reduction' | 'liquidation' | 'employer'; icon: string }[] = [
    { key: 'own-will', icon: '🚶' },
    { key: 'agreement', icon: '🤝' },
    { key: 'reduction', icon: '📉' },
    { key: 'liquidation', icon: '🏚' },
    { key: 'employer', icon: '👔' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <UserMinus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('severance-pay.title')}</h1>
            <p className="text-gray-600">{t('severance-pay.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-orange-600" />
            {t('severance-pay.inputData')}
          </h2>

          <div className="space-y-6">
            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('severance-pay.monthlyIncomeLabel')}
              </label>
              <RangeSlider
                value={parseFloat(monthlyIncome) || 0}
                onChange={(val) => setMonthlyIncome(String(val))}
                min={100000}
                max={3000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#f97316"
              />
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full mt-3 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder={t('severance-pay.incomePlaceholder')}
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">{t('severance-pay.incomeHint')}</p>
            </div>

            {/* Work Months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('severance-pay.workMonthsLabel')}
              </label>
              <input
                type="number"
                value={workMonths}
                onChange={(e) => setWorkMonths(Math.max(1, Math.min(360, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder={t('severance-pay.workMonthsPlaceholder')}
                min="1"
                max="360"
              />
              <p className="text-xs text-gray-500 mt-1">{t('severance-pay.workMonthsHint')}</p>
            </div>

            {/* Used Vacation Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('severance-pay.usedVacationDaysLabel')}
              </label>
              <input
                type="number"
                value={usedVacationDays}
                onChange={(e) => setUsedVacationDays(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder={t('severance-pay.usedVacationDaysPlaceholder')}
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">{t('severance-pay.usedVacationDaysHint')}</p>
            </div>

            {/* Dismissal Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('severance-pay.dismissalReasonLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dismissalReasons.map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => setDismissalReason(key)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      dismissalReason === key
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <h3 className={`text-xs font-semibold ${dismissalReason === key ? 'text-orange-700' : 'text-gray-700'}`}>
                      {getDismissalReasonLabel(key)}
                    </h3>
                    {key !== 'own-will' && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        {t('severance-pay.severanceIncluded')}
                      </p>
                    )}
                    {key === 'own-will' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('severance-pay.noSeverance')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isResident"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="isResident" className="ml-2 block text-sm text-gray-700">
                  {t('severance-pay.isResident')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryJob"
                  checked={isPrimaryJob}
                  onChange={(e) => setIsPrimaryJob(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimaryJob" className="ml-2 block text-sm text-gray-700">
                  {t('severance-pay.isPrimaryJob')}
                </label>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">{t('severance-pay.infoTitle')}</p>
                  <p>{t('severance-pay.infoText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results gradient card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <UserMinus className="w-6 h-6" />
              <h3 className="text-lg font-semibold">{t('severance-pay.resultsTitle')}</h3>
            </div>

            {results.netTotal > 0 ? (
              <>
                <div className="mb-6">
                  <div className="text-sm opacity-90 mb-1">{t('severance-pay.amountToReceive')}</div>
                  <div className="text-3xl font-bold">{formatNumber(results.netTotal)}</div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('severance-pay.vacationCompensation')}:</span>
                    <span className="font-semibold">{formatNumber(results.vacationCompensation)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('severance-pay.severancePay')}:</span>
                    <span className="font-semibold">{formatNumber(results.severancePay)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                    <span className="opacity-90">{t('severance-pay.grossTotal')}:</span>
                    <span className="font-semibold">{formatNumber(results.grossTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/20 mt-4">
                  <div className="text-sm font-semibold opacity-90 mb-2">{t('severance-pay.deductionsTitle')}:</div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">{t('severance-pay.opv')} (10%):</span>
                    <span className="font-semibold">-{formatNumber(results.opv)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">{t('severance-pay.vosms')} (2%):</span>
                    <span className="font-semibold">-{formatNumber(results.vosms)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">{t('severance-pay.ipn')} (10%):</span>
                    <span className="font-semibold">-{formatNumber(results.ipn)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/20 pt-2">
                    <span className="opacity-90">{t('severance-pay.totalDeductions')}:</span>
                    <span className="font-semibold">-{formatNumber(results.totalDeductions)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm opacity-90">{t('severance-pay.fillDataPrompt')}</p>
              </div>
            )}
          </div>

          {/* Warning box for specific dismissal reasons */}
          {results.netTotal > 0 && (dismissalReason === 'reduction' || dismissalReason === 'liquidation') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-900">
                  <p className="font-semibold mb-1">{t('severance-pay.warningTitle')}</p>
                  <p>{t('severance-pay.warningReduction')}</p>
                </div>
              </div>
            </div>
          )}

          {results.netTotal > 0 && dismissalReason === 'employer' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-900">
                  <p className="font-semibold mb-1">{t('severance-pay.warningTitle')}</p>
                  <p>{t('severance-pay.warningEmployer')}</p>
                </div>
              </div>
            </div>
          )}

          {results.netTotal > 0 && dismissalReason === 'agreement' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">{t('severance-pay.agreementInfoTitle')}</p>
                  <p>{t('severance-pay.agreementInfoText')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed calculation card */}
          {results.netTotal > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                {t('severance-pay.detailedCalculation')}
              </h3>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-900">{t('severance-pay.averageDailyPay')}</span>
                    <span className="text-lg font-bold text-orange-900">{formatNumber(results.averageDailyPay)}</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    {formatNumber(parseFloat(monthlyIncome) || 0)} / {CALENDAR_DAYS_PER_MONTH} {t('severance-pay.days')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('severance-pay.earnedVacationDays')}</span>
                    <span className="font-semibold text-gray-900">{results.earnedVacationDays} {t('severance-pay.days')}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('severance-pay.unusedVacationDays')}</span>
                    <span className="font-semibold text-gray-900">{results.unusedVacationDays} {t('severance-pay.days')}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('severance-pay.vacationCompensation')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.vacationCompensation)}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('severance-pay.severancePay')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.severancePay)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{t('severance-pay.deductionsBreakdown')}</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('severance-pay.opv')} (10%)</span>
                    <span className="font-medium text-gray-900">{formatNumber(results.opv)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('severance-pay.vosms')} (2%)</span>
                    <span className="font-medium text-gray-900">{formatNumber(results.vosms)}</span>
                  </div>
                  {results.standardDeduction > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('severance-pay.standardDeduction')}</span>
                      <span className="font-medium text-green-600">-{formatNumber(results.standardDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('severance-pay.taxableIncome')}</span>
                    <span className="font-medium text-gray-900">{formatNumber(results.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('severance-pay.ipn')} (10%)</span>
                    <span className="font-medium text-gray-900">{formatNumber(results.ipn)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">{t('severance-pay.totalDeductions')}</span>
                    <span className="text-red-600">{formatNumber(results.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal rights info section */}
      {results.netTotal > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            {t('severance-pay.legalRightsTitle')}
          </h2>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{t('severance-pay.legislativeBase')}</h3>
              <ul className="space-y-1 text-blue-800">
                <li>{t('severance-pay.laborCodeRef')}</li>
                <li>{t('severance-pay.article131')}</li>
                <li>{t('severance-pay.article96')}</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">{t('severance-pay.employeeRightsTitle')}</h3>
              <p className="text-green-800">{t('severance-pay.employeeRightsText')}</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">{t('severance-pay.paymentDeadlineTitle')}</h3>
              <p className="text-orange-800">{t('severance-pay.paymentDeadlineText')}</p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <h3 className="font-semibold text-teal-900 mb-2">{t('severance-pay.referenceInfo')}</h3>
              <ul className="space-y-1 text-teal-800">
                <li>{t('severance-pay.mrp2026')}: {formatNumber(MRP)}</li>
                <li>{t('severance-pay.mzp2026')}: {formatNumber(MZP)}</li>
                <li>{t('severance-pay.vacationDaysPerYear')}: {ANNUAL_VACATION_DAYS} {t('severance-pay.days')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TaxPieChart */}
      {results && results.netTotal > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('severance-pay.chartNetPayment'), value: results.netTotal },
              { name: t('severance-pay.opv'), value: results.opv },
              { name: t('severance-pay.ipn'), value: results.ipn },
              { name: t('severance-pay.vosms'), value: results.vosms },
            ].filter(item => item.value > 0)}
            title={t('severance-pay.chartTitle')}
          />
        </div>
      )}

      {/* ExportButtons */}
      {results && results.netTotal > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('severance-pay.exportReportTitle'),
              subtitle: `${getDismissalReasonLabel(dismissalReason)} — ${workMonths} ${t('severance-pay.months')}`,
              sections: [
                {
                  title: t('severance-pay.exportAccruals'),
                  data: [
                    { label: t('severance-pay.vacationCompensation'), value: `${results.vacationCompensation.toLocaleString()} ₸` },
                    { label: t('severance-pay.severancePay'), value: `${results.severancePay.toLocaleString()} ₸` },
                    { label: t('severance-pay.grossTotal'), value: `${results.grossTotal.toLocaleString()} ₸` },
                  ]
                },
                {
                  title: t('severance-pay.deductionsTitle'),
                  data: [
                    { label: t('severance-pay.opv'), value: `${results.opv.toLocaleString()} ₸` },
                    { label: t('severance-pay.vosms'), value: `${results.vosms.toLocaleString()} ₸` },
                    { label: t('severance-pay.ipn'), value: `${results.ipn.toLocaleString()} ₸` },
                  ]
                },
                {
                  title: t('severance-pay.finalPayment'),
                  data: [
                    { label: t('severance-pay.netTotal'), value: `${results.netTotal.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('severance-pay.exportFooter')
            }}
            filename="severance-pay-calculation"
          />
        </div>
      )}

      {/* FAQSection */}
      <FAQSection
        items={[
          { question: t('severance-pay.faq.q1'), answer: t('severance-pay.faq.a1') },
          { question: t('severance-pay.faq.q2'), answer: t('severance-pay.faq.a2') },
          { question: t('severance-pay.faq.q3'), answer: t('severance-pay.faq.a3') },
          { question: t('severance-pay.faq.q4'), answer: t('severance-pay.faq.a4') },
          { question: t('severance-pay.faq.q5'), answer: t('severance-pay.faq.a5') },
        ]}
        sources={[
          { title: t('severance-pay.sources.laborCode'), url: 'https://online.zakon.kz/document/?doc_id=38910832' },
          { title: t('severance-pay.sources.enbek'), url: 'https://enbek.kz/' },
        ]}
      />

      {/* EmbedWidget */}
      <EmbedWidget
        calculatorId="severance-pay"
        calculatorTitle={t('severance-pay.title')}
      />
    </div>
  );
}
