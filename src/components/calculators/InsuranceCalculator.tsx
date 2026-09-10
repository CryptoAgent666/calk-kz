import React, { useState, useMemo } from 'react';
import { Shield, Calculator, ChevronRight, ChevronLeft, Users, MapPin, Car, Award, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import {
  OGPO_BASE_PREMIUM_MRP,
  OGPO_EXPLOITATION_OVER_7Y_COEFF,
  OGPO_EXPLOITATION_THRESHOLD_YEARS,
  OGPO_OTHER_SETTLEMENT_COEFF,
  OGPO_REGIONS,
  OGPO_VEHICLE_TYPES,
  findOgpoRegion,
  ogpoAgeExperienceCoeff,
  ogpoTerritoryCoeff
} from '../../data/ogpoCoefficients';

interface Driver {
  id: string;
  age: number;
  experience: number;
}

export default function InsuranceCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [currentStep, setCurrentStep] = useState(1);
  const [region, setRegion] = useState<string>('astana-city');
  const [vehicleType, setVehicleType] = useState<string>('passenger-car');
  const [manufactureYear, setManufactureYear] = useState<string>('2020');
  const [settlementType, setSettlementType] = useState<'city' | 'other'>('city');
  const [drivers, setDrivers] = useState<Driver[]>([{ id: '1', age: 30, experience: 5 }]);
  const [bonusMalusClass, setBonusMalusClass] = useState<string>('A');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — гидратация падает (#418/#425).
  const EMPTY_RESULTS = {
    basePremium: 0,
    registrationCoeff: 0,
    correctionCoeff: 0,
    territoryCoeff: 0,
    settlementCoeff: 1,
    vehicleTypeCoeff: 0,
    ageExperienceCoeff: 0,
    exploitationCoeff: 0,
    bonusMalusCoeff: 0,
    finalPremium: 0,
    vehicleAge: 0,
    worstDriver: null as { age: number; experience: number } | null
  };

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const BASE_PREMIUM_MRP = OGPO_BASE_PREMIUM_MRP;
  const CURRENT_YEAR = 2026;

  // Территориальная часть премии — ДВА сомножителя (ст. 19 п. 3 и п. 3-1
  // Закона № 446-II): коэффициент по территории регистрации из самого Закона
  // и поправочный коэффициент АРРФР (пост. Правления № 72 от 13.11.2025),
  // который «дополнительно применяется» к первому. Таблицы — в
  // src/data/ogpoCoefficients.ts, общие с CarTransferCalculator.
  const territoryCoefficients = OGPO_REGIONS.map((r) => ({
    ...r,
    name: t(r.labelKey),
    coefficient: ogpoTerritoryCoeff(r)
  }));

  // Коэффициенты по типу ТС — ст. 19 п. 6 Закона № 446-II.
  const vehicleTypeCoefficients = OGPO_VEHICLE_TYPES.map((v) => ({
    ...v,
    name: t(v.labelKey)
  }));

  // Система бонус-малус — пересмотрена с 07.04.2025 (действует и в 2026).
  // Добавлены 3 новых класса: A (новички, было 0.50→стартовый класс A=1.8),
  // M1=3.0 и M2=3.5 (верхний малус вместо прежнего M=2.45). Всего 18 классов.
  // Порядок: от худшего малуса (M2=3.5) к лучшему бонусу (класс 13=0.5).
  // Источник: приказ АРРФР, разъяснения (Банк. омбудсман, nur.kz, lada.kz).
  const bonusMalusClasses = [
    { class: 'M2', coefficient: 3.50, description: t('insurance-premium.bonusMalus.classM2') },
    { class: 'M1', coefficient: 3.00, description: t('insurance-premium.bonusMalus.classM1') },
    { class: 'M', coefficient: 2.45, description: t('insurance-premium.bonusMalus.classM') },
    { class: '0', coefficient: 2.30, description: t('insurance-premium.bonusMalus.class0') },
    { class: 'A', coefficient: 1.80, description: t('insurance-premium.bonusMalus.classA') },
    { class: '1', coefficient: 1.55, description: t('insurance-premium.bonusMalus.class1') },
    { class: '2', coefficient: 1.40, description: t('insurance-premium.bonusMalus.class2') },
    { class: '3', coefficient: 1.00, description: t('insurance-premium.bonusMalus.class3') },
    { class: '4', coefficient: 0.95, description: t('insurance-premium.bonusMalus.class4') },
    { class: '5', coefficient: 0.90, description: t('insurance-premium.bonusMalus.class5') },
    { class: '6', coefficient: 0.85, description: t('insurance-premium.bonusMalus.class6') },
    { class: '7', coefficient: 0.80, description: t('insurance-premium.bonusMalus.class7') },
    { class: '8', coefficient: 0.75, description: t('insurance-premium.bonusMalus.class8') },
    { class: '9', coefficient: 0.70, description: t('insurance-premium.bonusMalus.class9') },
    { class: '10', coefficient: 0.65, description: t('insurance-premium.bonusMalus.class10') },
    { class: '11', coefficient: 0.60, description: t('insurance-premium.bonusMalus.class11') },
    { class: '12', coefficient: 0.55, description: t('insurance-premium.bonusMalus.class12') },
    { class: '13', coefficient: 0.50, description: t('insurance-premium.bonusMalus.class13') }
  ];

  const calculatePremium = () => {
    if (!region || !vehicleType || !manufactureYear || drivers.length === 0 || !bonusMalusClass) {
      return EMPTY_RESULTS;
    }

    const selectedRegion = findOgpoRegion(region);
    const selectedVehicleType = vehicleTypeCoefficients.find(v => v.id === vehicleType);
    const selectedBonusMalus = bonusMalusClasses.find(b => b.class === bonusMalusClass);

    if (!selectedRegion || !selectedVehicleType || !selectedBonusMalus) {
      return EMPTY_RESULTS;
    }

    const basePremium = BASE_PREMIUM_MRP * MRP_2026;

    // Территория: коэффициент регистрации (п. 3) × поправочный АРРФР (п. 3-1).
    const registrationCoeff = selectedRegion.registrationCoeff;
    const correctionCoeff = selectedRegion.correctionCoeff;
    const territoryCoeff = ogpoTerritoryCoeff(selectedRegion);

    // П. 4: для иных городов и населённых пунктов области — ещё ×0,8.
    // Для столицы и городов республиканского значения неприменимо.
    const settlementCoeff = !selectedRegion.isCity && settlementType === 'other'
      ? OGPO_OTHER_SETTLEMENT_COEFF
      : 1.0;

    const vehicleTypeCoeff = selectedVehicleType.coefficient;

    // Возраст/стаж — одна комбинированная таблица (п. 7); в полис вписывают
    // несколько водителей, премию считают по наихудшему из них.
    let ageExperienceCoeff = 1.0;
    let worstDriver = null as { age: number; experience: number } | null;

    drivers.forEach(driver => {
      const driverCoeff = ogpoAgeExperienceCoeff(driver.age, driver.experience);
      if (driverCoeff > ageExperienceCoeff) {
        ageExperienceCoeff = driverCoeff;
        worstDriver = { age: driver.age, experience: driver.experience };
      }
    });

    // Коэффициент срока эксплуатации (п. 9): до 7 лет включительно — 1,00.
    const year = parseInt(manufactureYear) || CURRENT_YEAR;
    const vehicleAge = Math.max(0, CURRENT_YEAR - year);
    const exploitationCoeff = vehicleAge > OGPO_EXPLOITATION_THRESHOLD_YEARS
      ? OGPO_EXPLOITATION_OVER_7Y_COEFF
      : 1.0;

    const bonusMalusCoeff = selectedBonusMalus.coefficient;

    const finalPremium = basePremium * territoryCoeff * settlementCoeff *
                        vehicleTypeCoeff * ageExperienceCoeff * exploitationCoeff *
                        bonusMalusCoeff;

    return {
      basePremium: Math.round(basePremium),
      registrationCoeff,
      correctionCoeff,
      territoryCoeff,
      settlementCoeff,
      vehicleTypeCoeff,
      ageExperienceCoeff,
      exploitationCoeff,
      bonusMalusCoeff,
      finalPremium: Math.round(finalPremium),
      vehicleAge,
      worstDriver
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    calculatePremium,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [region, vehicleType, manufactureYear, settlementType, drivers, bonusMalusClass]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const addDriver = () => {
    const newId = (drivers.length + 1).toString();
    setDrivers([...drivers, { id: newId, age: 30, experience: 5 }]);
  };

  const removeDriver = (id: string) => {
    if (drivers.length > 1) {
      setDrivers(drivers.filter(d => d.id !== id));
    }
  };

  const updateDriver = (id: string, field: 'age' | 'experience', value: number) => {
    setDrivers(drivers.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const selectedRegionData = findOgpoRegion(region);

  const steps = [
    t('insurance-premium.steps.territory'),
    t('insurance-premium.steps.vehicle'),
    t('insurance-premium.steps.drivers'),
    t('insurance-premium.steps.bonusMalus'),
    t('insurance-premium.steps.result')
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1: return region !== '';
      case 2: return vehicleType !== '' && manufactureYear !== '';
      case 3: return drivers.every(d => d.age > 0 && d.experience >= 0);
      case 4: return bonusMalusClass !== '';
      default: return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('insurance-premium.title')}</h1>
            <p className="text-gray-600">{t('insurance-premium.description')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800">
            {i18n.language === 'kk'
              ? 'Есеп № 446-II Заңның 19-бабы бойынша жүргізіледі. Сақтандырушы өңірдің түзету коэффициентін ±10%-ға өзгертуге құқылы (3-1-тармақ), сондықтан нақты полистің бағасы есептелгеннен осы шекте өзгеше болуы мүмкін.'
              : 'Расчёт ведётся по ст. 19 Закона № 446-II. Страховщик вправе отклонить поправочный коэффициент региона на ±10% (п. 3-1), поэтому цена конкретного полиса может отличаться от расчётной в этих пределах.'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep > index + 1 ? 'bg-green-500 text-white' :
                currentStep === index + 1 ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > index + 1 ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <span className="text-lg font-semibold text-gray-700">
            {t('insurance-premium.stepIndicator', { current: currentStep, total: steps.length, step: steps[currentStep - 1] })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
        {/* Step 1: Territory */}
        {currentStep === 1 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('insurance-premium.territoryTitle')}</h2>
            </div>

            <p className="text-gray-600 mb-6">
              {t('insurance-premium.territoryDescription')}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {territoryCoefficients.map((territory) => (
                <button
                  key={territory.id}
                  onClick={() => setRegion(territory.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    region === territory.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{territory.name}</div>
                  <div className="text-sm text-gray-600">
                    {t('insurance-premium.coefficient')}: {territory.coefficient}
                  </div>
                  <div className="text-xs text-gray-500">
                    {territory.registrationCoeff} × {territory.correctionCoeff}
                  </div>
                </button>
              ))}
            </div>

            {selectedRegionData && !selectedRegionData.isCity && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {t('insurance-premium.settlementTitle')}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(['city', 'other'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSettlementType(option)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        settlementType === option
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium">
                        {option === 'city'
                          ? t('insurance-premium.settlementCity')
                          : t('insurance-premium.settlementOther')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {t('insurance-premium.coefficient')}: {option === 'city' ? 1 : OGPO_OTHER_SETTLEMENT_COEFF}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('insurance-premium.settlementNote')}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Vehicle */}
        {currentStep === 2 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Car className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('insurance-premium.vehicleTitle')}</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('insurance-premium.vehicleTypeLabel')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicleTypeCoefficients.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setVehicleType(type.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        vehicleType === type.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-gray-600">
                        {t('insurance-premium.coefficient')}: {type.coefficient}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('insurance-premium.manufactureYearLabel')}
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
                  placeholder={t('insurance-premium.manufactureYearPlaceholder')}
                  min="1990"
                  max={CURRENT_YEAR}
                  className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('insurance-premium.manufactureYearHint')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Drivers */}
        {currentStep === 3 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('insurance-premium.driversTitle')}</h2>
            </div>

            <p className="text-gray-600 mb-6">
              {t('insurance-premium.driversDescription')}
            </p>

            <div className="space-y-4">
              {drivers.map((driver, index) => (
                <div key={driver.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{t('insurance-premium.driverLabel', { number: index + 1 })}</h3>
                    {drivers.length > 1 && (
                      <button
                        onClick={() => removeDriver(driver.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {t('insurance-premium.removeDriver')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('insurance-premium.ageLabel')}
                      </label>
                      <input
                        type="number"
                        value={driver.age}
                        onChange={(e) => updateDriver(driver.id, 'age', parseInt(e.target.value) || 0)}
                        placeholder={t('insurance-premium.agePlaceholder')}
                        min="18"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('insurance-premium.experienceLabel')}
                      </label>
                      <input
                        type="number"
                        value={driver.experience}
                        onChange={(e) => updateDriver(driver.id, 'experience', parseInt(e.target.value) || 0)}
                        placeholder={t('insurance-premium.experiencePlaceholder')}
                        min="0"
                        max="60"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addDriver}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {t('insurance-premium.addDriver')}
              </button>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">{t('insurance-premium.ageExperienceCoefficientsTitle')}</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>{t('insurance-premium.ageExperienceCoeff1')}</li>
                <li>{t('insurance-premium.ageExperienceCoeff2')}</li>
                <li>{t('insurance-premium.ageExperienceCoeff3')}</li>
                <li>{t('insurance-premium.ageExperienceCoeff4')}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Bonus-Malus */}
        {currentStep === 4 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Award className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('insurance-premium.bonusMalusTitle')}</h2>
            </div>

            <p className="text-gray-600 mb-6">
              {t('insurance-premium.bonusMalusDescription')}
            </p>

            <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {bonusMalusClasses.map((bmClass) => (
                <button
                  key={bmClass.class}
                  onClick={() => setBonusMalusClass(bmClass.class)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    bonusMalusClass === bmClass.class
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{t('insurance-premium.classLabel')} {bmClass.class}</span>
                    <span className="text-sm font-semibold">×{bmClass.coefficient}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {bmClass.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">
                    {t('insurance-premium.bonusMalusInfoTitle')}
                  </h4>
                  <p className="text-amber-800 text-sm">
                    {t('insurance-premium.bonusMalusInfoText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {currentStep === 5 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Calculator className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">{t('insurance-premium.resultsTitle')}</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">{t('insurance-premium.premiumCost')}</span>
                  <span className="text-2xl font-bold text-green-700">{formatNumber(results.finalPremium)}</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-700">
                <h3 className="font-semibold text-gray-900 mb-4">{t('insurance-premium.calculationDetails')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.basePremium')}</span>
                    <span>{formatNumber(results.basePremium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.registrationCoefficient')}</span>
                    <span>×{results.registrationCoeff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.correctionCoefficient')}</span>
                    <span>×{results.correctionCoeff}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{t('insurance-premium.territoryCoefficient')}</span>
                    <span>×{results.territoryCoeff}</span>
                  </div>
                  {results.settlementCoeff !== 1 && (
                    <div className="flex justify-between">
                      <span>{t('insurance-premium.settlementCoefficient')}</span>
                      <span>×{results.settlementCoeff}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.vehicleTypeCoefficient')}</span>
                    <span>×{results.vehicleTypeCoeff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.ageExperienceCoefficient')}</span>
                    <span>×{results.ageExperienceCoeff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.exploitationCoefficient')}</span>
                    <span>×{results.exploitationCoeff}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('insurance-premium.bonusMalusCoefficient')}</span>
                    <span>×{results.bonusMalusCoeff}</span>
                  </div>
                </div>
              </div>

              {results.worstDriver && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 mb-1">
                        {t('insurance-premium.coefficientCalculatedBy')}
                      </h4>
                      <p className="text-amber-800 text-sm">
                        {t('insurance-premium.worstDriverInfo', {
                          age: results.worstDriver.age,
                          experience: results.worstDriver.experience,
                          coefficient: results.ageExperienceCoeff
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {results.vehicleAge > 7 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    {t('insurance-premium.vehicleAgeInfo', { age: results.vehicleAge })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('insurance-premium.back')}</span>
        </button>

        {currentStep < 5 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              canProceed()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{t('insurance-premium.next')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(1)}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <span>{t('insurance-premium.newCalculation')}</span>
          </button>
        )}
      </div>

      {/* Formula Info */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('insurance-premium.formulaTitle')}</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
          {t('insurance-premium.formula')}
        </div>
        <p className="text-gray-600 text-sm mt-3">
          {t('insurance-premium.formulaNote')}
        </p>
      </div>

      {/* Диаграмма */}
      {results.finalPremium > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('insurance-premium.chart.premium'), value: results.finalPremium },
            ]}
            title={t('insurance-premium.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.finalPremium > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('insurance-premium.export.title'),
              subtitle: `${t('insurance-premium.export.region')}: ${region}`,
              sections: [
                {
                  title: t('insurance-premium.export.parameters'),
                  data: [
                    { label: t('insurance-premium.export.region'), value: region },
                    { label: t('insurance-premium.export.vehicleType'), value: vehicleType },
                    { label: t('insurance-premium.export.manufactureYear'), value: manufactureYear },
                  ]
                },
                {
                  title: t('insurance-premium.export.results'),
                  data: [
                    { label: t('insurance-premium.export.premium'), value: `${results.finalPremium.toLocaleString()} ₸` },
                    { label: t('insurance-premium.export.bonusMalusClass'), value: bonusMalusClass },
                  ]
                }
              ],
              footer: t('insurance-premium.export.footer')
            }}
            filename="insurance-calculation"
          />
        </div>
      )}

      <MethodologySection calculatorId="insurance-premium" />

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('insurance-premium.faq.q1'), answer: t('insurance-premium.faq.a1') },
          { question: t('insurance-premium.faq.q2'), answer: t('insurance-premium.faq.a2') },
          { question: t('insurance-premium.faq.q3'), answer: t('insurance-premium.faq.a3') },
          { question: t('insurance-premium.faq.q4'), answer: t('insurance-premium.faq.a4') },
          { question: t('insurance-premium.faq.q5'), answer: t('insurance-premium.faq.a5') }
        ]}
        sources={[
          { title: t('insurance-premium.sources.law'), url: 'https://online.zakon.kz/document/?doc_id=1044080' },
          { title: t('insurance-premium.sources.finreg'), url: 'https://finreg.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="insurance-premium"
        calculatorTitle={t('insurance-premium.title')}
      />
      <LastUpdated calculatorId="insurance-premium" />
    </div>
  );
}
