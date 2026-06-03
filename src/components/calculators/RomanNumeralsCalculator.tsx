import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, ArrowRightLeft, Copy } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
];

function toRoman(n: number): string {
  if (n < 1 || n > 3999) return '';
  let result = '';
  let num = Math.floor(n);
  for (const [val, sym] of ROMAN_MAP) {
    while (num >= val) {
      result += sym;
      num -= val;
    }
  }
  return result;
}

function fromRoman(s: string): number {
  const upper = s.toUpperCase().trim();
  if (!/^[MDCLXVI]+$/.test(upper)) return 0;
  const VALS: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const curr = VALS[upper[i]];
    const next = VALS[upper[i + 1]];
    if (next && next > curr) {
      total += next - curr;
      i++;
    } else {
      total += curr;
    }
  }
  // Validate: re-convert and compare
  return toRoman(total) === upper ? total : 0;
}

const EXAMPLES: { n: number; label: string }[] = [
  { n: 2026, label: 'Текущий год' },
  { n: 1999, label: '1999' },
  { n: 2000, label: 'Миллениум' },
  { n: 500, label: 'D' },
  { n: 100, label: 'C' },
  { n: 50, label: 'L' },
];

export default function RomanNumeralsCalculator() {
  const { t } = useTranslation('calculators');
  const [mode, setMode] = useState<'toRoman' | 'fromRoman'>('toRoman');
  const [arabicInput, setArabicInput] = useState<string>('2026');
  const [romanInput, setRomanInput] = useState<string>('MMXXVI');
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    if (mode === 'toRoman') {
      const n = parseInt(arabicInput);
      if (isNaN(n) || n < 1 || n > 3999) return { value: '', error: t('roman-numerals.errorRange') };
      return { value: toRoman(n), error: '' };
    } else {
      const n = fromRoman(romanInput);
      if (n === 0) return { value: '', error: t('roman-numerals.errorInvalid') };
      return { value: String(n), error: '' };
    }
  }, [mode, arabicInput, romanInput, t]);

  const handleCopy = async () => {
    if (result.value) {
      await navigator.clipboard.writeText(result.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="roman-numerals" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
          <Hash className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('roman-numerals.title')}</h1>
          <p className="text-gray-600">{t('roman-numerals.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex gap-2">
          <button onClick={() => setMode('toRoman')}
            className={`flex-1 p-3 rounded-lg border ${mode === 'toRoman' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300'}`}>
            {t('roman-numerals.toRoman')}
          </button>
          <button onClick={() => setMode('fromRoman')}
            className={`flex-1 p-3 rounded-lg border ${mode === 'fromRoman' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300'}`}>
            {t('roman-numerals.fromRoman')}
          </button>
        </div>

        {mode === 'toRoman' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('roman-numerals.arabicInput')}</label>
            <input type="number" value={arabicInput} onChange={e => setArabicInput(e.target.value)}
              min="1" max="3999"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg text-center font-mono" />
            <p className="text-xs text-gray-500 mt-1">{t('roman-numerals.rangeHint')}</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('roman-numerals.romanInput')}</label>
            <input type="text" value={romanInput} onChange={e => setRomanInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg text-center font-mono uppercase" />
            <p className="text-xs text-gray-500 mt-1">{t('roman-numerals.validChars')}: I V X L C D M</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200 text-center">
          <div className="text-sm text-gray-600 mb-2">{t('roman-numerals.result')}</div>
          {result.error ? (
            <div className="text-red-600">{result.error}</div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl font-bold text-amber-700 font-mono">{result.value}</div>
              <button onClick={handleCopy}
                className="p-2 bg-white rounded-lg border border-amber-300 hover:bg-amber-50">
                <Copy className="w-4 h-4 text-amber-700" />
              </button>
            </div>
          )}
          {copied && <div className="text-xs text-green-600 mt-2">{t('roman-numerals.copied')}</div>}
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3">{t('roman-numerals.examples')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {EXAMPLES.map(ex => (
              <button key={ex.n}
                onClick={() => { setMode('toRoman'); setArabicInput(String(ex.n)); }}
                className="p-2 bg-gray-50 hover:bg-amber-50 rounded-lg text-sm text-left">
                <div className="font-mono font-semibold">{ex.n} = {toRoman(ex.n)}</div>
                <div className="text-xs text-gray-500">{ex.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">{t('roman-numerals.reference')}</h3>
          <div className="grid grid-cols-4 gap-2 text-sm font-mono text-blue-900">
            <div>I = 1</div><div>V = 5</div><div>X = 10</div><div>L = 50</div>
            <div>C = 100</div><div>D = 500</div><div>M = 1000</div>
            <div>IV = 4</div>
          </div>
        </div>
      </div>

      <ExpertBlock />
      <FAQSection items={[
        { question: t('roman-numerals.faq.q1'), answer: t('roman-numerals.faq.a1') },
        { question: t('roman-numerals.faq.q2'), answer: t('roman-numerals.faq.a2') },
        { question: t('roman-numerals.faq.q3'), answer: t('roman-numerals.faq.a3') },
        { question: t('roman-numerals.faq.q4'), answer: t('roman-numerals.faq.a4') },
        { question: t('roman-numerals.faq.q5'), answer: t('roman-numerals.faq.a5') },
      ]} 
          sources={getSources('roman-numerals')}
        />
      <EmbedWidget calculatorId="roman-numerals" calculatorTitle={t('roman-numerals.title')} />
      <LastUpdated calculatorId="roman-numerals" />
    </div>
  );
}
