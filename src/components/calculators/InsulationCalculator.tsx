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

type Insulation = 'mineralWool' | 'foam' | 'xps' | 'pir' | 'ecowool';

interface InsulationSpec {
  lambda: number; // Вт/(м·К) — теплопроводность
  pricePerM3: number; // ₸/м³
}

const INSULATIONS: Record<Insulation, InsulationSpec> = {
  mineralWool: { lambda: 0.042, pricePerM3: 35000 },
  foam:        { lambda: 0.039, pricePerM3: 12000 },
  xps:         { lambda: 0.032, pricePerM3: 55000 },
  pir:         { lambda: 0.023, pricePerM3: 90000 },
  ecowool:     { lambda: 0.040, pricePerM3: 28000 },
};

// Требуемое сопротивление теплопередачи R для разных регионов КЗ (м²·К/Вт)
const REGION_R: Record<string, number> = {
  north: 4.7,    // Астана, Петропавловск
  south: 3.0,    // Алматы, Шымкент
  central: 4.0,  // Караганда, Актобе
  west: 3.5,     // Атырау, Актау
};

// Цена газа в КЗ 2026 ~40 ₸/м³, теплотворность 9.3 кВт·ч/м³
// Цена электричества ~27 ₸/кВт·ч
// Стоимость 1 кВт·ч тепла: газ ~4.3 ₸, электро ~27 ₸
const HEAT_COST_PER_KWH = 8; // среднее (газ+электро)
const HEATING_HOURS_PER_YEAR = 4380; // ~6 мес × 24 ч × 0.5 (среднее)

export default function InsulationCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [insulation, setInsulation] = useState<Insulation>('mineralWool');
  const [region, setRegion] = useState<keyof typeof REGION_R>('north');
  const [area, setArea] = useState<string>('100');
  const [currentR, setCurrentR] = useState<string>('1.5'); // текущее R (без утепления)
  const [indoorTemp, setIndoorTemp] = useState<string>('22');
  const [outdoorTemp, setOutdoorTemp] = useState<string>('-10');

  const results = useMemo(() => {
    const a = parseFloat(area) || 0;
    const r = parseFloat(currentR) || 0;
    const ti = parseFloat(indoorTemp) || 0;
    const to = parseFloat(outdoorTemp) || 0;

    if (a <= 0 || r <= 0) return null;

    const requiredR = REGION_R[region];
    const spec = INSULATIONS[insulation];

    // Необходимая толщина утеплителя для достижения R
    // R доп = R треб - R текущий, толщина = R доп × λ
    const addR = Math.max(0, requiredR - r);
    const thicknessM = addR * spec.lambda;
    const thicknessCm = thicknessM * 100;
    // Округляем до ближайших 5 см (стандартные толщины)
    const standardThicknessCm = Math.ceil(thicknessCm / 5) * 5;
    const standardThicknessM = standardThicknessCm / 100;

    const volume = a * standardThicknessM; // м³
    const materialCost = volume * spec.pricePerM3;

    // Теплопотери до утепления (кВт·ч/год)
    const deltaT = ti - to;
    const heatLossWithout = (a * deltaT / r) * HEATING_HOURS_PER_YEAR / 1000; // кВт·ч/год
    const costWithout = heatLossWithout * HEAT_COST_PER_KWH;

    // После утепления
    const newR = r + addR;
    const heatLossWith = (a * deltaT / newR) * HEATING_HOURS_PER_YEAR / 1000;
    const costWith = heatLossWith * HEAT_COST_PER_KWH;

    const savingsPerYear = costWithout - costWith;
    const payback = savingsPerYear > 0 ? materialCost / savingsPerYear : 0;

    return {
      requiredR,
      addR: addR.toFixed(2),
      thicknessCm: standardThicknessCm,
      volume: volume.toFixed(2),
      materialCost: Math.round(materialCost),
      heatLossWithout: Math.round(heatLossWithout),
      heatLossWith: Math.round(heatLossWith),
      costWithout: Math.round(costWithout),
      costWith: Math.round(costWith),
      savingsPerYear: Math.round(savingsPerYear),
      payback: payback.toFixed(1),
      savingsPercent: heatLossWithout > 0 ? ((heatLossWithout - heatLossWith) / heatLossWithout * 100).toFixed(0) : '0',
    };
  }, [insulation, region, area, currentR, indoorTemp, outdoorTemp]);

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
                  <div className="text-xs text-gray-500">λ = {INSULATIONS[m].lambda} Вт/(м·К) • ~{INSULATIONS[m].pricePerM3.toLocaleString()} ₸/м³</div>
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
                  <div className="text-xs opacity-75">R={REGION_R[r]}</div>
                </button>
              ))}
            </div>
          </div>

          <RangeSlider label={t('insulation.area')} value={parseFloat(area) || 0} onChange={v => setArea(String(v))}
            min={10} max={1000} step={5} formatValue={v => `${v} м²`} />
          <RangeSlider label={t('insulation.currentR')} value={parseFloat(currentR) || 0} onChange={v => setCurrentR(String(v))}
            min={0.5} max={5} step={0.1} formatValue={v => `${v}`} />
          <RangeSlider label={t('insulation.indoorTemp')} value={parseFloat(indoorTemp) || 0} onChange={v => setIndoorTemp(String(v))}
            min={15} max={30} step={1} formatValue={v => `${v}°C`} />
          <RangeSlider label={t('insulation.outdoorTemp')} value={parseFloat(outdoorTemp) || 0} onChange={v => setOutdoorTemp(String(v))}
            min={-40} max={10} step={1} formatValue={v => `${v}°C`} />
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
                  <span className="font-semibold text-red-700">{results.costWithout.toLocaleString()} ₸/год</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between">
                  <span>{t('insulation.with')}</span>
                  <span className="font-semibold text-green-700">{results.costWith.toLocaleString()} ₸/год</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-300">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-5 h-5 text-green-700" />
                  <span className="text-sm text-green-900 font-medium">{t('insulation.savings')}</span>
                </div>
                <div className="text-3xl font-bold text-green-700">{results.savingsPerYear.toLocaleString('ru-KZ')} ₸/год</div>
                <div className="text-sm text-green-800">({results.savingsPercent}% {t('insulation.less')})</div>
                <div className="mt-3 pt-3 border-t border-green-300">
                  <div className="text-sm text-green-900">{t('insulation.payback')}:</div>
                  <div className="text-2xl font-bold text-green-700">{results.payback} {t('insulation.years')}</div>
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
                { label: t('insulation.materialCost'), value: `${results.materialCost.toLocaleString()} ₸` },
                { label: t('insulation.savings'), value: `${results.savingsPerYear.toLocaleString()} ₸/год` },
                { label: t('insulation.payback'), value: `${results.payback} ${pluralize(i18n.language, parseFloat(results.payback as any), 'год', 'года', 'лет')}` },
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
