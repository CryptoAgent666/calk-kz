import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
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

// Морские формулы U.S. Navy
function navyBodyFat(gender: 'male' | 'female', height: number, neck: number, waist: number, hip: number): number {
  if (gender === 'male') {
    // BF% = 495 / (1.0324 - 0.19077 × log10(waist - neck) + 0.15456 × log10(height)) - 450
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    // Female: 495 / (1.29579 - 0.35004 × log10(waist + hip - neck) + 0.22100 × log10(height)) - 450
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  }
}

function getCategory(bf: number, gender: 'male' | 'female'): { key: string; color: string } {
  if (gender === 'male') {
    if (bf < 6) return { key: 'essential', color: 'blue' };
    if (bf < 14) return { key: 'athletes', color: 'green' };
    if (bf < 18) return { key: 'fitness', color: 'teal' };
    if (bf < 25) return { key: 'average', color: 'amber' };
    return { key: 'obese', color: 'red' };
  } else {
    if (bf < 14) return { key: 'essential', color: 'blue' };
    if (bf < 21) return { key: 'athletes', color: 'green' };
    if (bf < 25) return { key: 'fitness', color: 'teal' };
    if (bf < 32) return { key: 'average', color: 'amber' };
    return { key: 'obese', color: 'red' };
  }
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
};

