import React, { useState, useMemo } from 'react';
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
import { NUMBER_LOCALE } from '../../utils/localeFormat';

// Единые ставки для легковых авто — товаров для личного пользования (ПТД, ТК ЕАЭС ст. 260, 266):
// Решение Совета ЕЭК от 20.12.2017 № 107, прил. 2, табл. 2, п. 3 (ред. 24.02.2026 № 35). Единый платёж
// заменяет пошлину, НДС и акциз. Возраст — «с момента выпуска».
const ETP_UP_TO_3Y = [
  { maxEur: 8500, pct: 0.54, minEurPerCc: 2.5 },
  { maxEur: 16700, pct: 0.48, minEurPerCc: 3.5 },
  { maxEur: 42300, pct: 0.48, minEurPerCc: 5.5 },
  { maxEur: 84500, pct: 0.48, minEurPerCc: 7.5 },
  { maxEur: 169000, pct: 0.48, minEurPerCc: 15 },
  { maxEur: Infinity, pct: 0.48, minEurPerCc: 20 },
];
const ETP_VOLUME_BANDS_CC = [1000, 1500, 1800, 2300, 3000, Infinity];
const ETP_EUR_PER_CC_3_TO_5Y = [1.5, 1.7, 2.5, 2.7, 3, 3.6];
const ETP_EUR_PER_CC_OVER_5Y = [3, 3.2, 3.5, 4.8, 5, 5.7];

type Regime = 'dt' | 'personal';

