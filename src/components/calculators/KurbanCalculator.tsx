import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Calculator, MapPin, Users, Scissors, Info, AlertTriangle, Star, Heart, Gift, Calendar, Banknote, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';

interface RegionalPrices {
  id: string;
  name: string;
  ramPrices: {
    small: { min: number; max: number; description: string };
    medium: { min: number; max: number; description: string };
    large: { min: number; max: number; description: string };
  };
  cowPricePerShare: number;
  additionalServices: {
    butchering: { min: number; max: number };
    delivery: { min: number; max: number };
    packaging: { min: number; max: number };
  };
  marketInfo: string;
}

interface AnimalRequirements {
  type: string;
  minAge: string;
  shares: number;
  description: string;
  requirements: string[];
}

export default function KurbanCalculator() {
  const { t } = useTranslation('calculators');

  const [region, setRegion] = useState<string>('almaty');
  const [animalType, setAnimalType] = useState<'ram-small' | 'ram-medium' | 'ram-large' | 'cow-share'>('ram-medium');
  const [familyShares, setFamilyShares] = useState<string>('1');
  const [additionalServices, setAdditionalServices] = useState<{
    butchering: boolean;
    delivery: boolean;
    packaging: boolean;
  }>({
    butchering: false,
    delivery: false,
    packaging: false
  });

  const [results, setResults] = useState({
    animalCost: { min: 0, max: 0 },
    servicesCost: { min: 0, max: 0 },
    totalCost: { min: 0, max: 0 },
    averageCost: 0,
    animalDescription: '',
    regionName: '',
    shares: 1,
    costPerShare: { min: 0, max: 0 },
    marketAdvice: '',
    recommendedBudget: 0
  });

  const KURBAN_DATE = t('kurban-sacrifice.date2025');
  const CURRENT_YEAR = 2026;

  const regionalPrices: RegionalPrices[] = [
    {
      id: 'almaty',
      name: t('kurban-sacrifice.regions.almaty'),
      ramPrices: {
        small: { min: 45000, max: 65000, description: t('kurban-sacrifice.ramSmallDesc') },
        medium: { min: 60000, max: 85000, description: t('kurban-sacrifice.ramMediumDesc') },
        large: { min: 80000, max: 120000, description: t('kurban-sacrifice.ramLargeDesc') }
      },
      cowPricePerShare: 65000,
      additionalServices: {
        butchering: { min: 8000, max: 12000 },
        delivery: { min: 3000, max: 5000 },
        packaging: { min: 2000, max: 3000 }
      },
      marketInfo: t('kurban-sacrifice.marketInfo.almaty')
    },
    {
      id: 'astana',
      name: t('kurban-sacrifice.regions.astana'),
      ramPrices: {
        small: { min: 42000, max: 62000, description: t('kurban-sacrifice.ramSmallDesc') },
        medium: { min: 58000, max: 82000, description: t('kurban-sacrifice.ramMediumDesc') },
        large: { min: 75000, max: 115000, description: t('kurban-sacrifice.ramLargeDesc') }
      },
      cowPricePerShare: 62000,
      additionalServices: {
        butchering: { min: 7000, max: 11000 },
        delivery: { min: 3000, max: 5000 },
        packaging: { min: 2000, max: 3000 }
      },
      marketInfo: t('kurban-sacrifice.marketInfo.astana')
    },
    {
      id: 'shymkent',
      name: t('kurban-sacrifice.regions.shymkent'),
      ramPrices: {
        small: { min: 38000, max: 55000, description: t('kurban-sacrifice.ramSmallDesc') },
        medium: { min: 52000, max: 75000, description: t('kurban-sacrifice.ramMediumDesc') },
        large: { min: 68000, max: 95000, description: t('kurban-sacrifice.ramLargeDesc') }
      },
      cowPricePerShare: 55000,
      additionalServices: {
        butchering: { min: 5000, max: 8000 },
        delivery: { min: 2000, max: 4000 },
        packaging: { min: 1500, max: 2500 }
      },
      marketInfo: t('kurban-sacrifice.marketInfo.shymkent')
    },
    {
      id: 'karaganda',
      name: t('kurban-sacrifice.regions.karaganda'),
      ramPrices: {
        small: { min: 40000, max: 58000, description: t('kurban-sacrifice.ramSmallDesc') },
        medium: { min: 55000, max: 78000, description: t('kurban-sacrifice.ramMediumDesc') },
        large: { min: 72000, max: 100000, description: t('kurban-sacrifice.ramLargeDesc') }
      },
      cowPricePerShare: 58000,
      additionalServices: {
        butchering: { min: 6000, max: 9000 },
        delivery: { min: 2500, max: 4500 },
        packaging: { min: 1500, max: 2500 }
      },
      marketInfo: t('kurban-sacrifice.marketInfo.karaganda')
    },
    {
      id: 'rural',
      name: t('kurban-sacrifice.regions.rural'),
      ramPrices: {
        small: { min: 30000, max: 45000, description: t('kurban-sacrifice.ramSmallDesc') },
        medium: { min: 42000, max: 65000, description: t('kurban-sacrifice.ramMediumDesc') },
        large: { min: 55000, max: 80000, description: t('kurban-sacrifice.ramLargeDesc') }
      },
      cowPricePerShare: 45000,
      additionalServices: {
        butchering: { min: 3000, max: 5000 },
        delivery: { min: 1000, max: 2000 },
        packaging: { min: 1000, max: 1500 }
      },
      marketInfo: t('kurban-sacrifice.marketInfo.rural')
    }
  ];

  const animalRequirements: AnimalRequirements[] = [
    {
      type: t('kurban-sacrifice.animalTypes.ram'),
      minAge: t('kurban-sacrifice.minAge.ram'),
      shares: 1,
      description: t('kurban-sacrifice.requirements.ramDesc'),
      requirements: [
        t('kurban-sacrifice.requirements.ramReq1'),
        t('kurban-sacrifice.requirements.ramReq2'),
        t('kurban-sacrifice.requirements.ramReq3'),
        t('kurban-sacrifice.requirements.ramReq4'),
        t('kurban-sacrifice.requirements.ramReq5')
      ]
    },
    {
      type: t('kurban-sacrifice.animalTypes.cow'),
      minAge: t('kurban-sacrifice.minAge.cow'),
      shares: 7,
      description: t('kurban-sacrifice.requirements.cowDesc'),
      requirements: [
        t('kurban-sacrifice.requirements.cowReq1'),
        t('kurban-sacrifice.requirements.cowReq2'),
        t('kurban-sacrifice.requirements.cowReq3'),
        t('kurban-sacrifice.requirements.cowReq4'),
        t('kurban-sacrifice.requirements.cowReq5')
      ]
    }
  ];

  const calculateKurbanCost = () => {
    const selectedRegion = regionalPrices.find(r => r.id === region);
    if (!selectedRegion) return;

    const shares = parseInt(familyShares) || 1;
    let animalCost = { min: 0, max: 0 };
    let animalDescription = '';
    let sharesCount = 1;

    if (animalType === 'cow-share') {
      const costPerShare = selectedRegion.cowPricePerShare;
      animalCost = { min: costPerShare * shares, max: costPerShare * shares };
      animalDescription = t('kurban-sacrifice.cowShareDesc', { count: shares });
      sharesCount = shares;
    } else {
      const ramSize = animalType.split('-')[1] as 'small' | 'medium' | 'large';
      const ramPrices = selectedRegion.ramPrices[ramSize];
      animalCost = { min: ramPrices.min * shares, max: ramPrices.max * shares };
      animalDescription = t('kurban-sacrifice.ramDesc', { desc: ramPrices.description, count: shares });
      sharesCount = shares;
    }

    let servicesCost = { min: 0, max: 0 };

    if (additionalServices.butchering) {
      servicesCost.min += selectedRegion.additionalServices.butchering.min * shares;
      servicesCost.max += selectedRegion.additionalServices.butchering.max * shares;
    }

    if (additionalServices.delivery) {
      servicesCost.min += selectedRegion.additionalServices.delivery.min;
      servicesCost.max += selectedRegion.additionalServices.delivery.max;
    }

    if (additionalServices.packaging) {
      servicesCost.min += selectedRegion.additionalServices.packaging.min * shares;
      servicesCost.max += selectedRegion.additionalServices.packaging.max * shares;
    }

    const totalCost = {
      min: animalCost.min + servicesCost.min,
      max: animalCost.max + servicesCost.max
    };

    const averageCost = (totalCost.min + totalCost.max) / 2;
    const costPerShare = animalType === 'cow-share' ?
      { min: selectedRegion.cowPricePerShare, max: selectedRegion.cowPricePerShare } :
      { min: animalCost.min / shares, max: animalCost.max / shares };

    const recommendedBudget = totalCost.max * 1.15;

    setResults({
      animalCost,
      servicesCost,
      totalCost,
      averageCost: Math.round(averageCost),
      animalDescription,
      regionName: selectedRegion.name,
      shares: sharesCount,
      costPerShare,
      marketAdvice: selectedRegion.marketInfo,
      recommendedBudget: Math.round(recommendedBudget)
    });
  };

  useEffect(() => {
    calculateKurbanCost();
  }, [region, animalType, familyShares, additionalServices]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatRange = (min: number, max: number) => {
    return `${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const selectedRegionData = regionalPrices.find(r => r.id === region);
  const selectedAnimalRequirement = animalType === 'cow-share' ? animalRequirements[1] : animalRequirements[0];

  const animalTypes = [
    {
      id: 'ram-small',
      name: t('kurban-sacrifice.animalSelection.ramSmall'),
      description: t('kurban-sacrifice.animalSelection.ramSmallDesc'),
      icon: '🐑',
      shares: 1,
      minAge: t('kurban-sacrifice.animalSelection.ramSmallAge')
    },
    {
      id: 'ram-medium',
      name: t('kurban-sacrifice.animalSelection.ramMedium'),
      description: t('kurban-sacrifice.animalSelection.ramMediumDesc'),
      icon: '🐏',
      shares: 1,
      minAge: t('kurban-sacrifice.animalSelection.ramMediumAge')
    },
    {
      id: 'ram-large',
      name: t('kurban-sacrifice.animalSelection.ramLarge'),
      description: t('kurban-sacrifice.animalSelection.ramLargeDesc'),
      icon: '🐃',
      shares: 1,
      minAge: t('kurban-sacrifice.animalSelection.ramLargeAge')
    },
    {
      id: 'cow-share',
      name: t('kurban-sacrifice.animalSelection.cowShare'),
      description: t('kurban-sacrifice.animalSelection.cowShareDesc'),
      icon: '🐄',
      shares: 7,
      minAge: t('kurban-sacrifice.animalSelection.cowShareAge')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('kurban-sacrifice.title')}</h1>
            <p className="text-gray-600">{t('kurban-sacrifice.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Star className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {t('kurban-sacrifice.holidayTitle', { year: CURRENT_YEAR })}
            </h3>
            <div className="text-red-800 space-y-2">
              <p>{t('kurban-sacrifice.holidayDesc1')}</p>
              <p>{t('kurban-sacrifice.holidayDesc2')}</p>
              <p className="text-sm">
                <strong>{t('kurban-sacrifice.dateLabel', { year: CURRENT_YEAR })}</strong> {KURBAN_DATE} •
                <strong>{t('kurban-sacrifice.periodLabel')}</strong> {t('kurban-sacrifice.periodValue')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="kurban-sacrifice" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.animalSelectionTitle')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('kurban-sacrifice.animalTypeLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {animalTypes.map((animal) => (
                    <button
                      key={animal.id}
                      onClick={() => setAnimalType(animal.id as any)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        animalType === animal.id
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">{animal.icon}</span>
                        <span className="font-medium text-sm">{animal.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{animal.description}</div>
                      <div className="text-xs text-gray-500">
                        {animal.shares === 1 ? t('kurban-sacrifice.forOneFamily') : t('kurban-sacrifice.upToFamilies', { count: animal.shares })} • {t('kurban-sacrifice.ageLabel')}: {animal.minAge}+
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  {animalType === 'cow-share' ? t('kurban-sacrifice.cowSharesLabel') : t('kurban-sacrifice.animalCountLabel')}
                </label>
                <RangeSlider
                  value={parseFloat(familyShares) || 1}
                  onChange={(val) => setFamilyShares(String(val))}
                  min={1}
                  max={animalType === 'cow-share' ? 7 : 10}
                  step={1}
                  formatValue={(v) => `${v}`}
                  color="#059669"
                />
                <input
                  type="number"
                  id="familyShares"
                  value={familyShares}
                  onChange={(e) => setFamilyShares(e.target.value)}
                  placeholder={animalType === 'cow-share' ? t('kurban-sacrifice.cowSharesPlaceholder') : t('kurban-sacrifice.animalCountPlaceholder')}
                  min="1"
                  max={animalType === 'cow-share' ? "7" : "10"}
                  className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {animalType === 'cow-share'
                    ? t('kurban-sacrifice.cowSharesHint')
                    : t('kurban-sacrifice.animalCountHint')
                  }
                </p>
              </div>

              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  {t('kurban-sacrifice.regionLabel')}
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                >
                  {regionalPrices.map((regionOption) => (
                    <option key={regionOption.id} value={regionOption.id}>
                      {regionOption.name}
                    </option>
                  ))}
                </select>
                {selectedRegionData && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRegionData.marketInfo}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.additionalServicesTitle')}</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Scissors className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t('kurban-sacrifice.services.butchering')}</div>
                    <div className="text-sm text-gray-600">{t('kurban-sacrifice.services.butcheringDesc')}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={additionalServices.butchering}
                  onChange={(e) => setAdditionalServices(prev => ({
                    ...prev,
                    butchering: e.target.checked
                  }))}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calculator className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t('kurban-sacrifice.services.delivery')}</div>
                    <div className="text-sm text-gray-600">{t('kurban-sacrifice.services.deliveryDesc')}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={additionalServices.delivery}
                  onChange={(e) => setAdditionalServices(prev => ({
                    ...prev,
                    delivery: e.target.checked
                  }))}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Gift className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t('kurban-sacrifice.services.packaging')}</div>
                    <div className="text-sm text-gray-600">{t('kurban-sacrifice.services.packagingDesc')}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={additionalServices.packaging}
                  onChange={(e) => setAdditionalServices(prev => ({
                    ...prev,
                    packaging: e.target.checked
                  }))}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-orange-900 mb-2">{t('kurban-sacrifice.servicesIn', { region: selectedRegionData?.name })}</h3>
                <div className="text-xs text-orange-800 space-y-1">
                  <div>• {t('kurban-sacrifice.services.butchering')}: {formatRange(selectedRegionData?.additionalServices.butchering.min || 0, selectedRegionData?.additionalServices.butchering.max || 0)}</div>
                  <div>• {t('kurban-sacrifice.services.delivery')}: {formatRange(selectedRegionData?.additionalServices.delivery.min || 0, selectedRegionData?.additionalServices.delivery.max || 0)}</div>
                  <div>• {t('kurban-sacrifice.services.packaging')}: {formatRange(selectedRegionData?.additionalServices.packaging.min || 0, selectedRegionData?.additionalServices.packaging.max || 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.costTitle')}</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{t('kurban-sacrifice.selectedAnimal')}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('kurban-sacrifice.type')}: <strong>{results.animalDescription}</strong></div>
                  <div>{t('kurban-sacrifice.region')}: <strong>{results.regionName}</strong></div>
                  <div>{t('kurban-sacrifice.forFamilies', { count: results.shares })}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-4">
                  <span className="font-medium text-red-900">{t('kurban-sacrifice.animalCost')}</span>
                  <span className="text-lg font-bold text-red-700">
                    {formatRange(results.animalCost.min, results.animalCost.max)}
                  </span>
                </div>

                {(results.servicesCost.min > 0 || results.servicesCost.max > 0) && (
                  <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-4">
                    <span className="font-medium text-orange-900">{t('kurban-sacrifice.additionalServicesCost')}</span>
                    <span className="text-lg font-bold text-orange-700">
                      {formatRange(results.servicesCost.min, results.servicesCost.max)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">{t('kurban-sacrifice.totalCost')}</span>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">
                      {formatRange(results.totalCost.min, results.totalCost.max)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {t('kurban-sacrifice.averageCost')}: {formatNumber(results.averageCost)}
                </div>
              </div>

              {results.shares > 1 && animalType === 'cow-share' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('kurban-sacrifice.costPerShare')}</h4>
                  <div className="text-blue-800">
                    <span className="text-lg font-bold">{formatNumber(results.costPerShare.min)}</span>
                    <span className="text-sm ml-2">{t('kurban-sacrifice.perFamily')}</span>
                  </div>
                </div>
              )}

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Banknote className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-teal-900 mb-1">{t('kurban-sacrifice.recommendedBudget')}</h4>
                    <div className="text-teal-800">
                      <span className="text-lg font-bold">{formatNumber(results.recommendedBudget)}</span>
                      <span className="text-sm ml-2">{t('kurban-sacrifice.with15Percent')}</span>
                    </div>
                    <p className="text-xs text-teal-700 mt-1">
                      {t('kurban-sacrifice.priceFluctuations')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900 mb-1">{t('kurban-sacrifice.marketSituation')}</h4>
                    <p className="text-amber-800 text-sm">{results.marketAdvice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.regionalComparison', { year: CURRENT_YEAR })}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('kurban-sacrifice.region')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('kurban-sacrifice.animalSelection.ramSmall')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('kurban-sacrifice.animalSelection.ramMedium')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('kurban-sacrifice.animalSelection.ramLarge')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('kurban-sacrifice.animalSelection.cowShare')}</th>
              </tr>
            </thead>
            <tbody>
              {regionalPrices.map((regionData) => (
                <tr key={regionData.id} className={`border-b border-gray-100 ${region === regionData.id ? 'bg-red-50' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{regionData.name}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    {formatRange(regionData.ramPrices.small.min, regionData.ramPrices.small.max)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    {formatRange(regionData.ramPrices.medium.min, regionData.ramPrices.medium.max)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    {formatRange(regionData.ramPrices.large.min, regionData.ramPrices.large.max)}
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-blue-600">
                    {formatNumber(regionData.cowPricePerShare)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('kurban-sacrifice.priceFactorsTitle')}</strong> {t('kurban-sacrifice.priceFactorsDesc')}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('kurban-sacrifice.requirementsTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {animalRequirements.map((animal, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{animal.type}</h4>
                  <div className="text-sm text-gray-700 mb-3">
                    <div><strong>{t('kurban-sacrifice.minAgeLabel')}:</strong> {animal.minAge}</div>
                    <div><strong>{t('kurban-sacrifice.sharesLabel')}:</strong> {animal.shares}</div>
                    <div><strong>{t('kurban-sacrifice.descriptionLabel')}:</strong> {animal.description}</div>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-medium text-gray-800 text-xs">{t('kurban-sacrifice.islamicRequirements')}</h5>
                    {animal.requirements.map((req, reqIndex) => (
                      <div key={reqIndex} className="text-xs text-gray-600">• {req}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.planningTitle')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.timing.purchaseTitle')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div><strong>{t('kurban-sacrifice.timing.inAdvance')}</strong> {t('kurban-sacrifice.timing.inAdvanceDesc')}</div>
              <div><strong>{t('kurban-sacrifice.timing.lowerPrices')}</strong> {t('kurban-sacrifice.timing.lowerPricesDesc')}</div>
              <div><strong>{t('kurban-sacrifice.timing.bestChoice')}</strong> {t('kurban-sacrifice.timing.bestChoiceDesc')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🕐</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.timing.sacrificeTitle')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div><strong>{t('kurban-sacrifice.timing.start')}</strong> {t('kurban-sacrifice.timing.startDesc')}</div>
              <div><strong>{t('kurban-sacrifice.timing.period')}</strong> {t('kurban-sacrifice.timing.periodDesc')}</div>
              <div><strong>{t('kurban-sacrifice.timing.bestTime')}</strong> {t('kurban-sacrifice.timing.bestTimeDesc')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.timing.distributionTitle')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div><strong>{t('kurban-sacrifice.timing.third1')}</strong> - {t('kurban-sacrifice.timing.third1Desc')}</div>
              <div><strong>{t('kurban-sacrifice.timing.third2')}</strong> - {t('kurban-sacrifice.timing.third2Desc')}</div>
              <div><strong>{t('kurban-sacrifice.timing.third3')}</strong> - {t('kurban-sacrifice.timing.third3Desc')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.marketFeaturesTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🐑 {t('kurban-sacrifice.marketFeatures.suppliersTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>{t('kurban-sacrifice.marketFeatures.south')}</strong> {t('kurban-sacrifice.marketFeatures.southDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.almaty')}</strong> {t('kurban-sacrifice.marketFeatures.almatyDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.zhambyl')}</strong> {t('kurban-sacrifice.marketFeatures.zhambylDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.turkestan')}</strong> {t('kurban-sacrifice.marketFeatures.turkestanDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.mangistau')}</strong> {t('kurban-sacrifice.marketFeatures.mangistauDesc')}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📈 {t('kurban-sacrifice.marketFeatures.trendsTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div><strong>{t('kurban-sacrifice.marketFeatures.monthBefore')}</strong> {t('kurban-sacrifice.marketFeatures.monthBeforeDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.weekBefore')}</strong> {t('kurban-sacrifice.marketFeatures.weekBeforeDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.dayOf')}</strong> {t('kurban-sacrifice.marketFeatures.dayOfDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.afterHoliday')}</strong> {t('kurban-sacrifice.marketFeatures.afterHolidayDesc')}</div>
              <div><strong>{t('kurban-sacrifice.marketFeatures.regionalDiff')}</strong> {t('kurban-sacrifice.marketFeatures.regionalDiffDesc')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Heart className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('kurban-sacrifice.spiritualTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.spiritual.principlesTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>{t('kurban-sacrifice.spiritual.principle1')}</strong> - {t('kurban-sacrifice.spiritual.principle1Desc')}</li>
                  <li><strong>{t('kurban-sacrifice.spiritual.principle2')}</strong> {t('kurban-sacrifice.spiritual.principle2Desc')}</li>
                  <li><strong>{t('kurban-sacrifice.spiritual.principle3')}</strong> {t('kurban-sacrifice.spiritual.principle3Desc')}</li>
                  <li><strong>{t('kurban-sacrifice.spiritual.principle4')}</strong> {t('kurban-sacrifice.spiritual.principle4Desc')}</li>
                  <li><strong>{t('kurban-sacrifice.spiritual.principle5')}</strong> {t('kurban-sacrifice.spiritual.principle5Desc')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.spiritual.conditionsTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('kurban-sacrifice.spiritual.condition1')}</li>
                  <li>{t('kurban-sacrifice.spiritual.condition2')}</li>
                  <li>{t('kurban-sacrifice.spiritual.condition3')}</li>
                  <li>{t('kurban-sacrifice.spiritual.condition4')}</li>
                  <li>{t('kurban-sacrifice.spiritual.condition5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Star className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('kurban-sacrifice.hadithTitle')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('kurban-sacrifice.hadithText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.practicalTitle')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.practical.purchaseTitle')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>• {t('kurban-sacrifice.practical.purchaseTip1')}</div>
              <div>• {t('kurban-sacrifice.practical.purchaseTip2')}</div>
              <div>• {t('kurban-sacrifice.practical.purchaseTip3')}</div>
              <div>• {t('kurban-sacrifice.practical.purchaseTip4')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔪</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.practical.sacrificeTitle')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>• {t('kurban-sacrifice.practical.sacrificeTip1')}</div>
              <div>• {t('kurban-sacrifice.practical.sacrificeTip2')}</div>
              <div>• {t('kurban-sacrifice.practical.sacrificeTip3')}</div>
              <div>• {t('kurban-sacrifice.practical.sacrificeTip4')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍖</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.practical.distributionTitle')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>• {t('kurban-sacrifice.practical.distributionTip1')}</div>
              <div>• {t('kurban-sacrifice.practical.distributionTip2')}</div>
              <div>• {t('kurban-sacrifice.practical.distributionTip3')}</div>
              <div>• {t('kurban-sacrifice.practical.distributionTip4')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.budgetExamplesTitle')}</h2>

        <div className="space-y-6">
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('kurban-sacrifice.examples.example1Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('kurban-sacrifice.examples.parameters')}</div>
                <div>{t('kurban-sacrifice.examples.ex1Param1')}</div>
                <div>{t('kurban-sacrifice.examples.ex1Param2')}</div>
                <div>{t('kurban-sacrifice.examples.ex1Param3')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('kurban-sacrifice.examples.calculation')}</div>
                <div>{t('kurban-sacrifice.examples.ex1Calc1')}</div>
                <div>{t('kurban-sacrifice.examples.ex1Calc2')}</div>
                <div>{t('kurban-sacrifice.examples.ex1Calc3')}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('kurban-sacrifice.examples.budget')}</div>
                <div className="text-lg font-bold text-blue-600">{t('kurban-sacrifice.examples.ex1Budget')}</div>
                <div className="text-xs text-blue-600">{t('kurban-sacrifice.examples.ex1Recommended')}</div>
              </div>
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('kurban-sacrifice.examples.example2Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('kurban-sacrifice.examples.parameters')}</div>
                <div>{t('kurban-sacrifice.examples.ex2Param1')}</div>
                <div>{t('kurban-sacrifice.examples.ex2Param2')}</div>
                <div>{t('kurban-sacrifice.examples.ex2Param3')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('kurban-sacrifice.examples.calculation')}</div>
                <div>{t('kurban-sacrifice.examples.ex2Calc1')}</div>
                <div>{t('kurban-sacrifice.examples.ex2Calc2')}</div>
                <div>{t('kurban-sacrifice.examples.ex2Calc3')}</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('kurban-sacrifice.examples.perFamily')}</div>
                <div className="text-lg font-bold text-green-600">{t('kurban-sacrifice.examples.ex2Budget')}</div>
                <div className="text-xs text-green-600">{t('kurban-sacrifice.examples.ex2Savings')}</div>
              </div>
            </div>
          </div>

          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-3">{t('kurban-sacrifice.examples.example3Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('kurban-sacrifice.examples.parameters')}</div>
                <div>{t('kurban-sacrifice.examples.ex3Param1')}</div>
                <div>{t('kurban-sacrifice.examples.ex3Param2')}</div>
                <div>{t('kurban-sacrifice.examples.ex3Param3')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('kurban-sacrifice.examples.advantages')}</div>
                <div>{t('kurban-sacrifice.examples.ex3Adv1')}</div>
                <div>{t('kurban-sacrifice.examples.ex3Adv2')}</div>
                <div>{t('kurban-sacrifice.examples.ex3Adv3')}</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('kurban-sacrifice.examples.budget')}</div>
                <div className="text-lg font-bold text-teal-600">{t('kurban-sacrifice.examples.ex3Budget')}</div>
                <div className="text-xs text-teal-600">{t('kurban-sacrifice.examples.ex3MostAffordable')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('kurban-sacrifice.importantInfoTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.importantInfo.islamicTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('kurban-sacrifice.importantInfo.islamic1')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.islamic2')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.islamic3')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.islamic4')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.islamic5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.importantInfo.practicalTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('kurban-sacrifice.importantInfo.practical1')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.practical2')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.practical3')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.practical4')}</li>
                  <li>{t('kurban-sacrifice.importantInfo.practical5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Crown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900 mb-1">
                {t('kurban-sacrifice.kazakhstanTitle')}
              </h3>
              <p className="text-red-800 text-sm">
                {t('kurban-sacrifice.kazakhstanDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.savingTipsTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">💡 {t('kurban-sacrifice.savingTips.waysTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.way1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.way2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.way3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.way4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">⚠️ {t('kurban-sacrifice.savingTips.avoidTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.avoid1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.avoid2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.avoid3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('kurban-sacrifice.savingTips.avoid4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.historyTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">📖 {t('kurban-sacrifice.history.quranicTitle')}</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                <strong>{t('kurban-sacrifice.history.trial')}</strong> {t('kurban-sacrifice.history.trialDesc')}
              </p>
              <p>
                <strong>{t('kurban-sacrifice.history.obedience')}</strong> {t('kurban-sacrifice.history.obedienceDesc')}
              </p>
              <p>
                <strong>{t('kurban-sacrifice.history.mercy')}</strong> {t('kurban-sacrifice.history.mercyDesc')}
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">🕌 {t('kurban-sacrifice.history.traditionsTitle')}</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>
                <strong>{t('kurban-sacrifice.history.regional')}</strong> {t('kurban-sacrifice.history.regionalDesc')}
              </p>
              <p>
                <strong>{t('kurban-sacrifice.history.government')}</strong> {t('kurban-sacrifice.history.governmentDesc')}
              </p>
              <p>
                <strong>{t('kurban-sacrifice.history.social')}</strong> {t('kurban-sacrifice.history.socialDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.priceCalendarTitle')}</h2>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700 mb-1">-25%</div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('kurban-sacrifice.priceCalendar.monthBefore')}</h3>
            <p className="text-gray-600 text-xs">{t('kurban-sacrifice.priceCalendar.monthBeforeDesc')}</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700 mb-1">-15%</div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('kurban-sacrifice.priceCalendar.twoWeeks')}</h3>
            <p className="text-gray-600 text-xs">{t('kurban-sacrifice.priceCalendar.twoWeeksDesc')}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-700 mb-1">+20%</div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('kurban-sacrifice.priceCalendar.oneWeek')}</h3>
            <p className="text-gray-600 text-xs">{t('kurban-sacrifice.priceCalendar.oneWeekDesc')}</p>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700 mb-1">+40%</div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('kurban-sacrifice.priceCalendar.holiday')}</h3>
            <p className="text-gray-600 text-xs">{t('kurban-sacrifice.priceCalendar.holidayDesc')}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('kurban-sacrifice.optimalStrategyTitle')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('kurban-sacrifice.optimalStrategyDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.collectiveTitle')}</h2>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">✅ {t('kurban-sacrifice.collective.advantagesTitle')}</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• {t('kurban-sacrifice.collective.advantage1')}</div>
                <div>• {t('kurban-sacrifice.collective.advantage2')}</div>
                <div>• {t('kurban-sacrifice.collective.advantage3')}</div>
                <div>• {t('kurban-sacrifice.collective.advantage4')}</div>
                <div>• {t('kurban-sacrifice.collective.advantage5')}</div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-3">⚠️ {t('kurban-sacrifice.collective.importantTitle')}</h3>
              <div className="text-sm text-amber-800 space-y-1">
                <div>• {t('kurban-sacrifice.collective.important1')}</div>
                <div>• {t('kurban-sacrifice.collective.important2')}</div>
                <div>• {t('kurban-sacrifice.collective.important3')}</div>
                <div>• {t('kurban-sacrifice.collective.important4')}</div>
                <div>• {t('kurban-sacrifice.collective.important5')}</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">📋 {t('kurban-sacrifice.collective.checklistTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <h4 className="font-medium mb-2">{t('kurban-sacrifice.collective.preparationTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('kurban-sacrifice.collective.prep1')}</li>
                  <li>{t('kurban-sacrifice.collective.prep2')}</li>
                  <li>{t('kurban-sacrifice.collective.prep3')}</li>
                  <li>{t('kurban-sacrifice.collective.prep4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('kurban-sacrifice.collective.executionTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('kurban-sacrifice.collective.exec1')}</li>
                  <li>{t('kurban-sacrifice.collective.exec2')}</li>
                  <li>{t('kurban-sacrifice.collective.exec3')}</li>
                  <li>{t('kurban-sacrifice.collective.exec4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.charityTitle')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.charity.needyTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('kurban-sacrifice.charity.needyDesc')}
            </p>
          </div>

          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.charity.communityTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('kurban-sacrifice.charity.communityDesc')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('kurban-sacrifice.charity.familyTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('kurban-sacrifice.charity.familyDesc')}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('kurban-sacrifice.modernCharityTitle')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('kurban-sacrifice.modernCharityDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kurban-sacrifice.financialPlanningTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">💰 {t('kurban-sacrifice.financialPlanning.yearlyTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-900">{t('kurban-sacrifice.financialPlanning.monthly')}</div>
                <div>{t('kurban-sacrifice.financialPlanning.monthlyCalc')}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-gray-900">{t('kurban-sacrifice.financialPlanning.withMargin')}</div>
                <div>{t('kurban-sacrifice.financialPlanning.withMarginCalc')}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-900">{t('kurban-sacrifice.financialPlanning.collective')}</div>
                <div>{t('kurban-sacrifice.financialPlanning.collectiveCalc')}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📊 {t('kurban-sacrifice.financialPlanning.structureTitle')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 px-3 bg-red-50 rounded">
                <span className="text-red-800">{t('kurban-sacrifice.financialPlanning.animalCost')}</span>
                <span className="font-bold text-red-700">75-85%</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-orange-50 rounded">
                <span className="text-orange-800">{t('kurban-sacrifice.financialPlanning.butcherCost')}</span>
                <span className="font-bold text-orange-700">10-15%</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-blue-50 rounded">
                <span className="text-blue-800">{t('kurban-sacrifice.financialPlanning.transportCost')}</span>
                <span className="font-bold text-blue-700">3-7%</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-teal-50 rounded">
                <span className="text-teal-800">{t('kurban-sacrifice.financialPlanning.packagingCost')}</span>
                <span className="font-bold text-teal-700">2-3%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Heart className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-teal-900 mb-1">
                {t('kurban-sacrifice.spiritualRewardsTitle')}
              </h3>
              <p className="text-teal-800 text-sm">
                {t('kurban-sacrifice.spiritualRewardsDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      {results && results.totalCost > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Курбан', value: results.totalCost },
            ]}
            title="Стоимость Курбан"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalCost > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт Курбан',
              subtitle: `Регион: ${region}`,
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Регион', value: region },
                    { label: 'Тип животного', value: results.animalType },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Стоимость', value: `${results.totalCost.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="kurban-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="kurban" />
      <FAQSection
        items={[
          { question: t('kurban-sacrifice.faq.q1'), answer: t('kurban-sacrifice.faq.a1') },
          { question: t('kurban-sacrifice.faq.q2'), answer: t('kurban-sacrifice.faq.a2') },
          { question: t('kurban-sacrifice.faq.q3'), answer: t('kurban-sacrifice.faq.a3') },
          { question: t('kurban-sacrifice.faq.q4'), answer: t('kurban-sacrifice.faq.a4') },
          { question: t('kurban-sacrifice.faq.q5'), answer: t('kurban-sacrifice.faq.a5') }
        ]}
        sources={[
          { title: 'ДУМК — Курбан-айт', url: 'https://muftyat.kz/' },
          { title: 'Islamic Relief — Курбан', url: 'https://islamic-relief.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="religious" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="kurban"
        calculatorTitle="Калькулятор Курбана"
      />
      <LastUpdated calculatorId="kurban-sacrifice" />
    </div>
  );
}
