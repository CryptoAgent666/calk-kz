import { useState, useMemo } from 'react';
import { Flame, Info } from 'lucide-react';
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
 * Отопление частного дома: сравнение стоимости за сезон — уголь / газ /
 * электрокотёл / тепловой насос. НЕ путать с калькулятором «heating»
 * (центральное отопление квартиры по Гкал-тарифу).
 *
 * Модель: теплопотребность (кВт·ч/сезон) = площадь × удельная норма;
 * для топлива: энергия-у-источника = теплопотребность / КПД (или / COP для ТН);
 * расход = энергия / теплота_сгорания; стоимость = расход × тариф.
 * Константы теплоты сгорания — физические; КПД/COP — типовые; тарифы РК 2026
 * редактируемы (сильно зависят от региона). ⚠️ Rollover: сверять тарифы.
 */
const HEAT = {
  // теплота сгорания (кВт·ч на единицу), КПД, единица, дефолт-тариф (₸/ед.)
  coal:     { kwhPerUnit: 5.0, eff: 0.70, unit: 'kg', price: 20 },   // экибастузский рабочий ~5 кВт·ч/кг; 20 000 ₸/т
  gas:      { kwhPerUnit: 9.3, eff: 0.92, unit: 'm3', price: 32 },   // природный газ; средняя розница РК ~32 ₸/м³
  electric: { kwhPerUnit: 1.0, eff: 0.99, unit: 'kwh', price: 35 },  // электрокотёл; ~35 ₸/кВт·ч с НДС
  heatpump: { kwhPerUnit: 1.0, eff: 3.0,  unit: 'kwh', price: 35 },  // тепловой насос: eff = COP ≈ 3
} as const;

type Fuel = keyof typeof HEAT;
const FUELS: Fuel[] = ['gas', 'coal', 'heatpump', 'electric'];

// Удельная теплопотребность, кВт·ч/м² за сезон (по утеплённости дома)
const INSULATION = { good: 80, medium: 120, poor: 180 } as const;
type Insulation = keyof typeof INSULATION;

