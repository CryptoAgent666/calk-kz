import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Baby, Calculator, Users, Wallet, Heart, Info, AlertTriangle, CheckCircle, Calendar, FileText, Building2, Clock, Briefcase, BarChart3 } from 'lucide-react';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function MaternityBenefitsCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [isEmployed, setIsEmployed] = useState<boolean>(true);
  const [averageIncomeForMaternity, setAverageIncomeForMaternity] = useState<string>('300000');
  const [averageIncomeForChildcare, setAverageIncomeForChildcare] = useState<string>('300000');
  const [childNumber, setChildNumber] = useState<number>(1);

  const [results, setResults] = useState({
    // Для работающих
    maternityBenefit: 0,
    childcareBenefit: 0,
    maternityOPV: 0,
    childcareOPV: 0,
    netMaternityBenefit: 0,
    netChildcareBenefit: 0,

    // Для неработающих
    birthBenefit: 0,
    monthlyChildcareBenefit: 0,

    // Общие
    totalFirstYearBenefits: 0,
    isIncomeExceedsLimit: false
  });

  // Константы на 2026 год
  const MZP = 85000; // МЗП
  const MRP = 4325;  // МРП
  const MAX_INCOME_FOR_CALCULATION = 7 * MZP; // 595,000 тенге
  const OPV_RATE = 0.10;
  const MATERNITY_COEFFICIENT = 4.2; // 126 дней / 30
  const CHILDCARE_RATE = 0.4;

  // Пособия для неработающих (в МРП)
  const birthBenefitMRP = childNumber <= 3 ? 38 : 63;
  const monthlyChildcareBenefitMRP = {
    1: 5.76,
    2: 6.81,
    3: 7.85,
    4: 8.90
  };

  const calculateBenefits = () => {
    if (isEmployed) {
      // Расчет для работающих
      const maternityIncome = Math.min(parseFloat(averageIncomeForMaternity) || 0, MAX_INCOME_FOR_CALCULATION);
      const childcareIncome = Math.min(parseFloat(averageIncomeForChildcare) || 0, MAX_INCOME_FOR_CALCULATION);

      // Единовременная выплата по беременности и родам
      const grossMaternityBenefit = maternityIncome * MATERNITY_COEFFICIENT;
      const maternityOPV = grossMaternityBenefit * OPV_RATE;
      const netMaternityBenefit = grossMaternityBenefit - maternityOPV;

      // Ежемесячная выплата по уходу за ребенком
      const grossChildcareBenefit = childcareIncome * CHILDCARE_RATE;
      const childcareOPV = grossChildcareBenefit * OPV_RATE;
      const netChildcareBenefit = grossChildcareBenefit - childcareOPV;

      // Общая сумма за первый год (единовременная + 18 месяцев ежемесячной)
      const totalFirstYearBenefits = netMaternityBenefit + (netChildcareBenefit * 18);

      const isIncomeExceedsLimit = (parseFloat(averageIncomeForMaternity) || 0) > MAX_INCOME_FOR_CALCULATION ||
                                  (parseFloat(averageIncomeForChildcare) || 0) > MAX_INCOME_FOR_CALCULATION;

      setResults({
        maternityBenefit: Math.round(grossMaternityBenefit),
        childcareBenefit: Math.round(grossChildcareBenefit),
        maternityOPV: Math.round(maternityOPV),
        childcareOPV: Math.round(childcareOPV),
        netMaternityBenefit: Math.round(netMaternityBenefit),
        netChildcareBenefit: Math.round(netChildcareBenefit),
        birthBenefit: 0,
        monthlyChildcareBenefit: 0,
        totalFirstYearBenefits: Math.round(totalFirstYearBenefits),
        isIncomeExceedsLimit
      });
    } else {
      // Расчет для неработающих
      const birthBenefit = birthBenefitMRP * MRP;
      const monthlyRate = monthlyChildcareBenefitMRP[Math.min(childNumber, 4) as keyof typeof monthlyChildcareBenefitMRP] || 8.90;
      const monthlyChildcareBenefit = monthlyRate * MRP;

      // Общая сумма за первый год (единовременная + 18 месяцев ежемесячной)
      const totalFirstYearBenefits = birthBenefit + (monthlyChildcareBenefit * 18);

      setResults({
        maternityBenefit: 0,
        childcareBenefit: 0,
        maternityOPV: 0,
        childcareOPV: 0,
        netMaternityBenefit: 0,
        netChildcareBenefit: 0,
        birthBenefit: Math.round(birthBenefit),
        monthlyChildcareBenefit: Math.round(monthlyChildcareBenefit),
        totalFirstYearBenefits: Math.round(totalFirstYearBenefits),
        isIncomeExceedsLimit: false
      });
    }
  };

  useEffect(() => {
    calculateBenefits();
  }, [isEmployed, averageIncomeForMaternity, averageIncomeForChildcare, childNumber]);

  const formatNumber = (num: number) => {
    const locale = i18n.language === 'kk' ? 'kk-KZ' : 'ru-KZ';
    return num.toLocaleString(locale) + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount} ${t('maternity-benefits.mrp')} (${formatNumber(mrpAmount * MRP)})`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('maternity-benefits.title')}</h1>
            <p className="text-gray-600">{t('maternity-benefits.description')}</p>
          </div>
        </div>
      </div>

      {/* Employment Status Selection */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('maternity-benefits.employmentStatus')}</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setIsEmployed(true)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              isEmployed
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <Wallet className="w-6 h-6" />
              <h3 className="font-semibold text-lg">{t('maternity-benefits.employed.title')}</h3>
            </div>
            <p className="text-sm mb-3">
              {t('maternity-benefits.employed.description')}
            </p>
            <div className="space-y-1 text-xs">
              <div>{t('maternity-benefits.employed.benefit1')}</div>
              <div>{t('maternity-benefits.employed.benefit2')}</div>
              <div>{t('maternity-benefits.employed.benefit3')}</div>
            </div>
          </button>

          <button
            onClick={() => setIsEmployed(false)}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              !isEmployed
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <Users className="w-6 h-6" />
              <h3 className="font-semibold text-lg">{t('maternity-benefits.unemployed.title')}</h3>
            </div>
            <p className="text-sm mb-3">
              {t('maternity-benefits.unemployed.description')}
            </p>
            <div className="space-y-1 text-xs">
              <div>{t('maternity-benefits.unemployed.benefit1')}</div>
              <div>{t('maternity-benefits.unemployed.benefit2')}</div>
              <div>{t('maternity-benefits.unemployed.benefit3')}</div>
            </div>
          </button>
        </div>
      </div>

      <QuickAnswer calculatorId="maternity-benefits" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isEmployed ? t('maternity-benefits.calculationParameters') : t('maternity-benefits.childInfo')}
          </h2>

          {isEmployed ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('maternity-benefits.averageIncome12Months')}
                </label>
                <RangeSlider
                  value={parseFloat(averageIncomeForMaternity) || 0}
                  onChange={(val) => setAverageIncomeForMaternity(String(val))}
                  min={100000}
                  max={2000000}
                  step={50000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#ec4899"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="averageIncomeForMaternity"
                    value={averageIncomeForMaternity}
                    onChange={(e) => setAverageIncomeForMaternity(e.target.value)}
                    placeholder={t('maternity-benefits.forLumpSumPayment')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('maternity-benefits.maxForCalculation')}: {formatNumber(MAX_INCOME_FOR_CALCULATION)} (7 {t('maternity-benefits.mzp')})
                </p>
              </div>

              <div>
                <label htmlFor="averageIncomeForChildcare" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('maternity-benefits.averageIncome24Months')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="averageIncomeForChildcare"
                    value={averageIncomeForChildcare}
                    onChange={(e) => setAverageIncomeForChildcare(e.target.value)}
                    placeholder={t('maternity-benefits.forMonthlyPayment')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('maternity-benefits.incomeWithContributions')}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">{t('maternity-benefits.calculationFormulas')}</h3>
                <div className="space-y-1 text-xs text-blue-800">
                  <div>{t('maternity-benefits.lumpSumFormula')}</div>
                  <div>{t('maternity-benefits.monthlyFormula')}</div>
                  <div>{t('maternity-benefits.coefficientExplanation')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('maternity-benefits.childNumberQuestion')}
                </label>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setChildNumber(num)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        childNumber === num
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-lg font-semibold">
                        {num === 4 ? '4+' : num}
                      </div>
                      <div className="text-xs text-gray-600">
                        {num === 4 ? t('maternity-benefits.fourthPlus') : t(`maternity-benefits.childOrdinal${num}`)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-teal-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-teal-900 mb-2">{t('maternity-benefits.stateBenefits')}</h3>
                <div className="space-y-1 text-xs text-teal-800">
                  <div><strong>{t('maternity-benefits.lumpSumBenefit')}:</strong></div>
                  <div>{t('maternity-benefits.children1to3')}: 38 {t('maternity-benefits.mrp')} ({formatNumber(38 * MRP)})</div>
                  <div>{t('maternity-benefits.child4Plus')}: 63 {t('maternity-benefits.mrp')} ({formatNumber(63 * MRP)})</div>
                  <div className="mt-2"><strong>{t('maternity-benefits.monthlyBenefitUpTo15')}:</strong></div>
                  <div>{t('maternity-benefits.childBenefitRates')}</div>
                  <div>{t('maternity-benefits.childBenefitRatesExtra')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('maternity-benefits.results')}</h2>

          {isEmployed ? (
            <div className="space-y-6">
              {/* Maternity Benefit */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>{t('maternity-benefits.maternityLumpSum')}</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('maternity-benefits.calculatedAmount')}</span>
                    <span className="font-medium">{formatNumber(results.maternityBenefit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('maternity-benefits.opv10')}</span>
                    <span className="font-medium text-red-600">-{formatNumber(results.maternityOPV)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t">
                    <span className="font-semibold">{t('maternity-benefits.toReceive')}</span>
                    <span className="font-bold text-green-600">{formatNumber(results.netMaternityBenefit)}</span>
                  </div>
                </div>
              </div>

              {/* Childcare Benefit */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Baby className="w-5 h-5 text-blue-500" />
                  <span>{t('maternity-benefits.monthlyChildcarePayment')}</span>
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('maternity-benefits.calculatedAmount')}</span>
                    <span className="font-medium">{formatNumber(results.childcareBenefit)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('maternity-benefits.opv10')}</span>
                    <span className="font-medium text-red-600">-{formatNumber(results.childcareOPV)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t">
                    <span className="font-semibold">{t('maternity-benefits.monthlyToReceive')}</span>
                    <span className="font-bold text-green-600">{formatNumber(results.netChildcareBenefit)}</span>
                  </div>
                </div>
              </div>

              {results.isIncomeExceedsLimit && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900">{t('maternity-benefits.incomeLimit')}</h3>
                      <p className="text-amber-800 text-sm">
                        {t('maternity-benefits.incomeLimitWarning')} ({formatNumber(MAX_INCOME_FOR_CALCULATION)}). {t('maternity-benefits.calculatedWithLimit')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Birth Benefit */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>{t('maternity-benefits.birthLumpSumBenefit')}</span>
                </h3>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {childNumber <= 3 ? t(`maternity-benefits.childOrdinal${childNumber}Child`) : t('maternity-benefits.fourthPlusChild')}
                  </span>
                  <span className="font-bold text-green-600">{formatNumber(results.birthBenefit)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatMRP(childNumber <= 3 ? 38 : 63)}
                </div>
              </div>

              {/* Monthly Childcare Benefit */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Baby className="w-5 h-5 text-blue-500" />
                  <span>{t('maternity-benefits.monthlyChildcareBenefitUpTo15')}</span>
                </h3>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">{t('maternity-benefits.monthly')}</span>
                  <span className="font-bold text-green-600">{formatNumber(results.monthlyChildcareBenefit)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatMRP(monthlyChildcareBenefitMRP[Math.min(childNumber, 4) as keyof typeof monthlyChildcareBenefitMRP] || 8.90)}
                </div>
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                {t('maternity-benefits.totalFirst15Years')}
              </span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-700">{formatNumber(results.totalFirstYearBenefits)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {isEmployed
                ? t('maternity-benefits.includesLumpSumPlus18Months')
                : t('maternity-benefits.includesBirthBenefitPlus18Months')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('maternity-benefits.importantInfo')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('maternity-benefits.forEmployed')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('maternity-benefits.employedInfo1')}</li>
                  <li>{t('maternity-benefits.employedInfo2')}</li>
                  <li>{t('maternity-benefits.employedInfo3')}</li>
                  <li>{t('maternity-benefits.employedInfo4')}</li>
                  <li>{t('maternity-benefits.employedInfo5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('maternity-benefits.forUnemployed')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('maternity-benefits.unemployedInfo1')}</li>
                  <li>{t('maternity-benefits.unemployedInfo2')}</li>
                  <li>{t('maternity-benefits.unemployedInfo3')}</li>
                  <li>{t('maternity-benefits.unemployedInfo4')}</li>
                  <li>{t('maternity-benefits.unemployedInfo5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                {t('maternity-benefits.keyDifference')}
              </h4>
              <p className="text-green-800 text-sm">
                {t('maternity-benefits.keyDifferenceText')}
                <br />
                <strong>{t('maternity-benefits.mzp2025')}:</strong> {formatNumber(MZP)} • <strong>{t('maternity-benefits.mrp2025')}:</strong> {formatNumber(MRP)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Calendar className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('maternity-benefits.maternityLeaveKz2025')}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-pink-50 rounded-lg p-5 border border-pink-100">
            <h3 className="font-semibold text-pink-900 mb-4 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{t('maternity-benefits.whenToStartLeave')}</span>
            </h3>
            <div className="space-y-3 text-sm text-pink-800">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-pink-700">30</div>
                <div>
                  <strong>{t('maternity-benefits.week30')}</strong> - {t('maternity-benefits.week30Description')}
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-pink-700">28</div>
                <div>
                  <strong>{t('maternity-benefits.week28')}</strong> - {t('maternity-benefits.week28Description')}
                </div>
              </div>
              <p className="text-xs text-pink-600 mt-2 pt-2 border-t border-pink-200">
                {t('maternity-benefits.leaveStartNote')}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{t('maternity-benefits.leaveDuration')}</span>
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-900">{t('maternity-benefits.normalPregnancy')}</div>
                <div className="text-lg font-bold text-blue-600 mt-1">{t('maternity-benefits.days126')}</div>
                <div className="text-xs">{t('maternity-benefits.days126Breakdown')}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-900">{t('maternity-benefits.complicatedMultiple')}</div>
                <div className="text-lg font-bold text-blue-600 mt-1">{t('maternity-benefits.days140')}</div>
                <div className="text-xs">{t('maternity-benefits.days140Breakdown')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-5 border border-gray-200 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t('maternity-benefits.leaveStructure')}</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 p-4 bg-white rounded-lg border-l-4 border-pink-400">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('maternity-benefits.stage1')}</div>
              <div className="font-semibold text-gray-900 mt-1">{t('maternity-benefits.maternityLeave')}</div>
              <div className="text-sm text-gray-600 mt-2">{t('maternity-benefits.stage1Description')}</div>
              <div className="text-xs text-pink-600 mt-2">{t('maternity-benefits.stage1Payment')}</div>
            </div>
            <div className="flex items-center justify-center text-gray-400">
              <span className="hidden md:block">→</span>
              <span className="md:hidden">↓</span>
            </div>
            <div className="flex-1 p-4 bg-white rounded-lg border-l-4 border-blue-400">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('maternity-benefits.stage2')}</div>
              <div className="font-semibold text-gray-900 mt-1">{t('maternity-benefits.childcareLeave')}</div>
              <div className="text-sm text-gray-600 mt-2">{t('maternity-benefits.stage2Description')}</div>
              <div className="text-xs text-blue-600 mt-2">{t('maternity-benefits.stage2Payment')}</div>
            </div>
            <div className="flex items-center justify-center text-gray-400">
              <span className="hidden md:block">→</span>
              <span className="md:hidden">↓</span>
            </div>
            <div className="flex-1 p-4 bg-white rounded-lg border-l-4 border-green-400">
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('maternity-benefits.stage3')}</div>
              <div className="font-semibold text-gray-900 mt-1">{t('maternity-benefits.returnToWork')}</div>
              <div className="text-sm text-gray-600 mt-2">{t('maternity-benefits.stage3Description')}</div>
              <div className="text-xs text-green-600 mt-2">{t('maternity-benefits.stage3Note')}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span>{t('maternity-benefits.documentsRequired')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{t('maternity-benefits.document1')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{t('maternity-benefits.document2')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{t('maternity-benefits.document3')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{t('maternity-benefits.document4')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{t('maternity-benefits.document5')}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <span>{t('maternity-benefits.whereToApply')}</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">{t('maternity-benefits.forEmployedApply')}:</div>
                <div className="text-blue-800 mt-1">
                  {t('maternity-benefits.employedApplyText')}
                </div>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <div className="font-medium text-teal-900">{t('maternity-benefits.forUnemployedApply')}:</div>
                <div className="text-teal-800 mt-1">
                  {t('maternity-benefits.unemployedApplyText')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Briefcase className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-semibold text-gray-900">{t('maternity-benefits.workingWomenRights')}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-900 mb-2">{t('maternity-benefits.jobSecurity')}</h3>
            <p className="text-sm text-green-800">
              {t('maternity-benefits.jobSecurityText')}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">{t('maternity-benefits.dismissalProhibition')}</h3>
            <p className="text-sm text-blue-800">
              {t('maternity-benefits.dismissalProhibitionText')}
            </p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-amber-900 mb-2">{t('maternity-benefits.earlyReturn')}</h3>
            <p className="text-sm text-amber-800">
              {t('maternity-benefits.earlyReturnText')}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t('maternity-benefits.faqTitle')}</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{t('maternity-benefits.faq1Question')}</h4>
              <p className="text-sm text-gray-700">
                {t('maternity-benefits.faq1Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{t('maternity-benefits.faq2Question')}</h4>
              <p className="text-sm text-gray-700">
                {t('maternity-benefits.faq2Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{t('maternity-benefits.faq3Question')}</h4>
              <p className="text-sm text-gray-700">
                {t('maternity-benefits.faq3Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{t('maternity-benefits.faq4Question')}</h4>
              <p className="text-sm text-gray-700">
                {t('maternity-benefits.faq4Answer')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl shadow-sm border border-pink-200 p-6">
        <h3 className="text-lg font-semibold text-pink-900 mb-4">{t('maternity-benefits.stepByStepGuide')}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-pink-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-pink-600 font-bold">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{t('maternity-benefits.step1Title')}</h4>
            <p className="text-xs text-gray-600">
              {t('maternity-benefits.step1Description')}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-pink-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-pink-600 font-bold">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{t('maternity-benefits.step2Title')}</h4>
            <p className="text-xs text-gray-600">
              {t('maternity-benefits.step2Description')}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-pink-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-pink-600 font-bold">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{t('maternity-benefits.step3Title')}</h4>
            <p className="text-xs text-gray-600">
              {t('maternity-benefits.step3Description')}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-pink-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-pink-600 font-bold">4</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{t('maternity-benefits.step4Title')}</h4>
            <p className="text-xs text-gray-600">
              {t('maternity-benefits.step4Description')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="maternity-benefits" />
      <MethodologySection steps={getMethodology('maternity-benefits')} />
      <FAQSection
        title={t('maternity-benefits.faqTitle')}
        items={[
          { question: t('maternity-benefits.faq.q1'), answer: t('maternity-benefits.faq.a1') },
          { question: t('maternity-benefits.faq.q2'), answer: t('maternity-benefits.faq.a2') },
          { question: t('maternity-benefits.faq.q3'), answer: t('maternity-benefits.faq.a3') },
          { question: t('maternity-benefits.faq.q4'), answer: t('maternity-benefits.faq.a4') },
          { question: t('maternity-benefits.faq.q5'), answer: t('maternity-benefits.faq.a5') }
        ]}
        sources={[
          { title: t('maternity-benefits.sources.egov'), url: 'https://egov.kz/' },
          { title: t('maternity-benefits.sources.gfss'), url: 'https://gfss.kz/' },
        ]}
      />

      {/* Диаграмма структуры */}
      {results && results.totalFirstYearBenefits > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('maternity-benefits.maternityLumpSum'), value: results.maternityBenefit },
              { name: t('maternity-benefits.birthLumpSumBenefit'), value: results.birthBenefit },
            ].filter(item => item.value > 0)}
            title={t('maternity-benefits.chartTitle')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalFirstYearBenefits > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('maternity-benefits.title'),
              subtitle: t('maternity-benefits.subtitle'),
              sections: [
                {
                  title: t('maternity-benefits.results'),
                  data: [
                    { label: t('maternity-benefits.maternityLumpSum'), value: `${results.maternityBenefit.toLocaleString()} ₸` },
                    { label: t('maternity-benefits.birthLumpSumBenefit'), value: `${results.birthBenefit.toLocaleString()} ₸` },
                    { label: t('maternity-benefits.totalFirst15Years'), value: `${results.totalFirstYearBenefits.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('maternity-benefits.exportFooter')
            }}
            filename="maternity-benefits-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="maternity-benefits"
        calculatorTitle={t('maternity-benefits.embedTitle')}
      />
      <LastUpdated calculatorId="maternity-benefits" />
    </div>
  );
}
