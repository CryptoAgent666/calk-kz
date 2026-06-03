import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, TrendingUp, Info, Calculator, MapPin, Calendar } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

// Базовая аренда за м² (2026) — источники: krisha.kz, olx.kz, 2gis
interface CityRates {
  id: string;
  labelKey: string;
  center: number;
  middle: number;
  outskirts: number;
}

const cities: CityRates[] = [
  { id: 'almaty', labelKey: 'fair-rental-price.cities.almaty', center: 4500, middle: 3000, outskirts: 2000 },
  { id: 'astana', labelKey: 'fair-rental-price.cities.astana', center: 4000, middle: 2700, outskirts: 1800 },
  { id: 'shymkent', labelKey: 'fair-rental-price.cities.shymkent', center: 2000, middle: 1500, outskirts: 1100 },
  { id: 'karaganda', labelKey: 'fair-rental-price.cities.karaganda', center: 1800, middle: 1300, outskirts: 900 },
  { id: 'aktobe', labelKey: 'fair-rental-price.cities.aktobe', center: 1900, middle: 1400, outskirts: 1000 },
  { id: 'atyrau', labelKey: 'fair-rental-price.cities.atyrau', center: 2500, middle: 1800, outskirts: 1200 },
  { id: 'other', labelKey: 'fair-rental-price.cities.other', center: 1500, middle: 1100, outskirts: 800 },
];

type Location = 'center' | 'middle' | 'outskirts';
type Furniture = 'none' | 'basic' | 'full' | 'designer';
type Appliances = 'none' | 'basic' | 'full';
type FloorLevel = 'first' | 'low' | 'mid' | 'high';
type Condition = 'poor' | 'fair' | 'good' | 'euro' | 'lux';
type Parking = 'none' | 'open' | 'secured';
type Transport = 'near' | 'mid' | 'far';
type Rooms = 'studio' | '1' | '2' | '3' | '4';

const FURNITURE_K: Record<Furniture, number> = { none: 0.85, basic: 1.0, full: 1.1, designer: 1.25 };
const APPLIANCES_K: Record<Appliances, number> = { none: 0.9, basic: 1.0, full: 1.08 };
const FLOOR_K: Record<FloorLevel, number> = { first: 0.93, low: 1.0, mid: 1.03, high: 1.05 };
const CONDITION_K: Record<Condition, number> = { poor: 0.8, fair: 0.92, good: 1.0, euro: 1.1, lux: 1.2 };
const PARKING_K: Record<Parking, number> = { none: 0.98, open: 1.0, secured: 1.04 };
const TRANSPORT_K: Record<Transport, number> = { near: 1.05, mid: 1.0, far: 0.93 };
const ROOMS_K: Record<Rooms, number> = { studio: 1.05, '1': 1.0, '2': 0.97, '3': 0.94, '4': 0.9 };

