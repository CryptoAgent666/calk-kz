import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, ArrowRightLeft } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

type Category = 'length' | 'weight' | 'volume' | 'temperature' | 'area' | 'speed';

type UnitMap = Record<string, number>;

// Все множители относительно базовой единицы категории
const UNITS: Record<Category, { units: UnitMap; base: string }> = {
  length: {
    base: 'meter',
    units: { millimeter: 0.001, centimeter: 0.01, meter: 1, kilometer: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344 }
  },
  weight: {
    base: 'kilogram',
    units: { milligram: 0.000001, gram: 0.001, kilogram: 1, ton: 1000, pound: 0.453592, ounce: 0.0283495 }
  },
  volume: {
    base: 'liter',
    units: { milliliter: 0.001, liter: 1, cubicmeter: 1000, gallon: 3.78541, cup: 0.24, fluidounce: 0.0295735 }
  },
  temperature: {
    base: 'celsius',
    units: { celsius: 1, fahrenheit: 1, kelvin: 1 } // специальная обработка
  },
  area: {
    base: 'squaremeter',
    units: { squaremeter: 1, squarekilometer: 1000000, hectare: 10000, acre: 4046.86, squarefoot: 0.092903 }
  },
  speed: {
    base: 'kmh',
    units: { kmh: 1, mph: 1.60934, ms: 3.6, knot: 1.852 }
  }
};

function convertTemp(value: number, from: string, to: string): number {
  // to celsius first
  let celsius = value;
  if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else if (from === 'kelvin') celsius = value - 273.15;

  // celsius to target
  if (to === 'celsius') return celsius;
  if (to === 'fahrenheit') return celsius * 9 / 5 + 32;
  if (to === 'kelvin') return celsius + 273.15;
  return celsius;
}

export default function UnitConverterCalculator() {
  const { t } = useTranslation('calculators');
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('centimeter');
  const [value, setValue] = useState<string>('1');

  // Reset units when category changes
  React.useEffect(() => {
    const keys = Object.keys(UNITS[category].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  }, [category]);

  const result = useMemo(() => {
    const n = parseFloat(value);
    if (isNaN(n)) return '';
    if (category === 'temperature') {
      return convertTemp(n, fromUnit, toUnit);
    }
    const fromMult = UNITS[category].units[fromUnit] || 1;
    const toMult = UNITS[category].units[toUnit] || 1;
    return (n * fromMult) / toMult;
  }, [value, fromUnit, toUnit, category]);

  const swap = () => {
    const f = fromUnit;
    setFromUnit(toUnit);
    setToUnit(f);
  };

  const categories: { id: Category; icon: string }[] = [
    { id: 'length', icon: '📏' }, { id: 'weight', icon: '⚖️' },
    { id: 'volume', icon: '🪣' }, { id: 'temperature', icon: '🌡️' },
    { id: 'area', icon: '📐' }, { id: 'speed', icon: '🚀' },
  ];

  const formatResult = (r: number | string) => {
    if (typeof r === 'string') return r;
    if (Math.abs(r) < 0.0001) return r.toExponential(4);
    if (Math.abs(r) > 1e9) return r.toExponential(4);
    return r.toLocaleString('ru-KZ', { maximumFractionDigits: 6 });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="unit-converter" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('unit-converter.title')}</h1>
          <p className="text-gray-600">{t('unit-converter.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('unit-converter.category')}</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`p-3 rounded-lg border text-sm ${category === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="text-xs">{t(`unit-converter.categories.${c.id}`)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-11 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('unit-converter.from')}</label>
            <input type="number" value={value} onChange={e => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2" />
            <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {Object.keys(UNITS[category].units).map(u => (
                <option key={u} value={u}>{t(`unit-converter.units.${u}`)}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1 flex justify-center">
            <button onClick={swap} className="p-3 bg-teal-100 rounded-full hover:bg-teal-200">
              <ArrowRightLeft className="w-5 h-5 text-teal-700" />
            </button>
          </div>
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('unit-converter.to')}</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-teal-50 mb-2 min-h-[42px] flex items-center font-semibold">
              {typeof result === 'number' ? formatResult(result) : ''}
            </div>
            <select value={toUnit} onChange={e => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {Object.keys(UNITS[category].units).map(u => (
                <option key={u} value={u}>{t(`unit-converter.units.${u}`)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200 text-center">
          <div className="text-sm text-gray-600 mb-1">{t('unit-converter.result')}</div>
          <div className="text-3xl font-bold text-teal-700">
            {value} {t(`unit-converter.units.${fromUnit}`)} = <br className="md:hidden" />
            {typeof result === 'number' ? formatResult(result) : ''} {t(`unit-converter.units.${toUnit}`)}
          </div>
        </div>
      </div>

      <ExpertBlock />
      <FAQSection items={[
        { question: t('unit-converter.faq.q1'), answer: t('unit-converter.faq.a1') },
        { question: t('unit-converter.faq.q2'), answer: t('unit-converter.faq.a2') },
        { question: t('unit-converter.faq.q3'), answer: t('unit-converter.faq.a3') },
        { question: t('unit-converter.faq.q4'), answer: t('unit-converter.faq.a4') },
        { question: t('unit-converter.faq.q5'), answer: t('unit-converter.faq.a5') },
      ]} 
          sources={getSources('unit-converter')}
        />
      <EmbedWidget calculatorId="unit-converter" calculatorTitle={t('unit-converter.title')} />
      <LastUpdated calculatorId="unit-converter" />
    </div>
  );
}
