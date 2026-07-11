import { useState, useEffect } from 'react';
import { Wine, Calculator, Info, AlertTriangle, Plus, Trash2 } from 'lucide-react';
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
 * Алкоголь в крови (формула Видмарка) — ОЦЕНКА, не измерение.
 * В РК действует нулевая терпимость: числового допустимого порога в НПА нет
 * (порог 0,3‰ — лишь проект приказа МЗ, на 07.2026 не принят).
 * Константы: r муж 0.68 / жен 0.55; выведение β ≈ 0.15‰/ч (0.10–0.20);
 * плотность этанола 0.789 г/мл. Санкции — ст. 608 КоАП: 15 суток + 7 лет
 * лишения прав (повторно: 25 суток + 9 лет).
 */
const R = { male: 0.68, female: 0.55 };
const BETA = 0.15; // ‰/час, средняя скорость выведения
const ETHANOL_DENSITY = 0.789; // г/мл

interface Drink { volume: string; abv: string }
const PRESETS: { labelKey: string; volume: number; abv: number }[] = [
  { labelKey: 'alcohol-blood.presetBeer', volume: 500, abv: 5 },
  { labelKey: 'alcohol-blood.presetWine', volume: 150, abv: 12 },
  { labelKey: 'alcohol-blood.presetVodka', volume: 50, abv: 40 },
];

