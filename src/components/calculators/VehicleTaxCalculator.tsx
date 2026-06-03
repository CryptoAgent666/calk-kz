import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calculator, Info, Calendar } from 'lucide-react';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { getMethodology } from '../../data/calculatorMethodology';

export default function VehicleTaxCalculator() {
  const { t } = useTranslation('calculators');
  const [vehicleType, setVehicleType] = useState<'car' | 'truck' | 'bus'>('car');
  const [engineVolume, setEngineVolume] = useState<string>('2000');
  const [cargoCapacity, setCargoCapacity] = useState<string>('5');
  const [seatingCapacity, setSeatingCapacity] = useState<string>('30');
  const [vehicleAge, setVehicleAge] = useState<string>('5');
  const [applyAgeDiscount, setApplyAgeDiscount] = useState<boolean>(false);

  const [results, setResults] = useState({
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    category: '',
    isHighVolumeAfter2013: false,
    ageDiscountPercent: 0
  });

  const MRP_2026 = 4325;

  const carTaxRates = [
    { minVolume: 0, maxVolume: 1100, rate: 1, descriptionKey: 'calculators:vehicle-tax.rate_car_1' },
    { minVolume: 1101, maxVolume: 1500, rate: 2, descriptionKey: 'calculators:vehicle-tax.rate_car_2' },
    { minVolume: 1501, maxVolume: 2000, rate: 3, descriptionKey: 'calculators:vehicle-tax.rate_car_3' },
    { minVolume: 2001, maxVolume: 2500, rate: 6, descriptionKey: 'calculators:vehicle-tax.rate_car_4' },
    { minVolume: 2501, maxVolume: 3000, rate: 9, descriptionKey: 'calculators:vehicle-tax.rate_car_5' },
    { minVolume: 3001, maxVolume: 4000, rate: 15, descriptionKey: 'calculators:vehicle-tax.rate_car_6' },
    { minVolume: 4001, maxVolume: Infinity, rate: 117, descriptionKey: 'calculators:vehicle-tax.rate_car_7' }
  ];

  const truckTaxRates = [
    { minCapacity: 0, maxCapacity: 2, rate: 4, descriptionKey: 'calculators:vehicle-tax.rate_truck_1' },
    { minCapacity: 2.1, maxCapacity: 5, rate: 8, descriptionKey: 'calculators:vehicle-tax.rate_truck_2' },
    { minCapacity: 5.1, maxCapacity: 10, rate: 12, descriptionKey: 'calculators:vehicle-tax.rate_truck_3' },
    { minCapacity: 10.1, maxCapacity: 20, rate: 16, descriptionKey: 'calculators:vehicle-tax.rate_truck_4' },
    { minCapacity: 20.1, maxCapacity: Infinity, rate: 20, descriptionKey: 'calculators:vehicle-tax.rate_truck_5' }
  ];

  const busTaxRates = [
    { minSeats: 0, maxSeats: 20, rate: 8, descriptionKey: 'calculators:vehicle-tax.rate_bus_1' },
    { minSeats: 21, maxSeats: 40, rate: 12, descriptionKey: 'calculators:vehicle-tax.rate_bus_2' },
    { minSeats: 41, maxSeats: Infinity, rate: 16, descriptionKey: 'calculators:vehicle-tax.rate_bus_3' }
  ];

  const calculateVehicleTax = () => {
    let taxRate = 0;
    let taxAmount = 0;
    let category = '';
    const isHighVolumeAfter2013 = false; // С 2026 года повышенные ставки для авто после 2013 отменены

    if (vehicleType === 'car' && engineVolume) {
      const volume = parseInt(engineVolume);
      const rateInfo = carTaxRates.find(rate => volume >= rate.minVolume && volume <= rate.maxVolume);

      if (rateInfo) {
        category = t(rateInfo.descriptionKey);
        taxRate = rateInfo.rate;
        taxAmount = taxRate * MRP_2026;

        // С 2026: доплата 7 тенге за каждый куб.см свыше 1500
        if (volume > 1500) {
          const surcharge = (volume - rateInfo.minVolume + 1) * 7;
          taxAmount += surcharge;
        }
      }
    } else if (vehicleType === 'truck' && cargoCapacity) {
      const capacity = parseFloat(cargoCapacity);
      const rateInfo = truckTaxRates.find(rate => capacity >= rate.minCapacity && capacity <= rate.maxCapacity);

      if (rateInfo) {
        taxRate = rateInfo.rate;
        taxAmount = taxRate * MRP_2026;
        category = t(rateInfo.descriptionKey);
      }
    } else if (vehicleType === 'bus' && seatingCapacity) {
      const seats = parseInt(seatingCapacity);
      const rateInfo = busTaxRates.find(rate => seats >= rate.minSeats && seats <= rate.maxSeats);

      if (rateInfo) {
        taxRate = rateInfo.rate;
        taxAmount = taxRate * MRP_2026;
        category = t(rateInfo.descriptionKey);
      }
    }

    // С 2026: поправочные коэффициенты за возраст авто (0.7 при 10-20 лет, 0.5 свыше 20 лет)
    let ageDiscountPercent = 0;
    let discountAmount = 0;

    if (applyAgeDiscount && vehicleAge) {
      const age = parseInt(vehicleAge);
      if (age > 20) {
        ageDiscountPercent = 50; // коэффициент 0.5
      } else if (age >= 10) {
        ageDiscountPercent = 30; // коэффициент 0.7
      }

      discountAmount = (taxAmount * ageDiscountPercent) / 100;
    }

    const finalAmount = taxAmount - discountAmount;

    setResults({
      taxRate,
      taxAmount: Math.round(taxAmount),
      discountAmount: Math.round(discountAmount),
      finalAmount: Math.round(finalAmount),
      category,
      isHighVolumeAfter2013,
      ageDiscountPercent
    });
  };

  useEffect(() => {
    calculateVehicleTax();
  }, [vehicleType, engineVolume, cargoCapacity, seatingCapacity, vehicleAge, applyAgeDiscount]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (rate: number) => {
    return `${rate} МРП (${formatNumber(rate * MRP_2026)})`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('vehicle-tax.heading')}</h1>
            <p className="text-gray-600">{t('vehicle-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="vehicle-tax" />

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vehicle-tax.vehicleParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('vehicle-tax.vehicleType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setVehicleType('car')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'car'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Car className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{t('vehicle-tax.vehicleType_car')}</div>
                </button>
                <button
                  onClick={() => setVehicleType('truck')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    vehicleType === 'truck'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-lg mx-auto mb-1">🚛</div>
                  <div className="text-sm font-medium">{t('vehicle-tax.vehicleType_truck')}</div>
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
                  <div className="text-sm font-medium">{t('vehicle-tax.vehicleType_bus')}</div>
                </button>
              </div>
            </div>

            {vehicleType === 'car' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('vehicle-tax.engineVolume')}
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
                      placeholder={t('vehicle-tax.engineVolumePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">{t('vehicle-tax.engineVolumeUnit')}</span>
                    </div>
                  </div>
                </div>

                {/* Поле даты регистрации убрано: с 2026 повышенные ставки для авто после 2013 отменены */}
              </>
            )}

            {vehicleType === 'truck' && (
              <div>
                <label htmlFor="cargoCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('vehicle-tax.cargoCapacity')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="cargoCapacity"
                    value={cargoCapacity}
                    onChange={(e) => setCargoCapacity(e.target.value)}
                    placeholder={t('vehicle-tax.cargoCapacityPlaceholder')}
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('vehicle-tax.cargoCapacityUnit')}</span>
                  </div>
                </div>
              </div>
            )}

            {vehicleType === 'bus' && (
              <div>
                <label htmlFor="seatingCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('vehicle-tax.seatingCapacity')}
                </label>
                <input
                  type="number"
                  id="seatingCapacity"
                  value={seatingCapacity}
                  onChange={(e) => setSeatingCapacity(e.target.value)}
                  placeholder={t('vehicle-tax.seatingCapacityPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="applyAgeDiscount"
                  checked={applyAgeDiscount}
                  onChange={(e) => setApplyAgeDiscount(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="applyAgeDiscount" className="ml-2 block text-sm text-gray-700">
                  {t('vehicle-tax.applyAgeDiscount')}
                </label>
              </div>

              {applyAgeDiscount && (
                <div>
                  <label htmlFor="vehicleAge" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('vehicle-tax.vehicleAge')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="vehicleAge"
                      value={vehicleAge}
                      onChange={(e) => setVehicleAge(e.target.value)}
                      placeholder={t('vehicle-tax.vehicleAgePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">{t('vehicle-tax.vehicleAgeUnit')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('vehicle-tax.ageDiscountNote')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vehicle-tax.calculationResults')}</h2>

          <div className="space-y-4">
            {results.category && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{t('vehicle-tax.category')}</span>
                </div>
                <div className="text-blue-800">{results.category}</div>
                {/* С 2026 повышенные ставки для мощных авто отменены */}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('vehicle-tax.taxRate')}</span>
                <span className="font-semibold text-gray-900">
                  {results.taxRate > 0 ? formatMRP(results.taxRate) : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('vehicle-tax.baseTaxAmount')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.taxAmount)}</span>
              </div>

              {results.ageDiscountPercent > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('vehicle-tax.ageDiscount')} ({results.ageDiscountPercent}%)</span>
                  <span className="font-semibold text-green-600">-{formatNumber(results.discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg px-4 mt-6">
              <span className="text-lg font-semibold text-gray-900">{t('vehicle-tax.toPayBy')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-teal-600" />
                <span className="text-xl font-bold text-teal-700">{formatNumber(results.finalAmount)}</span>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4 mt-6">
              <div className="flex items-start space-x-2">
                <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-900 mb-1">
                    {t('vehicle-tax.paymentDeadlineTitle')}
                  </h3>
                  <p className="text-amber-800 text-sm">
                    {t('vehicle-tax.paymentDeadlineText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vehicle-tax.currentRates')}</h2>

        <div className="grid lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('vehicle-tax.carRates')}</h3>
            <div className="space-y-2">
              {carTaxRates.map((rate, index) => (
                <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{t(rate.descriptionKey)}</span>
                  <span className="font-medium">{rate.rate} МРП</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('vehicle-tax.truckRates')}</h3>
            <div className="space-y-2">
              {truckTaxRates.map((rate, index) => (
                <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{t(rate.descriptionKey)}</span>
                  <span className="font-medium">{rate.rate} МРП</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('vehicle-tax.busRates')}</h3>
            <div className="space-y-2">
              {busTaxRates.map((rate, index) => (
                <div key={index} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{t(rate.descriptionKey)}</span>
                  <span className="font-medium">{rate.rate} МРП</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('vehicle-tax.mrpFor2026')}</strong> {formatNumber(MRP_2026)}
            <br />
            <strong>{t('vehicle-tax.importantNote')}</strong>
          </p>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="vehicle-tax" />
      <MethodologySection steps={getMethodology('vehicle-tax')} />
      <FAQSection
        items={[
          { question: t('vehicle-tax.faq.q1'), answer: t('vehicle-tax.faq.a1') },
          { question: t('vehicle-tax.faq.q2'), answer: t('vehicle-tax.faq.a2') },
          { question: t('vehicle-tax.faq.q3'), answer: t('vehicle-tax.faq.a3') },
          { question: t('vehicle-tax.faq.q4'), answer: t('vehicle-tax.faq.a4') },
          { question: t('vehicle-tax.faq.q5'), answer: t('vehicle-tax.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК, глава 54', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'eGov.kz — Оплата налогов', url: 'https://egov.kz/' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.finalAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('vehicle-tax.heading'), value: results.finalAmount },
            ]}
            title={t('vehicle-tax.heading')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.finalAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('vehicle-tax.heading'),
              subtitle: t(`vehicle-tax.vehicleType_${vehicleType}`),
              sections: [
                {
                  title: t('vehicle-tax.calculationResults'),
                  data: [
                    { label: t('vehicle-tax.vehicleType'), value: t(`vehicle-tax.vehicleType_${vehicleType}`) },
                    ...(vehicleType === 'car' ? [{ label: t('vehicle-tax.engineVolume'), value: `${engineVolume} ${t('vehicle-tax.engineVolumeUnit')}` }] : []),
                    { label: t('vehicle-tax.toPayBy'), value: `${results.finalAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'calk.kz'
            }}
            filename="vehicle-tax-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="vehicle-tax"
        calculatorTitle="Калькулятор налога на транспорт"
      />
      <LastUpdated calculatorId="vehicle-tax" />
    </div>
  );
}
