import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, AlertTriangle, Info, Building, BarChart3 } from 'lucide-react';
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

export default function PropertyTaxCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [propertyType, setPropertyType] = useState<string>('apartment');
  const [city, setCity] = useState<string>('almaty');
  const [area, setArea] = useState<string>('60');
  const [buildYear, setBuildYear] = useState<string>('2010');
  // НК РК ст. 600 п. 4 разводит два параметра, которые до 09.09.2026 были склеены
  // в один «материал стен»:
  //  — норму амортизации задаёт ГРУППА КАПИТАЛЬНОСТИ жилища (шесть групп);
  //  — материал стен определяет только ПОРОГ износа: каменное или из несущих
  //    панелей — 70 %, из иных материалов — 65 %.
  const [capitalityGroup, setCapitalityGroup] = useState<string>('3');
  const [wallMaterial, setWallMaterial] = useState<string>('panel');
  // Коэффициент функционального износа (ст. 600 п. 5): этаж, угол, материал стен, благоустройство, отопление.
  const [floorPos, setFloorPos] = useState<'first' | 'middle' | 'last'>('middle');
  const [isCorner, setIsCorner] = useState<boolean>(false);
  const [noAmenities, setNoAmenities] = useState<boolean>(false);
  const [heating, setHeating] = useState<'central' | 'gas' | 'solid' | 'stove'>('central');
  const [useCustomCoefficients, setUseCustomCoefficients] = useState<boolean>(false);
  const [baseCost, setBaseCost] = useState<string>('');
  const [zoneCoefficient, setZoneCoefficient] = useState<string>('');
  const [mrpCoefficient, setMrpCoefficient] = useState<string>('');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — гидратация падает (#418/#425).
  const EMPTY_RESULTS = {
    baseCostPerSqm: 0,
    zoneCoeff: 0,
    mrpCoeff: 0,
    wearPercent: 0,
    wearCoeff: 0,
    wearExceeded: false,
    funcCoeff: 1,
    taxBase: 0,
    taxRate: 0,
    taxAmount: 0,
    exemptionAmount: 0,
    finalAmount: 0
  };

  const CURRENT_YEAR = 2026;
  const MRP_2026 = 4325;

  // Нормы амортизации по группам капитальности — НК РК ст. 600 п. 4.
  // Прежняя двухматериальная шкала (1 %/год для каменных, 2 % для иных) покрывала
  // лишь 3-ю и 4-ю группы из шести и подменяла собой группу капитальности.
  const capitalityGroups = [
    { id: '1', rate: 0.7, nameKey: 'calculators:property-tax.capitalityGroup1' },
    { id: '2', rate: 0.8, nameKey: 'calculators:property-tax.capitalityGroup2' },
    { id: '3', rate: 1.0, nameKey: 'calculators:property-tax.capitalityGroup3' },
    { id: '4', rate: 2.0, nameKey: 'calculators:property-tax.capitalityGroup4' },
    { id: '5', rate: 3.3, nameKey: 'calculators:property-tax.capitalityGroup5' },
    { id: '6', rate: 6.6, nameKey: 'calculators:property-tax.capitalityGroup6' }
  ];

  // Порог физического износа по материалу стен — НК РК ст. 600 п. 4: «Если
  // физический износ каменного или из несущих панелей жилища, дачной постройки
  // превышает 70 процентов, из иных материалов – 65 процентов, то коэффициент
  // физического износа принимается равным 0,2». До 09.09.2026 код вместо этого
  // обрезал сам износ (Math.min) и упирался в К физ 0,30/0,35.
  const WEAR_EXCEEDED_COEFF = 0.2;
  // Материал стен: порог износа (п. 4: каменные и панельные — 70%, иные — 65%) и К мат.ст (п. 5).
  const wallMaterials = [
    { id: 'brick', maxWear: 70, kMat: 1.1, nameKey: 'calculators:property-tax.wallBrick' },
    { id: 'keramzit', maxWear: 70, kMat: 1.0, nameKey: 'calculators:property-tax.wallKeramzit' },
    { id: 'panel', maxWear: 70, kMat: 1.0, nameKey: 'calculators:property-tax.wallPanel' },
    { id: 'monolith', maxWear: 70, kMat: 0.7, nameKey: 'calculators:property-tax.wallMonolithSlag' },
    { id: 'wood', maxWear: 65, kMat: 0.85, nameKey: 'calculators:property-tax.wallWood' },
    { id: 'framePanel', maxWear: 65, kMat: 0.6, nameKey: 'calculators:property-tax.wallFramePanel' },
    { id: 'adobe', maxWear: 65, kMat: 0.5, nameKey: 'calculators:property-tax.wallAdobe' },
    { id: 'other', maxWear: 65, kMat: 1.0, nameKey: 'calculators:property-tax.wallOther' }
  ];
  const FLOOR_COEFF = { first: 0.95, middle: 1.0, last: 0.9 } as const;
  const HEATING_COEFF = { central: 1.0, gas: 0.98, solid: 0.95, stove: 0.9 } as const;
  // Доля базовой стоимости (п. 3): гараж и паркинг — 15%, кладовка, хозпостройка, подвал — 25%;
  // для них К функц не применяется. Раньше тип объекта на расчёт не влиял (гараж считался как квартира).
  const TYPE_BASE_SHARE: Record<string, number> = { apartment: 1, house: 1, cottage: 1, garage: 0.15, storage: 0.25 };

  const propertyTypes = [
    { id: 'apartment', nameKey: 'calculators:property-tax.propertyType_apartment', icon: '🏠' },
    { id: 'house', nameKey: 'calculators:property-tax.propertyType_house', icon: '🏡' },
    { id: 'cottage', nameKey: 'calculators:property-tax.propertyType_cottage', icon: '🏘️' },
    { id: 'garage', nameKey: 'calculators:property-tax.propertyType_garage', icon: '🚗' },
    { id: 'storage', nameKey: 'calculators:property-tax.propertyType_storage', icon: '📦' }
  ];

  // Базовая стоимость 1 м² жилища — ст. 600 НК РК (новый НК K2500000214, ред. 2026):
  // города респ. значения (Алматы/Астана/Шымкент) = 60 000 ₸/м²; областные центры = 36 000 ₸/м².
  // Коэффициент зонирования (Кзон) утверждается местными исполнительными органами (акиматами)
  // и различается по районам — здесь нейтральный дефолт 1.0, точное значение задаётся вручную.
  // К изм.мрп = МРП текущего года / МРП предыдущего (п. 7): 4 325 / 3 932 ≈ 1,0999 для 2026.
  const MRP_CHANGE_2026 = 4325 / 3932;
  // 36 000 ₸ — только 17 городов из таблицы п. 2; прочие населённые пункты дешевле (раньше «Другой город» = 36 000).
  const cities = [
    { id: 'almaty', nameKey: 'calculators:property-tax.city_almaty', baseCost: 60000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'astana', nameKey: 'calculators:property-tax.city_astana', baseCost: 60000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'shymkent', nameKey: 'calculators:property-tax.city_shymkent', baseCost: 60000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'karaganda', nameKey: 'calculators:property-tax.city_karaganda', baseCost: 36000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'aktobe', nameKey: 'calculators:property-tax.city_aktobe', baseCost: 36000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'other', nameKey: 'calculators:property-tax.city_other', baseCost: 36000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'oblastTown', nameKey: 'calculators:property-tax.city_oblastTown', baseCost: 12000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'districtTown', nameKey: 'calculators:property-tax.city_districtTown', baseCost: 6000, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'settlement', nameKey: 'calculators:property-tax.city_settlement', baseCost: 4200, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 },
    { id: 'village', nameKey: 'calculators:property-tax.city_village', baseCost: 2700, zoneCoeff: 1.0, mrpCoeff: MRP_CHANGE_2026 }
  ];

  // Прогрессивная (маржинальная) шкала налога на имущество физлиц — ст. 602 НК РК (новый НК K2500000214, 2026).
  // Налог = base (фиксированная сумма в ₸) + rate% с суммы, превышающей min.
  const taxRates = [
    { min: 0,         max: 2000000,    base: 0,       rate: 0.05 },
    { min: 2000000,   max: 4000000,    base: 1000,    rate: 0.08 },
    { min: 4000000,   max: 6000000,    base: 2600,    rate: 0.1 },
    { min: 6000000,   max: 8000000,    base: 4600,    rate: 0.15 },
    { min: 8000000,   max: 10000000,   base: 7600,    rate: 0.2 },
    { min: 10000000,  max: 12000000,   base: 11600,   rate: 0.25 },
    { min: 12000000,  max: 14000000,   base: 16600,   rate: 0.3 },
    { min: 14000000,  max: 16000000,   base: 22600,   rate: 0.35 },
    { min: 16000000,  max: 18000000,   base: 29600,   rate: 0.4 },
    { min: 18000000,  max: 20000000,   base: 37600,   rate: 0.45 },
    { min: 20000000,  max: 75000000,   base: 46600,   rate: 0.5 },
    { min: 75000000,  max: 100000000,  base: 321600,  rate: 0.6 },
    { min: 100000000, max: 150000000,  base: 471600,  rate: 0.65 },
    { min: 150000000, max: 350000000,  base: 796600,  rate: 0.7 },
    { min: 350000000, max: 450000000,  base: 2196600, rate: 0.75 },
    { min: 450000000, max: Infinity,   base: 2946600, rate: 2.0 }
  ];

  const calculatePropertyTax = () => {
    if (!area || parseFloat(area) <= 0) {
      return EMPTY_RESULTS;
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
    const group = capitalityGroups.find(g => g.id === capitalityGroup) || capitalityGroups[2];
    const material = wallMaterials.find(m => m.id === wallMaterial) || wallMaterials[0];
    // Износ НЕ обрезаем ни порогом, ни сотней: показываем ту же величину, с которой
    // норма сравнивает порог (для дома 1960 г. по 4-й группе это 132 %). Порог из
    // ст. 600 п. 4 переключает коэффициент физического износа на фиксированные 0,2,
    // поэтому К физ отрицательным стать не может: без превышения износ ≤ 70 %.
    const wearPercent = age * group.rate;
    const wearExceeded = wearPercent > material.maxWear;
    const wearCoeff = wearExceeded ? WEAR_EXCEEDED_COEFF : 1 - wearPercent / 100;

    const share = TYPE_BASE_SHARE[propertyType] ?? 1;
    const isDwelling = share === 1;
    // К функц — только для жилищ и дачных построек; этаж и угол — только для квартир.
    const funcCoeff = isDwelling
      ? (propertyType === 'apartment' ? FLOOR_COEFF[floorPos] * (isCorner ? 0.95 : 1) : 1)
        * material.kMat * (noAmenities ? 0.8 : 1) * HEATING_COEFF[heating]
      : 1;
    const taxBase = baseCostPerSqm * share * propertyArea * wearCoeff * funcCoeff * zoneCoeff * mrpCoeff;

    const applicableRate = taxRates.find(rate => taxBase >= rate.min && taxBase <= rate.max) || taxRates[taxRates.length - 1];
    const taxRate = applicableRate.rate;

    // Маржинальный расчёт: фиксированная сумма + процент с превышения нижней границы ступени.
    let taxAmount = applicableRate.base + (taxBase - applicableRate.min) * (taxRate / 100);

    // В НК РК освобождение от налога на имущество физлиц НЕ зависит от площади жилья.
    // Льготы предоставляются отдельным категориям граждан (пенсионеры по возрасту,
    // инвалиды I–II групп, участники ВОВ, многодетные матери и др.) в пределах,
    // установленных кодексом, и здесь автоматически не применяются — калькулятор
    // показывает полную оценочную сумму налога.
    const exemptionAmount = 0;

    const finalAmount = Math.max(0, taxAmount);

    return {
      baseCostPerSqm: Math.round(baseCostPerSqm),
      zoneCoeff,
      mrpCoeff,
      wearPercent: Math.round(wearPercent * 10) / 10,
      wearCoeff: Math.round(wearCoeff * 1000) / 1000,
      wearExceeded,
      funcCoeff: Math.round(funcCoeff * 1000) / 1000,
      taxBase: Math.round(taxBase),
      taxRate,
      taxAmount: Math.round(taxAmount + exemptionAmount),
      exemptionAmount: Math.round(exemptionAmount),
      finalAmount: Math.round(finalAmount)
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    calculatePropertyTax,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [propertyType, capitalityGroup, wallMaterial, floorPos, isCorner, noAmenities, heating, city, area, buildYear, useCustomCoefficients, baseCost, zoneCoefficient, mrpCoefficient]
  );

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

      <QuickAnswer calculatorId="property-tax" />

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
                ariaLabel={t('property-tax.totalArea')}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-tax.capitalityGroup')}
              </label>
              <select
                value={capitalityGroup}
                onChange={(e) => setCapitalityGroup(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {capitalityGroups.map((g) => (
                  <option key={g.id} value={g.id}>{t(g.nameKey)}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">{t('property-tax.capitalityGroupHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-tax.wallMaterial')}
              </label>
              <select
                value={wallMaterial}
                onChange={(e) => setWallMaterial(e.target.value)}
                aria-label={t('property-tax.wallMaterial')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {wallMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{t(m.nameKey)} — ×{m.kMat.toLocaleString(NUMBER_LOCALE)}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">{t('property-tax.wallMaterialHint')}</p>
            </div>

            {(propertyType === 'apartment' || propertyType === 'house' || propertyType === 'cottage') && (
              <div className="grid sm:grid-cols-2 gap-4">
                {propertyType === 'apartment' && (
                  <div>
                    <label htmlFor="floorPos" className="block text-sm font-medium text-gray-700 mb-2">{t('property-tax.floorLabel')}</label>
                    <select id="floorPos" value={floorPos} onChange={(e) => setFloorPos(e.target.value as 'first' | 'middle' | 'last')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                      <option value="middle">{t('property-tax.floorMiddle')} — ×1</option>
                      <option value="first">{t('property-tax.floorFirst')} — ×0,95</option>
                      <option value="last">{t('property-tax.floorLast')} — ×0,9</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="heating" className="block text-sm font-medium text-gray-700 mb-2">{t('property-tax.heatingLabel')}</label>
                  <select id="heating" value={heating} onChange={(e) => setHeating(e.target.value as 'central' | 'gas' | 'solid' | 'stove')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
                    <option value="central">{t('property-tax.heatingCentral')} — ×1</option>
                    <option value="gas">{t('property-tax.heatingGas')} — ×0,98</option>
                    <option value="solid">{t('property-tax.heatingSolid')} — ×0,95</option>
                    <option value="stove">{t('property-tax.heatingStove')} — ×0,9</option>
                  </select>
                </div>
                {propertyType === 'apartment' && (
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={isCorner} onChange={(e) => setIsCorner(e.target.checked)} className="h-4 w-4" />
                    {t('property-tax.cornerLabel')}
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={noAmenities} onChange={(e) => setNoAmenities(e.target.checked)} className="h-4 w-4" />
                  {t('property-tax.noAmenitiesLabel')}
                </label>
                <p className="sm:col-span-2 text-xs text-gray-500">{t('property-tax.funcCoeffHint', { k: results.funcCoeff })}</p>
              </div>
            )}

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
                {t('property-tax.wear')}: {results.wearPercent}% • {t('property-tax.wearCoeff')}: {results.wearCoeff.toLocaleString(NUMBER_LOCALE)} • {t('property-tax.zoneCoeff')}: {results.zoneCoeff}
              </div>
              {results.wearExceeded && (
                <div className="text-xs text-blue-700 mt-1">{t('property-tax.wearExceededNote')}</div>
              )}
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
                <span className="font-semibold text-gray-900">{results.taxRate.toLocaleString(NUMBER_LOCALE)}%</span>
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
                    {rate.min === 0
                      ? `${t('property-tax.upTo')} ${formatNumber(rate.max)}`
                      : `${t('property-tax.over')} ${formatNumber(rate.min)}${rate.max !== Infinity ? ` ${t('property-tax.upTo')} ${formatNumber(rate.max)}` : ''}`}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right font-semibold">
                    {rate.base > 0 ? `${formatNumber(rate.base)} + ` : ''}{rate.rate.toLocaleString(NUMBER_LOCALE)}%
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
      <CalculatorExamples calculatorId="property-tax" />
      <MethodologySection calculatorId="property-tax" />
      <FAQSection
        items={[
          { question: t('property-tax.faq.q1'), answer: t('property-tax.faq.a1') },
          { question: t('property-tax.faq.q2'), answer: t('property-tax.faq.a2') },
          { question: t('property-tax.faq.q3'), answer: t('property-tax.faq.a3') },
          { question: t('property-tax.faq.q4'), answer: t('property-tax.faq.a4') },
          { question: t('property-tax.faq.q5'), answer: t('property-tax.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі, 67-тарау (597–603-баптар)' : 'Налоговый кодекс РК, глава 67 (ст. 597–603)', url: i18n.language === 'kk' ? 'https://adilet.zan.kz/kaz/docs/K2500000214' : 'https://adilet.zan.kz/rus/docs/K2500000214' },
          { title: i18n.language === 'kk' ? 'eGov.kz — мүлік салығы' : 'eGov.kz — Налог на имущество', url: 'https://egov.kz/' },
        ]}
      />

      {/* Экспорт результатов */}
      {results && results.finalAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('property-tax.exportDoc.title'),
              subtitle: selectedPropertyType ? t(selectedPropertyType.nameKey) : '',
              sections: [
                {
                  title: t('common:exportDoc.results'),
                  data: [
                    { label: t('property-tax.exportDoc.type'), value: selectedPropertyType ? t(selectedPropertyType.nameKey) : '' },
                    { label: t('property-tax.exportDoc.assessed'), value: `${results.taxBase?.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('property-tax.exportDoc.annual'), value: `${results.finalAmount.toLocaleString(NUMBER_LOCALE)} ₸` },
                  ]
                }
              ],
              footer: t('common:buttons.calculatedOn')
            }}
            filename="property-tax-calculation"
          />
        </div>
      )}

      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="property-tax"
        calculatorTitle={t('property-tax.heading')}
      />
      <LastUpdated calculatorId="property-tax" />
    </div>
  );
}
