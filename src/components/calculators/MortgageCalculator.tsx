import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, TrendingDown, MapPin, Percent, DollarSign, Info, AlertTriangle, Building, Banknote, TrendingUp, BarChart3 } from 'lucide-react';
import { TaxPieChart, TrendLineChart, ProgressBar } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { getMethodology } from '../../data/calculatorMethodology';

interface MortgageProgram {
  id: string;
  nameKey: string;
  descriptionKey: string;
  nominalRate: number;
  minDownPaymentPercent: number;
  maxTermYears: number;
  maxLoanAmount: { [region: string]: number };
  additionalFees: {
    applicationFee?: number;
    evaluationFee?: number;
    monthlyInsurance?: number;
    yearlyInsurance?: number;
  };
  restrictionsKey?: string;
}

export default function MortgageCalculator() {
  const { t } = useTranslation('calculators');
  const [selectedProgram, setSelectedProgram] = useState<string>('halyk-standard');
  const [propertyValue, setPropertyValue] = useState<string>('25000000');
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>('20');
  const [loanTermYears, setLoanTermYears] = useState<string>('20');
  const [region, setRegion] = useState<string>('almaty');
  const [customRate, setCustomRate] = useState<string>('');
  const [additionalCommissions, setAdditionalCommissions] = useState<string>('');
  const [yearlyInsurance, setYearlyInsurance] = useState<string>('');
  const [showCharts, setShowCharts] = useState<boolean>(true);

  const [results, setResults] = useState({
    loanAmount: 0,
    downPayment: 0,
    monthlyPayment: 0,
    totalPayment: 0,
    totalInterest: 0,
    nominalRate: 0,
    effectiveRate: 0,
    totalAdditionalCosts: 0,
    isEligible: true,
    eligibilityIssues: [] as string[]
  });

  const mortgagePrograms: MortgageProgram[] = [
    {
      id: '7-20-25',
      nameKey: 'calculators:mortgage.program_7_20_25_name',
      descriptionKey: 'calculators:mortgage.program_7_20_25_desc',
      nominalRate: 7.0,
      minDownPaymentPercent: 20,
      maxTermYears: 25,
      // Лимиты повышены с 26.09.2025 (источник: kfu.kz, оператор программы):
      // Астана/Алматы (+пригороды), Актау, Атырау, Шымкент — 30 млн; Караганда — 25 млн; прочие регионы — 20 млн.
      maxLoanAmount: {
        'almaty': 30000000,
        'astana': 30000000,
        'shymkent': 30000000,
        'other': 20000000
      },
      additionalFees: {
        applicationFee: 15000,
        evaluationFee: 25000,
        yearlyInsurance: 0.3
      },
      restrictionsKey: 'calculators:mortgage.program_7_20_25_restrictions'
    },
    {
      id: 'halyk-standard',
      nameKey: 'calculators:mortgage.program_halyk_name',
      descriptionKey: 'calculators:mortgage.program_halyk_desc',
      nominalRate: 13.5,
      minDownPaymentPercent: 30,
      maxTermYears: 25,
      maxLoanAmount: {
        'almaty': 50000000,
        'astana': 50000000,
        'shymkent': 30000000,
        'other': 20000000
      },
      additionalFees: {
        applicationFee: 25000,
        evaluationFee: 30000,
        monthlyInsurance: 0.08
      }
    },
    {
      id: 'partner-program',
      nameKey: 'calculators:mortgage.program_partner_name',
      descriptionKey: 'calculators:mortgage.program_partner_desc',
      nominalRate: 9.9,
      minDownPaymentPercent: 15,
      maxTermYears: 20,
      maxLoanAmount: {
        'almaty': 35000000,
        'astana': 35000000,
        'shymkent': 20000000,
        'other': 15000000
      },
      additionalFees: {
        applicationFee: 20000,
        evaluationFee: 25000,
        yearlyInsurance: 0.4
      },
      restrictionsKey: 'calculators:mortgage.program_partner_restrictions'
    },
    {
      id: 'kaspi-express',
      nameKey: 'calculators:mortgage.program_kaspi_name',
      descriptionKey: 'calculators:mortgage.program_kaspi_desc',
      nominalRate: 14.9,
      minDownPaymentPercent: 40,
      maxTermYears: 15,
      maxLoanAmount: {
        'almaty': 30000000,
        'astana': 30000000,
        'shymkent': 20000000,
        'other': 15000000
      },
      additionalFees: {
        applicationFee: 35000,
        evaluationFee: 35000,
        monthlyInsurance: 0.1
      }
    },
    {
      id: 'custom',
      nameKey: 'calculators:mortgage.program_custom_name',
      descriptionKey: 'calculators:mortgage.program_custom_desc',
      nominalRate: 12.0,
      minDownPaymentPercent: 20,
      maxTermYears: 25,
      maxLoanAmount: {
        'almaty': 100000000,
        'astana': 100000000,
        'shymkent': 100000000,
        'other': 100000000
      },
      additionalFees: {}
    }
  ];

  const regions = [
    { id: 'almaty', nameKey: 'calculators:mortgage.regionAlmaty' },
    { id: 'astana', nameKey: 'calculators:mortgage.regionAstana' },
    { id: 'shymkent', nameKey: 'calculators:mortgage.regionShymkent' },
    { id: 'other', nameKey: 'calculators:mortgage.regionOther' }
  ];

  const calculateMortgage = () => {
    const program = mortgagePrograms.find(p => p.id === selectedProgram);
    if (!program || !propertyValue) {
      setResults({
        loanAmount: 0, downPayment: 0, monthlyPayment: 0, totalPayment: 0,
        totalInterest: 0, nominalRate: 0, effectiveRate: 0, totalAdditionalCosts: 0,
        isEligible: true, eligibilityIssues: []
      });
      return;
    }

    const propertyPrice = parseFloat(propertyValue) || 0;
    const downPaymentPerc = parseFloat(downPaymentPercent) || 20;
    const termYears = parseInt(loanTermYears) || 20;
    const additionalComm = parseFloat(additionalCommissions) || 0;
    const yearlyIns = parseFloat(yearlyInsurance) || 0;

    const downPayment = propertyPrice * (downPaymentPerc / 100);
    const loanAmount = propertyPrice - downPayment;

    const nominalRate = selectedProgram === 'custom' && customRate ?
                       parseFloat(customRate) : program.nominalRate;

    const eligibilityIssues: string[] = [];
    let isEligible = true;

    if (downPaymentPerc < program.minDownPaymentPercent) {
      eligibilityIssues.push(`${t('mortgage.minDownPaymentIs')} ${program.minDownPaymentPercent}%`);
      isEligible = false;
    }

    if (termYears > program.maxTermYears) {
      eligibilityIssues.push(`${t('mortgage.maxTermIs')} ${program.maxTermYears} ${t('mortgage.years')}`);
      isEligible = false;
    }

    if (loanAmount > program.maxLoanAmount[region]) {
      eligibilityIssues.push(`${t('mortgage.maxLoanAmountFor')} ${t(regions.find(r => r.id === region)?.nameKey || '')}: ${formatNumber(program.maxLoanAmount[region])}`);
      isEligible = false;
    }

    const monthlyRate = nominalRate / 100 / 12;
    const numberOfPayments = termYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;

    let totalAdditionalCosts = additionalComm + yearlyIns * termYears;

    if (program.additionalFees.applicationFee) {
      totalAdditionalCosts += program.additionalFees.applicationFee;
    }
    if (program.additionalFees.evaluationFee) {
      totalAdditionalCosts += program.additionalFees.evaluationFee;
    }
    if (program.additionalFees.yearlyInsurance) {
      totalAdditionalCosts += (loanAmount * program.additionalFees.yearlyInsurance / 100) * termYears;
    }
    if (program.additionalFees.monthlyInsurance) {
      totalAdditionalCosts += (loanAmount * program.additionalFees.monthlyInsurance / 100) * numberOfPayments * 0.6;
    }

    const totalCostOfCredit = totalPayment + totalAdditionalCosts - loanAmount;
    const effectiveRate = (totalCostOfCredit / loanAmount / termYears) * 100;

    setResults({
      loanAmount: Math.round(loanAmount),
      downPayment: Math.round(downPayment),
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      nominalRate,
      effectiveRate: Number(effectiveRate.toFixed(2)),
      totalAdditionalCosts: Math.round(totalAdditionalCosts),
      isEligible,
      eligibilityIssues
    });
  };

  useEffect(() => {
    calculateMortgage();
  }, [selectedProgram, propertyValue, downPaymentPercent, loanTermYears, region, customRate, additionalCommissions, yearlyInsurance]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatPercent = (num: number) => {
    return num.toFixed(2) + '%';
  };

  const selectedProgramData = mortgagePrograms.find(p => p.id === selectedProgram);

  // Данные для круговой диаграммы
  const pieChartData = results.loanAmount > 0 ? [
    { name: t('mortgage.downPaymentAmount'), value: results.downPayment, color: '#22c55e' },
    { name: t('mortgage.loanAmount'), value: results.loanAmount, color: '#0ea5e9' },
    { name: t('mortgage.interestOverpayment'), value: results.totalInterest, color: '#ef4444' },
    { name: t('mortgage.additionalCostsTotal'), value: results.totalAdditionalCosts, color: '#f97316' },
  ].filter(item => item.value > 0) : [];

  // Данные для экспорта
  const exportData = {
    title: t('mortgage.heading'),
    subtitle: selectedProgramData ? t(selectedProgramData.nameKey) : '',
    sections: [
      {
        title: t('mortgage.mainParameters'),
        data: [
          { label: t('mortgage.propertyValue'), value: formatNumber(parseFloat(propertyValue) || 0) },
          { label: t('mortgage.downPayment'), value: `${downPaymentPercent}% (${formatNumber(results.downPayment)})` },
          { label: t('mortgage.loanTerm'), value: `${loanTermYears} ${t('mortgage.years')}` },
          { label: t('mortgage.nominalRateLabel'), value: formatPercent(results.nominalRate) },
        ]
      },
      {
        title: t('mortgage.calculationResults'),
        data: [
          { label: t('mortgage.loanAmount'), value: formatNumber(results.loanAmount) },
          { label: t('mortgage.monthlyPayment'), value: formatNumber(results.monthlyPayment) },
          { label: t('mortgage.totalPayment'), value: formatNumber(results.totalPayment) },
          { label: t('mortgage.interestOverpayment'), value: formatNumber(results.totalInterest) },
          { label: t('mortgage.additionalCostsTotal'), value: formatNumber(results.totalAdditionalCosts) },
          { label: t('mortgage.effectiveRateLabel'), value: formatPercent(results.effectiveRate) },
        ]
      }
    ],
    footer: t('mortgage.footerText')
  };

  // FAQ данные
  const faqItems = [
    { question: t('mortgage-specialized.faq.q1'), answer: t('mortgage-specialized.faq.a1') },
    { question: t('mortgage-specialized.faq.q2'), answer: t('mortgage-specialized.faq.a2') },
    { question: t('mortgage-specialized.faq.q3'), answer: t('mortgage-specialized.faq.a3') },
    { question: t('mortgage-specialized.faq.q4'), answer: t('mortgage-specialized.faq.a4') },
    { question: t('mortgage-specialized.faq.q5'), answer: t('mortgage-specialized.faq.a5') }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('mortgage.heading')}</h1>
            <p className="text-gray-600">{t('mortgage.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="mortgage-specialized" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.programSelection')}</h2>

            <div className="space-y-4">
              {mortgagePrograms.map((program) => (
                <div
                  key={program.id}
                  onClick={() => setSelectedProgram(program.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProgram === program.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{t(program.nameKey)}</h3>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatPercent(program.nominalRate)}</div>
                      <div className="text-xs text-gray-500">{t('mortgage.nominalRate')}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{t(program.descriptionKey)}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>• {t('mortgage.downPaymentFrom')} {program.minDownPaymentPercent}%</span>
                    <span>• {t('mortgage.termUpTo')} {program.maxTermYears} {t('mortgage.years')}</span>
                    <span>• {t('mortgage.upTo')} {formatNumber(program.maxLoanAmount.almaty)} {t('mortgage.inAlmaty')}</span>
                  </div>
                  {program.restrictionsKey && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      {t(program.restrictionsKey)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedProgram && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.mainParameters')}</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mortgage.regionOfPurchase')}
                  </label>
                  <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {regions.map((regionOption) => (
                      <option key={regionOption.id} value={regionOption.id}>
                        {t(regionOption.nameKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <RangeSlider
                    value={parseFloat(propertyValue) || 0}
                    onChange={(v) => setPropertyValue(String(v))}
                    min={5000000}
                    max={100000000}
                    step={1000000}
                    label={t('mortgage.propertyValue')}
                    formatValue={(v) => formatNumber(v)}
                    color="#0ea5e9"
                  />
                </div>

                <div>
                  <RangeSlider
                    value={parseFloat(downPaymentPercent) || 20}
                    onChange={(v) => setDownPaymentPercent(String(v))}
                    min={selectedProgramData?.minDownPaymentPercent || 10}
                    max={80}
                    step={5}
                    label={t('mortgage.downPayment')}
                    formatValue={(v) => `${v}% (${formatNumber((parseFloat(propertyValue) || 0) * v / 100)})`}
                    color="#22c55e"
                  />
                </div>

                <div>
                  <RangeSlider
                    value={parseInt(loanTermYears) || 20}
                    onChange={(v) => setLoanTermYears(String(v))}
                    min={5}
                    max={selectedProgramData?.maxTermYears || 30}
                    step={1}
                    label={t('mortgage.loanTerm')}
                    formatValue={(v) => `${v} ${t('mortgage.years')}`}
                    color="#8b5cf6"
                  />
                </div>

                {selectedProgram === 'custom' && (
                  <div>
                    <label htmlFor="customRate" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('mortgage.interestRate')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="customRate"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        placeholder={t('mortgage.interestRatePlaceholder')}
                        step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedProgram && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.additionalCosts')}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="additionalCommissions" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mortgage.additionalOneTimeCommissions')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="additionalCommissions"
                      value={additionalCommissions}
                      onChange={(e) => setAdditionalCommissions(e.target.value)}
                      placeholder={t('mortgage.additionalExpenses')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₸</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="yearlyInsurance" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mortgage.additionalInsuranceYearly')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="yearlyInsurance"
                      value={yearlyInsurance}
                      onChange={(e) => setYearlyInsurance(e.target.value)}
                      placeholder={t('mortgage.yearlyInsuranceCost')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₸</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">{t('mortgage.standardProgramFees')}</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  {selectedProgramData?.additionalFees.applicationFee && (
                    <div>• {t('mortgage.applicationFee')}: {formatNumber(selectedProgramData.additionalFees.applicationFee)}</div>
                  )}
                  {selectedProgramData?.additionalFees.evaluationFee && (
                    <div>• {t('mortgage.evaluationFee')}: {formatNumber(selectedProgramData.additionalFees.evaluationFee)}</div>
                  )}
                  {selectedProgramData?.additionalFees.yearlyInsurance && (
                    <div>• {t('mortgage.insuranceYearly')}: {selectedProgramData.additionalFees.yearlyInsurance}% {t('mortgage.perYearOfLoan')}</div>
                  )}
                  {selectedProgramData?.additionalFees.monthlyInsurance && (
                    <div>• {t('mortgage.insuranceMonthly')}: {selectedProgramData.additionalFees.monthlyInsurance}% {t('mortgage.perMonthOfBalance')}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedProgram && !results.isEligible && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    {t('mortgage.notEligible')}
                  </h3>
                  <ul className="text-red-800 text-sm space-y-1">
                    {results.eligibilityIssues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {selectedProgram && results.isEligible && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{t('mortgage.calculationResults')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCharts(!showCharts)}
                    className={`p-2 rounded-lg transition-colors ${showCharts ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    title={showCharts ? t('mortgage.hideChart') : t('mortgage.showChart')}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>
                  <ExportButtons data={exportData} filename="mortgage-calculation" compact />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">{t('mortgage.monthlyPayment')}</span>
                    <div className="flex items-center space-x-2">
                      <Building className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">{formatNumber(results.monthlyPayment)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('mortgage.loanAmount')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.loanAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('mortgage.downPaymentAmount')}</span>
                    <span className="font-semibold text-blue-600">{formatNumber(results.downPayment)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('mortgage.totalPayment')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.totalPayment)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('mortgage.interestOverpayment')}</span>
                    <span className="font-semibold text-red-600">{formatNumber(results.totalInterest)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">{t('mortgage.additionalCostsTotal')}</span>
                    <span className="font-semibold text-orange-600">{formatNumber(results.totalAdditionalCosts)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedProgram && results.isEligible && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.rateComparison')}</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                  <div>
                    <span className="font-medium text-blue-900">{t('mortgage.nominalRateLabel')}</span>
                    <div className="text-xs text-blue-600">{t('mortgage.asAdvertised')}</div>
                  </div>
                  <span className="text-lg font-bold text-blue-700">{formatPercent(results.nominalRate)}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-4">
                  <div>
                    <span className="font-medium text-red-900">{t('mortgage.effectiveRateLabel')}</span>
                    <div className="text-xs text-red-600">{t('mortgage.withAllCosts')}</div>
                  </div>
                  <span className="text-lg font-bold text-red-700">{formatPercent(results.effectiveRate)}</span>
                </div>

                <div className="text-center text-sm text-gray-600">
                  {t('mortgage.difference')} <span className="font-semibold text-red-600">
                    +{formatPercent(results.effectiveRate - results.nominalRate)}
                  </span>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-900 mb-1">
                      {t('mortgage.whatIsGesv')}
                    </h3>
                    <p className="text-amber-800 text-sm">
                      {t('mortgage.gesvDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedProgram && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.programsComparison')}</h2>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('mortgage.program')}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('mortgage.rate')}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('mortgage.minDownPaymentShort')}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('mortgage.maxTermShort')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('mortgage.limitAlmaty')}</th>
                </tr>
              </thead>
              <tbody>
                {mortgagePrograms.filter(p => p.id !== 'custom').map((program) => (
                  <tr key={program.id} className={`border-b border-gray-100 ${selectedProgram === program.id ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{t(program.nameKey)}</div>
                      <div className="text-xs text-gray-500">{t(program.descriptionKey)}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600">
                      {formatPercent(program.nominalRate)}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {program.minDownPaymentPercent}%
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">
                      {program.maxTermYears} {t('mortgage.years')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatNumber(program.maxLoanAmount.almaty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('mortgage.importantNote')}</strong> {t('mortgage.gesvComparisonNote')}
              <br />
              <strong>{t('mortgage.actualityNote')}</strong> {t('mortgage.programsCanChange')}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.governmentPrograms')}</h2>

        <div className="space-y-6">
          <div className="border border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-4 flex items-center space-x-2">
              <span className="text-xl">🏠</span>
              <span>{t('mortgage.program_7_20_25_title')}</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-900 mb-2">{t('mortgage.programConditions')}</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div>• <strong>{t('mortgage.rate_7_percent')}</strong></div>
                  <div>• <strong>{t('mortgage.downPayment_from_20')}</strong></div>
                  <div>• <strong>{t('mortgage.maxTerm_25_years')}</strong></div>
                  <div>• <strong>{t('mortgage.currency_tenge')}</strong></div>
                  <div>• <strong>{t('mortgage.limits_by_city')}</strong></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-2">{t('mortgage.borrowerRequirements')}</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div>• {t('mortgage.citizenship_requirement')}</div>
                  <div>• {t('mortgage.age_requirement')}</div>
                  <div>• {t('mortgage.income_requirement')}</div>
                  <div>• {t('mortgage.creditHistory_requirement')}</div>
                  <div>• {t('mortgage.primaryHousing_requirement')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
              <span className="text-xl">🏘️</span>
              <span>{t('mortgage.baspanaHitProgram')}</span>
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">{t('mortgage.programFeatures')}</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• <strong>{t('mortgage.affordableHousing')}</strong></div>
                  <div>• <strong>{t('mortgage.mortgageThrough')}</strong></div>
                  <div>• <strong>{t('mortgage.downPayment_10_15')}</strong></div>
                  <div>• <strong>{t('mortgage.location')}</strong></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">{t('mortgage.targetAudience')}</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• {t('mortgage.youngFamilies')}</div>
                  <div>• {t('mortgage.largeFamilies')}</div>
                  <div>• {t('mortgage.budgetWorkers')}</div>
                  <div>• {t('mortgage.lowIncomeFamilies')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.mortgageProcess')}</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.step1_title')}</h3>
              <p className="text-gray-600 text-xs">
                {t('mortgage.step1_desc')}
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.step2_title')}</h3>
              <p className="text-gray-600 text-xs">
                {t('mortgage.step2_desc')}
              </p>
            </div>

            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-teal-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.step3_title')}</h3>
              <p className="text-gray-600 text-xs">
                {t('mortgage.step3_desc')}
              </p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.step4_title')}</h3>
              <p className="text-gray-600 text-xs">
                {t('mortgage.step4_desc')}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📋 {t('mortgage.requiredDocuments')}</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <div>• {t('mortgage.doc_id')}</div>
                <div>• {t('mortgage.doc_income')}</div>
                <div>• {t('mortgage.doc_employment')}</div>
                <div>• {t('mortgage.doc_bankStatement')}</div>
                <div>• {t('mortgage.doc_taxClearance')}</div>
                <div>• {t('mortgage.doc_collateral')}</div>
                <div>• {t('mortgage.doc_spouseConsent')}</div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-3">⏱️ {t('mortgage.processingTimes')}</h3>
              <div className="space-y-2 text-sm text-amber-800">
                <div>• <strong>{t('mortgage.time_preapproval')}</strong></div>
                <div>• <strong>{t('mortgage.time_expertise')}</strong></div>
                <div>• <strong>{t('mortgage.time_evaluation')}</strong></div>
                <div>• <strong>{t('mortgage.time_finalApproval')}</strong></div>
                <div>• <strong>{t('mortgage.time_closing')}</strong></div>
                <div><strong>{t('mortgage.time_total')}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.refinancing')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-3">✅ {t('mortgage.whenBeneficial')}</h3>
            <div className="space-y-2 text-sm text-green-800">
              <div>• {t('mortgage.benefit_1')}</div>
              <div>• {t('mortgage.benefit_2')}</div>
              <div>• {t('mortgage.benefit_3')}</div>
              <div>• {t('mortgage.benefit_4')}</div>
              <div>• {t('mortgage.benefit_5')}</div>
              <div>• {t('mortgage.benefit_6')}</div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-6">
            <h3 className="font-semibold text-red-900 mb-3">❌ {t('mortgage.whenNotBeneficial')}</h3>
            <div className="space-y-2 text-sm text-red-800">
              <div>• {t('mortgage.notBenefit_1')}</div>
              <div>• {t('mortgage.notBenefit_2')}</div>
              <div>• {t('mortgage.notBenefit_3')}</div>
              <div>• {t('mortgage.notBenefit_4')}</div>
              <div>• {t('mortgage.notBenefit_5')}</div>
              <div>• {t('mortgage.notBenefit_6')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">💡 {t('mortgage.refinancingCalculation')}</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <div className="font-medium mb-1">{t('mortgage.savingsExample')}</div>
              <div>{t('mortgage.savings_loan')}</div>
              <div>{t('mortgage.savings_rateChange')}</div>
              <div>{t('mortgage.savings_total')}</div>
            </div>
            <div>
              <div className="font-medium mb-1">{t('mortgage.refinancingCosts')}</div>
              <div>{t('mortgage.cost_evaluation')}</div>
              <div>{t('mortgage.cost_bankFees')}</div>
              <div>{t('mortgage.cost_stateFees')}</div>
              <div>{t('mortgage.cost_insurance')}</div>
            </div>
            <div>
              <div className="font-medium mb-1">{t('mortgage.paybackPeriod')}</div>
              <div>{t('mortgage.payback_savings')}</div>
              <div>{t('mortgage.payback_costs')}</div>
              <div>{t('mortgage.payback_time')}</div>
              <div className="font-semibold text-green-700">{t('mortgage.payback_result')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.legalAspects')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">⚖️ {t('mortgage.borrowerRights')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.right_earlyRepayment')}</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.right_notifications')}</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.right_insurance')}</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.right_information')}</strong></span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">📝 {t('mortgage.borrowerObligations')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.obligation_payments')}</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.obligation_insurance')}</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.obligation_maintenance')}</strong></span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('mortgage.obligation_notifications')}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">{t('mortgage.latePaymentConsequences')}</h3>
              <div className="space-y-2 text-sm text-amber-800">
                <p>• <strong>{t('mortgage.consequence_penalties')}</strong></p>
                <p>• <strong>{t('mortgage.consequence_creditHistory')}</strong></p>
                <p>• <strong>{t('mortgage.consequence_earlyDemand')}</strong></p>
                <p>• <strong>{t('mortgage.consequence_foreclosure')}</strong></p>
                <p>• <strong>{t('mortgage.consequence_legalCosts')}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage.marketAnalysis')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.primaryMarket')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div><strong>{t('mortgage.primaryMarket_avgPrice')}</strong></div>
              <div><strong>{t('mortgage.primaryMarket_growth')}</strong></div>
              <div>{t('mortgage.primaryMarket_benefits')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.secondaryMarket')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div><strong>{t('mortgage.secondaryMarket_avgPrice')}</strong></div>
              <div><strong>{t('mortgage.secondaryMarket_liquidity')}</strong></div>
              <div>{t('mortgage.secondaryMarket_benefits')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('mortgage.investmentAttractiveness')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div><strong>{t('mortgage.investment_rentalYield')}</strong></div>
              <div><strong>{t('mortgage.investment_appreciation')}</strong></div>
              <div>{t('mortgage.investment_risks')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">🏙️ {t('mortgage.regionalPrices')}</h4>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-900">{t('mortgage.regionAlmaty')}</div>
              <div className="text-blue-800">{t('mortgage.city_almaty_prices')}</div>
              <div className="text-xs text-gray-600">{t('mortgage.city_almaty_note')}</div>
            </div>
            <div>
              <div className="font-medium text-green-900">{t('mortgage.regionAstana')}</div>
              <div className="text-green-800">{t('mortgage.city_astana_prices')}</div>
              <div className="text-xs text-gray-600">{t('mortgage.city_astana_note')}</div>
            </div>
            <div>
              <div className="font-medium text-teal-900">{t('mortgage.regionShymkent')}</div>
              <div className="text-teal-800">{t('mortgage.city_shymkent_prices')}</div>
              <div className="text-xs text-gray-600">{t('mortgage.city_shymkent_note')}</div>
            </div>
            <div>
              <div className="font-medium text-orange-900">{t('mortgage.regionOther')}</div>
              <div className="text-orange-800">{t('mortgage.city_regions_prices')}</div>
              <div className="text-xs text-gray-600">{t('mortgage.city_regions_note')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Круговая диаграмма */}
      {showCharts && selectedProgram && results.isEligible && pieChartData.length > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={pieChartData}
            title={t('mortgage.expenseStructure')}
            formatValue={formatNumber}
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="mortgage-specialized" />
      <MethodologySection steps={getMethodology('mortgage-specialized')} />
      <FAQSection
        items={faqItems}
        sources={[
          { title: 'Программа 7-20-25', url: 'https://www.gov.kz/memleket/entities/economy/press/news/details/14659' },
          { title: 'Закон об ипотеке РК', url: 'https://online.zakon.kz/document/?doc_id=1013060' },
        ]}
      />

      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm border border-green-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">АЕ</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">{t('mortgage.expertParticipation')}</h3>
            <p className="text-green-800 text-sm leading-relaxed">
              {t('mortgage.expertText')}
            </p>
          </div>
        </div>
      </div>

      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="mortgage"
        calculatorTitle={t('mortgage.title')}
      />
      <LastUpdated calculatorId="mortgage-specialized" />
    </div>
  );
}
