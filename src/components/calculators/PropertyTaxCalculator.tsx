import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, AlertTriangle, Info, Building, BarChart3 } from 'lucide-react';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function PropertyTaxCalculator() {
  const { t } = useTranslation('calculators');
  const [propertyType, setPropertyType] = useState<string>('apartment');
  const [city, setCity] = useState<string>('almaty');
  const [area, setArea] = useState<string>('');
  const [buildYear, setBuildYear] = useState<string>('');
  const [useCustomCoefficients, setUseCustomCoefficients] = useState<boolean>(false);
  const [baseCost, setBaseCost] = useState<string>('');
  const [zoneCoefficient, setZoneCoefficient] = useState<string>('');
  const [mrpCoefficient, setMrpCoefficient] = useState<string>('');

  const [results, setResults] = useState({
    baseCostPerSqm: 0,
    zoneCoeff: 0,
    mrpCoeff: 0,
    wearPercent: 0,
    taxBase: 0,
    taxRate: 0,
    taxAmount: 0,
    exemptionAmount: 0,
    finalAmount: 0
  });

  const CURRENT_YEAR = 2026;
  const MRP_2026 = 4325;

  const propertyTypes = [
    { id: 'apartment', nameKey: 'calculators:property-tax.propertyType_apartment', icon: '🏠' },
    { id: 'house', nameKey: 'calculators:property-tax.propertyType_house', icon: '🏡' },
    { id: 'cottage', nameKey: 'calculators:property-tax.propertyType_cottage', icon: '🏘️' },
    { id: 'garage', nameKey: 'calculators:property-tax.propertyType_garage', icon: '🚗' },
    { id: 'commercial', nameKey: 'calculators:property-tax.propertyType_commercial', icon: '🏢' }
  ];

  const cities = [
    { id: 'almaty', nameKey: 'calculators:property-tax.city_almaty', baseCost: 120000, zoneCoeff: 1.5, mrpCoeff: 1.0 },
    { id: 'astana', nameKey: 'calculators:property-tax.city_astana', baseCost: 110000, zoneCoeff: 1.4, mrpCoeff: 1.0 },
    { id: 'shymkent', nameKey: 'calculators:property-tax.city_shymkent', baseCost: 80000, zoneCoeff: 1.2, mrpCoeff: 1.0 },
    { id: 'karaganda', nameKey: 'calculators:property-tax.city_karaganda', baseCost: 75000, zoneCoeff: 1.1, mrpCoeff: 1.0 },
    { id: 'aktobe', nameKey: 'calculators:property-tax.city_aktobe', baseCost: 70000, zoneCoeff: 1.0, mrpCoeff: 1.0 },
    { id: 'other', nameKey: 'calculators:property-tax.city_other', baseCost: 60000, zoneCoeff: 1.0, mrpCoeff: 1.0 }
  ];

  const taxRates = [
    { min: 0, max: 1000000, rate: 0.05 },
    { min: 1000001, max: 2000000, rate: 0.1 },
    { min: 2000001, max: 5000000, rate: 0.2 },
    { min: 5000001, max: 10000000, rate: 0.3 },
    { min: 10000001, max: Infinity, rate: 0.5 }
  ];

  const calculatePropertyTax = () => {
    if (!area || parseFloat(area) <= 0) {
      setResults({
        baseCostPerSqm: 0, zoneCoeff: 0, mrpCoeff: 0, wearPercent: 0,
        taxBase: 0, taxRate: 0, taxAmount: 0, exemptionAmount: 0, finalAmount: 0
      });
      return;
    }

    const propertyArea = parseFloat(area);
    let baseCostPerSqm, zoneCoeff, mrpCoeff;

    if (useCustomCoefficients) {
      baseCostPerSqm = parseFloat(baseCost) || 0;
      zoneCoeff = parseFloat(zoneCoefficient) || 1;
      mrpCoeff = parseFloat(mrpCoefficient) || 1;
    } else {
      const selectedCity = cities.find(c => c.id === city);
      baseCostPerSqm = selectedCity?.baseCost || 60000;
      zoneCoeff = selectedCity?.zoneCoeff || 1.0;
      mrpCoeff = selectedCity?.mrpCoeff || 1.0;
    }

    const yearBuilt = parseInt(buildYear) || CURRENT_YEAR;
    const age = Math.max(0, CURRENT_YEAR - yearBuilt);
    let wearPercent = Math.min(age * 2, 70);

    if (propertyType === 'cottage') wearPercent = Math.min(wearPercent + 10, 80);
    if (propertyType === 'garage') wearPercent = Math.min(wearPercent + 5, 75);

    const taxBase = baseCostPerSqm * propertyArea * (1 - wearPercent / 100) * zoneCoeff * mrpCoeff;

    const applicableRate = taxRates.find(rate => taxBase >= rate.min && taxBase <= rate.max);
    const taxRate = applicableRate ? applicableRate.rate : 0.5;

    let taxAmount = taxBase * (taxRate / 100);

    let exemptionAmount = 0;
    if (propertyType === 'apartment' || propertyType === 'house') {
      if (propertyArea <= 150) {
        exemptionAmount = taxAmount;
        taxAmount = 0;
      } else {
        const exemptArea = 150;
        const exemptBase = baseCostPerSqm * exemptArea * (1 - wearPercent / 100) * zoneCoeff * mrpCoeff;
        exemptionAmount = exemptBase * (taxRate / 100);
        taxAmount = Math.max(0, taxAmount - exemptionAmount);
      }
    }

    const finalAmount = Math.max(0, taxAmount);

    setResults({
      baseCostPerSqm: Math.round(baseCostPerSqm),
      zoneCoeff,
      mrpCoeff,
      wearPercent,
      taxBase: Math.round(taxBase),
      taxRate,
      taxAmount: Math.round(taxAmount + exemptionAmount),
      exemptionAmount: Math.round(exemptionAmount),
      finalAmount: Math.round(finalAmount)
    });
  };

  useEffect(() => {
    calculatePropertyTax();
  }, [propertyType, city, area, buildYear, useCustomCoefficients, baseCost, zoneCoefficient, mrpCoefficient]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const selectedPropertyType = propertyTypes.find(type => type.id === propertyType);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('property-tax.heading')}</h1>
            <p className="text-gray-600">{t('property-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('property-tax.warningTitle')}
            </h3>
            <div className="text-amber-800 space-y-2">
              <p>
                {t('property-tax.warningText1')}
              </p>
              <p>
                {t('property-tax.warningText2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('property-tax.propertyParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('property-tax.propertyType')}
              </label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPropertyType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      propertyType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{t(type.nameKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-tax.cityRegion')}
              </label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {cities.map((cityOption) => (
                  <option key={cityOption.id} value={cityOption.id}>
                    {t(cityOption.nameKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-tax.totalArea')}
              </label>
              <RangeSlider
                value={parseFloat(area) || 0}
                onChange={(val) => setArea(String(val))}
                min={10}
                max={500}
                step={5}
                formatValue={(v) => `${v} м²`}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder={t('property-tax.totalAreaPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">м²</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="buildYear" className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-tax.buildYear')}
              </label>
              <input
                type="number"
                id="buildYear"
                value={buildYear}
                onChange={(e) => setBuildYear(e.target.value)}
                placeholder={t('property-tax.buildYearPlaceholder')}
                min="1900"
                max={CURRENT_YEAR}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="useCustomCoefficients"
                  checked={useCustomCoefficients}
                  onChange={(e) => setUseCustomCoefficients(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useCustomCoefficients" className="ml-2 block text-sm text-gray-700">
                  {t('property-tax.useCustomCoefficients')}
                </label>
              </div>

              {useCustomCoefficients && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="baseCost" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('property-tax.baseCostPerSqm')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="baseCost"
                        value={baseCost}
                        onChange={(e) => setBaseCost(e.target.value)}
                        placeholder={t('property-tax.baseCostPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₸</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="zoneCoefficient" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('property-tax.zoneCoefficient')}
                    </label>
                    <input
                      type="number"
                      id="zoneCoefficient"
                      value={zoneCoefficient}
                      onChange={(e) => setZoneCoefficient(e.target.value)}
                      placeholder={t('property-tax.zoneCoefficientPlaceholder')}
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="mrpCoefficient" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('property-tax.mrpCoefficient')}
                    </label>
                    <input
                      type="number"
                      id="mrpCoefficient"
                      value={mrpCoefficient}
                      onChange={(e) => setMrpCoefficient(e.target.value)}
                      placeholder={t('property-tax.mrpCoefficientPlaceholder')}
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('property-tax.calculationResults')}</h2>

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedPropertyType ? t(selectedPropertyType.nameKey) : ''} • {area} м²
                </span>
              </div>
              <div className="text-xs text-blue-700">
                {t('property-tax.wear')}: {results.wearPercent}% • {t('property-tax.zoneCoeff')}: {results.zoneCoeff}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('property-tax.baseCost1Sqm')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.baseCostPerSqm)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('property-tax.taxBase')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.taxBase)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('property-tax.taxRate')}</span>
                <span className="font-semibold text-gray-900">{results.taxRate}%</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('property-tax.taxAmountBeforeExemption')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.taxAmount)}</span>
              </div>

              {results.exemptionAmount > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('property-tax.exemption')}</span>
                  <span className="font-semibold text-green-600">-{formatNumber(results.exemptionAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg px-4 mt-6">
              <span className="text-lg font-semibold text-gray-900">{t('property-tax.toPay')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-orange-600" />
                <span className="text-xl font-bold text-orange-700">{formatNumber(results.finalAmount)}</span>
              </div>
            </div>

            {results.exemptionAmount > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900 mb-1">
                      {t('property-tax.residentialExemptionTitle')}
                    </h3>
                    <p className="text-green-800 text-sm">
                      {t('property-tax.residentialExemptionText')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('property-tax.progressiveTaxRates')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('property-tax.propertyValue')}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('property-tax.taxRatePercent')}</th>
              </tr>
            </thead>
            <tbody>
              {taxRates.map((rate, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {rate.min === 0 ? t('property-tax.upTo') : t('property-tax.over')} {formatNumber(rate.min)}
                    {rate.max !== Infinity ? ` ${t('property-tax.upTo')} ${formatNumber(rate.max)}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
                    {rate.rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('property-tax.exemptionsNote')}</strong>
            <br />
            <strong>{t('property-tax.paymentDeadline')}</strong>
          </p>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('property-tax.faq.q1'), answer: t('property-tax.faq.a1') },
          { question: t('property-tax.faq.q2'), answer: t('property-tax.faq.a2') },
          { question: t('property-tax.faq.q3'), answer: t('property-tax.faq.a3') },
          { question: t('property-tax.faq.q4'), answer: t('property-tax.faq.a4') },
          { question: t('property-tax.faq.q5'), answer: t('property-tax.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК, глава 62', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'eGov.kz — Налог на имущество', url: 'https://egov.kz/' },
        ]}
      />

      {/* Диаграмма структуры */}
      {results && results.annualTax > 0 && results.assessedValue && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Налог', value: results.annualTax },
              { name: 'Оценочная стоимость', value: results.assessedValue / 100 },
            ]}
            title="Налог на имущество (1% от стоимости)"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.annualTax > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт налога на имущество',
              subtitle: propertyType,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Тип имущества', value: propertyType },
                    { label: 'Оценочная стоимость', value: `${results.assessedValue?.toLocaleString()} ₸` },
                    { label: 'Годовой налог', value: `${results.annualTax.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="property-tax-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="property-tax"
        calculatorTitle="Калькулятор налога на имущество"
      />
    </div>
  );
}
