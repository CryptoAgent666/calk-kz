import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Calculator, MapPin, Home, Info, AlertTriangle, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react';
import { RangeSlider } from '../ui/RangeSlider';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { TaxPieChart } from '../ui/ChartComponents';
import { NUMBER_LOCALE } from '../../utils/localeFormat';
import { getSources } from '../../data/calculatorSources';

/** Пороги уровня — на ОДНОГО проживающего; для квартиры умножаются на число проживающих. */
interface TariffTier {
  min: number;
  max: number;
  rate: number;
}

interface CityTariff {
  id: string;
  nameKey: string;
  electricStove: TariffTier[];
  gasStove: TariffTier[];
}

export default function ElectricityBillCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [city, setCity] = useState<string>('astana');
  const [consumption, setConsumption] = useState<string>('150');
  const [stoveType, setStoveType] = useState<'electric' | 'gas'>('electric');
  const [residents, setResidents] = useState<string>('2');

  const EMPTY_RESULTS = {
    totalAmount: 0,
    breakdown: [] as Array<{tier: number, consumption: number, rate: number, amount: number, label: string}>,
    averageRate: 0,
    recommendationKey: ''
  };

  // Тарифы с НДС, пороги — на одного постоянно проживающего (calkcheck 26.10.2026, б17). До этого
  // пороги считались на квартиру: для семьи из 3 человек в Алматы 200 кВт·ч выходили 7 979 ₸ вместо 6 856 ₸.
  // Алматы — «Алатау Жарық Компаниясы» — «Энергосбыт», с 12.09.2026: 34,28 / 45,51 / 56,89 ₸ (esalmaty.kz);
  //   без электроплиты ≤90 / 90–160 / >160, с электроплитой ≤115 / 115–190 / >190 кВт·ч на человека.
  // Астана — «Астана-РЭК», с 15.10.2026 (заключение ДКРЕМ № 03-04/412-И от 09.10.2026, astrec.kz):
  //   с электроплитой 25,54 / 37,43 / 46,79 (≤90 / 90–180 / >180), без — 26,98 / 37,43 / 46,79 (≤70 / 70–140 / >140).
  // Шымкент — «Оңтүстік Жарық Транзит», с 25.09.2026 (заключение ДКРЕМ № 61-04-13/1768 от 23.09.2026):
  //   без электроплиты 25,4968 / 32,8744 / 41,0988 (≤90 / 90–150 / >150), с электроплитой 26,1232 /
  //   32,8744 / 41,0988 (≤110 / 110–170 / >170).
  // Прочие регионы — ориентир, сверяйте с вашим поставщиком.
  const cityTariffs: CityTariff[] = [
    {
      id: 'astana',
      nameKey: 'calculators:electricity.cityAstana',
      electricStove: [
        { min: 0, max: 90, rate: 25.54 },
        { min: 90, max: 180, rate: 37.43 },
        { min: 180, max: Infinity, rate: 46.79 }
      ],
      gasStove: [
        { min: 0, max: 70, rate: 26.98 },
        { min: 70, max: 140, rate: 37.43 },
        { min: 140, max: Infinity, rate: 46.79 }
      ]
    },
    {
      id: 'almaty',
      nameKey: 'calculators:electricity.cityAlmaty',
      electricStove: [
        { min: 0, max: 115, rate: 34.28 },
        { min: 115, max: 190, rate: 45.51 },
        { min: 190, max: Infinity, rate: 56.89 }
      ],
      gasStove: [
        { min: 0, max: 90, rate: 34.28 },
        { min: 90, max: 160, rate: 45.51 },
        { min: 160, max: Infinity, rate: 56.89 }
      ]
    },
    {
      id: 'shymkent',
      nameKey: 'calculators:electricity.cityShymkent',
      electricStove: [
        { min: 0, max: 110, rate: 26.1232 },
        { min: 110, max: 170, rate: 32.8744 },
        { min: 170, max: Infinity, rate: 41.0988 }
      ],
      gasStove: [
        { min: 0, max: 90, rate: 25.4968 },
        { min: 90, max: 150, rate: 32.8744 },
        { min: 150, max: Infinity, rate: 41.0988 }
      ]
    },
    {
      id: 'other',
      nameKey: 'calculators:electricity.otherRegions',
      electricStove: [
        { min: 0, max: 75, rate: 28.31 },
        { min: 75, max: 150, rate: 42.47 },
        { min: 150, max: Infinity, rate: 53.09 }
      ],
      gasStove: [
        { min: 0, max: 60, rate: 28.31 },
        { min: 60, max: 120, rate: 42.47 },
        { min: 120, max: Infinity, rate: 53.09 }
      ]
    }
  ];

  const residentsCount = Math.max(1, Math.round(parseFloat(residents) || 1));
  const tierLabel = (tier: TariffTier, n = residentsCount) => tier.max === Infinity
    ? t('electricity.tierAbove', { min: tier.min * n })
    : tier.min === 0
      ? t('electricity.tierFirst', { max: tier.max * n })
      : t('electricity.tierRange', { min: tier.min * n, max: tier.max * n });

  const calculateElectricityBill = () => {
    const kwhConsumed = parseFloat(consumption) || 0;

    if (kwhConsumed <= 0) {
      return EMPTY_RESULTS;
    }

    const selectedCity = cityTariffs.find(c => c.id === city);
    if (!selectedCity) return EMPTY_RESULTS;

    const tariffs = stoveType === 'electric' ? selectedCity.electricStove : selectedCity.gasStove;

    let totalAmount = 0;
    let remainingConsumption = kwhConsumed;
    const breakdown = [];

    for (let i = 0; i < tariffs.length; i++) {
      const tariff = tariffs[i];

      if (remainingConsumption <= 0) break;

      const tierMax = tariff.max === Infinity ? remainingConsumption : Math.min((tariff.max - tariff.min) * residentsCount, remainingConsumption);
      const tierConsumption = Math.min(tierMax, remainingConsumption);

      if (tierConsumption > 0) {
        const tierAmount = tierConsumption * tariff.rate;
        totalAmount += tierAmount;

        breakdown.push({
          tier: i + 1,
          consumption: tierConsumption,
          rate: tariff.rate,
          amount: tierAmount,
          label: tierLabel(tariff)
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

    return {
      totalAmount: Math.round(totalAmount),
      breakdown,
      averageRate: Number(averageRate.toFixed(2)),
      recommendationKey
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    calculateElectricityBill,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city, consumption, stoveType, residents, i18n.language]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₸';
  };

  const formatRate = (rate: number) => {
    return rate.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ₸/кВт·ч';
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

      <QuickAnswer calculatorId="electricity" />

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
                ariaLabel={t('electricity.consumptionVolume')}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('electricity.residentsLabel')}
              </label>
              <RangeSlider
                ariaLabel={t('electricity.residentsLabel')}
                value={residentsCount}
                onChange={(val) => setResidents(String(val))}
                min={1}
                max={10}
                step={1}
                formatValue={(v) => `${v}`}
                color="#eab308"
              />
              <p className="text-xs text-gray-500 mt-1">{t('electricity.residentsHint')}</p>
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
                    • {tierLabel(tariff)}: <strong>{formatRate(tariff.rate)}</strong>
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
                            {t('electricity.level')} {item.tier}: {item.label}
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
                    <div className="text-xs text-gray-500">{tierLabel(cityData.electricStove[0], 1)} {t('electricity.perPerson')}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    <div>{formatRate(cityData.electricStove[1].rate)}</div>
                    <div className="text-xs text-gray-500">{tierLabel(cityData.electricStove[1], 1)} {t('electricity.perPerson')}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    <div>{formatRate(cityData.electricStove[2].rate)}</div>
                    <div className="text-xs text-gray-500">{tierLabel(cityData.electricStove[2], 1)} {t('electricity.perPerson')}</div>
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
      <CalculatorExamples calculatorId="electricity" />
      <MethodologySection calculatorId="electricity" />
      <FAQSection
        items={[
          { question: t('electricity.faq.q1'), answer: t('electricity.faq.a1') },
          { question: t('electricity.faq.q2'), answer: t('electricity.faq.a2') },
          { question: t('electricity.faq.q3'), answer: t('electricity.faq.a3') },
          { question: t('electricity.faq.q4'), answer: t('electricity.faq.a4') },
          { question: t('electricity.faq.q5'), answer: t('electricity.faq.a5') }
        ]}
        sources={getSources('electricity')}
      />

      {/* Диаграмма */}
      {results && results.totalAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: i18n.language === 'kk' ? 'Электр энергиясы' : 'Электроэнергия', value: results.totalAmount },
            ]}
            title={i18n.language === 'kk' ? 'Электр энергиясы үшін төлем' : 'Оплата за электроэнергию'}
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
                    { label: 'Потребление', value: `${consumption} кВт·ч` },
                    { label: 'К оплате', value: `${results.totalAmount.toLocaleString(NUMBER_LOCALE)} ₸` },
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
      <ExpertBlock />
      <EmbedWidget
        calculatorId="electricity"
        calculatorTitle="Калькулятор электроэнергии"
      />
      <LastUpdated calculatorId="electricity" />
    </div>
  );
}
