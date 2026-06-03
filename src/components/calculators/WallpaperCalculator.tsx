import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';

type RollSize = '0.53x10' | '0.53x15' | '1.06x10' | '1.06x25';
const ROLLS: Record<RollSize, { width: number; length: number; label: string }> = {
  '0.53x10': { width: 0.53, length: 10, label: '0.53 × 10 м (стандарт)' },
  '0.53x15': { width: 0.53, length: 15, label: '0.53 × 15 м' },
  '1.06x10': { width: 1.06, length: 10, label: '1.06 × 10 м (метровые)' },
  '1.06x25': { width: 1.06, length: 25, label: '1.06 × 25 м' },
};

export default function WallpaperCalculator() {
  const { t } = useTranslation('calculators');
  const [length, setLength] = useState<string>('5');
  const [width, setWidth] = useState<string>('4');
  const [height, setHeight] = useState<string>('2.7');
  const [doors, setDoors] = useState<string>('1.8'); // м² (дверь)
  const [windows, setWindows] = useState<string>('3'); // м² (окна)
  const [rollSize, setRollSize] = useState<RollSize>('0.53x10');
  const [pattern, setPattern] = useState<string>('0'); // шаг рапорта, см
  const [rollPrice, setRollPrice] = useState<string>('6000');

  const results = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const d = parseFloat(doors) || 0;
    const win = parseFloat(windows) || 0;
    const p = parseFloat(pattern) || 0;
    const price = parseFloat(rollPrice) || 0;

    if (l <= 0 || w <= 0 || h <= 0) return null;

    const perimeter = 2 * (l + w); // м
    const wallArea = perimeter * h - d - win; // м²
    if (wallArea <= 0) return null;

    const roll = ROLLS[rollSize];
    // Количество полос
    const stripWidth = roll.width;
    const stripsNeeded = Math.ceil(perimeter / stripWidth);

    // Длина одной полосы с учётом рапорта
    const stripLength = h + (p / 100); // с подгонкой рисунка (рапорт в см → м)
    // Полос из одного рулона
    const stripsPerRoll = Math.floor(roll.length / stripLength);

    if (stripsPerRoll <= 0) return null;

    const rollsNeeded = Math.ceil(stripsNeeded / stripsPerRoll);
    const totalCost = rollsNeeded * price;

    // Клей: 1 пачка на 3-5 рулонов
    const glueBags = Math.ceil(rollsNeeded / 4);

    return {
      perimeter: perimeter.toFixed(2),
      wallArea: wallArea.toFixed(2),
      stripsNeeded,
      stripLength: stripLength.toFixed(2),
      stripsPerRoll,
      rollsNeeded,
      totalCost: Math.round(totalCost),
      glueBags,
    };
  }, [length, width, height, doors, windows, rollSize, pattern, rollPrice]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('wallpaper.title')}</h1>
          <p className="text-gray-600">{t('wallpaper.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('wallpaper.parameters')}</h2>

          <h3 className="font-medium text-gray-900">{t('wallpaper.roomDims')}</h3>
          <RangeSlider label={t('wallpaper.length')} value={parseFloat(length) || 0} onChange={v => setLength(String(v))}
            min={1} max={20} step={0.1} formatValue={v => `${v} м`} />
          <RangeSlider label={t('wallpaper.width')} value={parseFloat(width) || 0} onChange={v => setWidth(String(v))}
            min={1} max={20} step={0.1} formatValue={v => `${v} м`} />
          <RangeSlider label={t('wallpaper.height')} value={parseFloat(height) || 0} onChange={v => setHeight(String(v))}
            min={2} max={5} step={0.05} formatValue={v => `${v} м`} />

          <RangeSlider label={t('wallpaper.doors')} value={parseFloat(doors) || 0} onChange={v => setDoors(String(v))}
            min={0} max={10} step={0.1} formatValue={v => `${v} м²`} />
          <RangeSlider label={t('wallpaper.windows')} value={parseFloat(windows) || 0} onChange={v => setWindows(String(v))}
            min={0} max={20} step={0.1} formatValue={v => `${v} м²`} />

          <h3 className="font-medium text-gray-900 pt-2 border-t">{t('wallpaper.rollParams')}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('wallpaper.rollSize')}</label>
            <select value={rollSize} onChange={e => setRollSize(e.target.value as RollSize)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {(Object.keys(ROLLS) as RollSize[]).map(r => (
                <option key={r} value={r}>{ROLLS[r].label}</option>
              ))}
            </select>
          </div>

          <RangeSlider label={t('wallpaper.pattern')} value={parseFloat(pattern) || 0} onChange={v => setPattern(String(v))}
            min={0} max={100} step={5} formatValue={v => `${v} см`} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('wallpaper.rollPrice')}</label>
            <input type="number" value={rollPrice} onChange={e => setRollPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('wallpaper.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg p-6 border border-purple-200">
                <div className="text-sm text-gray-600">{t('wallpaper.rollsNeeded')}</div>
                <div className="text-5xl font-bold text-purple-700">{results.rollsNeeded} рулонов</div>
                <div className="text-xs text-gray-500 mt-1">{t('wallpaper.wallArea')}: {results.wallArea} м²</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('wallpaper.perimeter')}</span>
                  <span className="font-semibold">{results.perimeter} м</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('wallpaper.stripsNeeded')}</span>
                  <span className="font-semibold">{results.stripsNeeded} {t('wallpaper.strips')}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('wallpaper.stripLength')}</span>
                  <span className="font-semibold">{results.stripLength} м</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('wallpaper.stripsPerRoll')}</span>
                  <span className="font-semibold">{results.stripsPerRoll} шт</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🧪 {t('wallpaper.glue')}</span>
                  <span className="font-semibold">{results.glueBags} {t('wallpaper.packs')}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-900">{t('wallpaper.totalCost')}</div>
                <div className="text-2xl font-bold text-amber-700">{results.totalCost.toLocaleString('ru-KZ')} ₸</div>
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('wallpaper.title'),
              sections: [{ title: t('wallpaper.resultsTitle'), data: [
                { label: t('wallpaper.rollsNeeded'), value: `${results.rollsNeeded} рулонов` },
                { label: t('wallpaper.wallArea'), value: `${results.wallArea} м²` },
                { label: t('wallpaper.totalCost'), value: `${results.totalCost.toLocaleString()} ₸` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="wallpaper"
          />
        </div>
      )}

      <LegalDisclaimer type="construction" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="wallpaper" />
      <FAQSection items={[
        { question: t('wallpaper.faq.q1'), answer: t('wallpaper.faq.a1') },
        { question: t('wallpaper.faq.q2'), answer: t('wallpaper.faq.a2') },
        { question: t('wallpaper.faq.q3'), answer: t('wallpaper.faq.a3') },
        { question: t('wallpaper.faq.q4'), answer: t('wallpaper.faq.a4') },
        { question: t('wallpaper.faq.q5'), answer: t('wallpaper.faq.a5') },
      ]} 
          sources={getSources('wallpaper')}
        />
      <EmbedWidget calculatorId="wallpaper" calculatorTitle={t('wallpaper.title')} />
      <LastUpdated calculatorId="wallpaper" />
    </div>
  );
}
