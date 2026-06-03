import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid3x3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';

type Material = 'laminate' | 'parquet' | 'tile' | 'linoleum' | 'vinyl';

interface MaterialSpec {
  areaPerPack: number; // м² в упаковке
  pricePerM2: number; // ₸/м²
  reserve: number; // % запас (зависит от способа укладки)
}

const MATERIALS: Record<Material, MaterialSpec> = {
  laminate:  { areaPerPack: 2.4, pricePerM2: 4500, reserve: 5 },
  parquet:   { areaPerPack: 2.0, pricePerM2: 18000, reserve: 10 },
  tile:      { areaPerPack: 1.5, pricePerM2: 8000, reserve: 10 },
  linoleum:  { areaPerPack: 0, pricePerM2: 3500, reserve: 5 }, // рулон
  vinyl:     { areaPerPack: 3.3, pricePerM2: 6500, reserve: 5 },
};

type LayingMethod = 'straight' | 'diagonal';

export default function FlooringCalculator() {
  const { t } = useTranslation('calculators');
  const [material, setMaterial] = useState<Material>('laminate');
  const [length, setLength] = useState<string>('5');
  const [width, setWidth] = useState<string>('4');
  const [method, setMethod] = useState<LayingMethod>('straight');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [customPackArea, setCustomPackArea] = useState<string>('');

  const results = useMemo(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    if (l <= 0 || w <= 0) return null;

    const area = l * w;
    const spec = MATERIALS[material];
    const baseReserve = spec.reserve;
    const methodReserve = method === 'diagonal' ? 10 : 0;
    const totalReserve = baseReserve + methodReserve;

    const withReserve = area * (1 + totalReserve / 100);

    const packArea = parseFloat(customPackArea) || spec.areaPerPack;
    const price = parseFloat(customPrice) || spec.pricePerM2;

    const packs = packArea > 0 ? Math.ceil(withReserve / packArea) : 0;
    const actualArea = packs > 0 ? packs * packArea : withReserve;
    const totalCost = actualArea * price;

    // Подложка (только для ламината/паркета)
    const needsUnderlay = material === 'laminate' || material === 'parquet' || material === 'vinyl';
    const underlayArea = needsUnderlay ? withReserve : 0;
    const underlayPrice = needsUnderlay ? underlayArea * 600 : 0; // ~600 ₸/м²

    // Плинтус (периметр)
    const perimeter = 2 * (l + w);
    const skirtingLength = Math.ceil(perimeter * 1.05); // 5% на запил
    const skirtingPacks = Math.ceil(skirtingLength / 2.5); // 2.5 м/шт
    const skirtingPrice = skirtingPacks * 1200;

    return {
      area: area.toFixed(2),
      withReserve: withReserve.toFixed(2),
      totalReserve,
      packs,
      actualArea: actualArea.toFixed(2),
      totalCost: Math.round(totalCost),
      needsUnderlay,
      underlayArea: underlayArea.toFixed(2),
      underlayPrice: Math.round(underlayPrice),
      perimeter: perimeter.toFixed(2),
      skirtingLength,
      skirtingPacks,
      skirtingPrice: Math.round(skirtingPrice),
      grandTotal: Math.round(totalCost + underlayPrice + skirtingPrice),
    };
  }, [material, length, width, method, customPrice, customPackArea]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-yellow-700 rounded-lg flex items-center justify-center">
          <Grid3x3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('flooring.title')}</h1>
          <p className="text-gray-600">{t('flooring.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('flooring.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('flooring.material')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MATERIALS) as Material[]).map(m => (
                <button key={m} onClick={() => setMaterial(m)}
                  className={`p-3 rounded-lg border text-sm text-left ${material === m ? 'bg-amber-50 border-amber-500' : 'bg-white border-gray-300'}`}>
                  <div className="font-medium">{t(`flooring.materials.${m}`)}</div>
                  <div className="text-xs text-gray-500">~{MATERIALS[m].pricePerM2.toLocaleString()} ₸/м²</div>
                </button>
              ))}
            </div>
          </div>

          <RangeSlider label={t('flooring.length')} value={parseFloat(length) || 0} onChange={v => setLength(String(v))}
            min={1} max={20} step={0.1} formatValue={v => `${v} м`} />
          <RangeSlider label={t('flooring.width')} value={parseFloat(width) || 0} onChange={v => setWidth(String(v))}
            min={1} max={20} step={0.1} formatValue={v => `${v} м`} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('flooring.layingMethod')}</label>
            <div className="flex gap-2">
              <button onClick={() => setMethod('straight')}
                className={`flex-1 p-3 rounded-lg border ${method === 'straight' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300'}`}>
                {t('flooring.straight')} (5%)
              </button>
              <button onClick={() => setMethod('diagonal')}
                className={`flex-1 p-3 rounded-lg border ${method === 'diagonal' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-gray-300'}`}>
                {t('flooring.diagonal')} (15%)
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-gray-700">{t('flooring.customParams')}</div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('flooring.customPrice')}</label>
              <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                placeholder={`${MATERIALS[material].pricePerM2}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('flooring.customPackArea')}</label>
              <input type="number" step="0.1" value={customPackArea} onChange={e => setCustomPackArea(e.target.value)}
                placeholder={`${MATERIALS[material].areaPerPack}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('flooring.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
                <div className="text-sm text-gray-600">{t('flooring.area')}</div>
                <div className="text-4xl font-bold text-amber-700">{results.actualArea} м²</div>
                <div className="text-xs text-gray-500 mt-1">{t('flooring.basicArea')}: {results.area} м² + {results.totalReserve}% {t('flooring.reserveLabel')}</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>📦 {t('flooring.packs')}</span>
                  <span className="font-semibold">{results.packs} шт ({results.actualArea} м²)</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>💰 {t('flooring.materialCost')}</span>
                  <span className="font-semibold">{results.totalCost.toLocaleString('ru-KZ')} ₸</span>
                </div>
                {results.needsUnderlay && (
                  <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                    <span>🟦 {t('flooring.underlay')}</span>
                    <span className="font-semibold">{results.underlayPrice.toLocaleString()} ₸</span>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🧰 {t('flooring.skirting')}</span>
                  <span className="font-semibold">{results.skirtingLength} м • {results.skirtingPrice.toLocaleString()} ₸</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <div className="text-sm text-green-900">{t('flooring.grandTotal')}</div>
                <div className="text-2xl font-bold text-green-700">{results.grandTotal.toLocaleString('ru-KZ')} ₸</div>
                <div className="text-xs text-green-800">{t('flooring.totalNote')}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('flooring.title'),
              subtitle: t(`flooring.materials.${material}`),
              sections: [{ title: t('flooring.resultsTitle'), data: [
                { label: t('flooring.area'), value: `${results.actualArea} м²` },
                { label: t('flooring.packs'), value: `${results.packs} шт.` },
                { label: t('flooring.materialCost'), value: `${results.totalCost.toLocaleString()} ₸` },
                { label: t('flooring.grandTotal'), value: `${results.grandTotal.toLocaleString()} ₸` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="flooring"
          />
        </div>
      )}

      <LegalDisclaimer type="construction" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="flooring" />
      <FAQSection items={[
        { question: t('flooring.faq.q1'), answer: t('flooring.faq.a1') },
        { question: t('flooring.faq.q2'), answer: t('flooring.faq.a2') },
        { question: t('flooring.faq.q3'), answer: t('flooring.faq.a3') },
        { question: t('flooring.faq.q4'), answer: t('flooring.faq.a4') },
        { question: t('flooring.faq.q5'), answer: t('flooring.faq.a5') },
      ]} 
          sources={getSources('flooring')}
        />
      <EmbedWidget calculatorId="flooring" calculatorTitle={t('flooring.title')} />
      <LastUpdated calculatorId="flooring" />
    </div>
  );
}
