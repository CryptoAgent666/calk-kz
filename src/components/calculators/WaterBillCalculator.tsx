import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Calculator, MapPin, Users, Info, AlertTriangle, TrendingUp, Waves, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

interface TariffTier {
  min: number;
  max: number;
  rate: number;
  descriptionKey: string;
}

interface CityTariff {
  id: string;
  nameKey: string;
  coldWaterTiers: TariffTier[];
  sewerageRate: number;
}

export default function WaterBillCalculator() {
  const { t } = useTranslation('calculators');
  const [city, setCity] = useState<string>('almaty');
  const [waterConsumption, setWaterConsumption] = useState<string>('5');
  const [residentsCount, setResidentsCount] = useState<string>('1');

  const [results, setResults] = useState({
    coldWaterAmount: 0,
    sewerageAmount: 0,
    totalAmount: 0,
    consumptionPerPerson: 0,
    breakdown: [] as Array<{tier: number, volume: number, rate: number, amount: number, descriptionKey: string}>,
    averageRate: 0,
    recommendationKey: ''
  });

  const cityTariffs: CityTariff[] = [
    {
      id: 'almaty',
      nameKey: 'calculators:water.cityAlmaty',
      coldWaterTiers: [
        { min: 0, max: 3, rate: 103.00, descriptionKey: 'calculators:water.tierUpTo3' },
        { min: 3, max: 5, rate: 123.60, descriptionKey: 'calculators:water.tier3To5' },
        { min: 5, max: 10, rate: 154.49, descriptionKey: 'calculators:water.tier5To10' },
        { min: 10, max: Infinity, rate: 205.99, descriptionKey: 'calculators:water.tierAbove10' }
      ],
      sewerageRate: 51.50
    },
    {
      id: 'astana',
      nameKey: 'calculators:water.cityAstana',
      coldWaterTiers: [
        { min: 0, max: 3, rate: 98.50, descriptionKey: 'calculators:water.tierUpTo3' },
        { min: 3, max: 5, rate: 118.20, descriptionKey: 'calculators:water.tier3To5' },
        { min: 5, max: 10, rate: 147.75, descriptionKey: 'calculators:water.tier5To10' },
        { min: 10, max: Infinity, rate: 197.00, descriptionKey: 'calculators:water.tierAbove10' }
      ],
      sewerageRate: 49.25
    },
    {
      id: 'shymkent',
      nameKey: 'calculators:water.cityShymkent',
      coldWaterTiers: [
        { min: 0, max: 3, rate: 89.40, descriptionKey: 'calculators:water.tierUpTo3' },
        { min: 3, max: 5, rate: 107.28, descriptionKey: 'calculators:water.tier3To5' },
        { min: 5, max: 10, rate: 134.10, descriptionKey: 'calculators:water.tier5To10' },
        { min: 10, max: Infinity, rate: 178.80, descriptionKey: 'calculators:water.tierAbove10' }
      ],
      sewerageRate: 44.70
    },
    {
      id: 'other',
      nameKey: 'calculators:water.otherRegions',
      coldWaterTiers: [
        { min: 0, max: 3, rate: 85.20, descriptionKey: 'calculators:water.tierUpTo3' },
        { min: 3, max: 5, rate: 102.24, descriptionKey: 'calculators:water.tier3To5' },
        { min: 5, max: 10, rate: 127.80, descriptionKey: 'calculators:water.tier5To10' },
        { min: 10, max: Infinity, rate: 170.40, descriptionKey: 'calculators:water.tierAbove10' }
      ],
      sewerageRate: 42.60
    }
  ];

  const calculateWaterBill = () => {
    const totalConsumption = parseFloat(waterConsumption) || 0;
    const residents = parseInt(residentsCount) || 1;

    if (totalConsumption <= 0 || residents <= 0) {
      setResults({
        coldWaterAmount: 0, sewerageAmount: 0, totalAmount: 0,
        consumptionPerPerson: 0, breakdown: [], averageRate: 0, recommendationKey: ''
      });
      return;
    }

    const selectedCity = cityTariffs.find(c => c.id === city);
    if (!selectedCity) return;

    const consumptionPerPerson = totalConsumption / residents;
    const tariffs = selectedCity.coldWaterTiers;

    let coldWaterAmount = 0;
    let remainingConsumptionPerPerson = consumptionPerPerson;
    const breakdown = [];

    for (let i = 0; i < tariffs.length; i++) {
      const tariff = tariffs[i];

      if (remainingConsumptionPerPerson <= 0) break;

      const tierMax = tariff.max === Infinity ? remainingConsumptionPerPerson : Math.min(tariff.max - tariff.min, remainingConsumptionPerPerson);
      const tierConsumptionPerPerson = Math.min(tierMax, remainingConsumptionPerPerson);

      if (tierConsumptionPerPerson > 0) {
        const tierVolumeTotal = tierConsumptionPerPerson * residents;
        const tierAmount = tierVolumeTotal * tariff.rate;
        coldWaterAmount += tierAmount;

        breakdown.push({
          tier: i + 1,
          volume: tierVolumeTotal,
          rate: tariff.rate,
          amount: tierAmount,
          descriptionKey: tariff.descriptionKey
        });

        remainingConsumptionPerPerson -= tierConsumptionPerPerson;
      }
    }

    const sewerageAmount = totalConsumption * selectedCity.sewerageRate;

    const totalAmount = coldWaterAmount + sewerageAmount;
    const averageRate = totalAmount / totalConsumption;

    let recommendationKey = '';
    if (consumptionPerPerson > 10) {
      recommendationKey = 'calculators:water.recommendationVeryHigh';
    } else if (consumptionPerPerson > 5) {
      recommendationKey = 'calculators:water.recommendationHigh';
    } else if (consumptionPerPerson < 2) {
      recommendationKey = 'calculators:water.recommendationLow';
    } else {
      recommendationKey = 'calculators:water.recommendationNormal';
    }

    setResults({
      coldWaterAmount: Math.round(coldWaterAmount),
      sewerageAmount: Math.round(sewerageAmount),
      totalAmount: Math.round(totalAmount),
      consumptionPerPerson: Number(consumptionPerPerson.toFixed(2)),
      breakdown,
      averageRate: Number(averageRate.toFixed(2)),
      recommendationKey
    });
  };

  useEffect(() => {
    calculateWaterBill();
  }, [city, waterConsumption, residentsCount]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₸';
  };

  const formatRate = (rate: number) => {
    return rate.toFixed(2) + ' ₸/м³';
  };

  const selectedCityData = cityTariffs.find(c => c.id === city);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('water.heading')}</h1>
            <p className="text-gray-600">{t('water.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('water.consumptionParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('water.cityRegion')}
              </label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {cityTariffs.map((cityOption) => (
                  <option key={cityOption.id} value={cityOption.id}>
                    {t(cityOption.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('water.coldWaterVolume')}
              </label>
              <RangeSlider
                value={parseFloat(waterConsumption) || 0}
                onChange={(val) => setWaterConsumption(String(val))}
                min={0}
                max={50}
                step={0.5}
                formatValue={(v) => `${v} м³`}
                color="#0ea5e9"
              />
              <input
                type="number"
                id="waterConsumption"
                value={waterConsumption}
                onChange={(e) => setWaterConsumption(e.target.value)}
                placeholder={t('water.enterConsumption')}
                step="0.1"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="residentsCount" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                {t('water.residentsCount')}
              </label>
              <input
                type="number"
                id="residentsCount"
                value={residentsCount}
                onChange={(e) => setResidentsCount(e.target.value)}
                placeholder={t('water.residentsPlaceholder')}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                {t('water.tariffsFor')} {selectedCityData ? t(selectedCityData.nameKey) : ''}:
              </h3>
              <div className="space-y-1 text-xs text-blue-800">
                {selectedCityData?.coldWaterTiers.map((tariff, index) => (
                  <div key={index}>
                    • {t(tariff.descriptionKey)}: <strong>{formatRate(tariff.rate)}</strong>
                  </div>
                ))}
                <div className="mt-2">
                  • {t('water.sewerage')}: <strong>{formatRate(selectedCityData?.sewerageRate || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('water.billCalculation')}</h2>

          <div className="space-y-6">
            {waterConsumption && residentsCount && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{t('water.consumptionIndicators')}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('water.totalConsumption')}: <strong>{waterConsumption} м³</strong></div>
                  <div>{t('water.consumptionPerPerson')}: <strong>{results.consumptionPerPerson} м³</strong></div>
                  <div>{t('water.numberOfResidents')}: <strong>{residentsCount} {t('water.people')}</strong></div>
                </div>
              </div>
            )}

            {/* Диаграмма распределения */}
            {results.totalAmount > 0 && (
              <TaxPieChart
                data={[
                  { name: t('water.coldWater'), value: results.coldWaterAmount },
                  { name: t('water.sewerage'), value: results.sewerageAmount },
                ]}
                title={t('water.paymentStructure')}
              />
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                <div>
                  <span className="font-medium text-blue-900">{t('water.coldWater')}</span>
                  <div className="text-xs text-blue-600">{t('water.differentiatedTariffs')}</div>
                </div>
                <span className="text-lg font-bold text-blue-700">{formatNumber(results.coldWaterAmount)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-cyan-50 rounded-lg px-4">
                <div>
                  <span className="font-medium text-cyan-900">{t('water.sewerageService')}</span>
                  <div className="text-xs text-cyan-600">{results.totalAmount > 0 ? formatRate(selectedCityData?.sewerageRate || 0) : ''}</div>
                </div>
                <span className="text-lg font-bold text-cyan-700">{formatNumber(results.sewerageAmount)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('water.totalPayment')}</span>
                <div className="flex items-center space-x-2">
                  <Waves className="w-6 h-6 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-700">{formatNumber(results.totalAmount)}</span>
                </div>
              </div>
              {waterConsumption && parseFloat(waterConsumption) > 0 && (
                <div className="text-sm text-gray-600">
                  {t('water.averageTariff')}: {formatRate(results.averageRate)} {t('water.forVolume')} {waterConsumption} м³
                </div>
              )}
            </div>

            {results.breakdown.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{t('water.detailedBreakdown')}</h3>
                <div className="space-y-3">
                  {results.breakdown.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {t('water.tierLevel')} {item.tier}: {t(item.descriptionKey)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.volume.toFixed(1)} м³ × {formatRate(item.rate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{formatNumber(item.amount)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.recommendationKey && (
              <div className={`rounded-lg p-4 ${
                results.consumptionPerPerson > 10 ? 'bg-red-50 border border-red-200' :
                results.consumptionPerPerson > 5 ? 'bg-amber-50 border border-amber-200' :
                results.consumptionPerPerson < 2 ? 'bg-green-50 border border-green-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    results.consumptionPerPerson > 10 ? 'text-red-600' :
                    results.consumptionPerPerson > 5 ? 'text-amber-600' :
                    results.consumptionPerPerson < 2 ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h3 className={`font-medium mb-1 ${
                      results.consumptionPerPerson > 10 ? 'text-red-900' :
                      results.consumptionPerPerson > 5 ? 'text-amber-900' :
                      results.consumptionPerPerson < 2 ? 'text-green-900' :
                      'text-blue-900'
                    }`}>
                      {t('water.waterConsumptionAssessment')}
                    </h3>
                    <p className={`text-sm ${
                      results.consumptionPerPerson > 10 ? 'text-red-800' :
                      results.consumptionPerPerson > 5 ? 'text-amber-800' :
                      results.consumptionPerPerson < 2 ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {t(results.recommendationKey)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Экспорт результатов */}
            {results.totalAmount > 0 && (
              <ExportButtons
                data={{
                  title: t('water.waterPaymentCalculation'),
                  subtitle: selectedCityData ? t(selectedCityData.nameKey) : '',
                  sections: [
                    {
                      title: t('water.calculationParameters'),
                      data: [
                        { label: t('water.waterConsumption'), value: `${waterConsumption} м³` },
                        { label: t('water.residentsCount'), value: residentsCount },
                      ]
                    },
                    {
                      title: t('water.results'),
                      data: [
                        { label: t('water.coldWater'), value: formatNumber(results.coldWaterAmount) },
                        { label: t('water.sewerage'), value: formatNumber(results.sewerageAmount) },
                        { label: t('water.total'), value: formatNumber(results.totalAmount) },
                      ]
                    }
                  ],
                  footer: t('water.calculatedOn')
                }}
                filename="water-bill-calculation"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('water.tariffComparison')} ({t('water.year2026')})</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('water.city')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.upTo3PerPerson')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.from3To5PerPerson')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.from5To10PerPerson')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.above10PerPerson')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.sewerageLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {cityTariffs.filter(city => city.id !== 'other').map((cityData) => (
                <tr key={cityData.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{t(cityData.nameKey)}</td>
                  <td className="py-3 px-4 text-center text-sm">{formatRate(cityData.coldWaterTiers[0].rate)}</td>
                  <td className="py-3 px-4 text-center text-sm">{formatRate(cityData.coldWaterTiers[1].rate)}</td>
                  <td className="py-3 px-4 text-center text-sm">{formatRate(cityData.coldWaterTiers[2].rate)}</td>
                  <td className="py-3 px-4 text-center text-sm">{formatRate(cityData.coldWaterTiers[3].rate)}</td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-cyan-600">{formatRate(cityData.sewerageRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('water.differentiatedTariffPrinciple')}
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• {t('water.principle1')}</p>
                <p>• {t('water.principle2')}</p>
                <p>• {t('water.principle3')}</p>
                <p>• {t('water.principle4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('water.faq.q1'), answer: t('water.faq.a1') },
          { question: t('water.faq.q2'), answer: t('water.faq.a2') },
          { question: t('water.faq.q3'), answer: t('water.faq.a3') },
          { question: t('water.faq.q4'), answer: t('water.faq.a4') },
          { question: t('water.faq.q5'), answer: t('water.faq.a5') }
        ]}
        sources={[
          { title: 'Алматы Су', url: 'https://almatysu.kz/' },
          { title: 'Астана Су Арнасы', url: 'https://astana-su.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="water-bill"
        calculatorTitle="Калькулятор воды"
      />
    </div>
  );
}
