import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wine, Calculator, TrendingUp, Info, Beer, Cigarette } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';

// Ставки акцизов НК РК 2026 (статья 537 нового НК K2500000214)
interface ExciseProduct {
  id: string;
  labelKey: string;
  group: 'alcohol' | 'tobacco';
  rate: number;
  unitKey: string;
  adValoremRate?: number; // адвалорная составляющая (%)
}

// Ставки 2026 — ст. 537 НК РК. Сигареты — только специфическая ставка (адвалорной части в 2026 НЕТ).
// Вейпы/никотиносодержащие жидкости выведены из подакцизных и запрещены к реализации в РК — исключены.
const products: ExciseProduct[] = [
  // Алкоголь
  { id: 'vodka', labelKey: 'excise-tax.products.vodka', group: 'alcohol', rate: 2805, unitKey: 'excise-tax.perLiterAlcohol' },
  { id: 'cognac', labelKey: 'excise-tax.products.cognac', group: 'alcohol', rate: 2805, unitKey: 'excise-tax.perLiterAlcohol' },
  { id: 'wine', labelKey: 'excise-tax.products.wine', group: 'alcohol', rate: 38, unitKey: 'excise-tax.perLiter' },
  { id: 'sparklingWine', labelKey: 'excise-tax.products.sparklingWine', group: 'alcohol', rate: 38, unitKey: 'excise-tax.perLiter' },
  { id: 'beer', labelKey: 'excise-tax.products.beer', group: 'alcohol', rate: 99, unitKey: 'excise-tax.perLiter' },
  { id: 'beerStrong', labelKey: 'excise-tax.products.beerStrong', group: 'alcohol', rate: 99, unitKey: 'excise-tax.perLiter' },

  // Табак
  { id: 'cigarettes', labelKey: 'excise-tax.products.cigarettes', group: 'tobacco', rate: 18051, unitKey: 'excise-tax.per1000units' },
  { id: 'heatedTobacco', labelKey: 'excise-tax.products.heatedTobacco', group: 'tobacco', rate: 11230, unitKey: 'excise-tax.per1000units' },
  { id: 'cigars', labelKey: 'excise-tax.products.cigars', group: 'tobacco', rate: 825, unitKey: 'excise-tax.perUnit' },
];

