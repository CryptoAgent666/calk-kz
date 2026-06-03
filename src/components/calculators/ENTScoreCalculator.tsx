import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Target, CheckCircle2, XCircle } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

// Проходные баллы ЕНТ 2024 (на грант) — ориентировочные
interface University {
  id: string;
  name: string;
  programs: { key: string; name: string; grant: number; paid: number }[];
}

const UNIVERSITIES: University[] = [
  { id: 'kaznu', name: 'КазНУ им. Аль-Фараби', programs: [
    { key: 'it', name: 'Информатика / IT', grant: 124, paid: 90 },
    { key: 'law', name: 'Юриспруденция', grant: 118, paid: 85 },
    { key: 'medicine', name: 'Медицина', grant: 125, paid: 95 },
    { key: 'economy', name: 'Экономика', grant: 115, paid: 80 },
    { key: 'philology', name: 'Филология', grant: 105, paid: 70 },
  ]},
  { id: 'nazarbayev', name: 'Nazarbayev University', programs: [
    { key: 'it', name: 'Computer Science', grant: 135, paid: 130 },
    { key: 'engineering', name: 'Engineering', grant: 130, paid: 125 },
    { key: 'medicine', name: 'School of Medicine', grant: 135, paid: 130 },
  ]},
  { id: 'satbayev', name: 'КазНИТУ им. Сатпаева', programs: [
    { key: 'it', name: 'IT и программирование', grant: 115, paid: 75 },
    { key: 'geology', name: 'Геология', grant: 105, paid: 60 },
    { key: 'oil', name: 'Нефтегазовое дело', grant: 112, paid: 70 },
  ]},
  { id: 'enu', name: 'ЕНУ им. Гумилёва (Астана)', programs: [
    { key: 'it', name: 'IT', grant: 120, paid: 80 },
    { key: 'intRelations', name: 'Международные отношения', grant: 120, paid: 85 },
    { key: 'law', name: 'Юриспруденция', grant: 115, paid: 80 },
  ]},
  { id: 'kimep', name: 'KIMEP University', programs: [
    { key: 'business', name: 'Business Administration', grant: 125, paid: 110 },
    { key: 'law', name: 'Law', grant: 120, paid: 105 },
    { key: 'it', name: 'IT', grant: 120, paid: 105 },
  ]},
];

// Максимальный балл ЕНТ = 140
const MAX_SCORE = 140;

export default function ENTScoreCalculator() {
  const { t } = useTranslation('calculators');
  const { t: tCommon } = useTranslation('common');
  // ЕНТ: история Казахстана (20), математическая грамотность (10), грамотность чтения (10), 2 профильных × 50 = 100 → всего 140
  const [history, setHistory] = useState<string>('15');
  const [mathLit, setMathLit] = useState<string>('7');
  const [readLit, setReadLit] = useState<string>('8');
  const [subject1, setSubject1] = useState<string>('35');
  const [subject2, setSubject2] = useState<string>('35');
  const [selectedUni, setSelectedUni] = useState<string>('kaznu');

  const totalScore = useMemo(() => {
    return (parseFloat(history) || 0) + (parseFloat(mathLit) || 0) +
           (parseFloat(readLit) || 0) + (parseFloat(subject1) || 0) + (parseFloat(subject2) || 0);
  }, [history, mathLit, readLit, subject1, subject2]);

  const universityData = UNIVERSITIES.find(u => u.id === selectedUni);

  const results = useMemo(() => {
    if (!universityData) return null;
    const programs = universityData.programs.map(p => ({
      ...p,
      grantPass: totalScore >= p.grant,
      paidPass: totalScore >= p.paid,
      grantDiff: totalScore - p.grant,
      paidDiff: totalScore - p.paid,
    }));
    return { programs, totalScore, maxScore: MAX_SCORE, percent: (totalScore / MAX_SCORE * 100).toFixed(1) };
  }, [universityData, totalScore]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="ent-score" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('ent-score.title')}</h1>
          <p className="text-gray-600">{t('ent-score.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('ent-score.yourScore')}</h2>

          <RangeSlider label={t('ent-score.history')} value={parseFloat(history) || 0}
            onChange={v => setHistory(String(v))} min={0} max={20} step={1} formatValue={v => `${v} / 20`} />
          <RangeSlider label={t('ent-score.mathLiteracy')} value={parseFloat(mathLit) || 0}
            onChange={v => setMathLit(String(v))} min={0} max={10} step={1} formatValue={v => `${v} / 10`} />
          <RangeSlider label={t('ent-score.readingLiteracy')} value={parseFloat(readLit) || 0}
            onChange={v => setReadLit(String(v))} min={0} max={10} step={1} formatValue={v => `${v} / 10`} />
          <RangeSlider label={t('ent-score.subject1')} value={parseFloat(subject1) || 0}
            onChange={v => setSubject1(String(v))} min={0} max={50} step={1} formatValue={v => `${v} / 50`} />
          <RangeSlider label={t('ent-score.subject2')} value={parseFloat(subject2) || 0}
            onChange={v => setSubject2(String(v))} min={0} max={50} step={1} formatValue={v => `${v} / 50`} />

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-300 text-center">
            <div className="text-sm text-gray-600">{t('ent-score.totalScore')}</div>
            <div className="text-5xl font-bold text-blue-700">{totalScore} / {MAX_SCORE}</div>
            <div className="text-sm text-gray-500">{results?.percent}%</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('ent-score.university')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('ent-score.selectUni')}</label>
            <select value={selectedUni} onChange={e => setSelectedUni(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {UNIVERSITIES.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {results && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('ent-score.programs')}</div>
              {results.programs.map(p => (
                <div key={p.key} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className={`text-xs px-2 py-0.5 rounded ${p.grantPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.grantPass ? `✓ ${tCommon('calculator.grant')}` : `✗ ${tCommon('calculator.grant')}`}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{tCommon('calculator.grant')}: {p.grant} ({p.grantDiff > 0 ? `+${p.grantDiff}` : p.grantDiff})</span>
                    <span>{tCommon('calculator.paid')}: {p.paid} ({p.paidDiff > 0 ? `+${p.paidDiff}` : p.paidDiff})</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
            ⚠️ {t('ent-score.disclaimer')}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('ent-score.title'),
            subtitle: universityData?.name,
            sections: [{ title: t('ent-score.resultsTitle'), data: [
              { label: t('ent-score.totalScore'), value: `${totalScore} / ${MAX_SCORE}` },
              { label: t('ent-score.university'), value: universityData?.name || '' },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="ent-score"
        />
      </div>

      <ExpertBlock />
      <CalculatorExamples calculatorId="ent-score" />
      <MethodologySection steps={getMethodology('ent-score')} />
      <FAQSection items={[
        { question: t('ent-score.faq.q1'), answer: t('ent-score.faq.a1') },
        { question: t('ent-score.faq.q2'), answer: t('ent-score.faq.a2') },
        { question: t('ent-score.faq.q3'), answer: t('ent-score.faq.a3') },
        { question: t('ent-score.faq.q4'), answer: t('ent-score.faq.a4') },
        { question: t('ent-score.faq.q5'), answer: t('ent-score.faq.a5') },
      ]} 
          sources={getSources('ent-score')}
        />
      <EmbedWidget calculatorId="ent-score" calculatorTitle={t('ent-score.title')} />
      <LastUpdated calculatorId="ent-score" />
    </div>
  );
}
