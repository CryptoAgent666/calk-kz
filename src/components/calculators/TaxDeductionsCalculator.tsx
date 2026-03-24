import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Calculator, GraduationCap, Heart, Home, DollarSign, Info, AlertTriangle, TrendingUp, FileText, CheckCircle, Target, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';

export default function TaxDeductionsCalculator() {
  const { t } = useTranslation('calculators');
  const [annualIncome, setAnnualIncome] = useState<string>('500000');
  const [educationExpenses, setEducationExpenses] = useState<string>('200000');
  const [medicalExpenses, setMedicalExpenses] = useState<string>('0');
  const [mortgageInterest, setMortgageInterest] = useState<string>('0');
  const [pensionContributions, setPensionContributions] = useState<string>('0');
  const [charityDonations, setCharityDonations] = useState<string>('0');

  const [results, setResults] = useState({
    allowedEducationDeduction: 0,
    allowedMedicalDeduction: 0,
    allowedMortgageDeduction: 0,
    allowedPensionDeduction: 0,
    allowedCharityDeduction: 0,

    educationExcess: 0,
    medicalExcess: 0,
    mortgageExcess: 0,
    pensionExcess: 0,
    charityExcess: 0,

    totalDeductions: 0,
    taxableIncomeReduction: 0,
    taxRefundAmount: 0,
    effectiveRefundRate: 0,

    maxTotalDeductionLimit: 0,
    isProfitable: false,
    yearlyTaxWithoutDeductions: 0,
    yearlyTaxWithDeductions: 0
  });

  const MRP_2026 = 4325;
  const IPN_RATE_BASE = 0.10;
  const IPN_RATE_HIGH = 0.15;
  const IPN_ANNUAL_THRESHOLD = 8500 * MRP_2026; // 36,762,500 тенге/год

  const calculateProgressiveIPN = (taxableIncome: number) => {
    if (taxableIncome <= 0) return 0;
    if (taxableIncome <= IPN_ANNUAL_THRESHOLD) {
      return taxableIncome * IPN_RATE_BASE;
    }
    return IPN_ANNUAL_THRESHOLD * IPN_RATE_BASE + (taxableIncome - IPN_ANNUAL_THRESHOLD) * IPN_RATE_HIGH;
  };

  const EDUCATION_LIMIT_MRP = 118;
  const MEDICAL_LIMIT_MRP = 118;
  const MORTGAGE_LIMIT_MRP = 118;
  const PENSION_LIMIT_MRP = 118;
  const CHARITY_LIMIT_MRP = 118;
  const MAX_TOTAL_DEDUCTION_MRP = 400;

  const EDUCATION_LIMIT = EDUCATION_LIMIT_MRP * MRP_2026;
  const MEDICAL_LIMIT = MEDICAL_LIMIT_MRP * MRP_2026;
  const MORTGAGE_LIMIT = MORTGAGE_LIMIT_MRP * MRP_2026;
  const PENSION_LIMIT = PENSION_LIMIT_MRP * MRP_2026;
  const CHARITY_LIMIT = CHARITY_LIMIT_MRP * MRP_2026;
  const MAX_TOTAL_DEDUCTION = MAX_TOTAL_DEDUCTION_MRP * MRP_2026;

  const calculateTaxDeductions = () => {
    const income = parseFloat(annualIncome) || 0;
    const education = parseFloat(educationExpenses) || 0;
    const medical = parseFloat(medicalExpenses) || 0;
    const mortgage = parseFloat(mortgageInterest) || 0;
    const pension = parseFloat(pensionContributions) || 0;
    const charity = parseFloat(charityDonations) || 0;

    if (income <= 0) {
      setResults({
        allowedEducationDeduction: 0, allowedMedicalDeduction: 0, allowedMortgageDeduction: 0,
        allowedPensionDeduction: 0, allowedCharityDeduction: 0,
        educationExcess: 0, medicalExcess: 0, mortgageExcess: 0, pensionExcess: 0, charityExcess: 0,
        totalDeductions: 0, taxableIncomeReduction: 0, taxRefundAmount: 0, effectiveRefundRate: 0,
        maxTotalDeductionLimit: MAX_TOTAL_DEDUCTION, isProfitable: false,
        yearlyTaxWithoutDeductions: 0, yearlyTaxWithDeductions: 0
      });
      return;
    }

    const allowedEducationDeduction = Math.min(education, EDUCATION_LIMIT);
    const allowedMedicalDeduction = Math.min(medical, MEDICAL_LIMIT);
    const allowedMortgageDeduction = Math.min(mortgage, MORTGAGE_LIMIT);
    const allowedPensionDeduction = Math.min(pension, PENSION_LIMIT);
    const allowedCharityDeduction = Math.min(charity, CHARITY_LIMIT);

    const educationExcess = Math.max(0, education - EDUCATION_LIMIT);
    const medicalExcess = Math.max(0, medical - MEDICAL_LIMIT);
    const mortgageExcess = Math.max(0, mortgage - MORTGAGE_LIMIT);
    const pensionExcess = Math.max(0, pension - PENSION_LIMIT);
    const charityExcess = Math.max(0, charity - CHARITY_LIMIT);

    const totalDeductionsBeforeLimit = allowedEducationDeduction + allowedMedicalDeduction +
                                      allowedMortgageDeduction + allowedPensionDeduction + allowedCharityDeduction;

    const totalDeductions = Math.min(totalDeductionsBeforeLimit, MAX_TOTAL_DEDUCTION);

    const taxableIncomeReduction = Math.min(totalDeductions, income);

    const yearlyTaxWithoutDeductions = calculateProgressiveIPN(income);
    const taxableIncomeAfterDeductions = Math.max(0, income - taxableIncomeReduction);
    const yearlyTaxWithDeductions = calculateProgressiveIPN(taxableIncomeAfterDeductions);
    const taxRefundAmount = yearlyTaxWithoutDeductions - yearlyTaxWithDeductions;

    const effectiveRefundRate = totalDeductions > 0 ? (taxRefundAmount / totalDeductions) * 100 : 0;

    const isProfitable = taxRefundAmount > 0;

    setResults({
      allowedEducationDeduction: Math.round(allowedEducationDeduction),
      allowedMedicalDeduction: Math.round(allowedMedicalDeduction),
      allowedMortgageDeduction: Math.round(allowedMortgageDeduction),
      allowedPensionDeduction: Math.round(allowedPensionDeduction),
      allowedCharityDeduction: Math.round(allowedCharityDeduction),

      educationExcess: Math.round(educationExcess),
      medicalExcess: Math.round(medicalExcess),
      mortgageExcess: Math.round(mortgageExcess),
      pensionExcess: Math.round(pensionExcess),
      charityExcess: Math.round(charityExcess),

      totalDeductions: Math.round(totalDeductions),
      taxableIncomeReduction: Math.round(taxableIncomeReduction),
      taxRefundAmount: Math.round(taxRefundAmount),
      effectiveRefundRate: Number(effectiveRefundRate.toFixed(2)),

      maxTotalDeductionLimit: MAX_TOTAL_DEDUCTION,
      isProfitable,
      yearlyTaxWithoutDeductions: Math.round(yearlyTaxWithoutDeductions),
      yearlyTaxWithDeductions: Math.round(yearlyTaxWithDeductions)
    });
  };

  useEffect(() => {
    calculateTaxDeductions();
  }, [annualIncome, educationExpenses, medicalExpenses, mortgageInterest, pensionContributions, charityDonations]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount.toLocaleString()} ${t('tax-deductions.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  const formatPercent = (num: number) => {
    return num.toFixed(2) + '%';
  };

  const deductionTypes = [
    {
      id: 'education',
      name: t('tax-deductions.deductionTypes.education.name'),
      description: t('tax-deductions.deductionTypes.education.description'),
      icon: GraduationCap,
      limit: EDUCATION_LIMIT,
      limitMRP: EDUCATION_LIMIT_MRP,
      examples: t('tax-deductions.deductionTypes.education.examples')
    },
    {
      id: 'medical',
      name: t('tax-deductions.deductionTypes.medical.name'),
      description: t('tax-deductions.deductionTypes.medical.description'),
      icon: Heart,
      limit: MEDICAL_LIMIT,
      limitMRP: MEDICAL_LIMIT_MRP,
      examples: t('tax-deductions.deductionTypes.medical.examples')
    },
    {
      id: 'mortgage',
      name: t('tax-deductions.deductionTypes.mortgage.name'),
      description: t('tax-deductions.deductionTypes.mortgage.description'),
      icon: Home,
      limit: MORTGAGE_LIMIT,
      limitMRP: MORTGAGE_LIMIT_MRP,
      examples: t('tax-deductions.deductionTypes.mortgage.examples')
    },
    {
      id: 'pension',
      name: t('tax-deductions.deductionTypes.pension.name'),
      description: t('tax-deductions.deductionTypes.pension.description'),
      icon: TrendingUp,
      limit: PENSION_LIMIT,
      limitMRP: PENSION_LIMIT_MRP,
      examples: t('tax-deductions.deductionTypes.pension.examples')
    },
    {
      id: 'charity',
      name: t('tax-deductions.deductionTypes.charity.name'),
      description: t('tax-deductions.deductionTypes.charity.description'),
      icon: Heart,
      limit: CHARITY_LIMIT,
      limitMRP: CHARITY_LIMIT_MRP,
      examples: t('tax-deductions.deductionTypes.charity.examples')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('tax-deductions.title')}</h1>
            <p className="text-gray-600">{t('tax-deductions.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('tax-deductions.importantInfo.title')}
            </h3>
            <div className="text-blue-800 space-y-2">
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.importantInfo.description1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.importantInfo.description2') }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.inputSection.title')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('tax-deductions.inputSection.annualIncome.label')}
              </label>
              <RangeSlider
                value={parseFloat(annualIncome) || 0}
                onChange={(val) => setAnnualIncome(String(val))}
                min={500000}
                max={50000000}
                step={500000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="annualIncome"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder={t('tax-deductions.inputSection.annualIncome.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.annualIncome.hint')}
              </p>
            </div>

            <div>
              <label htmlFor="educationExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                {t('tax-deductions.inputSection.educationExpenses.label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="educationExpenses"
                  value={educationExpenses}
                  onChange={(e) => setEducationExpenses(e.target.value)}
                  placeholder={t('tax-deductions.inputSection.educationExpenses.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.educationExpenses.hint')}: {formatMRP(EDUCATION_LIMIT_MRP)} {t('tax-deductions.perYear')}
              </p>
            </div>

            <div>
              <label htmlFor="medicalExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1" />
                {t('tax-deductions.inputSection.medicalExpenses.label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="medicalExpenses"
                  value={medicalExpenses}
                  onChange={(e) => setMedicalExpenses(e.target.value)}
                  placeholder={t('tax-deductions.inputSection.medicalExpenses.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.medicalExpenses.hint')}: {formatMRP(MEDICAL_LIMIT_MRP)} {t('tax-deductions.perYear')}
              </p>
            </div>

            <div>
              <label htmlFor="mortgageInterest" className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4 inline mr-1" />
                {t('tax-deductions.inputSection.mortgageInterest.label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="mortgageInterest"
                  value={mortgageInterest}
                  onChange={(e) => setMortgageInterest(e.target.value)}
                  placeholder={t('tax-deductions.inputSection.mortgageInterest.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.mortgageInterest.hint')}: {formatMRP(MORTGAGE_LIMIT_MRP)}
              </p>
            </div>

            <div>
              <label htmlFor="pensionContributions" className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                {t('tax-deductions.inputSection.pensionContributions.label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="pensionContributions"
                  value={pensionContributions}
                  onChange={(e) => setPensionContributions(e.target.value)}
                  placeholder={t('tax-deductions.inputSection.pensionContributions.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.pensionContributions.hint')}: {formatMRP(PENSION_LIMIT_MRP)} {t('tax-deductions.perYear')}
              </p>
            </div>

            <div>
              <label htmlFor="charityDonations" className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1" />
                {t('tax-deductions.inputSection.charityDonations.label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="charityDonations"
                  value={charityDonations}
                  onChange={(e) => setCharityDonations(e.target.value)}
                  placeholder={t('tax-deductions.inputSection.charityDonations.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.charityDonations.hint')}: {formatMRP(CHARITY_LIMIT_MRP)} {t('tax-deductions.perYear')}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">{t('tax-deductions.limits.title')}</h3>
              <div className="text-xs text-green-800 space-y-1">
                <div>• {t('tax-deductions.limits.perType')}: {formatMRP(118)}</div>
                <div>• {t('tax-deductions.limits.totalLimit')}: {formatMRP(MAX_TOTAL_DEDUCTION_MRP)}</div>
                <div>• {t('tax-deductions.limits.refund')}: {t('tax-deductions.limits.refundAmount')}</div>
                <div>• {t('tax-deductions.limits.mrp2026')}: {formatNumber(MRP_2026)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.results.title')}</h2>

          {results.isProfitable ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">{t('tax-deductions.results.taxRefund')}</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">{formatNumber(results.taxRefundAmount)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatPercent(results.effectiveRefundRate)} {t('tax-deductions.results.ofTotalDeductions')}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('tax-deductions.results.appliedDeductions')}</h3>

                {results.allowedEducationDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">{t('tax-deductions.deductionTypes.education.shortName')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatNumber(results.allowedEducationDeduction)}</span>
                  </div>
                )}

                {results.allowedMedicalDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      <span className="text-gray-600">{t('tax-deductions.deductionTypes.medical.shortName')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatNumber(results.allowedMedicalDeduction)}</span>
                  </div>
                )}

                {results.allowedMortgageDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Home className="w-4 h-4 text-teal-600" />
                      <span className="text-gray-600">{t('tax-deductions.deductionTypes.mortgage.shortName')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatNumber(results.allowedMortgageDeduction)}</span>
                  </div>
                )}

                {results.allowedPensionDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-600">{t('tax-deductions.deductionTypes.pension.shortName')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatNumber(results.allowedPensionDeduction)}</span>
                  </div>
                )}

                {results.allowedCharityDeduction > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-pink-600" />
                      <span className="text-gray-600">{t('tax-deductions.deductionTypes.charity.shortName')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatNumber(results.allowedCharityDeduction)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3 border-t border-gray-200">
                  <span className="font-semibold text-blue-900">{t('tax-deductions.results.totalDeductions')}</span>
                  <span className="text-lg font-bold text-blue-700">{formatNumber(results.totalDeductions)}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{t('tax-deductions.results.taxCalculation.title')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.taxCalculation.annualIncome')}:</span>
                    <span className="font-medium">{formatNumber(parseFloat(annualIncome) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.taxCalculation.taxWithoutDeductions')}:</span>
                    <span className="font-medium">{formatNumber(results.yearlyTaxWithoutDeductions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.taxCalculation.baseReduction')}:</span>
                    <span className="font-medium text-green-600">{formatNumber(results.taxableIncomeReduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.taxCalculation.taxWithDeductions')}:</span>
                    <span className="font-medium">{formatNumber(results.yearlyTaxWithDeductions)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">{t('tax-deductions.results.taxCalculation.refundAmount')}:</span>
                    <span className="font-bold text-green-600">{formatNumber(results.taxRefundAmount)}</span>
                  </div>
                </div>
              </div>

              {(results.educationExcess > 0 || results.medicalExcess > 0 || results.mortgageExcess > 0 ||
                results.pensionExcess > 0 || results.charityExcess > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900 mb-2">{t('tax-deductions.results.excessWarning.title')}</h3>
                      <div className="space-y-1 text-sm text-amber-800">
                        {results.educationExcess > 0 && (
                          <div>• {t('tax-deductions.deductionTypes.education.shortName')}: {formatNumber(results.educationExcess)} {t('tax-deductions.results.excessWarning.overLimit')}</div>
                        )}
                        {results.medicalExcess > 0 && (
                          <div>• {t('tax-deductions.deductionTypes.medical.shortName')}: {formatNumber(results.medicalExcess)} {t('tax-deductions.results.excessWarning.overLimit')}</div>
                        )}
                        {results.mortgageExcess > 0 && (
                          <div>• {t('tax-deductions.deductionTypes.mortgage.shortName')}: {formatNumber(results.mortgageExcess)} {t('tax-deductions.results.excessWarning.overLimit')}</div>
                        )}
                        {results.pensionExcess > 0 && (
                          <div>• {t('tax-deductions.deductionTypes.pension.shortName')}: {formatNumber(results.pensionExcess)} {t('tax-deductions.results.excessWarning.overLimit')}</div>
                        )}
                        {results.charityExcess > 0 && (
                          <div>• {t('tax-deductions.deductionTypes.charity.shortName')}: {formatNumber(results.charityExcess)} {t('tax-deductions.results.excessWarning.overLimit')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {annualIncome ?
                t('tax-deductions.results.noRefund') :
                t('tax-deductions.results.enterData')
              }
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.reference.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deductionTypes.map((deduction) => {
            const IconComponent = deduction.icon;
            return (
              <div key={deduction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{deduction.name}</h3>
                    <div className="text-xs text-gray-500">{t('tax-deductions.reference.upTo')} {formatMRP(deduction.limitMRP)}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{deduction.description}</p>
                <div className="text-xs text-gray-500">
                  <strong>{t('tax-deductions.reference.examples')}:</strong> {deduction.examples}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('tax-deductions.reference.generalRules.title')}
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• {t('tax-deductions.reference.generalRules.rule1')}: {formatMRP(MAX_TOTAL_DEDUCTION_MRP)} {t('tax-deductions.perYear')}</p>
                <p>• {t('tax-deductions.reference.generalRules.rule2')}</p>
                <p>• {t('tax-deductions.reference.generalRules.rule3')}</p>
                <p>• {t('tax-deductions.reference.generalRules.rule4')}</p>
                <p>• {t('tax-deductions.reference.generalRules.rule5')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.examples.title')}</h2>

        <div className="space-y-6">
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('tax-deductions.examples.example1.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example1.sourceData')}:</div>
                <div>{t('tax-deductions.examples.example1.annualIncome')}: 3,000,000 ₸</div>
                <div>{t('tax-deductions.examples.example1.childEducation')}: 600,000 ₸</div>
                <div>{t('tax-deductions.examples.example1.treatment')}: 300,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example1.limits')}:</div>
                <div>{t('tax-deductions.examples.example1.education')}: 464,976 ₸</div>
                <div>{t('tax-deductions.examples.example1.medicine')}: 300,000 ₸</div>
                <div>{t('tax-deductions.examples.example1.totalDeductions')}: 764,976 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example1.tax')}:</div>
                <div>{t('tax-deductions.examples.example1.beforeDeductions')}: 300,000 ₸</div>
                <div>{t('tax-deductions.examples.example1.afterDeductions')}: 223,502 ₸</div>
                <div>{t('tax-deductions.examples.example1.savings')}: 76,498 ₸</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('tax-deductions.examples.example1.toRefund')}:</div>
                <div className="text-lg font-bold text-green-600">76,498 ₸</div>
                <div className="text-xs text-green-600">{t('tax-deductions.examples.example1.percentOfDeductions')}</div>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('tax-deductions.examples.example2.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example2.sourceData')}:</div>
                <div>{t('tax-deductions.examples.example2.annualIncome')}: 5,000,000 ₸</div>
                <div>{t('tax-deductions.examples.example2.allTypesMax')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example2.calculation')}:</div>
                <div>{t('tax-deductions.examples.example2.perType')}</div>
                <div>{t('tax-deductions.examples.example2.totalLimit')}: 400 {t('tax-deductions.mrp')}</div>
                <div>{t('tax-deductions.examples.example2.deductions')}: 1,572,800 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example2.tax')}:</div>
                <div>{t('tax-deductions.examples.example2.beforeDeductions')}: 500,000 ₸</div>
                <div>{t('tax-deductions.examples.example2.afterDeductions')}: 342,720 ₸</div>
                <div>{t('tax-deductions.examples.example2.savings')}: 157,280 ₸</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('tax-deductions.examples.example2.toRefund')}:</div>
                <div className="text-lg font-bold text-blue-600">157,280 ₸</div>
                <div className="text-xs text-blue-600">{t('tax-deductions.examples.example2.maxRefund')}</div>
              </div>
            </div>
          </div>

          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
            <h3 className="font-semibold text-amber-900 mb-3">{t('tax-deductions.examples.example3.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example3.sourceData')}:</div>
                <div>{t('tax-deductions.examples.example3.annualIncome')}: 800,000 ₸</div>
                <div>{t('tax-deductions.examples.example3.treatmentCosts')}: 1,000,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example3.restrictions')}:</div>
                <div>{t('tax-deductions.examples.example3.medicineLimit')}: 464,976 ₸</div>
                <div>{t('tax-deductions.examples.example3.incomeLimit')}: 800,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('tax-deductions.examples.example3.tax')}:</div>
                <div>{t('tax-deductions.examples.example3.beforeDeductions')}: 80,000 ₸</div>
                <div>{t('tax-deductions.examples.example3.afterDeductions')}: 33,502 ₸</div>
                <div>{t('tax-deductions.examples.example3.savings')}: 46,498 ₸</div>
              </div>
              <div>
                <div className="font-medium text-amber-700">{t('tax-deductions.examples.example3.toRefund')}:</div>
                <div className="text-lg font-bold text-amber-600">46,498 ₸</div>
                <div className="text-xs text-amber-600">{t('tax-deductions.examples.example3.limitedByIncome')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('tax-deductions.procedure.title')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.procedure.documents.title')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('tax-deductions.procedure.documents.declaration')}</li>
                  <li>{t('tax-deductions.procedure.documents.incomeStatement')}</li>
                  <li>{t('tax-deductions.procedure.documents.expenseProof')}</li>
                  <li>{t('tax-deductions.procedure.documents.paymentCertificates')}</li>
                  <li>{t('tax-deductions.procedure.documents.bankStatement')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.procedure.steps.title')}</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>{t('tax-deductions.procedure.steps.step1')}</li>
                  <li>{t('tax-deductions.procedure.steps.step2')}</li>
                  <li>{t('tax-deductions.procedure.steps.step3')}</li>
                  <li>{t('tax-deductions.procedure.steps.step4')}</li>
                  <li>{t('tax-deductions.procedure.steps.step5')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('tax-deductions.practicalAdvice.title')}
              </h3>
              <div className="text-green-800 text-sm space-y-1">
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip2') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip3') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip4') }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.legalBasis.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('tax-deductions.legalBasis.taxCode.title')}</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.article156') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.subparagraph1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.subparagraph2') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.subparagraph3') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.subparagraph4') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.subparagraph5') }} />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('tax-deductions.legalBasis.conditions.title')}</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• {t('tax-deductions.legalBasis.conditions.condition1')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition2')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition3')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition4')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition5')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('tax-deductions.legalBasis.restrictions.title')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.restrictions.restriction1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.restrictions.restriction2') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.restrictions.restriction3') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.restrictions.restriction4') }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.planningStrategies.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.planningStrategies.strategy1.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('tax-deductions.planningStrategies.strategy1.description')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.planningStrategies.strategy2.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('tax-deductions.planningStrategies.strategy2.description')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.planningStrategies.strategy3.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('tax-deductions.planningStrategies.strategy3.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Диаграмма и экспорт */}
      {results.totalDeductions > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: 'Образование', value: results.allowedEducationDeduction },
              { name: 'Медицина', value: results.allowedMedicalDeduction },
              { name: 'Ипотека', value: results.allowedMortgageDeduction },
              { name: 'Пенсия', value: results.allowedPensionDeduction },
            ].filter(item => item.value > 0)}
            title="Структура вычетов"
          />
          <ExportButtons
            data={{
              title: 'Расчёт налоговых вычетов',
              subtitle: `Доход: ${parseFloat(annualIncome).toLocaleString()} ₸`,
              sections: [
                {
                  title: 'Расходы',
                  data: [
                    { label: 'Образование', value: `${parseFloat(educationExpenses || '0').toLocaleString()} ₸` },
                    { label: 'Медицина', value: `${parseFloat(medicalExpenses || '0').toLocaleString()} ₸` },
                    { label: 'Ипотека', value: `${parseFloat(mortgageInterest || '0').toLocaleString()} ₸` },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Общий вычет', value: `${results.totalDeductions.toLocaleString()} ₸` },
                    { label: 'Возврат налога', value: `${results.taxRefundAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="tax-deductions-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('tax-deductions.faq.q1'), answer: t('tax-deductions.faq.a1') },
          { question: t('tax-deductions.faq.q2'), answer: t('tax-deductions.faq.a2') },
          { question: t('tax-deductions.faq.q3'), answer: t('tax-deductions.faq.a3') },
          { question: t('tax-deductions.faq.q4'), answer: t('tax-deductions.faq.a4') },
          { question: t('tax-deductions.faq.q5'), answer: t('tax-deductions.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК — вычеты', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'КГД — налоговые вычеты', url: 'https://kgd.gov.kz/' },
        ]}
      />

      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="tax-deductions"
        calculatorTitle="Калькулятор налоговых вычетов"
      />
    </div>
  );
}
