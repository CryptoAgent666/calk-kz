import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calculator, TrendingDown, TrendingUp, Info, MapPin, Tag, FileText } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

interface CarPreset { id: string; labelKey: string; price: number; }
type ConditionKey = 'excellent' | 'good' | 'average' | 'poor';
type RegionKey = 'almaty-astana' | 'shymkent-karaganda' | 'other';
type BodyKey = 'sedan' | 'suv' | 'hatchback' | 'wagon' | 'pickup';
type DocsKey = 'original' | 'duplicate';

const CURRENT_YEAR = 2026;
const NORMAL_KM_PER_YEAR = 15000;
const MIN_VALUE_RATIO = 0.15;

const CONDITION_K: Record<ConditionKey, number> = { excellent: 1.10, good: 1.00, average: 0.88, poor: 0.70 };
const REGION_K: Record<RegionKey, number> = { 'almaty-astana': 1.10, 'shymkent-karaganda': 1.00, other: 0.93 };
const BODY_K: Record<BodyKey, number> = { sedan: 1.00, suv: 1.12, hatchback: 0.95, wagon: 0.92, pickup: 1.05 };
const DOCS_K: Record<DocsKey, number> = { original: 1.00, duplicate: 0.93 };

export default function CarMarketValueCalculator() {
  const { t } = useTranslation('calculators');

  const carPresets: CarPreset[] = [
    { id: 'hyundai-tucson', labelKey: 'car-market-value.carHyundaiTucson', price: 18000000 },
    { id: 'toyota-camry', labelKey: 'car-market-value.carToyotaCamry', price: 22000000 },
    { id: 'kia-sportage', labelKey: 'car-market-value.carKiaSportage', price: 17500000 },
    { id: 'vw-polo', labelKey: 'car-market-value.carVwPolo', price: 12000000 },
    { id: 'lada-vesta', labelKey: 'car-market-value.carLadaVesta', price: 8500000 },
    { id: 'lexus-rx', labelKey: 'car-market-value.carLexusRx', price: 45000000 },
    { id: 'bmw-x5', labelKey: 'car-market-value.carBmwX5', price: 42000000 },
  ];

  const [selectedPreset, setSelectedPreset] = useState<string>('hyundai-tucson');
  const [newPrice, setNewPrice] = useState<string>('18000000');
  const [year, setYear] = useState<string>('2020');
  const [mileage, setMileage] = useState<string>('90000');
  const [condition, setCondition] = useState<ConditionKey>('good');
  const [region, setRegion] = useState<RegionKey>('almaty-astana');
  const [body, setBody] = useState<BodyKey>('suv');
  const [isDamaged, setIsDamaged] = useState<boolean>(false);
  const [docs, setDocs] = useState<DocsKey>('original');

  const [results, setResults] = useState({
    baseAfterDepreciation: 0, marketValue: 0, minPrice: 0, maxPrice: 0,
    lossAmount: 0, lossPercent: 0, mileageK: 1, conditionK: 1,
    regionK: 1, bodyK: 1, damagedK: 1, docsK: 1, sellPrice: 0, buyPrice: 0,
  });

  useEffect(() => {
    const preset = carPresets.find((c) => c.id === selectedPreset);
    if (preset) setNewPrice(String(preset.price));
  }, [selectedPreset]);

  useEffect(() => {
    const basePrice = parseFloat(newPrice) || 0;
    const y = parseInt(year) || CURRENT_YEAR;
    const km = parseFloat(mileage) || 0;
    const age = Math.max(0, CURRENT_YEAR - y);

    if (basePrice <= 0) {
      setResults({
        baseAfterDepreciation: 0, marketValue: 0, minPrice: 0, maxPrice: 0,
        lossAmount: 0, lossPercent: 0, mileageK: 1, conditionK: 1,
        regionK: 1, bodyK: 1, damagedK: 1, docsK: 1, sellPrice: 0, buyPrice: 0,
      });
      return;
    }

    let depreciated = basePrice;
    for (let i = 1; i <= age; i++) {
      const rate = i === 1 ? 0.20 : i <= 5 ? 0.10 : 0.07;
      depreciated *= (1 - rate);
    }
    const minValue = basePrice * MIN_VALUE_RATIO;
    if (depreciated < minValue) depreciated = minValue;

    const normalMileage = age * NORMAL_KM_PER_YEAR;
    let mileageK = 1;
    if (normalMileage > 0) {
      const ratio = km / normalMileage;
      if (ratio <= 0.8) mileageK = 1.10;
      else if (ratio <= 1.2) mileageK = 1.00;
      else if (ratio <= 1.6) mileageK = 0.88;
      else mileageK = 0.75;
    }

    const conditionK = CONDITION_K[condition];
    const regionK = REGION_K[region];
    const bodyK = BODY_K[body];
    const damagedK = isDamaged ? 0.75 : 1.00;
    const docsK = DOCS_K[docs];

    const marketValue = depreciated * mileageK * conditionK * regionK * bodyK * damagedK * docsK;
    const lossAmount = basePrice - marketValue;

    setResults({
      baseAfterDepreciation: Math.round(depreciated),
      marketValue: Math.round(marketValue),
      minPrice: Math.round(marketValue * 0.90),
      maxPrice: Math.round(marketValue * 1.10),
      lossAmount: Math.round(lossAmount),
      lossPercent: Number(((lossAmount / basePrice) * 100).toFixed(1)),
      mileageK, conditionK, regionK, bodyK, damagedK, docsK,
      sellPrice: Math.round(marketValue * 0.95),
      buyPrice: Math.round(marketValue * 0.94),
    });
  }, [newPrice, year, mileage, condition, region, body, isDamaged, docs]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (results.marketValue === 0) return null;
    return `${t('car-market-value.exportTitle')}
─────────────────────────────
${t('car-market-value.newPrice')}: ${formatCurrency(parseFloat(newPrice) || 0)}
${t('car-market-value.year')}: ${year}
${t('car-market-value.mileage')}: ${parseFloat(mileage).toLocaleString('ru-KZ')} ${t('car-market-value.km')}
${t('car-market-value.condition')}: ${t(`car-market-value.cond_${condition}`)}
${t('car-market-value.region')}: ${t(`car-market-value.reg_${region}`)}
${t('car-market-value.body')}: ${t(`car-market-value.body_${body}`)}
${t('car-market-value.damaged')}: ${isDamaged ? t('car-market-value.yes') : t('car-market-value.no')}
${t('car-market-value.docs')}: ${t(`car-market-value.docs_${docs}`)}

${t('car-market-value.resultsTitle')}:
─────────────────────────────
${t('car-market-value.marketValue')}: ${formatCurrency(results.marketValue)}
${t('car-market-value.priceRange')}: ${formatCurrency(results.minPrice)} — ${formatCurrency(results.maxPrice)}
${t('car-market-value.lossAmount')}: ${formatCurrency(results.lossAmount)} (${results.lossPercent}%)
${t('car-market-value.sellPrice')}: ${formatCurrency(results.sellPrice)}
${t('car-market-value.buyPrice')}: ${formatCurrency(results.buyPrice)}
─────────────────────────────
calk.kz`;
  };

  const renderBtnGroup = <T extends string>(
    options: T[], selected: T, onSelect: (v: T) => void, labelFn: (v: T) => string, size: 'sm' | 'md' = 'md'
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onSelect(o)}
          className={`${size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-lg border-2 font-medium transition-all ${
            selected === o ? 'border-slate-500 bg-slate-50 text-slate-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
          }`}
        >{labelFn(o)}</button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="car-market-value" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-gray-700 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('car-market-value.heading')}</h1>
            <p className="text-gray-600">{t('car-market-value.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('car-market-value.warning')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />{t('car-market-value.parameters')}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Tag className="w-4 h-4 inline mr-1" />{t('car-market-value.carModel')}
              </label>
              {renderBtnGroup(carPresets.map(c => c.id), selectedPreset, setSelectedPreset,
                (id) => t(carPresets.find(c => c.id === id)!.labelKey), 'sm')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('car-market-value.newPrice')}</label>
              <div className="relative">
                <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('car-market-value.year')}</label>
              <RangeSlider value={parseInt(year) || 2020} onChange={(v) => setYear(String(v))}
                min={1990} max={CURRENT_YEAR} step={1} formatValue={(v) => String(v)} color="#475569" />
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={CURRENT_YEAR}
                className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('car-market-value.mileage')}</label>
              <RangeSlider value={parseFloat(mileage) || 0} onChange={(v) => setMileage(String(v))}
                min={0} max={400000} step={1000}
                formatValue={(v) => `${v.toLocaleString('ru-KZ')} ${t('car-market-value.km')}`} color="#475569" />
              <div className="relative mt-3">
                <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('car-market-value.km')}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('car-market-value.condition')}</label>
              {renderBtnGroup<ConditionKey>(['excellent', 'good', 'average', 'poor'], condition, setCondition,
                (c) => t(`car-market-value.cond_${c}`))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="w-4 h-4 inline mr-1" />{t('car-market-value.region')}
              </label>
              {renderBtnGroup<RegionKey>(['almaty-astana', 'shymkent-karaganda', 'other'], region, setRegion,
                (r) => t(`car-market-value.reg_${r}`))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('car-market-value.body')}</label>
              {renderBtnGroup<BodyKey>(['sedan', 'suv', 'hatchback', 'wagon', 'pickup'], body, setBody,
                (b) => t(`car-market-value.body_${b}`))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 rounded-lg p-3 border border-gray-200">
                <input type="checkbox" checked={isDamaged} onChange={(e) => setIsDamaged(e.target.checked)}
                  className="w-4 h-4 text-slate-600 rounded" />
                <span className="text-sm text-gray-700">{t('car-market-value.isDamaged')}</span>
              </label>
              <div className="flex gap-2">
                {(['original', 'duplicate'] as DocsKey[]).map((d) => (
                  <button key={d} onClick={() => setDocs(d)}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      docs === d ? 'border-slate-500 bg-slate-50 text-slate-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}>
                    <FileText className="w-3 h-3 inline mr-1" />{t(`car-market-value.docs_${d}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />{t('car-market-value.resultsTitle')}
          </h2>

          <div className="space-y-5">
            <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('car-market-value.marketValue')}</span>
                <span className="text-2xl font-bold text-slate-700">{formatCurrency(results.marketValue)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {t('car-market-value.priceRange')}: {formatCurrency(results.minPrice)} — {formatCurrency(results.maxPrice)}
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-red-600">
                  <TrendingDown className="w-4 h-4 inline mr-1" />{t('car-market-value.lossAmount')}
                </div>
                <div className="text-lg font-bold text-red-700">{formatCurrency(results.lossAmount)}</div>
              </div>
              <div className="text-xl font-bold text-red-700">−{results.lossPercent}%</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-xs text-green-600">{t('car-market-value.sellPrice')}</div>
                <div className="text-sm font-bold text-green-700">{formatCurrency(results.sellPrice)}</div>
                <div className="text-xs text-green-500 mt-1">−5%</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-xs text-blue-600">{t('car-market-value.buyPrice')}</div>
                <div className="text-sm font-bold text-blue-700">{formatCurrency(results.buyPrice)}</div>
                <div className="text-xs text-blue-500 mt-1">−6%</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">{t('car-market-value.breakdown')}</div>
              <div className="space-y-1.5 text-sm">
                {[
                  { key: 'afterDepreciation', val: formatCurrency(results.baseAfterDepreciation) },
                  { key: 'kMileage', val: `×${results.mileageK.toFixed(2)}` },
                  { key: 'kCondition', val: `×${results.conditionK.toFixed(2)}` },
                  { key: 'kRegion', val: `×${results.regionK.toFixed(2)}` },
                  { key: 'kBody', val: `×${results.bodyK.toFixed(2)}` },
                  { key: 'kDamaged', val: `×${results.damagedK.toFixed(2)}` },
                  { key: 'kDocs', val: `×${results.docsK.toFixed(2)}` },
                ].map((row) => (
                  <div key={row.key} className="flex justify-between">
                    <span className="text-gray-600">{t(`car-market-value.${row.key}`)}</span>
                    <span className="font-medium text-gray-900">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />{t('car-market-value.infoNote')}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('car-market-value.exportFilename')} />
      </div>

      <MethodologySection steps={getMethodology('car-market-value')} />

      <FAQSection
        items={[
          { question: t('car-market-value.faq.q1'), answer: t('car-market-value.faq.a1') },
          { question: t('car-market-value.faq.q2'), answer: t('car-market-value.faq.a2') },
          { question: t('car-market-value.faq.q3'), answer: t('car-market-value.faq.a3') },
          { question: t('car-market-value.faq.q4'), answer: t('car-market-value.faq.a4') },
          { question: t('car-market-value.faq.q5'), answer: t('car-market-value.faq.a5') },
        ]}
      
          sources={getSources('car-market-value')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget />
      <LastUpdated calculatorId="car-market-value" />
    </div>
  );
}
