import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Users, Info, Calculator, TrendingUp, Plus, Minus } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

const MRP_2026 = 4_325;

// Очереди наследников по ГК РК (статьи 1061-1064)
// Очередь 1: дети, супруг, родители
// Очередь 2: братья/сёстры, бабушки/дедушки
// Очередь 3: дяди/тёти
// Обязательная доля — не менее 1/2 от законной доли (ст. 1069)

interface Heir {
  id: string;
  labelKey: string;
  queue: number;
  hasMandatoryShare: boolean; // имеет право на обязательную долю
}

const heirTypes: Heir[] = [
  { id: 'spouse', labelKey: 'inheritance.heirs.spouse', queue: 1, hasMandatoryShare: true },
  { id: 'children', labelKey: 'inheritance.heirs.children', queue: 1, hasMandatoryShare: false },
  { id: 'minorChildren', labelKey: 'inheritance.heirs.minorChildren', queue: 1, hasMandatoryShare: true },
  { id: 'parents', labelKey: 'inheritance.heirs.parents', queue: 1, hasMandatoryShare: true },
  { id: 'siblings', labelKey: 'inheritance.heirs.siblings', queue: 2, hasMandatoryShare: false },
  { id: 'grandparents', labelKey: 'inheritance.heirs.grandparents', queue: 2, hasMandatoryShare: false },
  { id: 'unclesAunts', labelKey: 'inheritance.heirs.unclesAunts', queue: 3, hasMandatoryShare: false },
];