export default function FairRentalPriceCalculator() {
  const { t } = useTranslation('calculators');

  const [cityId, setCityId] = useState<string>('almaty');
  const [location, setLocation] = useState<Location>('middle');
  const [area, setArea] = useState<string>('55');
  const [rooms, setRooms] = useState<Rooms>('2');
  const [furniture, setFurniture] = useState<Furniture>('basic');
  const [appliances, setAppliances] = useState<Appliances>('basic');
  const [floor, setFloor] = useState<FloorLevel>('mid');
  const [condition, setCondition] = useState<Condition>('good');
  const [parking, setParking] = useState<Parking>('open');
  const [transport, setTransport] = useState<Transport>('mid');
  const [apartmentPrice, setApartmentPrice] = useState<string>('');

  const city = cities.find((c) => c.id === cityId) || cities[0];

  const result = useMemo(() => {
    const areaNum = Math.max(1, parseFloat(area) || 0);
    const basePerM2 = city[location];
    const k =
      FURNITURE_K[furniture] *
      APPLIANCES_K[appliances] *
      FLOOR_K[floor] *
      CONDITION_K[condition] *
      PARKING_K[parking] *
      TRANSPORT_K[transport] *
      ROOMS_K[rooms];

    const monthly = Math.round(basePerM2 * areaNum * k);
    const pricePerM2 = Math.round(monthly / areaNum);
    const low = Math.round(monthly * 0.9);
    const high = Math.round(monthly * 1.1);
    const yearly = monthly * 12;
    const dailyMin = Math.round((monthly * 4) / 30);
    const dailyMax = Math.round((monthly * 6) / 30);

    const priceNum = parseFloat(apartmentPrice.replace(/\s/g, '')) || 0;
    let paybackYears = 0;
    let yieldPercent = 0;
    if (priceNum > 0) {
      paybackYears = priceNum / yearly;
      yieldPercent = (yearly / priceNum) * 100;
    }

    return { monthly, pricePerM2, low, high, yearly, dailyMin, dailyMax, paybackYears, yieldPercent };
  }, [city, location, area, rooms, furniture, appliances, floor, condition, parking, transport, apartmentPrice]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  // Оценка рынка: сравнение с базовой средней ставкой района
  const marketBase = city[location] * (parseFloat(area) || 0);
  const marketRatio = marketBase > 0 ? result.monthly / marketBase : 1;
  let marketLabel: 'below' | 'fair' | 'above' = 'fair';
  if (marketRatio < 0.92) marketLabel = 'below';
  else if (marketRatio > 1.08) marketLabel = 'above';

  const generateExportData = () => ({
    title: t('fair-rental-price.exportTitle'),
    sections: [
      {
        title: t('fair-rental-price.resultsTitle'),
        data: [
          { label: t('fair-rental-price.city'), value: t(city.labelKey) },
          { label: t('fair-rental-price.area'), value: `${area} м²` },
          { label: t('fair-rental-price.monthly'), value: formatCurrency(result.monthly) },
          { label: t('fair-rental-price.range'), value: `${formatCurrency(result.low)} — ${formatCurrency(result.high)}` },
          { label: t('fair-rental-price.pricePerM2'), value: formatCurrency(result.pricePerM2) + '/м²' },
          { label: t('fair-rental-price.yearly'), value: formatCurrency(result.yearly) },
          { label: t('fair-rental-price.daily'), value: `${formatCurrency(result.dailyMin)} — ${formatCurrency(result.dailyMax)}` },
          ...(result.paybackYears > 0
            ? [
                { label: t('fair-rental-price.payback'), value: result.paybackYears.toFixed(1) + ' ' + t('fair-rental-price.years') },
                { label: t('fair-rental-price.yield'), value: result.yieldPercent.toFixed(2) + '%' },
              ]
            : []),
        ],
      },
    ],
    footer: 'calk.kz',
  });

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="fair-rental-price" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('fair-rental-price.heading')}</h1>
            <p className="text-gray-600">{t('fair-rental-price.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('fair-rental-price.warning')}</p>
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-teal-600" />
          {t('fair-rental-price.inputsTitle')}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.city')}</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.location')}</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as Location)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="center">{t('fair-rental-price.loc.center')}</option>
              <option value="middle">{t('fair-rental-price.loc.middle')}</option>
              <option value="outskirts">{t('fair-rental-price.loc.outskirts')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.area')} (м²)</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              min="10"
              max="500"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.rooms')}</label>
            <select
              value={rooms}
              onChange={(e) => setRooms(e.target.value as Rooms)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="studio">{t('fair-rental-price.room.studio')}</option>
              <option value="1">{t('fair-rental-price.room.1')}</option>
              <option value="2">{t('fair-rental-price.room.2')}</option>
              <option value="3">{t('fair-rental-price.room.3')}</option>
              <option value="4">{t('fair-rental-price.room.4')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.furniture')}</label>
            <select
              value={furniture}
              onChange={(e) => setFurniture(e.target.value as Furniture)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="none">{t('fair-rental-price.furn.none')}</option>
              <option value="basic">{t('fair-rental-price.furn.basic')}</option>
              <option value="full">{t('fair-rental-price.furn.full')}</option>
              <option value="designer">{t('fair-rental-price.furn.designer')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.appliances')}</label>
            <select
              value={appliances}
              onChange={(e) => setAppliances(e.target.value as Appliances)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="none">{t('fair-rental-price.app.none')}</option>
              <option value="basic">{t('fair-rental-price.app.basic')}</option>
              <option value="full">{t('fair-rental-price.app.full')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.floor')}</label>
            <select
              value={floor}
              onChange={(e) => setFloor(e.target.value as FloorLevel)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="first">{t('fair-rental-price.fl.first')}</option>
              <option value="low">{t('fair-rental-price.fl.low')}</option>
              <option value="mid">{t('fair-rental-price.fl.mid')}</option>
              <option value="high">{t('fair-rental-price.fl.high')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.condition')}</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="poor">{t('fair-rental-price.cond.poor')}</option>
              <option value="fair">{t('fair-rental-price.cond.fair')}</option>
              <option value="good">{t('fair-rental-price.cond.good')}</option>
              <option value="euro">{t('fair-rental-price.cond.euro')}</option>
              <option value="lux">{t('fair-rental-price.cond.lux')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.parking')}</label>
            <select
              value={parking}
              onChange={(e) => setParking(e.target.value as Parking)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="none">{t('fair-rental-price.park.none')}</option>
              <option value="open">{t('fair-rental-price.park.open')}</option>
              <option value="secured">{t('fair-rental-price.park.secured')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fair-rental-price.transport')}</label>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value as Transport)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="near">{t('fair-rental-price.tr.near')}</option>
              <option value="mid">{t('fair-rental-price.tr.mid')}</option>
              <option value="far">{t('fair-rental-price.tr.far')}</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fair-rental-price.apartmentPrice')} <span className="text-gray-400">({t('fair-rental-price.optional')})</span>
            </label>
            <input
              type="text"
              value={apartmentPrice}
              onChange={(e) => setApartmentPrice(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder={t('fair-rental-price.apartmentPricePlaceholder')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main result */}
      <div className="mb-8 rounded-xl p-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md">
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider opacity-90 mb-2">{t('fair-rental-price.monthly')}</div>
          <div className="text-4xl md:text-5xl font-bold mb-3">{formatCurrency(result.monthly)}</div>
          <div className="text-base opacity-95">
            {t('fair-rental-price.range')}: {formatCurrency(result.low)} — {formatCurrency(result.high)}
          </div>
          <div className="text-sm opacity-90 mt-1">
            {formatCurrency(result.pricePerM2)} / м²
          </div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center text-gray-500 text-sm mb-1">
            <Calendar className="w-4 h-4 mr-2" />
            {t('fair-rental-price.yearly')}
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(result.yearly)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center text-gray-500 text-sm mb-1">
            <Home className="w-4 h-4 mr-2" />
            {t('fair-rental-price.dailyRent')}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(result.dailyMin)} — {formatCurrency(result.dailyMax)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('fair-rental-price.dailyNote')}</div>
        </div>
        <div className={`rounded-xl border p-5 shadow-sm ${
          marketLabel === 'below' ? 'bg-green-50 border-green-200' :
          marketLabel === 'above' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center text-gray-500 text-sm mb-1">
            <MapPin className="w-4 h-4 mr-2" />
            {t('fair-rental-price.marketComparison')}
          </div>
          <div className={`text-lg font-bold ${
            marketLabel === 'below' ? 'text-green-700' :
            marketLabel === 'above' ? 'text-red-700' : 'text-gray-800'
          }`}>
            {t(`fair-rental-price.market.${marketLabel}`)}
          </div>
        </div>
      </div>

      {/* Payback block */}
      {result.paybackYears > 0 && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-teal-600" />
            {t('fair-rental-price.paybackTitle')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-teal-50 rounded-lg p-4">
              <div className="text-sm text-teal-800 mb-1">{t('fair-rental-price.payback')}</div>
              <div className="text-3xl font-bold text-teal-700">
                {result.paybackYears.toFixed(1)} <span className="text-lg">{t('fair-rental-price.years')}</span>
              </div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <div className="text-sm text-cyan-800 mb-1">{t('fair-rental-price.yield')}</div>
              <div className="text-3xl font-bold text-cyan-700">
                {result.yieldPercent.toFixed(2)}<span className="text-lg">%</span>
              </div>
              <div className="text-xs text-cyan-700 mt-1">{t('fair-rental-price.yieldNote')}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 flex items-start">
            <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{t('fair-rental-price.paybackInfo')}</span>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('fair-rental-price.recommendTitle')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-teal-200 rounded-lg p-4">
            <div className="font-medium text-teal-800 mb-2">{t('fair-rental-price.longTerm')}</div>
            <div className="text-2xl font-bold text-teal-700">{formatCurrency(result.monthly)}</div>
            <div className="text-xs text-gray-500 mt-1">{t('fair-rental-price.perMonth')}</div>
            <div className="text-sm text-gray-600 mt-2">{t('fair-rental-price.longTermDesc')}</div>
          </div>
          <div className="border border-cyan-200 rounded-lg p-4">
            <div className="font-medium text-cyan-800 mb-2">{t('fair-rental-price.shortTerm')}</div>
            <div className="text-2xl font-bold text-cyan-700">
              {formatCurrency(result.dailyMin)} — {formatCurrency(result.dailyMax)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t('fair-rental-price.perDay')}</div>
            <div className="text-sm text-gray-600 mt-2">{t('fair-rental-price.shortTermDesc')}</div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mb-8">
        <ExportButtons data={generateExportData()} filename="fair-rental-price" />
      </div>

      {/* Info */}
      <div className="mb-8 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <Info className="w-4 h-4 inline mr-1" />
        {t('fair-rental-price.infoNote')}
      </div>

      {/* FAQ */}
      <MethodologySection steps={getMethodology('fair-rental-price')} />
      <FAQSection
        items={[
          { question: t('fair-rental-price.faq.q1'), answer: t('fair-rental-price.faq.a1') },
          { question: t('fair-rental-price.faq.q2'), answer: t('fair-rental-price.faq.a2') },
          { question: t('fair-rental-price.faq.q3'), answer: t('fair-rental-price.faq.a3') },
          { question: t('fair-rental-price.faq.q4'), answer: t('fair-rental-price.faq.a4') },
          { question: t('fair-rental-price.faq.q5'), answer: t('fair-rental-price.faq.a5') },
        ]}
      
          sources={getSources('fair-rental-price')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="fair-rental-price" calculatorTitle={t('fair-rental-price.heading')} />
      <LastUpdated calculatorId="fair-rental-price" />
    </div>
  );
}
