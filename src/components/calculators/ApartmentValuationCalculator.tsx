import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Building2, MapPin, TrendingUp, Info, Calculator, Ruler, Layers, CheckCircle2 } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

// Базовые цены за м² по городам и зонам (₸, 2026)
interface CityPrices {
  id: string;
  labelKey: string;
  center: number;
  middle: number;
  outskirts: number;
}

const cities: CityPrices[] = [
  { id: 'almaty',    labelKey: 'apartment-valuation.cities.almaty',    center: 850000, middle: 600000, outskirts: 400000 },
  { id: 'astana',    labelKey: 'apartment-valuation.cities.astana',    center: 750000, middle: 520000, outskirts: 350000 },
  { id: 'shymkent',  labelKey: 'apartment-valuation.cities.shymkent',  center: 450000, middle: 350000, outskirts: 250000 },
  { id: 'karaganda', labelKey: 'apartment-valuation.cities.karaganda', center: 380000, middle: 280000, outskirts: 200000 },
  { id: 'aktobe',    labelKey: 'apartment-valuation.cities.aktobe',    center: 400000, middle: 300000, outskirts: 220000 },
  { id: 'atyrau',    labelKey: 'apartment-valuation.cities.atyrau',    center: 520000, middle: 380000, outskirts: 260000 },
  { id: 'other',     labelKey: 'apartment-valuation.cities.other',     center: 300000, middle: 230000, outskirts: 170000 },
];

type Zone = 'center' | 'middle' | 'outskirts';
type Material = 'panel' | 'brick' | 'monolith';
type Condition = 'none' | 'soviet' | 'cosmetic' | 'modern' | 'luxury';
type Rooms = 'studio' | '1' | '2' | '3' | '4+';

const materialCoef: Record<Material, number> = { panel: 0.92, brick: 1.05, monolith: 1.10 };
const conditionCoef: Record<Condition, number> = { none: 0.85, soviet: 0.90, cosmetic: 1.00, modern: 1.10, luxury: 1.20 };

