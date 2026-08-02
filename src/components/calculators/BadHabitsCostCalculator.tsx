import { useState, useMemo } from 'react';
import { Cigarette, Calculator, Info, TrendingUp } from 'lucide-react';
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
 * Стоимость курения и алкоголя в год. Дефолтные цены 07.2026 — фактические
 * средние, не МРЦ (МРЦ пачки 970 ₸ — нижняя граница; водка МРЦ 1 050 ₸/0,5
 * при фактических ~2 550 ₸): пачка ~1 100 ₸, пиво 0,5 ~520 ₸, вино 0,75
 * ~3 000 ₸. Альтернатива — FV ежемесячных взносов на депозит.
 */
const DEFAULTS = { pack: 1100, beer: 520, vodka: 2550, wine: 3000 };
const DEPOSIT_RATE = 14; // % годовых, редактируется

export default function BadHabitsCostCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [packsPerDay, setPacksPerDay] = useState<string>('1');
  const [packPrice, setPackPrice] = useState<string>(String(DEFAULTS.pack));
  const [beerPerWeek, setBeerPerWeek] = useState<string>('3');
  const [vodkaPerWeek, setVodkaPerWeek] = useState<string>('0');
  const [winePerWeek, setWinePerWeek] = useState<string>('0');
  const [rate, setRate] = useState<string>(String(DEPOSIT_RATE));

  const computeResults = () => {
    const smokeYear = (parseFloat(packsPerDay) || 0) * (parseFloat(packPrice) || 0) * 365;
    const alcoWeek =
      (parseFloat(beerPerWeek) || 0) * DEFAULTS.beer +
      (parseFloat(vodkaPerWeek) || 0) * DEFAULTS.vodka +
      (parseFloat(winePerWeek) || 0) * DEFAULTS.wine;
    const alcoYear = alcoWeek * 52;
    const year = smokeYear + alcoYear;
    const month = year / 12;
    // FV аннуитета: ежемесячный взнос под rate% годовых
    const i = (parseFloat(rate) || 0) / 100 / 12;
    const fv = (months: number) => (i > 0 ? month * ((Math.pow(1 + i, months) - 1) / i) : month * months);
    return {
      smokeYear: Math.round(smokeYear),
      alcoYear: Math.round(alcoYear),
      year: Math.round(year),
      month: Math.round(month),
      five: Math.round(year * 5),
      ten: Math.round(year * 10),
      fvFive: Math.round(fv(60)),
      fvTen: Math.round(fv(120)),
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [packsPerDay, packPrice, beerPerWeek, vodkaPerWeek, winePerWeek, rate]
  );

  const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (results.year <= 0) return '';
    return `${t('bad-habits-cost.parameters')}:
- ${t('bad-habits-cost.packsLabel')}: ${packsPerDay} × ${fmt(parseFloat(packPrice) || 0)}
- ${t('bad-habits-cost.beerLabel')}: ${beerPerWeek}/${t('bad-habits-cost.week')}
- ${t('bad-habits-cost.vodkaLabel')}: ${vodkaPerWeek}/${t('bad-habits-cost.week')}
- ${t('bad-habits-cost.wineLabel')}: ${winePerWeek}/${t('bad-habits-cost.week')}

${t('bad-habits-cost.results')}:
- ${t('bad-habits-cost.perYear')}: ${fmt(results.year)}
- ${t('bad-habits-cost.perTen')}: ${fmt(results.ten)}
- ${t('bad-habits-cost.fvTenLabel', { rate })}: ${fmt(results.fvTen)}`;
  };

  const numInput = (labelKey: string, value: string, setter: (v: string) => void, max: number, step: number, unitKey?: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{t(labelKey)}</label>
      <RangeSlider
        value={parseFloat(value) || 0}
        onChange={(v) => setter(String(v))}
        min={0} max={max} step={step}
        formatValue={(v) => `${v}${unitKey ? ' ' + t(unitKey) : ''}`}
        color="#f97316"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Cigarette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('bad-habits-cost.heading')}</h1>
            <p className="text-gray-600">{t('bad-habits-cost.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="bad-habits-cost" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('bad-habits-cost.parameters')}</h2>
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">{t('bad-habits-cost.smokingSection')}</h3>
              {numInput('bad-habits-cost.packsLabel', packsPerDay, setPacksPerDay, 3, 0.5)}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('bad-habits-cost.packPriceLabel')}</label>
                <input
                  type="number" value={packPrice} onChange={(e) => setPackPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">{t('bad-habits-cost.packPriceHint')}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">{t('bad-habits-cost.alcoSection')}</h3>
              {numInput('bad-habits-cost.beerLabel', beerPerWeek, setBeerPerWeek, 20, 1, 'bad-habits-cost.perWeekShort')}
              {numInput('bad-habits-cost.vodkaLabel', vodkaPerWeek, setVodkaPerWeek, 7, 0.5, 'bad-habits-cost.perWeekShort')}
              {numInput('bad-habits-cost.wineLabel', winePerWeek, setWinePerWeek, 7, 0.5, 'bad-habits-cost.perWeekShort')}
              <p className="text-xs text-gray-500">{t('bad-habits-cost.pricesHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('bad-habits-cost.rateLabel')}</label>
              <RangeSlider
                value={parseFloat(rate) || 0}
                onChange={(v) => setRate(String(v))}
                min={0} max={20} step={0.5}
                formatValue={(v) => `${v}%`}
                color="#f97316"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('bad-habits-cost.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('bad-habits-cost.perYear')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-700">{fmt(results.year)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('bad-habits-cost.smokingSection')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.smokeYear)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('bad-habits-cost.alcoSection')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.alcoYear)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('bad-habits-cost.perMonth')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.month)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('bad-habits-cost.perFive')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.five)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('bad-habits-cost.perTen')}</span>
              <span className="font-semibold text-red-600">{fmt(results.ten)}</span>
            </div>

            <div className="mt-4 rounded-lg bg-emerald-50 p-4">
              <div className="flex items-start space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-800 text-sm font-medium">{t('bad-habits-cost.investTitle', { rate })}</p>
              </div>
              <div className="flex justify-between items-center py-1.5 text-sm">
                <span className="text-emerald-700">{t('bad-habits-cost.fvFiveLabel')}</span>
                <span className="font-bold text-emerald-800">{fmt(results.fvFive)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-sm">
                <span className="text-emerald-700">{t('bad-habits-cost.fvTenShort')}</span>
                <span className="font-bold text-emerald-800">{fmt(results.fvTen)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('bad-habits-cost.estimateNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.year > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('bad-habits-cost.exportTitle')}
            description={t('bad-habits-cost.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {results.year > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('bad-habits-cost.export.title'),
              subtitle: `${t('bad-habits-cost.perYear')}: ${fmt(results.year)}`,
              sections: [{
                title: t('bad-habits-cost.export.results'),
                data: [
                  { label: t('bad-habits-cost.smokingSection'), value: fmt(results.smokeYear) },
                  { label: t('bad-habits-cost.alcoSection'), value: fmt(results.alcoYear) },
                  { label: t('bad-habits-cost.perYear'), value: fmt(results.year) },
                  { label: t('bad-habits-cost.perTen'), value: fmt(results.ten) },
                  { label: t('bad-habits-cost.fvTenLabel', { rate }), value: fmt(results.fvTen) },
                ],
              }],
              footer: t('bad-habits-cost.export.footer'),
            }}
            filename="bad-habits-cost"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="bad-habits-cost" />
      <MethodologySection calculatorId="bad-habits-cost" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`bad-habits-cost.faq.q${n}`), answer: t(`bad-habits-cost.faq.a${n}`) }))}
        sources={[
          { title: i18n.language === 'kk' ? 'Темекіге ең төмен бөлшек баға (adilet)' : 'МРЦ на сигареты (adilet)', url: 'https://www.adilet.zan.kz/rus/docs/V2200026923' },
          { title: i18n.language === 'kk' ? 'Арақтың ең төмен бағасы (adilet)' : 'МРЦ на водку (adilet)', url: 'https://adilet.zan.kz/rus/docs/V2300033035' },
        ]}
      />
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="bad-habits-cost" calculatorTitle={t('bad-habits-cost.heading')} />
      <LastUpdated calculatorId="bad-habits-cost" />
    </div>
  );
}
