import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Calculator, Wallet, Info, TrendingUp } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function SalaryReverseCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [desiredNet, setDesiredNet] = useState<string>('250000');
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);

  const [results, setResults] = useState({
    grossSalary: 0,
    opv: 0,
    vosms: 0,
    standardDeduction: 0,
    taxableIncome: 0,
    incomeTax: 0,
    totalEmployeeDeductions: 0,
    netSalary: 0,
    sn: 0,
    so: 0,
    oosms: 0,
    opvr: 0,
    totalEmployerContributions: 0,
    totalLaborCost: 0,
    effectiveEmployeeTaxRate: 0,
    effectiveEmployerRate: 0,
  });

  // 2026 constants
  const MZP = 85000;
  const MRP = 4325;
  const OPV_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const IPN_RATE_BASE = 0.10;
  const IPN_RATE_HIGH = 0.15;
  const IPN_ANNUAL_THRESHOLD = 8500 * MRP;
  const IPN_MONTHLY_THRESHOLD = IPN_ANNUAL_THRESHOLD / 12;
  const STANDARD_DEDUCTION = 30 * MRP;
  const OPV_MAX_BASE = 50 * MZP;
  const VOSMS_MAX_BASE = 20 * MZP;
  const SN_RATE = 0.06; // СН с 2026: 6%, взаимозачёт с СО отменён (новый НК РК)
  const SN_MIN_BASE = 14 * MRP; // минимальный объект СН = 14 МРП
  const SO_RATE = 0.05;
  const SO_MAX_BASE = 7 * MZP;
  const OOSMS_RATE = 0.03;
  const OOSMS_MAX_BASE = 40 * MZP; // С 2026: макс. база ООСМС = 40 МЗП
  const OPVR_RATE = 0.035;

  const calculateForwardNet = (gross: number): number => {
    if (gross <= 0) return 0;

    const opvBase = Math.min(gross, OPV_MAX_BASE);
    const opv = opvBase * OPV_RATE;

    const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
    const vosms = vosmsBase * VOSMS_RATE;

    const standardDeduction = (isResident && isPrimaryJob) ? STANDARD_DEDUCTION : 0;

    let taxableIncome = gross - opv - vosms - standardDeduction;
    taxableIncome = Math.max(0, taxableIncome);

    let incomeTax: number;
    if (taxableIncome <= IPN_MONTHLY_THRESHOLD) {
      incomeTax = taxableIncome * IPN_RATE_BASE;
    } else {
      incomeTax = IPN_MONTHLY_THRESHOLD * IPN_RATE_BASE + (taxableIncome - IPN_MONTHLY_THRESHOLD) * IPN_RATE_HIGH;
    }

    return gross - opv - vosms - incomeTax;
  };

  const calculateFullResults = (gross: number) => {
    if (gross <= 0) {
      return {
        grossSalary: 0, opv: 0, vosms: 0, standardDeduction: 0, taxableIncome: 0,
        incomeTax: 0, totalEmployeeDeductions: 0, netSalary: 0,
        sn: 0, so: 0, oosms: 0, opvr: 0, totalEmployerContributions: 0,
        totalLaborCost: 0, effectiveEmployeeTaxRate: 0, effectiveEmployerRate: 0,
      };
    }

    const opvBase = Math.min(gross, OPV_MAX_BASE);
    const opv = opvBase * OPV_RATE;

    const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
    const vosms = vosmsBase * VOSMS_RATE;

    const standardDeduction = (isResident && isPrimaryJob) ? STANDARD_DEDUCTION : 0;

    let taxableIncome = gross - opv - vosms - standardDeduction;
    taxableIncome = Math.max(0, taxableIncome);

    let incomeTax: number;
    if (taxableIncome <= IPN_MONTHLY_THRESHOLD) {
      incomeTax = taxableIncome * IPN_RATE_BASE;
    } else {
      incomeTax = IPN_MONTHLY_THRESHOLD * IPN_RATE_BASE + (taxableIncome - IPN_MONTHLY_THRESHOLD) * IPN_RATE_HIGH;
    }

    const totalEmployeeDeductions = opv + vosms + incomeTax;
    const netSalary = gross - totalEmployeeDeductions;

    // Employer costs
    // СН 6% (новый НК РК 2026): база = доход − ОПВ − ВОСМС, но не менее 14 МРП
    const snBase = Math.max(gross - opv - vosms, SN_MIN_BASE);
    const sn = snBase * SN_RATE;

    const soBase = Math.min(Math.max(gross - opv, 0), SO_MAX_BASE);
    const so = soBase * SO_RATE;

    const oosmsBase = Math.min(gross, OOSMS_MAX_BASE);
    const oosms = oosmsBase * OOSMS_RATE;

    const opvrBase = Math.min(gross, OPV_MAX_BASE);
    const opvr = opvrBase * OPVR_RATE;

    const totalEmployerContributions = sn + so + oosms + opvr;
    const totalLaborCost = gross + totalEmployerContributions;

    const effectiveEmployeeTaxRate = gross > 0 ? (totalEmployeeDeductions / gross) * 100 : 0;
    const effectiveEmployerRate = gross > 0 ? (totalEmployerContributions / gross) * 100 : 0;

    return {
      grossSalary: Math.round(gross),
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      standardDeduction: Math.round(standardDeduction),
      taxableIncome: Math.round(taxableIncome),
      incomeTax: Math.round(incomeTax),
      totalEmployeeDeductions: Math.round(totalEmployeeDeductions),
      netSalary: Math.round(netSalary),
      sn: Math.round(sn),
      so: Math.round(so),
      oosms: Math.round(oosms),
      opvr: Math.round(opvr),
      totalEmployerContributions: Math.round(totalEmployerContributions),
      totalLaborCost: Math.round(totalLaborCost),
      effectiveEmployeeTaxRate: Number(effectiveEmployeeTaxRate.toFixed(2)),
      effectiveEmployerRate: Number(effectiveEmployerRate.toFixed(2)),
    };
  };

  const findGrossFromNet = (targetNet: number): number => {
    if (targetNet <= 0) return 0;

    let low = targetNet;
    let high = targetNet * 3;

    // Ensure high is enough
    while (calculateForwardNet(high) < targetNet) {
      high *= 2;
    }

    // Binary search with 1 tenge precision
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      const net = calculateForwardNet(mid);
      if (net < targetNet) {
        low = mid;
      } else {
        high = mid;
      }
    }

    // Pick the closer match
    const netLow = calculateForwardNet(low);
    const netHigh = calculateForwardNet(high);
    return Math.abs(netHigh - targetNet) <= Math.abs(netLow - targetNet) ? high : low;
  };

  useEffect(() => {
    const net = parseFloat(desiredNet) || 0;
    const gross = findGrossFromNet(net);
    setResults(calculateFullResults(gross));
  }, [desiredNet, isResident, isPrimaryJob]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' \u20B8';
  };

  const generateExportData = () => {
    if (!desiredNet || parseFloat(desiredNet) <= 0) return '';

    return `${t('salary-reverse.parameters')}:
- ${t('salary-reverse.desiredNet')}: ${formatNumber(parseFloat(desiredNet))}
- ${t('salary-reverse.isResident')}: ${isResident ? t('common.yes') : t('common.no')}
- ${t('salary-reverse.isPrimaryJob')}: ${isPrimaryJob ? t('common.yes') : t('common.no')}

${t('salary-reverse.results')}:
- ${t('salary-reverse.requiredGross')}: ${formatNumber(results.grossSalary)}
- ${t('salary-reverse.opv')}: ${formatNumber(results.opv)}
- ${t('salary-reverse.vosms')}: ${formatNumber(results.vosms)}
- ${t('salary-reverse.ipn')}: ${formatNumber(results.incomeTax)}
- ${t('salary-reverse.totalDeducted')}: ${formatNumber(results.totalEmployeeDeductions)}
- ${t('salary-reverse.netConfirm')}: ${formatNumber(results.netSalary)}

${t('salary-reverse.employerCosts')}:
- ${t('salary-reverse.sn')}: ${formatNumber(results.sn)}
- ${t('salary-reverse.so')}: ${formatNumber(results.so)}
- ${t('salary-reverse.oosms')}: ${formatNumber(results.oosms)}
- ${t('salary-reverse.opvr')}: ${formatNumber(results.opvr)}
- ${t('salary-reverse.totalEmployerPays')}: ${formatNumber(results.totalEmployerContributions)}
- ${t('salary-reverse.totalLaborCost')}: ${formatNumber(results.totalLaborCost)}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="salary-reverse" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('salary-reverse.heading')}</h1>
            <p className="text-gray-600">{t('salary-reverse.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {i18n.language === 'kk'
            ? 'Есептеулер нәтижелері анықтамалық сипатта. Қаржылық шешімдер қабылдау үшін деректерді ресми көздерден тексеріп, мамандармен кеңесуді ұсынамыз.'
            : 'Результаты расчётов носят справочный характер. Для принятия финансовых решений рекомендуем сверять данные с официальными источниками и консультироваться со специалистами.'}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left column: Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>{t('salary-reverse.parameters')}</span>
            </div>
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('salary-reverse.desiredNet')}
              </label>
              <RangeSlider
                value={parseFloat(desiredNet) || 0}
                onChange={(val) => setDesiredNet(String(val))}
                min={50000}
                max={2000000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString()} \u20B8`}
                color="#10b981"
              />
              <input
                type="number"
                id="desiredNet"
                value={desiredNet}
                onChange={(e) => setDesiredNet(e.target.value)}
                placeholder={t('salary-reverse.desiredNetPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              />
            </div>

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
                  {t('salary-reverse.isResident')}
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
                  {t('salary-reverse.isPrimaryJob')}
                </label>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-emerald-900 mb-2">
                <div className="flex items-center space-x-1">
                  <Info className="w-4 h-4" />
                  <span>{t('salary-reverse.howItWorks')}</span>
                </div>
              </h3>
              <p className="text-xs text-emerald-800">
                {t('salary-reverse.howItWorksText')}
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Results */}
        <div className="space-y-6">
          {/* Required gross */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-4 mb-4">
              <span className="text-lg font-semibold text-gray-900">{t('salary-reverse.requiredGross')}</span>
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-700">{formatNumber(results.grossSalary)}</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('salary-reverse.deductions')}</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.opv')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.opv)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.vosms')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.vosms)}</span>
              </div>

              {results.standardDeduction > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('salary-reverse.standardDeduction')}</span>
                  <span className="font-semibold text-green-600">-{formatNumber(results.standardDeduction)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.ipn')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.incomeTax)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3">
                <span className="font-semibold text-red-900">{t('salary-reverse.totalDeducted')}</span>
                <span className="text-lg font-bold text-red-700">{formatNumber(results.totalEmployeeDeductions)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                <span className="font-semibold text-green-900">{t('salary-reverse.netConfirm')}</span>
                <span className="text-lg font-bold text-green-700">{formatNumber(results.netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Employer costs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span>{t('salary-reverse.employerCosts')}</span>
              </div>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.sn')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.sn)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.so')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.so)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.oosms')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.oosms)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary-reverse.opvr')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.opvr)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-3">
                <span className="font-semibold text-orange-900">{t('salary-reverse.totalEmployerPays')}</span>
                <span className="text-lg font-bold text-orange-700">{formatNumber(results.totalEmployerContributions)}</span>
              </div>

              <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4">
                <span className="text-lg font-semibold text-gray-900">{t('salary-reverse.totalLaborCost')}</span>
                <span className="text-xl font-bold text-blue-700">{formatNumber(results.totalLaborCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      {results.grossSalary > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('salary-reverse.chart.net'), value: results.netSalary },
              { name: t('salary-reverse.chart.opv'), value: results.opv },
              { name: t('salary-reverse.chart.ipn'), value: results.incomeTax },
              { name: t('salary-reverse.chart.vosms'), value: results.vosms },
            ].filter(item => item.value > 0)}
            title={t('salary-reverse.chart.title')}
          />
        </div>
      )}

      {/* Export buttons */}
      {results.grossSalary > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('salary-reverse.export.title'),
              subtitle: `${results.grossSalary.toLocaleString()} \u20B8 ${t('salary-reverse.export.grossLabel')}`,
              sections: [
                {
                  title: t('salary-reverse.export.results'),
                  data: [
                    { label: t('salary-reverse.desiredNet'), value: `${(parseFloat(desiredNet) || 0).toLocaleString()} \u20B8` },
                    { label: t('salary-reverse.requiredGross'), value: `${results.grossSalary.toLocaleString()} \u20B8` },
                    { label: t('salary-reverse.opv'), value: `${results.opv.toLocaleString()} \u20B8` },
                    { label: t('salary-reverse.vosms'), value: `${results.vosms.toLocaleString()} \u20B8` },
                    { label: t('salary-reverse.ipn'), value: `${results.incomeTax.toLocaleString()} \u20B8` },
                    { label: t('salary-reverse.netConfirm'), value: `${results.netSalary.toLocaleString()} \u20B8` },
                    { label: t('salary-reverse.totalLaborCost'), value: `${results.totalLaborCost.toLocaleString()} \u20B8` },
                  ]
                }
              ],
              footer: t('salary-reverse.export.footer'),
            }}
            filename="salary-reverse-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('salary-reverse.faq.q1'), answer: t('salary-reverse.faq.a1') },
          { question: t('salary-reverse.faq.q2'), answer: t('salary-reverse.faq.a2') },
          { question: t('salary-reverse.faq.q3'), answer: t('salary-reverse.faq.a3') },
          { question: t('salary-reverse.faq.q4'), answer: t('salary-reverse.faq.a4') },
          { question: t('salary-reverse.faq.q5'), answer: t('salary-reverse.faq.a5') },
        ]}
        sources={[
          { title: 'Налоговый кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'ЕНПФ — Пенсионные отчисления', url: 'https://enpf.kz/' },
        ]}
      />

      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="salary-reverse"
        calculatorTitle={t('salary-reverse.heading')}
      />
      <LastUpdated calculatorId="salary-reverse" />
    </div>
  );
}
