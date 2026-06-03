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

// AVMA formula:
// Dog 1y = 15 human years, 2y = +9, then depends on size:
//   Small (до 9 кг): +4/year
//   Medium (10-22 кг): +5/year
//   Large (23-40 кг): +6/year
//   Giant (40+ кг): +7/year
// Cat 1y = 15, 2y = +9, then +4/year

function dogAge(years: number, size: DogSize): number {
  const perYear = { small: 4, medium: 5, large: 6, giant: 7 }[size];
  if (years <= 1) return years * 15;
  if (years <= 2) return 15 + (years - 1) * 9;
  return 24 + (years - 2) * perYear;
}

function catAge(years: number): number {
  if (years <= 1) return years * 15;
  if (years <= 2) return 15 + (years - 1) * 9;
  return 24 + (years - 2) * 4;
}

// Life stage categorization
function getLifeStage(humanAge: number, type: 'dog' | 'cat'): string {
  if (humanAge < 15) return 'baby';
  if (humanAge < 25) return 'young';
  if (humanAge < 45) return 'adult';
  if (humanAge < 65) return 'mature';
  if (humanAge < 80) return 'senior';
  return 'geriatric';
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
    const stage = getLifeStage(humanAge, type);
    const lifespan = lifeExpectancy(type, type === 'dog' ? size : undefined);
    const humanLifespan = type === 'dog' ? dogAge(lifespan, size) : catAge(lifespan);
    const progress = Math.min((totalYears / lifespan) * 100, 100);

    return {
      humanAge: Math.round(humanAge),
      stage,
      lifespan,
      humanLifespan: Math.round(humanLifespan),
      progress: progress.toFixed(1),
      totalYears: totalYears.toFixed(1),
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
                { label: t('pet-age.animalAge'), value: `${results.totalYears} ${pluralize(i18n.language, results.totalYears, 'год', 'года', 'лет')}` },
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
