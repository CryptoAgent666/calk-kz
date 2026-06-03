import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, X } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { QuickAnswer } from '../ui/QuickAnswer';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

interface Subject {
  id: number;
  name: string;
  grade: string; // 0-100 (КЗ система) или letter (A-F)
  credits: string; // кредиты (от 3 до 8 обычно)
}

// КЗ система оценок ECTS (4-балльная)
// 95-100 — A (4.0), 90-94 — A- (3.67), 85-89 — B+ (3.33), 80-84 — B (3.0)
// 75-79 — B- (2.67), 70-74 — C+ (2.33), 65-69 — C (2.0), 60-64 — C- (1.67)
// 55-59 — D+ (1.33), 50-54 — D (1.0), 0-49 — F (0)

function gradeToGPA(score: number): number {
  if (score >= 95) return 4.0;
  if (score >= 90) return 3.67;
  if (score >= 85) return 3.33;
  if (score >= 80) return 3.0;
  if (score >= 75) return 2.67;
  if (score >= 70) return 2.33;
  if (score >= 65) return 2.0;
  if (score >= 60) return 1.67;
  if (score >= 55) return 1.33;
  if (score >= 50) return 1.0;
  return 0;
}

function gradeToLetter(score: number): string {
  if (score >= 95) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'B-';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'C-';
  if (score >= 55) return 'D+';
  if (score >= 50) return 'D';
  return 'F';
}

// GPA в разные системы (США, ЕС/ECTS, Россия 5-балльная, Великобритания)
function gpaToUS(gpa: number): string { return gpa.toFixed(2); } // US 4.0
function gpaToRussia5(gpa: number): string {
  // Примерное соответствие: 4.0 — 5, 3.0 — 4, 2.0 — 3, <2.0 — 2
  if (gpa >= 3.5) return '5';
  if (gpa >= 2.5) return '4';
  if (gpa >= 1.5) return '3';
  return '2';
}
function gpaToUK(gpa: number): string {
  if (gpa >= 3.7) return 'First (70+)';
  if (gpa >= 3.3) return 'Upper Second / 2:1 (60-69)';
  if (gpa >= 2.7) return 'Lower Second / 2:2 (50-59)';
  if (gpa >= 2.0) return 'Third (40-49)';
  return 'Fail (<40)';
}
function gpaToClassification(gpa: number): string {
  if (gpa >= 3.67) return 'Отлично (Excellent)';
  if (gpa >= 3.0) return 'Хорошо (Good)';
  if (gpa >= 2.0) return 'Удовлетворительно';
  return 'Неудовлетворительно';
}

