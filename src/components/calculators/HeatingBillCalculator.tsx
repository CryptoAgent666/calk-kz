import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Thermometer, Calculator, MapPin, Home, Info, AlertTriangle, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

interface MonthlyNorm {
  month: string;
  norm: number;
  descriptionKey: string;
}

interface CityHeatingData {
  id: string;
  nameKey: string;
  tariffPerGcal: number;
  monthlyNorms: MonthlyNorm[];
  averageNorm: number;
}

export default function HeatingBillCalculator() {
  const { t } = useTranslation('calculators');
  const [city, setCity] = useState<string>('astana');
  const [heatingArea, setHeatingArea] = useState<string>('');
  const [hasMeter, setHasMeter] = useState<boolean>(false);
  const [actualConsumption, setActualConsumption] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('january');

  const [results, setResults] = useState({
    monthlyAmount: 0,
    seasonalAmount: 0,
    consumption: 0,
    norm: 0,
    tariff: 0,
    heatingSeasonMonths: 7,
    averageMonthlyRate: 0,
    recommendationKey: ''
  });

  const cityHeatingData: CityHeatingData[] = [
    {
      id: 'astana',
      nameKey: 'calculators:heating.cityAstana',
      tariffPerGcal: 18450.00,
      averageNorm: 0.0185,
      monthlyNorms: [
        { month: 'october', norm: 0.015, descriptionKey: 'calculators:heating.octoberStart' },
        { month: 'november', norm: 0.0175, descriptionKey: 'calculators:heating.november' },
        { month: 'december', norm: 0.021, descriptionKey: 'calculators:heating.december' },
        { month: 'january', norm: 0.023, descriptionKey: 'calculators:heating.januaryPeak' },
        { month: 'february', norm: 0.021, descriptionKey: 'calculators:heating.february' },
        { month: 'march', norm: 0.018, descriptionKey: 'calculators:heating.march' },
        { month: 'april', norm: 0.013, descriptionKey: 'calculators:heating.aprilEnd' }
      ]
    },
    {
      id: 'almaty',
      nameKey: 'calculators:heating.cityAlmaty',
      tariffPerGcal: 16850.00,
      averageNorm: 0.0165,
      monthlyNorms: [
        { month: 'october', norm: 0.012, descriptionKey: 'calculators:heating.octoberRegular' },
        { month: 'november', norm: 0.016, descriptionKey: 'calculators:heating.november' },
        { month: 'december', norm: 0.019, descriptionKey: 'calculators:heating.december' },
        { month: 'january', norm: 0.021, descriptionKey: 'calculators:heating.januaryRegular' },
        { month: 'february', norm: 0.019, descriptionKey: 'calculators:heating.february' },
        { month: 'march', norm: 0.015, descriptionKey: 'calculators:heating.march' },
        { month: 'april', norm: 0.010, descriptionKey: 'calculators:heating.aprilRegular' }
      ]
    },
    {
      id: 'shymkent',
      nameKey: 'calculators:heating.cityShymkent',
      tariffPerGcal: 15200.00,
      averageNorm: 0.0145,
      monthlyNorms: [
        { month: 'november', norm: 0.013, descriptionKey: 'calculators:heating.novemberStart' },
        { month: 'december', norm: 0.016, descriptionKey: 'calculators:heating.december' },
        { month: 'january', norm: 0.018, descriptionKey: 'calculators:heating.januaryRegular' },
        { month: 'february', norm: 0.016, descriptionKey: 'calculators:heating.february' },
        { month: 'march', norm: 0.012, descriptionKey: 'calculators:heating.marchEnd' }
      ]
    },
    {
      id: 'karaganda',
      nameKey: 'calculators:heating.cityKaraganda',
      tariffPerGcal: 17300.00,
      averageNorm: 0.0195,
      monthlyNorms: [
        { month: 'october', norm: 0.016, descriptionKey: 'calculators:heating.octoberRegular' },
        { month: 'november', norm: 0.019, descriptionKey: 'calculators:heating.november' },
        { month: 'december', norm: 0.022, descriptionKey: 'calculators:heating.december' },
        { month: 'january', norm: 0.025, descriptionKey: 'calculators:heating.januaryColdest' },
        { month: 'february', norm: 0.023, descriptionKey: 'calculators:heating.february' },
        { month: 'march', norm: 0.019, descriptionKey: 'calculators:heating.march' },
        { month: 'april', norm: 0.012, descriptionKey: 'calculators:heating.aprilRegular' }
      ]
    },
    {
      id: 'other',
      nameKey: 'calculators:heating.otherRegions',
      tariffPerGcal: 16000.00,
      averageNorm: 0.017,
      monthlyNorms: [
        { month: 'october', norm: 0.014, descriptionKey: 'calculators:heating.octoberRegular' },
        { month: 'november', norm: 0.017, descriptionKey: 'calculators:heating.november' },
        { month: 'december', norm: 0.020, descriptionKey: 'calculators:heating.december' },
        { month: 'january', norm: 0.022, descriptionKey: 'calculators:heating.januaryRegular' },
        { month: 'february', norm: 0.020, descriptionKey: 'calculators:heating.february' },
        { month: 'march', norm: 0.016, descriptionKey: 'calculators:heating.march' },
        { month: 'april', norm: 0.012, descriptionKey: 'calculators:heating.aprilRegular' }
      ]
    }
  ];

  const getMonthNameKey = (monthId: string): string => {
    const monthKeys: { [key: string]: string } = {
      'october': 'calculators:heating.monthOctober',
      'november': 'calculators:heating.monthNovember',
      'december': 'calculators:heating.monthDecember',
      'january': 'calculators:heating.monthJanuary',
      'february': 'calculators:heating.monthFebruary',
      'march': 'calculators:heating.monthMarch',
      'april': 'calculators:heating.monthApril'
    };
    return monthKeys[monthId] || monthId;
  };

  const calculateHeatingBill = () => {
    const area = parseFloat(heatingArea) || 0;

    if (area <= 0) {
      setResults({
        monthlyAmount: 0, seasonalAmount: 0, consumption: 0,
        norm: 0, tariff: 0, heatingSeasonMonths: 7,
        averageMonthlyRate: 0, recommendationKey: ''
      });
      return;
    }

    const selectedCity = cityHeatingData.find(c => c.id === city);
    if (!selectedCity) return;

    let consumption: number;
    let norm: number;

    if (hasMeter && actualConsumption) {
      consumption = parseFloat(actualConsumption);
      norm = consumption / area;
    } else {
      const selectedMonthData = selectedCity.monthlyNorms.find(m => m.month === selectedMonth);
      norm = selectedMonthData ? selectedMonthData.norm : selectedCity.averageNorm;
      consumption = area * norm;
    }

    const tariff = selectedCity.tariffPerGcal;
    const monthlyAmount = consumption * tariff;

    const seasonalConsumption = area * selectedCity.averageNorm * selectedCity.monthlyNorms.length;
    const seasonalAmount = seasonalConsumption * tariff;

    const averageMonthlyRate = monthlyAmount / area;

    let recommendationKey = '';
    if (norm > 0.025) {
      recommendationKey = 'calculators:heating.recommendationVeryHigh';
    } else if (norm > 0.020) {
      recommendationKey = 'calculators:heating.recommendationHigh';
    } else if (norm < 0.012) {
      recommendationKey = 'calculators:heating.recommendationLow';
    } else {
      recommendationKey = 'calculators:heating.recommendationNormal';
    }

    setResults({
      monthlyAmount: Math.round(monthlyAmount),
      seasonalAmount: Math.round(seasonalAmount),
      consumption: Number(consumption.toFixed(4)),
      norm: Number(norm.toFixed(4)),
      tariff,
      heatingSeasonMonths: selectedCity.monthlyNorms.length,
      averageMonthlyRate: Number(averageMonthlyRate.toFixed(2)),
      recommendationKey
    });
  };

  useEffect(() => {
    calculateHeatingBill();
  }, [city, heatingArea, hasMeter, actualConsumption, selectedMonth]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₸';
  };

  const formatTariff = (tariff: number) => {
    return tariff.toLocaleString('ru-KZ') + ' ₸/Гкал';
  };

  const formatNorm = (norm: number) => {
    return norm.toFixed(4) + ' Гкал/м²';
  };

  const selectedCityData = cityHeatingData.find(c => c.id === city);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('heating.heading')}</h1>
            <p className="text-gray-600">{t('heating.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('heating.calculationParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('heating.cityRegion')}
              </label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {cityHeatingData.map((cityOption) => (
                  <option key={cityOption.id} value={cityOption.id}>
                    {t(cityOption.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4 inline mr-1" />
                {t('heating.heatedArea')}
              </label>
              <RangeSlider
                value={parseFloat(heatingArea) || 0}
                onChange={(val) => setHeatingArea(String(val))}
                min={20}
                max={300}
                step={5}
                formatValue={(v) => `${v} м²`}
                color="#ef4444"
              />
              <input
                type="number"
                id="heatingArea"
                value={heatingArea}
                onChange={(e) => setHeatingArea(e.target.value)}
                placeholder={t('heating.enterArea')}
                step="0.1"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="hasMeter"
                  checked={hasMeter}
                  onChange={(e) => setHasMeter(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasMeter" className="ml-2 block text-sm text-gray-700">
                  {t('heating.hasMeter')}
                </label>
              </div>

              {hasMeter && (
                <div>
                  <label htmlFor="actualConsumption" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('heating.actualConsumption')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="actualConsumption"
                      value={actualConsumption}
                      onChange={(e) => setActualConsumption(e.target.value)}
                      placeholder={t('heating.enterConsumption')}
                      step="0.0001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">Гкал</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!hasMeter && (
              <div>
                <label htmlFor="selectedMonth" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('heating.heatingSeason')}
                </label>
                <select
                  id="selectedMonth"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {selectedCityData?.monthlyNorms.map((monthData) => (
                    <option key={monthData.month} value={monthData.month}>
                      {t(monthData.descriptionKey)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-900 mb-2">
                {t('heating.tariffsFor')} {selectedCityData ? t(selectedCityData.nameKey) : ''}:
              </h3>
              <div className="space-y-1 text-xs text-red-800">
                <div>• {t('heating.tariff')}: <strong>{formatTariff(selectedCityData?.tariffPerGcal || 0)}</strong></div>
                <div>• {t('heating.averageNorm')}: <strong>{formatNorm(selectedCityData?.averageNorm || 0)}</strong></div>
                <div>• {t('heating.heatingSeasonMonths')}: <strong>{selectedCityData?.monthlyNorms.length || 7} {t('heating.months')}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('heating.heatingBillCalculation')}</h2>

          <div className="space-y-6">
            {heatingArea && parseFloat(heatingArea) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{t('heating.calculationParams')}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('heating.heatedAreaLabel')}: <strong>{heatingArea} м²</strong></div>
                  <div>{t('heating.calculationMethod')}: <strong>{hasMeter ? t('heating.byMeter') : t('heating.byNorms')}</strong></div>
                  {!hasMeter && selectedCityData && (
                    <div>{t('heating.monthlyNorm')}: <strong>{formatNorm(results.norm)}</strong></div>
                  )}
                  <div>{t('heating.consumption')}: <strong>{results.consumption.toFixed(4)} Гкал</strong></div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">
                  {hasMeter ? t('heating.calculationByMeter') : `${t('heating.calculationFor')} ${t(getMonthNameKey(selectedMonth))}`}
                </span>
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-6 h-6 text-red-600" />
                  <span className="text-2xl font-bold text-red-700">{formatNumber(results.monthlyAmount)}</span>
                </div>
              </div>
              {heatingArea && parseFloat(heatingArea) > 0 && (
                <div className="text-sm text-gray-600">
                  {t('heating.costPerSqm')}: {formatNumber(results.averageMonthlyRate)}
                </div>
              )}
            </div>

            {!hasMeter && results.seasonalAmount > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('heating.seasonalProjection')}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('heating.forMonths')} {selectedCityData?.monthlyNorms.length || 7} {t('heating.months')}</span>
                  <span className="text-xl font-bold text-orange-600">{formatNumber(results.seasonalAmount)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('heating.calculationByAverageNorms')}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('heating.tariffPerGcal')}</span>
                <span className="font-semibold text-gray-900">{formatTariff(results.tariff)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('heating.consumptionNorm')}</span>
                <span className="font-semibold text-gray-900">{formatNorm(results.norm)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('heating.heatConsumption')}</span>
                <span className="font-semibold text-gray-900">{results.consumption.toFixed(4)} Гкал</span>
              </div>
            </div>

            {results.recommendationKey && (
              <div className={`rounded-lg p-4 ${
                results.norm > 0.025 ? 'bg-red-50 border border-red-200' :
                results.norm > 0.020 ? 'bg-amber-50 border border-amber-200' :
                results.norm < 0.012 ? 'bg-green-50 border border-green-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    results.norm > 0.025 ? 'text-red-600' :
                    results.norm > 0.020 ? 'text-amber-600' :
                    results.norm < 0.012 ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h3 className={`font-medium mb-1 ${
                      results.norm > 0.025 ? 'text-red-900' :
                      results.norm > 0.020 ? 'text-amber-900' :
                      results.norm < 0.012 ? 'text-green-900' :
                      'text-blue-900'
                    }`}>
                      {t('heating.heatConsumptionAssessment')}
                    </h3>
                    <p className={`text-sm ${
                      results.norm > 0.025 ? 'text-red-800' :
                      results.norm > 0.020 ? 'text-amber-800' :
                      results.norm < 0.012 ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {t(results.recommendationKey)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Диаграмма структуры */}
            {results.monthlyAmount > 0 && (
              <TaxPieChart
                data={[
                  { name: t('heating.heatingPayment'), value: results.monthlyAmount },
                ]}
                title={t('heating.paymentForHeating')}
              />
            )}

            {/* Экспорт результатов */}
            {results.monthlyAmount > 0 && (
              <ExportButtons
                data={{
                  title: t('heating.heatingPaymentCalculation'),
                  subtitle: selectedCityData ? t(selectedCityData.nameKey) : '',
                  sections: [
                    {
                      title: t('heating.calculationParameters'),
                      data: [
                        { label: t('heating.area'), value: `${heatingArea} м²` },
                        { label: t('heating.month'), value: t(`calculators:heating.${selectedMonth}`) },
                        { label: t('heating.tariff'), value: formatTariff(results.tariff) },
                      ]
                    },
                    {
                      title: t('heating.billCalculation'),
                      data: [
                        { label: t('heating.monthlyCost'), value: formatNumber(results.monthlyAmount) },
                        { label: t('heating.seasonalCost'), value: formatNumber(results.seasonalAmount) },
                      ]
                    }
                  ],
                  footer: t('heating.calculatedOn')
                }}
                filename="heating-bill-calculation"
              />
            )}
          </div>
        </div>
      </div>

      {!hasMeter && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('heating.monthlyNormsFor')} {selectedCityData ? t(selectedCityData.nameKey) : ''}
          </h2>

          <div className="overflow-x-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {selectedCityData?.monthlyNorms.slice(0, Math.ceil(selectedCityData.monthlyNorms.length / 2)).map((monthData) => (
                  <div key={monthData.month} className={`flex justify-between text-sm py-3 px-4 rounded ${
                    selectedMonth === monthData.month ? 'bg-red-100 border border-red-300' : 'bg-gray-50'
                  }`}>
                    <span className="text-gray-700">{t(monthData.descriptionKey)}</span>
                    <span className="font-medium">{formatNorm(monthData.norm)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {selectedCityData?.monthlyNorms.slice(Math.ceil(selectedCityData.monthlyNorms.length / 2)).map((monthData) => (
                  <div key={monthData.month} className={`flex justify-between text-sm py-3 px-4 rounded ${
                    selectedMonth === monthData.month ? 'bg-red-100 border border-red-300' : 'bg-gray-50'
                  }`}>
                    <span className="text-gray-700">{t(monthData.descriptionKey)}</span>
                    <span className="font-medium">{formatNorm(monthData.norm)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('heating.tariffComparison')} ({t('heating.year2026')})</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('heating.city')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('heating.tariffPerGcalLabel')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('heating.averageNormLabel')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('heating.costPerSqmLabel')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('heating.heatingSeasonLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {cityHeatingData.filter(city => city.id !== 'other').map((cityData) => {
                const avgCostPerSqm = cityData.tariffPerGcal * cityData.averageNorm;
                return (
                  <tr key={cityData.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{t(cityData.nameKey)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatTariff(cityData.tariffPerGcal)}</td>
                    <td className="py-3 px-4 text-center text-sm">{formatNorm(cityData.averageNorm)}</td>
                    <td className="py-3 px-4 text-center text-sm font-semibold text-red-600">
                      {formatNumber(avgCostPerSqm)}/м²
                    </td>
                    <td className="py-3 px-4 text-center text-sm">{cityData.monthlyNorms.length} {t('heating.monthsShort')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('heating.heatingCalculationPrinciple')}
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• <strong>{t('heating.withMeters')}</strong></p>
                <p>• <strong>{t('heating.withoutMeters')}</strong></p>
                <p>• <strong>{t('heating.seasonalDifferences')}</strong></p>
                <p>• <strong>{t('heating.formula')}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('heating.faq.q1'), answer: t('heating.faq.a1') },
          { question: t('heating.faq.q2'), answer: t('heating.faq.a2') },
          { question: t('heating.faq.q3'), answer: t('heating.faq.a3') },
          { question: t('heating.faq.q4'), answer: t('heating.faq.a4') },
          { question: t('heating.faq.q5'), answer: t('heating.faq.a5') }
        ]}
        sources={[
          { title: 'Алматинские тепловые сети', url: 'https://alatau.kz/' },
          { title: 'Астана-Теплотранзит', url: 'https://astana-teplo.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="heating-bill"
        calculatorTitle="Калькулятор отопления"
      />
    </div>
  );
}
