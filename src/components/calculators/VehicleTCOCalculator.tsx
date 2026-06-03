import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calculator, TrendingUp, Fuel, Shield, Wrench, DollarSign, Info, MapPin, Calendar, Settings } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { EmbedWidget } from '../ui/EmbedWidget';
import { LastUpdated } from '../ui/LastUpdated';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

interface FuelType {
  id: string;
  labelKey: string;
  price: number;
}

interface PeriodOption {
  value: number;
  labelKey: string;
}

interface RegionOption {
  id: string;
  labelKey: string;
  ogpoMultiplier: number;
}

interface YearlyBreakdown {
  year: number;
  fuel: number;
  insurance: number;
  tax: number;
  maintenance: number;
  total: number;
}

const MRP_2026 = 4325;

// Налог на ТС по объёму двигателя (в МРП)
const CAR_TAX_RATES = [
  { min: 0, max: 1100, rate: 1 },
  { min: 1101, max: 1500, rate: 2 },
  { min: 1501, max: 2000, rate: 3 },
  { min: 2001, max: 2500, rate: 6 },
  { min: 2501, max: 3000, rate: 9 },
  { min: 3001, max: 4000, rate: 15 },
  { min: 4001, max: 99999, rate: 117 },
];

export default function VehicleTCOCalculator() {
  const { t, i18n } = useTranslation('calculators');

  const fuelTypes: FuelType[] = [
    { id: 'ai92', labelKey: 'vehicle-tco.fuelAI92', price: 205 },
    { id: 'ai95', labelKey: 'vehicle-tco.fuelAI95', price: 260 },
    { id: 'ai98', labelKey: 'vehicle-tco.fuelAI98', price: 340 },
    { id: 'dt', labelKey: 'vehicle-tco.fuelDT', price: 295 },
    { id: 'lpg', labelKey: 'vehicle-tco.fuelLPG', price: 100 },
  ];

  const periods: PeriodOption[] = [
    { value: 1, labelKey: 'vehicle-tco.period1' },
    { value: 3, labelKey: 'vehicle-tco.period3' },
    { value: 5, labelKey: 'vehicle-tco.period5' },
    { value: 10, labelKey: 'vehicle-tco.period10' },
  ];

  const regions: RegionOption[] = [
    { id: 'almaty', labelKey: 'vehicle-tco.regionAlmaty', ogpoMultiplier: 2.96 },
    { id: 'astana', labelKey: 'vehicle-tco.regionAstana', ogpoMultiplier: 2.96 },
    { id: 'other', labelKey: 'vehicle-tco.regionOther', ogpoMultiplier: 1.0 },
  ];

  const [vehiclePrice, setVehiclePrice] = useState<string>('8000000');
  const [vehicleAge, setVehicleAge] = useState<string>('3');
  const [engineVolume, setEngineVolume] = useState<string>('2000');
  const [selectedFuel, setSelectedFuel] = useState<string>('ai92');
  const [fuelPrice, setFuelPrice] = useState<string>('205');
  const [consumption, setConsumption] = useState<string>('9');
  const [yearlyMileage, setYearlyMileage] = useState<string>('15000');
  const [period, setPeriod] = useState<number>(5);
  const [includeKasko, setIncludeKasko] = useState<boolean>(false);
  const [region, setRegion] = useState<string>('almaty');

  useEffect(() => {
    const fuel = fuelTypes.find((f) => f.id === selectedFuel);
    if (fuel) setFuelPrice(String(fuel.price));
  }, [selectedFuel]);

  // Основной расчёт TCO
  const results = useMemo(() => {
    const price = parseFloat(vehiclePrice) || 0;
    const age = parseFloat(vehicleAge) || 0;
    const volume = parseInt(engineVolume) || 0;
    const fuelP = parseFloat(fuelPrice) || 0;
    const cons = parseFloat(consumption) || 0;
    const mileage = parseFloat(yearlyMileage) || 0;

    if (price <= 0 || volume <= 0 || mileage <= 0) {
      return null;
    }

    // 1. Годовой налог на ТС
    const rateInfo = CAR_TAX_RATES.find(r => volume >= r.min && volume <= r.max);
    let yearlyTax = rateInfo ? rateInfo.rate * MRP_2026 : 0;
    if (rateInfo && volume > 1500) {
      yearlyTax += (volume - rateInfo.min + 1) * 7;
    }
    // Скидка за возраст
    if (age > 20) yearlyTax *= 0.5;
    else if (age >= 10) yearlyTax *= 0.7;

    // 2. ОГПО — базовая ставка зависит от объёма и региона
    const regionData = regions.find(r => r.id === region) ?? regions[0];
    let ogpoBase = 30000;
    if (volume > 1500) ogpoBase = 42000;
    if (volume > 2000) ogpoBase = 58000;
    if (volume > 3000) ogpoBase = 78000;
    const yearlyOgpo = Math.round(ogpoBase * regionData.ogpoMultiplier / 2.5);

    // 3. КАСКО (~5% от стоимости, падает вместе с амортизацией)
    const yearlyKasko = includeKasko ? price * 0.05 : 0;

    // 4. Топливо
    const yearlyFuel = (mileage * cons / 100) * fuelP;

    // 5. ТО и обслуживание (растёт с возрастом)
    const maintenanceRate = (currentAge: number) => {
      if (currentAge < 3) return 0.025;
      if (currentAge < 7) return 0.035;
      return 0.05;
    };

    // 6. Амортизация — экспоненциальная ~15% в год
    const depreciationRate = 0.15;

    // Расчёт по годам
    const yearlyData: YearlyBreakdown[] = [];
    let totalFuel = 0;
    let totalInsurance = 0;
    let totalTax = 0;
    let totalMaintenance = 0;
    let totalTires = 0;

    let currentValue = price;
    for (let y = 1; y <= period; y++) {
      const currentAge = age + y;
      const yFuel = yearlyFuel;
      const yKasko = includeKasko ? currentValue * 0.05 : 0;
      const yInsurance = yearlyOgpo + yKasko;
      const yMaintenance = currentValue * maintenanceRate(currentAge);
      const yTires = y % 4 === 0 ? 180000 : 45000;

      totalFuel += yFuel;
      totalInsurance += yInsurance;
      totalTax += yearlyTax;
      totalMaintenance += yMaintenance;
      totalTires += yTires;

      yearlyData.push({
        year: y,
        fuel: Math.round(yFuel),
        insurance: Math.round(yInsurance),
        tax: Math.round(yearlyTax),
        maintenance: Math.round(yMaintenance + yTires),
        total: Math.round(yFuel + yInsurance + yearlyTax + yMaintenance + yTires),
      });

      currentValue = currentValue * (1 - depreciationRate);
    }

    const residualValue = currentValue;
    const depreciation = price - residualValue;

    // Сборы — единоразовые в 1-й год
    const regFee = 2 * MRP_2026; // ~8 650 ₸
    const totalFees = regFee;

    const totalTCO = totalFuel + totalInsurance + totalTax + totalMaintenance + totalTires + depreciation + totalFees;
    const totalMileage = mileage * period;
    const costPerKm = totalMileage > 0 ? totalTCO / totalMileage : 0;

    // Экономия на газе
    const ai92Cost = (mileage * cons / 100) * 205 * period;
    const gasCost = (mileage * cons * 1.15 / 100) * 100 * period;
    const gasSavings = ai92Cost - gasCost;

    return {
      totalTCO: Math.round(totalTCO),
      yearlyTCO: Math.round(totalTCO / period),
      monthlyTCO: Math.round(totalTCO / period / 12),
      costPerKm: Number(costPerKm.toFixed(2)),
      residualValue: Math.round(residualValue),
      totalFuel: Math.round(totalFuel),
      totalInsurance: Math.round(totalInsurance),
      totalTax: Math.round(totalTax),
      totalMaintenance: Math.round(totalMaintenance + totalTires),
      depreciation: Math.round(depreciation),
      totalFees,
      yearlyData,
      gasSavings: Math.round(gasSavings),
    };
  }, [vehiclePrice, vehicleAge, engineVolume, fuelPrice, consumption, yearlyMileage, period, includeKasko, region]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const chartData = useMemo(() => {
    if (!results) return [];
    return [
      { name: t('vehicle-tco.categoryDepreciation'), value: results.depreciation, color: '#ef4444' },
      { name: t('vehicle-tco.categoryFuel'), value: results.totalFuel, color: '#f97316' },
      { name: t('vehicle-tco.categoryMaintenance'), value: results.totalMaintenance, color: '#eab308' },
      { name: t('vehicle-tco.categoryInsurance'), value: results.totalInsurance, color: '#0ea5e9' },
      { name: t('vehicle-tco.categoryTax'), value: results.totalTax, color: '#22c55e' },
    ];
  }, [results, t, i18n.language]);

  const generateExportData = () => {
    if (!results) return null;
    return `${t('vehicle-tco.exportTitle')}
─────────────────────────────
${t('vehicle-tco.vehiclePrice')}: ${formatCurrency(parseFloat(vehiclePrice))}
${t('vehicle-tco.engineVolume')}: ${engineVolume} ${t('vehicle-tco.cm3')}
${t('vehicle-tco.consumption')}: ${consumption} ${t('vehicle-tco.lPer100km')}
${t('vehicle-tco.yearlyMileage')}: ${yearlyMileage} ${t('vehicle-tco.km')}
${t('vehicle-tco.period')}: ${period} ${t('vehicle-tco.years')}

${t('vehicle-tco.resultsTitle')}:
─────────────────────────────
${t('vehicle-tco.tco')}: ${formatCurrency(results.totalTCO)}
${t('vehicle-tco.yearlyCost')}: ${formatCurrency(results.yearlyTCO)}
${t('vehicle-tco.monthlyCost')}: ${formatCurrency(results.monthlyTCO)}
${t('vehicle-tco.costPerKm')}: ${results.costPerKm} ₸/${t('vehicle-tco.km')}
${t('vehicle-tco.residualValue')}: ${formatCurrency(results.residualValue)}

${t('vehicle-tco.breakdown')}:
${t('vehicle-tco.categoryDepreciation')}: ${formatCurrency(results.depreciation)}
${t('vehicle-tco.categoryFuel')}: ${formatCurrency(results.totalFuel)}
${t('vehicle-tco.categoryMaintenance')}: ${formatCurrency(results.totalMaintenance)}
${t('vehicle-tco.categoryInsurance')}: ${formatCurrency(results.totalInsurance)}
${t('vehicle-tco.categoryTax')}: ${formatCurrency(results.totalTax)}
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="vehicle-tco" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('vehicle-tco.heading')}</h1>
            <p className="text-gray-600">{t('vehicle-tco.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('vehicle-tco.warning')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('vehicle-tco.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Vehicle price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                {t('vehicle-tco.vehiclePrice')}
              </label>
              <RangeSlider
                value={parseFloat(vehiclePrice) || 0}
                onChange={(val) => setVehiclePrice(String(val))}
                min={1000000}
                max={50000000}
                step={100000}
                formatValue={(v) => formatCurrency(v)}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={vehiclePrice}
                  onChange={(e) => setVehiclePrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Vehicle age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t('vehicle-tco.vehicleAge')}
              </label>
              <RangeSlider
                value={parseFloat(vehicleAge) || 0}
                onChange={(val) => setVehicleAge(String(val))}
                min={0}
                max={25}
                step={1}
                formatValue={(v) => `${v} ${t('vehicle-tco.years')}`}
                color="#10b981"
              />
            </div>

            {/* Engine volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Settings className="w-4 h-4 inline mr-1" />
                {t('vehicle-tco.engineVolume')}
              </label>
              <RangeSlider
                value={parseFloat(engineVolume) || 0}
                onChange={(val) => setEngineVolume(String(val))}
                min={800}
                max={6000}
                step={100}
                formatValue={(v) => `${v} ${t('vehicle-tco.cm3')}`}
                color="#10b981"
              />
            </div>

            {/* Fuel type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Fuel className="w-4 h-4 inline mr-1" />
                {t('vehicle-tco.fuelType')}
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

            {/* Consumption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vehicle-tco.consumption')}
              </label>
              <RangeSlider
                value={parseFloat(consumption) || 0}
                onChange={(val) => setConsumption(String(val))}
                min={4}
                max={25}
                step={0.5}
                formatValue={(v) => `${v} ${t('vehicle-tco.lPer100km')}`}
                color="#10b981"
              />
            </div>

            {/* Yearly mileage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('vehicle-tco.yearlyMileage')}
              </label>
              <RangeSlider
                value={parseFloat(yearlyMileage) || 0}
                onChange={(val) => setYearlyMileage(String(val))}
                min={5000}
                max={60000}
                step={1000}
                formatValue={(v) => `${v.toLocaleString('ru-KZ')} ${t('vehicle-tco.km')}`}
                color="#10b981"
              />
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('vehicle-tco.period')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      period === p.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('vehicle-tco.region')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      region === r.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(r.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* KASKO */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeKasko}
                  onChange={(e) => setIncludeKasko(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    <Shield className="w-4 h-4 inline mr-1" />
                    {t('vehicle-tco.includeKasko')}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{t('vehicle-tco.kaskoHint')}</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('vehicle-tco.resultsTitle')}
          </h2>

          {results ? (
            <div className="space-y-4">
              {/* Total TCO */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-semibold text-gray-900">{t('vehicle-tco.tco')}</span>
                  <span className="text-2xl font-bold text-green-700">{formatCurrency(results.totalTCO)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {t('vehicle-tco.totalCost')} {period} {t('vehicle-tco.years')}
                </div>
              </div>

              {/* Cost per km */}
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">{t('vehicle-tco.costPerKm')}</div>
                  <div className="text-lg font-bold text-gray-900">{results.costPerKm} ₸/{t('vehicle-tco.km')}</div>
                </div>
                <Car className="w-8 h-8 text-gray-400" />
              </div>

              {/* Yearly */}
              <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                <div className="text-sm text-blue-600">{t('vehicle-tco.yearlyCost')}</div>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(results.yearlyTCO)}</span>
              </div>

              {/* Monthly */}
              <div className="bg-purple-50 rounded-lg p-4 flex justify-between items-center">
                <div className="text-sm text-purple-600">{t('vehicle-tco.monthlyCost')}</div>
                <span className="text-xl font-bold text-purple-700">{formatCurrency(results.monthlyTCO)}</span>
              </div>

              {/* Residual value */}
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-amber-700">{t('vehicle-tco.residualValue')}</div>
                    <div className="text-xs text-amber-600">{t('vehicle-tco.residualValueHint')}</div>
                  </div>
                  <span className="text-xl font-bold text-amber-800">{formatCurrency(results.residualValue)}</span>
                </div>
              </div>

              {/* Breakdown list */}
              <div className="bg-white border border-gray-100 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  <Wrench className="w-4 h-4 inline mr-1" />
                  {t('vehicle-tco.breakdown')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">{t('vehicle-tco.categoryDepreciation')}</span><span className="font-medium">{formatCurrency(results.depreciation)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">{t('vehicle-tco.categoryFuel')}</span><span className="font-medium">{formatCurrency(results.totalFuel)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">{t('vehicle-tco.categoryMaintenance')}</span><span className="font-medium">{formatCurrency(results.totalMaintenance)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">{t('vehicle-tco.categoryInsurance')}</span><span className="font-medium">{formatCurrency(results.totalInsurance)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">{t('vehicle-tco.categoryTax')}</span><span className="font-medium">{formatCurrency(results.totalTax)}</span></div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                {t('vehicle-tco.infoNote')}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">—</div>
          )}
        </div>
      </div>

      {/* Pie Chart */}
      {results && results.totalTCO > 0 && (
        <div className="mt-8">
          <TaxPieChart data={chartData} title={t('vehicle-tco.breakdownChartTitle')} />
        </div>
      )}

      {/* Yearly table */}
      {results && period >= 3 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('vehicle-tco.yearlyTable')}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="text-left py-2 px-2">{t('vehicle-tco.tableYear')}</th>
                <th className="text-right py-2 px-2">{t('vehicle-tco.tableFuel')}</th>
                <th className="text-right py-2 px-2">{t('vehicle-tco.tableInsurance')}</th>
                <th className="text-right py-2 px-2">{t('vehicle-tco.tableTax')}</th>
                <th className="text-right py-2 px-2">{t('vehicle-tco.tableMaintenance')}</th>
                <th className="text-right py-2 px-2 font-semibold">{t('vehicle-tco.tableTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {results.yearlyData.map((row) => (
                <tr key={row.year} className="border-b border-gray-100">
                  <td className="py-2 px-2 font-medium">{row.year}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(row.fuel)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(row.insurance)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(row.tax)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(row.maintenance)}</td>
                  <td className="text-right py-2 px-2 font-semibold text-green-700">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Gas savings recommendation */}
      {results && selectedFuel !== 'lpg' && results.gasSavings > 100000 && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <Fuel className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-900">{t('vehicle-tco.gasSavings')}</div>
              <div className="text-sm text-green-800 mt-1">
                {t('vehicle-tco.gasSavingsNote', {
                  months: Math.round(400000 / (results.gasSavings / period / 12)),
                  amount: formatCurrency(results.gasSavings),
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('vehicle-tco.exportFilename')} />
      </div>

      {/* FAQ */}
      <MethodologySection steps={getMethodology('vehicle-tco')} />
      <FAQSection
        items={[
          { question: t('vehicle-tco.faq.q1'), answer: t('vehicle-tco.faq.a1') },
          { question: t('vehicle-tco.faq.q2'), answer: t('vehicle-tco.faq.a2') },
          { question: t('vehicle-tco.faq.q3'), answer: t('vehicle-tco.faq.a3') },
          { question: t('vehicle-tco.faq.q4'), answer: t('vehicle-tco.faq.a4') },
          { question: t('vehicle-tco.faq.q5'), answer: t('vehicle-tco.faq.a5') },
        ]}
      />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget />
      <LastUpdated calculatorId="vehicle-tco" />
    </div>
  );
}
