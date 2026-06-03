import React, { useState, useEffect } from 'react';
import { Crown, Calculator, Home, Car, Plane, DollarSign, Info, AlertTriangle, TrendingUp, Building, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function LuxuryTaxCalculator() {
  const { t } = useTranslation('calculators');
  const [assetType, setAssetType] = useState<'property' | 'vehicle' | 'yacht' | 'aircraft'>('property');
  const [assetValue, setAssetValue] = useState<string>('120000000');
  const [totalPropertyValue, setTotalPropertyValue] = useState<string>('120000000');

  const [results, setResults] = useState({
    isSubjectToTax: false,
    regularTax: 0,
    luxuryTax: 0,
    totalTax: 0,
    threshold: 0,
    excessAmount: 0,
    effectiveRate: 0,
    category: '',
    description: ''
  });

  const MRP_2026 = 4325;

  const PROPERTY_THRESHOLD = 450000000;
  const PROPERTY_BASE_TAX = 2946600;
  const PROPERTY_EXCESS_RATE = 0.02;

  const VEHICLE_THRESHOLD_MRP = 18000;
  const VEHICLE_THRESHOLD = VEHICLE_THRESHOLD_MRP * MRP_2026;
  const VEHICLE_LUXURY_RATE = 0.10;

  const YACHT_AIRCRAFT_THRESHOLD_MRP = 24000;
  const YACHT_AIRCRAFT_THRESHOLD = YACHT_AIRCRAFT_THRESHOLD_MRP * MRP_2026;
  const YACHT_AIRCRAFT_LUXURY_RATE = 0.10;

  const assetTypes = [
    {
      id: 'property',
      name: t('luxury-tax.assetTypes.property.name'),
      icon: '🏠',
      description: t('luxury-tax.assetTypes.property.description'),
      threshold: PROPERTY_THRESHOLD,
      component: Home
    },
    {
      id: 'vehicle',
      name: t('luxury-tax.assetTypes.vehicle.name'),
      icon: '🚗',
      description: t('luxury-tax.assetTypes.vehicle.description'),
      threshold: VEHICLE_THRESHOLD,
      component: Car
    },
    {
      id: 'yacht',
      name: t('luxury-tax.assetTypes.yacht.name'),
      icon: '🛥️',
      description: t('luxury-tax.assetTypes.yacht.description'),
      threshold: YACHT_AIRCRAFT_THRESHOLD,
      component: Plane
    },
    {
      id: 'aircraft',
      name: t('luxury-tax.assetTypes.aircraft.name'),
      icon: '✈️',
      description: t('luxury-tax.assetTypes.aircraft.description'),
      threshold: YACHT_AIRCRAFT_THRESHOLD,
      component: Plane
    }
  ];

  const calculateLuxuryTax = () => {
    const value = parseFloat(assetValue) || 0;
    const totalPropValue = parseFloat(totalPropertyValue) || value;

    if (value <= 0) {
      setResults({
        isSubjectToTax: false,
        regularTax: 0,
        luxuryTax: 0,
        totalTax: 0,
        threshold: 0,
        excessAmount: 0,
        effectiveRate: 0,
        category: '',
        description: ''
      });
      return;
    }

    let isSubjectToTax = false;
    let regularTax = 0;
    let luxuryTax = 0;
    let threshold = 0;
    let excessAmount = 0;
    let category = '';
    let description = '';

    switch (assetType) {
      case 'property':
        threshold = PROPERTY_THRESHOLD;
        category = t('luxury-tax.assetTypes.property.name');

        const propertyValueForCalc = Math.max(totalPropValue, value);

        if (propertyValueForCalc > threshold) {
          isSubjectToTax = true;
          excessAmount = propertyValueForCalc - threshold;

          regularTax = PROPERTY_BASE_TAX;
          luxuryTax = excessAmount * PROPERTY_EXCESS_RATE;

          description = t('luxury-tax.results.propertyExceedsThreshold', { threshold: formatNumber(threshold) });
        } else {
          description = t('luxury-tax.results.belowThreshold', { threshold: formatNumber(threshold) });
        }
        break;

      case 'vehicle':
        threshold = VEHICLE_THRESHOLD;
        category = t('luxury-tax.assetTypes.vehicle.category');

        if (value > threshold) {
          isSubjectToTax = true;
          excessAmount = value - threshold;

          luxuryTax = value * VEHICLE_LUXURY_RATE;

          description = t('luxury-tax.results.vehicleExceedsMRP', { mrp: VEHICLE_THRESHOLD_MRP.toLocaleString() });
        } else {
          description = t('luxury-tax.results.vehicleBelowMRP', { mrp: VEHICLE_THRESHOLD_MRP.toLocaleString() });
        }
        break;

      case 'yacht':
        threshold = YACHT_AIRCRAFT_THRESHOLD;
        category = t('luxury-tax.assetTypes.yacht.category');

        if (value > threshold) {
          isSubjectToTax = true;
          excessAmount = value - threshold;

          luxuryTax = value * YACHT_AIRCRAFT_LUXURY_RATE;

          description = t('luxury-tax.results.yachtExceedsMRP', { mrp: YACHT_AIRCRAFT_THRESHOLD_MRP.toLocaleString() });
        } else {
          description = t('luxury-tax.results.yachtBelowMRP', { mrp: YACHT_AIRCRAFT_THRESHOLD_MRP.toLocaleString() });
        }
        break;

      case 'aircraft':
        threshold = YACHT_AIRCRAFT_THRESHOLD;
        category = t('luxury-tax.assetTypes.aircraft.category');

        if (value > threshold) {
          isSubjectToTax = true;
          excessAmount = value - threshold;

          luxuryTax = value * YACHT_AIRCRAFT_LUXURY_RATE;

          description = t('luxury-tax.results.aircraftExceedsMRP', { mrp: YACHT_AIRCRAFT_THRESHOLD_MRP.toLocaleString() });
        } else {
          description = t('luxury-tax.results.aircraftBelowMRP', { mrp: YACHT_AIRCRAFT_THRESHOLD_MRP.toLocaleString() });
        }
        break;
    }

    const totalTax = regularTax + luxuryTax;
    const effectiveRate = value > 0 ? (totalTax / value) * 100 : 0;

    setResults({
      isSubjectToTax,
      regularTax: Math.round(regularTax),
      luxuryTax: Math.round(luxuryTax),
      totalTax: Math.round(totalTax),
      threshold,
      excessAmount: Math.round(excessAmount),
      effectiveRate: Number(effectiveRate.toFixed(2)),
      category,
      description
    });
  };

  useEffect(() => {
    calculateLuxuryTax();
  }, [assetType, assetValue, totalPropertyValue]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount.toLocaleString()} ${t('luxury-tax.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  const selectedAssetType = assetTypes.find(type => type.id === assetType);

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="luxury-tax" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('luxury-tax.title')}</h1>
            <p className="text-gray-600">{t('luxury-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('luxury-tax.assetParameters')}</h2>

          <div className="space-y-6">
            {/* Asset Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('luxury-tax.assetTypeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                {assetTypes.map((type) => {
                  const IconComponent = type.component;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setAssetType(type.id as any)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        assetType === type.id
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{type.icon}</span>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="font-medium mb-1">{type.name}</div>
                      <div className="text-xs text-gray-600">{type.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t('luxury-tax.threshold')}: {formatNumber(type.threshold)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asset Value */}
            <div>
              <label htmlFor="assetValue" className="block text-sm font-medium text-gray-700 mb-2">
                {assetType === 'property' ? t('luxury-tax.propertyValueLabel') :
                 t('luxury-tax.assetValueLabel', { type: selectedAssetType?.name.toLowerCase() })}
              </label>
              <RangeSlider
                value={parseFloat(assetValue) || 0}
                onChange={(val) => setAssetValue(String(val))}
                min={50000000}
                max={500000000}
                step={10000000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#eab308"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="assetValue"
                  value={assetValue}
                  onChange={(e) => setAssetValue(e.target.value)}
                  placeholder={t('luxury-tax.enterValue')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Total Property Value (for real estate only) */}
            {assetType === 'property' && (
              <div>
                <label htmlFor="totalPropertyValue" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('luxury-tax.totalPropertyValueLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="totalPropertyValue"
                    value={totalPropertyValue}
                    onChange={(e) => setTotalPropertyValue(e.target.value)}
                    placeholder={t('luxury-tax.totalPropertyPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('luxury-tax.totalPropertyHint')}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">
                {t('luxury-tax.thresholds2025')}:
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• {t('luxury-tax.assetTypes.property.name')}: {formatNumber(PROPERTY_THRESHOLD)}</li>
                <li>• {t('luxury-tax.assetTypes.vehicle.name')}: {formatMRP(VEHICLE_THRESHOLD_MRP)}</li>
                <li>• {t('luxury-tax.yachtsAircraft')}: {formatMRP(YACHT_AIRCRAFT_THRESHOLD_MRP)}</li>
                <li>• {t('luxury-tax.mrp2026')}: {formatNumber(MRP_2026)}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('luxury-tax.calculationResults')}</h2>

          <div className="space-y-6">
            {results.category && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {results.category} • {t('luxury-tax.value')}: {formatNumber(parseFloat(assetValue) || 0)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">{results.description}</div>
              </div>
            )}

            {results.isSubjectToTax ? (
              <div className="space-y-4">
                {/* Tax Status */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {t('luxury-tax.results.subjectToLuxuryTax')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Crown className="w-6 h-6 text-yellow-600" />
                      <span className="text-2xl font-bold text-red-700">{t('luxury-tax.yes')}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('luxury-tax.results.exceedsThresholdMessage')}
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('luxury-tax.results.assetValue')}</span>
                    <span className="font-semibold text-gray-900">
                      {formatNumber(parseFloat(assetValue) || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('luxury-tax.results.taxThreshold')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.threshold)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('luxury-tax.results.excessAmount')}</span>
                    <span className="font-semibold text-red-600">{formatNumber(results.excessAmount)}</span>
                  </div>

                  {results.regularTax > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('luxury-tax.results.baseTax')}</span>
                      <span className="font-semibold text-gray-900">{formatNumber(results.regularTax)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">
                      {assetType === 'property' ? t('luxury-tax.results.excessTax') : t('luxury-tax.results.excise')}
                    </span>
                    <span className="font-semibold text-orange-600">{formatNumber(results.luxuryTax)}</span>
                  </div>
                </div>

                {/* Total Tax */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">{t('luxury-tax.results.totalAmount')}</span>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-red-600" />
                      <span className="text-xl font-bold text-red-700">{formatNumber(results.totalTax)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('luxury-tax.results.effectiveRate')}: {results.effectiveRate}% {t('luxury-tax.results.ofValue')}
                  </div>
                </div>

                {/* Payment Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-900">{t('luxury-tax.results.paymentDeadline')}</h3>
                      <p className="text-amber-800 text-sm">
                        {t('luxury-tax.results.paymentDeadlineText')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* No Tax Status */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {t('luxury-tax.results.notSubjectToLuxuryTax')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Crown className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">{t('luxury-tax.no')}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.description}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">{t('luxury-tax.results.standardTaxation')}</h3>
                      <p className="text-blue-800 text-sm">
                        {t('luxury-tax.results.standardTaxationText')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thresholds Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('luxury-tax.thresholdsTable.title')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('luxury-tax.thresholdsTable.assetType')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('luxury-tax.thresholdsTable.threshold')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('luxury-tax.thresholdsTable.taxRate')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('luxury-tax.thresholdsTable.calculationDetails')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  🏠 {t('luxury-tax.assetTypes.property.name')}
                </td>
                <td className="py-3 px-4 text-center text-sm font-semibold text-orange-600">
                  {formatNumber(PROPERTY_THRESHOLD)}
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  {t('luxury-tax.thresholdsTable.fixedPlus2Percent')}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatNumber(PROPERTY_BASE_TAX)} + {t('luxury-tax.thresholdsTable.twoPercentExcess')}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  🚗 {t('luxury-tax.assetTypes.vehicle.name')}
                </td>
                <td className="py-3 px-4 text-center text-sm font-semibold text-orange-600">
                  {formatMRP(VEHICLE_THRESHOLD_MRP)}
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  {t('luxury-tax.thresholdsTable.tenPercentExcise')}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {t('luxury-tax.thresholdsTable.tenPercentOfVehicle')}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  🛥️ {t('luxury-tax.assetTypes.yacht.name')}
                </td>
                <td className="py-3 px-4 text-center text-sm font-semibold text-orange-600">
                  {formatMRP(YACHT_AIRCRAFT_THRESHOLD_MRP)}
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  {t('luxury-tax.thresholdsTable.tenPercentExcise')}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {t('luxury-tax.thresholdsTable.tenPercentOfYacht')}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  ✈️ {t('luxury-tax.assetTypes.aircraft.name')}
                </td>
                <td className="py-3 px-4 text-center text-sm font-semibold text-orange-600">
                  {formatMRP(YACHT_AIRCRAFT_THRESHOLD_MRP)}
                </td>
                <td className="py-3 px-4 text-center text-sm">
                  {t('luxury-tax.thresholdsTable.tenPercentExcise')}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {t('luxury-tax.thresholdsTable.tenPercentOfAircraft')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('luxury-tax.important')}:</strong> {t('luxury-tax.thresholdsTable.importantNote')}
          </p>
        </div>
      </div>

      {/* Examples Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('luxury-tax.examples.title')}</h2>

        <div className="space-y-6">
          {/* Property Example */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <h3 className="font-semibold text-orange-900 mb-3">{t('luxury-tax.examples.example1.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('luxury-tax.examples.sourceData')}:</div>
                <div>{t('luxury-tax.examples.example1.apartment')}: 300 {t('luxury-tax.examples.millionTenge')}</div>
                <div>{t('luxury-tax.examples.example1.house')}: 250 {t('luxury-tax.examples.millionTenge')}</div>
                <div>{t('luxury-tax.examples.example1.totalValue')}: 550 {t('luxury-tax.examples.millionTenge')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('luxury-tax.examples.calculation')}:</div>
                <div>{t('luxury-tax.examples.threshold')}: 450 {t('luxury-tax.examples.millionTenge')}</div>
                <div>{t('luxury-tax.examples.excess')}: 100 {t('luxury-tax.examples.millionTenge')}</div>
                <div>{t('luxury-tax.examples.example1.excessTax')}: 2% × 100 {t('luxury-tax.examples.mln')} = 2 {t('luxury-tax.examples.millionTenge')}</div>
              </div>
              <div>
                <div className="font-medium text-orange-700">{t('luxury-tax.examples.toPay')}:</div>
                <div>{t('luxury-tax.examples.example1.baseTax')}: 2,946,600 ₸</div>
                <div>{t('luxury-tax.examples.example1.additionalTax')}: 2,000,000 ₸</div>
                <div className="text-lg font-bold text-orange-600">{t('luxury-tax.examples.total')}: 4,946,600 ₸</div>
              </div>
            </div>
          </div>

          {/* Vehicle Example */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('luxury-tax.examples.example2.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('luxury-tax.examples.sourceData')}:</div>
                <div>{t('luxury-tax.examples.example2.vehicle')}: Porsche 911</div>
                <div>{t('luxury-tax.examples.example2.value')}: 80 {t('luxury-tax.examples.millionTenge')}</div>
                <div>{t('luxury-tax.examples.threshold')}: {formatMRP(VEHICLE_THRESHOLD_MRP)}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('luxury-tax.examples.calculation')}:</div>
                <div>{t('luxury-tax.examples.example2.exceedsThreshold')}</div>
                <div>{t('luxury-tax.examples.example2.exciseRate')}: 10%</div>
                <div>80,000,000 × 10% = 8,000,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('luxury-tax.examples.toPay')}:</div>
                <div>{t('luxury-tax.examples.example2.luxuryExcise')}: 8,000,000 ₸</div>
                <div>+ {t('luxury-tax.examples.example2.regularTransportTax')}</div>
                <div className="text-lg font-bold text-blue-600">{t('luxury-tax.examples.example2.excise')}: 8,000,000 ₸</div>
              </div>
            </div>
          </div>

          {/* Yacht Example */}
          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-3">{t('luxury-tax.examples.example3.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('luxury-tax.examples.sourceData')}:</div>
                <div>{t('luxury-tax.examples.example3.yacht')}: 120 {t('luxury-tax.examples.millionTenge')}</div>
                <div>{t('luxury-tax.examples.threshold')}: {formatMRP(YACHT_AIRCRAFT_THRESHOLD_MRP)}</div>
                <div>{t('luxury-tax.examples.excess')}: 25.6 {t('luxury-tax.examples.millionTenge')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('luxury-tax.examples.calculation')}:</div>
                <div>{t('luxury-tax.examples.example3.exciseRate')}: 10%</div>
                <div>120,000,000 × 10% = 12,000,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('luxury-tax.examples.toPay')}:</div>
                <div>{t('luxury-tax.examples.example3.luxuryExcise')}: 12,000,000 ₸</div>
                <div className="text-lg font-bold text-teal-600">{t('luxury-tax.examples.total')}: 12,000,000 ₸</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('luxury-tax.legal.title')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('luxury-tax.legal.property.title')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('luxury-tax.legal.property.point1')}</li>
                  <li>{t('luxury-tax.legal.property.point2')}</li>
                  <li>{t('luxury-tax.legal.property.point3')}</li>
                  <li>{t('luxury-tax.legal.property.point4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('luxury-tax.legal.vehicles.title')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('luxury-tax.legal.vehicles.point1')}</li>
                  <li>{t('luxury-tax.legal.vehicles.point2')}</li>
                  <li>{t('luxury-tax.legal.vehicles.point3')}</li>
                  <li>{t('luxury-tax.legal.vehicles.point4')}</li>
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
                {t('luxury-tax.legal.importantFeatures.title')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• <strong>{t('luxury-tax.legal.importantFeatures.declaration.title')}:</strong> {t('luxury-tax.legal.importantFeatures.declaration.text')}</p>
                <p>• <strong>{t('luxury-tax.legal.importantFeatures.valuation.title')}:</strong> {t('luxury-tax.legal.importantFeatures.valuation.text')}</p>
                <p>• <strong>{t('luxury-tax.legal.importantFeatures.concealment.title')}:</strong> {t('luxury-tax.legal.importantFeatures.concealment.text')}</p>
                <p>• <strong>{t('luxury-tax.legal.importantFeatures.thresholds.title')}:</strong> {t('luxury-tax.legal.importantFeatures.thresholds.text')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('luxury-tax.strategies.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚖️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('luxury-tax.strategies.legal.title')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('luxury-tax.strategies.legal.point1')}</div>
              <div>{t('luxury-tax.strategies.legal.point2')}</div>
              <div>{t('luxury-tax.strategies.legal.point3')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('luxury-tax.strategies.investment.title')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('luxury-tax.strategies.investment.point1')}</div>
              <div>{t('luxury-tax.strategies.investment.point2')}</div>
              <div>{t('luxury-tax.strategies.investment.point3')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('luxury-tax.strategies.temporal.title')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('luxury-tax.strategies.temporal.point1')}</div>
              <div>{t('luxury-tax.strategies.temporal.point2')}</div>
              <div>{t('luxury-tax.strategies.temporal.point3')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900 mb-1">
                {t('luxury-tax.strategies.warning.title')}
              </h3>
              <p className="text-red-800 text-sm">
                {t('luxury-tax.strategies.warning.text')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма и экспорт */}
      {results.luxuryTax > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: t('luxury-tax.chart.regularTax'), value: results.regularTax },
              { name: t('luxury-tax.chart.luxuryTax'), value: results.luxuryTax },
            ]}
            title={t('luxury-tax.chart.title')}
          />
          <ExportButtons
            data={{
              title: t('luxury-tax.export.title'),
              subtitle: assetType === 'property' ? t('luxury-tax.assetTypes.property.name') : assetType === 'vehicle' ? t('luxury-tax.assetTypes.vehicle.name') : t('luxury-tax.export.other'),
              sections: [
                {
                  title: t('luxury-tax.export.parameters'),
                  data: [
                    { label: t('luxury-tax.export.assetType'), value: assetType },
                    { label: t('luxury-tax.export.cost'), value: `${parseFloat(assetValue || '0').toLocaleString()} ₸` },
                  ]
                },
                {
                  title: t('luxury-tax.export.results'),
                  data: [
                    { label: t('luxury-tax.chart.regularTax'), value: `${results.regularTax.toLocaleString()} ₸` },
                    { label: t('luxury-tax.chart.luxuryTax'), value: `${results.luxuryTax.toLocaleString()} ₸` },
                    { label: t('luxury-tax.export.total'), value: `${results.totalTax.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('luxury-tax.export.footer')
            }}
            filename="luxury-tax-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="luxury-tax" />
      <MethodologySection steps={getMethodology('luxury-tax')} />
      <FAQSection
        items={[
          { question: t('luxury-tax.faq.q1'), answer: t('luxury-tax.faq.a1') },
          { question: t('luxury-tax.faq.q2'), answer: t('luxury-tax.faq.a2') },
          { question: t('luxury-tax.faq.q3'), answer: t('luxury-tax.faq.a3') },
          { question: t('luxury-tax.faq.q4'), answer: t('luxury-tax.faq.a4') },
          { question: t('luxury-tax.faq.q5'), answer: t('luxury-tax.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК — налог на роскошь', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'КГД — имущественные налоги', url: 'https://kgd.gov.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="luxury-tax"
        calculatorTitle="Калькулятор налога на роскошь"
      />
      <LastUpdated calculatorId="luxury-tax" />
    </div>
  );
}
