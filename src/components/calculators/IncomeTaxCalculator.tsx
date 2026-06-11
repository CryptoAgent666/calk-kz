import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertTriangle, Info, BarChart3 } from 'lucide-react';
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
import { ScenarioComparison } from '../ui/ScenarioComparison';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function IncomeTaxCalculator() {
  const { t } = useTranslation('calculators');
  const [grossSalary, setGrossSalary] = useState<number>(250000);
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);
  const [isSpecialCategory, setIsSpecialCategory] = useState<boolean>(false);
  const [showCharts, setShowCharts] = useState<boolean>(true);
  const [results, setResults] = useState({
    opv: 0,
    vosms: 0,
    standardDeduction: 0,
    taxableIncome: 0,
    incomeTax: 0,
    netSalary: 0,
    totalDeductions: 0,
    effectiveRate: 0,
    hasNinetyPercentReduction: false,
    isNearThreshold: false,
    thresholdWarning: ''
  });

  const MZP = 85000;
  const MRP = 4325;
  const OPV_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const IPN_RATE_BASE = 0.10;
  const IPN_RATE_HIGH = 0.15;
  const IPN_ANNUAL_THRESHOLD = 8500 * MRP; // 36,762,500 тенге/год
  const IPN_MONTHLY_THRESHOLD = IPN_ANNUAL_THRESHOLD / 12; // ~3,063,542 тенге/мес
  const STANDARD_DEDUCTION = 30 * MRP;
  const OPV_MAX_BASE = 50 * MZP;
  const VOSMS_MAX_BASE = 20 * MZP; // С 2026: макс. база ВОСМС = 20 МЗП

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const calculateTax = (gross: number, resident = isResident, primary = isPrimaryJob, special = isSpecialCategory) => {
    if (gross <= 0) {
      return {
        opv: 0, vosms: 0, standardDeduction: 0, taxableIncome: 0,
        incomeTax: 0, netSalary: 0, totalDeductions: 0, effectiveRate: 0,
        hasNinetyPercentReduction: false, isNearThreshold: false, thresholdWarning: ''
      };
    }

    const opvBase = Math.min(gross, OPV_MAX_BASE);
    const opv = special ? 0 : opvBase * OPV_RATE;

    const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
    const vosms = special ? 0 : vosmsBase * VOSMS_RATE;

    const standardDeduction = (resident && primary) ? STANDARD_DEDUCTION : 0;

    let taxableIncome = gross - opv - vosms - standardDeduction;
    taxableIncome = Math.max(0, taxableIncome);

    // 90%-корректировка для доходов ≤25 МРП ОТМЕНЕНА с 2026 (ст. 401 НК РК).
    const hasNinetyPercentReduction = false;

    let incomeTax: number;
    if (taxableIncome <= IPN_MONTHLY_THRESHOLD) {
      incomeTax = taxableIncome * IPN_RATE_BASE;
    } else {
      incomeTax = IPN_MONTHLY_THRESHOLD * IPN_RATE_BASE + (taxableIncome - IPN_MONTHLY_THRESHOLD) * IPN_RATE_HIGH;
    }
    const totalDeductions = opv + vosms + incomeTax;
    const netSalary = gross - totalDeductions;
    const effectiveRate = gross > 0 ? (totalDeductions / gross) * 100 : 0;

    // Предупреждение о пороге 25 МРП удалено — 90%-льгота отменена с 2026.
    const isNearThreshold = false;
    const thresholdWarning = '';

    return {
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      standardDeduction: Math.round(standardDeduction),
      taxableIncome: Math.round(taxableIncome),
      incomeTax: Math.round(incomeTax),
      netSalary: Math.round(netSalary),
      totalDeductions: Math.round(totalDeductions),
      effectiveRate: Number(effectiveRate.toFixed(2)),
      hasNinetyPercentReduction,
      isNearThreshold,
      thresholdWarning
    };
  };

  useEffect(() => {
    setResults(calculateTax(grossSalary));
  }, [grossSalary, isResident, isPrimaryJob, isSpecialCategory]);

  // Данные для круговой диаграммы
  const pieChartData = [
    { name: t('income-tax.chart.opv'), value: results.opv, color: '#f97316' },
    { name: t('income-tax.chart.vosms'), value: results.vosms, color: '#eab308' },
    { name: t('income-tax.chart.ipn'), value: results.incomeTax, color: '#ef4444' },
    { name: t('income-tax.chart.netSalary'), value: results.netSalary, color: '#22c55e' },
  ].filter(item => item.value > 0);

  // Данные для экспорта
  const exportData = {
    title: t('income-tax.exportTitle'),
    subtitle: t('income-tax.exportDescription'),
    sections: [
      {
        title: t('income-tax.parameters'),
        data: [
          { label: t('income-tax.grossSalary'), value: formatNumber(grossSalary) },
          { label: t('income-tax.isResident'), value: isResident ? t('common.yes') : t('common.no') },
          { label: t('income-tax.isPrimaryJob'), value: isPrimaryJob ? t('common.yes') : t('common.no') },
          { label: t('income-tax.isSpecialCategory'), value: isSpecialCategory ? t('common.yes') : t('common.no') },
        ]
      },
      {
        title: t('income-tax.results'),
        data: [
          { label: t('income-tax.opv'), value: formatNumber(results.opv) },
          { label: t('income-tax.vosms'), value: formatNumber(results.vosms) },
          { label: t('income-tax.ipn'), value: formatNumber(results.incomeTax) },
          { label: t('income-tax.totalDeductions'), value: formatNumber(results.totalDeductions) },
          { label: t('income-tax.netSalary'), value: formatNumber(results.netSalary) },
          { label: t('income-tax.effectiveRate'), value: `${results.effectiveRate}%` },
        ]
      }
    ],
    footer: 'calk.kz — Калькуляторы Казахстана'
  };

  // FAQ данные
  const faqItems = [
    { question: t('income-tax.faq.q1'), answer: t('income-tax.faq.a1') },
    { question: t('income-tax.faq.q2'), answer: t('income-tax.faq.a2') },
    { question: t('income-tax.faq.q3'), answer: t('income-tax.faq.a3') },
    { question: t('income-tax.faq.q4'), answer: t('income-tax.faq.a4') },
    { question: t('income-tax.faq.q5'), answer: t('income-tax.faq.a5', { deduction: formatNumber(STANDARD_DEDUCTION) }) }
  ];

  // Методология расчета
  const methodologySteps = [
    {
      step: 1,
      title: t('income-tax.methodology.step1.title'),
      description: t('income-tax.methodology.step1.description'),
      formula: t('income-tax.methodology.step1.formula')
    },
    {
      step: 2,
      title: t('income-tax.methodology.step2.title'),
      description: t('income-tax.methodology.step2.description'),
      formula: t('income-tax.methodology.step2.formula')
    },
    {
      step: 3,
      title: t('income-tax.methodology.step3.title'),
      description: t('income-tax.methodology.step3.description'),
      formula: t('income-tax.methodology.step3.formula')
    },
    {
      step: 4,
      title: t('income-tax.methodology.step4.title'),
      description: t('income-tax.methodology.step4.description'),
      formula: t('income-tax.methodology.step4.formula')
    }
  ];

  // Параметры для сравнения сценариев
  const scenarioParamFields = [
    { key: 'salary', label: t('income-tax.scenarios.salary'), type: 'number' as const, min: 0, max: 2000000, step: 10000, suffix: '₸' },
  ];

  const scenarioResultFields = [
    { key: 'opv', label: t('income-tax.chart.opv'), format: formatNumber },
    { key: 'vosms', label: t('income-tax.chart.vosms'), format: formatNumber },
    { key: 'incomeTax', label: t('income-tax.chart.ipn'), format: formatNumber },
    { key: 'totalDeductions', label: t('income-tax.scenarios.totalDeductions'), format: formatNumber },
    { key: 'netSalary', label: t('income-tax.chart.netSalary'), format: formatNumber, highlight: true, higherIsBetter: true },
    { key: 'effectiveRate', label: t('income-tax.scenarios.effectiveRate'), format: (v: number) => `${v.toFixed(2)}%`, higherIsBetter: false },
  ];

  const calculateScenarioResults = (params: Record<string, number | string>) => {
    const salary = Number(params.salary) || 0;
    const result = calculateTax(salary, isResident, isPrimaryJob, isSpecialCategory);
    return {
      opv: result.opv,
      vosms: result.vosms,
      incomeTax: result.incomeTax,
      totalDeductions: result.totalDeductions,
      netSalary: result.netSalary,
      effectiveRate: result.effectiveRate,
    };
  };

  const generateExportData = () => {
    if (grossSalary <= 0) return '';

    return `${t('income-tax.parameters')}:
- ${t('income-tax.grossSalary')}: ${formatNumber(grossSalary)}
- ${t('income-tax.isResident')}: ${isResident ? t('common.yes') : t('common.no')}
- ${t('income-tax.isPrimaryJob')}: ${isPrimaryJob ? t('common.yes') : t('common.no')}
- ${t('income-tax.isSpecialCategory')}: ${isSpecialCategory ? t('common.yes') : t('common.no')}

${t('income-tax.results')}:
- ${t('income-tax.opv')}: ${formatNumber(results.opv)}
- ${t('income-tax.vosms')}: ${formatNumber(results.vosms)}
${results.standardDeduction > 0 ? `- ${t('income-tax.standardDeduction')}: ${formatNumber(results.standardDeduction)}` : ''}
- ${t('income-tax.ipn')}: ${formatNumber(results.incomeTax)}${results.hasNinetyPercentReduction ? ' ' + t('income-tax.withBenefit') : ''}
- ${t('income-tax.totalDeductions')}: ${formatNumber(results.totalDeductions)}
- ${t('income-tax.netSalary')}: ${formatNumber(results.netSalary)}
- ${t('income-tax.effectiveRate')}: ${results.effectiveRate}%`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('income-tax.heading')}</h1>
            <p className="text-gray-600">{t('income-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="income-tax" />

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('income-tax.parameters')}</h2>

          <div className="space-y-6">
            {/* Интерактивный слайдер для зарплаты */}
            <div>
              <RangeSlider
                value={grossSalary}
                onChange={setGrossSalary}
                min={MZP}
                max={2000000}
                step={5000}
                label={t('income-tax.grossSalary')}
                formatValue={(v) => formatNumber(v)}
                color="#22c55e"
              />
              <div className="mt-3">
                <input
                  type="number"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(Number(e.target.value) || 0)}
                  placeholder={t('income-tax.grossSalaryPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isResident"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isResident" className="ml-2 block text-sm text-gray-700">
                  {t('income-tax.isResident')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryJob"
                  checked={isPrimaryJob}
                  onChange={(e) => setIsPrimaryJob(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimaryJob" className="ml-2 block text-sm text-gray-700">
                  {t('income-tax.isPrimaryJob')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSpecialCategory"
                  checked={isSpecialCategory}
                  onChange={(e) => setIsSpecialCategory(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isSpecialCategory" className="ml-2 block text-sm text-gray-700">
                  {t('income-tax.isSpecialCategory')}
                </label>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('income-tax.currentRates')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('income-tax.opvRate')} {formatNumber(OPV_MAX_BASE)})</li>
                <li>• {t('income-tax.vosmsRate')} {formatNumber(VOSMS_MAX_BASE)})</li>
                <li>• {t('income-tax.ipnRate')}</li>
                <li>• {t('income-tax.standardDeductionLabel')} {formatNumber(STANDARD_DEDUCTION)}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{t('income-tax.results')}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className={`p-2 rounded-lg transition-colors ${showCharts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                title={showCharts ? 'Скрыть диаграмму' : 'Показать диаграмму'}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <ExportButtons data={exportData} filename="income-tax-calculation" compact />
            </div>
          </div>

          <div className="space-y-4">
            {/* Прогресс-бары для визуализации */}
            <div className="space-y-3 mb-6">
              <ProgressBar 
                value={results.opv} 
                max={grossSalary} 
                label={t('income-tax.progressBar.opv')} 
                color="#f97316" 
              />
              <ProgressBar 
                value={results.vosms} 
                max={grossSalary} 
                label={t('income-tax.progressBar.vosms')} 
                color="#eab308" 
              />
              <ProgressBar 
                value={results.incomeTax} 
                max={grossSalary} 
                label={t('income-tax.progressBar.ipn')} 
                color="#ef4444" 
              />
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">{t('income-tax.opv')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.opv)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">{t('income-tax.vosms')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.vosms)}</span>
            </div>

            {results.standardDeduction > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('income-tax.standardDeduction')}</span>
                <span className="font-semibold text-green-600">-{formatNumber(results.standardDeduction)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">{t('income-tax.ipn')}</span>
                {results.hasNinetyPercentReduction && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {t('income-tax.benefit')}
                  </span>
                )}
              </div>
              <span className="font-semibold text-gray-900">{formatNumber(results.incomeTax)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">{t('income-tax.totalDeductions')}</span>
              <span className="font-semibold text-red-600">{formatNumber(results.totalDeductions)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('income-tax.netSalary')}</span>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-700">{formatNumber(results.netSalary)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <h3 className="text-sm font-medium text-gray-700 mb-1">{t('income-tax.effectiveRate')}</h3>
                <div className="text-xl font-bold text-gray-900">{results.effectiveRate}%</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <h3 className="text-sm font-medium text-blue-700 mb-1">{t('income-tax.taxableIncome')}</h3>
                <div className="text-lg font-semibold text-blue-800">{formatNumber(results.taxableIncome)}</div>
              </div>
            </div>
          </div>

          {grossSalary > 0 && (
            <div className="mt-6">
              <SharePrintButtons
                title={t('income-tax.exportTitle')}
                description={t('income-tax.exportDescription')}
                results={generateExportData()}
                disabled={!generateExportData()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Круговая диаграмма */}
      {showCharts && grossSalary > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={pieChartData}
            title={t('income-tax.chart.salaryDistribution')}
            formatValue={formatNumber}
          />
        </div>
      )}

      {results.isNearThreshold && results.thresholdWarning && (
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                {t('income-tax.warningThreshold')}
              </h3>
              <p className="text-amber-800">
                {results.thresholdWarning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Сравнение сценариев */}
      <ScenarioComparison
        title={t('income-tax.scenarios.title')}
        paramFields={scenarioParamFields}
        resultFields={scenarioResultFields}
        calculateResults={calculateScenarioResults}
        defaultParams={{ salary: grossSalary }}
        maxScenarios={3}
      />

      {/* Методология */}
      <CalculatorExamples calculatorId="income-tax" />
      <MethodologySection
        title={t('income-tax.methodology.title')}
        steps={methodologySteps}
      />

      {/* FAQ */}
      <FAQSection
        items={faqItems}
        sources={[
          { title: t('income-tax.sources.taxCode'), url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: t('income-tax.sources.opvLaw'), url: 'https://online.zakon.kz/document/?doc_id=1013016' },
        ]}
      />

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('income-tax.importantInfo')}</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>{t('income-tax.infoStandardDeduction')}</strong> {t('income-tax.infoStandardDeductionText')}
              </p>
              <p>
                <strong>{t('income-tax.info90Benefit')}</strong> {t('income-tax.info90BenefitText')}
              </p>
              <p>
                <strong>{t('income-tax.infoSpecialCategories')}</strong> {t('income-tax.infoSpecialCategoriesText')}
              </p>
              <p>
                <strong>{t('income-tax.infoMaxBases')}</strong> {t('income-tax.infoMaxBasesText1')} {formatNumber(OPV_MAX_BASE)}, {t('income-tax.infoMaxBasesText2')} {formatNumber(VOSMS_MAX_BASE)} {t('income-tax.infoMaxBasesText3')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Встраиваемый виджет */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="income-tax"
        calculatorTitle={t('income-tax.title')}
      />
      <LastUpdated calculatorId="income-tax" />
    </div>
  );
}
