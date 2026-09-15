import React, { useState, useMemo } from 'react';
import { Recycle, Calculator, Zap, Truck, Car, Info, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';

type Band = { max: number; k1: number; k2: number; description: string };

export default function RecyclingFeeCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [vehicleType, setVehicleType] = useState<'car' | 'truck' | 'bus'>('car');
  const [origin, setOrigin] = useState<'other' | 'eaeu'>('other');
  const [engineVolume, setEngineVolume] = useState<string>('1500');
  const [totalMass, setTotalMass] = useState<string>('');
  const [isTractorUnit, setIsTractorUnit] = useState<boolean>(false);
  const [isElectric, setIsElectric] = useState<boolean>(false);

  // Методика расчёта утилизационного платежа (приказ и.о. МЭГПР РК от 02.11.2021 № 448), приложение 4
  // в редакции приказа МЭПР РК от 20.03.2026 № 54 — действует с 07.05.2026. По = базовая ставка ×
  // коэффициент 1 (произведено в РК или ввезено не из России и Беларуси) либо × коэффициент 2
  // (ввоз из России или Беларуси). Сверено дословно с adilet.zan.kz/rus/docs/V2100025100 13.09.2026.
  const MRP_2026 = 4325;
  const BASE_RATE_MRP = 50;
  const BASE_RATE_KZT = BASE_RATE_MRP * MRP_2026; // 216 250 ₸

  // «С электродвигателями, за исключением ТС с гибридной силовой установкой» — одинаково в п. 1–3
  const ELECTRIC = { k1: 0, k2: 60 };

  // п. 1 — категория М1, рабочий объём двигателя
  const carBands: Band[] = [
    { max: 1000, k1: 1.5, k2: 22, description: t('recycling-fee.coefficients.car.upTo1000') },
    { max: 2000, k1: 3.5, k2: 136, description: t('recycling-fee.coefficients.car.upTo2000') },
    { max: 3000, k1: 5, k2: 164, description: t('recycling-fee.coefficients.car.upTo3000') },
    { max: Infinity, k1: 11.5, k2: 246, description: t('recycling-fee.coefficients.car.over3000') }
  ];

  // п. 2 — категории N1–N3, полная (технически допустимая максимальная) масса, т
  const truckBands: Band[] = [
    { max: 2.5, k1: 3.5, k2: 164, description: t('recycling-fee.coefficients.truck.upTo2_5') },
    { max: 3.5, k1: 7.5, k2: 164, description: t('recycling-fee.coefficients.truck.upTo3_5') },
    { max: 5, k1: 7.5, k2: 164, description: t('recycling-fee.coefficients.truck.upTo5') },
    { max: 8, k1: 8, k2: 164, description: t('recycling-fee.coefficients.truck.upTo8') },
    { max: 12, k1: 9.5, k2: 164, description: t('recycling-fee.coefficients.truck.upTo12') },
    { max: 20, k1: 10.5, k2: 164, description: t('recycling-fee.coefficients.truck.upTo20') },
    { max: 50, k1: 20.5, k2: 164, description: t('recycling-fee.coefficients.truck.upTo50') }
  ];
  // Строки 12,01–20 и 20,01–50 т — «кроме седельных тягачей»: для тягачей 12–50 т своя строка
  const tractorUnitBand: Band = { max: 50, k1: 11, k2: 164, description: t('recycling-fee.coefficients.truck.tractorUnit') };

  // п. 3 — категории М2, М3, рабочий объём двигателя
  const busBands: Band[] = [
    { max: 2500, k1: 4, k2: 164, description: t('recycling-fee.coefficients.bus.upTo2500') },
    { max: 5000, k1: 8, k2: 246, description: t('recycling-fee.coefficients.bus.upTo5000') },
    { max: 10000, k1: 10.5, k2: 246, description: t('recycling-fee.coefficients.bus.upTo10000') },
    { max: Infinity, k1: 13.5, k2: 246, description: t('recycling-fee.coefficients.bus.over10000') }
  ];

  const vehicleTypeLabel = (type: 'car' | 'truck' | 'bus') =>
    type === 'car' ? t('recycling-fee.vehicleTypes.car') : type === 'truck' ? t('recycling-fee.vehicleTypes.truck') : t('recycling-fee.vehicleTypes.bus');

  const originLabel = origin === 'eaeu' ? t('recycling-fee.originEaeu') : t('recycling-fee.originOther');

  const calculateFee = () => {
    let band: { k1: number; k2: number } | undefined;
    let category = '';
    let hasInput = true;

    if (isElectric) {
      band = ELECTRIC;
      category = `${vehicleTypeLabel(vehicleType)}, ${t('recycling-fee.electricVehicle')}`;
    } else if (vehicleType === 'truck') {
      const mass = parseFloat(totalMass);
      hasInput = mass > 0;
      const found = !hasInput
        ? undefined
        : isTractorUnit && mass > 12 && mass <= 50
          ? tractorUnitBand
          : truckBands.find(b => mass <= b.max);
      if (found) {
        band = found;
        category = `${t('recycling-fee.vehicleTypes.truck')}, ${found.description}`;
      }
    } else {
      const volume = parseInt(engineVolume);
      hasInput = volume > 0;
      const found = hasInput ? (vehicleType === 'car' ? carBands : busBands).find(b => volume <= b.max) : undefined;
      if (found) {
        band = found;
        category = `${vehicleTypeLabel(vehicleType)}, ${found.description}`;
      }
    }

    const coefficient = band ? (origin === 'eaeu' ? band.k2 : band.k1) : 0;

    return {
      coefficient,
      fee: Math.round(BASE_RATE_KZT * coefficient),
      category,
      isExempt: !!band && coefficient === 0,
      outOfTable: hasInput && !band
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    calculateFee,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vehicleType, origin, engineVolume, totalMass, isTractorUnit, isElectric, i18n.language]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatCoefficient = (k: number) => k.toLocaleString('ru-RU');

  const formatMRP = (coefficient: number) => {
    return `${BASE_RATE_MRP} ${t('recycling-fee.mrp')} × ${formatCoefficient(coefficient)} = ${formatNumber(BASE_RATE_KZT * coefficient)}`;
  };

  const renderCoefficientTable = (title: string, bands: Band[]) => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 px-3">
          <span className="flex-1" />
          <span className="w-14 shrink-0 text-right">{t('recycling-fee.coefficient1')}</span>
          <span className="w-14 shrink-0 text-right">{t('recycling-fee.coefficient2')}</span>
        </div>
        {[{ ...ELECTRIC, max: 0, description: t('recycling-fee.electricVehicles') }, ...bands].map((band, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-sm py-2 px-3 rounded ${index === 0 ? 'bg-green-50' : 'bg-gray-50'}`}
          >
            <span className="flex-1 text-gray-700">{band.description}</span>
            <span className={`w-14 shrink-0 text-right ${origin === 'other' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              {formatCoefficient(band.k1)}
            </span>
            <span className={`w-14 shrink-0 text-right ${origin === 'eaeu' ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
              {formatCoefficient(band.k2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

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

      <QuickAnswer calculatorId="recycling-fee" />

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

            {/* Origin: коэффициент 1 или 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('recycling-fee.origin')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setOrigin('other')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    origin === 'other'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {t('recycling-fee.originOther')}
                </button>
                <button
                  onClick={() => setOrigin('eaeu')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    origin === 'eaeu'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {t('recycling-fee.originEaeu')}
                </button>
              </div>
              {origin === 'eaeu' && (
                <p className="text-xs text-amber-700 mt-2">{t('recycling-fee.originNote')}</p>
              )}
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
                  max={vehicleType === 'bus' ? 15000 : 7000}
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
                <div className="flex items-center mt-3">
                  <input
                    type="checkbox"
                    id="isTractorUnit"
                    checked={isTractorUnit}
                    onChange={(e) => setIsTractorUnit(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isTractorUnit" className="ml-2 block text-sm text-gray-700">
                    {t('recycling-fee.tractorUnit')}
                  </label>
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
            {results.outOfTable ? (
              <div className="rounded-lg p-4 bg-amber-50 text-amber-800 text-sm flex items-start space-x-2">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <span>{t('recycling-fee.outOfTable')}</span>
              </div>
            ) : (
              <>
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
                    <div className={`text-xs mt-1 ${results.isExempt ? 'text-green-700' : 'text-blue-700'}`}>
                      {originLabel}
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
                      <span className="text-gray-600">
                        {t('recycling-fee.coefficient')} {origin === 'eaeu' ? '2' : '1'}
                      </span>
                      <span className="font-semibold text-gray-900">{formatCoefficient(results.coefficient)}</span>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coefficients Tables */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('recycling-fee.coefficientsTitle')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('recycling-fee.tableLegend')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderCoefficientTable(t('recycling-fee.coefficients.carTitle'), carBands)}
          {renderCoefficientTable(t('recycling-fee.coefficients.truckTitle'), [...truckBands, tractorUnitBand])}
          {renderCoefficientTable(t('recycling-fee.coefficients.busTitle'), busBands)}
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
      {results.fee > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('recycling-fee.chart.recyclingFee'), value: results.fee },
            ]}
            title={t('recycling-fee.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.fee > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('recycling-fee.export.title'),
              subtitle: vehicleTypeLabel(vehicleType),
              sections: [
                {
                  title: t('recycling-fee.export.parameters'),
                  data: [
                    { label: t('recycling-fee.export.vehicleType'), value: vehicleTypeLabel(vehicleType) },
                    { label: t('recycling-fee.export.origin'), value: originLabel },
                    vehicleType === 'truck'
                      ? { label: t('recycling-fee.totalMass'), value: `${totalMass} ${t('recycling-fee.tons')}` }
                      : { label: t('recycling-fee.export.engineVolume'), value: `${engineVolume} ${t('recycling-fee.units.cm3')}` },
                    { label: t('recycling-fee.export.isElectric'), value: isElectric ? t('recycling-fee.yes') : t('recycling-fee.no') },
                  ]
                },
                {
                  title: t('recycling-fee.export.results'),
                  data: [
                    { label: t('recycling-fee.export.coefficient'), value: formatCoefficient(results.coefficient) },
                    { label: t('recycling-fee.export.feeAmount'), value: formatNumber(results.fee) },
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
      <CalculatorExamples calculatorId="recycling-fee" />
      <MethodologySection calculatorId="recycling-fee" />
      <FAQSection
        items={[
          { question: t('recycling-fee.faq.q1'), answer: t('recycling-fee.faq.a1') },
          { question: t('recycling-fee.faq.q2'), answer: t('recycling-fee.faq.a2') },
          { question: t('recycling-fee.faq.q3'), answer: t('recycling-fee.faq.a3') },
          { question: t('recycling-fee.faq.q4'), answer: t('recycling-fee.faq.a4') },
          { question: t('recycling-fee.faq.q5'), answer: t('recycling-fee.faq.a5') }
        ]}
        sources={[
          { title: t('recycling-fee.sources.law'), url: 'https://adilet.zan.kz/rus/docs/V2100025100' },
          { title: t('recycling-fee.sources.amendment'), url: 'https://adilet.zan.kz/rus/docs/V2600038306' },
          { title: t('recycling-fee.sources.rop'), url: 'https://recycle.kz/' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="recycling-fee"
        calculatorTitle={t('recycling-fee.title')}
      />
      <LastUpdated calculatorId="recycling-fee" />
    </div>
  );
}
