import React, { useState, useEffect } from 'react';
import { FileCheck, Calculator, AlertTriangle, Info, Calendar, Car, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function RegistrationFeeCalculator() {
  const { t } = useTranslation('calculators');
  const [vehicleType, setVehicleType] = useState<'car' | 'electric' | 'truck' | 'bus'>('car');
  const [manufactureYear, setManufactureYear] = useState<string>('2020');

  const [results, setResults] = useState({
    vehicleAge: 0,
    ageCategory: '',
    registrationFee: 0,
    certificateFee: 0,
    platesFee: 0,
    totalFee: 0,
    isHighFee: false,
    warning: ''
  });

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const CURRENT_YEAR = 2026;

  // Ставки сбора за регистрацию (в МРП)
  const registrationRates = [
    { maxAge: 1, rate: 0.25, description: t('registration-fee.upTo2Years') },
    { maxAge: 3, rate: 50, description: t('registration-fee.from2To3Years') },
    { maxAge: Infinity, rate: 500, description: t('registration-fee.over3Years') }
  ];

  // Дополнительные сборы (в МРП)
  const CERTIFICATE_FEE_MRP = 1.25; // Свидетельство о регистрации
  const PLATES_FEE_MRP = 2.8;       // Государственные номера

  // Типы транспортных средств
  const vehicleTypes = [
    { id: 'car', name: t('registration-fee.passengerCar'), icon: '🚗' },
    { id: 'electric', name: t('registration-fee.electricCar'), icon: '⚡' },
    { id: 'truck', name: t('registration-fee.truckCar'), icon: '🚛' },
    { id: 'bus', name: t('registration-fee.bus'), icon: '🚌' }
  ];

  const calculateRegistrationFee = () => {
    if (!manufactureYear) {
      setResults({
        vehicleAge: 0, ageCategory: '', registrationFee: 0,
        certificateFee: 0, platesFee: 0, totalFee: 0,
        isHighFee: false, warning: ''
      });
      return;
    }

    const year = parseInt(manufactureYear);
    const vehicleAge = Math.max(0, CURRENT_YEAR - year);

    // Определение категории возраста и ставки
    const rateInfo = registrationRates.find(rate => vehicleAge <= rate.maxAge);
    const registrationRateMRP = rateInfo ? rateInfo.rate : registrationRates[registrationRates.length - 1].rate;
    const ageCategory = rateInfo ? rateInfo.description : registrationRates[registrationRates.length - 1].description;

    // Особенности для электромобилей (могут быть льготы)
    let actualRegistrationRate = registrationRateMRP;
    if (vehicleType === 'electric' && vehicleAge <= 2) {
      // Для новых электромобилей может быть льготная ставка
      actualRegistrationRate = 0.1; // Предполагаемая льготная ставка
    }

    // Расчет сборов
    const registrationFee = actualRegistrationRate * MRP_2026;
    const certificateFee = CERTIFICATE_FEE_MRP * MRP_2026;
    const platesFee = PLATES_FEE_MRP * MRP_2026;
    const totalFee = registrationFee + certificateFee + platesFee;

    // Определение высокого сбора и предупреждений
    const isHighFee = registrationRateMRP >= 500;
    let warning = '';

    if (vehicleAge >= 2 && vehicleAge <= 4) {
      if (vehicleAge === 2) {
        warning = t('registration-fee.warning2Years', {
          currentFee: formatNumber(50 * MRP_2026),
          futureFee: formatNumber(500 * MRP_2026)
        });
      } else if (vehicleAge === 3) {
        warning = t('registration-fee.warning3Years', {
          highFee: formatNumber(500 * MRP_2026),
          lowFee: formatNumber(50 * MRP_2026)
        });
      } else if (vehicleAge > 3) {
        warning = t('registration-fee.warningOver3Years');
      }
    }

    setResults({
      vehicleAge,
      ageCategory,
      registrationFee: Math.round(registrationFee),
      certificateFee: Math.round(certificateFee),
      platesFee: Math.round(platesFee),
      totalFee: Math.round(totalFee),
      isHighFee,
      warning
    });
  };

  useEffect(() => {
    calculateRegistrationFee();
  }, [vehicleType, manufactureYear]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount} ${t('registration-fee.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  const selectedVehicleType = vehicleTypes.find(type => type.id === vehicleType);

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="registration-fee" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('registration-fee.title')}</h1>
            <p className="text-gray-600">{t('registration-fee.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('registration-fee.vehicleParameters')}</h2>

          <div className="space-y-6">
            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('registration-fee.vehicleType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {vehicleTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setVehicleType(type.id as any)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      vehicleType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manufacture Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('registration-fee.manufactureYear')}
              </label>
              <RangeSlider
                value={parseInt(manufactureYear) || 2020}
                onChange={(val) => setManufactureYear(String(val))}
                min={1990}
                max={CURRENT_YEAR}
                step={1}
                formatValue={(v) => `${v} г.`}
                color="#3b82f6"
              />
              <input
                type="number"
                id="manufactureYear"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
                placeholder={t('registration-fee.enterManufactureYear')}
                min="1990"
                max={CURRENT_YEAR}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('registration-fee.basicRates2025')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>{t('registration-fee.rateUpTo2Years', { amount: formatNumber(0.25 * MRP_2026) })}</li>
                <li>{t('registration-fee.rateFrom2To3Years', { amount: formatNumber(50 * MRP_2026) })}</li>
                <li>{t('registration-fee.rateOver3Years', { amount: formatNumber(500 * MRP_2026) })}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('registration-fee.calculationResults')}</h2>

          <div className="space-y-4">
            {results.vehicleAge > 0 && (
              <div className={`rounded-lg p-4 ${results.isHighFee ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className={`w-5 h-5 ${results.isHighFee ? 'text-red-600' : 'text-blue-600'}`} />
                  <span className={`text-sm font-medium ${results.isHighFee ? 'text-red-900' : 'text-blue-900'}`}>
                    {selectedVehicleType?.name} • {results.vehicleAge} {results.vehicleAge === 1 ? t('registration-fee.year') : results.vehicleAge < 5 ? t('registration-fee.years2to4') : t('registration-fee.years5plus')}
                  </span>
                </div>
                <div className={`text-sm ${results.isHighFee ? 'text-red-800' : 'text-blue-800'}`}>
                  {t('registration-fee.category')}: {results.ageCategory}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('registration-fee.registrationFee')}</span>
                <span className={`font-semibold ${results.isHighFee ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatNumber(results.registrationFee)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('registration-fee.registrationCertificate')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.certificateFee)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('registration-fee.licensePlates')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.platesFee)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 mt-6">
              <span className="text-lg font-semibold text-gray-900">{t('registration-fee.totalCost')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className={`text-xl font-bold ${results.isHighFee ? 'text-red-700' : 'text-blue-700'}`}>
                  {formatNumber(results.totalFee)}
                </span>
              </div>
            </div>

            {vehicleType === 'electric' && results.vehicleAge <= 2 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900 mb-1">
                      {t('registration-fee.preferentialRate')}
                    </h3>
                    <p className="text-green-800 text-sm">
                      {t('registration-fee.preferentialRateDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Section */}
      {results.warning && (
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                {t('registration-fee.importantInfo')}
              </h3>
              <p className="text-amber-800">
                {results.warning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rates Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('registration-fee.ratesTable2025')}</h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Registration Fees */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('registration-fee.registrationFeesByAge')}</h3>
            <div className="space-y-2">
              {registrationRates.map((rate, index) => (
                <div key={index} className={`flex justify-between text-sm py-3 px-4 rounded ${
                  rate.rate >= 500 ? 'bg-red-50 border border-red-200' :
                  rate.rate >= 50 ? 'bg-amber-50 border border-amber-200' :
                  'bg-green-50 border border-green-200'
                }`}>
                  <span className="text-gray-700">{rate.description}</span>
                  <span className="font-medium">{formatMRP(rate.rate)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Fees */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('registration-fee.additionalFees')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-3 px-4 bg-gray-50 rounded">
                <span className="text-gray-700">{t('registration-fee.registrationCertificate')}</span>
                <span className="font-medium">{formatMRP(CERTIFICATE_FEE_MRP)}</span>
              </div>
              <div className="flex justify-between text-sm py-3 px-4 bg-gray-50 rounded">
                <span className="text-gray-700">{t('registration-fee.licensePlates')}</span>
                <span className="font-medium">{formatMRP(PLATES_FEE_MRP)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p className="text-xs text-blue-800">
                <strong>{t('registration-fee.totalAdditional')}:</strong> {formatMRP(CERTIFICATE_FEE_MRP + PLATES_FEE_MRP)} {t('registration-fee.totalAdditionalDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>{t('registration-fee.important')}:</strong> {t('registration-fee.importantNote', { difference: formatNumber((500 - 50) * MRP_2026) })}
          </p>
        </div>
      </div>

      {/* Диаграмма */}
      {results.totalFee > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('registration-fee.chart.registrationFee'), value: results.registrationFee },
              { name: t('registration-fee.chart.certificate'), value: results.certificateFee },
              { name: t('registration-fee.chart.plates'), value: results.platesFee },
            ].filter(item => item.value > 0)}
            title={t('registration-fee.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.totalFee > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('registration-fee.export.title'),
              subtitle: vehicleType === 'car' ? t('registration-fee.vehicleTypes.car') : vehicleType === 'electric' ? t('registration-fee.vehicleTypes.electric') : vehicleType === 'truck' ? t('registration-fee.vehicleTypes.truck') : t('registration-fee.vehicleTypes.bus'),
              sections: [
                {
                  title: t('registration-fee.export.parameters'),
                  data: [
                    { label: t('registration-fee.export.vehicleType'), value: vehicleType },
                    { label: t('registration-fee.export.manufactureYear'), value: manufactureYear },
                  ]
                },
                {
                  title: t('registration-fee.export.results'),
                  data: [
                    { label: t('registration-fee.chart.registrationFee'), value: `${results.registrationFee.toLocaleString()} ₸` },
                    { label: t('registration-fee.chart.certificate'), value: `${results.certificateFee.toLocaleString()} ₸` },
                    { label: t('registration-fee.chart.plates'), value: `${results.platesFee.toLocaleString()} ₸` },
                    { label: t('registration-fee.export.total'), value: `${results.totalFee.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: t('registration-fee.export.footer')
            }}
            filename="registration-fee-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('registration-fee.faq.q1'), answer: t('registration-fee.faq.a1') },
          { question: t('registration-fee.faq.q2'), answer: t('registration-fee.faq.a2') },
          { question: t('registration-fee.faq.q3'), answer: t('registration-fee.faq.a3') },
          { question: t('registration-fee.faq.q4'), answer: t('registration-fee.faq.a4') },
          { question: t('registration-fee.faq.q5'), answer: t('registration-fee.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК — сборы', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'СпецЦОН — регистрация ТС', url: 'https://egov.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="registration-fee"
        calculatorTitle="Калькулятор регистрационного сбора"
      />
      <LastUpdated calculatorId="registration-fee" />
    </div>
  );
}
