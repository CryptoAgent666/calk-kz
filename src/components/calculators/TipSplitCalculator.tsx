import { useState, useEffect } from 'react';
import { HandHeart, Calculator, Info } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';

/**
 * Чаевые и сплит счёта. KZ-контекст: во многих заведениях сервисный сбор
 * ~10% уже включён в счёт — тогда чаевые сверху необязательны (галочка).
 */
const TIP_PRESETS = [0, 5, 10, 15];

export default function TipSplitCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [bill, setBill] = useState<string>('15000');
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [people, setPeople] = useState<string>('2');
  const [serviceIncluded, setServiceIncluded] = useState(false);

  const [results, setResults] = useState({ tip: 0, total: 0, perPerson: 0 });

  useEffect(() => {
    const b = parseFloat(bill) || 0;
    const n = Math.max(1, parseInt(people) || 1);
    const tip = serviceIncluded ? 0 : b * (tipPercent / 100);
    const total = b + tip;
    setResults({ tip: Math.round(tip), total: Math.round(total), perPerson: Math.ceil(total / n) });
  }, [bill, tipPercent, people, serviceIncluded]);

  const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    const b = parseFloat(bill) || 0;
    if (b <= 0) return '';
    return `${t('tip-split.parameters')}:
- ${t('tip-split.billLabel')}: ${fmt(b)}
- ${t('tip-split.tipLabel')}: ${serviceIncluded ? t('tip-split.serviceIncludedShort') : tipPercent + '%'}
- ${t('tip-split.peopleLabel')}: ${people}

${t('tip-split.results')}:
- ${t('tip-split.tipAmount')}: ${fmt(results.tip)}
- ${t('tip-split.totalLabel')}: ${fmt(results.total)}
- ${t('tip-split.perPerson')}: ${fmt(results.perPerson)}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <HandHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('tip-split.heading')}</h1>
            <p className="text-gray-600">{t('tip-split.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="tip-split" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tip-split.parameters')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('tip-split.billLabel')}</label>
              <RangeSlider
                value={parseFloat(bill) || 0}
                onChange={(v) => setBill(String(v))}
                min={1000} max={200000} step={500}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#ec4899"
              />
              <input
                type="number" value={bill} onChange={(e) => setBill(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('tip-split.tipLabel')}</label>
              <div className="grid grid-cols-4 gap-2">
                {TIP_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTipPercent(p)}
                    disabled={serviceIncluded}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${
                      tipPercent === p && !serviceIncluded ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox" checked={serviceIncluded}
                onChange={(e) => setServiceIncluded(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{t('tip-split.serviceIncluded')}</span>
                <br /><span className="text-gray-500">{t('tip-split.serviceHint')}</span>
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('tip-split.peopleLabel')}</label>
              <RangeSlider
                value={parseInt(people) || 1}
                onChange={(v) => setPeople(String(v))}
                min={1} max={20} step={1}
                formatValue={(v) => `${v}`}
                color="#ec4899"
              />
              <input
                type="number" min="1" value={people} onChange={(e) => setPeople(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tip-split.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('tip-split.perPerson')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-pink-600" />
                <span className="text-2xl font-bold text-pink-700">{fmt(results.perPerson)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('tip-split.tipAmount')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.tip)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('tip-split.totalLabel')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.total)}</span>
            </div>
            <div className="mt-2 rounded-lg bg-blue-50 p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('tip-split.kzNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.total > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('tip-split.exportTitle')}
            description={t('tip-split.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {results.total > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('tip-split.export.title'),
              subtitle: `${fmt(results.perPerson)} ${t('tip-split.export.perPersonLabel')}`,
              sections: [{
                title: t('tip-split.export.results'),
                data: [
                  { label: t('tip-split.billLabel'), value: fmt(parseFloat(bill) || 0) },
                  { label: t('tip-split.tipAmount'), value: fmt(results.tip) },
                  { label: t('tip-split.totalLabel'), value: fmt(results.total) },
                  { label: t('tip-split.perPerson'), value: fmt(results.perPerson) },
                ],
              }],
              footer: t('tip-split.export.footer'),
            }}
            filename="tip-split"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="tip-split" />
      <MethodologySection calculatorId="tip-split" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`tip-split.faq.q${n}`), answer: t(`tip-split.faq.a${n}`) }))}
        sources={[]}
      />
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="tip-split" calculatorTitle={t('tip-split.heading')} />
      <LastUpdated calculatorId="tip-split" />
    </div>
  );
}
