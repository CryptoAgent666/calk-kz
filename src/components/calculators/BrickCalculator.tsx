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
import { QuickAnswer } from '../ui/QuickAnswer';
import { NUMBER_LOCALE } from '../../utils/localeFormat';

type BrickType = 'single' | 'oneAndHalf' | 'double' | 'block' | 'gasBlock';

// Швы кладки из кирпича и камней правильной формы — СП РК 5.03-107-2013, п. 4.7.1.3
const JOINT_H_M = 0.012; // горизонтальный
const JOINT_V_M = 0.010; // вертикальный
// Шов на клею — 2 мм (там же, п. 4.7.6.4; пункт о силикатных блоках, отдельного для газобетона в СП РК нет)
const JOINT_GLUE_M = 0.002;

// Раствор для кирпича — норма 0,25 м³ на 1 м³ кладки (М75–М100, 1:4)
const BRICK_MORTAR_M3 = 0.25;
const CEMENT_KG_PER_M3 = 320;  // кг цемента М400 на 1 м³ раствора
const SAND_KG_PER_M3 = 1200;
const CEMENT_PRICE = 55;       // ₸/кг
const SAND_PRICE = 8;          // ₸/кг
// Клей для газоблока: 1,2–1,4 кг сухой смеси на 1 м² шва на каждый мм толщины
// (техописание Ceresit CT 21 для Казахстана), берём верхнюю границу
const GLUE_KG_PER_M2_MM = 1.4;
const GLUE_BAG_KG = 25;
const GLUE_BAG_PRICE = 1800;   // ₸ за мешок 25 кг (Алматы, 10.2026: 1 100–1 850 ₸)

interface BrickSpec {
  length: number;  // мм
  width: number;
  height: number;
  perM3: number;   // шт на 1 м³ кладки с учётом швов
  price: number;   // ₸/шт
  glue?: boolean;  // кладка на клею
}

const BRICKS: Record<BrickType, BrickSpec> = {
  single:        { length: 250, width: 120, height: 65, perM3: 384, price: 80 },   // 1 / (0,26 × 0,13 × 0,077)
  oneAndHalf:    { length: 250, width: 120, height: 88, perM3: 296, price: 110 },  // 1 / (0,26 × 0,13 × 0,100)
  double:        { length: 250, width: 120, height: 138, perM3: 197, price: 150 }, // 1 / (0,26 × 0,13 × 0,150)
  block:         { length: 390, width: 190, height: 188, perM3: 62, price: 320 },  // 1 / (0,40 × 0,20 × 0,20)
  gasBlock:      { length: 600, width: 300, height: 200, perM3: 27, price: 550, glue: true }, // 1 / (0,602 × 0,30 × 0,202)
};

type Masonry = 'brick' | 'block' | 'gasBlock';
const MASONRY: Record<BrickType, Masonry> = {
  single: 'brick', oneAndHalf: 'brick', double: 'brick', block: 'block', gasBlock: 'gasBlock',
};

// Толщина стены и сколько изделий в ней поперёк. label — ключ brick.thicknessLabels.*, без него подпись «N мм».
interface WallOption { mm: number; across: number; label?: string }
const WALLS: Record<Masonry, WallOption[]> = {
  // Кирпичей по ширине (120 мм) с продольными швами 10 мм: 120 / 250 / 380 / 510 мм
  brick: [
    { mm: 120, across: 1, label: 'half' },
    { mm: 250, across: 2, label: 'one' },
    { mm: 380, across: 3, label: 'oneAndHalf' },
    { mm: 510, across: 4, label: 'two' },
  ],
  // Керамзитоблок шириной 190 мм: в один блок или в два с продольным швом 10 мм
  block: [
    { mm: 190, across: 1, label: 'block190' },
    { mm: 390, across: 2, label: 'block390' },
  ],
  // Газоблок кладут в один блок: ширину блока берут по толщине стены, лицо у всех 600 × 200 мм
  gasBlock: [200, 250, 300, 375, 400].map(mm => ({ mm, across: 1 })),
};
const DEFAULT_WALL_MM: Record<Masonry, number> = { brick: 250, block: 190, gasBlock: 300 };
const WALL_GRID: Record<Masonry, string> = {
  brick: 'grid-cols-4', block: 'grid-cols-2', gasBlock: 'grid-cols-3 sm:grid-cols-5',
};

