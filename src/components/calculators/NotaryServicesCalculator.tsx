import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, Calculator, Users, Building, MapPin, Info, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

export default function NotaryServicesCalculator() {
  const { t } = useTranslation('calculators');
  const [serviceType, setServiceType] = useState<string>('apartment-sale');
  const [partyTypes, setPartyTypes] = useState<'both-individuals' | 'mixed' | 'both-legal'>('both-individuals');
  const [areRelated, setAreRelated] = useState<boolean>(false);
  const [location, setLocation] = useState<'city' | 'rural'>('city');
  const [propertyValue, setPropertyValue] = useState<string>('15000000');

  const [results, setResults] = useState({
    stateFee: 0,
    technicalServiceFee: 0,
    totalCost: 0,
    description: '',
    hasPropertyValue: false,
    percentageFee: false,
    percentageRate: 0
  });

  const MRP_2026 = 4325;

  const notaryServices = {
    'apartment-sale': {
      name: t('notary.apartmentSale'),
      stateFee: { individuals: 7, mixed: 10, legal: 15 },
      technicalFee: { individuals: 5, mixed: 7, legal: 10 },
      relatedDiscount: { individuals: 50, mixed: 30, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.8 },
      hasPropertyValue: false
    },
    'car-sale': {
      name: t('notary.carSale'),
      stateFee: { individuals: 5, mixed: 7, legal: 10 },
      technicalFee: { individuals: 5, mixed: 5, legal: 7 },
      relatedDiscount: { individuals: 30, mixed: 20, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.9 },
      hasPropertyValue: false
    },
    'will': {
      name: t('notary.will'),
      stateFee: { individuals: 1, mixed: 1, legal: 0 },
      technicalFee: { individuals: 2, mixed: 2, legal: 0 },
      relatedDiscount: { individuals: 0, mixed: 0, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.8 },
      hasPropertyValue: false
    },
    'inheritance': {
      name: t('notary.inheritance'),
      stateFee: { individuals: 1, mixed: 1, legal: 2 },
      technicalFee: { individuals: 3, mixed: 4, legal: 5 },
      relatedDiscount: { individuals: 0, mixed: 0, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.8 },
      hasPropertyValue: true,
      percentageFee: true,
      percentageRate: { individuals: 0.5, mixed: 0.7, legal: 1.0 }
    },
    'power-of-attorney': {
      name: t('notary.powerOfAttorney'),
      stateFee: { individuals: 0.5, mixed: 1, legal: 2 },
      technicalFee: { individuals: 2, mixed: 3, legal: 4 },
      relatedDiscount: { individuals: 20, mixed: 10, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.8 },
      hasPropertyValue: false
    },
    'copy-certification': {
      name: t('notary.copyCertification'),
      stateFee: { individuals: 0.05, mixed: 0.05, legal: 0.1 },
      technicalFee: { individuals: 0.05, mixed: 0.05, legal: 0.1 },
      relatedDiscount: { individuals: 0, mixed: 0, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.9 },
      hasPropertyValue: false
    },
    'marriage-contract': {
      name: t('notary.marriageContract'),
      stateFee: { individuals: 3, mixed: 3, legal: 0 },
      technicalFee: { individuals: 5, mixed: 5, legal: 0 },
      relatedDiscount: { individuals: 0, mixed: 0, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.8 },
      hasPropertyValue: false
    },
    'agreement-certification': {
      name: t('notary.agreementCertification'),
      stateFee: { individuals: 2, mixed: 3, legal: 5 },
      technicalFee: { individuals: 4, mixed: 5, legal: 7 },
      relatedDiscount: { individuals: 25, mixed: 15, legal: 0 },
      locationMultiplier: { city: 1.0, rural: 0.8 },
      hasPropertyValue: false
    }
  };

  const calculateNotaryCost = () => {
    const service = notaryServices[serviceType as keyof typeof notaryServices];
    if (!service) return;

    let stateFeeRate = service.stateFee[partyTypes];
    let technicalFeeRate = service.technicalFee[partyTypes];

    if (areRelated && service.relatedDiscount[partyTypes] > 0) {
      const discount = service.relatedDiscount[partyTypes] / 100;
      stateFeeRate *= (1 - discount);
      technicalFeeRate *= (1 - discount);
    }

    const locationMultiplier = service.locationMultiplier[location];
    stateFeeRate *= locationMultiplier;
    technicalFeeRate *= locationMultiplier;

    let stateFee = stateFeeRate * MRP_2026;
    let technicalServiceFee = technicalFeeRate * MRP_2026;

    let percentageFee = false;
    let percentageRate = 0;

    if (service.percentageFee && propertyValue) {
      const value = parseFloat(propertyValue) || 0;
      if (value > 0 && service.percentageRate) {
        percentageRate = service.percentageRate[partyTypes];
        const additionalFee = value * (percentageRate / 100);
        stateFee += additionalFee;
        percentageFee = true;
      }
    }

    const totalCost = stateFee + technicalServiceFee;

    setResults({
      stateFee: Math.round(stateFee),
      technicalServiceFee: Math.round(technicalServiceFee),
      totalCost: Math.round(totalCost),
      description: service.name,
      hasPropertyValue: service.hasPropertyValue || false,
      percentageFee,
      percentageRate
    });
  };

  useEffect(() => {
    calculateNotaryCost();
  }, [serviceType, partyTypes, areRelated, location, propertyValue, t]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount.toFixed(2)} МРП (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('notary.heading')}</h1>
            <p className="text-gray-600">{t('notary.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('notary.dualStructure')}
            </h3>
            <p className="text-blue-800">
              {t('notary.dualStructureDesc')}
              {' '}<strong>{t('notary.stateFee')}</strong> и <strong>{t('notary.technicalServices')}</strong>.
              {' '}{t('notary.bothRequired')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('notary.serviceParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                {t('notary.serviceType')}
              </label>
              <select
                id="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {Object.entries(notaryServices).map(([key, service]) => (
                  <option key={key} value={key}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('notary.participants')}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="partyTypes"
                    value="both-individuals"
                    checked={partyTypes === 'both-individuals'}
                    onChange={(e) => setPartyTypes(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <Users className="w-4 h-4 inline mr-1" />
                    {t('notary.bothIndividuals')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="partyTypes"
                    value="mixed"
                    checked={partyTypes === 'mixed'}
                    onChange={(e) => setPartyTypes(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {t('notary.mixed')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="partyTypes"
                    value="both-legal"
                    checked={partyTypes === 'both-legal'}
                    onChange={(e) => setPartyTypes(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <Building className="w-4 h-4 inline mr-1" />
                    {t('notary.bothLegal')}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="areRelated"
                checked={areRelated}
                onChange={(e) => setAreRelated(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="areRelated" className="ml-2 block text-sm text-gray-700">
                {t('notary.related')}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('notary.location')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLocation('city')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    location === 'city'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Building className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{t('notary.city')}</div>
                </button>
                <button
                  onClick={() => setLocation('rural')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    location === 'rural'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <MapPin className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{t('notary.rural')}</div>
                </button>
              </div>
            </div>

            {results.hasPropertyValue && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('notary.propertyValue')}
                </label>
                <RangeSlider
                  value={parseFloat(propertyValue) || 0}
                  onChange={(val) => setPropertyValue(String(val))}
                  min={1000000}
                  max={100000000}
                  step={1000000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#8b5cf6"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="propertyValue"
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(e.target.value)}
                    placeholder={t('notary.propertyValuePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                {results.percentageFee && (
                  <p className="text-xs text-blue-600 mt-1">
                    {t('notary.additionalPercentage')} {results.percentageRate}% {t('notary.ofPropertyValue')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('notary.serviceCost')}</h2>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-1">{t('notary.service')}</h3>
              <p className="text-gray-700 text-sm">{results.description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                <div>
                  <span className="font-medium text-blue-900">{t('notary.stateFeeLabel')}</span>
                  <div className="text-xs text-blue-600">{t('notary.stateFeeDesc')}</div>
                </div>
                <span className="text-lg font-bold text-blue-700">{formatNumber(results.stateFee)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-4">
                <div>
                  <span className="font-medium text-orange-900">{t('notary.technicalServicesLabel')}</span>
                  <div className="text-xs text-orange-600">{t('notary.technicalServicesDesc')}</div>
                </div>
                <span className="text-lg font-bold text-orange-700">{formatNumber(results.technicalServiceFee)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">{t('notary.totalCost')}</span>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span className="text-xl font-bold text-emerald-700">{formatNumber(results.totalCost)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">{t('notary.totalToPay')}</div>
            </div>

            {areRelated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">{t('notary.relatedDiscount')}</h3>
                    <p className="text-green-800 text-sm">
                      {t('notary.relatedDiscountDesc')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('notary.popularServices')}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('notary.serviceColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('notary.stateFeeColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('notary.technicalColumn')}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('notary.totalColumn')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  {t('notary.apartmentSaleExample')}<br />
                  <span className="text-xs text-gray-500">{t('notary.cityIndividualsNotRelated')}</span>
                </td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(7)}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(5)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatNumber(12 * MRP_2026)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  {t('notary.carSaleExample')}<br />
                  <span className="text-xs text-gray-500">{t('notary.individualsNotRelated')}</span>
                </td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(5)}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(5)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatNumber(10 * MRP_2026)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">{t('notary.willExample')}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(1)}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(2)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatNumber(3 * MRP_2026)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">{t('notary.powerOfAttorneyExample')}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(0.5)}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(2)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatNumber(2.5 * MRP_2026)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">{t('notary.copyExample')}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(0.05)}</td>
                <td className="py-3 px-4 text-center text-sm">{formatMRP(0.05)}</td>
                <td className="py-3 px-4 text-right font-semibold">{formatNumber(0.1 * MRP_2026)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('notary.importantFeatures')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• {t('notary.feature1')}</p>
                <p>• {t('notary.feature2')}</p>
                <p>• {t('notary.feature3')}</p>
                <p>• {t('notary.feature4')}</p>
                <p><strong>{t('notary.mrp2026')}</strong> {formatNumber(MRP_2026)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      {results.totalCost > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Нотариальный сбор', value: results.notaryFee },
              { name: 'Госпошлина', value: results.stateFee },
            ].filter(item => item.value > 0)}
            title="Структура нотариальных услуг"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.totalCost > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт нотариальных услуг',
              subtitle: serviceType,
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Услуга', value: serviceType },
                    { label: 'Стоимость объекта', value: `${parseFloat(propertyValue || '0').toLocaleString()} ₸` },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Нотариальный сбор', value: `${results.notaryFee.toLocaleString()} ₸` },
                    { label: 'Госпошлина', value: `${results.stateFee.toLocaleString()} ₸` },
                    { label: 'Итого', value: `${results.totalCost.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="notary-services-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('notary.faq.q1'), answer: t('notary.faq.a1') },
          { question: t('notary.faq.q2'), answer: t('notary.faq.a2') },
          { question: t('notary.faq.q3'), answer: t('notary.faq.a3') },
          { question: t('notary.faq.q4'), answer: t('notary.faq.a4') },
          { question: t('notary.faq.q5'), answer: t('notary.faq.a5') }
        ]}
        sources={[
          { title: 'Нотариальная палата РК', url: 'https://notariat.kz/' },
          { title: 'Закон о нотариате', url: 'https://online.zakon.kz/document/?doc_id=1006057' },
        ]}
      />

      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="notary"
        calculatorTitle="Калькулятор нотариальных услуг"
      />
    </div>
  );
}