export default function InheritanceCalculator() {
  const { t } = useTranslation('calculators');

  const [estateValue, setEstateValue] = useState<string>('30000000');
  const [isMaritalProperty, setIsMaritalProperty] = useState(true); // совместно нажитое
  const [hasWill, setHasWill] = useState(false);
  const [heirCounts, setHeirCounts] = useState<Record<string, number>>({
    spouse: 1,
    children: 2,
    minorChildren: 0,
    parents: 0,
    siblings: 0,
    grandparents: 0,
    unclesAunts: 0,
  });

  const updateHeir = (id: string, delta: number) => {
    setHeirCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta),
    }));
  };

  const results = useMemo(() => {
    const estate = parseFloat(estateValue) || 0;
    if (estate <= 0) return null;

    // Супружеская доля (50% совместно нажитого имущества)
    const spouseMaritalShare = isMaritalProperty && heirCounts.spouse > 0
      ? Math.round(estate / 2)
      : 0;
    const inheritableEstate = estate - spouseMaritalShare;

    // Определяем активную очередь
    const q1Count = (heirCounts.spouse || 0) + (heirCounts.children || 0) + (heirCounts.minorChildren || 0) + (heirCounts.parents || 0);
    const q2Count = (heirCounts.siblings || 0) + (heirCounts.grandparents || 0);
    const q3Count = heirCounts.unclesAunts || 0;

    let activeQueue = 0;
    let totalHeirs = 0;
    if (q1Count > 0) {
      activeQueue = 1;
      totalHeirs = q1Count;
    } else if (q2Count > 0) {
      activeQueue = 2;
      totalHeirs = q2Count;
    } else if (q3Count > 0) {
      activeQueue = 3;
      totalHeirs = q3Count;
    }

    if (totalHeirs === 0) {
      return { estate, spouseMaritalShare, inheritableEstate, shares: [], activeQueue: 0, totalHeirs: 0, notaryCost: 0 };
    }

    // Равные доли для наследников одной очереди
    const sharePerHeir = Math.round(inheritableEstate / totalHeirs);

    const shares = heirTypes
      .filter((h) => h.queue === activeQueue && (heirCounts[h.id] || 0) > 0)
      .map((h) => {
        const count = heirCounts[h.id] || 0;
        const totalForType = sharePerHeir * count;
        return {
          ...h,
          count,
          sharePerPerson: sharePerHeir,
          totalShare: totalForType,
          // Супруг получает и супружескую долю, и наследственную
          totalWithMarital: h.id === 'spouse' ? totalForType + spouseMaritalShare : totalForType,
        };
      });

    // Нотариальные расходы (примерно)
    // Свидетельство о праве на наследство: 1 МРП (недвижимость) + 0.5 МРП (прочее)
    const notaryCost = Math.round(1 * MRP_2026 * totalHeirs + 5 * MRP_2026);

    return { estate, spouseMaritalShare, inheritableEstate, shares, activeQueue, totalHeirs, notaryCost };
  }, [estateValue, isMaritalProperty, heirCounts]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const pieData = useMemo(() => {
    if (!results || results.shares.length === 0) return [];
    const data: { name: string; value: number }[] = [];
    if (results.spouseMaritalShare > 0) {
      data.push({ name: t('inheritance.maritalShare'), value: results.spouseMaritalShare });
    }
    results.shares.forEach((s) => {
      data.push({
        name: `${t(s.labelKey)} (${s.count})`,
        value: s.totalShare,
      });
    });
    return data;
  }, [results, t]);

  const generateExportData = () => {
    if (!results) return null;
    return {
      title: t('inheritance.exportTitle'),
      sections: [
        {
          title: t('inheritance.parameters'),
          data: [
            { label: t('inheritance.estateValue'), value: formatCurrency(results.estate) },
            { label: t('inheritance.maritalShare'), value: formatCurrency(results.spouseMaritalShare) },
            { label: t('inheritance.inheritableEstate'), value: formatCurrency(results.inheritableEstate) },
          ],
        },
        {
          title: t('inheritance.shares'),
          data: results.shares.map((s) => ({
            label: `${t(s.labelKey)} (${s.count})`,
            value: formatCurrency(s.totalWithMarital),
          })),
        },
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inheritance.heading')}</h1>
            <p className="text-gray-600">{t('inheritance.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('inheritance.warning')}</p>
      </div>

      {/* Two-column */}
      <QuickAnswer calculatorId="inheritance" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('inheritance.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Estate value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('inheritance.estateValue')}</label>
              <div className="relative">
                <input
                  type="number"
                  value={estateValue}
                  onChange={(e) => setEstateValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Marital property */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isMaritalProperty}
                onChange={(e) => setIsMaritalProperty(e.target.checked)}
                className="w-5 h-5 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
              />
              <span className="text-sm text-gray-700">{t('inheritance.isMaritalProperty')}</span>
            </label>

            {/* Heirs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                {t('inheritance.heirsTitle')}
              </label>

              {[1, 2, 3].map((queue) => (
                <div key={queue} className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    {t(`inheritance.queue${queue}`)}
                  </div>
                  {heirTypes.filter((h) => h.queue === queue).map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700">{t(h.labelKey)}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateHeir(h.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{heirCounts[h.id] || 0}</span>
                        <button
                          onClick={() => updateHeir(h.id, 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('inheritance.resultsTitle')}
          </h2>

          {results && results.totalHeirs > 0 ? (
            <div className="space-y-6">
              {/* Estate breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('inheritance.estateValue')}</span>
                  <span className="font-medium">{formatCurrency(results.estate)}</span>
                </div>
                {results.spouseMaritalShare > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('inheritance.maritalShare')} (50%)</span>
                    <span className="font-medium text-blue-600">{formatCurrency(results.spouseMaritalShare)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">{t('inheritance.inheritableEstate')}</span>
                  <span className="font-bold">{formatCurrency(results.inheritableEstate)}</span>
                </div>
              </div>

              {/* Active queue */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600">{t('inheritance.activeQueue')}</div>
                <div className="font-semibold text-slate-900">
                  {t(`inheritance.queue${results.activeQueue}`)} ({results.totalHeirs} {t('inheritance.persons')})
                </div>
              </div>

              {/* Shares */}
              {results.shares.map((s) => (
                <div key={s.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{t(s.labelKey)}</div>
                      <div className="text-xs text-gray-500">{s.count} × {formatCurrency(s.sharePerPerson)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(s.totalWithMarital)}</div>
                      {s.id === 'spouse' && results.spouseMaritalShare > 0 && (
                        <div className="text-xs text-blue-600">
                          {t('inheritance.includingMarital')} {formatCurrency(results.spouseMaritalShare)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Notary costs */}
              <div className="bg-amber-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-amber-700">{t('inheritance.notaryCost')}</div>
                  <div className="text-xs text-amber-600">{t('inheritance.approximate')}</div>
                </div>
                <span className="text-lg font-bold text-amber-700">~{formatCurrency(results.notaryCost)}</span>
              </div>

              {/* Pie */}
              {pieData.length > 0 && (
                <TaxPieChart data={pieData} title={t('inheritance.chartTitle')} />
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">{t('inheritance.addHeirs')}</div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename="inheritance" />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="inheritance" />
      <MethodologySection steps={getMethodology('inheritance')} />
      <FAQSection
        items={[
          { question: t('inheritance.faq.q1'), answer: t('inheritance.faq.a1') },
          { question: t('inheritance.faq.q2'), answer: t('inheritance.faq.a2') },
          { question: t('inheritance.faq.q3'), answer: t('inheritance.faq.a3') },
          { question: t('inheritance.faq.q4'), answer: t('inheritance.faq.a4') },
          { question: t('inheritance.faq.q5'), answer: t('inheritance.faq.a5') },
        ]}
      
          sources={getSources('inheritance')}
        />

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <EmbedWidget calculatorId="inheritance" calculatorTitle={t('inheritance.heading')} />
      <LastUpdated calculatorId="inheritance" />
    </div>
  );
}