// Газоблок под выбранную толщину: ширина = толщине стены, цена — пропорционально объёму блока
function sizedSpec(type: BrickType, wallMm: number): BrickSpec {
  const spec = BRICKS[type];
  if (type !== 'gasBlock') return spec;
  return {
    ...spec,
    width: wallMm,
    perM3: Math.round(1 / ((spec.length / 1000 + JOINT_GLUE_M) * (wallMm / 1000) * (spec.height / 1000 + JOINT_GLUE_M))),
    price: Math.round(spec.price * wallMm / spec.width),
  };
}

// Изделий на 1 м² лица стены: одно изделие со швами занимает (длина + верт. шов) × (высота + гориз. шов),
// across — сколько их в толщине стены
function perSquareMeter(spec: BrickSpec, wall: WallOption): number {
  const jv = spec.glue ? JOINT_GLUE_M : JOINT_V_M;
  const jh = spec.glue ? JOINT_GLUE_M : JOINT_H_M;
  return wall.across / ((spec.length / 1000 + jv) * (spec.height / 1000 + jh));
}

// Раствор, м³ на 1 м³ кладки. Керамзитоблок — по геометрии: всё, что в стене не блок, — шов
// (швы 12/10 мм: ≈ 0,084 в стене 190 мм, ≈ 0,107 в стене 390 мм).
// Норма кирпича 0,25 давала ему раствора в 2–3 раза больше.
function mortarPerM3(masonry: Masonry, spec: BrickSpec, wall: WallOption, perM2: number): number {
  if (masonry === 'brick') return BRICK_MORTAR_M3;
  const blockM3 = (spec.length / 1000) * (spec.width / 1000) * (spec.height / 1000);
  return 1 - perM2 * blockM3 / (wall.mm / 1000);
}

// Клей, кг на 1 м³ кладки в один блок. Площадь швов в 1 м³ = 1/L + 1/H (м²) — формула техописания CT 21.
// Для 600×200 со швом 2 мм — 18,7 кг, от толщины стены не зависит
function glueKgPerM3(spec: BrickSpec): number {
  return (1000 / spec.length + 1000 / spec.height) * JOINT_GLUE_M * 1000 * GLUE_KG_PER_M2_MM;
}

