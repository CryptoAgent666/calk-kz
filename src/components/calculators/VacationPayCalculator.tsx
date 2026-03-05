import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Palmtree, Calculator, Info, AlertTriangle } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

export default function VacationPayCalculator() {
  const { t } = useTranslation('calculators');

  const [monthlyIncome, setMonthlyIncome] = useState<string>('250000');
  const [workMonths, setWorkMonths] = useState<number>(12);
  const [vacationDays, setVacationDays] = useState<number>(24);
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);

  const [results, setResults] = useState({
    averageDailyPay: 0,
    grossVacationPay: 0,
    opv: 0,
    vosms: 0,
    taxableIncome: 0,
    standardDeduction: 0,
    ipn: 0,
    totalDeductions: 0,
    netVacationPay: 0,
    effectiveRate: 0
  });

  const MRP = 4325;
  const MZP = 85000;
  const OPV_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const IPN_RATE = 0.10;
  const STANDARD_DEDUCTION = 30 * MRP;
  const DEFAULT_VACATION_DAYS = 24;
  const WORKING_DAYS_PER_MONTH = 29.3;
  const OPV_MAX_BASE = 50 * MZP;
  const VOSMS_MAX_BASE = 10 * MZP;

  const calculateVacationPay = () => {
    const income = parseFloat(monthlyIncome) || 0;

    if (income <= 0 || workMonths <= 0 || vacationDays <= 0) {
      setResults({
        averageDailyPay: 0,
        grossVacationPay: 0,
        opv: 0,
        vosms: 0,
        taxableIncome: 0,
        standardDeduction: 0,
        ipn: 0,
        totalDeductions: 0,
        netVacationPay: 0,
        effectiveRate: 0
      });
      return;
    }

    const totalIncome = income * workMonths;
    const averageDailyPay = totalIncome / (workMonths * WORKING_DAYS_PER_MONTH);
    const grossVacationPay = averageDailyPay * vacationDays;

    const opvBase = Math.min(grossVacationPay, OPV_MAX_BASE);
    const opv = opvBase * OPV_RATE;

    const vosmsBase = Math.min(grossVacationPay, VOSMS_MAX_BASE);
    const vosms = vosmsBase * VOSMS_RATE;

    const standardDeduction = (isResident && isPrimaryJob)
      ? Math.min(STANDARD_DEDUCTION, grossVacationPay - opv - vosms)
      : 0;

    const taxableIncome = Math.max(0, grossVacationPay - opv - vosms - standardDeduction);
    const ipn = taxableIncome * IPN_RATE;

    const totalDeductions = opv + vosms + ipn;
    const netVacationPay = grossVacationPay - totalDeductions;
    const effectiveRate = grossVacationPay > 0 ? (totalDeductions / grossVacationPay) * 100 : 0;

    setResults({
      averageDailyPay: Math.round(averageDailyPay),
      grossVacationPay: Math.round(grossVacationPay),
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      taxableIncome: Math.round(taxableIncome),
      standardDeduction: Math.round(standardDeduction),
      ipn: Math.round(ipn),
      totalDeductions: Math.round(totalDeductions),
      netVacationPay: Math.round(netVacationPay),
      effectiveRate: Number(effectiveRate.toFixed(2))
    });
  };

  useEffect(() => {
    calculateVacationPay();
  }, [monthlyIncome, workMonths, vacationDays, isResident, isPrimaryJob]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Palmtree className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('vacation-pay.title')}</h1>
            <p className="text-gray-600">{t('vacation-pay.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-emerald-600" />
            {t('vacation-pay.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Monthly income slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vacation-pay.monthlyIncome')}
              </label>
              <RangeSlider
                value={parseFloat(monthlyIncome) || 0}
                onChange={(val) => setMonthlyIncome(String(val))}
                min={100000}
                max={3000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#10b981"
              />
              <input
                type="number"
                id="monthlyIncome"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder={t('vacation-pay.monthlyIncomePlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">{t('vacation-pay.monthlyIncomeHint')}</p>
            </div>

            {/* Work months slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vacation-pay.workMonths')}
              </label>
              <RangeSlider
                value={workMonths}
                onChange={(val) => setWorkMonths(val)}
                min={1}
                max={12}
                step={1}
                formatValue={(v) => `${v}`}
                color="#10b981"
              />
              <p className="text-xs text-gray-500 mt-1">{t('vacation-pay.workMonthsHint')}</p>
            </div>

            {/* Vacation days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vacation-pay.vacationDays')}
              </label>
              <input
                type="number"
                id="vacationDays"
                value={vacationDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setVacationDays(Math.min(56, Math.max(1, val)));
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                min="1"
                max="56"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('vacation-pay.vacationDaysHint', { days: DEFAULT_VACATION_DAYS })}
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isResident"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="isResident" className="ml-2 block text-sm text-gray-700">
                  {t('vacation-pay.isResident')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryJob"
                  checked={isPrimaryJob}
                  onChange={(e) => setIsPrimaryJob(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimaryJob" className="ml-2 block text-sm text-gray-700">
                  {t('vacation-pay.isPrimaryJob')}
                </label>
              </div>
            </div>

            {/* Reference rates info box */}
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-emerald-900 mb-2">{t('vacation-pay.currentRates')}</h3>
              <div className="text-xs text-emerald-800 space-y-1">
                <div>• {t('vacation-pay.opvRate')}: 10% ({t('vacation-pay.maxBase')} 50 MZP)</div>
                <div>• {t('vacation-pay.vosmsRate')}: 2% ({t('vacation-pay.maxBase')} 10 MZP)</div>
                <div>• {t('vacation-pay.ipnRate')}: 10%</div>
                <div>• {t('vacation-pay.standardDeductionInfo')}: 30 MRP ({formatNumber(STANDARD_DEDUCTION)})</div>
                <div>• MRP 2026: {formatNumber(MRP)}</div>
                <div>• MZP 2026: {formatNumber(MZP)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results card */}
        <div className="space-y-6">
          {/* Main result - gradient card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <Palmtree className="w-6 h-6" />
              <h3 className="text-lg font-semibold">{t('vacation-pay.resultTitle')}</h3>
            </div>

            {results.netVacationPay > 0 ? (
              <>
                <div className="mb-6">
                  <div className="text-sm opacity-90 mb-1">{t('vacation-pay.netVacationPay')}</div>
                  <div className="text-3xl font-bold">{formatNumber(results.netVacationPay)}</div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('vacation-pay.grossVacationPay')}:</span>
                    <span className="font-semibold">{formatNumber(results.grossVacationPay)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('vacation-pay.totalDeductions')}:</span>
                    <span className="font-semibold">-{formatNumber(results.totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('vacation-pay.vacationDaysLabel')}:</span>
                    <span className="font-semibold">{vacationDays}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('vacation-pay.effectiveRate')}:</span>
                    <span className="font-semibold">{results.effectiveRate}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm opacity-90">{t('vacation-pay.fillDataPrompt')}</p>
              </div>
            )}
          </div>

          {/* Detailed breakdown */}
          {results.netVacationPay > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('vacation-pay.detailedBreakdown')}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('vacation-pay.averageDailyPay')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.averageDailyPay)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('vacation-pay.grossVacationPay')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.grossVacationPay)}</span>
                </div>

                <div className="pt-2 pb-1">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {t('vacation-pay.deductions')}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('vacation-pay.opv')} (10%)</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.opv)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('vacation-pay.vosms')} (2%)</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.vosms)}</span>
                </div>

                {results.standardDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('vacation-pay.standardDeduction')}</span>
                    <span className="font-semibold text-green-600">-{formatNumber(results.standardDeduction)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('vacation-pay.taxableIncome')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.taxableIncome)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('vacation-pay.ipn')} (10%)</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.ipn)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 border-t border-gray-200">
                  <span className="font-semibold text-red-900">{t('vacation-pay.totalDeductions')}</span>
                  <span className="text-lg font-bold text-red-700">{formatNumber(results.totalDeductions)}</span>
                </div>

                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-4">
                  <span className="text-lg font-semibold text-gray-900">{t('vacation-pay.netVacationPay')}</span>
                  <span className="text-xl font-bold text-emerald-700">{formatNumber(results.netVacationPay)}</span>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">{t('vacation-pay.effectiveRate')}</div>
                  <div className="text-lg font-bold text-gray-900">{results.effectiveRate}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment deadline info */}
          {results.netVacationPay > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">{t('vacation-pay.paymentDeadlineTitle')}</p>
                  <p>{t('vacation-pay.paymentDeadlineInfo')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legislative info section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Info className="w-5 h-5 mr-2 text-emerald-600" />
          {t('vacation-pay.legislativeInfo')}
        </h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-2">{t('vacation-pay.calculationMethod')}</h3>
            <ul className="space-y-1 text-emerald-800">
              <li>• {t('vacation-pay.methodStep1')}</li>
              <li>• {t('vacation-pay.methodStep2')}</li>
              <li>• {t('vacation-pay.methodStep3')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">{t('vacation-pay.standardVacation')}</h3>
            <p className="text-blue-800">{t('vacation-pay.standardVacationInfo')}</p>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-2">{t('vacation-pay.extendedVacation')}</h3>
            <p className="text-teal-800">{t('vacation-pay.extendedVacationInfo')}</p>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {results && results.netVacationPay > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('vacation-pay.chart.net'), value: results.netVacationPay },
              { name: t('vacation-pay.chart.opv'), value: results.opv },
              { name: t('vacation-pay.chart.ipn'), value: results.ipn },
              { name: t('vacation-pay.chart.vosms'), value: results.vosms },
            ].filter(item => item.value > 0)}
            title={t('vacation-pay.chart.title')}
          />
        </div>
      )}

      {/* Export Buttons */}
      {results && results.netVacationPay > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('vacation-pay.export.title'),
              subtitle: `${results.netVacationPay.toLocaleString()} ₸ ${t('vacation-pay.export.netLabel')}`,
              sections: [
                {
                  title: t('vacation-pay.export.inputSection'),
                  data: [
                    { label: t('vacation-pay.monthlyIncome'), value: `${(parseFloat(monthlyIncome) || 0).toLocaleString()} ₸` },
                    { label: t('vacation-pay.workMonths'), value: `${workMonths}` },
                    { label: t('vacation-pay.vacationDays'), value: `${vacationDays}` },
                  ]
                },
                {
                  title: t('vacation-pay.export.resultSection'),
                  data: [
                    { label: t('vacation-pay.averageDailyPay'), value: `${results.averageDailyPay.toLocaleString()} ₸` },
                    { label: t('vacation-pay.grossVacationPay'), value: `${results.grossVacationPay.toLocaleString()} ₸` },
                    { label: t('vacation-pay.opv'), value: `${results.opv.toLocaleString()} ₸` },
                    { label: t('vacation-pay.vosms'), value: `${results.vosms.toLocaleString()} ₸` },
                    { label: t('vacation-pay.ipn'), value: `${results.ipn.toLocaleString()} ₸` },
                    { label: t('vacation-pay.totalDeductions'), value: `${results.totalDeductions.toLocaleString()} ₸` },
                    { label: t('vacation-pay.netVacationPay'), value: `${results.netVacationPay.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('vacation-pay.export.footer')
            }}
            filename="vacation-pay-calculation"
          />
        </div>
      )}

      {/* FAQ Section */}
      <FAQSection
        items={[
          { question: t('vacation-pay.faq.q1'), answer: t('vacation-pay.faq.a1') },
          { question: t('vacation-pay.faq.q2'), answer: t('vacation-pay.faq.a2') },
          { question: t('vacation-pay.faq.q3'), answer: t('vacation-pay.faq.a3') },
          { question: t('vacation-pay.faq.q4'), answer: t('vacation-pay.faq.a4') },
          { question: t('vacation-pay.faq.q5'), answer: t('vacation-pay.faq.a5') }
        ]}
        sources={[
          { title: t('vacation-pay.sources.laborCode'), url: 'https://online.zakon.kz/document/?doc_id=38910832' },
          { title: t('vacation-pay.sources.taxCode'), url: 'https://online.zakon.kz/document/?doc_id=36148637' },
        ]}
      />

      {/* Embed Widget */}
      <EmbedWidget
        calculatorId="vacation-pay"
        calculatorTitle={t('vacation-pay.title')}
      />
    </div>
  );
}
