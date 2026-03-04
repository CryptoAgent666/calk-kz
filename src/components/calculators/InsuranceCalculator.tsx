import React, { useState, useEffect } from 'react';
import { Shield, Calculator, ChevronRight, ChevronLeft, Users, MapPin, Car, Award, Info, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ComparisonBarChart } from '../ui/ChartComponents';

interface Driver {
  id: string;
  age: number;
  experience: number;
}

export default function InsuranceCalculator() {
  const { t } = useTranslation('calculators');
  const [currentStep, setCurrentStep] = useState(1);
  const [region, setRegion] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [manufactureYear, setManufactureYear] = useState<string>('');
  const [drivers, setDrivers] = useState<Driver[]>([{ id: '1', age: 30, experience: 5 }]);
  const [bonusMalusClass, setBonusMalusClass] = useState<string>('3');

  const [results, setResults] = useState({
    basePremium: 0,
    territoryCoeff: 0,
    vehicleTypeCoeff: 0,
    ageExperienceCoeff: 0,
    exploitationCoeff: 0,
    bonusMalusCoeff: 0,
    finalPremium: 0,
    vehicleAge: 0,
    worstDriver: null as { age: number; experience: number } | null
  });

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const BASE_PREMIUM_MRP = 1.9;
  const CURRENT_YEAR = 2026;

  // Коэффициенты по территориям
  const territoryCoefficients = [
    { id: 'almaty-city', name: t('insurance-premium.regions.almatyCity'), coefficient: 1.5 },
    { id: 'astana-city', name: t('insurance-premium.regions.astanaCity'), coefficient: 1.4 },
    { id: 'shymkent-city', name: t('insurance-premium.regions.shymkentCity'), coefficient: 1.3 },
    { id: 'almaty-region', name: t('insurance-premium.regions.almatyRegion'), coefficient: 1.37 },
    { id: 'turkestan-region', name: t('insurance-premium.regions.turkestanRegion'), coefficient: 1.57 },
    { id: 'karaganda-region', name: t('insurance-premium.regions.karagandaRegion'), coefficient: 1.2 },
    { id: 'aktobe-region', name: t('insurance-premium.regions.aktobeRegion'), coefficient: 1.1 },
    { id: 'atyrau-region', name: t('insurance-premium.regions.atyrauRegion'), coefficient: 1.0 },
    { id: 'west-kazakhstan', name: t('insurance-premium.regions.westKazakhstan'), coefficient: 1.05 },
    { id: 'east-kazakhstan', name: t('insurance-premium.regions.eastKazakhstan'), coefficient: 1.15 },
    { id: 'north-kazakhstan', name: t('insurance-premium.regions.northKazakhstan'), coefficient: 1.0 },
    { id: 'pavlodar-region', name: t('insurance-premium.regions.pavlodarRegion'), coefficient: 1.1 },
    { id: 'kostanay-region', name: t('insurance-premium.regions.kostanayRegion'), coefficient: 1.05 },
    { id: 'zhambyl-region', name: t('insurance-premium.regions.zhambylRegion'), coefficient: 1.25 },
    { id: 'kyzylorda-region', name: t('insurance-premium.regions.kyzylordaRegion'), coefficient: 1.2 },
    { id: 'mangystau-region', name: t('insurance-premium.regions.mangystauRegion'), coefficient: 1.3 }
  ];

  // Коэффициенты по типам ТС
  const vehicleTypeCoefficients = [
    { id: 'passenger-car', name: t('insurance-premium.vehicleTypes.passengerCar'), coefficient: 1.0 },
    { id: 'taxi', name: t('insurance-premium.vehicleTypes.taxi'), coefficient: 2.0 },
    { id: 'truck-up-to-3.5t', name: t('insurance-premium.vehicleTypes.truckUpTo35t'), coefficient: 1.2 },
    { id: 'truck-3.5-12t', name: t('insurance-premium.vehicleTypes.truck35To12t'), coefficient: 1.5 },
    { id: 'truck-over-12t', name: t('insurance-premium.vehicleTypes.truckOver12t'), coefficient: 2.0 },
    { id: 'bus-up-to-20', name: t('insurance-premium.vehicleTypes.busUpTo20'), coefficient: 1.3 },
    { id: 'bus-20-35', name: t('insurance-premium.vehicleTypes.bus20To35'), coefficient: 1.7 },
    { id: 'bus-over-35', name: t('insurance-premium.vehicleTypes.busOver35'), coefficient: 2.2 },
    { id: 'motorcycle', name: t('insurance-premium.vehicleTypes.motorcycle'), coefficient: 0.7 }
  ];

  // Система бонус-малус
  const bonusMalusClasses = [
    { class: 'M', coefficient: 2.45, description: t('insurance-premium.bonusMalus.classM') },
    { class: '0', coefficient: 2.30, description: t('insurance-premium.bonusMalus.class0') },
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
    const selectedRegion = territoryCoefficients.find(r => r.id === region);
    const selectedVehicleType = vehicleTypeCoefficients.find(v => v.id === vehicleType);
    const selectedBonusMalus = bonusMalusClasses.find(b => b.class === bonusMalusClass);

    if (!selectedRegion || !selectedVehicleType || !selectedBonusMalus) {
      return;
    }

    const basePremium = BASE_PREMIUM_MRP * MRP_2026;
    const territoryCoeff = selectedRegion.coefficient;
    const vehicleTypeCoeff = selectedVehicleType.coefficient;

    // Определение коэффициента возраст/стаж (берем худшего водителя)
    let ageExperienceCoeff = 1.0;
    let worstDriver = null;

    if (drivers.length > 0) {
      // Логика определения коэффициента по возрасту и стажу
      let maxCoeff = 1.0;

      drivers.forEach(driver => {
        let driverCoeff = 1.0;

        if (driver.age < 25 && driver.experience < 2) {
          driverCoeff = 1.8; // Молодой и неопытный
        } else if (driver.age < 25 && driver.experience >= 2) {
          driverCoeff = 1.6; // Молодой но опытный
        } else if (driver.age >= 25 && driver.experience < 2) {
          driverCoeff = 1.7; // Взрослый но неопытный
        } else {
          driverCoeff = 1.0; // Взрослый и опытный
        }

        if (driverCoeff > maxCoeff) {
          maxCoeff = driverCoeff;
          worstDriver = { age: driver.age, experience: driver.experience };
        }
      });

      ageExperienceCoeff = maxCoeff;
    }

    // Коэффициент срока эксплуатации
    const year = parseInt(manufactureYear) || CURRENT_YEAR;
    const vehicleAge = Math.max(0, CURRENT_YEAR - year);
    const exploitationCoeff = vehicleAge > 7 ? 1.1 : 1.0;

    const bonusMalusCoeff = selectedBonusMalus.coefficient;

    const finalPremium = basePremium * territoryCoeff * vehicleTypeCoeff *
                        ageExperienceCoeff * exploitationCoeff * bonusMalusCoeff;

    setResults({
      basePremium: Math.round(basePremium),
      territoryCoeff,
      vehicleTypeCoeff,
      ageExperienceCoeff,
      exploitationCoeff,
      bonusMalusCoeff,
      finalPremium: Math.round(finalPremium),
      vehicleAge,
      worstDriver
    });
  };

  useEffect(() => {
    if (region && vehicleType && manufactureYear && drivers.length > 0 && bonusMalusClass) {
      calculatePremium();
    }
  }, [region, vehicleType, manufactureYear, drivers, bonusMalusClass]);

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
                </button>
              ))}
            </div>
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
                    <span>{t('insurance-premium.territoryCoefficient')}</span>
                    <span>×{results.territoryCoeff}</span>
                  </div>
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
      <EmbedWidget
        calculatorId="insurance-premium"
        calculatorTitle={t('insurance-premium.title')}
      />
    </div>
  );
}
