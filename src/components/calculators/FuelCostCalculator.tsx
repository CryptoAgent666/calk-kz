import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Fuel, Calculator, Car, TrendingUp, Info, MapPin } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

interface FuelType {
  id: string;
  labelKey: string;
  price: number;
}

interface QuickRoute {
  nameKey: string;
  distance: number;
}

export default function FuelCostCalculator() {
  const { t, i18n } = useTranslation('calculators');

  // Средние цены по РК на апрель 2026 (источник: КазМунайГаз, Helios, Qazaq Oil)
  const fuelTypes: FuelType[] = [
    { id: 'ai92', labelKey: 'fuel-cost.fuelAI92', price: 237 },
    { id: 'ai95', labelKey: 'fuel-cost.fuelAI95', price: 312 },
    { id: 'ai98', labelKey: 'fuel-cost.fuelAI98', price: 360 },
    { id: 'dt', labelKey: 'fuel-cost.fuelDT', price: 330 },
    { id: 'lpg', labelKey: 'fuel-cost.fuelLPG', price: 100 },
  ];

  const quickRoutes: QuickRoute[] = [
    { nameKey: 'fuel-cost.routeAlmatyAstana', distance: 1250 },
    { nameKey: 'fuel-cost.routeAlmatyShymkent', distance: 690 },
    { nameKey: 'fuel-cost.routeAstanaKaraganda', distance: 210 },
  ];

  const [selectedFuel, setSelectedFuel] = useState<string>('ai92');
  const [distance, setDistance] = useState<string>('100');
  const [consumption, setConsumption] = useState<string>('8');
  const [fuelPrice, setFuelPrice] = useState<string>('205');

  const [results, setResults] = useState({
    fuelNeeded: 0,
    tripCost: 0,
    costPerKm: 0,
    monthlyCost: 0,
    yearlyCost: 0,
  });

  // Обновляем цену при смене типа топлива
  useEffect(() => {
    const fuel = fuelTypes.find((f) => f.id === selectedFuel);
    if (fuel) {
      setFuelPrice(String(fuel.price));
    }
  }, [selectedFuel]);

  // Расчёт
  useEffect(() => {
    const dist = parseFloat(distance) || 0;
    const cons = parseFloat(consumption) || 0;
    const price = parseFloat(fuelPrice) || 0;

    if (dist <= 0 || cons <= 0 || price <= 0) {
      setResults({ fuelNeeded: 0, tripCost: 0, costPerKm: 0, monthlyCost: 0, yearlyCost: 0 });
      return;
    }

    const fuelNeeded = (dist * cons) / 100;
    const tripCost = fuelNeeded * price;
    const costPerKm = (cons / 100) * price;
    const monthlyCost = dist * 22 * (cons / 100) * price;
    const yearlyCost = monthlyCost * 12;

    setResults({
      fuelNeeded: Number(fuelNeeded.toFixed(2)),
      tripCost: Math.round(tripCost),
      costPerKm: Number(costPerKm.toFixed(2)),
      monthlyCost: Math.round(monthlyCost),
      yearlyCost: Math.round(yearlyCost),
    });
  }, [distance, consumption, fuelPrice]);

  const formatCurrency = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (results.tripCost === 0) return null;

    const fuel = fuelTypes.find((f) => f.id === selectedFuel);

    return `${t('fuel-cost.exportTitle')}
─────────────────────────────
${t('fuel-cost.fuelType')}: ${fuel ? t(fuel.labelKey) : ''}
${t('fuel-cost.distance')}: ${distance} ${t('fuel-cost.km')}
${t('fuel-cost.consumption')}: ${consumption} ${t('fuel-cost.lPer100km')}
${t('fuel-cost.pricePerLiter')}: ${fuelPrice} ₸

${t('fuel-cost.resultsTitle')}:
─────────────────────────────
${t('fuel-cost.fuelNeeded')}: ${results.fuelNeeded} ${t('fuel-cost.liters')}
${t('fuel-cost.tripCost')}: ${formatCurrency(results.tripCost)}
${t('fuel-cost.costPerKm')}: ${results.costPerKm} ₸/${t('fuel-cost.km')}
${t('fuel-cost.monthlyCost')} (22 ${t('fuel-cost.workDays')}): ${formatCurrency(results.monthlyCost)}
${t('fuel-cost.yearlyCost')}: ${formatCurrency(results.yearlyCost)}
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Fuel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('fuel-cost.heading')}</h1>
            <p className="text-gray-600">{t('fuel-cost.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {t('fuel-cost.warning')}
        </p>
      </div>

      {/* Two-column layout */}
      <QuickAnswer calculatorId="fuel-cost" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('fuel-cost.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Fuel type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Fuel className="w-4 h-4 inline mr-1" />
                {t('fuel-cost.fuelType')}
              </label>
              <div className="flex flex-wrap gap-2">
                {fuelTypes.map((fuel) => (
                  <button
                    key={fuel.id}
                    onClick={() => setSelectedFuel(fuel.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedFuel === fuel.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(fuel.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('fuel-cost.distance')}
              </label>
              <RangeSlider
                value={parseFloat(distance) || 0}
                onChange={(val) => setDistance(String(val))}
                min={10}
                max={2000}
                step={10}
                formatValue={(v) => `${v} ${t('fuel-cost.km')}`}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={t('fuel-cost.enterDistance')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('fuel-cost.km')}</span>
                </div>
              </div>
            </div>

            {/* Consumption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-1" />
                {t('fuel-cost.consumption')}
              </label>
              <RangeSlider
                value={parseFloat(consumption) || 0}
                onChange={(val) => setConsumption(String(val))}
                min={4}
                max={25}
                step={0.5}
                formatValue={(v) => `${v} ${t('fuel-cost.lPer100km')}`}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  placeholder={t('fuel-cost.enterConsumption')}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('fuel-cost.lPer100km')}</span>
                </div>
              </div>
            </div>

            {/* Fuel price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('fuel-cost.pricePerLiter')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder={t('fuel-cost.enterPrice')}
                  step="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸/{t('fuel-cost.liter')}</span>
                </div>
              </div>
            </div>

            {/* Quick routes */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-3">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('fuel-cost.quickRoutes')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {quickRoutes.map((route) => (
                  <button
                    key={route.nameKey}
                    onClick={() => setDistance(String(route.distance))}
                    className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    {t(route.nameKey)} ({route.distance} {t('fuel-cost.km')})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('fuel-cost.resultsTitle')}
          </h2>

          <div className="space-y-6">
            {/* Trip cost — main result */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('fuel-cost.tripCost')}</span>
                <div className="flex items-center space-x-2">
                  <Fuel className="w-6 h-6 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(results.tripCost)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('fuel-cost.forDistance')} {distance} {t('fuel-cost.km')}
              </div>
            </div>

            {/* Fuel needed */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('fuel-cost.fuelNeeded')}</div>
                <div className="text-lg font-bold text-gray-900">{results.fuelNeeded} {t('fuel-cost.liters')}</div>
              </div>
              <Fuel className="w-8 h-8 text-gray-400" />
            </div>

            {/* Cost per km */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('fuel-cost.costPerKm')}</div>
                <div className="text-lg font-bold text-gray-900">{results.costPerKm} ₸/{t('fuel-cost.km')}</div>
              </div>
              <Car className="w-8 h-8 text-gray-400" />
            </div>

            {/* Monthly estimate */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-blue-600">{t('fuel-cost.monthlyCost')}</div>
                  <div className="text-xs text-blue-500">({distance} {t('fuel-cost.km')} x 22 {t('fuel-cost.workDays')})</div>
                </div>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(results.monthlyCost)}</span>
              </div>
            </div>

            {/* Yearly estimate */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-purple-600">{t('fuel-cost.yearlyCost')}</div>
                  <div className="text-xs text-purple-500">(x 12 {t('fuel-cost.months')})</div>
                </div>
                <span className="text-xl font-bold text-purple-700">{formatCurrency(results.yearlyCost)}</span>
              </div>
            </div>

            {/* Info block */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('fuel-cost.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename={t('fuel-cost.exportFilename')}
        />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="fuel-cost" />
      <MethodologySection steps={getMethodology('fuel-cost')} />
      <FAQSection
        items={[
          { question: t('fuel-cost.faq.q1'), answer: t('fuel-cost.faq.a1') },
          { question: t('fuel-cost.faq.q2'), answer: t('fuel-cost.faq.a2') },
          { question: t('fuel-cost.faq.q3'), answer: t('fuel-cost.faq.a3') },
          { question: t('fuel-cost.faq.q4'), answer: t('fuel-cost.faq.a4') },
          { question: t('fuel-cost.faq.q5'), answer: t('fuel-cost.faq.a5') }
        ]}
      
          sources={getSources('fuel-cost')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget />
      <LastUpdated calculatorId="fuel-cost" />
    </div>
  );
}