export default function CustomsClearanceCalculator() {
  const { t, i18n } = useTranslation('calculators');
  // dt — декларация на товары по ставкам перечня изъятий РК; personal — ПТД по единым ставкам ЕАЭС
  const [regime, setRegime] = useState<Regime>('dt');
  const [manufactureYear, setManufactureYear] = useState<string>('2020');
  const [engineVolume, setEngineVolume] = useState<string>('2000');
  const [customsValue, setCustomsValue] = useState<string>('15000');
  const [currency, setCurrency] = useState<'USD' | 'KZT'>('USD');
  const [exchangeRate, setExchangeRate] = useState<string>('451'); // НБРК 13.09.2026: 450,91
  const [fuel, setFuel] = useState<'petrol' | 'diesel'>('petrol');
  const [eurRate, setEurRate] = useState<string>('523'); // НБРК 13.09.2026: 522,69 — минимальные ставки пошлины заданы в €/см³
  const [isElectric, setIsElectric] = useState<boolean>(false); // электромобиль (растаможка ВТО 0%)

  const EMPTY_RESULTS = {
    customsValueKZT: 0,
    customsFee: 0,
    customsDuty: 0,
    dutyLabel: '',
    excise: 0,
    vat: 0,
    etp: 0,
    etpLabel: '',
    isPersonal: false,
    totalPayments: 0,
    vehicleAge: 0,
    isOldVehicle: false,
    additionalRestrictions: ''
  };

  // НК РК / ПП РК от 05.04.2018 № 171 (ред. ПП № 631 от 02.08.2023): таможенный сбор
  // за таможенное декларирование товаров — ФИКСИРОВАННЫЙ 6 МРП за декларацию,
  // не зависит от таможенной стоимости. МРП на 2026 = 4325 ₸ (Закон № 239-VIII
  // от 08.12.2025). Итого 6 × 4325 = 25 950 ₸.
  // Источник: https://adilet.zan.kz/rus/docs/P1800000171
  const MRP_2026 = 4325;
  const CUSTOMS_FEE_MRP = 6;
  // Акциз на легковые авто — НК РК ст. 537: строка 21 — свыше 3 000 см³, 100 ₸ за 1 см³; строка 24 —
  // стоимость от 18 000 МРП (на 1 января), 10 % стоимости; при ввозе база — таможенная стоимость.
  // Строки независимы: авто с большим объёмом и высокой стоимостью платит по обеим.
  const EXCISE_OVER_3000_KZT_PER_CC = 100;
  const EXCISE_LUXURY_THRESHOLD_MRP = 18000;
  const EXCISE_LUXURY_RATE = 0.10;

  const calculateCustomsPayments = () => {
    const value = parseFloat(customsValue) || 0;
    const volume = parseInt(engineVolume) || 0;
    const year = parseInt(manufactureYear) || new Date().getFullYear();
    const rate = parseFloat(exchangeRate) || 451;
    const eur = parseFloat(eurRate) || 523;

    if (value <= 0) {
      return EMPTY_RESULTS;
    }

    const customsValueKZT = currency === 'USD' ? value * rate : value;

    const currentYear = new Date().getFullYear();
    const vehicleAge = Math.max(0, currentYear - year);
    const isOldVehicle = vehicleAge > 7;

    const vatRate = 0.16;

    // ПТД: товар для личного пользования — один единый платёж, без сбора, НДС и акциза.
    // Электромобили по ПТД идут совокупным платежом (п. 4 табл. 2) — здесь считаются только по ДТ.
    if (regime === 'personal' && !isElectric) {
      let etp: number;
      let etpLabel: string;
      if (vehicleAge <= 3) {
        const valueEur = customsValueKZT / eur;
        const tier = ETP_UP_TO_3Y.find((row) => valueEur <= row.maxEur)!;
        etp = Math.max(customsValueKZT * tier.pct, tier.minEurPerCc * volume * eur);
        etpLabel = `${Math.round(tier.pct * 100)}% / ≥ ${String(tier.minEurPerCc).replace('.', ',')} €/см³`;
      } else {
        const band = ETP_VOLUME_BANDS_CC.findIndex((max) => volume <= max);
        const perCc = (vehicleAge <= 5 ? ETP_EUR_PER_CC_3_TO_5Y : ETP_EUR_PER_CC_OVER_5Y)[band];
        etp = perCc * volume * eur;
        etpLabel = `${String(perCc).replace('.', ',')} €/см³`;
      }
      return {
        ...EMPTY_RESULTS,
        customsValueKZT: Math.round(customsValueKZT),
        etp: Math.round(etp),
        etpLabel,
        isPersonal: true,
        totalPayments: Math.round(etp),
        vehicleAge,
        isOldVehicle,
        additionalRestrictions: vehicleAge <= 3 ? t('customs-clearance.youngCarNote') : t('customs-clearance.personalNote'),
      };
    }

    // Пошлина — Перечень изъятий РК из ЕТТ ЕАЭС (Решение Совета ЕЭК от 14.10.2015 № 59, ред. от
    // 20.05.2026 № 58), группа 8703. До 7 лет включительно — 15 % таможенной стоимости. Старше 7 лет —
    // те же 15 %, но не менее минимальной ставки в евро за 1 см³: 0,6 €/см³ (бензин ≤ 1 500 и > 3 000 см³,
    // дизель любого объёма); бензин 1 500–3 000 см³ — 0,5 €/см³ в коридоре 15–18 %. Прежние «25 %» и
    // «+5 п.п. за объём > 3 000» ни в ЕТТ, ни в перечне не существуют (сверка 13.09.2026). Электромобиль —
    // ввоз по ставкам ВТО: пошлина 0 %, НДС 16 %, утильсбор и транспортный налог не платятся.
    let customsDuty = 0;
    let dutyLabel = '15%';
    if (isElectric) {
      customsDuty = 0;
      dutyLabel = '0%';
    } else if (!isOldVehicle) {
      customsDuty = customsValueKZT * 0.15;
    } else if (fuel === 'petrol' && volume > 1500 && volume <= 3000) {
      const specific = 0.5 * volume * eur;
      customsDuty = Math.min(Math.max(specific, customsValueKZT * 0.15), customsValueKZT * 0.18);
      dutyLabel = '0,5 €/см³, 15–18%';
    } else {
      customsDuty = Math.max(customsValueKZT * 0.15, 0.6 * volume * eur);
      dutyLabel = '15% / ≥ 0,6 €/см³';
    }

    // Акциз (НК РК ст. 537): объём свыше 3 000 см³ и/или стоимость от 18 000 МРП.
    const excise = (!isElectric && volume > 3000 ? volume * EXCISE_OVER_3000_KZT_PER_CC : 0)
      + (customsValueKZT >= EXCISE_LUXURY_THRESHOLD_MRP * MRP_2026 ? customsValueKZT * EXCISE_LUXURY_RATE : 0);

    // Фиксированный таможенный сбор за декларирование: 6 МРП за декларацию
    // (не процент от стоимости). В базу импортного НДС сбор не входит.
    const customsFee = CUSTOMS_FEE_MRP * MRP_2026;

    const taxBase = customsValueKZT + customsDuty + excise;
    const vat = taxBase * vatRate;

    const totalPayments = customsFee + customsDuty + excise + vat;

    // «Экологического сбора» для авто старше 7 лет с объёмом > 2 500 см³ в актах нет — предупреждение снято.
    let additionalRestrictions = t('customs-clearance.dtNote');
    if (isElectric) {
      additionalRestrictions = t('customs-clearance.electricNote');
    } else if (isOldVehicle) {
      additionalRestrictions = `${t('customs-clearance.oldVehicleHigherRates')} ${t('customs-clearance.dtNote')}`;
    }

    return {
      ...EMPTY_RESULTS,
      customsValueKZT: Math.round(customsValueKZT),
      customsFee: Math.round(customsFee),
      customsDuty: Math.round(customsDuty),
      dutyLabel,
      excise: Math.round(excise),
      vat: Math.round(vat),
      totalPayments: Math.round(totalPayments),
      vehicleAge,
      isOldVehicle,
      additionalRestrictions
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    calculateCustomsPayments,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regime, manufactureYear, engineVolume, customsValue, currency, exchangeRate, fuel, eurRate, isElectric, i18n.language]
  );

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
            {!isElectric && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customs-clearance.regimeLabel')}</label>
                <div className="grid grid-cols-2">
                  {(['dt', 'personal'] as const).map((r, i) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegime(r)}
                      className={`px-3 py-3 text-sm border border-gray-300 transition-colors ${
                        regime === r ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      } ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'}`}
                    >
                      {t(`customs-clearance.regime_${r}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t(`customs-clearance.regimeHint_${regime}`)}</p>
              </div>
            )}

            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <input
                type="checkbox"
                checked={isElectric}
                onChange={(e) => setIsElectric(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-emerald-800">{t('customs-clearance.electricLabel')}</span>
            </label>

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
              <p className="text-xs text-gray-500 mt-1">{t('customs-clearance.ageHint')}</p>
            </div>

            {!isElectric && (
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
            )}

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

            {!isElectric && regime === 'dt' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('customs-clearance.fuelType')}</label>
                <div className="flex">
                  {(['petrol', 'diesel'] as const).map((f, i) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFuel(f)}
                      className={`flex-1 px-4 py-3 border border-gray-300 transition-colors ${
                        fuel === f ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      } ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'}`}
                    >
                      {t(`customs-clearance.fuel_${f}`)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('customs-clearance.fuelHint')}</p>
              </div>
            )}

            {!isElectric && (results.isOldVehicle || regime === 'personal') && (
              <div>
                <label htmlFor="eurRate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('customs-clearance.eurRate')}
                </label>
                <input
                  type="number"
                  id="eurRate"
                  value={eurRate}
                  onChange={(e) => setEurRate(e.target.value)}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">{t('customs-clearance.eurRateHint')}</p>
              </div>
            )}

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
                <li>{t('customs-clearance.etpRate')}</li>
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
                {results.isOldVehicle && !results.isPersonal && (
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

              {results.isPersonal ? (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">
                    {t('customs-clearance.etp')} ({results.etpLabel})
                  </span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.etp)}</span>
                </div>
              ) : (
              <>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('customs-clearance.customsFee')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.customsFee)}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">
                  {t('customs-clearance.customsDuty')} ({results.dutyLabel})
                </span>
                <span className="font-semibold text-gray-900">{formatNumber(results.customsDuty)}</span>
              </div>

              {results.excise > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">{t('customs-clearance.excise')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.excise)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">{t('customs-clearance.vat')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.vat)}</span>
              </div>
              </>
              )}
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
      <MethodologySection calculatorId="customs-clearance" />
      <FAQSection
        items={[
          { question: t('customs-clearance.faq.q1'), answer: t('customs-clearance.faq.a1') },
          { question: t('customs-clearance.faq.q2'), answer: t('customs-clearance.faq.a2') },
          { question: t('customs-clearance.faq.q3'), answer: t('customs-clearance.faq.a3') },
          { question: t('customs-clearance.faq.q4'), answer: t('customs-clearance.faq.a4') },
          { question: t('customs-clearance.faq.q5'), answer: t('customs-clearance.faq.a5') }
        ]}
        sources={[
          { title: t('customs-clearance.sources.exemptionList'), url: 'https://www.alta.ru/tamdoc/15sr0059/' },
          { title: t('customs-clearance.sources.personalUse'), url: 'https://www.alta.ru/tamdoc/17sr0107/' },
          { title: t('customs-clearance.sources.excise'), url: 'https://adilet.zan.kz/rus/docs/K2500000214' },
          { title: t('customs-clearance.sources.kgd'), url: 'https://kgd.gov.kz/' },
          { title: t('customs-clearance.sources.customsCode'), url: 'https://online.zakon.kz/document/?doc_id=37508292' },
        ]}
      />

      {/* Диаграмма структуры платежей — только для ДТ: по ПТД платёж один */}
      {results && results.totalPayments > 0 && !results.isPersonal && results.customsDuty > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('customs-clearance.chart.customsDuty'), value: results.customsDuty },
              { name: t('customs-clearance.chart.excise'), value: results.excise },
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
                  data: results.isPersonal ? [
                    { label: `${t('customs-clearance.etp')} (${results.etpLabel})`, value: `${results.etp.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('customs-clearance.export.total'), value: `${results.totalPayments.toLocaleString(NUMBER_LOCALE)} ₸` },
                  ] : [
                    { label: t('customs-clearance.chart.customsDuty'), value: `${results.customsDuty?.toLocaleString(NUMBER_LOCALE)} ₸` },
                    ...(results.excise > 0 ? [{ label: t('customs-clearance.chart.excise'), value: `${results.excise.toLocaleString(NUMBER_LOCALE)} ₸` }] : []),
                    { label: t('customs-clearance.chart.vat'), value: `${results.vat?.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('customs-clearance.customsFee'), value: `${results.customsFee.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('customs-clearance.export.total'), value: `${results.totalPayments.toLocaleString(NUMBER_LOCALE)} ₸` },
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
