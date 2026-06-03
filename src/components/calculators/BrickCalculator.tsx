import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Square } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

type BrickType = 'single' | 'oneAndHalf' | 'double' | 'block' | 'gasBlock';

interface BrickSpec {
  length: number;  // мм
  width: number;
  height: number;
  perM3: number;   // шт на 1 м³ кладки (с учётом швов раствора 10 мм)
  price: number;   // ₸/шт
}

const BRICKS: Record<BrickType, BrickSpec> = {
  single:        { length: 250, width: 120, height: 65, perM3: 394, price: 80 },
  oneAndHalf:    { length: 250, width: 120, height: 88, perM3: 302, price: 110 },
  double:        { length: 250, width: 120, height: 138, perM3: 200, price: 150 },
  block:         { length: 390, width: 190, height: 188, perM3: 62, price: 320 },
  gasBlock:      { length: 600, width: 300, height: 200, perM3: 27, price: 550 },
};

type Thickness = 'half' | 'one' | 'oneAndHalf' | 'two';
const THICKNESS_M: Record<Thickness, number> = {
  half: 0.12,       // полкирпича
  one: 0.25,        // 1 кирпич
  oneAndHalf: 0.38, // 1.5 кирпича
  two: 0.51,        // 2 кирпича
};

export default function BrickCalculator() {
  const { t } = useTranslation('calculators');
  const [brickType, setBrickType] = useState<BrickType>('single');
  const [thickness, setThickness] = useState<Thickness>('one');
  const [wallLength, setWallLength] = useState<string>('10');
  const [wallHeight, setWallHeight] = useState<string>('3');
  const [doors, setDoors] = useState<string>('0'); // м²
  const [windows, setWindows] = useState<string>('0');
  const [reserve, setReserve] = useState<string>('5');

  const results = useMemo(() => {
    const l = parseFloat(wallLength) || 0;
    const h = parseFloat(wallHeight) || 0;
    const d = parseFloat(doors) || 0;
    const w = parseFloat(windows) || 0;
    const r = parseFloat(reserve) || 0;
    const th = THICKNESS_M[thickness];

    if (l <= 0 || h <= 0) return null;

    const wallArea = l * h - d - w; // м²
    if (wallArea <= 0) return null;

    const volume = wallArea * th; // м³
    const volumeReserve = volume * (1 + r / 100);

    const brickCount = Math.ceil(volumeReserve * BRICKS[brickType].perM3);

    // Раствор: ~0.25 м³ на 1 м³ кладки
    const mortarVolume = volume * 0.25;
    const cementKg = mortarVolume * 320; // кг цемента на 1 м³ раствора
    const sandKg = mortarVolume * 1200;

    const brickPrice = brickCount * BRICKS[brickType].price;
    const cementPrice = cementKg * 55;
    const sandPrice = sandKg * 8;
    const totalPrice = brickPrice + cementPrice + sandPrice;

    // Вес стены (ориентир для фундамента)
    const density = brickType === 'gasBlock' ? 500 : brickType === 'block' ? 1200 : 1800; // кг/м³
    const wallWeight = volume * density;

    return {
      wallArea: wallArea.toFixed(2),
      volume: volume.toFixed(3),
      brickCount,
      mortarVolume: mortarVolume.toFixed(3),
      cementKg: Math.round(cementKg),
      sandKg: Math.round(sandKg),
      cementBags: Math.ceil(cementKg / 50),
      brickPrice: Math.round(brickPrice),
      totalPrice: Math.round(totalPrice),
      wallWeight: Math.round(wallWeight),
    };
  }, [brickType, thickness, wallLength, wallHeight, doors, windows, reserve]);

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="brick" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-700 rounded-lg flex items-center justify-center">
          <Square className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('brick.title')}</h1>
          <p className="text-gray-600">{t('brick.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('brick.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('brick.brickType')}</label>
            <div className="space-y-2">
              {(Object.keys(BRICKS) as BrickType[]).map(b => (
                <button key={b} onClick={() => setBrickType(b)}
                  className={`w-full p-3 rounded-lg border text-left text-sm ${brickType === b ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-300'}`}>
                  <div className="font-medium">{t(`brick.types.${b}`)}</div>
                  <div className="text-xs text-gray-500">{BRICKS[b].length}×{BRICKS[b].width}×{BRICKS[b].height} мм • {BRICKS[b].perM3} шт/м³ • {BRICKS[b].price} ₸/шт</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('brick.thickness')}</label>
            <div className="grid grid-cols-4 gap-2">
              {(['half', 'one', 'oneAndHalf', 'two'] as Thickness[]).map(th => (
                <button key={th} onClick={() => setThickness(th)}
                  className={`p-2 rounded-lg border text-sm ${thickness === th ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-gray-300'}`}>
                  {t(`brick.thicknessLabels.${th}`)}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">{THICKNESS_M[thickness]} м</div>
          </div>

          <RangeSlider label={t('brick.wallLength')} value={parseFloat(wallLength) || 0} onChange={v => setWallLength(String(v))}
            min={1} max={100} step={0.5} formatValue={v => `${v} м`} />
          <RangeSlider label={t('brick.wallHeight')} value={parseFloat(wallHeight) || 0} onChange={v => setWallHeight(String(v))}
            min={1} max={10} step={0.1} formatValue={v => `${v} м`} />
          <RangeSlider label={t('brick.doors')} value={parseFloat(doors) || 0} onChange={v => setDoors(String(v))}
            min={0} max={20} step={0.5} formatValue={v => `${v} м²`} />
          <RangeSlider label={t('brick.windows')} value={parseFloat(windows) || 0} onChange={v => setWindows(String(v))}
            min={0} max={30} step={0.5} formatValue={v => `${v} м²`} />
          <RangeSlider label={t('brick.reserve')} value={parseFloat(reserve) || 0} onChange={v => setReserve(String(v))}
            min={0} max={15} step={1} formatValue={v => `${v}%`} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('brick.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                <div className="text-sm text-gray-600">{t('brick.brickCount')}</div>
                <div className="text-4xl font-bold text-orange-700">{results.brickCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">{t('brick.wallArea')}: {results.wallArea} м² • {t('brick.volume')}: {results.volume} м³</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🧱 {t('brick.bricks')}</span>
                  <span className="font-semibold">{results.brickPrice.toLocaleString()} ₸</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🥣 {t('brick.mortar')}</span>
                  <span className="font-semibold">{results.mortarVolume} м³</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🏭 {t('brick.cement')}</span>
                  <span className="font-semibold">{results.cementKg} кг ({results.cementBags} {t('brick.bags')})</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🏖 {t('brick.sand')}</span>
                  <span className="font-semibold">{results.sandKg} кг</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-900">{t('brick.estimatedCost')}</div>
                <div className="text-2xl font-bold text-amber-700">{results.totalPrice.toLocaleString()} ₸</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
                💡 {t('brick.wallWeight')}: {(results.wallWeight / 1000).toFixed(1)} т ({t('brick.foundationNote')})
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('brick.title'),
              subtitle: t(`brick.types.${brickType}`),
              sections: [{ title: t('brick.resultsTitle'), data: [
                { label: t('brick.brickCount'), value: `${results.brickCount} шт.` },
                { label: t('brick.cement'), value: `${results.cementKg} кг` },
                { label: t('brick.sand'), value: `${results.sandKg} кг` },
                { label: t('brick.estimatedCost'), value: `${results.totalPrice.toLocaleString()} ₸` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="brick"
          />
        </div>
      )}

      <LegalDisclaimer type="construction" />
      <ExpertBlock />
      <MethodologySection steps={getMethodology('brick')} />
      <FAQSection items={[
        { question: t('brick.faq.q1'), answer: t('brick.faq.a1') },
        { question: t('brick.faq.q2'), answer: t('brick.faq.a2') },
        { question: t('brick.faq.q3'), answer: t('brick.faq.a3') },
        { question: t('brick.faq.q4'), answer: t('brick.faq.a4') },
        { question: t('brick.faq.q5'), answer: t('brick.faq.a5') },
      ]} 
          sources={getSources('brick')}
        />
      <EmbedWidget calculatorId="brick" calculatorTitle={t('brick.title')} />
      <LastUpdated calculatorId="brick" />
    </div>
  );
}
