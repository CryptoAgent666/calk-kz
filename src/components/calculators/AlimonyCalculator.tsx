import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Calculator, Users, DollarSign, Info, AlertTriangle, Baby, TrendingUp, BarChart3 } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function AlimonyCalculator() {
  const { t } = useTranslation('calculators');
  const [grossSalary, setGrossSalary] = useState<string>('');
  const [childrenCount, setChildrenCount] = useState<number>(1);
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);
  const [isSpecialCategory, setIsSpecialCategory] = useState<boolean>(false);

  const [results, setResults] = useState({
    opv: 0,
    vosms: 0,
    standardDeduction: 0,
    taxableIncome: 0,
    incomeTax: 0,
    totalDeductions: 0,
    netIncome: 0,
    alimonyRate: 0,
    alimonyAmount: 0,
    remainingIncome: 0,
    hasNinetyPercentReduction: false,
    effectiveAlimonyRate: 0
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
  const NINETY_PERCENT_THRESHOLD = 25 * MRP;
  const OPV_MAX_BASE = 50 * MZP;
  const VOSMS_MAX_BASE = 10 * MZP;

  const alimonyRates = {
    1: 0.25,
    2: 1/3,
    3: 0.50
  };

  const calculateAlimony = (gross: number) => {
    if (gross <= 0) {
      return {
        opv: 0, vosms: 0, standardDeduction: 0, taxableIncome: 0,
        incomeTax: 0, totalDeductions: 0, netIncome: 0,
        alimonyRate: 0, alimonyAmount: 0, remainingIncome: 0,
        hasNinetyPercentReduction: false, effectiveAlimonyRate: 0
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
    const totalDeductions = opv + vosms + incomeTax;
    const netIncome = gross - totalDeductions;

    let alimonyRate = 0;
    if (childrenCount === 1) {
      alimonyRate = alimonyRates[1];
    } else if (childrenCount === 2) {
      alimonyRate = alimonyRates[2];
    } else if (childrenCount >= 3) {
      alimonyRate = alimonyRates[3];
    }

    const alimonyAmount = netIncome * alimonyRate;
    const remainingIncome = netIncome - alimonyAmount;
    const effectiveAlimonyRate = gross > 0 ? (alimonyAmount / gross) * 100 : 0;

    return {
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      standardDeduction: Math.round(standardDeduction),
      taxableIncome: Math.round(taxableIncome),
      incomeTax: Math.round(incomeTax),
      totalDeductions: Math.round(totalDeductions),
      netIncome: Math.round(netIncome),
      alimonyRate: alimonyRate * 100,
      alimonyAmount: Math.round(alimonyAmount),
      remainingIncome: Math.round(remainingIncome),
      hasNinetyPercentReduction,
      effectiveAlimonyRate: Number(effectiveAlimonyRate.toFixed(2))
    };
  };

  useEffect(() => {
    const gross = parseFloat(grossSalary) || 0;
    setResults(calculateAlimony(gross));
  }, [grossSalary, childrenCount, isResident, isPrimaryJob, isSpecialCategory]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const getChildrenText = (count: number) => {
    if (count === 1) return t('alimony.childrenOptions.one');
    if (count === 2) return t('alimony.childrenOptions.two');
    if (count === 3) return t('alimony.childrenOptions.three');
    if (count === 4) return t('alimony.childrenOptions.four');
    return `${count} ${t('alimony.childrenOptions.multiple')}`;
  };

  const getAlimonyRateText = (count: number) => {
    if (count === 1) return t('alimony.alimonyRateText.one');
    if (count === 2) return t('alimony.alimonyRateText.two');
    if (count >= 3) return t('alimony.alimonyRateText.three');
    return t('alimony.alimonyRateText.zero');
  };

  const generateExportData = () => {
    if (!grossSalary || parseFloat(grossSalary) <= 0) return '';

    return `${t('alimony.exportParameters')}
- ${t('alimony.grossSalary')}: ${formatNumber(parseFloat(grossSalary))}
- ${t('alimony.childrenCount')}: ${childrenCount}
- ${t('alimony.isResident')}: ${isResident ? t('alimony.exportYes') : t('alimony.exportNo')}
- ${t('alimony.isPrimaryJob')}: ${isPrimaryJob ? t('alimony.exportYes') : t('alimony.exportNo')}
- ${t('alimony.isSpecialCategory')}: ${isSpecialCategory ? t('alimony.exportYes') : t('alimony.exportNo')}

${t('alimony.exportNetIncomeCalc')}
- ${t('alimony.opv')}: ${formatNumber(results.opv)}
- ${t('alimony.vosms')}: ${formatNumber(results.vosms)}
${results.standardDeduction > 0 ? `- ${t('alimony.standardDeduction')}: ${formatNumber(results.standardDeduction)}` : ''}
- ${t('alimony.ipn')}: ${formatNumber(results.incomeTax)}${results.hasNinetyPercentReduction ? ` (${t('alimony.ninetyPercentBenefit')})` : ''}
- ${t('alimony.netIncome')}: ${formatNumber(results.netIncome)}

${t('alimony.exportAlimonyCalc')}
- ${t('alimony.exportAlimonyRate')}: ${results.alimonyRate}% (${getAlimonyRateText(childrenCount)})
- ${t('alimony.exportAlimonySum')}: ${formatNumber(results.alimonyAmount)}
- ${t('alimony.exportRemainsToParent')}: ${formatNumber(results.remainingIncome)}
- ${t('alimony.exportEffectiveRate')}: ${results.effectiveAlimonyRate}%`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('alimony.heading')}</h1>
            <p className="text-gray-600">{t('alimony.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('alimony.parametersTitle')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('alimony.grossSalary')}
              </label>
              <RangeSlider
                value={parseFloat(grossSalary) || 0}
                onChange={(val) => setGrossSalary(String(val))}
                min={100000}
                max={2000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#ec4899"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="grossSalary"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  placeholder={t('alimony.grossSalaryPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('alimony.childrenCount')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setChildrenCount(count)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      childrenCount === count
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    <div className="font-semibold">{count === 4 ? '4+' : count}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getAlimonyRateText(count)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600 text-center">
                {t('alimony.forChildren')} {getChildrenText(childrenCount)} — {getAlimonyRateText(childrenCount)} {t('alimony.fromNetIncome')}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isResident"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="isResident" className="ml-2 block text-sm text-gray-700">
                  {t('alimony.isResident')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryJob"
                  checked={isPrimaryJob}
                  onChange={(e) => setIsPrimaryJob(e.target.checked)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimaryJob" className="ml-2 block text-sm text-gray-700">
                  {t('alimony.isPrimaryJob')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSpecialCategory"
                  checked={isSpecialCategory}
                  onChange={(e) => setIsSpecialCategory(e.target.checked)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="isSpecialCategory" className="ml-2 block text-sm text-gray-700">
                  {t('alimony.isSpecialCategory')}
                </label>
              </div>
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-pink-900 mb-2">{t('alimony.alimonyRatesTitle')}</h3>
              <ul className="text-sm text-pink-800 space-y-1">
                <li>• {t('alimony.alimonyRateOne')}</li>
                <li>• {t('alimony.alimonyRateTwo')}</li>
                <li>• {t('alimony.alimonyRateThree')}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('alimony.resultsTitle')}</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">
                  {t('alimony.alimonyFor')} {getChildrenText(childrenCount)}
                </span>
                <div className="flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-pink-600" />
                  <span className="text-2xl font-bold text-pink-700">{formatNumber(results.alimonyAmount)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {results.alimonyRate}% {t('alimony.ofNetIncome')} ({results.effectiveAlimonyRate}% {t('alimony.ofGrossIncome')})
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('alimony.netIncomeCalculation')}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('alimony.grossSalaryLabel')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(parseFloat(grossSalary) || 0)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('alimony.opv')}</span>
                  <span className="font-semibold text-red-600">-{formatNumber(results.opv)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('alimony.vosms')}</span>
                  <span className="font-semibold text-red-600">-{formatNumber(results.vosms)}</span>
                </div>

                {results.standardDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('alimony.standardDeduction')}</span>
                    <span className="font-semibold text-green-600">-{formatNumber(results.standardDeduction)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{t('alimony.ipn')}</span>
                    {results.hasNinetyPercentReduction && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {t('alimony.ninetyPercentBenefit')}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-red-600">-{formatNumber(results.incomeTax)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3">
                  <span className="font-semibold text-blue-900">{t('alimony.netIncome')}</span>
                  <span className="text-lg font-bold text-blue-700">{formatNumber(results.netIncome)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">{t('alimony.paymentStructure')}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 bg-pink-50 rounded-lg px-3">
                  <span className="font-semibold text-pink-900">{t('alimony.alimonyAmount')} ({results.alimonyRate}%)</span>
                  <span className="text-lg font-bold text-pink-700">{formatNumber(results.alimonyAmount)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                  <span className="font-semibold text-green-900">{t('alimony.remainingToParent')}</span>
                  <span className="text-lg font-bold text-green-700">{formatNumber(results.remainingIncome)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('alimony.monthlyTotals')}</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div>{t('alimony.taxesAndContributions')} <strong>{formatNumber(results.totalDeductions)}</strong></div>
                <div>{t('alimony.alimonyLabel')} <strong>{formatNumber(results.alimonyAmount)}</strong></div>
                <div>{t('alimony.personalDisposal')} <strong>{formatNumber(results.remainingIncome)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('alimony.legalInfoTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('alimony.alimonySizesTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('alimony.alimonySizeOne')}</li>
                  <li>{t('alimony.alimonySizeTwo')}</li>
                  <li>{t('alimony.alimonySizeThree')}</li>
                  <li>{t('alimony.alimonyFromNet')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('alimony.importantFeaturesTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('alimony.canBeChangedByCourt')}</li>
                  <li>{t('alimony.minSize')}</li>
                  <li>{t('alimony.indexation')}</li>
                  <li>{t('alimony.fixedAmount')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('alimony.examplesTitle')}</h2>

        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('alimony.example1Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('alimony.deductions')}</div>
                <div>{t('alimony.opv')}: 25,000 ₸</div>
                <div>{t('alimony.vosms')}: 5,000 ₸</div>
                <div>{t('alimony.ipn')}: ≈ 9,025 ₸</div>
                <div className="font-semibold">{t('alimony.total')} ≈ 39,025 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('alimony.netIncomeLabel')}</div>
                <div>250,000 - 39,025 = 210,975 ₸</div>
              </div>
              <div>
                <div className="font-medium text-pink-700">{t('alimony.alimonyPercentage')} (25%):</div>
                <div className="text-lg font-bold text-pink-600">≈ 52,744 ₸</div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('alimony.example2Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('alimony.deductions')}</div>
                <div>{t('alimony.opv')}: 40,000 ₸</div>
                <div>{t('alimony.vosms')}: 8,000 ₸</div>
                <div>{t('alimony.ipn')}: ≈ 22,225 ₸</div>
                <div className="font-semibold">{t('alimony.total')} ≈ 70,225 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('alimony.netIncomeLabel')}</div>
                <div>400,000 - 70,225 = 329,775 ₸</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('alimony.alimonyPercentage')} (33.33%):</div>
                <div className="text-lg font-bold text-teal-600">≈ 109,925 ₸</div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('alimony.example3Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('alimony.deductions')}</div>
                <div>{t('alimony.opv')}: 15,000 ₸</div>
                <div>{t('alimony.vosms')}: 3,000 ₸</div>
                <div>{t('alimony.ipn')}: ≈ 225 ₸</div>
                <div className="font-semibold">{t('alimony.total')} ≈ 18,225 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('alimony.netIncomeLabel')}</div>
                <div>150,000 - 18,225 = 131,775 ₸</div>
              </div>
              <div>
                <div className="font-medium text-orange-700">{t('alimony.alimonyPercentage')} (50%):</div>
                <div className="text-lg font-bold text-orange-600">≈ 65,888 ₸</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('alimony.importantInfoTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('alimony.collectionMethodsTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>{t('alimony.inSharesMethod')}</strong> — {t('alimony.inSharesDesc')}</li>
                  <li><strong>{t('alimony.fixedAmountMethod')}</strong> — {t('alimony.fixedAmountDesc')}</li>
                  <li><strong>{t('alimony.mixedMethod')}</strong> — {t('alimony.mixedMethodDesc')}</li>
                  <li><strong>{t('alimony.propertyMethod')}</strong> — {t('alimony.propertyMethodDesc')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('alimony.specialCasesTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('alimony.irregularIncome')}</li>
                  <li>{t('alimony.minAmount')}</li>
                  <li>{t('alimony.maxAmount')}</li>
                  <li>{t('alimony.canChangeInCourt')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800">
            <strong>{t('alimony.importantNote')}</strong> {t('alimony.calculatorNote')}
            <br />
            <strong>{t('alimony.mrpFor2025')}</strong> {formatNumber(MRP)} • <strong>{t('alimony.mzpFor2025')}</strong> {formatNumber(MZP)}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('alimony.statisticsTitle')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-pink-50 rounded-lg">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Baby className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('alimony.minForOneChild')}</h3>
            <div className="text-2xl font-bold text-pink-600">{formatNumber(MRP * 0.5)}</div>
            <div className="text-sm text-gray-600">50% {t('alimony.percentOfMrp')}</div>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('alimony.minForTwoChildren')}</h3>
            <div className="text-2xl font-bold text-teal-600">{formatNumber(MRP * 0.5 * 2)}</div>
            <div className="text-sm text-gray-600">50% {t('alimony.percentOfMrpMultiple')}</div>
          </div>

          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('alimony.minForThreePlus')}</h3>
            <div className="text-2xl font-bold text-orange-600">{formatNumber(MRP * 0.5 * 3)}</div>
            <div className="text-sm text-gray-600">50% {t('alimony.percentOfMrpByCount')}</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>{t('alimony.referenceNote')}</strong> {t('alimony.minAmountProtection')}
          </p>
        </div>
      </div>

      {parseFloat(grossSalary) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('alimony.exportTitle')}
            description={`${t('alimony.exportDescription')} ${getChildrenText(childrenCount)}`}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('alimony.faq.q1'), answer: t('alimony.faq.a1') },
          { question: t('alimony.faq.q2'), answer: t('alimony.faq.a2') },
          { question: t('alimony.faq.q3'), answer: t('alimony.faq.a3') },
          { question: t('alimony.faq.q4'), answer: t('alimony.faq.a4') },
          { question: t('alimony.faq.q5'), answer: t('alimony.faq.a5') }
        ]}
        sources={[
          { title: 'Кодекс о браке и семье РК', url: 'https://online.zakon.kz/document/?doc_id=31102748' },
          { title: 'Судебная практика по алиментам', url: 'https://sud.gov.kz/' },
        ]}
      />

      {/* Диаграмма структуры */}
      {results && results.monthlyAlimony > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Алименты', value: results.monthlyAlimony },
              { name: 'Остаток', value: results.income - results.monthlyAlimony },
            ]}
            title="Распределение дохода"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.monthlyAlimony > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт алиментов',
              subtitle: `${childrenCount} ${childrenCount === 1 ? 'ребёнок' : 'детей'}`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Доход', value: `${results.income.toLocaleString()} ₸` },
                    { label: 'Процент', value: `${results.percentage}%` },
                    { label: 'Ежемесячные алименты', value: `${results.monthlyAlimony.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="alimony-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="alimony"
        calculatorTitle="Калькулятор алиментов"
      />
    </div>
  );
}
