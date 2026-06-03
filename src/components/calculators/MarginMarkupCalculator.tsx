import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calculator, Percent, DollarSign, Info, Package, BarChart3 } from 'lucide-react';
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

type CalcMode = 'markup' | 'margin' | 'price';
type TaxMode = 'none' | 'simplified' | 'gain' | 'corporate';

interface Results {
  sellingPrice: number;
  profitPerUnit: number;
  markupPct: number;
  marginPct: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  taxAmount: number;
  profitAfterTax: number;
}

const TAX_RATES: Record<TaxMode, number> = {
  none: 0,
  simplified: 0.04,
  gain: 0.10,
  corporate: 0.20,
};

export default function MarginMarkupCalculator() {
  const { t } = useTranslation('calculators');

  const [mode, setMode] = useState<CalcMode>('markup');
  const [cost, setCost] = useState<string>('1000');
  const [markupPctInput, setMarkupPctInput] = useState<string>('50');
  const [marginPctInput, setMarginPctInput] = useState<string>('30');
  const [priceInput, setPriceInput] = useState<string>('1500');
  const [volume, setVolume] = useState<string>('100');
  const [tax, setTax] = useState<TaxMode>('none');

  const [results, setResults] = useState<Results>({
    sellingPrice: 0,
    profitPerUnit: 0,
    markupPct: 0,
    marginPct: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    taxAmount: 0,
    profitAfterTax: 0,
  });

  useEffect(() => {
    const c = parseFloat(cost) || 0;
    const vol = parseFloat(volume) || 0;

    if (c <= 0) {
      setResults({
        sellingPrice: 0, profitPerUnit: 0, markupPct: 0, marginPct: 0,
        monthlyRevenue: 0, monthlyProfit: 0, taxAmount: 0, profitAfterTax: 0,
      });
      return;
    }

    let sellingPrice = 0;
    let markupPct = 0;
    let marginPct = 0;

    if (mode === 'markup') {
      const m = parseFloat(markupPctInput) || 0;
      markupPct = m;
      sellingPrice = c * (1 + m / 100);
      marginPct = sellingPrice > 0 ? ((sellingPrice - c) / sellingPrice) * 100 : 0;
    } else if (mode === 'margin') {
      const m = Math.min(parseFloat(marginPctInput) || 0, 99.99);
      marginPct = m;
      sellingPrice = c / (1 - m / 100);
      markupPct = c > 0 ? ((sellingPrice - c) / c) * 100 : 0;
    } else {
      sellingPrice = parseFloat(priceInput) || 0;
      markupPct = c > 0 ? ((sellingPrice - c) / c) * 100 : 0;
      marginPct = sellingPrice > 0 ? ((sellingPrice - c) / sellingPrice) * 100 : 0;
    }

    const profitPerUnit = sellingPrice - c;
    const monthlyRevenue = sellingPrice * vol;
    const monthlyProfit = profitPerUnit * vol;

    const taxRate = TAX_RATES[tax];
    let taxAmount = 0;
    if (tax === 'simplified') {
      taxAmount = monthlyRevenue * taxRate;
    } else {
      taxAmount = Math.max(monthlyProfit, 0) * taxRate;
    }
    const profitAfterTax = monthlyProfit - taxAmount;

    setResults({
      sellingPrice: Math.round(sellingPrice),
      profitPerUnit: Math.round(profitPerUnit),
      markupPct: Number(markupPct.toFixed(1)),
      marginPct: Number(marginPct.toFixed(1)),
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyProfit: Math.round(monthlyProfit),
      taxAmount: Math.round(taxAmount),
      profitAfterTax: Math.round(profitAfterTax),
    });
  }, [mode, cost, markupPctInput, marginPctInput, priceInput, volume, tax]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const comparisonRows = [10, 25, 50, 100, 200].map((mk) => {
    const c = parseFloat(cost) || 0;
    const price = c * (1 + mk / 100);
    const margin = price > 0 ? ((price - c) / price) * 100 : 0;
    return {
      markup: mk,
      price: Math.round(price),
      margin: Number(margin.toFixed(1)),
      profit: Math.round(price - c),
    };
  });

  const generateExportData = () => ({
    title: t('margin-markup.exportTitle'),
    sections: [
      {
        title: t('margin-markup.parameters'),
        data: [
          { label: t('margin-markup.cost'), value: formatCurrency(parseFloat(cost) || 0) },
          { label: t('margin-markup.volume'), value: `${volume} ${t('margin-markup.volumeUnit')}` },
        ],
      },
      {
        title: t('margin-markup.resultsTitle'),
        data: [
          { label: t('margin-markup.sellingPrice'), value: formatCurrency(results.sellingPrice) },
          { label: t('margin-markup.profitPerUnit'), value: formatCurrency(results.profitPerUnit) },
          { label: t('margin-markup.markup'), value: `${results.markupPct}%` },
          { label: t('margin-markup.margin'), value: `${results.marginPct}%` },
          { label: t('margin-markup.monthlyRevenue'), value: formatCurrency(results.monthlyRevenue) },
          { label: t('margin-markup.monthlyProfit'), value: formatCurrency(results.monthlyProfit) },
          ...(tax !== 'none'
            ? [
                { label: t('margin-markup.taxAmount'), value: formatCurrency(results.taxAmount) },
                { label: t('margin-markup.afterTax'), value: formatCurrency(results.profitAfterTax) },
              ]
            : []),
        ],
      },
    ],
    footer: 'calk.kz',
  });

  const modes: { id: CalcMode; labelKey: string; descKey: string }[] = [
    { id: 'markup', labelKey: 'margin-markup.modeMarkup', descKey: 'margin-markup.modeMarkupDesc' },
    { id: 'margin', labelKey: 'margin-markup.modeMargin', descKey: 'margin-markup.modeMarginDesc' },
    { id: 'price', labelKey: 'margin-markup.modePrice', descKey: 'margin-markup.modePriceDesc' },
  ];

  const taxOptions: { id: TaxMode; labelKey: string }[] = [
    { id: 'none', labelKey: 'margin-markup.taxNone' },
    { id: 'simplified', labelKey: 'margin-markup.taxSimplified' },
    { id: 'gain', labelKey: 'margin-markup.taxGain' },
    { id: 'corporate', labelKey: 'margin-markup.taxCorporate' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="margin-markup" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-lime-500 to-green-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('margin-markup.heading')}</h1>
            <p className="text-gray-600">{t('margin-markup.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('margin-markup.warning')}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('margin-markup.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Mode selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('margin-markup.mode')}
              </label>
              <div className="space-y-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                      mode === m.id
                        ? 'border-lime-500 bg-lime-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`font-semibold ${mode === m.id ? 'text-lime-700' : 'text-gray-700'}`}>
                      {t(m.labelKey)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{t(m.descKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                {t('margin-markup.cost')}
              </label>
              <RangeSlider
                value={parseFloat(cost) || 0}
                onChange={(val) => setCost(String(val))}
                min={100}
                max={500000}
                step={100}
                formatValue={(v) => `${v.toLocaleString('ru-KZ')} ₸`}
                color="#84cc16"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Mode-specific input */}
            {mode === 'markup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  {t('margin-markup.markup')}
                </label>
                <RangeSlider
                  value={parseFloat(markupPctInput) || 0}
                  onChange={(val) => setMarkupPctInput(String(val))}
                  min={0}
                  max={500}
                  step={1}
                  formatValue={(v) => `${v}%`}
                  color="#84cc16"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    value={markupPctInput}
                    onChange={(e) => setMarkupPctInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
            )}

            {mode === 'margin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  {t('margin-markup.margin')}
                </label>
                <RangeSlider
                  value={parseFloat(marginPctInput) || 0}
                  onChange={(val) => setMarginPctInput(String(val))}
                  min={0}
                  max={95}
                  step={1}
                  formatValue={(v) => `${v}%`}
                  color="#84cc16"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    value={marginPctInput}
                    onChange={(e) => setMarginPctInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
            )}

            {mode === 'price' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t('margin-markup.price')}
                </label>
                <RangeSlider
                  value={parseFloat(priceInput) || 0}
                  onChange={(val) => setPriceInput(String(val))}
                  min={100}
                  max={1000000}
                  step={100}
                  formatValue={(v) => `${v.toLocaleString('ru-KZ')} ₸`}
                  color="#84cc16"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>
            )}

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                {t('margin-markup.volume')}
              </label>
              <RangeSlider
                value={parseFloat(volume) || 0}
                onChange={(val) => setVolume(String(val))}
                min={1}
                max={10000}
                step={1}
                formatValue={(v) => `${v.toLocaleString('ru-KZ')} ${t('margin-markup.volumeUnit')}`}
                color="#84cc16"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('margin-markup.volumeUnit')}</span>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('margin-markup.tax')}
              </label>
              <div className="flex flex-wrap gap-2">
                {taxOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTax(opt.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      tax === opt.id
                        ? 'border-lime-500 bg-lime-50 text-lime-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(opt.labelKey)}
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
            {t('margin-markup.resultsTitle')}
          </h2>

          <div className="space-y-6">
            {/* Main result: price */}
            <div className="bg-gradient-to-r from-lime-50 to-green-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('margin-markup.sellingPrice')}</span>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-6 h-6 text-lime-600" />
                  <span className="text-2xl font-bold text-lime-700">{formatCurrency(results.sellingPrice)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {t('margin-markup.profitPerUnit')}: <span className="font-semibold text-gray-800">{formatCurrency(results.profitPerUnit)}</span>
              </div>
            </div>

            {/* Markup & Margin */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">{t('margin-markup.markup')}</div>
                <div className="text-2xl font-bold text-gray-900">{results.markupPct}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">{t('margin-markup.margin')}</div>
                <div className="text-2xl font-bold text-gray-900">{results.marginPct}%</div>
              </div>
            </div>

            {/* Monthly */}
            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <div className="text-sm text-blue-600">{t('margin-markup.monthlyRevenue')}</div>
              <span className="text-lg font-bold text-blue-700">{formatCurrency(results.monthlyRevenue)}</span>
            </div>

            <div className="bg-emerald-50 rounded-lg p-4 flex justify-between items-center">
              <div className="text-sm text-emerald-600">{t('margin-markup.monthlyProfit')}</div>
              <span className="text-lg font-bold text-emerald-700">{formatCurrency(results.monthlyProfit)}</span>
            </div>

            {/* Tax */}
            {tax !== 'none' && (
              <>
                <div className="bg-red-50 rounded-lg p-4 flex justify-between items-center">
                  <div className="text-sm text-red-600">{t('margin-markup.taxAmount')}</div>
                  <span className="text-lg font-bold text-red-700">−{formatCurrency(results.taxAmount)}</span>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 flex justify-between items-center">
                  <div className="text-sm text-purple-600">{t('margin-markup.afterTax')}</div>
                  <span className="text-xl font-bold text-purple-700">{formatCurrency(results.profitAfterTax)}</span>
                </div>
              </>
            )}

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('margin-markup.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          <BarChart3 className="w-5 h-5 inline mr-2" />
          {t('margin-markup.comparisonTitle')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{t('margin-markup.comparisonDesc')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="text-left py-2 px-3 font-medium">{t('margin-markup.colMarkup')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('margin-markup.colPrice')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('margin-markup.colMargin')}</th>
                <th className="text-right py-2 px-3 font-medium">{t('margin-markup.colProfit')}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.markup} className="border-b border-gray-100 hover:bg-lime-50/40 transition-colors">
                  <td className="py-2 px-3 font-semibold text-lime-700">{row.markup}%</td>
                  <td className="text-right py-2 px-3 text-gray-900">{formatCurrency(row.price)}</td>
                  <td className="text-right py-2 px-3 text-gray-700">{row.margin}%</td>
                  <td className="text-right py-2 px-3 text-emerald-700 font-medium">{formatCurrency(row.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename="margin-markup" />
      </div>

      <MethodologySection steps={getMethodology('margin-markup')} />

      <FAQSection
        items={[
          { question: t('margin-markup.faq.q1'), answer: t('margin-markup.faq.a1') },
          { question: t('margin-markup.faq.q2'), answer: t('margin-markup.faq.a2') },
          { question: t('margin-markup.faq.q3'), answer: t('margin-markup.faq.a3') },
          { question: t('margin-markup.faq.q4'), answer: t('margin-markup.faq.a4') },
          { question: t('margin-markup.faq.q5'), answer: t('margin-markup.faq.a5') },
        ]}
      
          sources={getSources('margin-markup')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="margin-markup" calculatorTitle={t('margin-markup.heading')} />
      <LastUpdated calculatorId="margin-markup" />
    </div>
  );
}
