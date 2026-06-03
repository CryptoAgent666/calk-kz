import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, ArrowLeftRight, Info, Gauge, ArrowUp } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

// Расчёт параметров шины
function calcTire(width: number, profile: number, rim: number) {
  const sidewall = width * (profile / 100);           // высота профиля (мм)
  const rimMM = rim * 25.4;                           // диаметр диска (мм)
  const diameter = rimMM + 2 * sidewall;              // общий диаметр (мм)
  const circumference = Math.PI * diameter;           // длина окружности (мм)
  const revPerKm = 1_000_000 / circumference;         // оборотов/км
  return { sidewall, diameter, circumference, revPerKm };
}

const COMMON_SIZES = [
  '175/65/R14', '185/65/R15', '195/65/R15', '205/55/R16',
  '215/55/R17', '225/45/R18', '235/55/R18', '265/65/R17',
];

export default function TireSizeCalculator() {
  const { t } = useTranslation('calculators');

  const [width1, setWidth1] = useState('205');
  const [profile1, setProfile1] = useState('55');
  const [rim1, setRim1] = useState('16');

  const [width2, setWidth2] = useState('225');
  const [profile2, setProfile2] = useState('45');
  const [rim2, setRim2] = useState('17');

  const tire1 = useMemo(() => {
    const w = parseInt(width1) || 0;
    const p = parseInt(profile1) || 0;
    const r = parseInt(rim1) || 0;
    if (w <= 0 || p <= 0 || r <= 0) return null;
    return calcTire(w, p, r);
  }, [width1, profile1, rim1]);

  const tire2 = useMemo(() => {
    const w = parseInt(width2) || 0;
    const p = parseInt(profile2) || 0;
    const r = parseInt(rim2) || 0;
    if (w <= 0 || p <= 0 || r <= 0) return null;
    return calcTire(w, p, r);
  }, [width2, profile2, rim2]);

  const comparison = useMemo(() => {
    if (!tire1 || !tire2) return null;
    const diameterDiff = tire2.diameter - tire1.diameter;
    const clearanceDiff = diameterDiff / 2;
    // Погрешность спидометра: если новая шина больше, спидометр показывает МЕНЬШЕ
    const speedoError = ((tire2.circumference - tire1.circumference) / tire1.circumference) * 100;
    return { diameterDiff, clearanceDiff, speedoError };
  }, [tire1, tire2]);

  const applyPreset = (preset: string, target: 1 | 2) => {
    const parts = preset.split('/');
    if (parts.length !== 3) return;
    const setW = target === 1 ? setWidth1 : setWidth2;
    const setP = target === 1 ? setProfile1 : setProfile2;
    const setR = target === 1 ? setRim1 : setRim2;
    setW(parts[0]);
    setP(parts[1]);
    setR(parts[2].replace('R', ''));
  };

  const TireInput = ({ label, w, p, r, setW, setP, setR, target }: {
    label: string; w: string; p: string; r: string;
    setW: (v: string) => void; setP: (v: string) => void; setR: (v: string) => void;
    target: 1 | 2;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{label}</h2>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('tire-size.width')}</label>
          <input type="number" value={w} onChange={(e) => setW(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('tire-size.profile')}</label>
          <input type="number" value={p} onChange={(e) => setP(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t('tire-size.rim')}</label>
          <input type="number" value={r} onChange={(e) => setR(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center" />
        </div>
      </div>
      <div className="text-center font-mono text-lg text-gray-900 mb-3">
        {w}/{p}/R{r}
      </div>
      <div className="flex flex-wrap gap-1">
        {COMMON_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => applyPreset(size, target)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-orange-100 rounded text-gray-600 hover:text-orange-700 transition-colors"
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );

  const formatMM = (val: number) => val.toFixed(1) + ' ' + t('tire-size.mm');

  const generateExportData = () => {
    if (!tire1 || !tire2 || !comparison) return null;
    return {
      title: t('tire-size.exportTitle'),
      sections: [
        {
          title: `${width1}/${profile1}/R${rim1}`,
          data: [
            { label: t('tire-size.diameter'), value: formatMM(tire1.diameter) },
            { label: t('tire-size.sidewall'), value: formatMM(tire1.sidewall) },
            { label: t('tire-size.circumference'), value: formatMM(tire1.circumference) },
          ],
        },
        {
          title: `${width2}/${profile2}/R${rim2}`,
          data: [
            { label: t('tire-size.diameter'), value: formatMM(tire2.diameter) },
            { label: t('tire-size.sidewall'), value: formatMM(tire2.sidewall) },
            { label: t('tire-size.circumference'), value: formatMM(tire2.circumference) },
          ],
        },
        {
          title: t('tire-size.comparison'),
          data: [
            { label: t('tire-size.diameterDiff'), value: `${comparison.diameterDiff > 0 ? '+' : ''}${comparison.diameterDiff.toFixed(1)} ${t('tire-size.mm')}` },
            { label: t('tire-size.clearanceDiff'), value: `${comparison.clearanceDiff > 0 ? '+' : ''}${comparison.clearanceDiff.toFixed(1)} ${t('tire-size.mm')}` },
            { label: t('tire-size.speedoError'), value: `${comparison.speedoError > 0 ? '+' : ''}${comparison.speedoError.toFixed(2)}%` },
          ],
        },
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="tire-size" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Circle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('tire-size.heading')}</h1>
            <p className="text-gray-600">{t('tire-size.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Two tire inputs */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <TireInput label={t('tire-size.originalTire')} w={width1} p={profile1} r={rim1}
          setW={setWidth1} setP={setProfile1} setR={setRim1} target={1} />
        <TireInput label={t('tire-size.newTire')} w={width2} p={profile2} r={rim2}
          setW={setWidth2} setP={setProfile2} setR={setRim2} target={2} />
      </div>

      {/* Comparison results */}
      {tire1 && tire2 && comparison && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <ArrowLeftRight className="w-5 h-5 inline mr-2" />
            {t('tire-size.comparison')}
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Diameter difference */}
            <div className={`rounded-lg p-4 ${Math.abs(comparison.diameterDiff) > 15 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="text-sm text-gray-600 mb-1">{t('tire-size.diameterDiff')}</div>
              <div className={`text-2xl font-bold ${Math.abs(comparison.diameterDiff) > 15 ? 'text-red-700' : 'text-green-700'}`}>
                {comparison.diameterDiff > 0 ? '+' : ''}{comparison.diameterDiff.toFixed(1)} {t('tire-size.mm')}
              </div>
            </div>

            {/* Clearance */}
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <ArrowUp className="w-4 h-4 mr-1" />{t('tire-size.clearanceDiff')}
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {comparison.clearanceDiff > 0 ? '+' : ''}{comparison.clearanceDiff.toFixed(1)} {t('tire-size.mm')}
              </div>
            </div>

            {/* Speedometer error */}
            <div className={`rounded-lg p-4 ${Math.abs(comparison.speedoError) > 3 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Gauge className="w-4 h-4 mr-1" />{t('tire-size.speedoError')}
              </div>
              <div className={`text-2xl font-bold ${Math.abs(comparison.speedoError) > 3 ? 'text-red-700' : 'text-amber-700'}`}>
                {comparison.speedoError > 0 ? '+' : ''}{comparison.speedoError.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Detailed table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600">{t('tire-size.parameter')}</th>
                  <th className="text-right py-2 px-3 text-gray-600">{width1}/{profile1}/R{rim1}</th>
                  <th className="text-right py-2 px-3 text-gray-600">{width2}/{profile2}/R{rim2}</th>
                  <th className="text-right py-2 px-3 text-gray-600">{t('tire-size.difference')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'diameter', v1: tire1.diameter, v2: tire2.diameter },
                  { key: 'sidewall', v1: tire1.sidewall, v2: tire2.sidewall },
                  { key: 'circumference', v1: tire1.circumference, v2: tire2.circumference },
                  { key: 'revPerKm', v1: tire1.revPerKm, v2: tire2.revPerKm },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-700">{t(`tire-size.${row.key}`)}</td>
                    <td className="py-2 px-3 text-right">{row.v1.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right">{row.v2.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right font-medium">
                      {(row.v2 - row.v1) > 0 ? '+' : ''}{(row.v2 - row.v1).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warning for speedometer */}
          {Math.abs(comparison.speedoError) > 3 && (
            <div className="mt-4 bg-red-50 rounded-lg p-3 text-sm text-red-700 border border-red-200">
              <Info className="w-4 h-4 inline mr-1" />
              {t('tire-size.speedoWarning')}
            </div>
          )}
        </div>
      )}

      {/* Export */}
      <div className="mb-8">
        <ExportButtons data={generateExportData()} filename="tire-comparison" />
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('tire-size.faq.q1'), answer: t('tire-size.faq.a1') },
          { question: t('tire-size.faq.q2'), answer: t('tire-size.faq.a2') },
          { question: t('tire-size.faq.q3'), answer: t('tire-size.faq.a3') },
          { question: t('tire-size.faq.q4'), answer: t('tire-size.faq.a4') },
          { question: t('tire-size.faq.q5'), answer: t('tire-size.faq.a5') },
        ]}
      
          sources={getSources('tire-size')}
        />

      <ExpertBlock />
      <EmbedWidget calculatorId="tire-size" calculatorTitle={t('tire-size.heading')} />
      <LastUpdated calculatorId="tire-size" />
    </div>
  );
}
