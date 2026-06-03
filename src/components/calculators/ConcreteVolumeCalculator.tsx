import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

type Shape = 'slab' | 'column' | 'foundation' | 'stairs';

// Пропорции для бетона М200 (средняя марка)
// На 1 м³: цемент ~320 кг, песок ~640 кг, щебень ~1200 кг, вода ~170 л
const CEMENT_PER_M3 = 320; // кг
const SAND_PER_M3 = 640; // кг
const GRAVEL_PER_M3 = 1200; // кг
const WATER_PER_M3 = 170; // л

// Цены 2026 (Казахстан, ориентировочно)
const CEMENT_PRICE_KG = 55; // ₸/кг
const SAND_PRICE_KG = 8;
const GRAVEL_PRICE_KG = 12;

export default function ConcreteVolumeCalculator() {
  const { t } = useTranslation('calculators');
  const [shape, setShape] = useState<Shape>('slab');
  const [length, setLength] = useState<string>('5');
  const [width, setWidth] = useState<string>('3');
  const [depth, setDepth] = useState<string>('0.2');
  const [diameter, setDiameter] = useState<string>('0.3'); // для колонны
  const [stepCount, setStepCount] = useState<string>('10'); // ступени
  const [stepHeight, setStepHeight] = useState<string>('0.17');
  const [stepDepth, setStepDepth] = useState<string>('0.3');
  const [reserve, setReserve] = useState<string>('10'); // % запас

  const results = useMemo(() => {
    let volume = 0;
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const d = parseFloat(depth) || 0;
    const dia = parseFloat(diameter) || 0;
    const h = parseFloat(stepHeight) || 0;
    const sd = parseFloat(stepDepth) || 0;
    const sc = parseFloat(stepCount) || 0;

    if (shape === 'slab' || shape === 'foundation') {
      volume = l * w * d;
    } else if (shape === 'column') {
      volume = Math.PI * (dia / 2) ** 2 * d;
    } else if (shape === 'stairs') {
      // Сумма ступеней (треугольник × ширина) + нижняя плита
      volume = 0;
      for (let i = 0; i < sc; i++) {
        volume += 0.5 * (i + 1) * h * sd * w;
      }
    }

    if (volume <= 0) return null;

    const res = parseFloat(reserve) || 0;
    const volumeWithReserve = volume * (1 + res / 100);

    const cement = volumeWithReserve * CEMENT_PER_M3;
    const sand = volumeWithReserve * SAND_PER_M3;
    const gravel = volumeWithReserve * GRAVEL_PER_M3;
    const water = volumeWithReserve * WATER_PER_M3;

    const cementPrice = cement * CEMENT_PRICE_KG;
    const sandPrice = sand * SAND_PRICE_KG;
    const gravelPrice = gravel * GRAVEL_PRICE_KG;
    const totalPrice = cementPrice + sandPrice + gravelPrice;

    // Мешков цемента (50 кг)
    const cementBags = Math.ceil(cement / 50);

    return {
      volume: volume.toFixed(3),
      volumeWithReserve: volumeWithReserve.toFixed(3),
      cement: Math.round(cement),
      cementBags,
      sand: Math.round(sand),
      gravel: Math.round(gravel),
      water: Math.round(water),
      totalPrice: Math.round(totalPrice),
    };
  }, [shape, length, width, depth, diameter, stepHeight, stepDepth, stepCount, reserve]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-slate-700 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('concrete.title')}</h1>
          <p className="text-gray-600">{t('concrete.subtitle')}</p>
        </div>
      </div>

      <QuickAnswer calculatorId="concrete-volume" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('concrete.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('concrete.shape')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['slab', 'foundation', 'column', 'stairs'] as Shape[]).map(s => (
                <button key={s} onClick={() => setShape(s)}
                  className={`p-3 rounded-lg border text-sm ${shape === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-gray-300'}`}>
                  {t(`concrete.shapes.${s}`)}
                </button>
              ))}
            </div>
          </div>

          {(shape === 'slab' || shape === 'foundation') && (
            <>
              <RangeSlider label={t('concrete.length')} value={parseFloat(length) || 0} onChange={v => setLength(String(v))}
                min={0.1} max={50} step={0.1} formatValue={v => `${v} м`} />
              <RangeSlider label={t('concrete.width')} value={parseFloat(width) || 0} onChange={v => setWidth(String(v))}
                min={0.1} max={50} step={0.1} formatValue={v => `${v} м`} />
              <RangeSlider label={t('concrete.depth')} value={parseFloat(depth) || 0} onChange={v => setDepth(String(v))}
                min={0.05} max={3} step={0.05} formatValue={v => `${v} м`} />
            </>
          )}

          {shape === 'column' && (
            <>
              <RangeSlider label={t('concrete.diameter')} value={parseFloat(diameter) || 0} onChange={v => setDiameter(String(v))}
                min={0.1} max={2} step={0.05} formatValue={v => `${v} м`} />
              <RangeSlider label={t('concrete.height')} value={parseFloat(depth) || 0} onChange={v => setDepth(String(v))}
                min={0.5} max={20} step={0.1} formatValue={v => `${v} м`} />
            </>
          )}

          {shape === 'stairs' && (
            <>
              <RangeSlider label={t('concrete.stepCount')} value={parseFloat(stepCount) || 0} onChange={v => setStepCount(String(v))}
                min={2} max={50} step={1} formatValue={v => `${v} шт.`} />
              <RangeSlider label={t('concrete.stepHeight')} value={parseFloat(stepHeight) || 0} onChange={v => setStepHeight(String(v))}
                min={0.1} max={0.25} step={0.01} formatValue={v => `${v} м`} />
              <RangeSlider label={t('concrete.stepDepth')} value={parseFloat(stepDepth) || 0} onChange={v => setStepDepth(String(v))}
                min={0.2} max={0.5} step={0.01} formatValue={v => `${v} м`} />
              <RangeSlider label={t('concrete.width')} value={parseFloat(width) || 0} onChange={v => setWidth(String(v))}
                min={0.5} max={5} step={0.1} formatValue={v => `${v} м`} />
            </>
          )}

          <RangeSlider label={t('concrete.reserve')} value={parseFloat(reserve) || 0} onChange={v => setReserve(String(v))}
            min={0} max={30} step={1} formatValue={v => `${v}%`} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('concrete.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-6 border border-slate-300">
                <div className="text-sm text-gray-600">{t('concrete.totalVolume')}</div>
                <div className="text-4xl font-bold text-slate-800">{results.volumeWithReserve} м³</div>
                <div className="text-xs text-gray-500 mt-1">{t('concrete.basicVolume')}: {results.volume} м³ + {reserve}% {t('concrete.reserveLabel')}</div>
              </div>

              <div className="space-y-2">
                <div className="font-medium text-gray-900 mb-2">{t('concrete.materials')} (М200)</div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🏭 {t('concrete.cement')}</span>
                  <span className="font-semibold">{results.cement} кг ({results.cementBags} {t('concrete.bags')})</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🏖 {t('concrete.sand')}</span>
                  <span className="font-semibold">{results.sand} кг</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🪨 {t('concrete.gravel')}</span>
                  <span className="font-semibold">{results.gravel} кг</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>💧 {t('concrete.water')}</span>
                  <span className="font-semibold">{results.water} л</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-900">{t('concrete.estimatedCost')}</div>
                <div className="text-2xl font-bold text-amber-700">{results.totalPrice.toLocaleString('ru-KZ')} ₸</div>
                <div className="text-xs text-amber-800">{t('concrete.costNote')}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('concrete.title'),
              subtitle: t(`concrete.shapes.${shape}`),
              sections: [{ title: t('concrete.resultsTitle'), data: [
                { label: t('concrete.totalVolume'), value: `${results.volumeWithReserve} м³` },
                { label: t('concrete.cement'), value: `${results.cement} кг` },
                { label: t('concrete.sand'), value: `${results.sand} кг` },
                { label: t('concrete.gravel'), value: `${results.gravel} кг` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="concrete"
          />
        </div>
      )}

      <LegalDisclaimer type="construction" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="concrete-volume" />
      <MethodologySection steps={getMethodology('concrete-volume')} />
      <FAQSection items={[
        { question: t('concrete.faq.q1'), answer: t('concrete.faq.a1') },
        { question: t('concrete.faq.q2'), answer: t('concrete.faq.a2') },
        { question: t('concrete.faq.q3'), answer: t('concrete.faq.a3') },
        { question: t('concrete.faq.q4'), answer: t('concrete.faq.a4') },
        { question: t('concrete.faq.q5'), answer: t('concrete.faq.a5') },
      ]} 
          sources={getSources('concrete-volume')}
        />
      <EmbedWidget calculatorId="concrete" calculatorTitle={t('concrete.title')} />
      <LastUpdated calculatorId="concrete-volume" />
    </div>
  );
}
