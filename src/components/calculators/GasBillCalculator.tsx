import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Calculator, MapPin, Home, Info, AlertTriangle, TrendingUp, Thermometer, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';

interface CityGasData {
  id: string;
  nameKey: string;
  tariffPerCubicMeter: number;
  averageMonthlyConsumption: {
    apartment: number;
    house: number;
  };
}

export default function GasBillCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [city, setCity] = useState<string>('astana');
  const [gasConsumption, setGasConsumption] = useState<string>('30');
  const [propertyType, setPropertyType] = useState<'apartment' | 'house'>('apartment');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — гидратация падает (#418/#425).
  const EMPTY_RESULTS = {
    monthlyAmount: 0,
    yearlyAmount: 0,
    tariff: 0,
    averageConsumption: 0,
    isHighConsumption: false,
    recommendationKey: ''
  };

  // Цены розничной реализации товарного газа для населения (1 группа),
  // АО «QazaqGaz Aimaq», прайс с 01.08.2026, «с учётом тарифа на транспортировку».
  // Официальный прайс публикуется БЕЗ НДС — здесь приведено С НДС 16%, потому что
  // калькулятор показывает сумму к оплате потребителем.
  // Проверено Tier-2 23.08.2026: до этого все восемь значений были неверны, причём
  // в обе стороны (Алматы занижена вдвое, Атырау завышена втрое), а порядок городов
  // по дороговизне был обратен реальному.
  const cityGasData: CityGasData[] = [
    {
      id: 'astana',
      nameKey: 'calculators:gas.cityAstana',
      tariffPerCubicMeter: 54.79, // 47 230,48 тг/1000 м3 без НДС
      averageMonthlyConsumption: { apartment: 25, house: 45 }
    },
    {
      id: 'almaty',
      nameKey: 'calculators:gas.cityAlmaty',
      tariffPerCubicMeter: 62.43, // 53 814,98 тг/1000 м3 без НДС
      averageMonthlyConsumption: { apartment: 30, house: 55 }
    },
    {
      id: 'shymkent',
      nameKey: 'calculators:gas.cityShymkent',
      tariffPerCubicMeter: 60.07, // 51 782,66 тг/1000 м3 без НДС
      averageMonthlyConsumption: { apartment: 28, house: 50 }
    },
    {
      id: 'aktobe',
      nameKey: 'calculators:gas.cityAktobe',
      tariffPerCubicMeter: 19.10, // 16 466,94 тг/1000 м3 без НДС
      averageMonthlyConsumption: { apartment: 32, house: 60 }
    },
    {
      id: 'karaganda',
      nameKey: 'calculators:gas.cityKaraganda',
      tariffPerCubicMeter: 54.81, // 47 250,00 тг/1000 м3 без НДС
      averageMonthlyConsumption: { apartment: 35, house: 65 }
    },
    // Павлодар убран: Павлодарская область не газифицирована — у QazaqGaz Aimaq
    // нет такого филиала, сетевого газа в регионе не существует.
    {
      id: 'atyrau',
      nameKey: 'calculators:gas.cityAtyrau',
      tariffPerCubicMeter: 13.56, // 11 691,95 тг/1000 м3 без НДС
      averageMonthlyConsumption: { apartment: 28, house: 50 }
    },
    {
      id: 'other',
      nameKey: 'calculators:gas.otherRegions',
      // Единой цены «для прочих регионов» не публикуется: QazaqGaz Aimaq утверждает
      // её отдельно по каждому филиалу. Здесь — среднее по шести филиалам выше;
      // в интерфейсе подписано как ориентир, а не как утверждённый тариф.
      tariffPerCubicMeter: 44.13,
      averageMonthlyConsumption: { apartment: 30, house: 50 }
    }
  ];

  // Самый дорогой и самый дешёвый считаем ИЗ таблицы, а не хардкодим: раньше тут
  // стояли Астана 49,20 как «самый дорогой» и Алматы 27,69 как «самый дешёвый» —
  // после сверки с прайсом QazaqGaz Aimaq оба числа оказались неверными, а города
  // перепутаны местами (реально дороже всего Алматы, дешевле всего Атырау).
  const rankedCities = cityGasData.filter(c => c.id !== 'other');
  const mostExpensiveCity = rankedCities.reduce((a, b) => b.tariffPerCubicMeter > a.tariffPerCubicMeter ? b : a);
  const cheapestCity = rankedCities.reduce((a, b) => b.tariffPerCubicMeter < a.tariffPerCubicMeter ? b : a);

  const calculateGasBill = () => {
    const consumption = parseFloat(gasConsumption) || 0;

    if (consumption <= 0) {
      return EMPTY_RESULTS;
    }

    const selectedCity = cityGasData.find(c => c.id === city);
    if (!selectedCity) return EMPTY_RESULTS;

    const tariff = selectedCity.tariffPerCubicMeter;
    const monthlyAmount = consumption * tariff;
    const yearlyAmount = monthlyAmount * 12;

    const averageConsumption = selectedCity.averageMonthlyConsumption[propertyType];
    const isHighConsumption = consumption > averageConsumption * 1.5;

    let recommendationKey = '';
    if (consumption > averageConsumption * 2) {
      recommendationKey = 'calculators:gas.recommendationVeryHigh';
    } else if (consumption > averageConsumption * 1.5) {
      recommendationKey = 'calculators:gas.recommendationHigh';
    } else if (consumption < averageConsumption * 0.5) {
      recommendationKey = 'calculators:gas.recommendationLow';
    } else {
      recommendationKey = 'calculators:gas.recommendationNormal';
    }

    return {
      monthlyAmount: Math.round(monthlyAmount),
      yearlyAmount: Math.round(yearlyAmount),
      tariff,
      averageConsumption,
      isHighConsumption,
      recommendationKey
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    calculateGasBill,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city, gasConsumption, propertyType]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₸';
  };

  const formatTariff = (tariff: number) => {
    return tariff.toFixed(2) + ' ₸/м³';
  };

  const selectedCityData = cityGasData.find(c => c.id === city);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('gas.heading')}</h1>
            <p className="text-gray-600">{t('gas.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gas.consumptionParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('gas.cityRegion')}
              </label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {cityGasData.map((cityOption) => (
                  <option key={cityOption.id} value={cityOption.id}>
                    {t(cityOption.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('gas.propertyType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPropertyType('apartment')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    propertyType === 'apartment'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Home className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">{t('gas.apartment')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('gas.lowerConsumption')}</div>
                </button>
                <button
                  onClick={() => setPropertyType('house')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    propertyType === 'house'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-lg mx-auto mb-2">🏠</div>
                  <div className="font-medium">{t('gas.house')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('gas.higherConsumption')}</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('gas.gasConsumptionVolume')}
              </label>
              <RangeSlider
                value={parseFloat(gasConsumption) || 0}
                onChange={(val) => setGasConsumption(String(val))}
                min={0}
                max={200}
                step={1}
                formatValue={(v) => `${v} м³`}
                color="#f97316"
              />
              <input
                type="number"
                id="gasConsumption"
                value={gasConsumption}
                onChange={(e) => setGasConsumption(e.target.value)}
                placeholder={t('gas.enterConsumption')}
                step="0.1"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-orange-900 mb-2">
                {t('gas.tariffFor')} {selectedCityData ? t(selectedCityData.nameKey) : ''}:
              </h3>
              <div className="space-y-1 text-sm text-orange-800">
                <div>• {t('gas.tariff')}: <strong>{formatTariff(selectedCityData?.tariffPerCubicMeter || 0)}</strong></div>
                <div>• {t('gas.averageConsumption')} ({propertyType === 'apartment' ? t('gas.apartmentLabel') : t('gas.houseLabel')}):
                  <strong> {selectedCityData?.averageMonthlyConsumption[propertyType] || 0} {t('gas.perMonth')}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gas.billCalculation')}</h2>

          <div className="space-y-6">
            {gasConsumption && parseFloat(gasConsumption) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{t('gas.consumptionIndicators')}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('gas.gasConsumption')}: <strong>{gasConsumption} м³</strong></div>
                  <div>{t('gas.propertyTypeLabel')}: <strong>{propertyType === 'apartment' ? t('gas.apartmentFull') : t('gas.houseFull')}</strong></div>
                  <div>{t('gas.tariff')}: <strong>{formatTariff(results.tariff)}</strong></div>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('gas.monthlyPayment')}</span>
                <div className="flex items-center space-x-2">
                  <Flame className="w-6 h-6 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-700">{formatNumber(results.monthlyAmount)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {gasConsumption} м³ × {formatTariff(results.tariff)}
              </div>
            </div>

            {results.yearlyAmount > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('gas.yearlyProjection')}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('gas.sameConsumption')}</span>
                  <span className="text-xl font-bold text-orange-600">{formatNumber(results.yearlyAmount)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('gas.months12')} × {formatNumber(results.monthlyAmount)}
                </div>
              </div>
            )}

            {results.averageConsumption > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">{t('gas.comparisonWithAverage')}</h3>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('gas.yourConsumption')}</span>
                  <span className="font-semibold text-gray-900">{gasConsumption} м³</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{propertyType === 'apartment' ? t('gas.averageForApartments') : t('gas.averageForHouses')}</span>
                  <span className="font-semibold text-blue-600">{results.averageConsumption} м³</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('gas.deviationFromNorm')}</span>
                  <span className={`font-semibold ${
                    parseFloat(gasConsumption) > results.averageConsumption
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {parseFloat(gasConsumption) > results.averageConsumption ? '+' : ''}
                    {((parseFloat(gasConsumption) / results.averageConsumption - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {results.recommendationKey && (
              <div className={`rounded-lg p-4 ${
                results.isHighConsumption ? 'bg-red-50 border border-red-200' :
                parseFloat(gasConsumption) < results.averageConsumption * 0.7 ? 'bg-green-50 border border-green-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-2">
                  <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    results.isHighConsumption ? 'text-red-600' :
                    parseFloat(gasConsumption) < results.averageConsumption * 0.7 ? 'text-green-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h3 className={`font-medium mb-1 ${
                      results.isHighConsumption ? 'text-red-900' :
                      parseFloat(gasConsumption) < results.averageConsumption * 0.7 ? 'text-green-900' :
                      'text-blue-900'
                    }`}>
                      {t('gas.gasConsumptionAssessment')}
                    </h3>
                    <p className={`text-sm ${
                      results.isHighConsumption ? 'text-red-800' :
                      parseFloat(gasConsumption) < results.averageConsumption * 0.7 ? 'text-green-800' :
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
                  { name: 'Газ', value: results.monthlyAmount },
                ]}
                title={i18n.language === 'kk' ? 'Газ үшін төлем' : 'Оплата за газ'}
              />
            )}

            {/* Экспорт результатов */}
            {results.monthlyAmount > 0 && (
              <ExportButtons
                data={{
                  title: 'Расчёт оплаты за газ',
                  subtitle: selectedCityData ? t(selectedCityData.nameKey) : '',
                  sections: [
                    {
                      title: t('gas.consumptionParameters'),
                      data: [
                        { label: t('gas.consumption'), value: `${gasConsumption} м³` },
                        { label: t('gas.tariff'), value: formatTariff(results.tariff) },
                        { label: t('gas.propertyTypeLabel'), value: propertyType === 'apartment' ? t('gas.apartmentFull') : t('gas.houseFull') },
                      ]
                    },
                    {
                      title: t('gas.billCalculation'),
                      data: [
                        { label: t('gas.monthlyPayment'), value: formatNumber(results.monthlyAmount) },
                        { label: t('gas.yearlyProjection'), value: formatNumber(results.yearlyAmount) },
                      ]
                    }
                  ],
                  footer: t('gas.calculatedOn')
                }}
                filename="gas-bill-calculation"
              />
            )}
          </div>
        </div>
      </div>

      {/* Диаграмма сравнения тарифов */}
      <div className="mt-8">
        <ComparisonBarChart
          data={cityGasData.filter(c => c.id !== 'other').map(c => ({
            name: t(c.nameKey).replace(/^г\.\s*/i, ''),
            tariff: c.tariffPerCubicMeter,
            avgBill: c.tariffPerCubicMeter * c.averageMonthlyConsumption.apartment
          }))}
          dataKeys={[
            { key: 'tariff', name: 'Тариф (₸/м³)', color: '#f97316' },
            { key: 'avgBill', name: 'Средний счёт (₸)', color: '#3b82f6' }
          ]}
          title={i18n.language === 'kk' ? 'Қалалар бойынша тарифтерді салыстыру' : 'Сравнение тарифов по городам'}
          height={300}
        />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gas.tariffComparison')} ({t('gas.year2026')})</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('gas.city')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('gas.tariffPerM3')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('gas.averageConsumptionApartment')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('gas.averageConsumptionHouse')}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('gas.averageBillApartment')}</th>
              </tr>
            </thead>
            <tbody>
              {cityGasData.filter(city => city.id !== 'other').map((cityData) => {
                const avgApartmentBill = cityData.tariffPerCubicMeter * cityData.averageMonthlyConsumption.apartment;
                return (
                  <tr key={cityData.id} className={`border-b border-gray-100 ${city === cityData.id ? 'bg-orange-50' : ''}`}>
                    <td className="py-3 px-4 font-medium text-gray-900">{t(cityData.nameKey)}</td>
                    <td className="py-3 px-4 text-center text-sm font-semibold text-orange-600">
                      {formatTariff(cityData.tariffPerCubicMeter)}
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {cityData.averageMonthlyConsumption.apartment} м³
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      {cityData.averageMonthlyConsumption.house} м³
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold">
                      {formatNumber(avgApartmentBill)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">{t('gas.mostExpensiveTariff')}</h4>
            <div className="text-red-800 text-sm">
              <strong>{t(mostExpensiveCity.nameKey)}:</strong> {formatTariff(mostExpensiveCity.tariffPerCubicMeter)}
              <br />
              {t('gas.averageBillFor')}: {formatNumber(mostExpensiveCity.tariffPerCubicMeter * mostExpensiveCity.averageMonthlyConsumption.apartment)}
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">{t('gas.cheapestTariff')}</h4>
            <div className="text-green-800 text-sm">
              <strong>{t(cheapestCity.nameKey)}:</strong> {formatTariff(cheapestCity.tariffPerCubicMeter)}
              <br />
              {t('gas.averageBillFor')}: {formatNumber(cheapestCity.tariffPerCubicMeter * cheapestCity.averageMonthlyConsumption.apartment)}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('gas.tariffingFeatures')}
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• {t('gas.feature1')}</p>
                <p>• {t('gas.feature2')}</p>
                <p>• {t('gas.feature3')}</p>
                <p>• {t('gas.feature4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gas.savingMethods')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Thermometer className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('gas.efficientHeating')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gas.efficientHeatingDesc')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍳</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('gas.economicalCooking')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gas.economicalCookingDesc')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔧</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('gas.technicalMaintenance')}</h3>
            <p className="text-gray-600 text-sm">
              {t('gas.technicalMaintenanceDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('gas.faq.q1'), answer: t('gas.faq.a1') },
          { question: t('gas.faq.q2'), answer: t('gas.faq.a2') },
          { question: t('gas.faq.q3'), answer: t('gas.faq.a3') },
          { question: t('gas.faq.q4'), answer: t('gas.faq.a4') },
          { question: t('gas.faq.q5'), answer: t('gas.faq.a5') }
        ]}
        sources={[
          { title: 'КазТрансГаз', url: 'https://kaztransgas.kz/' },
          { title: i18n.language === 'kk' ? 'ТМРА — газ тарифтері' : 'АРЕМ — тарифы на газ', url: 'https://www.arem.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="gas-bill"
        calculatorTitle="Калькулятор газа"
      />
      <LastUpdated calculatorId="gas" />
    </div>
  );
}
