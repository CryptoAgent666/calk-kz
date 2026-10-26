import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dog, Cat } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';
import { pluralize } from '../../utils/pluralize';

type PetType = 'dog' | 'cat';
type DogSize = 'small' | 'medium' | 'large' | 'giant';

// Таблица AAHA / Zoetis 2019 «My pet's physiological age» (собаки — по Dog Owner's Home Veterinary
// Handbook, прил. B; кошки — по AAFP-AAHA Feline Life Stage Guidelines). Между целыми годами —
// линейная интерполяция, после конца таблицы — последний годовой шаг.
// Размеры: ≤9 кг / 9,5–23 кг / 23–41 кг / >41 кг.
const DOG_TABLE: Record<DogSize, number[]> = {
  //       1   2   3   4   5   6   7   8   9  10  11  12  13  14   15   16   17   18   19   20
  small:  [15, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72,  76,  80,  84,  88,  92,  96],
  medium: [15, 24, 28, 33, 37, 42, 47, 51, 56, 60, 65, 69, 74, 78,  83,  87,  92,  96, 101, 105],
  large:  [15, 24, 30, 35, 40, 45, 50, 55, 61, 66, 72, 77, 82, 88,  93,  99, 104, 109, 115, 120],
  giant:  [15, 24, 32, 37, 42, 49, 56, 64, 71, 78, 86, 93, 101, 108, 115, 123],
};

function fromTable(table: number[], years: number): number {
  // table[0] — 1 год; до года — линейно от 0
  if (years <= 1) return years * table[0];
  const last = table.length;
  if (years >= last) return table[last - 1] + (years - last) * (table[last - 1] - table[last - 2]);
  const lo = Math.floor(years);
  return table[lo - 1] + (years - lo) * (table[lo] - table[lo - 1]);
}

function dogAge(years: number, size: DogSize): number {
  return fromTable(DOG_TABLE[size], years);
}

function catAge(years: number): number {
  // Кошка: 6 мес — 10, 1 год — 15, 2 — 24, дальше +4 за год
  if (years <= 0.5) return years * 20;
  if (years <= 1) return 10 + (years - 0.5) * 10;
  if (years <= 2) return 15 + (years - 1) * 9;
  return 24 + (years - 2) * 4;
}

// Стадия жизни — по возрасту питомца относительно ожидаемой продолжительности жизни (AAHA:
// пожилой — последние 25% жизни).
function getLifeStage(years: number, lifespan: number): 'puppy' | 'junior' | 'adult' | 'mature' | 'senior' {
  if (years < 1) return 'puppy';
  if (years < 2) return 'junior';
  if (years < lifespan * 0.5) return 'adult';
  if (years < lifespan * 0.75) return 'mature';
  return 'senior';
}

// Typical life expectancy
function lifeExpectancy(type: 'dog' | 'cat', size?: DogSize): number {
  if (type === 'cat') return 15;
  if (!size) return 12;
  return { small: 15, medium: 13, large: 11, giant: 9 }[size];
}

