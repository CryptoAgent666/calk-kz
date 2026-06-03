import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, AlarmClock } from 'lucide-react';
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

// Нормы сна по возрасту (National Sleep Foundation)
interface AgeGroup { min: number; max: number; key: string; hours: string; recommended: number }
const AGE_GROUPS: AgeGroup[] = [
  { min: 0, max: 0.25, key: 'newborn', hours: '14-17', recommended: 15.5 },
  { min: 0.25, max: 1, key: 'infant', hours: '12-15', recommended: 13.5 },
  { min: 1, max: 3, key: 'toddler', hours: '11-14', recommended: 12.5 },
  { min: 3, max: 6, key: 'preschool', hours: '10-13', recommended: 11.5 },
  { min: 6, max: 14, key: 'school', hours: '9-11', recommended: 10 },
  { min: 14, max: 18, key: 'teen', hours: '8-10', recommended: 9 },
  { min: 18, max: 65, key: 'adult', hours: '7-9', recommended: 8 },
  { min: 65, max: 120, key: 'senior', hours: '7-8', recommended: 7.5 },
];

function getAgeGroup(age: number): AgeGroup {
  return AGE_GROUPS.find(g => age >= g.min && age < g.max) || AGE_GROUPS[AGE_GROUPS.length - 1];
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addMinutes(hours: number, minutes: number, addMin: number): { h: number; m: number } {
  // Нормализуем total в диапазон [0, 1439] минут, чтобы избежать
  // отрицательных значений в результате (Math.floor + % на отрицательных
  // числах в JS даёт неверные значения: -30 % 60 = -30, что ломает формат «23:-30»).
  const DAY = 24 * 60;
  let total = ((hours * 60 + minutes + addMin) % DAY + DAY) % DAY;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return { h, m };
}

function subtractMinutes(hours: number, minutes: number, subMin: number): { h: number; m: number } {
  return addMinutes(hours, minutes, -subMin);
}

export default function SleepCalculator() {
  const { t } = useTranslation('calculators');
  const [age, setAge] = useState<string>('30');
  const [mode, setMode] = useState<'wakeup' | 'bedtime'>('wakeup');
  const [wakeupTime, setWakeupTime] = useState<string>('07:00');
  const [bedTime, setBedTime] = useState<string>('23:00');

  const ageGroup = useMemo(() => getAgeGroup(parseFloat(age) || 30), [age]);

  // Цикл сна = 90 минут; засыпание ~ 15 мин
  const FALL_ASLEEP = 15;
  const CYCLE = 90;

  const results = useMemo(() => {
    const parseT = (s: string) => {
      const [h, m] = s.split(':').map(Number);
      return { h: h || 0, m: m || 0 };
    };

    if (mode === 'wakeup') {
      // Хочу проснуться в X — когда лечь?
      const { h, m } = parseT(wakeupTime);
      const options = [6, 5, 4, 3].map(cycles => {
        const total = cycles * CYCLE + FALL_ASLEEP;
        const bt = subtractMinutes(h, m, total);
        return { cycles, hours: (cycles * CYCLE) / 60, time: formatTime(bt.h, bt.m) };
      });
      return { options };
    } else {
      // Ложусь в X — когда проснуться?
      const { h, m } = parseT(bedTime);
      const asleep = addMinutes(h, m, FALL_ASLEEP);
      const options = [4, 5, 6, 7].map(cycles => {
        const total = cycles * CYCLE;
        const wt = addMinutes(asleep.h, asleep.m, total);
        return { cycles, hours: (cycles * CYCLE) / 60, time: formatTime(wt.h, wt.m) };
      });
      return { options };
    }
  }, [mode, wakeupTime, bedTime]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="sleep" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Moon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('sleep.title')}</h1>
          <p className="text-gray-600">{t('sleep.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('sleep.age')}</label>
          <RangeSlider label="" value={parseFloat(age) || 0} onChange={v => setAge(String(v))}
            min={0} max={100} step={1} formatValue={v => `${v} ${t('sleep.years')}`} />
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200">
          <div className="text-sm text-gray-600">{t(`sleep.groups.${ageGroup.key}`)}</div>
          <div className="text-3xl font-bold text-indigo-700">{ageGroup.hours} {t('sleep.hoursPerDay')}</div>
          <div className="text-xs text-gray-500 mt-1">{t('sleep.recommended')}: {ageGroup.recommended} ч</div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setMode('wakeup')}
            className={`flex-1 p-3 rounded-lg border ${mode === 'wakeup' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-300'}`}>
            <AlarmClock className="w-4 h-4 inline mr-1" /> {t('sleep.whenToSleep')}
          </button>
          <button onClick={() => setMode('bedtime')}
            className={`flex-1 p-3 rounded-lg border ${mode === 'bedtime' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-300'}`}>
            <Sun className="w-4 h-4 inline mr-1" /> {t('sleep.whenToWake')}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'wakeup' ? t('sleep.wakeupAt') : t('sleep.bedAt')}
          </label>
          <input type="time"
            value={mode === 'wakeup' ? wakeupTime : bedTime}
            onChange={e => mode === 'wakeup' ? setWakeupTime(e.target.value) : setBedTime(e.target.value)}
            className="w-full px-4 py-3 text-2xl border border-gray-300 rounded-lg text-center font-mono" />
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            {mode === 'wakeup' ? t('sleep.goToBedAt') : t('sleep.wakeupAtTimes')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {results.options.map((opt, i) => {
              const isOptimal = opt.cycles >= 5 && opt.cycles <= 6;
              return (
                <div key={i} className={`p-4 rounded-lg border ${isOptimal ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-2xl font-bold font-mono">{opt.time}</div>
                  <div className="text-xs text-gray-600 mt-1">{opt.cycles} {t('sleep.cycles')}</div>
                  <div className="text-xs text-gray-500">{opt.hours} ч</div>
                  {isOptimal && <div className="text-xs text-green-700 font-medium mt-1">✓ {t('sleep.optimal')}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          💡 {t('sleep.cycleInfo')}
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('sleep.title'),
            subtitle: t(`sleep.groups.${ageGroup.key}`),
            sections: [{ title: t('sleep.results'), data: results.options.map(o => ({
              label: `${o.cycles} ${t('sleep.cycles')} (${o.hours} ч)`, value: o.time
            }))}],
            footer: 'Calk.kz'
          }}
          filename="sleep"
        />
      </div>

      <ExpertBlock />

      {/* Medical sources (Apple App Store Guideline 1.4.1 compliance) */}
      <MedicalDisclaimer
        sources={[
          {
            title: 'Hirshkowitz M et al. "National Sleep Foundation\'s sleep time duration recommendations" (2015)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/29073412/',
            description: 'Sleep Health Journal. Рецензируемые рекомендации National Sleep Foundation по продолжительности сна для всех возрастных групп (новорождённые → пожилые) — основа таблицы норм в калькуляторе.',
          },
          {
            title: 'American Academy of Sleep Medicine (AASM) — Sleep Education',
            url: 'https://sleepeducation.org/healthy-sleep/how-much-sleep/',
            description: 'Профессиональная медицинская ассоциация. Данные о структуре циклов сна (90 минут, фазы NREM/REM) и оптимальном времени пробуждения.',
          },
          {
            title: 'CDC — Sleep and Sleep Disorders',
            url: 'https://www.cdc.gov/sleep/about/index.html',
            description: 'Centers for Disease Control. Минимальные нормы сна для здоровья (7+ часов для взрослых), последствия недостатка сна.',
          },
          {
            title: 'NIH NHLBI — How Sleep Works',
            url: 'https://www.nhlbi.nih.gov/health/sleep',
            description: 'National Heart, Lung, and Blood Institute. Физиология сна, стадии, влияние на сердечно-сосудистую систему.',
          },
        ]}
      />

      <CalculatorExamples calculatorId="sleep" />

      <MethodologySection steps={getMethodology('sleep')} />

      <FAQSection items={[
        { question: t('sleep.faq.q1'), answer: t('sleep.faq.a1') },
        { question: t('sleep.faq.q2'), answer: t('sleep.faq.a2') },
        { question: t('sleep.faq.q3'), answer: t('sleep.faq.a3') },
        { question: t('sleep.faq.q4'), answer: t('sleep.faq.a4') },
        { question: t('sleep.faq.q5'), answer: t('sleep.faq.a5') },
      ]}
      sources={[
        { title: 'NSF Sleep Time Recommendations (Hirshkowitz, 2015)', url: 'https://pubmed.ncbi.nlm.nih.gov/29073412/' },
        { title: 'AASM Sleep Education', url: 'https://sleepeducation.org/healthy-sleep/how-much-sleep/' },
        { title: 'CDC — Sleep', url: 'https://www.cdc.gov/sleep/about/index.html' },
      ]} />
      <EmbedWidget calculatorId="sleep" calculatorTitle={t('sleep.title')} />
      <LastUpdated calculatorId="sleep" />
    </div>
  );
}