export default function ExciseTaxCalculator() {
  const { t } = useTranslation('calculators');

  const [selectedProduct, setSelectedProduct] = useState<string>('vodka');
  const [quantity, setQuantity] = useState<string>('100');
  const [alcoholContent, setAlcoholContent] = useState<string>('40');
  const [retailPrice, setRetailPrice] = useState<string>('3000');
  const [activeTab, setActiveTab] = useState<'alcohol' | 'tobacco'>('alcohol');

  const product = products.find((p) => p.id === selectedProduct);

  const results = useMemo(() => {
    if (!product) return null;
    const qty = parseFloat(quantity) || 0;
    const alc = parseFloat(alcoholContent) || 0;
    const price = parseFloat(retailPrice) || 0;

    if (qty <= 0) return null;

    let excise: number;
    let adValorem = 0;

    if (product.group === 'alcohol' && (product.id === 'vodka' || product.id === 'cognac')) {
      // Ставка за литр безводного спирта
      const absoluteAlcohol = qty * (alc / 100);
      excise = Math.round(absoluteAlcohol * product.rate);
    } else if (product.group === 'tobacco' && product.adValoremRate) {
      // Специфическая + адвалорная
      const specificExcise = Math.round((qty / 1000) * product.rate);
      adValorem = Math.round(qty * price * (product.adValoremRate / 100));
      excise = specificExcise + adValorem;
    } else if (product.id === 'cigarettes' || product.id === 'heatedTobacco') {
      excise = Math.round((qty / 1000) * product.rate);
    } else {
      excise = Math.round(qty * product.rate);
    }

    const perUnit = qty > 0 ? Math.round(excise / qty) : 0;

    return {
      excise,
      adValorem,
      perUnit,
      quantity: qty,
    };
  }, [product, quantity, alcoholContent, retailPrice]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (!results || !product) return null;
    return {
      title: t('excise-tax.exportTitle'),
      sections: [
        {
          title: t('excise-tax.parameters'),
          data: [
            { label: t('excise-tax.product'), value: t(product.labelKey) },
            { label: t('excise-tax.quantity'), value: String(results.quantity) },
            { label: t('excise-tax.rate'), value: `${product.rate} ₸` },
          ],
        },
        {
          title: t('excise-tax.resultsTitle'),
          data: [
            { label: t('excise-tax.totalExcise'), value: formatCurrency(results.excise) },
            { label: t('excise-tax.perUnit'), value: formatCurrency(results.perUnit) },
          ],
        },
      ],
      footer: 'calk.kz',
    };
  };

  const filteredProducts = products.filter((p) => p.group === activeTab);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Wine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('excise-tax.heading')}</h1>
            <p className="text-gray-600">{t('excise-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('excise-tax.warning')}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('excise-tax.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Tab: alcohol / tobacco */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setActiveTab('alcohol');
                  setSelectedProduct('vodka');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'alcohol'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-gray-50 text-gray-600 border-2 border-gray-100'
                }`}
              >
                <Beer className="w-4 h-4 inline mr-1" />
                {t('excise-tax.tabAlcohol')}
              </button>
              <button
                onClick={() => {
                  setActiveTab('tobacco');
                  setSelectedProduct('cigarettes');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'tobacco'
                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                    : 'bg-gray-50 text-gray-600 border-2 border-gray-100'
                }`}
              >
                <Cigarette className="w-4 h-4 inline mr-1" />
                {t('excise-tax.tabTobacco')}
              </button>
            </div>

            {/* Product selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('excise-tax.product')}
              </label>
              <div className="space-y-2">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                      selectedProduct === p.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span>{t(p.labelKey)}</span>
                      <span className="text-xs text-gray-500">
                        {p.rate.toLocaleString('ru-KZ')} ₸/{t(p.unitKey)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('excise-tax.quantity')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">
                    {product && t(product.unitKey).split('/').pop()}
                  </span>
                </div>
              </div>
            </div>

            {/* Alcohol content (for vodka/cognac) */}
            {product && (product.id === 'vodka' || product.id === 'cognac') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('excise-tax.alcoholContent')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={alcoholContent}
                    onChange={(e) => setAlcoholContent(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Retail price (for cigarettes with ad valorem) */}
            {product && product.adValoremRate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('excise-tax.retailPrice')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('excise-tax.resultsTitle')}
          </h2>

          {results && product ? (
            <div className="space-y-6">
              {/* Product info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{t('excise-tax.product')}</div>
                <div className="font-semibold text-gray-900">{t(product.labelKey)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('excise-tax.rate')}: {product.rate.toLocaleString('ru-KZ')} ₸/{t(product.unitKey)}
                </div>
              </div>

              {/* Total excise */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-purple-900">{t('excise-tax.totalExcise')}</span>
                  <span className="text-2xl font-bold text-purple-700">{formatCurrency(results.excise)}</span>
                </div>
              </div>

              {/* Ad valorem component */}
              {results.adValorem > 0 && (
                <div className="bg-pink-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-pink-600">{t('excise-tax.adValorem')}</div>
                      <div className="text-xs text-pink-500">{product.adValoremRate}% {t('excise-tax.ofRetailPrice')}</div>
                    </div>
                    <span className="text-lg font-bold text-pink-700">{formatCurrency(results.adValorem)}</span>
                  </div>
                </div>
              )}

              {/* Per unit */}
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">{t('excise-tax.perUnit')}</div>
                </div>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(results.perUnit)}</span>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                {t('excise-tax.infoNote')}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              {t('excise-tax.enterData')}
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('excise-tax.exportFilename')} />
      </div>

      {/* Reference rates table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('excise-tax.ratesTable')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-gray-600">{t('excise-tax.product')}</th>
                <th className="text-right py-3 px-2 text-gray-600">{t('excise-tax.rate')}</th>
                <th className="text-left py-3 px-2 text-gray-600">{t('excise-tax.unit')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                    selectedProduct === p.id ? 'bg-purple-50' : ''
                  }`}
                  onClick={() => {
                    setActiveTab(p.group);
                    setSelectedProduct(p.id);
                  }}
                >
                  <td className="py-2 px-2">{t(p.labelKey)}</td>
                  <td className="py-2 px-2 text-right font-medium">{p.rate.toLocaleString('ru-KZ')} ₸</td>
                  <td className="py-2 px-2 text-gray-500">{t(p.unitKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('excise-tax.faq.q1'), answer: t('excise-tax.faq.a1') },
          { question: t('excise-tax.faq.q2'), answer: t('excise-tax.faq.a2') },
          { question: t('excise-tax.faq.q3'), answer: t('excise-tax.faq.a3') },
          { question: t('excise-tax.faq.q4'), answer: t('excise-tax.faq.a4') },
          { question: t('excise-tax.faq.q5'), answer: t('excise-tax.faq.a5') },
        ]}
      
          sources={getSources('excise-tax')}
        />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="excise-tax" calculatorTitle={t('excise-tax.heading')} />
      <LastUpdated calculatorId="excise-tax" />
    </div>
  );
}
