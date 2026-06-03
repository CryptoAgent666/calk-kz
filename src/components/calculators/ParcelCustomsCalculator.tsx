import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Calculator, Info, AlertTriangle, Scale } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

const VALUE_LIMIT_EUR = 200;
const WEIGHT_LIMIT_KG = 31;
const DUTY_RATE_VALUE = 0.15;
const DUTY_RATE_WEIGHT = 2;
const DEFAULT_EUR_RATE = 553.75;
const DEFAULT_USD_RATE = 469.52;

export default function ParcelCustomsCalculator() {
  const { t } = useTranslation('calculators');

  const [itemValue, setItemValue] = useState<string>('300');
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'KZT'>('EUR');
  const [eurRate, setEurRate] = useState<number>(DEFAULT_EUR_RATE);
  const [usdRate, setUsdRate] = useState<number>(DEFAULT_USD_RATE);
  const [itemWeight, setItemWeight] = useState<string>('');
  const [deliveryCost, setDeliveryCost] = useState<string>('');

  const [results, setResults] = useState({
    valueInEur: 0,
    valueInKzt: 0,
    weightKg: 0,
    isValueExceeded: false,
    isWeightExceeded: false,
    valueExcess: 0,
    weightExcess: 0,
    dutyByValue: 0,
    dutyByWeight: 0,
    totalDutyEur: 0,
    totalDutyKzt: 0,
    totalCostKzt: 0,
    isDutyFree: true,
    effectiveDutyRate: 0
  });

  const calculateDuty = () => {
    const value = parseFloat(itemValue) || 0;
    const weight = parseFloat(itemWeight) || 0;
    const delivery = parseFloat(deliveryCost) || 0;

    if (value <= 0) {
      setResults({
        valueInEur: 0, valueInKzt: 0, weightKg: 0,
        isValueExceeded: false, isWeightExceeded: false,
        valueExcess: 0, weightExcess: 0,
        dutyByValue: 0, dutyByWeight: 0,
        totalDutyEur: 0, totalDutyKzt: 0,
        totalCostKzt: 0, isDutyFree: true, effectiveDutyRate: 0
      });
      return;
    }

    let valueInEur: number;
    if (currency === 'KZT') {
      valueInEur = value / eurRate;
    } else if (currency === 'USD') {
      valueInEur = value * usdRate / eurRate;
    } else {
      valueInEur = value;
    }

    let deliveryEur: number;
    if (currency === 'KZT') {
      deliveryEur = delivery / eurRate;
    } else if (currency === 'USD') {
      deliveryEur = delivery * usdRate / eurRate;
    } else {
      deliveryEur = delivery;
    }

    const totalValueEur = valueInEur + deliveryEur;

    const isValueExceeded = totalValueEur > VALUE_LIMIT_EUR;
    const isWeightExceeded = weight > WEIGHT_LIMIT_KG;

    const valueExcess = Math.max(0, totalValueEur - VALUE_LIMIT_EUR);
    const weightExcess = Math.max(0, weight - WEIGHT_LIMIT_KG);

    const dutyByValue = valueExcess * DUTY_RATE_VALUE;
    const dutyByWeight = weightExcess * DUTY_RATE_WEIGHT;

    const totalDutyEur = Math.max(dutyByValue, dutyByWeight);
    const totalDutyKzt = totalDutyEur * eurRate;
    const isDutyFree = totalDutyEur === 0;

    const valueInKzt = totalValueEur * eurRate;
    const totalCostKzt = valueInKzt + totalDutyKzt;
    const effectiveDutyRate = valueInKzt > 0 ? (totalDutyKzt / valueInKzt) * 100 : 0;

    setResults({
      valueInEur: Math.round(totalValueEur * 100) / 100,
      valueInKzt: Math.round(valueInKzt),
      weightKg: weight,
      isValueExceeded,
      isWeightExceeded,
      valueExcess: Math.round(valueExcess * 100) / 100,
      weightExcess: Math.round(weightExcess * 100) / 100,
      dutyByValue: Math.round(dutyByValue * 100) / 100,
      dutyByWeight: Math.round(dutyByWeight * 100) / 100,
      totalDutyEur: Math.round(totalDutyEur * 100) / 100,
      totalDutyKzt: Math.round(totalDutyKzt),
      totalCostKzt: Math.round(totalCostKzt),
      isDutyFree,
      effectiveDutyRate: Number(effectiveDutyRate.toFixed(2))
    });
  };

  useEffect(() => {
    calculateDuty();
  }, [itemValue, currency, eurRate, usdRate, itemWeight, deliveryCost]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatEur = (num: number) => {
    return '€' + num.toLocaleString('ru-KZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getSliderMax = () => {
    if (currency === 'KZT') return 1000000;
    if (currency === 'USD') return 2000;
    return 2000;
  };

  const getSliderStep = () => {
    if (currency === 'KZT') return 1000;
    if (currency === 'USD') return 10;
    return 10;
  };

  const getSliderFormat = () => {
    if (currency === 'KZT') return (v: number) => `${v.toLocaleString()} ₸`;
    if (currency === 'USD') return (v: number) => `$${v.toLocaleString()}`;
    return (v: number) => `€${v.toLocaleString()}`;
  };

  const getCurrencySymbol = () => {
    if (currency === 'KZT') return '₸';
    if (currency === 'USD') return '$';
    return '€';
  };

  const applyQuickExample = (val: number, curr: 'EUR' | 'USD' | 'KZT', w?: number) => {
    setCurrency(curr);
    setItemValue(String(val));
    if (w) setItemWeight(String(w));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="parcel-customs" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('parcel-customs.title')}</h1>
            <p className="text-gray-600">{t('parcel-customs.description')}</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('parcel-customs.limitsTitle')}
            </h3>
            <div className="text-amber-800 space-y-2">
              <p>
                {t('parcel-customs.limitsValue', { limit: VALUE_LIMIT_EUR })}
              </p>
              <p>
                {t('parcel-customs.limitsWeight', { limit: WEIGHT_LIMIT_KG })}
              </p>
              <p>
                {t('parcel-customs.limitsNote')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('parcel-customs.inputTitle')}</h2>

          <div className="space-y-6">
            {/* Currency Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('parcel-customs.currency')}
              </label>
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setCurrency('EUR')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    currency === 'EUR'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-l-lg`}
                >
                  EUR (€)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    currency === 'USD'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('KZT')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    currency === 'KZT'
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } rounded-r-lg`}
                >
                  KZT (₸)
                </button>
              </div>
            </div>

            {/* Item Value Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('parcel-customs.itemValue')}
              </label>
              <RangeSlider
                value={parseFloat(itemValue) || 0}
                onChange={(val) => setItemValue(String(val))}
                min={0}
                max={getSliderMax()}
                step={getSliderStep()}
                formatValue={getSliderFormat()}
                color="#f59e0b"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="itemValue"
                  value={itemValue}
                  onChange={(e) => setItemValue(e.target.value)}
                  placeholder={t('parcel-customs.enterValue')}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{getCurrencySymbol()}</span>
                </div>
              </div>
            </div>

            {/* EUR Rate */}
            <div>
              <label htmlFor="eurRate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parcel-customs.eurRate')}
              </label>
              <input
                type="number"
                id="eurRate"
                value={eurRate}
                onChange={(e) => setEurRate(parseFloat(e.target.value) || DEFAULT_EUR_RATE)}
                placeholder={String(DEFAULT_EUR_RATE)}
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('parcel-customs.rateHint')}
              </p>
            </div>

            {/* USD Rate (conditional) */}
            {currency === 'USD' && (
              <div>
                <label htmlFor="usdRate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('parcel-customs.usdRate')}
                </label>
                <input
                  type="number"
                  id="usdRate"
                  value={usdRate}
                  onChange={(e) => setUsdRate(parseFloat(e.target.value) || DEFAULT_USD_RATE)}
                  placeholder={String(DEFAULT_USD_RATE)}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>
            )}

            {/* Weight */}
            <div>
              <label htmlFor="itemWeight" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parcel-customs.itemWeight')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="itemWeight"
                  value={itemWeight}
                  onChange={(e) => setItemWeight(e.target.value)}
                  placeholder={t('parcel-customs.enterWeight')}
                  min="0.1"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('parcel-customs.kg')}</span>
                </div>
              </div>
            </div>

            {/* Delivery Cost */}
            <div>
              <label htmlFor="deliveryCost" className="block text-sm font-medium text-gray-700 mb-2">
                {t('parcel-customs.deliveryCost')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="deliveryCost"
                  value={deliveryCost}
                  onChange={(e) => setDeliveryCost(e.target.value)}
                  placeholder={t('parcel-customs.enterDelivery')}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{getCurrencySymbol()}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('parcel-customs.deliveryHint')}
              </p>
            </div>

            {/* Quick Examples */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('parcel-customs.quickExamples')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyQuickExample(50, 'USD', 0.5)}
                  className="px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  AliExpress $50
                </button>
                <button
                  onClick={() => applyQuickExample(999, 'USD', 0.3)}
                  className="px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  iPhone $999
                </button>
                <button
                  onClick={() => applyQuickExample(1500, 'USD', 2.5)}
                  className="px-3 py-2 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  Laptop $1500
                </button>
              </div>
            </div>

            {/* Info about limits */}
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-900 mb-2">{t('parcel-customs.currentLimits')}</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>{t('parcel-customs.limitValueLine', { limit: VALUE_LIMIT_EUR })}</li>
                <li>{t('parcel-customs.limitWeightLine', { limit: WEIGHT_LIMIT_KG })}</li>
                <li>{t('parcel-customs.dutyValueLine')}</li>
                <li>{t('parcel-customs.dutyWeightLine')}</li>
                <li>{t('parcel-customs.dutyHigherLine')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('parcel-customs.resultsTitle')}</h2>

          <div className="space-y-4">
            {/* Big Result */}
            {results.isDutyFree ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {t('parcel-customs.customsDuty')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Package className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">
                      {t('parcel-customs.dutyFree')}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {t('parcel-customs.dutyFreeDescription')}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {t('parcel-customs.customsDuty')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-6 h-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-700">
                      {formatNumber(results.totalDutyKzt)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatEur(results.totalDutyEur)}
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('parcel-customs.valueInEur')}</span>
                <span className="font-semibold text-gray-900">{formatEur(results.valueInEur)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('parcel-customs.valueInKzt')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.valueInKzt)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('parcel-customs.weight')}</span>
                <span className="font-semibold text-gray-900">
                  {results.weightKg > 0 ? `${results.weightKg} ${t('parcel-customs.kg')}` : '-'}
                </span>
              </div>

              {results.isValueExceeded && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('parcel-customs.excessValue')}</span>
                  <span className="font-semibold text-red-600">{formatEur(results.valueExcess)}</span>
                </div>
              )}

              {results.isWeightExceeded && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('parcel-customs.excessWeight')}</span>
                  <span className="font-semibold text-red-600">
                    {results.weightExcess.toFixed(1)} {t('parcel-customs.kg')}
                  </span>
                </div>
              )}

              {!results.isDutyFree && (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">
                      {t('parcel-customs.dutyByValue')} (15%)
                    </span>
                    <span className={`font-semibold ${results.dutyByValue >= results.dutyByWeight ? 'text-red-600' : 'text-gray-500'}`}>
                      {formatEur(results.dutyByValue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">
                      {t('parcel-customs.dutyByWeight')} (2 EUR/{t('parcel-customs.kg')})
                    </span>
                    <span className={`font-semibold ${results.dutyByWeight >= results.dutyByValue ? 'text-red-600' : 'text-gray-500'}`}>
                      {formatEur(results.dutyByWeight)}
                    </span>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Scale className="w-4 h-4 text-yellow-700" />
                      <span className="text-sm font-medium text-yellow-900">
                        {results.dutyByValue >= results.dutyByWeight
                          ? t('parcel-customs.dutyByValueApplied')
                          : t('parcel-customs.dutyByWeightApplied')}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Total Cost */}
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg px-4 mt-4">
              <span className="text-lg font-semibold text-gray-900">{t('parcel-customs.totalCost')}</span>
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span className="text-xl font-bold text-amber-700">{formatNumber(results.totalCostKzt)}</span>
              </div>
            </div>

            {/* Effective Duty Rate */}
            {results.effectiveDutyRate > 0 && (
              <div className="text-center text-gray-600 text-sm">
                {t('parcel-customs.effectiveRate')}: {results.effectiveDutyRate}%
              </div>
            )}

            {/* Duty Free Info */}
            {results.isDutyFree && results.valueInEur > 0 && (
              <div className="bg-green-50 rounded-lg p-4 mt-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">{t('parcel-customs.dutyFreeTitle')}</h3>
                    <p className="text-green-800 text-sm">
                      {t('parcel-customs.dutyFreeText')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if exceeded */}
            {!results.isDutyFree && (
              <div className="bg-red-50 rounded-lg p-4 mt-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">{t('parcel-customs.dutyWarningTitle')}</h3>
                    <p className="text-red-800 text-sm">
                      {t('parcel-customs.dutyWarningText')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('parcel-customs.infoTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('parcel-customs.limitsExplainTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('parcel-customs.limitsExplain1')}</li>
                  <li>{t('parcel-customs.limitsExplain2')}</li>
                  <li>{t('parcel-customs.limitsExplain3')}</li>
                  <li>{t('parcel-customs.limitsExplain4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('parcel-customs.eaeuRulesTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('parcel-customs.eaeuRule1')}</li>
                  <li>{t('parcel-customs.eaeuRule2')}</li>
                  <li>{t('parcel-customs.eaeuRule3')}</li>
                  <li>{t('parcel-customs.eaeuRule4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {results.totalDutyKzt > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('parcel-customs.chart.itemCost'), value: results.valueInKzt },
              { name: t('parcel-customs.chart.duty'), value: results.totalDutyKzt },
            ]}
            title={t('parcel-customs.chart.title')}
          />
        </div>
      )}

      {/* Export Buttons */}
      {results.totalDutyKzt > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('parcel-customs.export.title'),
              subtitle: `${getCurrencySymbol()}${itemValue || '0'}`,
              sections: [
                {
                  title: t('parcel-customs.export.parameters'),
                  data: [
                    { label: t('parcel-customs.itemValue'), value: `${getCurrencySymbol()}${parseFloat(itemValue || '0').toLocaleString()}` },
                    { label: t('parcel-customs.itemWeight'), value: `${itemWeight || '0'} ${t('parcel-customs.kg')}` },
                    { label: t('parcel-customs.deliveryCost'), value: `${getCurrencySymbol()}${parseFloat(deliveryCost || '0').toLocaleString()}` },
                    { label: t('parcel-customs.valueInEur'), value: formatEur(results.valueInEur) },
                  ]
                },
                {
                  title: t('parcel-customs.export.results'),
                  data: [
                    { label: t('parcel-customs.dutyByValue'), value: formatEur(results.dutyByValue) },
                    { label: t('parcel-customs.dutyByWeight'), value: formatEur(results.dutyByWeight) },
                    { label: t('parcel-customs.customsDuty'), value: `${formatNumber(results.totalDutyKzt)} (${formatEur(results.totalDutyEur)})` },
                    { label: t('parcel-customs.totalCost'), value: formatNumber(results.totalCostKzt) },
                  ]
                }
              ],
              footer: t('parcel-customs.export.footer')
            }}
            filename="parcel-customs-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="parcel-customs" />
      <MethodologySection steps={getMethodology('parcel-customs')} />
      <FAQSection
        items={[
          { question: t('parcel-customs.faq.q1'), answer: t('parcel-customs.faq.a1') },
          { question: t('parcel-customs.faq.q2'), answer: t('parcel-customs.faq.a2') },
          { question: t('parcel-customs.faq.q3'), answer: t('parcel-customs.faq.a3') },
          { question: t('parcel-customs.faq.q4'), answer: t('parcel-customs.faq.a4') },
          { question: t('parcel-customs.faq.q5'), answer: t('parcel-customs.faq.a5') }
        ]}
        sources={[
          { title: t('parcel-customs.sources.eaeu'), url: 'https://www.eaeunion.org/' },
          { title: t('parcel-customs.sources.kgd'), url: 'https://kgd.gov.kz/' },
          { title: t('parcel-customs.sources.customsCode'), url: 'https://online.zakon.kz/document/?doc_id=36231050' },
        ]}
      />

      {/* Embed Widget */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="parcel-customs"
        calculatorTitle={t('parcel-customs.title')}
      />
      <LastUpdated calculatorId="parcel-customs" />
    </div>
  );
}