export default function BrickCalculator() {
  const { t } = useTranslation('calculators');
  const [brickType, setBrickType] = useState<BrickType>('single');
  const [wallMm, setWallMm] = useState<Record<Masonry, number>>(DEFAULT_WALL_MM);
  const [wallLength, setWallLength] = useState<string>('10');
  const [wallHeight, setWallHeight] = useState<string>('3');
  const [doors, setDoors] = useState<string>('0'); // м²
  const [windows, setWindows] = useState<string>('0');
  const [reserve, setReserve] = useState<string>('5');

  const masonry = MASONRY[brickType];
  const wall = WALLS[masonry].find(o => o.mm === wallMm[masonry]) ?? WALLS[masonry][0];
  const spec = sizedSpec(brickType, wall.mm);
  const perM2 = perSquareMeter(spec, wall);
  const glue = !!spec.glue;
  const mortarRate = glue ? 0 : mortarPerM3(masonry, spec, wall, perM2); // м³ на 1 м³ кладки
  const glueRate = glue ? glueKgPerM3(spec) : 0;                         // кг на 1 м³ кладки

  const results = useMemo(() => {
    const l = parseFloat(wallLength) || 0;
    const h = parseFloat(wallHeight) || 0;
    const d = parseFloat(doors) || 0;
    const w = parseFloat(windows) || 0;
    const r = parseFloat(reserve) || 0;
    const th = wall.mm / 1000;

    if (l <= 0 || h <= 0) return null;

    const wallArea = l * h - d - w; // м²
    if (wallArea <= 0) return null;

    const volume = wallArea * th; // м³

    // Кирпич и блоки — по лицевой площади (perSquareMeter). Через м³ × шт/м³ кирпича выходило
    // на 2–8 % меньше: шт/м³ закладывает шов и по толщине, а в стене в полкирпича продольного шва нет.
    const brickCount = Math.ceil(wallArea * perM2 * (1 + r / 100));

    // Кирпич и керамзитоблок — на цементно-песчаном растворе, газоблок — на клею
    const mortarVolume = volume * mortarRate;
    const cementKg = mortarVolume * CEMENT_KG_PER_M3;
    const sandKg = mortarVolume * SAND_KG_PER_M3;
    const glueKg = volume * glueRate;
    const glueBags = Math.ceil(glueKg / GLUE_BAG_KG);

    const brickPrice = brickCount * spec.price;
    const cementPrice = cementKg * CEMENT_PRICE;
    const sandPrice = sandKg * SAND_PRICE;
    const gluePrice = glueBags * GLUE_BAG_PRICE;
    const totalPrice = brickPrice + cementPrice + sandPrice + gluePrice;

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
      glueKg: Math.round(glueKg),
      glueBags,
      brickPrice: Math.round(brickPrice),
      totalPrice: Math.round(totalPrice),
      wallWeight: Math.round(wallWeight),
    };
  }, [brickType, wall, perM2, mortarRate, glueRate, spec.price, wallLength, wallHeight, doors, windows, reserve]);

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
              {(Object.keys(BRICKS) as BrickType[]).map(b => {
                const s = sizedSpec(b, wallMm[MASONRY[b]]);
                return (
                  <button key={b} onClick={() => setBrickType(b)}
                    className={`w-full p-3 rounded-lg border text-left text-sm ${brickType === b ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-300'}`}>
                    <div className="font-medium">{t(`brick.types.${b}`)}</div>
                    <div className="text-xs text-gray-500">{s.length}×{s.width}×{s.height} мм • {s.perM3} шт/м³ • {s.price} ₸/шт</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('brick.thickness')}</label>
            <div className={`grid ${WALL_GRID[masonry]} gap-2`}>
              {WALLS[masonry].map(o => (
                <button key={o.mm} onClick={() => setWallMm(prev => ({ ...prev, [masonry]: o.mm }))}
                  className={`p-2 rounded-lg border text-sm ${wall.mm === o.mm ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-gray-300'}`}>
                  {o.label ? t(`brick.thicknessLabels.${o.label}`) : t('brick.thicknessMm', { mm: o.mm })}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('brick.thicknessHint', {
                m: (wall.mm / 1000).toLocaleString(NUMBER_LOCALE),
                n: perM2.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: perM2 < 20 ? 1 : 0 }),
              })}
            </div>
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
                <div className="text-4xl font-bold text-orange-700">{results.brickCount.toLocaleString(NUMBER_LOCALE)}</div>
                <div className="text-xs text-gray-500 mt-1">{t('brick.wallArea')}: {results.wallArea} м² • {t('brick.volume')}: {results.volume} м³</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>🧱 {t('brick.bricks')}</span>
                  <span className="font-semibold">{results.brickPrice.toLocaleString(NUMBER_LOCALE)} ₸</span>
                </div>
                {glue ? (
                  <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                    <span>🪣 {t('brick.glue')}</span>
                    <span className="font-semibold">{t('brick.glueAmount', { kg: results.glueKg.toLocaleString(NUMBER_LOCALE), bags: results.glueBags })}</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
                <div className="text-xs text-gray-500">
                  {glue
                    ? t('brick.glueRate', { kg: glueRate.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 1 }) })
                    : t('brick.mortarRate', { m3: mortarRate.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 3 }) })}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-sm text-amber-900">{t('brick.estimatedCost')}</div>
                <div className="text-2xl font-bold text-amber-700">{results.totalPrice.toLocaleString(NUMBER_LOCALE)} ₸</div>
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
                ...(glue ? [
                  { label: t('brick.glue'), value: t('brick.glueAmount', { kg: results.glueKg.toLocaleString(NUMBER_LOCALE), bags: results.glueBags }) },
                ] : [
                  { label: t('brick.cement'), value: `${results.cementKg} кг` },
                  { label: t('brick.sand'), value: `${results.sandKg} кг` },
                ]),
                { label: t('brick.estimatedCost'), value: `${results.totalPrice.toLocaleString(NUMBER_LOCALE)} ₸` },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="brick"
          />
        </div>
      )}

      <LegalDisclaimer type="construction" />
      <ExpertBlock />
      <MethodologySection calculatorId="brick" />
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
