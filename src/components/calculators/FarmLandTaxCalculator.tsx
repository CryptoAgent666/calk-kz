import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wheat, Calculator, MapPin, TrendingUp, Info, AlertTriangle, Target, Sprout, TreePine, Building, Tractor, FileText, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function FarmLandTaxCalculator() {
  const { t } = useTranslation('calculators');
  const [region, setRegion] = useState<string>('almaty-region');
  const [landArea, setLandArea] = useState<string>('100');
  const [bonityScoret, setBonityScoret] = useState<string>('50');
  const [landType, setLandType] = useState<'irrigated' | 'rainfed' | 'pasture' | 'hayfield'>('irrigated');
  const [farmType, setFarmType] = useState<'peasant' | 'farm' | 'individual'>('peasant');
  const [hasPreferences, setHasPreferences] = useState<boolean>(false);

  const [results, setResults] = useState({
    baseRate: 0,
    qualityCoefficient: 1.0,
    locationCoefficient: 1.0,
    preferenceDiscount: 0,
    taxPerHectare: 0,
    totalTax: 0,
    savedTaxes: 0,
    regionName: '',
    landTypeName: '',
    effectiveRate: 0
  });

  // Константы на 2026 год
  const MRP_2026 = 4325;

  // Базовые ставки земельного налога по регионам (в МРП за 1 га)
  const regionalRates = [
    {
      id: 'almaty-region',
      name: t('farm-land-tax.regions.almatyRegion'),
      baseRates: {
        irrigated: 0.68,
        rainfed: 0.45,
        pasture: 0.15,
        hayfield: 0.25
      }
    },
    {
      id: 'zhambyl-region',
      name: t('farm-land-tax.regions.zhambylRegion'),
      baseRates: {
        irrigated: 0.65,
        rainfed: 0.42,
        pasture: 0.12,
        hayfield: 0.22
      }
    },
    {
      id: 'turkestan-region',
      name: t('farm-land-tax.regions.turkestanRegion'),
      baseRates: {
        irrigated: 0.70,
        rainfed: 0.48,
        pasture: 0.18,
        hayfield: 0.28
      }
    },
    {
      id: 'kyzylorda-region',
      name: t('farm-land-tax.regions.kyzylordaRegion'),
      baseRates: {
        irrigated: 0.72,
        rainfed: 0.50,
        pasture: 0.20,
        hayfield: 0.30
      }
    },
    {
      id: 'aktobe-region',
      name: t('farm-land-tax.regions.aktobeRegion'),
      baseRates: {
        irrigated: 0.60,
        rainfed: 0.38,
        pasture: 0.10,
        hayfield: 0.18
      }
    },
    {
      id: 'west-kazakhstan',
      name: t('farm-land-tax.regions.westKazakhstan'),
      baseRates: {
        irrigated: 0.58,
        rainfed: 0.35,
        pasture: 0.08,
        hayfield: 0.15
      }
    },
    {
      id: 'north-kazakhstan',
      name: t('farm-land-tax.regions.northKazakhstan'),
      baseRates: {
        irrigated: 0.55,
        rainfed: 0.40,
        pasture: 0.12,
        hayfield: 0.20
      }
    },
    {
      id: 'kostanay-region',
      name: t('farm-land-tax.regions.kostanayRegion'),
      baseRates: {
        irrigated: 0.52,
        rainfed: 0.38,
        pasture: 0.11,
        hayfield: 0.19
      }
    },
    {
      id: 'akmola-region',
      name: t('farm-land-tax.regions.akmolaRegion'),
      baseRates: {
        irrigated: 0.50,
        rainfed: 0.35,
        pasture: 0.10,
        hayfield: 0.17
      }
    },
    {
      id: 'karaganda-region',
      name: t('farm-land-tax.regions.karagandaRegion'),
      baseRates: {
        irrigated: 0.48,
        rainfed: 0.32,
        pasture: 0.09,
        hayfield: 0.16
      }
    },
    {
      id: 'pavlodar-region',
      name: t('farm-land-tax.regions.pavlodarRegion'),
      baseRates: {
        irrigated: 0.45,
        rainfed: 0.30,
        pasture: 0.08,
        hayfield: 0.14
      }
    },
    {
      id: 'east-kazakhstan',
      name: t('farm-land-tax.regions.eastKazakhstan'),
      baseRates: {
        irrigated: 0.42,
        rainfed: 0.28,
        pasture: 0.07,
        hayfield: 0.13
      }
    },
    {
      id: 'atyrau-region',
      name: t('farm-land-tax.regions.atyrauRegion'),
      baseRates: {
        irrigated: 0.75,
        rainfed: 0.55,
        pasture: 0.25,
        hayfield: 0.35
      }
    },
    {
      id: 'mangystau-region',
      name: t('farm-land-tax.regions.mangystauRegion'),
      baseRates: {
        irrigated: 0.80,
        rainfed: 0.60,
        pasture: 0.30,
        hayfield: 0.40
      }
    }
  ];

  // Коэффициенты качества почвы (по баллу бонитета)
  const getQualityCoefficient = (bonityScore: number): number => {
    if (bonityScore <= 20) return 0.5;
    if (bonityScore <= 40) return 0.7;
    if (bonityScore <= 60) return 1.0;
    if (bonityScore <= 80) return 1.3;
    if (bonityScore <= 100) return 1.6;
    return 1.0; // По умолчанию
  };

  // Коэффициенты по типу хозяйства
  const farmTypeCoefficients = {
    peasant: { coefficient: 0.5, name: t('farm-land-tax.farmTypes.peasant.name'), description: t('farm-land-tax.farmTypes.peasant.description') },
    farm: { coefficient: 0.7, name: t('farm-land-tax.farmTypes.farm.name'), description: t('farm-land-tax.farmTypes.farm.description') },
    individual: { coefficient: 1.0, name: t('farm-land-tax.farmTypes.individual.name'), description: t('farm-land-tax.farmTypes.individual.description') }
  };

  // Типы земель
  const landTypes = [
    {
      id: 'irrigated',
      name: t('farm-land-tax.landTypes.irrigated.name'),
      description: t('farm-land-tax.landTypes.irrigated.description'),
      icon: '💧',
      coefficient: 1.0
    },
    {
      id: 'rainfed',
      name: t('farm-land-tax.landTypes.rainfed.name'),
      description: t('farm-land-tax.landTypes.rainfed.description'),
      icon: '🌧️',
      coefficient: 0.8
    },
    {
      id: 'pasture',
      name: t('farm-land-tax.landTypes.pasture.name'),
      description: t('farm-land-tax.landTypes.pasture.description'),
      icon: '🐄',
      coefficient: 0.3
    },
    {
      id: 'hayfield',
      name: t('farm-land-tax.landTypes.hayfield.name'),
      description: t('farm-land-tax.landTypes.hayfield.description'),
      icon: '🌾',
      coefficient: 0.4
    }
  ];

  const calculateLandTax = () => {
    const area = parseFloat(landArea) || 0;
    const bonityScore = parseFloat(bonityScoret) || 50; // Средний балл по умолчанию

    if (area <= 0) {
      setResults({
        baseRate: 0, qualityCoefficient: 1.0, locationCoefficient: 1.0,
        preferenceDiscount: 0, taxPerHectare: 0, totalTax: 0, savedTaxes: 0,
        regionName: '', landTypeName: '', effectiveRate: 0
      });
      return;
    }

    const selectedRegion = regionalRates.find(r => r.id === region);
    const selectedLandType = landTypes.find(lt => lt.id === landType);
    const selectedFarmType = farmTypeCoefficients[farmType];

    if (!selectedRegion || !selectedLandType) return;

    // Базовая ставка для региона и типа земли
    const baseRatePerHa = selectedRegion.baseRates[landType];
    const baseRate = baseRatePerHa * MRP_2026;

    // Коэффициент качества почвы
    const qualityCoefficient = getQualityCoefficient(bonityScore);

    // Коэффициент местоположения (тип земли)
    const locationCoefficient = selectedLandType.coefficient;

    // Коэффициент типа хозяйства
    const farmTypeCoeff = selectedFarmType.coefficient;

    // Льготы (если есть)
    const preferenceDiscount = hasPreferences ? 50 : 0; // 50% скидка для льготников

    // Расчет налога на 1 гектар
    let taxPerHectare = baseRate * qualityCoefficient * locationCoefficient * farmTypeCoeff;

    // Применение льгот
    if (hasPreferences) {
      taxPerHectare *= (1 - preferenceDiscount / 100);
    }

    // Общий налог
    const totalTax = taxPerHectare * area;

    // Примерная экономия от единого налога (по сравнению с обычным режимом)
    const savedTaxes = totalTax * 0.3; // Приблизительно 30% экономии

    const effectiveRate = totalTax / area; // Эффективная ставка на гектар

    setResults({
      baseRate: Math.round(baseRate),
      qualityCoefficient,
      locationCoefficient,
      preferenceDiscount,
      taxPerHectare: Math.round(taxPerHectare),
      totalTax: Math.round(totalTax),
      savedTaxes: Math.round(savedTaxes),
      regionName: selectedRegion.name,
      landTypeName: selectedLandType.name,
      effectiveRate: Math.round(effectiveRate)
    });
  };

  useEffect(() => {
    calculateLandTax();
  }, [region, landArea, bonityScoret, landType, farmType, hasPreferences]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount.toFixed(2)} ${t('farm-land-tax.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  const selectedRegionData = regionalRates.find(r => r.id === region);
  const selectedLandTypeData = landTypes.find(lt => lt.id === landType);
  const selectedFarmTypeData = farmTypeCoefficients[farmType];

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="farm-land-tax" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-lime-500 rounded-lg flex items-center justify-center">
            <Wheat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('farm-land-tax.title')}</h1>
            <p className="text-gray-600">{t('farm-land-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Important Info */}
      <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {t('farm-land-tax.infoBox.title')}
            </h3>
            <div className="text-green-800 space-y-2">
              <p>
                {t('farm-land-tax.infoBox.description1')}
              </p>
              <p>
                {t('farm-land-tax.infoBox.description2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.inputs.title')}</h2>

          <div className="space-y-6">
            {/* Region Selection */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('farm-land-tax.inputs.region')}
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              >
                {regionalRates.map((regionOption) => (
                  <option key={regionOption.id} value={regionOption.id}>
                    {regionOption.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Land Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('farm-land-tax.inputs.landArea')}
              </label>
              <RangeSlider
                value={parseFloat(landArea) || 0}
                onChange={(val) => setLandArea(String(val))}
                min={1}
                max={1000}
                step={1}
                formatValue={(v) => `${v} га`}
                color="#22c55e"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="landArea"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder={t('farm-land-tax.inputs.landAreaPlaceholder')}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('farm-land-tax.inputs.hectare')}</span>
                </div>
              </div>
            </div>

            {/* Bonity Score */}
            <div>
              <label htmlFor="bonityScoret" className="block text-sm font-medium text-gray-700 mb-2">
                {t('farm-land-tax.inputs.bonityScore')}
              </label>
              <input
                type="number"
                id="bonityScoret"
                value={bonityScoret}
                onChange={(e) => setBonityScoret(e.target.value)}
                placeholder={t('farm-land-tax.inputs.bonityScorePlaceholder')}
                min="0"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('farm-land-tax.inputs.bonityScoreHelp')}
              </p>
            </div>

            {/* Land Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('farm-land-tax.inputs.landType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {landTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setLandType(type.id as any)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      landType === type.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{type.icon}</span>
                      <span className="font-medium text-sm">{type.name}</span>
                    </div>
                    <div className="text-xs text-gray-600">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Farm Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('farm-land-tax.inputs.farmType')}
              </label>
              <div className="space-y-2">
                {Object.entries(farmTypeCoefficients).map(([key, farmTypeData]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="radio"
                      name="farmType"
                      value={key}
                      checked={farmType === key}
                      onChange={(e) => setFarmType(e.target.value as any)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{farmTypeData.name}</div>
                      <div className="text-xs text-gray-600">{farmTypeData.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div className="border-t pt-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasPreferences"
                  checked={hasPreferences}
                  onChange={(e) => setHasPreferences(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="hasPreferences" className="ml-2 block text-sm text-gray-700">
                  {t('farm-land-tax.inputs.hasPreferences')}
                </label>
              </div>
              {hasPreferences && (
                <p className="text-xs text-green-600 mt-1">
                  {t('farm-land-tax.inputs.preferencesDiscount')}
                </p>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">
                {t('farm-land-tax.inputs.advantagesTitle')}
              </h3>
              <div className="text-xs text-green-800 space-y-1">
                <div>{t('farm-land-tax.inputs.advantage1')}</div>
                <div>{t('farm-land-tax.inputs.advantage2')}</div>
                <div>{t('farm-land-tax.inputs.advantage3')}</div>
                <div>{t('farm-land-tax.inputs.advantage4')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.results.title')}</h2>

          <div className="space-y-6">
            {/* Summary Info */}
            {landArea && parseFloat(landArea) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{t('farm-land-tax.results.summaryTitle')}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('farm-land-tax.results.area')}: <strong>{landArea} {t('farm-land-tax.inputs.hectare')}</strong></div>
                  <div>{t('farm-land-tax.results.region')}: <strong>{results.regionName}</strong></div>
                  <div>{t('farm-land-tax.results.landType')}: <strong>{results.landTypeName}</strong></div>
                  <div>{t('farm-land-tax.results.bonityScore')}: <strong>{bonityScoret} {t('farm-land-tax.results.points')}</strong></div>
                  <div>{t('farm-land-tax.results.farmType')}: <strong>{selectedFarmTypeData?.name}</strong></div>
                </div>
              </div>
            )}

            {/* Tax Calculation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('farm-land-tax.results.baseRate')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.baseRate)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('farm-land-tax.results.qualityCoefficient')}</span>
                <span className="font-semibold text-gray-900">×{results.qualityCoefficient}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('farm-land-tax.results.locationCoefficient')}</span>
                <span className="font-semibold text-gray-900">×{results.locationCoefficient}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('farm-land-tax.results.farmTypeCoefficient')}</span>
                <span className="font-semibold text-green-600">×{selectedFarmTypeData?.coefficient}</span>
              </div>

              {hasPreferences && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('farm-land-tax.results.additionalDiscount')}</span>
                  <span className="font-semibold text-green-600">-{results.preferenceDiscount}%</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3">
                <span className="font-semibold text-blue-900">{t('farm-land-tax.results.taxPerHectare')}</span>
                <span className="text-lg font-bold text-blue-700">{formatNumber(results.taxPerHectare)}</span>
              </div>
            </div>

            {/* Total Tax */}
            <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('farm-land-tax.results.totalTax')}</span>
                <div className="flex items-center space-x-2">
                  <Wheat className="w-6 h-6 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">{formatNumber(results.totalTax)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('farm-land-tax.results.forArea', { area: landArea, landType: results.landTypeName.toLowerCase() })}
              </div>
            </div>

            {/* Savings */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">{t('farm-land-tax.results.savingsTitle')}</h3>
                  <p className="text-blue-800 text-sm">
                    {t('farm-land-tax.results.savingsDescription', { amount: formatNumber(results.savedTaxes) })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Rates Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.ratesTable.title')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.regionColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.irrigatedColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.rainfedColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.pastureColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.hayfieldColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {regionalRates.map((regionData) => (
                <tr key={regionData.id} className={`border-b border-gray-100 ${region === regionData.id ? 'bg-green-50' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{regionData.name}</td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">{formatMRP(regionData.baseRates.irrigated)}</td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">{formatMRP(regionData.baseRates.rainfed)}</td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">{formatMRP(regionData.baseRates.pasture)}</td>
                  <td className="py-3 px-4 text-center text-sm text-gray-700">{formatMRP(regionData.baseRates.hayfield)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {t('farm-land-tax.ratesTable.note')}
            <br />
            {t('farm-land-tax.ratesTable.mrpNote', { amount: formatNumber(MRP_2026) })}
          </p>
        </div>
      </div>

      {/* Bonity Scale */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.bonityScale.title')}</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-red-600 font-bold">0-20</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('farm-land-tax.bonityScale.low.title')}</h3>
            <div className="text-sm text-gray-600">{t('farm-land-tax.bonityScale.low.coefficient')}</div>
            <p className="text-xs text-red-700 mt-1">{t('farm-land-tax.bonityScale.low.description')}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 font-bold">21-40</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('farm-land-tax.bonityScale.belowAverage.title')}</h3>
            <div className="text-sm text-gray-600">{t('farm-land-tax.bonityScale.belowAverage.coefficient')}</div>
            <p className="text-xs text-orange-700 mt-1">{t('farm-land-tax.bonityScale.belowAverage.description')}</p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-yellow-600 font-bold">41-60</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('farm-land-tax.bonityScale.average.title')}</h3>
            <div className="text-sm text-gray-600">{t('farm-land-tax.bonityScale.average.coefficient')}</div>
            <p className="text-xs text-yellow-700 mt-1">{t('farm-land-tax.bonityScale.average.description')}</p>
          </div>

          <div className="text-center p-4 bg-lime-50 rounded-lg">
            <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lime-600 font-bold">61-80</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('farm-land-tax.bonityScale.good.title')}</h3>
            <div className="text-sm text-gray-600">{t('farm-land-tax.bonityScale.good.coefficient')}</div>
            <p className="text-xs text-lime-700 mt-1">{t('farm-land-tax.bonityScale.good.description')}</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">81-100</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('farm-land-tax.bonityScale.excellent.title')}</h3>
            <div className="text-sm text-gray-600">{t('farm-land-tax.bonityScale.excellent.coefficient')}</div>
            <p className="text-xs text-green-700 mt-1">{t('farm-land-tax.bonityScale.excellent.description')}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Sprout className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('farm-land-tax.bonityScale.noteTitle')}
              </h3>
              <p className="text-amber-800 text-sm">
                {t('farm-land-tax.bonityScale.noteDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits and Features */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.benefits.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.benefits.simplifiedReporting.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('farm-land-tax.benefits.simplifiedReporting.description')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tractor className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.benefits.farmerBenefits.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('farm-land-tax.benefits.farmerBenefits.description')}
            </p>
          </div>

          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.benefits.fairness.title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('farm-land-tax.benefits.fairness.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.examples.title')}</h2>

        <div className="space-y-6">
          {/* Example 1 */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('farm-land-tax.examples.example1.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-800">
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.parametersLabel')}:</div>
                <div>{t('farm-land-tax.examples.example1.area')}</div>
                <div>{t('farm-land-tax.examples.example1.landType')}</div>
                <div>{t('farm-land-tax.examples.example1.bonity')}</div>
                <div>{t('farm-land-tax.examples.example1.farmType')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.coefficientsLabel')}:</div>
                <div>{t('farm-land-tax.examples.example1.qualityCoeff')}</div>
                <div>{t('farm-land-tax.examples.example1.landTypeCoeff')}</div>
                <div>{t('farm-land-tax.examples.example1.farmTypeCoeff')}</div>
                <div>{t('farm-land-tax.examples.example1.benefits')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.calculationLabel')}:</div>
                <div>{t('farm-land-tax.examples.example1.baseRate')}</div>
                <div>{t('farm-land-tax.examples.example1.withCoeff')}</div>
                <div>{t('farm-land-tax.examples.example1.total')}</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('farm-land-tax.examples.savingsLabel')}:</div>
                <div className="text-lg font-bold text-green-600">{t('farm-land-tax.examples.example1.savings')}</div>
                <div className="text-xs text-green-600">{t('farm-land-tax.examples.vsStandardRegime')}</div>
              </div>
            </div>
          </div>

          {/* Example 2 */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('farm-land-tax.examples.example2.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-800">
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.parametersLabel')}:</div>
                <div>{t('farm-land-tax.examples.example2.area')}</div>
                <div>{t('farm-land-tax.examples.example2.landType')}</div>
                <div>{t('farm-land-tax.examples.example2.bonity')}</div>
                <div>{t('farm-land-tax.examples.example2.farmType')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.coefficientsLabel')}:</div>
                <div>{t('farm-land-tax.examples.example2.qualityCoeff')}</div>
                <div>{t('farm-land-tax.examples.example2.landTypeCoeff')}</div>
                <div>{t('farm-land-tax.examples.example2.farmTypeCoeff')}</div>
                <div>{t('farm-land-tax.examples.example2.benefits')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.calculationLabel')}:</div>
                <div>{t('farm-land-tax.examples.example2.baseRate')}</div>
                <div>{t('farm-land-tax.examples.example2.withCoeff')}</div>
                <div>{t('farm-land-tax.examples.example2.total')}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('farm-land-tax.examples.savingsLabel')}:</div>
                <div className="text-lg font-bold text-blue-600">{t('farm-land-tax.examples.example2.savings')}</div>
                <div className="text-xs text-blue-600">{t('farm-land-tax.examples.vsStandardRegime')}</div>
              </div>
            </div>
          </div>

          {/* Example 3 */}
          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-3">{t('farm-land-tax.examples.example3.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-800">
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.parametersLabel')}:</div>
                <div>{t('farm-land-tax.examples.example3.area')}</div>
                <div>{t('farm-land-tax.examples.example3.landType')}</div>
                <div>{t('farm-land-tax.examples.example3.bonity')}</div>
                <div>{t('farm-land-tax.examples.example3.farmType')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.coefficientsLabel')}:</div>
                <div>{t('farm-land-tax.examples.example3.qualityCoeff')}</div>
                <div>{t('farm-land-tax.examples.example3.landTypeCoeff')}</div>
                <div>{t('farm-land-tax.examples.example3.farmTypeCoeff')}</div>
                <div>{t('farm-land-tax.examples.example3.benefits')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('farm-land-tax.examples.calculationLabel')}:</div>
                <div>{t('farm-land-tax.examples.example3.baseRate')}</div>
                <div>{t('farm-land-tax.examples.example3.withCoeff')}</div>
                <div>{t('farm-land-tax.examples.example3.total')}</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('farm-land-tax.examples.savingsLabel')}:</div>
                <div className="text-lg font-bold text-teal-600">{t('farm-land-tax.examples.example3.savings')}</div>
                <div className="text-xs text-teal-600">{t('farm-land-tax.examples.vsStandardRegime')}</div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('farm-land-tax.legal.title')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.legal.taxpayersTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('farm-land-tax.legal.taxpayers.item1')}</li>
                  <li>{t('farm-land-tax.legal.taxpayers.item2')}</li>
                  <li>{t('farm-land-tax.legal.taxpayers.item3')}</li>
                  <li>{t('farm-land-tax.legal.taxpayers.item4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.legal.replacesTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('farm-land-tax.legal.replaces.item1')}</li>
                  <li>{t('farm-land-tax.legal.replaces.item2')}</li>
                  <li>{t('farm-land-tax.legal.replaces.item3')}</li>
                  <li>{t('farm-land-tax.legal.replaces.item4')}</li>
                  <li>{t('farm-land-tax.legal.replaces.item5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Building className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('farm-land-tax.legal.conditionsTitle')}
              </h3>
              <div className="text-green-800 text-sm space-y-1">
                <p>{t('farm-land-tax.legal.conditions.item1')}</p>
                <p>{t('farm-land-tax.legal.conditions.item2')}</p>
                <p>{t('farm-land-tax.legal.conditions.item3')}</p>
                <p>{t('farm-land-tax.legal.conditions.item4')}</p>
                <p>{t('farm-land-tax.legal.conditions.item5')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.optimization.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('farm-land-tax.optimization.reduceTaxTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.reduceTax.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.reduceTax.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.reduceTax.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.reduceTax.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('farm-land-tax.optimization.properAccountingTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.properAccounting.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.properAccounting.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.properAccounting.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('farm-land-tax.optimization.properAccounting.tip4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <TreePine className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('farm-land-tax.optimization.supportTitle')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('farm-land-tax.optimization.supportDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Context */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.regional.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('farm-land-tax.regional.agricultureTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>{t('farm-land-tax.regional.agriculture.kostanay')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.agriculture.north')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.agriculture.akmola')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.agriculture.almaty')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.agriculture.turkestan')}</strong></div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('farm-land-tax.regional.livestockTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>{t('farm-land-tax.regional.livestock.mangystau')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.livestock.atyrau')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.livestock.kyzylorda')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.livestock.zhambyl')}</strong></div>
              <div><strong>{t('farm-land-tax.regional.livestock.aktobe')}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      {results.totalTax > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('farm-land-tax.chart.landTax'), value: results.totalTax },
            ]}
            title={t('farm-land-tax.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.totalTax > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('farm-land-tax.export.title'),
              subtitle: `${t('farm-land-tax.export.region')}: ${results.regionName}`,
              sections: [
                {
                  title: t('farm-land-tax.export.parameters'),
                  data: [
                    { label: t('farm-land-tax.export.area'), value: `${parseFloat(landArea || '0').toLocaleString()} ${t('farm-land-tax.inputs.hectare')}` },
                    { label: t('farm-land-tax.export.landType'), value: results.landTypeName },
                    { label: t('farm-land-tax.export.farmType'), value: selectedFarmTypeData?.name || '' },
                  ]
                },
                {
                  title: t('farm-land-tax.export.results'),
                  data: [
                    { label: t('farm-land-tax.export.baseRate'), value: `${results.baseRate.toLocaleString()} ₸` },
                    { label: t('farm-land-tax.export.totalTax'), value: `${results.totalTax.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('farm-land-tax.export.footer')
            }}
            filename="farm-land-tax-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('farm-land-tax.faq.q1'), answer: t('farm-land-tax.faq.a1') },
          { question: t('farm-land-tax.faq.q2'), answer: t('farm-land-tax.faq.a2') },
          { question: t('farm-land-tax.faq.q3'), answer: t('farm-land-tax.faq.a3') },
          { question: t('farm-land-tax.faq.q4'), answer: t('farm-land-tax.faq.a4') },
          { question: t('farm-land-tax.faq.q5'), answer: t('farm-land-tax.faq.a5') }
        ]}
        sources={[
          { title: 'Земельный кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=1040583' },
          { title: 'Налоговый кодекс РК — земельный налог', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="farm-land-tax"
        calculatorTitle={t('farm-land-tax.title')}
      />
      <LastUpdated calculatorId="farm-land-tax" />
    </div>
  );
}
