import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Calculator, MapPin, Users, Info, AlertTriangle, TrendingUp, Waves, BarChart3 } from 'lucide-react';
import { QuickAnswer } from '../ui/QuickAnswer';
import { getSources } from '../../data/calculatorSources';
import { FAQSection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

/**
 * Тарифы для населения (1 группа потребителей), ₸/м³ с НДС 16% — сверено
 * 24.09.2026 по сайтам водоканалов и приказам ДКРЕМ:
 * - Алматы («Алматы Су», almatysu.kz): вода 76,56, водоотведение 47,50 — единый
 *   тариф; дифференцированные ступени утверждены, но приостановлены с 01.09.2025
 *   по 31.12.2026 (отчёт компании за 1-е полугодие 2026).
 * - Астана («Астана су арнасы», astanasu.kz): 119,36 и 127,41 с 01.04.2026
 *   (приказ ДКРЕМ № 21-ОД от 25.06.2026 — до 31.12.2026).
 * - Шымкент («Водные ресурсы – Маркетинг», wrm.kz): 111,44 и 62,41
 *   (приказ ДКРЕМ № 33 от 26.06.2026 — до 31.12.2026).
 * Прежние ступени 103/123,6/154,49/205,99 и 89,40…178,80 ₸ не совпадали ни с
 * одним действующим приказом, водоотведение в Астане было занижено в 2,6 раза.
 */
interface CityTariff {
  id: string;
  nameKey: string;
  waterRate: number;
  sewerageRate: number;
}

export default function WaterBillCalculator() {
  const { t } = useTranslation('calculators');
  const [city, setCity] = useState<string>('almaty');
  const [waterConsumption, setWaterConsumption] = useState<string>('5');
  const [residentsCount, setResidentsCount] = useState<string>('1');
  // «Другой город»: единого справочника нет — тариф берут из квитанции.
  const [customWaterRate, setCustomWaterRate] = useState<string>('100');
  const [customSewerageRate, setCustomSewerageRate] = useState<string>('60');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через useState(нули) +
  // useEffect: пререндер сохраняет страницу с числами, и первый клиентский
  // рендер обязан выдать те же числа — иначе гидратация падает (#418/#425).
  const EMPTY_RESULTS = {
    coldWaterAmount: 0,
    sewerageAmount: 0,
    totalAmount: 0,
    consumptionPerPerson: 0,
    averageRate: 0,
    recommendationKey: ''
  };

  const cityTariffs: CityTariff[] = [
    { id: 'almaty', nameKey: 'calculators:water.cityAlmaty', waterRate: 76.56, sewerageRate: 47.50 },
    { id: 'astana', nameKey: 'calculators:water.cityAstana', waterRate: 119.36, sewerageRate: 127.41 },
    { id: 'shymkent', nameKey: 'calculators:water.cityShymkent', waterRate: 111.44, sewerageRate: 62.41 },
    {
      id: 'other',
      nameKey: 'calculators:water.otherRegions',
      waterRate: parseFloat(customWaterRate) || 0,
      sewerageRate: parseFloat(customSewerageRate) || 0,
    },
  ];

  const calculateWaterBill = () => {
    const totalConsumption = parseFloat(waterConsumption) || 0;
    const residents = parseInt(residentsCount) || 1;

    if (totalConsumption <= 0 || residents <= 0) {
      return EMPTY_RESULTS;
    }

    const selectedCity = cityTariffs.find(c => c.id === city);
    if (!selectedCity) return EMPTY_RESULTS;

    const consumptionPerPerson = totalConsumption / residents;
    const coldWaterAmount = totalConsumption * selectedCity.waterRate;

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

    return {
      coldWaterAmount: Math.round(coldWaterAmount),
      sewerageAmount: Math.round(sewerageAmount),
      totalAmount: Math.round(totalAmount),
      consumptionPerPerson: Number(consumptionPerPerson.toFixed(2)),
      averageRate: Number(averageRate.toFixed(2)),
      recommendationKey
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    calculateWaterBill,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city, waterConsumption, residentsCount, customWaterRate, customSewerageRate]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₸';
  };

  const formatRate = (rate: number) => {
    return rate.toFixed(2) + ' ₸/м³';
  };

  const selectedCityData = cityTariffs.find(c => c.id === city);

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="water" />
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

            {city === 'other' ? (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-blue-800">{t('water.otherTariffHint')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="customWaterRate" className="block text-xs font-medium text-blue-900 mb-1">
                      {t('water.waterSupply')}, ₸/м³
                    </label>
                    <input
                      type="number"
                      id="customWaterRate"
                      value={customWaterRate}
                      onChange={(e) => setCustomWaterRate(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="customSewerageRate" className="block text-xs font-medium text-blue-900 mb-1">
                      {t('water.sewerage')}, ₸/м³
                    </label>
                    <input
                      type="number"
                      id="customSewerageRate"
                      value={customSewerageRate}
                      onChange={(e) => setCustomSewerageRate(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  {t('water.tariffsFor')} {selectedCityData ? t(selectedCityData.nameKey) : ''}:
                </h3>
                <div className="space-y-1 text-xs text-blue-800">
                  <div>• {t('water.waterSupply')}: <strong>{formatRate(selectedCityData?.waterRate || 0)}</strong></div>
                  <div>• {t('water.sewerage')}: <strong>{formatRate(selectedCityData?.sewerageRate || 0)}</strong></div>
                  <div className="mt-2 text-blue-700">
                    {t(city === 'almaty' ? 'water.almatyTiersSuspended' : 'water.flatTariffNote')}
                  </div>
                </div>
              </div>
            )}
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
                  <div className="text-xs text-blue-600">{results.totalAmount > 0 ? formatRate(selectedCityData?.waterRate || 0) : ''}</div>
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
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.waterSupply')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.sewerageLabel')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('water.totalPerM3')}</th>
              </tr>
            </thead>
            <tbody>
              {cityTariffs.filter(city => city.id !== 'other').map((cityData) => (
                <tr key={cityData.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{t(cityData.nameKey)}</td>
                  <td className="py-3 px-4 text-center text-sm">{formatRate(cityData.waterRate)}</td>
                  <td className="py-3 px-4 text-center text-sm">{formatRate(cityData.sewerageRate)}</td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-cyan-600">{formatRate(cityData.waterRate + cityData.sewerageRate)}</td>
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
                {t('water.tariffsHowTitle')}
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• {t('water.tariffsHow1')}</p>
                <p>• {t('water.tariffsHow2')}</p>
                <p>• {t('water.tariffsHow3')}</p>
                <p>• {t('water.principle4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="water-bill" />
      <FAQSection
        items={[
          { question: t('water.faq.q1'), answer: t('water.faq.a1') },
          { question: t('water.faq.q2'), answer: t('water.faq.a2') },
          { question: t('water.faq.q3'), answer: t('water.faq.a3') },
          { question: t('water.faq.q4'), answer: t('water.faq.a4') },
          { question: t('water.faq.q5'), answer: t('water.faq.a5') }
        ]}
        sources={getSources('water')}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="water-bill"
        calculatorTitle="Калькулятор воды"
      />
      <LastUpdated calculatorId="water" />
    </div>
  );
}
