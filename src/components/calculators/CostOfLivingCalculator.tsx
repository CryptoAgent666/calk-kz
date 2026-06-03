import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Home, ShoppingCart, Bus, Zap, TrendingUp, Info } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ComparisonBarChart } from '../ui/ChartComponents';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

// Средние расходы по городам Казахстана (₸/месяц, 2026 оценка)
// Источники: stat.gov.kz, krisha.kz, 2gis
interface CityData {
  id: string;
  labelKey: string;
  rent1room: number;    // аренда 1-комн. квартиры
  rent2room: number;    // аренда 2-комн.
  utilities: number;    // ЖКХ (средняя)
  groceries: number;    // продукты на 1 чел.
  transport: number;    // общ. транспорт/бензин
  dining: number;       // питание вне дома
  internet: number;     // интернет + мобильная связь
}

const cities: CityData[] = [
  { id: 'almaty', labelKey: 'cost-living.cities.almaty', rent1room: 220000, rent2room: 350000, utilities: 25000, groceries: 120000, transport: 30000, dining: 40000, internet: 8000 },
  { id: 'astana', labelKey: 'cost-living.cities.astana', rent1room: 200000, rent2room: 320000, utilities: 28000, groceries: 115000, transport: 28000, dining: 38000, internet: 8000 },
  { id: 'shymkent', labelKey: 'cost-living.cities.shymkent', rent1room: 120000, rent2room: 180000, utilities: 18000, groceries: 95000, transport: 22000, dining: 28000, internet: 7000 },
  { id: 'karaganda', labelKey: 'cost-living.cities.karaganda', rent1room: 110000, rent2room: 170000, utilities: 22000, groceries: 100000, transport: 22000, dining: 25000, internet: 7000 },
  { id: 'aktobe', labelKey: 'cost-living.cities.aktobe', rent1room: 130000, rent2room: 200000, utilities: 20000, groceries: 105000, transport: 25000, dining: 30000, internet: 7000 },
  { id: 'atyrau', labelKey: 'cost-living.cities.atyrau', rent1room: 180000, rent2room: 280000, utilities: 22000, groceries: 130000, transport: 30000, dining: 45000, internet: 8000 },
  { id: 'aktau', labelKey: 'cost-living.cities.aktau', rent1room: 170000, rent2room: 260000, utilities: 20000, groceries: 125000, transport: 28000, dining: 42000, internet: 8000 },
  { id: 'ust-kamenogorsk', labelKey: 'cost-living.cities.ust-kamenogorsk', rent1room: 120000, rent2room: 185000, utilities: 20000, groceries: 100000, transport: 22000, dining: 28000, internet: 7000 },
  { id: 'pavlodar', labelKey: 'cost-living.cities.pavlodar', rent1room: 100000, rent2room: 160000, utilities: 18000, groceries: 95000, transport: 20000, dining: 25000, internet: 7000 },
  { id: 'semey', labelKey: 'cost-living.cities.semey', rent1room: 90000, rent2room: 145000, utilities: 17000, groceries: 90000, transport: 18000, dining: 22000, internet: 6500 },
];

type RentType = '1room' | '2room' | 'own';

