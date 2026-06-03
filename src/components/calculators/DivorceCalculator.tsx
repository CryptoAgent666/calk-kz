import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, FileText } from 'lucide-react';
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

const MRP_2026 = 4325;

type Mode = 'zags' | 'court';

export default function DivorceCalculator() {
  const { t } = useTranslation('calculators');
  const [mode, setMode] = useState<Mode>('zags');
  const [mutualConsent, setMutualConsent] = useState<boolean>(true);
  const [hasChildren, setHasChildren] = useState<boolean>(false);
  const [hasPropertyDispute, setHasPropertyDispute] = useState<boolean>(false);
  const [propertyValue, setPropertyValue] = useState<string>('0');
  const [needAlimony, setNeedAlimony] = useState<boolean>(false);
  const [lawyerServices, setLawyerServices] = useState<boolean>(false);

  // Определяем режим автоматически
  const suggestedMode: Mode = useMemo(() => {
    if (hasChildren || !mutualConsent || hasPropertyDispute) return 'court';
    return 'zags';
  }, [hasChildren, mutualConsent, hasPropertyDispute]);

  // Если включить чекбоксы — переключиться на суд автоматически
  React.useEffect(() => {
    setMode(suggestedMode);
  }, [suggestedMode]);

  const results = useMemo(() => {
    // Госпошлина за развод в ЗАГСе — 2 МРП = 8 650 ₸ (взаимное согласие)
    // Госпошлина за иск о расторжении брака в суде — 0.3 МРП = 1 297,5 ₸ (ст. 610 НК РК)
    // Госпошлина за раздел имущества — 1% от стоимости, мин 0.5 МРП
    // Нотариус (по желанию) — 5-10 МРП
    // Юрист (по желанию) — от 100 000 ₸
    const divorceFee = mode === 'zags' ? 2 * MRP_2026 : 0.3 * MRP_2026;
    const propValue = parseFloat(propertyValue) || 0;
    const propertyFee = hasPropertyDispute ? Math.max(propValue * 0.01, 0.5 * MRP_2026) : 0;
    const alimonyPetitionFee = needAlimony ? MRP_2026 : 0; // 1 МРП
    const lawyerFee = lawyerServices ? 200000 : 0;

    const total = divorceFee + propertyFee + alimonyPetitionFee + lawyerFee;

    // Срок развода
    const timelineMonths = mode === 'zags' ? 1 : hasChildren ? 3 : 2;

    return {
      divorceFee: Math.round(divorceFee),
      propertyFee: Math.round(propertyFee),
      alimonyPetitionFee: Math.round(alimonyPetitionFee),
      lawyerFee: Math.round(lawyerFee),
      total: Math.round(total),
      timelineMonths,
    };
  }, [mode, hasPropertyDispute, propertyValue, needAlimony, lawyerServices, hasChildren]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('divorce.title')}</h1>
          <p className="text-gray-600">{t('divorce.subtitle')}</p>
        </div>
      </div>

      <QuickAnswer calculatorId="divorce" />

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('divorce.parameters')}</h2>

          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={mutualConsent} onChange={e => setMutualConsent(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-medium">{t('divorce.mutualConsent')}</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={hasChildren} onChange={e => setHasChildren(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-medium">{t('divorce.hasChildren')}</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={hasPropertyDispute} onChange={e => setHasPropertyDispute(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-medium">{t('divorce.propertyDispute')}</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={needAlimony} onChange={e => setNeedAlimony(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-medium">{t('divorce.needAlimony')}</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={lawyerServices} onChange={e => setLawyerServices(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-medium">{t('divorce.hireLayer')}</span>
            </label>
          </div>

          {hasPropertyDispute && (
            <RangeSlider label={t('divorce.propertyValue')} value={parseFloat(propertyValue) || 0}
              onChange={v => setPropertyValue(String(v))} min={0} max={100000000} step={100000} formatValue={formatNumber} />
          )}

          <div className={`rounded-lg p-4 border ${mode === 'zags' ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
            <div className="text-sm font-medium mb-1">{t('divorce.procedure')}</div>
            <div className={`text-lg font-bold ${mode === 'zags' ? 'text-green-700' : 'text-amber-700'}`}>
              {mode === 'zags' ? t('divorce.throughZags') : t('divorce.throughCourt')}
            </div>
            <div className="text-xs mt-1 text-gray-600">
              {mode === 'zags' ? t('divorce.zagsHint') : t('divorce.courtHint')}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('divorce.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200">
            <div className="text-sm text-gray-600">{t('divorce.totalCost')}</div>
            <div className="text-4xl font-bold text-rose-700">{formatNumber(results.total)}</div>
            <div className="text-xs text-gray-500 mt-1">{t('divorce.timeline')}: ~{results.timelineMonths} {t('divorce.months')}</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('divorce.divorceFee')} ({mode === 'zags' ? '2 МРП' : '0,3 МРП'})</span>
              <span className="font-semibold">{formatNumber(results.divorceFee)}</span>
            </div>
            {results.propertyFee > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('divorce.propertyFee')} (1%)</span>
                <span className="font-semibold">{formatNumber(results.propertyFee)}</span>
              </div>
            )}
            {results.alimonyPetitionFee > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('divorce.alimonyFee')} (1 МРП)</span>
                <span className="font-semibold">{formatNumber(results.alimonyPetitionFee)}</span>
              </div>
            )}
            {results.lawyerFee > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('divorce.lawyerFee')}</span>
                <span className="font-semibold">~{formatNumber(results.lawyerFee)}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-900">
                <div className="font-medium mb-1">{t('divorce.documents')}</div>
                <ul className="text-xs space-y-0.5 list-disc list-inside">
                  <li>{t('divorce.doc1')}</li>
                  <li>{t('divorce.doc2')}</li>
                  <li>{t('divorce.doc3')}</li>
                  {hasChildren && <li>{t('divorce.doc4')}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('divorce.title'),
            subtitle: mode === 'zags' ? t('divorce.throughZags') : t('divorce.throughCourt'),
            sections: [{ title: t('divorce.resultsTitle'), data: [
              { label: t('divorce.totalCost'), value: formatNumber(results.total) },
              { label: t('divorce.timeline'), value: `~${results.timelineMonths} мес` },
              { label: t('divorce.procedure'), value: mode === 'zags' ? 'ЗАГС' : 'Суд' },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="divorce"
        />
      </div>

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="divorce" />
      <MethodologySection steps={getMethodology('divorce')} />
      <FAQSection items={[
        { question: t('divorce.faq.q1'), answer: t('divorce.faq.a1') },
        { question: t('divorce.faq.q2'), answer: t('divorce.faq.a2') },
        { question: t('divorce.faq.q3'), answer: t('divorce.faq.a3') },
        { question: t('divorce.faq.q4'), answer: t('divorce.faq.a4') },
        { question: t('divorce.faq.q5'), answer: t('divorce.faq.a5') },
      ]} 
          sources={getSources('divorce')}
        />
      <EmbedWidget calculatorId="divorce" calculatorTitle={t('divorce.title')} />
      <LastUpdated calculatorId="divorce" />
    </div>
  );
}