export default function AlcoholBloodCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState<string>('80');
  const [hours, setHours] = useState<string>('0');
  const [drinks, setDrinks] = useState<Drink[]>([{ volume: '500', abv: '5' }]);

  const [results, setResults] = useState({ grams: 0, peak: 0, now: 0, hoursToZero: 0, zeroTime: '' });

  useEffect(() => {
    const w = parseFloat(weight) || 0;
    const h = Math.max(0, parseFloat(hours) || 0);
    const grams = drinks.reduce((sum, d) => {
      const v = parseFloat(d.volume) || 0;
      const a = parseFloat(d.abv) || 0;
      return sum + v * (a / 100) * ETHANOL_DENSITY;
    }, 0);
    if (w <= 0 || grams <= 0) {
      setResults({ grams: 0, peak: 0, now: 0, hoursToZero: 0, zeroTime: '' });
      return;
    }
    // Видмарк: C₀ (‰) = A / (r × m), далее минус β за каждый час
    const peak = grams / (R[sex] * w);
    const now = Math.max(0, peak - BETA * h);
    const hoursToZero = now / BETA;
    const zero = new Date(Date.now() + hoursToZero * 3600_000);
    setResults({
      grams: Math.round(grams),
      peak: Math.round(peak * 100) / 100,
      now: Math.round(now * 100) / 100,
      hoursToZero: Math.ceil(hoursToZero * 10) / 10,
      zeroTime: hoursToZero > 0 ? zero.toLocaleTimeString('ru-KZ', { hour: '2-digit', minute: '2-digit' }) : '',
    });
  }, [sex, weight, hours, drinks]);

  const upd = (i: number, k: keyof Drink, v: string) =>
    setDrinks((ds) => ds.map((d, idx) => (idx === i ? { ...d, [k]: v } : d)));
  const addPreset = (p: (typeof PRESETS)[0]) => setDrinks((ds) => [...ds, { volume: String(p.volume), abv: String(p.abv) }]);
  const del = (i: number) => setDrinks((ds) => ds.filter((_, idx) => idx !== i));

  const generateExportData = () => {
    if (!results.grams) return '';
    return `${t('alcohol-blood.parameters')}:
- ${t('alcohol-blood.weightLabel')}: ${weight} ${t('alcohol-blood.kg')}
- ${t('alcohol-blood.alcoholGrams')}: ${results.grams} ${t('alcohol-blood.g')}

${t('alcohol-blood.results')}:
- ${t('alcohol-blood.peakLabel')}: ${results.peak} ‰
- ${t('alcohol-blood.nowLabel')}: ${results.now} ‰
- ${t('alcohol-blood.zeroLabel')}: ~${results.hoursToZero} ${t('alcohol-blood.hoursShort')}

${t('alcohol-blood.zeroToleranceNote')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
            <Wine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('alcohol-blood.heading')}</h1>
            <p className="text-gray-600">{t('alcohol-blood.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="alcohol-blood" />

      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm font-medium">{t('alcohol-blood.zeroToleranceNote')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('alcohol-blood.parameters')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    sex === s ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(`alcohol-blood.sex_${s}`)}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('alcohol-blood.weightLabel')}</label>
              <RangeSlider
                value={parseFloat(weight) || 0}
                onChange={(v) => setWeight(String(v))}
                min={40} max={150} step={1}
                formatValue={(v) => `${v} ${t('alcohol-blood.kg')}`}
                color="#a855f7"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('alcohol-blood.drinksLabel')}</label>
              <div className="space-y-3">
                {drinks.map((d, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-lg border border-gray-200 p-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">{t('alcohol-blood.volumeMl')}</label>
                      <input type="number" value={d.volume} onChange={(e) => upd(i, 'volume', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">{t('alcohol-blood.abvPercent')}</label>
                      <input type="number" value={d.abv} onChange={(e) => upd(i, 'abv', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    </div>
                    {drinks.length > 1 && (
                      <button onClick={() => del(i)} aria-label={t('alcohol-blood.remove')} className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button key={p.labelKey} onClick={() => addPreset(p)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                    <Plus className="h-3 w-3" /> {t(p.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('alcohol-blood.hoursLabel')}</label>
              <RangeSlider
                value={parseFloat(hours) || 0}
                onChange={(v) => setHours(String(v))}
                min={0} max={24} step={0.5}
                formatValue={(v) => `${v} ${t('alcohol-blood.hoursShort')}`}
                color="#a855f7"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('alcohol-blood.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('alcohol-blood.nowLabel')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700">≈ {results.now} ‰</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('alcohol-blood.alcoholGrams')}</span>
              <span className="font-semibold text-gray-900">{results.grams} {t('alcohol-blood.g')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('alcohol-blood.peakLabel')}</span>
              <span className="font-semibold text-gray-900">≈ {results.peak} ‰</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('alcohol-blood.zeroLabel')}</span>
              <span className="font-semibold text-gray-900">
                {results.hoursToZero > 0 ? `~${results.hoursToZero} ${t('alcohol-blood.hoursShort')}${results.zeroTime ? ` (${t('alcohol-blood.around')} ${results.zeroTime})` : ''}` : '—'}
              </span>
            </div>
            <div className="mt-2 rounded-lg bg-amber-50 p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm">{t('alcohol-blood.sanctionsNote')}</p>
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('alcohol-blood.estimateNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.grams > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('alcohol-blood.exportTitle')}
            description={t('alcohol-blood.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {results.grams > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('alcohol-blood.export.title'),
              subtitle: `≈ ${results.now} ‰`,
              sections: [{
                title: t('alcohol-blood.export.results'),
                data: [
                  { label: t('alcohol-blood.alcoholGrams'), value: `${results.grams} ${t('alcohol-blood.g')}` },
                  { label: t('alcohol-blood.peakLabel'), value: `≈ ${results.peak} ‰` },
                  { label: t('alcohol-blood.nowLabel'), value: `≈ ${results.now} ‰` },
                  { label: t('alcohol-blood.zeroLabel'), value: results.hoursToZero > 0 ? `~${results.hoursToZero} ${t('alcohol-blood.hoursShort')}` : '—' },
                ],
              }],
              footer: t('alcohol-blood.export.footer'),
            }}
            filename="alcohol-blood"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="alcohol-blood" />
      <MethodologySection calculatorId="alcohol-blood" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`alcohol-blood.faq.q${n}`), answer: t(`alcohol-blood.faq.a${n}`) }))}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР ӘҚБК 608-бабы (мас күйде көлік жүргізу)' : 'Ст. 608 КоАП РК (управление в опьянении)', url: 'https://adilet.zan.kz/rus/docs/K1400000235' },
          { title: i18n.language === 'kk' ? 'Widmark формуласы (NIH зерттеуі)' : 'Формула Видмарка (исследование NIH)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4361698/' },
        ]}
      />
      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget calculatorId="alcohol-blood" calculatorTitle={t('alcohol-blood.heading')} />
      <LastUpdated calculatorId="alcohol-blood" />
    </div>
  );
}
