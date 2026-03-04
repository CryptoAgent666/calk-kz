import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Calculator, MapPin, Home, Info, AlertTriangle, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
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
  electricStove: TariffTier[];
  gasStove: TariffTier[];
}

export default function ElectricityBillCalculator() {
  const { t } = useTranslation('calculators');
  const [city, setCity] = useState<string>('astana');
  const [consumption, setConsumption] = useState<string>('');
  const [stoveType, setStoveType] = useState<'electric' | 'gas'>('electric');

  const [results, setResults] = useState({
    totalAmount: 0,
    breakdown: [] as Array<{tier: number, consumption: number, rate: number, amount: number, descriptionKey: string}>,
    averageRate: 0,
    recommendationKey: ''
  });

  const cityTariffs: CityTariff[] = [
    {
      id: 'astana',
      nameKey: 'calculators:electricity.cityAstana',
      electricStove: [
        { min: 0, max: 90, rate: 19.75, descriptionKey: 'calculators:electricity.tier1Electric90' },
        { min: 90, max: 180, rate: 29.38, descriptionKey: 'calculators:electricity.tier2Electric90_180' },
        { min: 180, max: Infinity, rate: 36.72, descriptionKey: 'calculators:electricity.tier3Electric180' }
      ],
      gasStove: [
        { min: 0, max: 70, rate: 19.75, descriptionKey: 'calculators:electricity.tier1Gas70' },
        { min: 70, max: 140, rate: 29.38, descriptionKey: 'calculators:electricity.tier2Gas70_140' },
        { min: 140, max: Infinity, rate: 36.72, descriptionKey: 'calculators:electricity.tier3Gas140' }
      ]
    },
    {
      id: 'almaty',
      nameKey: 'calculators:electricity.cityAlmaty',
      electricStove: [
        { min: 0, max: 100, rate: 18.92, descriptionKey: 'calculators:electricity.tier1Electric100' },
        { min: 100, max: 200, rate: 28.15, descriptionKey: 'calculators:electricity.tier2Electric100_200' },
        { min: 200, max: Infinity, rate: 35.18, descriptionKey: 'calculators:electricity.tier3Electric200' }
      ],
      gasStove: [
        { min: 0, max: 80, rate: 18.92, descriptionKey: 'calculators:electricity.tier1Gas80' },
        { min: 80, max: 160, rate: 28.15, descriptionKey: 'calculators:electricity.tier2Gas80_160' },
        { min: 160, max: Infinity, rate: 35.18, descriptionKey: 'calculators:electricity.tier3Gas160' }
      ]
    },
    {
      id: 'shymkent',
      nameKey: 'calculators:electricity.cityShymkent',
      electricStove: [
        { min: 0, max: 85, rate: 17.64, descriptionKey: 'calculators:electricity.tier1Electric85' },
        { min: 85, max: 170, rate: 26.46, descriptionKey: 'calculators:electricity.tier2Electric85_170' },
        { min: 170, max: Infinity, rate: 33.08, descriptionKey: 'calculators:electricity.tier3Electric170' }
      ],
      gasStove: [
        { min: 0, max: 65, rate: 17.64, descriptionKey: 'calculators:electricity.tier1Gas65' },
        { min: 65, max: 130, rate: 26.46, descriptionKey: 'calculators:electricity.tier2Gas65_130' },
        { min: 130, max: Infinity, rate: 33.08, descriptionKey: 'calculators:electricity.tier3Gas130' }
      ]
    },
    {
      id: 'other',
      nameKey: 'calculators:electricity.otherRegions',
      electricStove: [
        { min: 0, max: 75, rate: 16.85, descriptionKey: 'calculators:electricity.tier1Electric75' },
        { min: 75, max: 150, rate: 25.28, descriptionKey: 'calculators:electricity.tier2Electric75_150' },
        { min: 150, max: Infinity, rate: 31.60, descriptionKey: 'calculators:electricity.tier3Electric150' }
      ],
      gasStove: [
        { min: 0, max: 60, rate: 16.85, descriptionKey: 'calculators:electricity.tier1Gas60' },
        { min: 60, max: 120, rate: 25.28, descriptionKey: 'calculators:electricity.tier2Gas60_120' },
        { min: 120, max: Infinity, rate: 31.60, descriptionKey: 'calculators:electricity.tier3Gas120' }
      ]
    }
  ];

  const calculateElectricityBill = () => {
    const kwhConsumed = parseFloat(consumption) || 0;

    if (kwhConsumed <= 0) {
      setResults({
        totalAmount: 0, breakdown: [], averageRate: 0, recommendationKey: ''
      });
      return;
    }

    const selectedCity = cityTariffs.find(c => c.id === city);
    if (!selectedCity) return;

    const tariffs = stoveType === 'electric' ? selectedCity.electricStove : selectedCity.gasStove;

    let totalAmount = 0;
    let remainingConsumption = kwhConsumed;
    const breakdown = [];

    for (let i = 0; i < tariffs.length; i++) {
      const tariff = tariffs[i];

      if (remainingConsumption <= 0) break;

      const tierMax = tariff.max === Infinity ? remainingConsumption : Math.min(tariff.max - tariff.min, remainingConsumption);
      const tierConsumption = Math.min(tierMax, remainingConsumption);

      if (tierConsumption > 0) {
        const tierAmount = tierConsumption * tariff.rate;
        totalAmount += tierAmount;

        breakdown.push({
          tier: i + 1,
          consumption: tierConsumption,
          rate: tariff.rate,
          amount: tierAmount,
          descriptionKey: tariff.descriptionKey
        });

        remainingConsumption -= tierConsumption;
      }
    }

    const averageRate = totalAmount / kwhConsumed;

    let recommendationKey = '';
    if (kwhConsumed > 200) {
      recommendationKey = 'calculators:electricity.recommendationHigh';
    } else if (kwhConsumed > 150) {
      recommendationKey = 'calculators:electricity.recommendationAboveAverage';
    } else if (kwhConsumed < 50) {
      recommendationKey = 'calculators:electricity.recommendationLow';
    } else {
      recommendationKey = 'calculators:electricity.recommendationModerate';
    }

    setResults({
      totalAmount: Math.round(totalAmount),
      breakdown,
      averageRate: Number(averageRate.toFixed(2)),
      recommendationKey
    });
  };

  useEffect(() => {
    calculateElectricityBill();
  }, [city, consumption, stoveType]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₸';
  };

  const formatRate = (rate: number) => {
    return rate.toFixed(2) + ' ₸/кВт·ч';
  };

  const selectedCityData = cityTariffs.find(c => c.id === city);
  const currentTariffs = selectedCityData ? (stoveType === 'electric' ? selectedCityData.electricStove : selectedCityData.gasStove) : [];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('electricity.heading')}</h1>
            <p className="text-gray-600">{t('electricity.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('electricity.consumptionParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('electricity.cityRegion')}
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
                {t('electricity.consumptionVolume')}
              </label>
              <RangeSlider
                value={parseFloat(consumption) || 0}
                onChange={(val) => setConsumption(String(val))}
                min={0}
                max={1000}
                step={10}
                formatValue={(v) => `${v} кВт·ч`}
                color="#eab308"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="consumption"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  placeholder={t('electricity.enterConsumption')}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">кВт·ч</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('electricity.stoveType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setStoveType('electric')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stoveType === 'electric'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Zap className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">{t('electricity.electricStove')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('electricity.higherThresholds')}</div>
                </button>
                <button
                  onClick={() => setStoveType('gas')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    stoveType === 'gas'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-lg mx-auto mb-2">🔥</div>
                  <div className="font-medium">{t('electricity.gasStove')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('electricity.lowerThresholds')}</div>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                {t('electricity.tariffsFor')} {selectedCityData ? t(selectedCityData.nameKey) : ''} ({stoveType === 'electric' ? t('electricity.electricStoveLabel') : t('electricity.gasStoveLabel')}):
              </h3>
              <div className="space-y-1 text-xs text-blue-800">
                {currentTariffs.map((tariff, index) => (
                  <div key={index}>
                    • {t(tariff.descriptionKey)}: <strong>{formatRate(tariff.rate)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('electricity.billCalculation')}</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('electricity.amountToPay')}</span>
                <div className="flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-700">{formatNumber(results.totalAmount)}</span>
                </div>
              </div>
              {consumption && parseFloat(consumption) > 0 && (
                <div className="text-sm text-gray-600">
                  {t('electricity.averageTariff')}: {formatRate(results.averageRate)} {t('electricity.for')} {consumption} кВт·ч
                </div>
              )}
            </div>

            {results.breakdown.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">{t('electricity.calculationBreakdown')}</h3>
                <div className="space-y-3">
                  {results.breakdown.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {t('electricity.level')} {item.tier}: {t(item.descriptionKey)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.consumption.toFixed(1)} кВт·ч × {formatRate(item.rate)}
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
                parseFloat(consumption) > 200 ? 'bg-red-50 border border-red-200' :
                parseFloat(consumption) > 150 ? 'bg-amber-50 border border-amber-200' :
                parseFloat(consumption) < 50 ? 'bg-green-50 border border-green-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <Lightbulb className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    parseFloat(consumption) > 200 ? 'text-red-600' :
                    parseFloat(consumption) > 150 ? 'text-amber-600' :
                    parseFloat(consumption) < 50 ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h3 className={`font-medium mb-1 ${
                      parseFloat(consumption) > 200 ? 'text-red-900' :
                      parseFloat(consumption) > 150 ? 'text-amber-900' :
                      parseFloat(consumption) < 50 ? 'text-green-900' :
                      'text-blue-900'
                    }`}>
                      {t('electricity.consumptionAssessment')}
                    </h3>
                    <p className={`text-sm ${
                      parseFloat(consumption) > 200 ? 'text-red-800' :
                      parseFloat(consumption) > 150 ? 'text-amber-800' :
                      parseFloat(consumption) < 50 ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {t(results.recommendationKey)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('electricity.tariffComparison')} ({t('electricity.year2026')})</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('electricity.city')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('electricity.level1')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('electricity.level2')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('electricity.level3')}</th>
              </tr>
            </thead>
            <tbody>
              {cityTariffs.filter(city => city.id !== 'other').map((cityData) => (
                <tr key={cityData.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{t(cityData.nameKey)}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    <div>{formatRate(cityData.electricStove[0].rate)}</div>
                    <div className="text-xs text-gray-500">{t(cityData.electricStove[0].descriptionKey)}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    <div>{formatRate(cityData.electricStove[1].rate)}</div>
                    <div className="text-xs text-gray-500">{t(cityData.electricStove[1].descriptionKey)}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    <div>{formatRate(cityData.electricStove[2].rate)}</div>
                    <div className="text-xs text-gray-500">{t(cityData.electricStove[2].descriptionKey)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('electricity.tariffFeatures')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• {t('electricity.feature1')}</p>
                <p>• {t('electricity.feature2')}</p>
                <p>• {t('electricity.feature3')}</p>
                <p>• {t('electricity.feature4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('electricity.faq.q1'), answer: t('electricity.faq.a1') },
          { question: t('electricity.faq.q2'), answer: t('electricity.faq.a2') },
          { question: t('electricity.faq.q3'), answer: t('electricity.faq.a3') },
          { question: t('electricity.faq.q4'), answer: t('electricity.faq.a4') },
          { question: t('electricity.faq.q5'), answer: t('electricity.faq.a5') }
        ]}
        sources={[
          { title: 'KEGOC — Энергетика Казахстана', url: 'https://www.kegoc.kz/' },
          { title: 'АО "Самрук-Энерго"', url: 'https://www.samruk-energy.kz/' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.totalAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Электроэнергия', value: results.totalAmount },
            ]}
            title="Оплата за электроэнергию"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт за электроэнергию',
              subtitle: `${city}`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Потребление', value: `${results.consumption} кВт·ч` },
                    { label: 'К оплате', value: `${results.totalAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="electricity-bill-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="electricity"
        calculatorTitle="Калькулятор электроэнергии"
      />
    </div>
  );
}
