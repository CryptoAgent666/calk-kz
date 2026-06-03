import React, { useState, useEffect } from 'react';
import { Wallet, Calculator, TrendingUp, Users, Info, Building, DollarSign, Percent, BarChart3 } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { TaxPieChart, ProgressBar } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { getMethodology } from '../../data/calculatorMethodology';

export default function SalaryCalculator() {
  const { t } = useTranslation('calculators');
  const [grossSalary, setGrossSalary] = useState<string>('300000');
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);
  const [isSpecialCategory, setIsSpecialCategory] = useState<boolean>(false);

  const [results, setResults] = useState({
    opv: 0,
    vosms: 0,
    standardDeduction: 0,
    taxableIncome: 0,
    incomeTax: 0,
    totalEmployeeDeductions: 0,
    so: 0,
    oosms: 0,
    opvr: 0,
    totalEmployerContributions: 0,
    netSalary: 0,
    totalLaborCost: 0,
    hasNinetyPercentReduction: false,
    effectiveEmployeeTaxRate: 0,
    effectiveEmployerRate: 0
  });

  const MZP = 85000;
  const MRP = 4325;
  const OPV_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const IPN_RATE_BASE = 0.10;
  const IPN_RATE_HIGH = 0.15;
  const IPN_ANNUAL_THRESHOLD = 8500 * MRP; // 36,762,500 тенге/год
  const IPN_MONTHLY_THRESHOLD = IPN_ANNUAL_THRESHOLD / 12; // ~3,063,542 тенге/мес
  const SO_RATE = 0.05;
  const OOSMS_RATE = 0.03;
  const OPVR_RATE = 0.035;
  const STANDARD_DEDUCTION = 30 * MRP;
  const NINETY_PERCENT_THRESHOLD = 25 * MRP;
  const OPV_MAX_BASE = 50 * MZP;
  const VOSMS_MAX_BASE = 20 * MZP; // С 2026: макс. база ВОСМС = 20 МЗП
  const SO_MAX_BASE = 7 * MZP;

  const calculateSalary = (gross: number) => {
    if (gross <= 0) {
      return {
        opv: 0, vosms: 0, standardDeduction: 0, taxableIncome: 0, incomeTax: 0,
        totalEmployeeDeductions: 0, so: 0, oosms: 0, opvr: 0, totalEmployerContributions: 0,
        netSalary: 0, totalLaborCost: 0, hasNinetyPercentReduction: false,
        effectiveEmployeeTaxRate: 0, effectiveEmployerRate: 0
      };
    }

    const opvBase = Math.min(gross, OPV_MAX_BASE);
    const opv = isSpecialCategory ? 0 : opvBase * OPV_RATE;

    const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
    const vosms = isSpecialCategory ? 0 : vosmsBase * VOSMS_RATE;

    const standardDeduction = (isResident && isPrimaryJob) ? STANDARD_DEDUCTION : 0;

    let taxableIncome = gross - opv - vosms - standardDeduction;
    taxableIncome = Math.max(0, taxableIncome);

    const hasNinetyPercentReduction = gross <= NINETY_PERCENT_THRESHOLD;
    if (hasNinetyPercentReduction) {
      taxableIncome = taxableIncome * 0.1;
    }

    let incomeTax: number;
    if (taxableIncome <= IPN_MONTHLY_THRESHOLD) {
      incomeTax = taxableIncome * IPN_RATE_BASE;
    } else {
      incomeTax = IPN_MONTHLY_THRESHOLD * IPN_RATE_BASE + (taxableIncome - IPN_MONTHLY_THRESHOLD) * IPN_RATE_HIGH;
    }
    const totalEmployeeDeductions = opv + vosms + incomeTax;

    const soBase = Math.min(gross - opv, SO_MAX_BASE);
    const so = isSpecialCategory ? 0 : soBase * SO_RATE;

    const oosms = gross * OOSMS_RATE;

    const opvrBase = Math.min(gross, OPV_MAX_BASE);
    const opvr = isSpecialCategory ? 0 : opvrBase * OPVR_RATE;

    const totalEmployerContributions = so + oosms + opvr;
    const netSalary = gross - totalEmployeeDeductions;
    const totalLaborCost = gross + totalEmployerContributions;

    const effectiveEmployeeTaxRate = gross > 0 ? (totalEmployeeDeductions / gross) * 100 : 0;
    const effectiveEmployerRate = gross > 0 ? (totalEmployerContributions / gross) * 100 : 0;

    return {
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      standardDeduction: Math.round(standardDeduction),
      taxableIncome: Math.round(taxableIncome),
      incomeTax: Math.round(incomeTax),
      totalEmployeeDeductions: Math.round(totalEmployeeDeductions),
      so: Math.round(so),
      oosms: Math.round(oosms),
      opvr: Math.round(opvr),
      totalEmployerContributions: Math.round(totalEmployerContributions),
      netSalary: Math.round(netSalary),
      totalLaborCost: Math.round(totalLaborCost),
      hasNinetyPercentReduction,
      effectiveEmployeeTaxRate: Number(effectiveEmployeeTaxRate.toFixed(2)),
      effectiveEmployerRate: Number(effectiveEmployerRate.toFixed(2))
    };
  };

  useEffect(() => {
    const gross = parseFloat(grossSalary) || 0;
    setResults(calculateSalary(gross));
  }, [grossSalary, isResident, isPrimaryJob, isSpecialCategory]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (!grossSalary || parseFloat(grossSalary) <= 0) return '';

    return `${t('salary.parameters')}:
- ${t('salary.grossSalary')}: ${formatNumber(parseFloat(grossSalary))}
- ${t('salary.isResident')}: ${isResident ? t('common.yes') : t('common.no')}
- ${t('salary.isPrimaryJob')}: ${isPrimaryJob ? t('common.yes') : t('common.no')}
- ${t('salary.isSpecialCategory')}: ${isSpecialCategory ? t('common.yes') : t('common.no')}

${t('salary.employeeDeductions')}:
- ${t('salary.opv')}: ${formatNumber(results.opv)}
- ${t('salary.vosms')}: ${formatNumber(results.vosms)}
- ${t('salary.ipn')}: ${formatNumber(results.incomeTax)}${results.hasNinetyPercentReduction ? ' (' + t('salary.ninetyPercentBenefit') + ')' : ''}
- ${t('salary.totalDeducted')}: ${formatNumber(results.totalEmployeeDeductions)}
- ${t('salary.netSalary')}: ${formatNumber(results.netSalary)}

${t('salary.employerContributions')}:
- ${t('salary.so')}: ${formatNumber(results.so)}
- ${t('salary.oosms')}: ${formatNumber(results.oosms)}
- ${t('salary.opvr')}: ${formatNumber(results.opvr)}
- ${t('salary.totalEmployerPays')}: ${formatNumber(results.totalEmployerContributions)}
- ${t('salary.totalLaborCost')}: ${formatNumber(results.totalLaborCost)}

${t('salary.effectiveTaxRate')}:
- ${t('salary.employeeDeductions')}: ${results.effectiveEmployeeTaxRate}%
- ${t('salary.employerSurcharge')}: ${results.effectiveEmployerRate}%`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('salary.heading')}</h1>
            <p className="text-gray-600">{t('salary.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="salary" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('salary.parameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('salary.grossSalary')}
              </label>
              <RangeSlider
                value={parseFloat(grossSalary) || 0}
                onChange={(val) => setGrossSalary(String(val))}
                min={100000}
                max={3000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#3b82f6"
              />
              <input
                type="number"
                id="grossSalary"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
                placeholder={t('salary.grossSalaryPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isResident"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isResident" className="ml-2 block text-sm text-gray-700">
                  {t('salary.isResident')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryJob"
                  checked={isPrimaryJob}
                  onChange={(e) => setIsPrimaryJob(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimaryJob" className="ml-2 block text-sm text-gray-700">
                  {t('salary.isPrimaryJob')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSpecialCategory"
                  checked={isSpecialCategory}
                  onChange={(e) => setIsSpecialCategory(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isSpecialCategory" className="ml-2 block text-sm text-gray-700">
                  {t('salary.isSpecialCategory')}
                </label>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('salary.currentRates')}</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div><strong>{t('salary.fromEmployee')}</strong></div>
                <div>• {t('salary.rates')}</div>
                <div><strong>{t('salary.fromEmployer')}</strong></div>
                <div>• {t('salary.employerRates')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('salary.employeeDeductions')}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.opv')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.opv)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.vosms')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.vosms)}</span>
            </div>

            {results.standardDeduction > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary.standardDeduction')}</span>
                <span className="font-semibold text-green-600">-{formatNumber(results.standardDeduction)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{t('salary.ipn')}</span>
                {results.hasNinetyPercentReduction && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {t('salary.ninetyPercentBenefit')}
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-900">{formatNumber(results.incomeTax)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 border-t border-gray-200">
              <span className="font-semibold text-red-900">{t('salary.totalDeducted')}</span>
              <span className="text-lg font-bold text-red-700">{formatNumber(results.totalEmployeeDeductions)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('salary.netSalary')}</span>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-700">{formatNumber(results.netSalary)}</span>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">{t('salary.effectiveTaxRate')}</div>
              <div className="text-lg font-bold text-gray-900">{results.effectiveEmployeeTaxRate}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('salary.employerContributions')}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.so')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.so)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.oosms')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.oosms)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.opvr')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.opvr)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-3 border-t border-gray-200">
              <span className="font-semibold text-orange-900">{t('salary.totalEmployerPays')}</span>
              <span className="text-lg font-bold text-orange-700">{formatNumber(results.totalEmployerContributions)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('salary.totalLaborCost')}</span>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">{formatNumber(results.totalLaborCost)}</span>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">{t('salary.employerSurcharge')}</div>
              <div className="text-lg font-bold text-gray-900">{results.effectiveEmployerRate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('salary.expensesSummary')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-6 h-6 text-gray-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.employee')}</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">{formatNumber(results.totalEmployeeDeductions)}</div>
            <div className="text-sm text-gray-600">{results.effectiveEmployeeTaxRate}% {t('salary.ofSalary')}</div>
          </div>

          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building className="w-6 h-6 text-orange-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.employer')}</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">{formatNumber(results.totalEmployerContributions)}</div>
            <div className="text-sm text-gray-600">{results.effectiveEmployerRate}% {t('salary.ofSalary')}</div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Percent className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.totalToBudget')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatNumber(results.totalEmployeeDeductions + results.totalEmployerContributions)}
            </div>
            <div className="text-sm text-gray-600">
              {(results.effectiveEmployeeTaxRate + results.effectiveEmployerRate).toFixed(1)}% {t('salary.ofSalary')}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('salary.understandingStructure')}
              </h3>
              <p className="text-blue-800 text-sm">
                <strong>{t('salary.employeeReceives')}</strong> {formatNumber(results.netSalary)} {t('salary.of')} {formatNumber(parseFloat(grossSalary) || 0)} {t('salary.accrued')}
                <br />
                <strong>{t('salary.employerAdds')}</strong> {formatNumber(results.totalEmployerContributions)} {t('salary.aboveSalary')}
                <br />
                <strong>{t('salary.fullCostEmployee')}</strong> {formatNumber(results.totalLaborCost)} {t('salary.forEmployer')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {parseFloat(grossSalary) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('salary.exportTitle')}
            description={t('salary.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="salary" />
      <MethodologySection steps={getMethodology('salary')} />
      <FAQSection
        items={[
          { question: t('salary.faq.q1'), answer: t('salary.faq.a1') },
          { question: t('salary.faq.q2'), answer: t('salary.faq.a2') },
          { question: t('salary.faq.q3'), answer: t('salary.faq.a3') },
          { question: t('salary.faq.q4'), answer: t('salary.faq.a4') },
          { question: t('salary.faq.q5'), answer: t('salary.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'ЕНПФ — Пенсионные отчисления', url: 'https://enpf.kz/' },
        ]}
      />

      {/* Диаграмма структуры зарплаты */}
      {results && results.netSalary > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('salary.chart.netSalary'), value: results.netSalary },
              { name: t('salary.chart.opv'), value: results.opv },
              { name: t('salary.chart.ipn'), value: results.incomeTax },
              { name: t('salary.chart.vosms'), value: results.vosms },
            ].filter(item => item.value > 0)}
            title={t('salary.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.netSalary > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('salary.export.title'),
              subtitle: `${results.netSalary.toLocaleString()} ₸ ${t('salary.export.netSalaryLabel')}`,
              sections: [
                {
                  title: t('salary.export.results'),
                  data: [
                    { label: t('salary.accrued'), value: `${parseFloat(grossSalary || '0').toLocaleString()} ₸` },
                    { label: t('salary.incomeTax'), value: `${results.incomeTax.toLocaleString()} ₸` },
                    { label: t('salary.opv'), value: `${results.opv.toLocaleString()} ₸` },
                    { label: t('salary.netSalary'), value: `${results.netSalary.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('salary.export.footer')
            }}
            filename="salary-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="salary"
        calculatorTitle="Калькулятор зарплаты"
      />
      <LastUpdated calculatorId="salary" />
    </div>
  );
}