export default function BodyFatCalculator() {
  const { t } = useTranslation('calculators');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState<string>('175');
  const [weight, setWeight] = useState<string>('70');
  const [neck, setNeck] = useState<string>('37');
  const [waist, setWaist] = useState<string>('85');
  const [hip, setHip] = useState<string>('95');

  const results = useMemo(() => {
    const h = parseFloat(height) || 0;
    const w = parseFloat(weight) || 0;
    const n = parseFloat(neck) || 0;
    const wa = parseFloat(waist) || 0;
    const hp = parseFloat(hip) || 0;

    if (h <= 0 || w <= 0 || n <= 0 || wa <= 0 || (gender === 'female' && hp <= 0)) return null;

    const bf = navyBodyFat(gender, h, n, wa, hp);
    if (!isFinite(bf) || bf < 0 || bf > 60) return null;

    const fatMass = (bf / 100) * w;
    const leanMass = w - fatMass;
    const category = getCategory(bf, gender);

    return {
      bf: bf.toFixed(1),
      bfNumber: bf,
      fatMass: fatMass.toFixed(1),
      leanMass: leanMass.toFixed(1),
      category: category.key,
      color: category.color,
    };
  }, [gender, height, weight, neck, waist, hip]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="body-fat" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('body-fat.title')}</h1>
          <p className="text-gray-600">{t('body-fat.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('body-fat.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('body-fat.gender')}</label>
            <div className="flex gap-2">
              <button onClick={() => setGender('male')}
                className={`flex-1 p-3 rounded-lg border ${gender === 'male' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white border-gray-300'}`}>
                👨 {t('body-fat.male')}
              </button>
              <button onClick={() => setGender('female')}
                className={`flex-1 p-3 rounded-lg border ${gender === 'female' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white border-gray-300'}`}>
                👩 {t('body-fat.female')}
              </button>
            </div>
          </div>

          <RangeSlider label={t('body-fat.height')} value={parseFloat(height) || 0} onChange={v => setHeight(String(v))}
            min={120} max={230} step={1} formatValue={v => `${v} см`} />
          <RangeSlider label={t('body-fat.weight')} value={parseFloat(weight) || 0} onChange={v => setWeight(String(v))}
            min={30} max={200} step={1} formatValue={v => `${v} кг`} />
          <RangeSlider label={t('body-fat.neck')} value={parseFloat(neck) || 0} onChange={v => setNeck(String(v))}
            min={20} max={60} step={0.5} formatValue={v => `${v} см`} />
          <RangeSlider label={t('body-fat.waist')} value={parseFloat(waist) || 0} onChange={v => setWaist(String(v))}
            min={50} max={150} step={0.5} formatValue={v => `${v} см`} />
          {gender === 'female' && (
            <RangeSlider label={t('body-fat.hip')} value={parseFloat(hip) || 0} onChange={v => setHip(String(v))}
              min={60} max={150} step={0.5} formatValue={v => `${v} см`} />
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            {t('body-fat.measurementTip')}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('body-fat.resultsTitle')}</h2>

          {results ? (
            <>
              <div className={`rounded-lg p-6 border ${COLOR_MAP[results.color].bg} ${COLOR_MAP[results.color].border}`}>
                <div className="text-sm text-gray-600">{t('body-fat.bodyFatPercent')}</div>
                <div className={`text-5xl font-bold ${COLOR_MAP[results.color].text}`}>{results.bf}%</div>
                <div className={`text-sm font-medium mt-2 ${COLOR_MAP[results.color].text}`}>
                  {t(`body-fat.categories.${results.category}`)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-600">{t('body-fat.fatMass')}</div>
                  <div className="text-xl font-bold">{results.fatMass} кг</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-xs text-gray-600">{t('body-fat.leanMass')}</div>
                  <div className="text-xl font-bold">{results.leanMass} кг</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="font-medium mb-2">{t('body-fat.ranges')} ({gender === 'male' ? '♂' : '♀'})</div>
                <div className="space-y-1 text-xs">
                  {gender === 'male' ? (
                    <>
                      <div>• 2-5%: {t('body-fat.categories.essential')}</div>
                      <div>• 6-13%: {t('body-fat.categories.athletes')}</div>
                      <div>• 14-17%: {t('body-fat.categories.fitness')}</div>
                      <div>• 18-24%: {t('body-fat.categories.average')}</div>
                      <div>• 25%+: {t('body-fat.categories.obese')}</div>
                    </>
                  ) : (
                    <>
                      <div>• 10-13%: {t('body-fat.categories.essential')}</div>
                      <div>• 14-20%: {t('body-fat.categories.athletes')}</div>
                      <div>• 21-24%: {t('body-fat.categories.fitness')}</div>
                      <div>• 25-31%: {t('body-fat.categories.average')}</div>
                      <div>• 32%+: {t('body-fat.categories.obese')}</div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">{t('body-fat.enterData')}</div>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('body-fat.title'),
              sections: [{ title: t('body-fat.resultsTitle'), data: [
                { label: t('body-fat.bodyFatPercent'), value: `${results.bf}%` },
                { label: t('body-fat.fatMass'), value: `${results.fatMass} кг` },
                { label: t('body-fat.leanMass'), value: `${results.leanMass} кг` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="body-fat"
          />
        </div>
      )}

      <ExpertBlock />

      {/* Medical sources (Apple App Store Guideline 1.4.1 compliance) */}
      <MedicalDisclaimer
        sources={[
          {
            title: 'Hodgdon JA, Beckett MB. "Prediction of percent body fat for U.S. Navy men and women from body circumferences and height" (1984)',
            url: 'https://apps.dtic.mil/sti/citations/ADA143890',
            description: 'Naval Health Research Center Reports 84-29 и 84-11. Оригинальная публикация формулы U.S. Navy для оценки процента жира по антропометрическим измерениям, используемой в этом калькуляторе.',
          },
          {
            title: 'ACE — Percent Body Fat Norms for Men and Women',
            url: 'https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/',
            description: 'American Council on Exercise. Категории процента жира (essential, athletes, fitness, average, obese) для мужчин и женщин — официальные референсные диапазоны.',
          },
          {
            title: 'NIH — Body Composition Assessment',
            url: 'https://www.ncbi.nlm.nih.gov/books/NBK547708/',
            description: 'NCBI StatPearls. Обзор методов измерения состава тела (DEXA, гидростатика, биоимпеданс, антропометрия) и их сравнительная точность.',
          },
        ]}
      />

      <CalculatorExamples calculatorId="body-fat" />

      <MethodologySection steps={getMethodology('body-fat')} />

      <FAQSection items={[
        { question: t('body-fat.faq.q1'), answer: t('body-fat.faq.a1') },
        { question: t('body-fat.faq.q2'), answer: t('body-fat.faq.a2') },
        { question: t('body-fat.faq.q3'), answer: t('body-fat.faq.a3') },
        { question: t('body-fat.faq.q4'), answer: t('body-fat.faq.a4') },
        { question: t('body-fat.faq.q5'), answer: t('body-fat.faq.a5') },
      ]}
      sources={[
        { title: 'Hodgdon & Beckett (1984)', url: 'https://apps.dtic.mil/sti/citations/ADA143890' },
        { title: 'ACE Body Fat Norms', url: 'https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/' },
        { title: 'NIH Body Composition', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547708/' },
      ]} />
      <EmbedWidget calculatorId="body-fat" calculatorTitle={t('body-fat.title')} />
      <LastUpdated calculatorId="body-fat" />
    </div>
  );
}
