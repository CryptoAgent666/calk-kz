import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calculator, Star, Info } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP_2026 = 4_325;

// Прейскурант на госномерные знаки повышенного спроса (пост. Правительства РК,
// adilet.zan.kz G24C0000516), действует с 2026. Базовый госномер при регистрации — 2,8 МРП
// (280% МРП по новому НК РК); повышенный спрос — единая сетка 15–285 МРП.
interface PlateCategory {
  id: string;
  labelKey: string;
  descKey: string;
  mrp: number;
  example: string;
}

const plateCategories: PlateCategory[] = [
  { id: 'premiumLetters', labelKey: 'fancy-plates.cat.premiumLetters', descKey: 'fancy-plates.desc.premiumLetters', mrp: 285, example: '001 AAA' },
  { id: 'premium', labelKey: 'fancy-plates.cat.premium', descKey: 'fancy-plates.desc.premium', mrp: 228, example: '007 BCA' },
  { id: 'roundLetters', labelKey: 'fancy-plates.cat.roundLetters', descKey: 'fancy-plates.desc.roundLetters', mrp: 194, example: '100 BBB' },
  { id: 'round', labelKey: 'fancy-plates.cat.round', descKey: 'fancy-plates.desc.round', mrp: 137, example: '777 XYZ' },
  { id: 'popularLetters', labelKey: 'fancy-plates.cat.popularLetters', descKey: 'fancy-plates.desc.popularLetters', mrp: 114, example: '070 DDD' },
  { id: 'mirrorLetters', labelKey: 'fancy-plates.cat.mirrorLetters', descKey: 'fancy-plates.desc.mirrorLetters', mrp: 72, example: '101 AAA' },
  { id: 'triplet', labelKey: 'fancy-plates.cat.triplet', descKey: 'fancy-plates.desc.triplet', mrp: 57, example: '070 TTT' },
  { id: 'mirror', labelKey: 'fancy-plates.cat.mirror', descKey: 'fancy-plates.desc.mirror', mrp: 15, example: '121 XYZ' },
  { id: 'custom', labelKey: 'fancy-plates.cat.custom', descKey: 'fancy-plates.desc.custom', mrp: 10, example: '720 TNO' },
  { id: 'standard', labelKey: 'fancy-plates.cat.standard', descKey: 'fancy-plates.desc.standard', mrp: 2.8, example: '548 BCA' },
];

export default function FancyPlatesCalculator() {
  const { t } = useTranslation('calculators');

  const [selectedCategory, setSelectedCategory] = useState('premium');
  const [quantity, setQuantity] = useState<string>('1');

  const selected = plateCategories.find((c) => c.id === selectedCategory);

  const results = useMemo(() => {
    if (!selected) return null;
    const qty = Math.max(1, parseInt(quantity) || 1);
    const pricePerPlate = selected.mrp * MRP_2026;
    const total = pricePerPlate * qty;
    return { pricePerPlate, total, mrp: selected.mrp, qty };
  }, [selected, quantity]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (!results || !selected) return null;
    return {
      title: t('fancy-plates.exportTitle'),
      sections: [{
        title: t('fancy-plates.resultsTitle'),
        data: [
          { label: t('fancy-plates.category'), value: t(selected.labelKey) },
          { label: t('fancy-plates.feeInMRP'), value: `${results.mrp} МРП` },
          { label: t('fancy-plates.feeInTenge'), value: formatCurrency(results.pricePerPlate) },
          { label: t('fancy-plates.quantity'), value: String(results.qty) },
          { label: t('fancy-plates.total'), value: formatCurrency(results.total) },
        ],
      }],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="fancy-plates" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('fancy-plates.heading')}</h1>
            <p className="text-gray-600">{t('fancy-plates.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-blue-800 text-sm">{t('fancy-plates.infoBanner')}</p>
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Car className="w-5 h-5 inline mr-2" />
            {t('fancy-plates.selectCategory')}
          </h2>

          <div className="space-y-2">
            {plateCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedCategory === cat.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t(cat.labelKey)}</div>
                    <div className="text-xs text-gray-500">{t(cat.descKey)}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-sm font-bold text-amber-700">{cat.mrp} МРП</div>
                    <div className="text-xs text-gray-500 font-mono">{cat.example}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fancy-plates.quantity')}</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('fancy-plates.resultsTitle')}
          </h2>

          {results && selected ? (
            <div className="space-y-6">
              {/* Selected */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{t('fancy-plates.category')}</div>
                <div className="font-semibold text-gray-900">{t(selected.labelKey)}</div>
                <div className="text-xs text-gray-500 mt-1">{t(selected.descKey)}</div>
                <div className="mt-2 inline-block bg-gray-200 px-3 py-1 rounded font-mono text-lg">{selected.example}</div>
              </div>

              {/* Fee in MRP */}
              <div className="bg-amber-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-amber-600">{t('fancy-plates.feeInMRP')}</div>
                  <div className="text-xs text-amber-500">1 МРП = {formatCurrency(MRP_2026)}</div>
                </div>
                <span className="text-2xl font-bold text-amber-700">{results.mrp} МРП</span>
              </div>

              {/* Price per plate */}
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('fancy-plates.feeInTenge')}</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(results.pricePerPlate)}</span>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-semibold text-amber-900">{t('fancy-plates.total')}</span>
                    {results.qty > 1 && (
                      <div className="text-xs text-amber-600">× {results.qty}</div>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-amber-700">{formatCurrency(results.total)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                {t('fancy-plates.infoNote')}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Full table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('fancy-plates.referenceTable')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-gray-600">{t('fancy-plates.category')}</th>
                <th className="text-left py-3 px-2 text-gray-600">{t('fancy-plates.example')}</th>
                <th className="text-right py-3 px-2 text-gray-600">МРП</th>
                <th className="text-right py-3 px-2 text-gray-600">{t('fancy-plates.amountTenge')}</th>
              </tr>
            </thead>
            <tbody>
              {plateCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${selectedCategory === cat.id ? 'bg-amber-50' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <td className="py-2 px-2">{t(cat.labelKey)}</td>
                  <td className="py-2 px-2 font-mono text-gray-500">{cat.example}</td>
                  <td className="py-2 px-2 text-right font-medium">{cat.mrp}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(cat.mrp * MRP_2026)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename="fancy-plates" />
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('fancy-plates.faq.q1'), answer: t('fancy-plates.faq.a1') },
          { question: t('fancy-plates.faq.q2'), answer: t('fancy-plates.faq.a2') },
          { question: t('fancy-plates.faq.q3'), answer: t('fancy-plates.faq.a3') },
          { question: t('fancy-plates.faq.q4'), answer: t('fancy-plates.faq.a4') },
          { question: t('fancy-plates.faq.q5'), answer: t('fancy-plates.faq.a5') },
        ]}
      
          sources={getSources('fancy-plates')}
        />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="fancy-plates" calculatorTitle={t('fancy-plates.heading')} />
      <LastUpdated calculatorId="fancy-plates" />
    </div>
  );
}
