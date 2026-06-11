import React, { useState, useEffect } from 'react';
import { Truck, Calculator, DollarSign, AlertTriangle, Info, Calendar, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { getMethodology } from '../../data/calculatorMethodology';

export default function CustomsClearanceCalculator() {
  const { t } = useTranslation('calculators');
  const [manufactureYear, setManufactureYear] = useState<string>('2020');
  const [engineVolume, setEngineVolume] = useState<string>('2000');
  const [customsValue, setCustomsValue] = useState<string>('15000');
  const [currency, setCurrency] = useState<'USD' | 'KZT'>('USD');
  const [exchangeRate, setExchangeRate] = useState<string>('470');

  const [results, setResults] = useState({
    customsValueKZT: 0,
    customsFee: 0,
    customsDuty: 0,
    vat: 0,
    totalPayments: 0,
    vehicleAge: 0,
    isOldVehicle: false,
    additionalRestrictions: ''
  });

  // НК РК / ПП РК от 05.04.2018 № 171 (ред. ПП № 631 от 02.08.2023): таможенный сбор
  // за таможенное декларирование товаров — ФИКСИРОВАННЫЙ 6 МРП за декларацию,
  // не зависит от таможенной стоимости. МРП на 2026 = 4325 ₸ (Закон № 239-VIII
  // от 08.12.2025). Итого 6 × 4325 = 25 950 ₸.
  // Источник: https://adilet.zan.kz/rus/docs/P1800000171
  const MRP_2026 = 4325;
  const CUSTOMS_FEE_MRP = 6;

  const calculateCustomsPayments = () => {
    const value = parseFloat(customsValue) || 0;
    const volume = parseInt(engineVolume) || 0;
    const year = parseInt(manufactureYear) || new Date().getFullYear();
    const rate = parseFloat(exchangeRate) || 470;

    if (value <= 0) {
      setResults({
        customsValueKZT: 0, customsFee: 0, customsDuty: 0,
        vat: 0, totalPayments: 0, vehicleAge: 0,
        isOldVehicle: false, additionalRestrictions: ''
      });
      return;
    }

    const customsValueKZT = currency === 'USD' ? value * rate : value;

    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(0, currentYear - year);
    const isOldVehicle = vehicleAge > 7;

    let customsDutyRate = 0.15;
    let vatRate = 0.16;

    if (isOldVehicle) {
      customsDutyRate = 0.25;
    }

    if (volume > 3000) {
      customsDutyRate += 0.05;
    }

    // Фиксированный таможенный сбор за декларирование: 6 МРП за декларацию
    // (не процент от стоимости).
    const customsFee = CUSTOMS_FEE_MRP * MRP_2026;
    const customsDuty = customsValueKZT * customsDutyRate;

    const taxBase = customsValueKZT + customsDuty + customsFee;
    const vat = taxBase * vatRate;

    const totalPayments = customsFee + customsDuty + vat;

    let additionalRestrictions = '';
    if (isOldVehicle && volume > 2500) {
      additionalRestrictions = t('customs-clearance.oldVehicleEcoFee');
    } else if (isOldVehicle) {
      additionalRestrictions = t('customs-clearance.oldVehicleHigherRates');
    }

    setResults({
      customsValueKZT: Math.round(customsValueKZT),
      customsFee: Math.round(customsFee),
      customsDuty: Math.round(customsDuty),
      vat: Math.round(vat),
      totalPayments: Math.round(totalPayments),
      vehicleAge,
      isOldVehicle,
      additionalRestrictions
    });
  };

  useEffect(() => {
    calculateCustomsPayments();
  }, [manufactureYear, engineVolume, customsValue, currency, exchangeRate]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatUSD = (num: number) => {
    return '$' + num.toLocaleString('en-US');
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('customs-clearance.title')}</h1>
            <p className="text-gray-600">{t('customs-clearance.description')}</p>
          </div>
        </div>
      </div>

      {/* Warning Section */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('customs-clearance.importantInfo')}
            </h3>
            <div className="text-amber-800 space-y-2">
              <p>
                {t('customs-clearance.warningText1')}
              </p>
              <p>
                {t('customs-clearance.warningText2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="customs-clearance" />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('customs-clearance.vehicleParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="manufactureYear" className="block text-sm font-medium text-gray-700 mb-2">
                {t('customs-clearance.manufactureYear')}
              </label>
              <input
                type="number"
                id="manufactureYear"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
                placeholder={t('customs-clearance.enterYear')}
                min="1990"
                max={currentYear}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('customs-clearance.engineVolume')}
              </label>
              <RangeSlider
                value={parseFloat(engineVolume) || 0}
                onChange={(val) => setEngineVolume(String(val))}
                min={500}
                max={7000}
                step={100}
                formatValue={(v) => `${v} см³`}
                color="#6366f1"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="engineVolume"
                  value={engineVolume}
                  onChange={(e) => setEngineVolume(e.target.value)}
                  placeholder={t('customs-clearance.enterVolume')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('customs-clearance.cubicCm')}</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="customsValue" className="block text-sm font-medium text-gray-700 mb-2">
                {t('customs-clearance.customsValue')}
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    id="customsValue"
                    value={customsValue}
                    onChange={(e) => setCustomsValue(e.target.value)}
                    placeholder={t('customs-clearance.enterValue')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{currency}</span>
                  </div>
                </div>
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      currency === 'USD'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } rounded-l-lg`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setCurrency('KZT')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      currency === 'KZT'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } rounded-r-lg`}
                  >
                    KZT
                  </button>
                </div>
              </div>
            </div>

            {currency === 'USD' && (
              <div>
                <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customs-clearance.exchangeRate')}
                </label>
                <input
                  type="number"
                  id="exchangeRate"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder={t('customs-clearance.exchangeRatePlaceholder')}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('customs-clearance.useActualRate')}
                </p>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('customs-clearance.baseRates')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>{t('customs-clearance.customsFeeRate')}</li>
                <li>{t('customs-clearance.customsDutyRate')}</li>
                <li>{t('customs-clearance.vatRate')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('customs-clearance.calculationResults')}</h2>

          <div className="space-y-4">
            {results.vehicleAge > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{t('customs-clearance.vehicleAge')}</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {results.vehicleAge} {results.vehicleAge === 1 ? t('customs-clearance.year') : results.vehicleAge < 5 ? t('customs-clearance.years2to4') : t('customs-clearance.years5plus')}
                </div>
                {results.isOldVehicle && (
                  <div className="text-xs text-orange-600 mt-1">
                    {t('customs-clearance.higherRatesApplied')}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('customs-clearance.valueInTenge')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.customsValueKZT)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('customs-clearance.customsFee')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.customsFee)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">
                  {t('customs-clearance.customsDuty')} {results.isOldVehicle ? '(25%)' : '(15%)'}
                </span>
                <span className="font-semibold text-gray-900">{formatNumber(results.customsDuty)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('customs-clearance.vat')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.vat)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-4 mt-6">
              <span className="text-lg font-semibold text-gray-900">{t('customs-clearance.totalAmount')}</span>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-700">{formatNumber(results.totalPayments)}</span>
              </div>
            </div>

            {currency === 'USD' && results.totalPayments > 0 && (
              <div className="text-center text-gray-600">
                ≈ {formatUSD(Math.round(results.totalPayments / parseFloat(exchangeRate)))}
              </div>
            )}

            {results.additionalRestrictions && (
              <div className="bg-orange-50 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-900 mb-1">
                      {t('customs-clearance.additionalRestrictions')}
                    </h3>
                    <p className="text-orange-800 text-sm">
                      {results.additionalRestrictions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('customs-clearance.additionalInfo')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('customs-clearance.documentsTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('customs-clearance.document1')}</li>
                  <li>{t('customs-clearance.document2')}</li>
                  <li>{t('customs-clearance.document3')}</li>
                  <li>{t('customs-clearance.document4')}</li>
                  <li>{t('customs-clearance.document5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('customs-clearance.importantPointsTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('customs-clearance.importantPoint1')}</li>
                  <li>{t('customs-clearance.importantPoint2')}</li>
                  <li>{t('customs-clearance.importantPoint3')}</li>
                  <li>{t('customs-clearance.importantPoint4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="customs-clearance" />
      <MethodologySection steps={getMethodology('customs-clearance')} />
      <FAQSection
        items={[
          { question: t('customs-clearance.faq.q1'), answer: t('customs-clearance.faq.a1') },
          { question: t('customs-clearance.faq.q2'), answer: t('customs-clearance.faq.a2') },
          { question: t('customs-clearance.faq.q3'), answer: t('customs-clearance.faq.a3') },
          { question: t('customs-clearance.faq.q4'), answer: t('customs-clearance.faq.a4') },
          { question: t('customs-clearance.faq.q5'), answer: t('customs-clearance.faq.a5') }
        ]}
        sources={[
          { title: t('customs-clearance.sources.kgd'), url: 'https://kgd.gov.kz/' },
          { title: t('customs-clearance.sources.customsCode'), url: 'https://online.zakon.kz/document/?doc_id=37508292' },
        ]}
      />

      {/* Диаграмма структуры платежей */}
      {results && results.totalPayments > 0 && results.customsDuty && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('customs-clearance.chart.customsDuty'), value: results.customsDuty },
              { name: t('customs-clearance.chart.vat'), value: results.vat || 0 },
            ].filter(item => item.value > 0)}
            title={t('customs-clearance.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalPayments > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('customs-clearance.export.title'),
              subtitle: t('customs-clearance.description'),
              sections: [
                {
                  title: t('customs-clearance.export.results'),
                  data: [
                    { label: t('customs-clearance.chart.customsDuty'), value: `${results.customsDuty?.toLocaleString()} ₸` },
                    { label: t('customs-clearance.chart.vat'), value: `${results.vat?.toLocaleString()} ₸` },
                    { label: t('customs-clearance.export.total'), value: `${results.totalPayments.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('customs-clearance.export.footer')
            }}
            filename="customs-clearance-calculation"
          />
        </div>
      )}

      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="customs-clearance"
        calculatorTitle={t('customs-clearance.title')}
      />
      <LastUpdated calculatorId="customs-clearance" />
    </div>
  );
}