export default function PetAgeCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [type, setType] = useState<PetType>('dog');
  const [years, setYears] = useState<string>('5');
  const [months, setMonths] = useState<string>('0');
  const [size, setSize] = useState<DogSize>('medium');

  const results = useMemo(() => {
    const totalYears = (parseFloat(years) || 0) + (parseFloat(months) || 0) / 12;
    if (totalYears <= 0) return null;

    const humanAge = type === 'dog' ? dogAge(totalYears, size) : catAge(totalYears);
    const lifespan = lifeExpectancy(type, type === 'dog' ? size : undefined);
    const stage = getLifeStage(totalYears, lifespan);
    const humanLifespan = type === 'dog' ? dogAge(lifespan, size) : catAge(lifespan);
    const progress = Math.min((totalYears / lifespan) * 100, 100);

    return {
      humanAge: Math.round(humanAge),
      stage,
      lifespan,
      humanLifespan: Math.round(humanLifespan),
      progress: progress.toFixed(1).replace('.', ','),
      totalYears: totalYears.toFixed(1).replace('.', ','),
      totalYearsNum: totalYears,
    };
  }, [type, years, months, size]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="pet-age" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
          {type === 'dog' ? <Dog className="w-5 h-5 text-white" /> : <Cat className="w-5 h-5 text-white" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pet-age.title')}</h1>
          <p className="text-gray-600">{t('pet-age.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('pet-age.type')}</label>
          <div className="flex gap-2">
            <button onClick={() => setType('dog')}
              className={`flex-1 p-4 rounded-lg border text-lg ${type === 'dog' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300'}`}>
              🐕 {t('pet-age.dog')}
            </button>
            <button onClick={() => setType('cat')}
              className={`flex-1 p-4 rounded-lg border text-lg ${type === 'cat' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300'}`}>
              🐈 {t('pet-age.cat')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <RangeSlider label={t('pet-age.years')} value={parseFloat(years) || 0} onChange={v => setYears(String(v))}
            min={0} max={25} step={1} formatValue={v => `${v} ${t('pet-age.yearsShort')}`} />
          <RangeSlider label={t('pet-age.months')} value={parseFloat(months) || 0} onChange={v => setMonths(String(v))}
            min={0} max={11} step={1} formatValue={v => `${v} ${t('pet-age.monthsShort')}`} />
        </div>

        {type === 'dog' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('pet-age.size')}</label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'giant'] as DogSize[]).map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className={`p-3 rounded-lg border text-sm ${size === s ? 'bg-amber-50 border-amber-500' : 'bg-white border-gray-300'}`}>
                  <div className="font-medium">{t(`pet-age.sizes.${s}`)}</div>
                  <div className="text-xs text-gray-500">{t(`pet-age.sizeHints.${s}`)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {results && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200 text-center">
            <div className="text-sm text-gray-600">
              {t('pet-age.animalAge')}: {results.totalYears} {t('pet-age.yearsShort')}
            </div>
            <div className="text-6xl font-bold text-amber-700 my-2">{results.humanAge}</div>
            <div className="text-xl text-gray-700">{t('pet-age.humanYears')}</div>
            <div className="inline-block mt-3 px-3 py-1 bg-white rounded-full text-sm font-medium border border-amber-300">
              {t(`pet-age.stages.${results.stage}`)}
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">{t('pet-age.lifespan')}</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">{results.totalYears} / {results.lifespan} {t('pet-age.yearsShort')}</span>
                <span className="text-sm font-semibold">{results.progress}%</span>
              </div>
              <div className="w-full bg-white rounded-full h-3">
                <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${results.progress}%` }} />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
              💡 {t('pet-age.lifespanNote', { lifespan: results.lifespan, humanLifespan: results.humanLifespan })}
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('pet-age.title'),
              subtitle: type === 'dog' ? t('pet-age.dog') : t('pet-age.cat'),
              sections: [{ title: t('pet-age.results'), data: [
                { label: t('pet-age.animalAge'), value: `${results.totalYears} ${pluralize(i18n.language, results.totalYearsNum, 'год', 'года', 'лет')}` },
                { label: t('pet-age.humanYears'), value: `${results.humanAge} ${pluralize(i18n.language, results.humanAge, 'год', 'года', 'лет')}` },
                { label: t('pet-age.stage'), value: t(`pet-age.stages.${results.stage}`) },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="pet-age"
          />
        </div>
      )}

      <ExpertBlock />
      <FAQSection items={[
        { question: t('pet-age.faq.q1'), answer: t('pet-age.faq.a1') },
        { question: t('pet-age.faq.q2'), answer: t('pet-age.faq.a2') },
        { question: t('pet-age.faq.q3'), answer: t('pet-age.faq.a3') },
        { question: t('pet-age.faq.q4'), answer: t('pet-age.faq.a4') },
        { question: t('pet-age.faq.q5'), answer: t('pet-age.faq.a5') },
      ]} 
          sources={getSources('pet-age')}
        />
      <EmbedWidget calculatorId="pet-age" calculatorTitle={t('pet-age.title')} />
      <LastUpdated calculatorId="pet-age" />
    </div>
  );
}