export default function GPACalculator() {
  const { t } = useTranslation('calculators');
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 1, name: 'Математика', grade: '85', credits: '5' },
    { id: 2, name: 'Информатика', grade: '92', credits: '6' },
    { id: 3, name: 'История', grade: '78', credits: '3' },
  ]);

  const addSubject = () => {
    const newId = Math.max(0, ...subjects.map(s => s.id)) + 1;
    setSubjects([...subjects, { id: newId, name: `${t('gpa.subject')} ${newId}`, grade: '', credits: '3' }]);
  };

  const removeSubject = (id: number) => setSubjects(subjects.filter(s => s.id !== id));

  const updateSubject = (id: number, field: keyof Subject, value: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const results = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    let totalScore = 0;
    let count = 0;
    const valid = subjects.filter(s => s.grade && s.credits);
    valid.forEach(s => {
      const score = parseFloat(s.grade) || 0;
      const credits = parseFloat(s.credits) || 0;
      const gpa = gradeToGPA(score);
      totalPoints += gpa * credits;
      totalCredits += credits;
      totalScore += score;
      count++;
    });

    if (totalCredits === 0) return null;

    const weightedGPA = totalPoints / totalCredits;
    const avgScore = count > 0 ? totalScore / count : 0;

    return {
      weightedGPA: weightedGPA.toFixed(2),
      weightedGPANum: weightedGPA,
      totalCredits,
      avgScore: avgScore.toFixed(1),
      classification: gpaToClassification(weightedGPA),
      letter: gradeToLetter(avgScore),
      russia5: gpaToRussia5(weightedGPA),
      uk: gpaToUK(weightedGPA),
    };
  }, [subjects]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('gpa.title')}</h1>
          <p className="text-gray-600">{t('gpa.subtitle')}</p>
        </div>
      </div>

      <QuickAnswer calculatorId="gpa" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 px-2">
          <div className="col-span-5">{t('gpa.subject')}</div>
          <div className="col-span-3">{t('gpa.grade')} (0-100)</div>
          <div className="col-span-2">{t('gpa.credits')}</div>
          <div className="col-span-2">GPA</div>
        </div>

        {subjects.map(s => {
          const score = parseFloat(s.grade);
          const gpa = !isNaN(score) ? gradeToGPA(score) : 0;
          const letter = !isNaN(score) ? gradeToLetter(score) : '';
          return (
            <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
              <input value={s.name} onChange={e => updateSubject(s.id, 'name', e.target.value)}
                className="col-span-5 px-2 py-2 border border-gray-300 rounded text-sm" />
              <input type="number" min="0" max="100" value={s.grade} onChange={e => updateSubject(s.id, 'grade', e.target.value)}
                className="col-span-3 px-2 py-2 border border-gray-300 rounded text-sm text-center" />
              <input type="number" min="1" max="10" value={s.credits} onChange={e => updateSubject(s.id, 'credits', e.target.value)}
                className="col-span-2 px-2 py-2 border border-gray-300 rounded text-sm text-center" />
              <div className="col-span-1 text-sm text-gray-700 text-center">
                {gpa > 0 ? `${gpa.toFixed(2)} (${letter})` : ''}
              </div>
              <button onClick={() => removeSubject(s.id)} className="col-span-1 text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        <button onClick={addSubject}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> {t('gpa.addSubject')}
        </button>

        {results && (
          <>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-300 text-center">
              <div className="text-sm text-gray-600">{t('gpa.weightedGPA')}</div>
              <div className="text-6xl font-bold text-purple-700">{results.weightedGPA}</div>
              <div className="text-sm font-medium text-purple-800 mt-1">{results.classification}</div>
              <div className="text-xs text-gray-500 mt-1">
                {t('gpa.credits')}: {results.totalCredits} • {t('gpa.avgScore')}: {results.avgScore} • {results.letter}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600">🇺🇸 US GPA (4.0)</div>
                <div className="text-xl font-bold">{gpaToUS(results.weightedGPANum)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600">🇷🇺 {t('gpa.russia5')}</div>
                <div className="text-xl font-bold">{results.russia5}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600">🇬🇧 UK Classification</div>
                <div className="text-sm font-bold">{results.uk}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('gpa.title'),
              sections: [{ title: t('gpa.resultsTitle'), data: [
                { label: t('gpa.weightedGPA'), value: results.weightedGPA },
                { label: t('gpa.avgScore'), value: `${results.avgScore} (${results.letter})` },
                { label: t('gpa.credits'), value: `${results.totalCredits}` },
                { label: t('gpa.russia5'), value: results.russia5 },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="gpa"
          />
        </div>
      )}

      <ExpertBlock />
      <CalculatorExamples calculatorId="gpa" />
      <MethodologySection steps={getMethodology('gpa')} />
      <FAQSection items={[
        { question: t('gpa.faq.q1'), answer: t('gpa.faq.a1') },
        { question: t('gpa.faq.q2'), answer: t('gpa.faq.a2') },
        { question: t('gpa.faq.q3'), answer: t('gpa.faq.a3') },
        { question: t('gpa.faq.q4'), answer: t('gpa.faq.a4') },
        { question: t('gpa.faq.q5'), answer: t('gpa.faq.a5') },
      ]} 
          sources={getSources('gpa')}
        />
      <EmbedWidget calculatorId="gpa" calculatorTitle={t('gpa.title')} />
      <LastUpdated calculatorId="gpa" />
    </div>
  );
}