export default function ApartmentValuationCalculator() {
  const { t } = useTranslation('calculators');

  const [cityId, setCityId] = useState<string>('almaty');
  const [zone, setZone] = useState<Zone>('middle');
  const [area, setArea] = useState<string>('60');
  const [rooms, setRooms] = useState<Rooms>('2');
  const [floor, setFloor] = useState<string>('5');
  const [totalFloors, setTotalFloors] = useState<string>('9');
  const [material, setMaterial] = useState<Material>('brick');
  const [yearBuilt, setYearBuilt] = useState<string>('2015');
  const [condition, setCondition] = useState<Condition>('cosmetic');
  const [parking, setParking] = useState<boolean>(false);
  const [storage, setStorage] = useState<boolean>(false);
  const [balcony, setBalcony] = useState<boolean>(true);
  const [balconyArea, setBalconyArea] = useState<string>('4');
  const [highCeiling, setHighCeiling] = useState<boolean>(false);
  const [bathroomSeparate, setBathroomSeparate] = useState<boolean>(false);

  const city = cities.find((c) => c.id === cityId)!;

  const result = useMemo(() => {
    const a = Math.max(0, parseFloat(area) || 0);
    const fl = Math.max(1, parseInt(floor) || 1);
    const tfl = Math.max(1, parseInt(totalFloors) || 1);
    const year = parseInt(yearBuilt) || 2000;
    const bArea = Math.max(0, parseFloat(balconyArea) || 0);

    const basePricePerM2 = city[zone];

    // Floor coefficient
    let floorCoef = 1.00;
    if (fl === 1 || fl === tfl) floorCoef = 0.92;
    else if (fl >= 2 && fl <= 5) floorCoef = 1.00;
    else if (fl >= 6 && fl <= 9) floorCoef = 1.03;
    else if (fl >= 10) floorCoef = 1.07;

    // Year coefficient
    let yearCoef = 1.00;
    if (year < 1970) yearCoef = 0.85;
    else if (year < 1990) yearCoef = 0.95;
    else if (year < 2010) yearCoef = 1.00;
    else if (year < 2020) yearCoef = 1.10;
    else yearCoef = 1.15;

    const mCoef = materialCoef[material];
    const cCoef = conditionCoef[condition];
    const ceilingCoef = highCeiling ? 1.05 : 1.00;
    const bathroomCoef = bathroomSeparate ? 1.03 : 1.00;
    const balconyCoef = balcony ? (1 + 0.02 * (bArea / Math.max(a, 1))) : 1.00;

    const totalCoef = mCoef * floorCoef * yearCoef * cCoef * ceilingCoef * bathroomCoef * balconyCoef;

    const baseValue = basePricePerM2 * a;
    let estimated = baseValue * totalCoef;

    const parkingAdd = parking ? 800000 : 0;
    const storageAdd = storage ? 200000 : 0;
    estimated += parkingAdd + storageAdd;

    const pricePerM2 = a > 0 ? estimated / a : 0;
    const avgZoneValue = basePricePerM2 * a;
    const diffFromAvg = avgZoneValue > 0 ? ((estimated - avgZoneValue) / avgZoneValue) * 100 : 0;

    return {
      basePricePerM2,
      baseValue,
      estimated: Math.round(estimated),
      lower: Math.round(estimated * 0.90),
      upper: Math.round(estimated * 1.10),
      pricePerM2: Math.round(pricePerM2),
      avgZoneValue: Math.round(avgZoneValue),
      diffFromAvg: Number(diffFromAvg.toFixed(1)),
      sellRecommended: Math.round(estimated * 1.04),
      buyRecommended: Math.round(estimated * 0.94),
      coefs: {
        material: mCoef,
        floor: floorCoef,
        year: yearCoef,
        condition: cCoef,
        ceiling: ceilingCoef,
        bathroom: bathroomCoef,
        balcony: Number(balconyCoef.toFixed(3)),
        total: Number(totalCoef.toFixed(3)),
      },
      extras: { parkingAdd, storageAdd },
    };
  }, [city, zone, area, floor, totalFloors, yearBuilt, material, condition, highCeiling, bathroomSeparate, balcony, balconyArea, parking, storage]);

  const fmt = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => ({
    title: t('apartment-valuation.exportTitle'),
    sections: [
      {
        title: t('apartment-valuation.parametersTitle'),
        data: [
          { label: t('apartment-valuation.city'), value: t(city.labelKey) },
          { label: t('apartment-valuation.zone'), value: t(`apartment-valuation.zones.${zone}`) },
          { label: t('apartment-valuation.area'), value: `${area} м²` },
          { label: t('apartment-valuation.rooms'), value: t(`apartment-valuation.roomsOpt.${rooms}`) },
          { label: t('apartment-valuation.floor'), value: `${floor} / ${totalFloors}` },
          { label: t('apartment-valuation.material'), value: t(`apartment-valuation.materials.${material}`) },
          { label: t('apartment-valuation.yearBuilt'), value: yearBuilt },
          { label: t('apartment-valuation.condition'), value: t(`apartment-valuation.conditions.${condition}`) },
        ],
      },
      {
        title: t('apartment-valuation.resultsTitle'),
        data: [
          { label: t('apartment-valuation.estimated'), value: fmt(result.estimated) },
          { label: t('apartment-valuation.priceRange'), value: `${fmt(result.lower)} — ${fmt(result.upper)}` },
          { label: t('apartment-valuation.pricePerM2'), value: fmt(result.pricePerM2) + '/м²' },
          { label: t('apartment-valuation.diffFromAvg'), value: `${result.diffFromAvg > 0 ? '+' : ''}${result.diffFromAvg}%` },
          { label: t('apartment-valuation.sellRecommended'), value: fmt(result.sellRecommended) },
          { label: t('apartment-valuation.buyRecommended'), value: fmt(result.buyRecommended) },
        ],
      },
    ],
    footer: 'calk.kz',
  });

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="apartment-valuation" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('apartment-valuation.heading')}</h1>
            <p className="text-gray-600">{t('apartment-valuation.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('apartment-valuation.warning')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('apartment-valuation.parametersTitle')}
          </h2>

          <div className="space-y-5">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('apartment-valuation.city')}
              </label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('apartment-valuation.zone')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['center', 'middle', 'outskirts'] as Zone[]).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZone(z)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      zone === z
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(`apartment-valuation.zones.${z}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Area + rooms */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Ruler className="w-4 h-4 inline mr-1" />
                  {t('apartment-valuation.area')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    min="10"
                    max="500"
                    step="0.1"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">м²</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('apartment-valuation.rooms')}</label>
                <select
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value as Rooms)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  {(['studio', '1', '2', '3', '4+'] as Rooms[]).map((r) => (
                    <option key={r} value={r}>{t(`apartment-valuation.roomsOpt.${r}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Floor / total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Layers className="w-4 h-4 inline mr-1" />
                {t('apartment-valuation.floor')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  min="1"
                  max="60"
                  placeholder={t('apartment-valuation.floorPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  min="1"
                  max="60"
                  placeholder={t('apartment-valuation.totalFloorsPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Material */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                {t('apartment-valuation.material')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['panel', 'brick', 'monolith'] as Material[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMaterial(m)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      material === m
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(`apartment-valuation.materials.${m}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('apartment-valuation.yearBuilt')}</label>
              <input
                type="number"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                min="1900"
                max="2030"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('apartment-valuation.condition')}</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                {(['none', 'soviet', 'cosmetic', 'modern', 'luxury'] as Condition[]).map((c) => (
                  <option key={c} value={c}>{t(`apartment-valuation.conditions.${c}`)}</option>
                ))}
              </select>
            </div>

            {/* Extras */}
            <div className="bg-rose-50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-medium text-rose-900 mb-2">{t('apartment-valuation.extras')}</h3>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="rounded accent-rose-500" />
                {t('apartment-valuation.parking')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={storage} onChange={(e) => setStorage(e.target.checked)} className="rounded accent-rose-500" />
                {t('apartment-valuation.storage')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={balcony} onChange={(e) => setBalcony(e.target.checked)} className="rounded accent-rose-500" />
                {t('apartment-valuation.balcony')}
              </label>
              {balcony && (
                <div className="pl-6">
                  <label className="block text-xs text-gray-600 mb-1">{t('apartment-valuation.balconyArea')}</label>
                  <input
                    type="number"
                    value={balconyArea}
                    onChange={(e) => setBalconyArea(e.target.value)}
                    min="0"
                    max="30"
                    step="0.5"
                    className="w-32 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="ml-2 text-xs text-gray-500">м²</span>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={highCeiling} onChange={(e) => setHighCeiling(e.target.checked)} className="rounded accent-rose-500" />
                {t('apartment-valuation.highCeiling')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={bathroomSeparate} onChange={(e) => setBathroomSeparate(e.target.checked)} className="rounded accent-rose-500" />
                {t('apartment-valuation.bathroomSeparate')}
              </label>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('apartment-valuation.resultsTitle')}
          </h2>

          <div className="space-y-5">
            {/* Main estimate */}
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-6 border-2 border-rose-200">
              <div className="text-sm text-rose-700 mb-1">{t('apartment-valuation.estimated')}</div>
              <div className="text-3xl font-bold text-rose-700">{fmt(result.estimated)}</div>
              <div className="text-sm text-gray-600 mt-2">
                {t('apartment-valuation.priceRange')}: {fmt(result.lower)} — {fmt(result.upper)}
              </div>
            </div>

            {/* Per m² */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('apartment-valuation.pricePerM2')}</div>
                <div className="text-lg font-bold text-gray-900">{fmt(result.pricePerM2)}/м²</div>
              </div>
              <Ruler className="w-8 h-8 text-gray-400" />
            </div>

            {/* Comparison with avg */}
            <div className={`rounded-lg p-4 ${result.diffFromAvg > 0 ? 'bg-green-50' : result.diffFromAvg < 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <div className="text-sm text-gray-600 mb-1">{t('apartment-valuation.diffFromAvg')}</div>
              <div className={`text-lg font-bold ${result.diffFromAvg > 0 ? 'text-green-700' : result.diffFromAvg < 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                {result.diffFromAvg > 0 ? '+' : ''}{result.diffFromAvg}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('apartment-valuation.avgForZone')}: {fmt(result.avgZoneValue)}
              </div>
            </div>

            {/* Coefficients breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">{t('apartment-valuation.coefBreakdown')}</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.material')}</span><span className="font-medium">× {result.coefs.material.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.floorCoef')}</span><span className="font-medium">× {result.coefs.floor.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.yearCoef')}</span><span className="font-medium">× {result.coefs.year.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.condition')}</span><span className="font-medium">× {result.coefs.condition.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.ceiling')}</span><span className="font-medium">× {result.coefs.ceiling.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.bathroom')}</span><span className="font-medium">× {result.coefs.bathroom.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">{t('apartment-valuation.balcony')}</span><span className="font-medium">× {result.coefs.balcony.toFixed(3)}</span></div>
                {(result.extras.parkingAdd > 0 || result.extras.storageAdd > 0) && (
                  <div className="flex justify-between border-t pt-1.5"><span className="text-gray-600">{t('apartment-valuation.extrasTotal')}</span><span className="font-medium">+ {fmt(result.extras.parkingAdd + result.extras.storageAdd)}</span></div>
                )}
                <div className="flex justify-between border-t pt-1.5 font-semibold text-rose-700"><span>{t('apartment-valuation.totalCoef')}</span><span>× {result.coefs.total.toFixed(3)}</span></div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {t('apartment-valuation.sellRecommended')}
                </div>
                <div className="text-lg font-bold text-green-800">{fmt(result.sellRecommended)}</div>
                <div className="text-xs text-green-600 mt-1">{t('apartment-valuation.sellHint')}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {t('apartment-valuation.buyRecommended')}
                </div>
                <div className="text-lg font-bold text-blue-800">{fmt(result.buyRecommended)}</div>
                <div className="text-xs text-blue-600 mt-1">{t('apartment-valuation.buyHint')}</div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('apartment-valuation.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename="apartment-valuation" />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="apartment-valuation" />
      <MethodologySection steps={getMethodology('apartment-valuation')} />
      <FAQSection
        items={[
          { question: t('apartment-valuation.faq.q1'), answer: t('apartment-valuation.faq.a1') },
          { question: t('apartment-valuation.faq.q2'), answer: t('apartment-valuation.faq.a2') },
          { question: t('apartment-valuation.faq.q3'), answer: t('apartment-valuation.faq.a3') },
          { question: t('apartment-valuation.faq.q4'), answer: t('apartment-valuation.faq.a4') },
          { question: t('apartment-valuation.faq.q5'), answer: t('apartment-valuation.faq.a5') },
        ]}
      
          sources={getSources('apartment-valuation')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="apartment-valuation" calculatorTitle={t('apartment-valuation.heading')} />
      <LastUpdated calculatorId="apartment-valuation" />
    </div>
  );
}
