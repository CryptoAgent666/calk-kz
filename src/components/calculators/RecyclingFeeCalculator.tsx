import React, { useState, useEffect } from 'react';
import { Recycle, Calculator, Zap, Truck, Car, Info, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';

export default function RecyclingFeeCalculator() {
  const { t } = useTranslation('calculators');
  const [vehicleType, setVehicleType] = useState<'car' | 'truck' | 'bus'>('car');
  const [engineVolume, setEngineVolume] = useState<string>('1500');
  const [totalMass, setTotalMass] = useState<string>('');
  const [isElectric, setIsElectric] = useState<boolean>(false);

  const [results, setResults] = useState({
    coefficient: 0,
    fee: 0,
    category: '',
    isExempt: false
  });

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const BASE_RATE_MRP = 50;
  const BASE_RATE_KZT = BASE_RATE_MRP * MRP_2026; // 196,600 тенге

  // Коэффициенты для легковых автомобилей
  const carCoefficients = [
    { minVolume: 0, maxVolume: 1000, coefficient: 1.5, description: t('recycling-fee.coefficients.car.upTo1000') },
    { minVolume: 1001, maxVolume: 2000, coefficient: 3.5, description: t('recycling-fee.coefficients.car.upTo2000') },
    { minVolume: 2001, maxVolume: 3000, coefficient: 5.0, description: t('recycling-fee.coefficients.car.upTo3000') },
    { minVolume: 3001, maxVolume: Infinity, coefficient: 11.5, description: t('recycling-fee.coefficients.car.over3000') }
  ];

  // Коэффициенты для грузовых автомобилей
  const truckCoefficients = [
    { minMass: 0, maxMass: 2.5, coefficient: 3.5, description: t('recycling-fee.coefficients.truck.upTo2_5') },
    { minMass: 2.6, maxMass: 3.5, coefficient: 7.5, description: t('recycling-fee.coefficients.truck.upTo3_5') },
    { minMass: 20.1, maxMass: 50, coefficient: 20.5, description: t('recycling-fee.coefficients.truck.upTo50') }
  ];

  // Коэффициенты для автобусов
  const busCoefficients = [
    { minVolume: 0, maxVolume: 2500, coefficient: 4.0, description: t('recycling-fee.coefficients.bus.upTo2500') },
    { minVolume: 10001, maxVolume: Infinity, coefficient: 13.5, description: t('recycling-fee.coefficients.bus.over10000') }
  ];

  const calculateFee = () => {
    if (isElectric) {
      setResults({
        coefficient: 0,
        fee: 0,
        category: t('recycling-fee.electricVehicle'),
        isExempt: true
      });
      return;
    }

    let coefficient = 0;
    let category = '';

    if (vehicleType === 'car' && engineVolume) {
      const volume = parseInt(engineVolume);
      const coeffInfo = carCoefficients.find(c => volume >= c.minVolume && volume <= c.maxVolume);

      if (coeffInfo) {
        coefficient = coeffInfo.coefficient;
        category = `${t('recycling-fee.vehicleTypes.car')}, ${coeffInfo.description}`;
      }
    } else if (vehicleType === 'truck' && totalMass) {
      const mass = parseFloat(totalMass);
      const coeffInfo = truckCoefficients.find(c => mass >= c.minMass && mass <= c.maxMass);

      if (coeffInfo) {
        coefficient = coeffInfo.coefficient;
        category = `${t('recycling-fee.vehicleTypes.truck')}, ${coeffInfo.description}`;
      }
    } else if (vehicleType === 'bus' && engineVolume) {
      const volume = parseInt(engineVolume);
      const coeffInfo = busCoefficients.find(c => volume >= c.minVolume && volume <= c.maxVolume);

      if (coeffInfo) {
        coefficient = coeffInfo.coefficient;
        category = `${t('recycling-fee.vehicleTypes.bus')}, ${coeffInfo.description}`;
      }
    }

    const fee = BASE_RATE_KZT * coefficient;

    setResults({
      coefficient,
      fee: Math.round(fee),
      category,
      isExempt: false
    });
  };

  useEffect(() => {
    calculateFee();
  }, [vehicleType, engineVolume, totalMass, isElectric]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (coefficient: number) => {
    return `${BASE_RATE_MRP} ${t('recycling-fee.mrp')} × ${coefficient} = ${formatNumber(BASE_RATE_KZT * coefficient)}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('recycling-fee.title')}</h1>
            <p className="text-gray-600">{t('recycling-fee.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('recycling-fee.vehicleParameters')}</h2>

          <div className="space-y-6">
            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('recycling-fee.vehicleType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setVehicleType('car')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'car'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Car className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{t('recycling-fee.vehicleTypes.car')}</div>
                </button>
                <button
                  onClick={() => setVehicleType('truck')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'truck'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Truck className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{t('recycling-fee.vehicleTypes.truck')}</div>
                </button>
                <button
                  onClick={() => setVehicleType('bus')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'bus'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-lg mx-auto mb-1">🚌</div>
                  <div className="text-sm font-medium">{t('recycling-fee.vehicleTypes.bus')}</div>
                </button>
              </div>
            </div>

            {/* Electric Vehicle Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isElectric"
                checked={isElectric}
                onChange={(e) => setIsElectric(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isElectric" className="ml-2 block text-sm text-gray-700">
                {t('recycling-fee.electricVehicleExemption')}
              </label>
              <Zap className="w-4 h-4 text-green-500 ml-1" />
            </div>

            {/* Conditional inputs based on vehicle type */}
            {!isElectric && (vehicleType === 'car' || vehicleType === 'bus') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recycling-fee.engineVolume')}
                </label>
                <RangeSlider
                  value={parseFloat(engineVolume) || 0}
                  onChange={(val) => setEngineVolume(String(val))}
                  min={500}
                  max={7000}
                  step={100}
                  formatValue={(v) => `${v} см³`}
                  color="#f97316"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="engineVolume"
                    value={engineVolume}
                    onChange={(e) => setEngineVolume(e.target.value)}
                    placeholder={t('recycling-fee.enterVolume')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('recycling-fee.cm3')}</span>
                  </div>
                </div>
              </div>
            )}

            {!isElectric && vehicleType === 'truck' && (
              <div>
                <label htmlFor="totalMass" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recycling-fee.totalMass')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="totalMass"
                    value={totalMass}
                    onChange={(e) => setTotalMass(e.target.value)}
                    placeholder={t('recycling-fee.enterMass')}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('recycling-fee.tons')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('recycling-fee.baseRate2025')}</h3>
              <p className="text-sm text-blue-800">
                50 {t('recycling-fee.mrp')} = <strong>{formatNumber(BASE_RATE_KZT)}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {t('recycling-fee.totalFormula')}
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('recycling-fee.calculationResults')}</h2>

          <div className="space-y-4">
            {results.category && (
              <div className={`rounded-lg p-4 ${results.isExempt ? 'bg-green-50' : 'bg-blue-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {results.isExempt ? (
                    <Zap className="w-5 h-5 text-green-600" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600" />
                  )}
                  <span className={`text-sm font-medium ${results.isExempt ? 'text-green-900' : 'text-blue-900'}`}>
                    {t('recycling-fee.category')}
                  </span>
                </div>
                <div className={results.isExempt ? 'text-green-800' : 'text-blue-800'}>
                  {results.category}
                </div>
              </div>
            )}

            {results.isExempt ? (
              <div className="flex justify-between items-center py-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
                <span className="text-lg font-semibold text-gray-900">{t('recycling-fee.recyclingFee')}</span>
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <span className="text-xl font-bold text-green-700">{t('recycling-fee.exemption')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('recycling-fee.baseRate')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(BASE_RATE_KZT)}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('recycling-fee.coefficient')}</span>
                  <span className="font-semibold text-gray-900">{results.coefficient}</span>
                </div>

                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4 mt-6">
                  <span className="text-lg font-semibold text-gray-900">{t('recycling-fee.toPay')}</span>
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-bold text-green-700">{formatNumber(results.fee)}</span>
                  </div>
                </div>

                {results.coefficient > 0 && (
                  <div className="text-center text-sm text-gray-600 mt-2">
                    {formatMRP(results.coefficient)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coefficients Tables */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('recycling-fee.coefficientsTitle')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Car Coefficients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recycling-fee.coefficients.carTitle')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 px-3 bg-green-100 rounded font-medium">
                <span className="text-green-800">{t('recycling-fee.electricVehicles')}</span>
                <span className="text-green-700">{t('recycling-fee.zeroExemption')}</span>
              </div>
              {carCoefficients.map((coeff, index) => (
                <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{coeff.description}</span>
                  <span className="font-medium">{coeff.coefficient}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Truck Coefficients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recycling-fee.coefficients.truckTitle')}</h3>
            <div className="space-y-2">
              {truckCoefficients.map((coeff, index) => (
                <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{coeff.description}</span>
                  <span className="font-medium">{coeff.coefficient}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bus Coefficients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('recycling-fee.coefficients.busTitle')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 px-3 bg-green-100 rounded font-medium">
                <span className="text-green-800">{t('recycling-fee.electricVehicles')}</span>
                <span className="text-green-700">{t('recycling-fee.zeroExemption')}</span>
              </div>
              {busCoefficients.map((coeff, index) => (
                <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{coeff.description}</span>
                  <span className="font-medium">{coeff.coefficient}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('recycling-fee.important')}</strong> {t('recycling-fee.importantText')}
            <br />
            <strong>{t('recycling-fee.baseRate2025')}</strong> 50 {t('recycling-fee.mrp')} = {formatNumber(BASE_RATE_KZT)}
          </p>
        </div>
      </div>

      {/* Диаграмма */}
      {results.totalFee > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('recycling-fee.chart.recyclingFee'), value: results.totalFee },
            ]}
            title={t('recycling-fee.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.totalFee > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('recycling-fee.export.title'),
              subtitle: vehicleType === 'car' ? t('recycling-fee.vehicleTypes.car') : vehicleType === 'truck' ? t('recycling-fee.vehicleTypes.truck') : t('recycling-fee.vehicleTypes.bus'),
              sections: [
                {
                  title: t('recycling-fee.export.parameters'),
                  data: [
                    { label: t('recycling-fee.export.vehicleType'), value: vehicleType },
                    { label: t('recycling-fee.export.engineVolume'), value: `${engineVolume} ${t('recycling-fee.units.cm3')}` },
                    { label: t('recycling-fee.export.isElectric'), value: isElectric ? t('recycling-fee.yes') : t('recycling-fee.no') },
                  ]
                },
                {
                  title: t('recycling-fee.export.results'),
                  data: [
                    { label: t('recycling-fee.export.coefficient'), value: results.coefficient.toString() },
                    { label: t('recycling-fee.export.feeAmount'), value: `${results.totalFee.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('recycling-fee.export.footer')
            }}
            filename="recycling-fee-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('recycling-fee.faq.q1'), answer: t('recycling-fee.faq.a1') },
          { question: t('recycling-fee.faq.q2'), answer: t('recycling-fee.faq.a2') },
          { question: t('recycling-fee.faq.q3'), answer: t('recycling-fee.faq.a3') },
          { question: t('recycling-fee.faq.q4'), answer: t('recycling-fee.faq.a4') },
          { question: t('recycling-fee.faq.q5'), answer: t('recycling-fee.faq.a5') }
        ]}
        sources={[
          { title: t('recycling-fee.sources.law'), url: 'https://online.zakon.kz/document/?doc_id=31575861' },
          { title: t('recycling-fee.sources.rop'), url: 'https://rop.gov.kz/' },
        ]}
      />

      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="recycling-fee"
        calculatorTitle={t('recycling-fee.title')}
      />
    </div>
  );
}