export default function HouseHeatingCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [area, setArea] = useState<string>('100');
  const [insulation, setInsulation] = useState<Insulation>('medium');
  const [prices, setPrices] = useState<Record<Fuel, string>>({
    coal: '20', gas: '32', electric: '35', heatpump: '35',
  });

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const computeResults = (): { fuel: Fuel; cost: number; consumption: number }[] => {
    const a = parseFloat(area) || 0;
    const demand = a * INSULATION[insulation]; // кВт·ч/сезон
    const rows = FUELS.map((fuel) => {
      const h = HEAT[fuel];
      const price = parseFloat(prices[fuel]) || 0;
      const sourceEnergy = demand / h.eff;                 // кВт·ч у источника (или /COP)
      const consumption = sourceEnergy / h.kwhPerUnit;     // единиц топлива (кг/м³/кВт·ч)
      const cost = consumption * price;
      return { fuel, cost: Math.round(cost), consumption: Math.round(consumption) };
    }).sort((x, y) => x.cost - y.cost);
    return rows;
  };

  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [area, insulation, prices]
  );

  const nf = (n: number) => n.toLocaleString('ru-KZ');
  const fmt = (n: number) => nf(n) + ' ₸';
  const maxCost = Math.max(...results.map((r) => r.cost), 1);
  const demandKwh = (parseFloat(area) || 0) * INSULATION[insulation];

  const unitLabel = (fuel: Fuel) => t(`house-heating.unit_${HEAT[fuel].unit}`);

  const generateExportData = () => {
    if (!results.length || !results[0].cost) return '';
    const lines = results.map((r) => `- ${t(`house-heating.fuel_${r.fuel}`)}: ${fmt(r.cost)} (${nf(r.consumption)} ${unitLabel(r.fuel)})`);
    return `${t('house-heating.parameters')}:
- ${t('house-heating.areaLabel')}: ${area} м²
- ${t('house-heating.insulationLabel')}: ${t(`house-heating.ins_${insulation}`)}
- ${t('house-heating.demand')}: ${nf(Math.round(demandKwh))} кВт·ч

${t('house-heating.results')} (${t('house-heating.perSeason')}):
${lines.join('\n')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('house-heating.heading')}</h1>
            <p className="text-gray-600">{t('house-heating.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('house-heating.disclaimer')}</p>
      </div>

      <QuickAnswer calculatorId="house-heating" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('house-heating.parameters')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('house-heating.areaLabel')}</label>
              <RangeSlider
                value={parseFloat(area) || 0}
                onChange={(val) => setArea(String(val))}
                min={30}
                max={400}
                step={5}
                formatValue={(v) => `${v} м²`}
                color="#f97316"
              />
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('house-heating.insulationLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['good', 'medium', 'poor'] as Insulation[]).map((ins) => (
                  <button
                    key={ins}
                    onClick={() => setInsulation(ins)}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      insulation === ins ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`house-heating.ins_${ins}`)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t('house-heating.demandHint', { kwh: nf(Math.round(demandKwh)) })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">{t('house-heating.pricesTitle')}</h3>
              <div className="space-y-2">
                {FUELS.map((fuel) => (
                  <div key={fuel} className="flex items-center justify-between gap-3">
                    <label className="text-sm text-gray-600">
                      {t(`house-heating.fuel_${fuel}`)}
                      <span className="text-xs text-gray-400"> ₸/{unitLabel(fuel)}</span>
                    </label>
                    <input
                      type="number"
                      value={prices[fuel]}
                      onChange={(e) => setPrices((p) => ({ ...p, [fuel]: e.target.value }))}
                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-right text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">{t('house-heating.pricesHint')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{t('house-heating.results')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('house-heating.perSeason')}</p>
          <div className="space-y-4">
            {results.map((r, idx) => (
              <div key={r.fuel}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-sm font-medium ${idx === 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                    {idx === 0 && '★ '}{t(`house-heating.fuel_${r.fuel}`)}
                    <span className="text-xs text-gray-400 ml-1">{nf(r.consumption)} {unitLabel(r.fuel)}</span>
                  </span>
                  <span className={`font-bold ${idx === 0 ? 'text-emerald-700' : 'text-gray-900'}`}>{fmt(r.cost)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-orange-400'}`}
                    style={{ width: `${Math.max(4, (r.cost / maxCost) * 100)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('house-heating.efficiencyNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && results[0].cost > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('house-heating.exportTitle')}
            description={t('house-heating.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.length > 0 && results[0].cost > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('house-heating.export.title'),
              subtitle: `${t(`house-heating.fuel_${results[0].fuel}`)} — ${fmt(results[0].cost)}`,
              sections: [
                {
                  title: t('house-heating.export.results'),
                  data: [
                    { label: t('house-heating.areaLabel'), value: `${area} м²` },
                    { label: t('house-heating.demand'), value: `${nf(Math.round(demandKwh))} кВт·ч` },
                    ...results.map((r) => ({ label: t(`house-heating.fuel_${r.fuel}`), value: fmt(r.cost) })),
                  ],
                },
              ],
              footer: t('house-heating.export.footer'),
            }}
            filename="house-heating-comparison"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="house-heating" />
      <MethodologySection calculatorId="house-heating" />
      <FAQSection
        items={[
          { question: t('house-heating.faq.q1'), answer: t('house-heating.faq.a1') },
          { question: t('house-heating.faq.q2'), answer: t('house-heating.faq.a2') },
          { question: t('house-heating.faq.q3'), answer: t('house-heating.faq.a3') },
          { question: t('house-heating.faq.q4'), answer: t('house-heating.faq.a4') },
          { question: t('house-heating.faq.q5'), answer: t('house-heating.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'Отын жылу шығару — анықтама' : 'Теплота сгорания топлива — справочник', url: 'https://thermalinfo.ru/eto-interesno/udelnaya-teplota-sgoraniya-topliva-i-goryuchih-materialov' },
          { title: i18n.language === 'kk' ? 'Тұрғындарға тарифтер (газ/электр)' : 'Тарифы для населения (газ/электро)', url: 'https://www.esalmaty.kz/ru/home-tariffs' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="house-heating" calculatorTitle={t('house-heating.heading')} />
      <LastUpdated calculatorId="house-heating" />
    </div>
  );
}
