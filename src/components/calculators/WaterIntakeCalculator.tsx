import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { MedicalDisclaimer } from '../ui/MedicalDisclaimer';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function WaterIntakeCalculator() {
  const { t } = useTranslation('calculators');
  const [weight, setWeight] = useState<string>('70');
  const [activity, setActivity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [climate, setClimate] = useState<'normal' | 'hot'>('normal');
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState<boolean>(false);

  const results = useMemo(() => {
    const w = parseFloat(weight) || 0;
    if (w <= 0) return null;

    // Базовая норма: 30-35 мл на кг
    let baseMl = w * 32;

    // Активность: +500 мл / час лёгкой, +1000 мл / час интенсивной
    const activityBonus = activity === 'low' ? 0 : activity === 'moderate' ? 500 : 1000;
    // Жаркий климат: +500-700 мл
    const climateBonus = climate === 'hot' ? 600 : 0;
    // Беременность: +300 мл
    const pregnancyBonus = isPregnant ? 300 : 0;
    // Кормление: +700 мл
    const breastfeedingBonus = isBreastfeeding ? 700 : 0;

    const totalMl = baseMl + activityBonus + climateBonus + pregnancyBonus + breastfeedingBonus;
    const liters = totalMl / 1000;
    const glasses = Math.round(totalMl / 250); // стакан 250 мл
    const bottles = (totalMl / 500).toFixed(1); // бутылка 0.5л

    // График по часам (08:00-22:00, 8 приёмов)
    const hourly = Math.round(totalMl / 8);

    return {
      totalMl: Math.round(totalMl),
      liters: liters.toFixed(2),
      glasses,
      bottles,
      hourly,
      baseMl: Math.round(baseMl),
      activityBonus,
      climateBonus,
      pregnancyBonus,
      breastfeedingBonus,
    };
  }, [weight, activity, climate, isPregnant, isBreastfeeding]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="water-intake" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('water-intake.title')}</h1>
          <p className="text-gray-600">{t('water-intake.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('water-intake.parameters')}</h2>

          <RangeSlider label={t('water-intake.weight')} value={parseFloat(weight) || 0} onChange={v => setWeight(String(v))}
            min={20} max={200} step={1} formatValue={v => `${v} кг`} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('water-intake.activity')}</label>
            <div className="space-y-2">
              {(['low', 'moderate', 'high'] as const).map(a => (
                <button key={a} onClick={() => setActivity(a)}
                  className={`w-full p-3 rounded-lg border text-left ${activity === a ? 'bg-sky-50 border-sky-500' : 'bg-white border-gray-300'}`}>
                  <div className="text-sm font-medium">{t(`water-intake.activityLevels.${a}`)}</div>
                  <div className="text-xs text-gray-500">{t(`water-intake.activityHints.${a}`)}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('water-intake.climate')}</label>
            <div className="flex gap-2">
              <button onClick={() => setClimate('normal')}
                className={`flex-1 p-3 rounded-lg border ${climate === 'normal' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-gray-300'}`}>
                🌤 {t('water-intake.normal')}
              </button>
              <button onClick={() => setClimate('hot')}
                className={`flex-1 p-3 rounded-lg border ${climate === 'hot' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-gray-300'}`}>
                ☀️ {t('water-intake.hot')}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPregnant} onChange={e => setIsPregnant(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('water-intake.pregnant')} (+300 мл)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isBreastfeeding} onChange={e => setIsBreastfeeding(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('water-intake.breastfeeding')} (+700 мл)</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('water-intake.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-6 border border-sky-200 text-center">
                <div className="text-sm text-gray-600">{t('water-intake.dailyNorm')}</div>
                <div className="text-5xl font-bold text-sky-700">{results.liters} л</div>
                <div className="text-sm text-gray-500 mt-1">= {results.totalMl} мл</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl">🥛</div>
                  <div className="text-xl font-bold text-blue-700">{results.glasses}</div>
                  <div className="text-xs text-gray-600">{t('water-intake.glasses')} (250 мл)</div>
                </div>
                <div className="bg-cyan-50 rounded-lg p-4 text-center">
                  <div className="text-3xl">🍼</div>
                  <div className="text-xl font-bold text-cyan-700">{results.bottles}</div>
                  <div className="text-xs text-gray-600">{t('water-intake.bottles')} (0.5 л)</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-2">{t('water-intake.breakdown')}</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>{t('water-intake.base')}</span><span>{results.baseMl} мл</span></div>
                  {results.activityBonus > 0 && <div className="flex justify-between text-green-700"><span>+ {t('water-intake.activityBonus')}</span><span>{results.activityBonus} мл</span></div>}
                  {results.climateBonus > 0 && <div className="flex justify-between text-amber-700"><span>+ {t('water-intake.climateBonus')}</span><span>{results.climateBonus} мл</span></div>}
                  {results.pregnancyBonus > 0 && <div className="flex justify-between text-pink-700"><span>+ {t('water-intake.pregnancyBonus')}</span><span>{results.pregnancyBonus} мл</span></div>}
                  {results.breastfeedingBonus > 0 && <div className="flex justify-between text-pink-700"><span>+ {t('water-intake.breastfeedingBonus')}</span><span>{results.breastfeedingBonus} мл</span></div>}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                💡 {t('water-intake.schedule')}: ~{results.hourly} мл × 8 раз в день (с 08:00 до 22:00)
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('water-intake.title'),
              sections: [{ title: t('water-intake.resultsTitle'), data: [
                { label: t('water-intake.dailyNorm'), value: `${results.liters} л / ${results.totalMl} мл` },
                { label: t('water-intake.glasses'), value: `${results.glasses} × 250 мл` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="water-intake"
          />
        </div>
      )}

      <ExpertBlock />

      {/* Medical sources (Apple App Store Guideline 1.4.1 compliance) */}
      <MedicalDisclaimer
        sources={[
          {
            title: 'Institute of Medicine — Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate (2005)',
            url: 'https://nap.nationalacademies.org/catalog/10925/dietary-reference-intakes-for-water-potassium-sodium-chloride-and-sulfate',
            description: 'National Academies Press. Базовая публикация о суточной потребности в воде: 3.7 л для мужчин и 2.7 л для женщин общего потребления жидкости. Источник базовых норм калькулятора.',
          },
          {
            title: 'EFSA Panel on Dietetic Products — Scientific Opinion on Dietary Reference Values for water (2010)',
            url: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459',
            description: 'European Food Safety Authority. Европейские референсные значения потребления воды, использовались для калибровки коэффициента 30-35 мл/кг.',
          },
          {
            title: 'WHO — Drinking water requirements',
            url: 'https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/water-safety-and-quality/drinking-water',
            description: 'World Health Organization. Рекомендации по потреблению питьевой воды, поправки для жаркого климата и физической активности.',
          },
          {
            title: 'NASEM — Nutrition During Pregnancy and Lactation',
            url: 'https://nap.nationalacademies.org/catalog/24960/nutrition-during-pregnancy-and-lactation-exploring-new-evidence-proceedings-of',
            description: 'National Academies. Дополнительная потребность в воде при беременности (+300 мл) и грудном вскармливании (+700 мл).',
          },
        ]}
      />

      <CalculatorExamples calculatorId="water-intake" />

      <MethodologySection steps={getMethodology('water-intake')} />

      <FAQSection items={[
        { question: t('water-intake.faq.q1'), answer: t('water-intake.faq.a1') },
        { question: t('water-intake.faq.q2'), answer: t('water-intake.faq.a2') },
        { question: t('water-intake.faq.q3'), answer: t('water-intake.faq.a3') },
        { question: t('water-intake.faq.q4'), answer: t('water-intake.faq.a4') },
        { question: t('water-intake.faq.q5'), answer: t('water-intake.faq.a5') },
      ]}
      sources={[
        { title: 'IOM DRI for Water (2005)', url: 'https://nap.nationalacademies.org/catalog/10925/dietary-reference-intakes-for-water-potassium-sodium-chloride-and-sulfate' },
        { title: 'EFSA DRV for water (2010)', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459' },
        { title: 'WHO — Drinking water', url: 'https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/water-safety-and-quality/drinking-water' },
      ]} />
      <EmbedWidget calculatorId="water-intake" calculatorTitle={t('water-intake.title')} />
      <LastUpdated calculatorId="water-intake" />
    </div>
  );
}