export default function CostOfLivingCalculator() {
  const { t } = useTranslation('calculators');

  const [city1, setCity1] = useState('almaty');
  const [city2, setCity2] = useState('astana');
  const [rentType, setRentType] = useState<RentType>('1room');
  const [familySize, setFamilySize] = useState<string>('1');

  const getTotal = (city: CityData, rent: RentType, members: number) => {
    const rentCost = rent === '1room' ? city.rent1room : rent === '2room' ? city.rent2room : 0;
    return {
      rent: rentCost,
      utilities: city.utilities,
      groceries: city.groceries * members,
      transport: city.transport * members,
      dining: city.dining * members,
      internet: city.internet,
      total: rentCost + city.utilities + (city.groceries + city.transport + city.dining) * members + city.internet,
    };
  };

  const members = Math.max(1, parseInt(familySize) || 1);
  const c1 = cities.find((c) => c.id === city1)!;
  const c2 = cities.find((c) => c.id === city2)!;

  const result1 = useMemo(() => getTotal(c1, rentType, members), [c1, rentType, members]);
  const result2 = useMemo(() => getTotal(c2, rentType, members), [c2, rentType, members]);

  const diff = result1.total - result2.total;
  const diffPercent = result2.total > 0 ? ((diff / result2.total) * 100).toFixed(1) : '0';

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const categories = ['rent', 'utilities', 'groceries', 'transport', 'dining', 'internet'] as const;

  const chartData = useMemo(() => [
    { name: t(c1.labelKey), value: result1.total },
    { name: t(c2.labelKey), value: result2.total },
  ], [c1, c2, result1, result2, t]);

  const generateExportData = () => ({
    title: t('cost-living.exportTitle'),
    sections: [
      {
        title: t(c1.labelKey),
        data: categories.map((cat) => ({
          label: t(`cost-living.cat.${cat}`),
          value: formatCurrency(result1[cat]),
        })).concat([{ label: t('cost-living.total'), value: formatCurrency(result1.total) }]),
      },
      {
        title: t(c2.labelKey),
        data: categories.map((cat) => ({
          label: t(`cost-living.cat.${cat}`),
          value: formatCurrency(result2[cat]),
        })).concat([{ label: t('cost-living.total'), value: formatCurrency(result2.total) }]),
      },
    ],
    footer: 'calk.kz',
  });

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="cost-of-living" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('cost-living.heading')}</h1>
            <p className="text-gray-600">{t('cost-living.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('cost-living.warning')}</p>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          {/* City 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('cost-living.city1')}</label>
            <select
              value={city1}
              onChange={(e) => setCity1(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* City 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('cost-living.city2')}</label>
            <select
              value={city2}
              onChange={(e) => setCity2(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Rent type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('cost-living.rentType')}</label>
            <select
              value={rentType}
              onChange={(e) => setRentType(e.target.value as RentType)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="1room">{t('cost-living.rent1room')}</option>
              <option value="2room">{t('cost-living.rent2room')}</option>
              <option value="own">{t('cost-living.rentOwn')}</option>
            </select>
          </div>

          {/* Family size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('cost-living.familySize')}</label>
            <input
              type="number"
              value={familySize}
              onChange={(e) => setFamilySize(e.target.value)}
              min="1"
              max="10"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Comparison summary */}
      <div className={`mb-8 rounded-xl p-6 border-2 ${diff > 0 ? 'bg-red-50 border-red-200' : diff < 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            {t(c1.labelKey)} vs {t(c2.labelKey)}
          </div>
          {diff !== 0 ? (
            <div className={`text-2xl font-bold ${diff > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {t(c1.labelKey)} {diff > 0 ? t('cost-living.moreExpensive') : t('cost-living.cheaper')} {t('cost-living.by')} {Math.abs(Number(diffPercent))}%
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-700">{t('cost-living.equal')}</div>
          )}
          <div className="text-sm text-gray-600 mt-2">
            {formatCurrency(result1.total)} vs {formatCurrency(result2.total)} / {t('cost-living.perMonth')}
          </div>
        </div>
      </div>

      {/* Detailed comparison table */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {[{ city: c1, result: result1, label: c1.labelKey }, { city: c2, result: result2, label: c2.labelKey }].map(({ city, result, label }, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <MapPin className="w-5 h-5 inline mr-2" />
              {t(label)}
            </h2>
            <div className="space-y-3">
              {rentType !== 'own' && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600 flex items-center"><Home className="w-4 h-4 mr-1" />{t('cost-living.cat.rent')}</span>
                  <span className="font-medium">{formatCurrency(result.rent)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600 flex items-center"><Zap className="w-4 h-4 mr-1" />{t('cost-living.cat.utilities')}</span>
                <span className="font-medium">{formatCurrency(result.utilities)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600 flex items-center"><ShoppingCart className="w-4 h-4 mr-1" />{t('cost-living.cat.groceries')}</span>
                <span className="font-medium">{formatCurrency(result.groceries)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600 flex items-center"><Bus className="w-4 h-4 mr-1" />{t('cost-living.cat.transport')}</span>
                <span className="font-medium">{formatCurrency(result.transport)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{t('cost-living.cat.dining')}</span>
                <span className="font-medium">{formatCurrency(result.dining)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">{t('cost-living.cat.internet')}</span>
                <span className="font-medium">{formatCurrency(result.internet)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-teal-50 rounded-lg px-3">
                <span className="font-semibold text-teal-900">{t('cost-living.total')}</span>
                <span className="text-xl font-bold text-teal-700">{formatCurrency(result.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-8">
        <ComparisonBarChart
          data={chartData}
          dataKeys={[{ key: 'value', name: t('cost-living.total'), color: '#0ea5e9' }]}
          title={t('cost-living.chartTitle')}
        />
      </div>

      {/* Export */}
      <div className="mb-8">
        <ExportButtons data={generateExportData()} filename="cost-of-living" />
      </div>

      {/* Info */}
      <div className="mb-8 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
        <Info className="w-4 h-4 inline mr-1" />
        {t('cost-living.infoNote')}
      </div>

      {/* FAQ */}
      <MethodologySection steps={getMethodology('cost-of-living')} />
      <FAQSection
        items={[
          { question: t('cost-living.faq.q1'), answer: t('cost-living.faq.a1') },
          { question: t('cost-living.faq.q2'), answer: t('cost-living.faq.a2') },
          { question: t('cost-living.faq.q3'), answer: t('cost-living.faq.a3') },
          { question: t('cost-living.faq.q4'), answer: t('cost-living.faq.a4') },
          { question: t('cost-living.faq.q5'), answer: t('cost-living.faq.a5') },
        ]}
      
          sources={getSources('cost-of-living')}
        />

      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget calculatorId="cost-living" calculatorTitle={t('cost-living.heading')} />
      <LastUpdated calculatorId="cost-of-living" />
    </div>
  );
}
