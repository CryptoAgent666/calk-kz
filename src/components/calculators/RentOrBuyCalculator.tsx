import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Info, AlertTriangle, Building, Key, Percent } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart, TrendLineChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';

export default function RentOrBuyCalculator() {
  const { t } = useTranslation('calculators');
  const [propertyPrice, setPropertyPrice] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>('20');
  const [mortgageRate, setMortgageRate] = useState<string>('12');
  const [mortgageTermYears, setMortgageTermYears] = useState<string>('20');
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [rentIncrease, setRentIncrease] = useState<string>('5');
  const [propertyAppreciation, setPropertyAppreciation] = useState<string>('3');
  const [analysisYears, setAnalysisYears] = useState<string>('10');

  const [annualPropertyTax, setAnnualPropertyTax] = useState<string>('');
  const [annualInsurance, setAnnualInsurance] = useState<string>('');
  const [annualMaintenance, setAnnualMaintenance] = useState<string>('');
  const [opportunityCostRate, setOpportunityCostRate] = useState<string>('8');

  const [results, setResults] = useState({
    loanAmount: 0,
    monthlyMortgagePayment: 0,
    totalMortgagePayments: 0,
    totalInterestPaid: 0,
    totalOwnershipCosts: 0,
    propertyValueAtEnd: 0,
    equityBuilt: 0,
    netOwnershipCost: 0,

    totalRentPaid: 0,
    opportunityCostOfDownPayment: 0,
    totalRentingCost: 0,

    difference: 0,
    isRentingBetter: false,
    breakEvenYear: 0,
    breakEvenMonth: 0,

    yearlyData: [] as Array<{
      year: number,
      cumulativeOwnership: number,
      cumulativeRenting: number,
      difference: number,
      propertyValue: number,
      equity: number,
      rentPaid: number
    }>
  });

  const calculateComparison = () => {
    const price = parseFloat(propertyPrice) || 0;
    const downPay = parseFloat(downPayment) || 0;
    const mortgageRateDecimal = (parseFloat(mortgageRate) || 0) / 100;
    const termYears = parseInt(mortgageTermYears) || 20;
    const rent = parseFloat(monthlyRent) || 0;
    const rentIncreaseRate = (parseFloat(rentIncrease) || 0) / 100;
    const propertyGrowthRate = (parseFloat(propertyAppreciation) || 0) / 100;
    const years = parseInt(analysisYears) || 10;
    const annualTax = parseFloat(annualPropertyTax) || 0;
    const annualIns = parseFloat(annualInsurance) || 0;
    const annualMaint = parseFloat(annualMaintenance) || 0;
    const opportunityRate = (parseFloat(opportunityCostRate) || 0) / 100;

    if (price <= 0 || downPay < 0 || rent <= 0 || years <= 0) {
      setResults({
        loanAmount: 0, monthlyMortgagePayment: 0, totalMortgagePayments: 0,
        totalInterestPaid: 0, totalOwnershipCosts: 0, propertyValueAtEnd: 0,
        equityBuilt: 0, netOwnershipCost: 0, totalRentPaid: 0,
        opportunityCostOfDownPayment: 0, totalRentingCost: 0,
        difference: 0, isRentingBetter: false, breakEvenYear: 0, breakEvenMonth: 0,
        yearlyData: []
      });
      return;
    }

    const loanAmount = price - downPay;

    const monthlyRate = mortgageRateDecimal / 12;
    const numberOfPayments = termYears * 12;
    const monthlyMortgagePayment = loanAmount > 0 ?
      loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1) : 0;

    const monthsInAnalysis = Math.min(years * 12, numberOfPayments);
    const totalMortgagePayments = monthlyMortgagePayment * monthsInAnalysis;

    let remainingBalance = loanAmount;
    let totalInterestPaid = 0;

    for (let month = 1; month <= monthsInAnalysis; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyMortgagePayment - interestPayment;
      totalInterestPaid += interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
    }

    const equityBuilt = loanAmount - remainingBalance;

    const totalAdditionalCosts = (annualTax + annualIns + annualMaint) * years;

    const totalOwnershipCosts = downPay + totalMortgagePayments + totalAdditionalCosts;

    const propertyValueAtEnd = price * Math.pow(1 + propertyGrowthRate, years);

    const netOwnershipCost = totalOwnershipCosts - (propertyValueAtEnd - remainingBalance);

    let totalRentPaid = 0;
    let currentMonthlyRent = rent;

    for (let year = 1; year <= years; year++) {
      totalRentPaid += currentMonthlyRent * 12;
      currentMonthlyRent *= (1 + rentIncreaseRate);
    }

    const opportunityCostOfDownPayment = downPay * Math.pow(1 + opportunityRate, years) - downPay;

    const totalRentingCost = totalRentPaid + opportunityCostOfDownPayment;

    const difference = totalRentingCost - netOwnershipCost;
    const isRentingBetter = difference < 0;

    let breakEvenYear = 0;
    let breakEvenMonth = 0;
    let cumulativeOwnership = downPay;
    let cumulativeRenting = 0;
    let currentRent = rent;
    let currentBalance = loanAmount;

    const yearlyData = [];

    for (let year = 1; year <= Math.max(years, 15); year++) {
      const yearlyMortgagePayments = Math.min(monthlyMortgagePayment * 12,
        currentBalance > 0 ? monthlyMortgagePayment * 12 : 0);

      let yearlyPrincipalPaid = 0;
      for (let month = 1; month <= 12 && currentBalance > 0; month++) {
        const interestPayment = currentBalance * monthlyRate;
        const principalPayment = Math.min(monthlyMortgagePayment - interestPayment, currentBalance);
        yearlyPrincipalPaid += principalPayment;
        currentBalance -= principalPayment;
      }

      const yearlyAdditionalCosts = annualTax + annualIns + annualMaint;

      cumulativeOwnership += yearlyMortgagePayments + yearlyAdditionalCosts;

      cumulativeRenting += currentRent * 12;

      const propertyValueThisYear = price * Math.pow(1 + propertyGrowthRate, year);

      const equityThisYear = propertyValueThisYear - Math.max(0, loanAmount - (loanAmount - currentBalance));

      const netOwnershipCostThisYear = cumulativeOwnership - equityThisYear;

      const opportunityCostThisYear = downPay * Math.pow(1 + opportunityRate, year) - downPay;
      const totalRentingCostThisYear = cumulativeRenting + opportunityCostThisYear;

      const yearDifference = totalRentingCostThisYear - netOwnershipCostThisYear;

      if (breakEvenYear === 0 && netOwnershipCostThisYear < totalRentingCostThisYear) {
        breakEvenYear = year;
        for (let month = 1; month <= 12; month++) {
          const monthlyOwnershipCost = netOwnershipCostThisYear * (month / 12);
          const monthlyRentingCost = totalRentingCostThisYear * (month / 12);
          if (monthlyOwnershipCost < monthlyRentingCost && breakEvenMonth === 0) {
            breakEvenMonth = month;
            break;
          }
        }
      }

      yearlyData.push({
        year,
        cumulativeOwnership: Math.round(netOwnershipCostThisYear),
        cumulativeRenting: Math.round(totalRentingCostThisYear),
        difference: Math.round(yearDifference),
        propertyValue: Math.round(propertyValueThisYear),
        equity: Math.round(equityThisYear),
        rentPaid: Math.round(cumulativeRenting)
      });

      currentRent *= (1 + rentIncreaseRate);
    }

    setResults({
      loanAmount: Math.round(loanAmount),
      monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
      totalMortgagePayments: Math.round(totalMortgagePayments),
      totalInterestPaid: Math.round(totalInterestPaid),
      totalOwnershipCosts: Math.round(totalOwnershipCosts),
      propertyValueAtEnd: Math.round(propertyValueAtEnd),
      equityBuilt: Math.round(equityBuilt),
      netOwnershipCost: Math.round(netOwnershipCost),
      totalRentPaid: Math.round(totalRentPaid),
      opportunityCostOfDownPayment: Math.round(opportunityCostOfDownPayment),
      totalRentingCost: Math.round(totalRentingCost),
      difference: Math.round(difference),
      isRentingBetter,
      breakEvenYear,
      breakEvenMonth,
      yearlyData: yearlyData.slice(0, years)
    });
  };

  useEffect(() => {
    calculateComparison();
  }, [propertyPrice, downPayment, downPaymentPercent, mortgageRate, mortgageTermYears,
      monthlyRent, rentIncrease, propertyAppreciation, analysisYears,
      annualPropertyTax, annualInsurance, annualMaintenance, opportunityCostRate]);

  useEffect(() => {
    const price = parseFloat(propertyPrice) || 0;
    const percent = parseFloat(downPaymentPercent) || 0;
    if (price > 0 && percent > 0) {
      setDownPayment((price * percent / 100).toString());
    }
  }, [propertyPrice, downPaymentPercent]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatPercent = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const renderComparisonChart = () => {
    if (results.yearlyData.length === 0) return null;

    const maxValue = Math.max(
      ...results.yearlyData.map(d => Math.max(d.cumulativeOwnership, d.cumulativeRenting))
    );

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t('rent-vs-buy.comparisonChart.title')}</h4>
        <div className="space-y-2">
          {results.yearlyData.map((data, index) => {
            const ownershipWidth = (data.cumulativeOwnership / maxValue) * 100;
            const rentingWidth = (data.cumulativeRenting / maxValue) * 100;

            return (
              <div key={index} className="text-xs">
                <div className="flex justify-between mb-1">
                  <span>{t('rent-vs-buy.comparisonChart.year')} {data.year}</span>
                  <span className={data.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                    {data.difference > 0 ? t('rent-vs-buy.comparisonChart.rentMoreExpensive') : t('rent-vs-buy.comparisonChart.buyMoreExpensive')}
                    {formatNumber(Math.abs(data.difference))}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-16 text-xs text-blue-600">{t('rent-vs-buy.comparisonChart.buying')}:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${ownershipWidth}%` }}
                      ></div>
                    </div>
                    <div className="w-24 text-right text-xs">{formatNumber(data.cumulativeOwnership)}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-16 text-xs text-green-600">{t('rent-vs-buy.comparisonChart.renting')}:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${rentingWidth}%` }}
                      ></div>
                    </div>
                    <div className="w-24 text-right text-xs">{formatNumber(data.cumulativeRenting)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('rent-vs-buy.title')}</h1>
            <p className="text-gray-600">{t('rent-vs-buy.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.propertyDetails.title')}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.propertyDetails.propertyPrice')}
                </label>
                <RangeSlider
                  value={parseFloat(propertyPrice) || 0}
                  onChange={(val) => setPropertyPrice(String(val))}
                  min={10000000}
                  max={200000000}
                  step={5000000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#3b82f6"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="propertyPrice"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(e.target.value)}
                    placeholder={t('rent-vs-buy.propertyDetails.propertyPricePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.propertyDetails.monthlyRent')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="monthlyRent"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder={t('rent-vs-buy.propertyDetails.monthlyRentPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸/{t('rent-vs-buy.units.month')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="downPaymentPercent" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.propertyDetails.downPaymentPercent')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="downPaymentPercent"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(e.target.value)}
                    placeholder={t('rent-vs-buy.propertyDetails.downPaymentPercentPlaceholder')}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('rent-vs-buy.propertyDetails.downPaymentAmount')}: {propertyPrice ? formatNumber((parseFloat(propertyPrice) * parseFloat(downPaymentPercent)) / 100) : '—'}
                </p>
              </div>

              <div>
                <label htmlFor="analysisYears" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.propertyDetails.analysisPeriod')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="analysisYears"
                    value={analysisYears}
                    onChange={(e) => setAnalysisYears(e.target.value)}
                    placeholder={t('rent-vs-buy.propertyDetails.analysisPeriodPlaceholder')}
                    min="1"
                    max="30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('rent-vs-buy.units.years')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mortgage Conditions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.mortgageConditions.title')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="mortgageRate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.mortgageConditions.interestRate')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="mortgageRate"
                    value={mortgageRate}
                    onChange={(e) => setMortgageRate(e.target.value)}
                    placeholder={t('rent-vs-buy.mortgageConditions.interestRatePlaceholder')}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="mortgageTermYears" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.mortgageConditions.loanTerm')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="mortgageTermYears"
                    value={mortgageTermYears}
                    onChange={(e) => setMortgageTermYears(e.target.value)}
                    placeholder={t('rent-vs-buy.mortgageConditions.loanTermPlaceholder')}
                    min="1"
                    max="30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('rent-vs-buy.units.years')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rent-vs-buy.mortgageConditions.monthlyPayment')}
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {formatNumber(results.monthlyMortgagePayment)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Parameters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.additionalParams.title')}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">{t('rent-vs-buy.additionalParams.ownershipCosts')}</h3>

                <div>
                  <label htmlFor="annualPropertyTax" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rent-vs-buy.additionalParams.propertyTax')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="annualPropertyTax"
                      value={annualPropertyTax}
                      onChange={(e) => setAnnualPropertyTax(e.target.value)}
                      placeholder={t('rent-vs-buy.additionalParams.annualAmountPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₸</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="annualInsurance" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rent-vs-buy.additionalParams.insurance')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="annualInsurance"
                      value={annualInsurance}
                      onChange={(e) => setAnnualInsurance(e.target.value)}
                      placeholder={t('rent-vs-buy.additionalParams.annualAmountPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₸</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="annualMaintenance" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rent-vs-buy.additionalParams.maintenance')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="annualMaintenance"
                      value={annualMaintenance}
                      onChange={(e) => setAnnualMaintenance(e.target.value)}
                      placeholder={t('rent-vs-buy.additionalParams.annualAmountPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">₸</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">{t('rent-vs-buy.additionalParams.economicParams')}</h3>

                <div>
                  <label htmlFor="rentIncrease" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rent-vs-buy.additionalParams.rentIncrease')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="rentIncrease"
                      value={rentIncrease}
                      onChange={(e) => setRentIncrease(e.target.value)}
                      placeholder={t('rent-vs-buy.additionalParams.percentPerYearPlaceholder')}
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="propertyAppreciation" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rent-vs-buy.additionalParams.propertyAppreciation')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="propertyAppreciation"
                      value={propertyAppreciation}
                      onChange={(e) => setPropertyAppreciation(e.target.value)}
                      placeholder={t('rent-vs-buy.additionalParams.percentPerYearPlaceholder')}
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="opportunityCostRate" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rent-vs-buy.additionalParams.opportunityCost')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="opportunityCostRate"
                      value={opportunityCostRate}
                      onChange={(e) => setOpportunityCostRate(e.target.value)}
                      placeholder={t('rent-vs-buy.additionalParams.investmentReturnPlaceholder')}
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Recommendation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.recommendation.title')}</h2>

            {results.difference !== 0 ? (
              <div className={`bg-gradient-to-r rounded-lg p-6 ${
                results.isRentingBetter
                  ? 'from-green-50 to-emerald-50 border border-green-200'
                  : 'from-blue-50 to-cyan-50 border border-blue-200'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  {results.isRentingBetter ? (
                    <Key className="w-8 h-8 text-green-600" />
                  ) : (
                    <Home className="w-8 h-8 text-blue-600" />
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${
                      results.isRentingBetter ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {results.isRentingBetter ? t('rent-vs-buy.recommendation.betterToRent') : t('rent-vs-buy.recommendation.betterToBuy')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('rent-vs-buy.recommendation.forYears', { years: analysisYears })}
                    </p>
                  </div>
                </div>

                <div className={`text-lg font-semibold ${
                  results.isRentingBetter ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {t('rent-vs-buy.recommendation.savings')}: {formatNumber(Math.abs(results.difference))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('rent-vs-buy.recommendation.enterParameters')}
              </div>
            )}

            {/* Break-even Point */}
            {results.breakEvenYear > 0 && (
              <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h3 className="font-semibold text-teal-900 mb-2">{t('rent-vs-buy.recommendation.breakEvenPoint')}:</h3>
                <div className="text-teal-800">
                  {t('rent-vs-buy.recommendation.breakEvenDescription', { years: results.breakEvenYear })}
                  {results.breakEvenMonth > 0 && <span> {t('rent-vs-buy.recommendation.breakEvenMonths', { months: results.breakEvenMonth })}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.financialSummary.title')}</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
                  <Home className="w-5 h-5" />
                  <span>{t('rent-vs-buy.financialSummary.buyingScenario')}:</span>
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>{t('rent-vs-buy.financialSummary.downPayment')}:</span>
                    <span className="font-semibold">{formatNumber(parseFloat(downPayment) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('rent-vs-buy.financialSummary.mortgagePayments')}:</span>
                    <span className="font-semibold">{formatNumber(results.totalMortgagePayments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('rent-vs-buy.financialSummary.additionalCosts')}:</span>
                    <span className="font-semibold">{formatNumber((parseFloat(annualPropertyTax) || 0) + (parseFloat(annualInsurance) || 0) + (parseFloat(annualMaintenance) || 0)) * parseInt(analysisYears)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2">
                    <span>{t('rent-vs-buy.financialSummary.propertyValueAtEnd')}:</span>
                    <span className="font-semibold text-green-600">+{formatNumber(results.propertyValueAtEnd)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('rent-vs-buy.financialSummary.netCost')}:</span>
                    <span>{formatNumber(results.netOwnershipCost)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>{t('rent-vs-buy.financialSummary.rentingScenario')}:</span>
                </h3>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>{t('rent-vs-buy.financialSummary.rentPayments')}:</span>
                    <span className="font-semibold">{formatNumber(results.totalRentPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('rent-vs-buy.financialSummary.opportunityCost')}:</span>
                    <span className="font-semibold">{formatNumber(results.opportunityCostOfDownPayment)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-green-200 pt-2">
                    <span>{t('rent-vs-buy.financialSummary.totalCost')}:</span>
                    <span>{formatNumber(results.totalRentingCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Chart */}
      {results.yearlyData.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.costDynamics.title')}</h2>
          {renderComparisonChart()}
        </div>
      )}

      {/* Key Factors */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.keyFactors.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Home className="w-5 h-5 text-blue-600" />
              <span>{t('rent-vs-buy.keyFactors.buyingArguments')}:</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.buyingArg1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.buyingArg2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.buyingArg3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.buyingArg4')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.buyingArg5')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Key className="w-5 h-5 text-green-600" />
              <span>{t('rent-vs-buy.keyFactors.rentingArguments')}:</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.rentingArg1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.rentingArg2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.rentingArg3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.rentingArg4')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('rent-vs-buy.keyFactors.rentingArg5')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Considerations */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('rent-vs-buy.considerations.title')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('rent-vs-buy.considerations.notIncluded')}:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('rent-vs-buy.considerations.notIncludedItem1')}</li>
                  <li>{t('rent-vs-buy.considerations.notIncludedItem2')}</li>
                  <li>{t('rent-vs-buy.considerations.notIncludedItem3')}</li>
                  <li>{t('rent-vs-buy.considerations.notIncludedItem4')}</li>
                  <li>{t('rent-vs-buy.considerations.notIncludedItem5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('rent-vs-buy.considerations.recommendations')}:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('rent-vs-buy.considerations.recommendationItem1')}</li>
                  <li>{t('rent-vs-buy.considerations.recommendationItem2')}</li>
                  <li>{t('rent-vs-buy.considerations.recommendationItem3')}</li>
                  <li>{t('rent-vs-buy.considerations.recommendationItem4')}</li>
                  <li>{t('rent-vs-buy.considerations.recommendationItem5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('rent-vs-buy.considerations.limitations')}
              </h3>
              <p className="text-amber-800 text-sm">
                {t('rent-vs-buy.considerations.limitationsText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Context */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('rent-vs-buy.marketContext.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('rent-vs-buy.marketContext.mortgageRates')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('rent-vs-buy.marketContext.program720')}: <strong>7%</strong></div>
              <div>{t('rent-vs-buy.marketContext.standardMortgage')}: <strong>12-16%</strong></div>
              <div>{t('rent-vs-buy.marketContext.partnerPrograms')}: <strong>9-12%</strong></div>
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('rent-vs-buy.marketContext.propertyGrowth')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('rent-vs-buy.marketContext.almaty')}: <strong>2-5%</strong> {t('rent-vs-buy.marketContext.perYear')}</div>
              <div>{t('rent-vs-buy.marketContext.astana')}: <strong>3-6%</strong> {t('rent-vs-buy.marketContext.perYear')}</div>
              <div>{t('rent-vs-buy.marketContext.regions')}: <strong>1-3%</strong> {t('rent-vs-buy.marketContext.perYear')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Percent className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('rent-vs-buy.marketContext.rentGrowth')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('rent-vs-buy.marketContext.largeCities')}: <strong>3-8%</strong> {t('rent-vs-buy.marketContext.perYear')}</div>
              <div>{t('rent-vs-buy.marketContext.mediumCities')}: <strong>2-5%</strong> {t('rent-vs-buy.marketContext.perYear')}</div>
              <div>{t('rent-vs-buy.marketContext.regions')}: <strong>1-3%</strong> {t('rent-vs-buy.marketContext.perYear')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('rent-vs-buy.marketContext.recommendedParams')}:</strong> {t('rent-vs-buy.marketContext.recommendedParamsText')}
          </p>
        </div>
      </div>

      {/* Диаграмма сравнения */}
      {results && results.totalBuyCost > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Покупка', value: results.totalBuyCost },
              { name: 'Аренда', value: results.totalRentCost },
            ]}
            title="Сравнение расходов"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalBuyCost > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Аренда или покупка',
              subtitle: results.recommendation === 'buy' ? 'Рекомендация: Покупка' : 'Рекомендация: Аренда',
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Стоимость недвижимости', value: `${parseFloat(propertyPrice).toLocaleString()} ₸` },
                    { label: 'Ежемесячная аренда', value: `${parseFloat(monthlyRent).toLocaleString()} ₸` },
                    { label: 'Период анализа', value: `${analysisYears} лет` },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Общая стоимость покупки', value: `${results.totalBuyCost.toLocaleString()} ₸` },
                    { label: 'Общая стоимость аренды', value: `${results.totalRentCost.toLocaleString()} ₸` },
                    { label: 'Разница', value: `${results.difference.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="rent-or-buy-analysis"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('rent-vs-buy.faq.q1'), answer: t('rent-vs-buy.faq.a1') },
          { question: t('rent-vs-buy.faq.q2'), answer: t('rent-vs-buy.faq.a2') },
          { question: t('rent-vs-buy.faq.q3'), answer: t('rent-vs-buy.faq.a3') },
          { question: t('rent-vs-buy.faq.q4'), answer: t('rent-vs-buy.faq.a4') },
          { question: t('rent-vs-buy.faq.q5'), answer: t('rent-vs-buy.faq.a5') }
        ]}
        sources={[
          { title: 'Krisha.kz — рынок недвижимости', url: 'https://krisha.kz/' },
          { title: 'Статистика цен НБ РК', url: 'https://nationalbank.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="rent-or-buy"
        calculatorTitle="Арендовать или покупать"
      />
    </div>
  );
}
