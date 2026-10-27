import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Thermometer, TrendingDown } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';
import { pluralize } from '../../utils/pluralize';
import { NUMBER_LOCALE, formatFixed } from '../../utils/localeFormat';

type Insulation = 'mineralWool' | 'foam' | 'xps' | 'pir' | 'ecowool';

interface InsulationSpec {
  lambda: number; // Вт/(м·К) — теплопроводность
  pricePerM3: number; // ₸/м³
}

// Цены ₸/м³ — розница Алматы, 10.2026: пенопласт ~21 000 (Демеу 20 900), XPS ~35 000
// (Техноплекс ~42 000, Carbon Prof ~41 000, акции дешевле), эковата ~15 000 (мешок 13 кг ≈ 3 500 ₸).
const INSULATIONS: Record<Insulation, InsulationSpec> = {
  mineralWool: { lambda: 0.042, pricePerM3: 35000 },
  foam:        { lambda: 0.039, pricePerM3: 21000 },
  xps:         { lambda: 0.032, pricePerM3: 35000 },
  pir:         { lambda: 0.023, pricePerM3: 90000 },
  ecowool:     { lambda: 0.040, pricePerM3: 15000 },
};

// Требуемое сопротивление теплопередаче стен жилого дома R (м²·К/Вт).
// СН РК 2.04-07-2022, табл. 4: R = 0,00035·ГСОП + 1,4 (4,7 в той же таблице — покрытия при ГСОП 5000).
// ГСОП = (t_в − t_от)·z_от (СП РК 2.04-107-2022, п. 6.1.2); t_от, z_от — период ≤ 8 °C
// по СП РК 2.04-01-2017* (табл. 3.1*, изм. 13.05.2025); t_в = 21 °C, где пятидневка ≤ −31 °C
// (ГОСТ 30494), иначе 20 °C. Значение зоны — по самому холодному городу зоны, округлено до 0,1.
const REGION_R: Record<string, number> = {
  north: 3.5,    // Степногорск 3,50 · Павлодар 3,49 · Кокшетау 3,42 · Астана 3,40 · Усть-Каменогорск 3,39 · Семей 3,35
  south: 2.7,    // Талдыкорган 2,69 · Кызылорда 2,60 · Алматы 2,53 · Тараз 2,42 · Шымкент 2,25
  central: 3.2,  // Актобе 3,22 · Караганда 3,20 · Уральск 3,06
  west: 2.7,     // Атырау 2,69 · Актау 2,32
};
// ГСОП зоны — обратно из той же формулы R = 0,00035·ГСОП + 1,4. Теплопотери за отопительный
// период = площадь × ГСОП × 24 / R: раньше ΔT × 4 380 ч было одинаковым для всех регионов,
// и юг «окупался» быстрее севера.
const regionDegreeDays = (r: number) => (r - 1.4) / 0.00035;

// Газ с 01.10.2026 — 54,81–62,75 ₸/м³ (≈6–7 ₸ за кВт·ч тепла), электричество 26–46 ₸/кВт·ч —
// берём 8 ₸ как смесь.
const HEAT_COST_PER_KWH = 8;

