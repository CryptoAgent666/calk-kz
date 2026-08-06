import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wheat, Info, AlertTriangle, Sprout, Tractor, Scale } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { ComparisonBarChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

/* ------------------------------------------------------------------------- *
 * БАЗОВЫЕ СТАВКИ ЗЕМЕЛЬНОГО НАЛОГА НА ЗЕМЛИ СЕЛЬХОЗНАЗНАЧЕНИЯ
 *
 * Источник: Налоговый кодекс РК (Кодекс РК от 18.07.2025 № 214-VIII ЗРК),
 * статья 576 «Базовые налоговые ставки на земли сельскохозяйственного
 * назначения». https://adilet.zan.kz/rus/docs/K2500000214
 *
 * Ставки заданы кодексом НАПРЯМУЮ в тенге за 1 гектар и дифференцируются
 * ТОЛЬКО по двум признакам: почвенно-климатическая зона и балл бонитета
 * (ст. 576 п. 1). Никаких коэффициентов качества почвы, типов угодий,
 * форм хозяйствования или региональных надбавок статья не предусматривает.
 *
 * Корректировка ±50 % (ст. 582 п. 1) применяется к ставкам ст. 577 и 578
 * и на ст. 576 НЕ распространяется.
 *
 * Индекс массива = балл бонитета − 1 (т.е. RATES[0] — это балл 1).
 * ------------------------------------------------------------------------- */

/** Ст. 576 п. 2 — земли степной и сухостепной зон. Баллы 1–100. */
const RATES_STEPPE: number[] = [
  2.4, 3.35, 4.35, 5.3, 6.25, 7.25, 8.4, 9.65, 10.8, 12.05,          // балл 1–10
  14.45, 15.45, 16.4, 17.35, 18.35, 19.3, 20.45, 21.7, 22.85, 24.1,  // балл 11–20
  26.55, 28.95, 31.35, 33.75, 36.2, 38.6, 41, 43.4, 45.85, 48.25,    // балл 21–30
  72.35, 77.7, 82.95, 90.4, 93.8, 99.1, 104.4, 110, 115.3, 120.6,    // балл 31–40
  144.75, 150.05, 155.35, 160.85, 166.15, 171.45, 176.8, 182.4, 187.7, 193,      // балл 41–50
  217.1, 222.45, 227.75, 233.25, 238.55, 243.85, 249.15, 254.75, 260.05, 265.35, // балл 51–60
  289.5, 303.15, 316.3, 329.75, 343.05, 356.55, 369.8, 383.3, 396.6, 410.1,      // балл 61–70
  434.25, 447.75, 460.95, 474.45, 487.8, 501.3, 514.55, 528.05, 541.35, 554.85,  // балл 71–80
  579, 595.1, 611.05, 627.25, 643.35, 659.3, 675.5, 691.6, 707.55, 723.75,       // балл 81–90
  747.85, 772, 796.1, 820.25, 844.35, 868.5, 892.6, 916.75, 940.85, 965          // балл 91–100
];
/** Ст. 576 п. 2, строка «свыше 100». */
const RATE_STEPPE_OVER_100 = 1013.3;

/** Ст. 576 п. 3 — земли полупустынной, пустынной и предгорно-пустынной зон. Баллы 1–100. */
const RATES_DESERT: number[] = [
  2.4, 2.7, 2.9, 3.1, 3.35, 3.65, 3.85, 4.05, 4.35, 4.8,             // балл 1–10
  7.25, 9.15, 11.1, 12.75, 14.65, 16.6, 18.55, 20.25, 22.2, 24.1,    // балл 11–20
  26.55, 28.95, 31.35, 33.75, 36.2, 38.6, 41, 43.4, 45.85, 48.25,    // балл 21–30
  50.65, 53.05, 55.45, 57.9, 60.3, 62.7, 65.15, 67.55, 69.95, 72.35, // балл 31–40
  74.8, 77.2, 79.6, 82, 84.45, 86.85, 89.25, 91.65, 94.1, 96.5,      // балл 41–50
  98.9, 101.3, 103.75, 106.15, 108.55, 110.95, 113.4, 115.8, 118.2, 120.6,       // балл 51–60
  123.05, 126.4, 129.1, 132.2, 135.1, 138.2, 141.1, 144.25, 147.45, 150.35,      // балл 61–70
  153.45, 156.35, 159.4, 162.3, 165.45, 168.4, 171.55, 174.65, 177.55, 180.75,   // балл 71–80
  183.55, 186.7, 189.6, 192.8, 195.9, 198.8, 201.9, 204.75, 207.95, 210.85,      // балл 81–90
  // балл 91 в официальном тексте ст. 576 п. 3 — 210,9 (и в рус., и в каз. редакции
  // на adilet.zan.kz). Прирост к баллу 90 всего 0,05 ₸ против ~3 ₸ у соседних строк,
  // но ставка воспроизведена ровно так, как она опубликована в кодексе.
  210.9, 216.95, 220, 223.1, 226, 229.2, 231.9, 235.15, 238.05, 241.25           // балл 91–100
];
/** Ст. 576 п. 3, строка «свыше 100». */
const RATE_DESERT_OVER_100 = 250.9;

type SoilZone = 'steppe' | 'desert';

/**
 * Ставка земельного налога за 1 га по ст. 576 НК РК.
 * @param zone почвенно-климатическая зона (п. 2 — степная/сухостепная, п. 3 — пустынная)
 * @param bonityScore балл бонитета; значения свыше 100 берут отдельную строку таблицы
 */
function getRatePerHectare(zone: SoilZone, bonityScore: number): number {
  const table = zone === 'steppe' ? RATES_STEPPE : RATES_DESERT;
  const over100 = zone === 'steppe' ? RATE_STEPPE_OVER_100 : RATE_DESERT_OVER_100;
  if (!Number.isFinite(bonityScore) || bonityScore < 1) return 0;
  if (bonityScore > 100) return over100;
  return table[Math.floor(bonityScore) - 1];
}

/** Баллы, показываемые в справочной выдержке из таблиц ст. 576. */
const TABLE_PREVIEW_SCORES = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** Предельные площади для СНР КФХ, ст. 728 п. 2 НК РК (га по территориальным зонам 1–4). */
const SNR_AREA_LIMITS = [5000, 3500, 1500, 500];

export default function FarmLandTaxCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [landArea, setLandArea] = useState<string>('100');
  const [bonityScore, setBonityScore] = useState<string>('40');
  const [zone, setZone] = useState<SoilZone>('steppe');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — гидратация падает (#418/#425).
  const results = useMemo(() => {
    const area = parseFloat(landArea) || 0;
    const score = parseFloat(bonityScore) || 0;

    const ratePerHectare = getRatePerHectare(zone, score);
    const rateSteppe = getRatePerHectare('steppe', score);
    const rateDesert = getRatePerHectare('desert', score);

    return {
      area,
      score,
      isOver100: score > 100,
      ratePerHectare,
      rateSteppe,
      rateDesert,
      totalTax: area > 0 ? ratePerHectare * area : 0
    };
  }, [landArea, bonityScore, zone]);

  const formatTenge = (num: number) =>
    num.toLocaleString('ru-KZ', { maximumFractionDigits: 2 }) + ' ₸';

  const zoneName = t(`farm-land-tax.zones.${zone}.name`);
  const scoreLabel = results.isOver100
    ? t('farm-land-tax.ratesTable.over100')
    : String(Math.floor(results.score) || '—');

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="farm-land-tax" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-lime-500 rounded-lg flex items-center justify-center">
            <Wheat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('farm-land-tax.title')}</h1>
            <p className="text-gray-600">{t('farm-land-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Important Info */}
      <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {t('farm-land-tax.infoBox.title')}
            </h3>
            <div className="text-green-800 space-y-2">
              <p>{t('farm-land-tax.infoBox.description1')}</p>
              <p>{t('farm-land-tax.infoBox.description2')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.inputs.title')}</h2>

          <div className="space-y-6">
            {/* Land Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('farm-land-tax.inputs.landArea')}
              </label>
              <RangeSlider
                value={parseFloat(landArea) || 0}
                onChange={(val) => setLandArea(String(val))}
                min={1}
                max={1000}
                step={1}
                formatValue={(v) => `${v} ${t('farm-land-tax.inputs.hectare')}`}
                color="#22c55e"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="landArea"
                  value={landArea}
                  onChange={(e) => setLandArea(e.target.value)}
                  placeholder={t('farm-land-tax.inputs.landAreaPlaceholder')}
                  step="0.1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('farm-land-tax.inputs.hectare')}</span>
                </div>
              </div>
            </div>

            {/* Bonity Score */}
            <div>
              <label htmlFor="bonityScore" className="block text-sm font-medium text-gray-700 mb-2">
                {t('farm-land-tax.inputs.bonityScore')}
              </label>
              <input
                type="number"
                id="bonityScore"
                value={bonityScore}
                onChange={(e) => setBonityScore(e.target.value)}
                placeholder={t('farm-land-tax.inputs.bonityScorePlaceholder')}
                min="1"
                max="120"
                step="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('farm-land-tax.inputs.bonityScoreHelp')}
              </p>
            </div>

            {/* Soil-climatic zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('farm-land-tax.inputs.zone')}
              </label>
              <div className="grid grid-cols-1 gap-3">
                {(['steppe', 'desert'] as SoilZone[]).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(z)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      zone === z
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">{t(`farm-land-tax.zones.${z}.name`)}</div>
                    <div className="text-xs text-gray-600">{t(`farm-land-tax.zones.${z}.description`)}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('farm-land-tax.inputs.zoneHelp')}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{t('farm-land-tax.inputs.noCoefficientsNote')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('farm-land-tax.results.title')}</h2>

          <div className="space-y-6">
            {/* Summary Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">{t('farm-land-tax.results.summaryTitle')}</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  {t('farm-land-tax.results.area')}: <strong>{results.area.toLocaleString('ru-KZ')} {t('farm-land-tax.inputs.hectare')}</strong>
                </div>
                <div>
                  {t('farm-land-tax.results.bonityScore')}: <strong>{scoreLabel}</strong>
                </div>
                <div>
                  {t('farm-land-tax.results.zone')}: <strong>{zoneName}</strong>
                </div>
              </div>
            </div>

            {/* Tax Calculation */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3">
                <span className="font-semibold text-blue-900">{t('farm-land-tax.results.ratePerHectare')}</span>
                <span className="text-lg font-bold text-blue-700">{formatTenge(results.ratePerHectare)}</span>
              </div>
              <p className="text-xs text-gray-500">{t('farm-land-tax.results.rateSource')}</p>
            </div>

            {/* Total Tax */}
            <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('farm-land-tax.results.totalTax')}</span>
                <div className="flex items-center space-x-2">
                  <Wheat className="w-6 h-6 text-green-600" />
                  <span className="text-2xl font-bold text-green-700">{formatTenge(results.totalTax)}</span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {formatTenge(results.ratePerHectare)} × {results.area.toLocaleString('ru-KZ')} {t('farm-land-tax.inputs.hectare')}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Scale className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">{t('farm-land-tax.results.formulaTitle')}</h3>
                  <p className="text-blue-800 text-sm">{t('farm-land-tax.results.formulaDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special tax regime for peasant/farm households */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Tractor className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('farm-land-tax.snr.title')}</h2>
            <p className="text-gray-700 text-sm">{t('farm-land-tax.snr.description')}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2 text-sm">{t('farm-land-tax.snr.notPayerTitle')}</h3>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>{t('farm-land-tax.snr.notPayer')}</li>
              <li>{t('farm-land-tax.snr.ipn')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">{t('farm-land-tax.snr.limitsTitle')}</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {SNR_AREA_LIMITS.map((limit, idx) => (
                <li key={limit}>
                  {t('farm-land-tax.snr.limitZone', { zone: idx + 1 })}: <strong>{limit.toLocaleString('ru-KZ')} {t('farm-land-tax.inputs.hectare')}</strong>
                </li>
              ))}
            </ul>
            <p className="text-xs text-blue-700 mt-2">{t('farm-land-tax.snr.limitsNote')}</p>
          </div>
        </div>
      </div>

      {/* Rates excerpt from Art. 576 */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('farm-land-tax.ratesTable.title')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('farm-land-tax.ratesTable.subtitle')}</p>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[380px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.scoreColumn')}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.steppeColumn')}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">{t('farm-land-tax.ratesTable.desertColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_PREVIEW_SCORES.map((score) => (
                <tr
                  key={score}
                  className={`border-b border-gray-100 ${
                    !results.isOver100 && Math.floor(results.score) === score ? 'bg-green-50 font-medium' : ''
                  }`}
                >
                  <td className="py-2 px-4 text-gray-900">{score}</td>
                  <td className="py-2 px-4 text-right text-sm text-gray-700">{getRatePerHectare('steppe', score).toLocaleString('ru-KZ')}</td>
                  <td className="py-2 px-4 text-right text-sm text-gray-700">{getRatePerHectare('desert', score).toLocaleString('ru-KZ')}</td>
                </tr>
              ))}
              <tr className={`border-b border-gray-100 ${results.isOver100 ? 'bg-green-50 font-medium' : ''}`}>
                <td className="py-2 px-4 text-gray-900">{t('farm-land-tax.ratesTable.over100')}</td>
                <td className="py-2 px-4 text-right text-sm text-gray-700">{RATE_STEPPE_OVER_100.toLocaleString('ru-KZ')}</td>
                <td className="py-2 px-4 text-right text-sm text-gray-700">{RATE_DESERT_OVER_100.toLocaleString('ru-KZ')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{t('farm-land-tax.ratesTable.note')}</p>
        </div>
      </div>

      {/* Legal Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('farm-land-tax.legal.title')}</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.legal.taxpayersTitle')}</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('farm-land-tax.legal.taxpayers.item1')}</li>
                  <li>{t('farm-land-tax.legal.taxpayers.item2')}</li>
                  <li>{t('farm-land-tax.legal.taxpayers.item3')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('farm-land-tax.legal.exemptTitle')}</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('farm-land-tax.legal.exempt.item1')}</li>
                  <li>{t('farm-land-tax.legal.exempt.item2')}</li>
                  <li>{t('farm-land-tax.legal.exempt.item3')}</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-2">
                <Sprout className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{t('farm-land-tax.legal.deadlineTitle')}</h3>
                  <p className="text-gray-700 text-sm">{t('farm-land-tax.legal.deadline')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone comparison chart */}
      {results.ratePerHectare > 0 && results.area > 0 && (
        <div className="mt-8">
          <ComparisonBarChart
            data={[
              {
                name: `${t('farm-land-tax.results.bonityScore')} ${scoreLabel}`,
                steppe: Math.round(results.rateSteppe * results.area),
                desert: Math.round(results.rateDesert * results.area)
              }
            ]}
            dataKeys={[
              { key: 'steppe', name: t('farm-land-tax.zones.steppe.name'), color: '#22c55e' },
              { key: 'desert', name: t('farm-land-tax.zones.desert.name'), color: '#f59e0b' }
            ]}
            title={t('farm-land-tax.chart.title')}
            formatValue={(v) => formatTenge(v)}
          />
        </div>
      )}

      <CalculatorExamples calculatorId="farm-land-tax" />
      <MethodologySection calculatorId="farm-land-tax" />

      {/* Экспорт результатов */}
      {results.totalTax > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('farm-land-tax.export.title'),
              subtitle: `${t('farm-land-tax.export.zone')}: ${zoneName}`,
              sections: [
                {
                  title: t('farm-land-tax.export.parameters'),
                  data: [
                    { label: t('farm-land-tax.export.area'), value: `${results.area.toLocaleString('ru-KZ')} ${t('farm-land-tax.inputs.hectare')}` },
                    { label: t('farm-land-tax.export.bonityScore'), value: scoreLabel },
                    { label: t('farm-land-tax.export.zone'), value: zoneName }
                  ]
                },
                {
                  title: t('farm-land-tax.export.results'),
                  data: [
                    { label: t('farm-land-tax.export.ratePerHectare'), value: formatTenge(results.ratePerHectare) },
                    { label: t('farm-land-tax.export.totalTax'), value: formatTenge(results.totalTax) }
                  ]
                }
              ],
              footer: t('farm-land-tax.export.footer')
            }}
            filename="farm-land-tax-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('farm-land-tax.faq.q1'), answer: t('farm-land-tax.faq.a1') },
          { question: t('farm-land-tax.faq.q2'), answer: t('farm-land-tax.faq.a2') },
          { question: t('farm-land-tax.faq.q3'), answer: t('farm-land-tax.faq.a3') },
          { question: t('farm-land-tax.faq.q4'), answer: t('farm-land-tax.faq.a4') },
          { question: t('farm-land-tax.faq.q5'), answer: t('farm-land-tax.faq.a5') }
        ]}
        sources={[
          {
            title: i18n.language === 'kk' ? 'ҚР Салық кодексі, 576-бап' : 'НК РК, ст. 576 — базовые ставки на земли сельхозназначения',
            url: 'https://adilet.zan.kz/rus/docs/K2500000214'
          },
          {
            title: i18n.language === 'kk' ? 'ҚР Жер кодексі' : 'Земельный кодекс РК',
            url: 'https://adilet.zan.kz/rus/docs/K030000442_'
          }
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="farm-land-tax"
        calculatorTitle={t('farm-land-tax.title')}
      />
      <LastUpdated calculatorId="farm-land-tax" />
    </div>
  );
}
