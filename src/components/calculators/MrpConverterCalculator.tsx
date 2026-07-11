import { useState, useEffect } from 'react';
import { ArrowLeftRight, Calculator, Info } from 'lucide-react';
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
 * МРП/МЗП-конвертер: N МРП (МЗП) → тенге и обратно. SEO-страница под запросы
 * «10 МРП в тенге», «сколько 30 МРП» и т.п. Значения — Закон о бюджете на 2026.
 * ⚠️ Rollover: при смене года обновить константы + историческую таблицу.
 */
const MRP_2026 = 4325;
const MZP_2026 = 85000;
const HISTORY: { year: number; mrp: number; mzp: number }[] = [
  { year: 2026, mrp: 4325, mzp: 85000 },
  { year: 2025, mrp: 3932, mzp: 85000 },
  { year: 2024, mrp: 3692, mzp: 85000 },
  { year: 2023, mrp: 3450, mzp: 70000 },
];
// Частые пороги в МРП (для справочной таблицы)
const COMMON_MRP = [1, 5, 10, 20, 30, 50, 100, 200, 500, 1000];

type Unit = 'mrp' | 'mzp';
type Direction = 'toKzt' | 'fromKzt';

export default function MrpConverterCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [amount, setAmount] = useState<string>('10');
  const [unit, setUnit] = useState<Unit>('mrp');
  const [direction, setDirection] = useState<Direction>('toKzt');

  const [result, setResult] = useState(0);

  const rate = unit === 'mrp' ? MRP_2026 : MZP_2026;

  useEffect(() => {
    const a = parseFloat(amount) || 0;
    setResult(direction === 'toKzt' ? a * rate : a / rate);
  }, [amount, unit, direction, rate]);

  const fmt = (n: number) => n.toLocaleString('ru-KZ', { maximumFractionDigits: 2 });
  const unitName = t(`mrp-converter.unit_${unit}`);

  const generateExportData = () => {
    const a = parseFloat(amount) || 0;
    if (a <= 0) return '';
    return direction === 'toKzt'
      ? `${fmt(a)} ${unitName} = ${fmt(result)} ₸ (${t('mrp-converter.year2026')})`
      : `${fmt(a)} ₸ = ${fmt(result)} ${unitName} (${t('mrp-converter.year2026')})`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('mrp-converter.heading')}</h1>
            <p className="text-gray-600">{t('mrp-converter.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="mrp-converter" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mrp-converter.parameters')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {(['mrp', 'mzp'] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    unit === u ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(`mrp-converter.unit_${u}`)} — {fmt(u === 'mrp' ? MRP_2026 : MZP_2026)} ₸
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['toKzt', 'fromKzt'] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`px-4 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    direction === d ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(`mrp-converter.dir_${d}`, { unit: unitName })}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {direction === 'toKzt' ? t('mrp-converter.amountUnits', { unit: unitName }) : t('mrp-converter.amountKzt')}
              </label>
              <RangeSlider
                value={parseFloat(amount) || 0}
                onChange={(v) => setAmount(String(v))}
                min={1}
                max={direction === 'toKzt' ? 1000 : 5000000}
                step={direction === 'toKzt' ? 1 : 1000}
                formatValue={(v) => fmt(v)}
                color="#06b6d4"
              />
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('mrp-converter.lawNote')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mrp-converter.results')}</h2>
          <div className="flex justify-between items-center py-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg px-4 mb-6">
            <span className="text-lg font-semibold text-gray-900">
              {fmt(parseFloat(amount) || 0)} {direction === 'toKzt' ? unitName : '₸'}
            </span>
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-cyan-600" />
              <span className="text-2xl font-bold text-cyan-700">
                {fmt(result)} {direction === 'toKzt' ? '₸' : unitName}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('mrp-converter.tableTitle', { unit: unitName })}</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {COMMON_MRP.map((n) => (
              <div key={n} className="flex justify-between border-b border-gray-100 py-1 text-sm">
                <span className="text-gray-600">{n} {unitName}</span>
                <span className="font-medium text-gray-900">{fmt(n * rate)} ₸</span>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mt-6 mb-3">{t('mrp-converter.historyTitle')}</h3>
          <div className="space-y-1.5">
            {HISTORY.map((h) => (
              <div key={h.year} className="flex justify-between border-b border-gray-100 py-1 text-sm">
                <span className="text-gray-600">{h.year}</span>
                <span className="text-gray-900">{t('mrp-converter.unit_mrp')} {fmt(h.mrp)} ₸ · {t('mrp-converter.unit_mzp')} {fmt(h.mzp)} ₸</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {result > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('mrp-converter.exportTitle')}
            description={t('mrp-converter.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {result > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('mrp-converter.export.title'),
              subtitle: generateExportData(),
              sections: [{
                title: t('mrp-converter.export.results'),
                data: [
                  { label: `${fmt(parseFloat(amount) || 0)} ${direction === 'toKzt' ? unitName : '₸'}`, value: `${fmt(result)} ${direction === 'toKzt' ? '₸' : unitName}` },
                  { label: t('mrp-converter.unit_mrp'), value: `${fmt(MRP_2026)} ₸` },
                  { label: t('mrp-converter.unit_mzp'), value: `${fmt(MZP_2026)} ₸` },
                ],
              }],
              footer: t('mrp-converter.export.footer'),
            }}
            filename="mrp-converter"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="mrp-converter" />
      <MethodologySection calculatorId="mrp-converter" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`mrp-converter.faq.q${n}`), answer: t(`mrp-converter.faq.a${n}`) }))}
        sources={[
          { title: i18n.language === 'kk' ? '2026 бюджет туралы заң (АЕК/ЕТЖ)' : 'Закон о бюджете на 2026 (МРП/МЗП)', url: 'https://adilet.zan.kz/rus/docs/Z2500000239' },
        ]}
      />
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="mrp-converter" calculatorTitle={t('mrp-converter.heading')} />
      <LastUpdated calculatorId="mrp-converter" />
    </div>
  );
}