export default function InsulationCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [insulation, setInsulation] = useState<Insulation>('mineralWool');
  const [region, setRegion] = useState<keyof typeof REGION_R>('north');
  const [area, setArea] = useState<string>('100');
  const [currentR, setCurrentR] = useState<string>('1.5'); // текущее R (без утепления)

  const results = useMemo(() => {
    const a = parseFloat(area) || 0;
    const r = parseFloat(currentR) || 0;

    if (a <= 0 || r <= 0) return null;

    const requiredR = REGION_R[region];
    const spec = INSULATIONS[insulation];

    // Необходимая толщина утеплителя для достижения R
    // R доп = R треб - R текущий, толщина = R доп × λ
    const addR = Math.max(0, requiredR - r);
    const thicknessM = addR * spec.lambda;
    const thicknessCm = thicknessM * 100;
    // Округляем вверх до 5 см (стандартные толщины); 1e-9 — от ошибки плавающей точки (5,04 → 10)
    const standardThicknessCm = addR > 0 ? Math.ceil(thicknessCm / 5 - 1e-9) * 5 : 0;
    const standardThicknessM = standardThicknessCm / 100;

    const volume = a * standardThicknessM; // м³
    const materialCost = volume * spec.pricePerM3;

    // Теплопотери до утепления (кВт·ч/год)
    const degreeHours = regionDegreeDays(requiredR) * 24;
    const heatLossWithout = (a * degreeHours / r) / 1000;
    const costWithout = heatLossWithout * HEAT_COST_PER_KWH;

    // После утепления — для толщины, которую реально покупают
    const newR = r + standardThicknessM / spec.lambda;
    const heatLossWith = (a * degreeHours / newR) / 1000;
    const costWith = heatLossWith * HEAT_COST_PER_KWH;

    const savingsPerYear = costWithout - costWith;
    const payback = savingsPerYear > 0 ? materialCost / savingsPerYear : 0;

    return {
      requiredR,
      addR: formatFixed(addR, 2),
      thicknessCm: standardThicknessCm,
      volume: formatFixed(volume, 2),
      materialCost: Math.round(materialCost),
      heatLossWithout: Math.round(heatLossWithout),
      heatLossWith: Math.round(heatLossWith),
      costWithout: Math.round(costWithout),
      costWith: Math.round(costWith),
      savingsPerYear: Math.round(savingsPerYear),
      payback: Number(payback.toFixed(1)),
      savingsPercent: heatLossWithout > 0 ? ((heatLossWithout - heatLossWith) / heatLossWithout * 100).toFixed(0) : '0',
    };
  }, [insulation, region, area, currentR]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="insulation" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-teal-700 rounded-lg flex items-center justify-center">
          <Thermometer className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('insulation.title')}</h1>
          <p className="text-gray-600">{t('insulation.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('insulation.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('insulation.material')}</label>
            <div className="space-y-2">
              {(Object.keys(INSULATIONS) as Insulation[]).map(m => (
                <button key={m} onClick={() => setInsulation(m)}
                  className={`w-full p-3 rounded-lg border text-left ${insulation === m ? 'bg-cyan-50 border-cyan-500' : 'bg-white border-gray-300'}`}>
                  <div className="text-sm font-medium">{t(`insulation.materials.${m}`)}</div>
                  <div className="text-xs text-gray-500">λ = {INSULATIONS[m].lambda.toLocaleString(NUMBER_LOCALE)} Вт/(м·К) • ~{INSULATIONS[m].pricePerM3.toLocaleString(NUMBER_LOCALE)} ₸/м³</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('insulation.region')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(REGION_R) as Array<keyof typeof REGION_R>).map(r => (
                <button key={r} onClick={() => setRegion(r)}
                  className={`p-3 rounded-lg border text-sm ${region === r ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white border-gray-300'}`}>
                  <div className="font-medium">{t(`insulation.regions.${r}`)}</div>
                  <div className="text-xs opacity-75">R={REGION_R[r].toLocaleString(NUMBER_LOCALE)}</div>
                </button>
              ))}
            </div>
          </div>

          <RangeSlider label={t('insulation.area')} value={parseFloat(area) || 0} onChange={v => setArea(String(v))}
            min={10} max={1000} step={5} formatValue={v => `${v} м²`} />
          <RangeSlider label={t('insulation.currentR')} value={parseFloat(currentR) || 0} onChange={v => setCurrentR(String(v))}
            min={0.5} max={5} step={0.1} formatValue={v => `${v}`} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('insulation.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-6 border border-cyan-200">
                <div className="text-sm text-gray-600">{t('insulation.thickness')}</div>
                <div className="text-4xl font-bold text-cyan-700">{results.thicknessCm} см</div>
                <div className="text-xs text-gray-500 mt-1">{t('insulation.volume')}: {results.volume} м³</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-900">{t('insulation.materialCost')}</div>
                <div className="text-2xl font-bold text-amber-700">{results.materialCost.toLocaleString('ru-KZ')} ₸</div>
                <div className="text-xs text-amber-800">{t('insulation.materialCostNote')}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-900 mb-1">{t('insulation.heatLoss')}</div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between">
                  <span>{t('insulation.without')}</span>
                  <span className="font-semibold text-red-700">{results.costWithout.toLocaleString(NUMBER_LOCALE)} {t('insulation.perYear')}</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between">
                  <span>{t('insulation.with')}</span>
                  <span className="font-semibold text-green-700">{results.costWith.toLocaleString(NUMBER_LOCALE)} {t('insulation.perYear')}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-300">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-5 h-5 text-green-700" />
                  <span className="text-sm text-green-900 font-medium">{t('insulation.savings')}</span>
                </div>
                <div className="text-3xl font-bold text-green-700">{results.savingsPerYear.toLocaleString(NUMBER_LOCALE)} {t('insulation.perYear')}</div>
                <div className="text-sm text-green-800">({results.savingsPercent}% {t('insulation.less')})</div>
                <div className="mt-3 pt-3 border-t border-green-300">
                  <div className="text-sm text-green-900">{t('insulation.payback')}:</div>
                  <div className="text-2xl font-bold text-green-700">{formatFixed(results.payback, 1)} {t('insulation.years')}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('insulation.title'),
              subtitle: t(`insulation.materials.${insulation}`),
              sections: [{ title: t('insulation.resultsTitle'), data: [
                { label: t('insulation.thickness'), value: `${results.thicknessCm} см` },
                { label: t('insulation.materialCost'), value: `${results.materialCost.toLocaleString(NUMBER_LOCALE)} ₸` },
                { label: t('insulation.savings'), value: `${results.savingsPerYear.toLocaleString(NUMBER_LOCALE)} ${t('insulation.perYear')}` },
                { label: t('insulation.payback'), value: `${formatFixed(results.payback, 1)} ${pluralize(i18n.language, results.payback, 'год', 'года', 'лет')}` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="insulation"
          />
        </div>
      )}

      <LegalDisclaimer type="construction" />
      <ExpertBlock />
      <FAQSection items={[
        { question: t('insulation.faq.q1'), answer: t('insulation.faq.a1') },
        { question: t('insulation.faq.q2'), answer: t('insulation.faq.a2') },
        { question: t('insulation.faq.q3'), answer: t('insulation.faq.a3') },
        { question: t('insulation.faq.q4'), answer: t('insulation.faq.a4') },
        { question: t('insulation.faq.q5'), answer: t('insulation.faq.a5') },
      ]} 
          sources={getSources('insulation')}
        />
      <EmbedWidget calculatorId="insulation" calculatorTitle={t('insulation.title')} />
      <LastUpdated calculatorId="insulation" />
    </div>
  );
}
