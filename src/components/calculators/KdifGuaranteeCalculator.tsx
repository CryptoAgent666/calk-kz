import { useState, useMemo } from 'react';
import { Shield, Calculator, Info, AlertTriangle } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';

/**
 * Гарантия КФГД по депозитам (2026): 20 млн ₸ — сберегательные вклады в тенге,
 * 10 млн ₸ — прочие тенговые (карты/счета/вклады), 5 млн ₸ — валютные.
 * Совокупный потолок на вкладчика в ОДНОМ банке — 20 млн ₸. Встречные
 * требования (кредит в том же банке) вычитаются взаимозачётом.
 * Выплата — до 35 рабочих дней. Источник: kdif.kz.
 */
const LIMIT_SAVINGS = 20_000_000;
const LIMIT_OTHER_KZT = 10_000_000;
const LIMIT_FX = 5_000_000;
const LIMIT_TOTAL = 20_000_000;

export default function KdifGuaranteeCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [savings, setSavings] = useState<string>('15000000');
  const [otherKzt, setOtherKzt] = useState<string>('3000000');
  const [fx, setFx] = useState<string>('0');
  const [loan, setLoan] = useState<string>('0');

  const computeResults = () => {
    const s = Math.max(0, parseFloat(savings) || 0);
    const o = Math.max(0, parseFloat(otherKzt) || 0);
    const f = Math.max(0, parseFloat(fx) || 0);
    const l = Math.max(0, parseFloat(loan) || 0);
    const total = s + o + f;
    // Взаимозачёт: кредит в том же банке гасится депозитом до возмещения
    const afterOffset = Math.max(0, total - l);
    const offset = total - afterOffset;
    // Пропорционально уменьшаем каждую корзину на долю зачёта
    const k = total > 0 ? afterOffset / total : 0;
    let covSavings = Math.min(s * k, LIMIT_SAVINGS);
    let covOther = Math.min(o * k, LIMIT_OTHER_KZT);
    let covFx = Math.min(f * k, LIMIT_FX);
    // Совокупный потолок 20 млн на вкладчика в одном банке
    let covered = covSavings + covOther + covFx;
    if (covered > LIMIT_TOTAL) {
      const scale = LIMIT_TOTAL / covered;
      covSavings *= scale; covOther *= scale; covFx *= scale;
      covered = LIMIT_TOTAL;
    }
    return {
      covSavings: Math.round(covSavings),
      covOther: Math.round(covOther),
      covFx: Math.round(covFx),
      covered: Math.round(covered),
      uncovered: Math.round(afterOffset - covered),
      offset: Math.round(offset),
      total: Math.round(total),
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savings, otherKzt, fx, loan]
  );

  const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (results.total <= 0) return '';
    return `${t('kdif-guarantee.parameters')}:
- ${t('kdif-guarantee.savingsLabel')}: ${fmt(parseFloat(savings) || 0)}
- ${t('kdif-guarantee.otherKztLabel')}: ${fmt(parseFloat(otherKzt) || 0)}
- ${t('kdif-guarantee.fxLabel')}: ${fmt(parseFloat(fx) || 0)}
- ${t('kdif-guarantee.loanLabel')}: ${fmt(parseFloat(loan) || 0)}

${t('kdif-guarantee.results')}:
- ${t('kdif-guarantee.coveredLabel')}: ${fmt(results.covered)}
- ${t('kdif-guarantee.uncoveredLabel')}: ${fmt(results.uncovered)}
${results.offset > 0 ? `- ${t('kdif-guarantee.offsetLabel')}: ${fmt(results.offset)}` : ''}`;
  };

  const inputBlock = (labelKey: string, hintKey: string, value: string, setter: (v: string) => void, max: number, color: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{t(labelKey)}</label>
      <p className="text-xs text-gray-500 mb-2">{t(hintKey)}</p>
      <RangeSlider
        value={parseFloat(value) || 0}
        onChange={(v) => setter(String(v))}
        min={0} max={max} step={100000}
        formatValue={(v) => `${(v / 1_000_000).toLocaleString('ru-KZ', { maximumFractionDigits: 1 })} ${t('kdif-guarantee.mln')}`}
        color={color}
      />
      <input
        type="number" value={value} onChange={(e) => setter(e.target.value)}
        className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('kdif-guarantee.heading')}</h1>
            <p className="text-gray-600">{t('kdif-guarantee.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="kdif-guarantee" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kdif-guarantee.parameters')}</h2>
          <div className="space-y-6">
            {inputBlock('kdif-guarantee.savingsLabel', 'kdif-guarantee.savingsHint', savings, setSavings, 40_000_000, '#10b981')}
            {inputBlock('kdif-guarantee.otherKztLabel', 'kdif-guarantee.otherKztHint', otherKzt, setOtherKzt, 30_000_000, '#10b981')}
            {inputBlock('kdif-guarantee.fxLabel', 'kdif-guarantee.fxHint', fx, setFx, 20_000_000, '#10b981')}
            {inputBlock('kdif-guarantee.loanLabel', 'kdif-guarantee.loanHint', loan, setLoan, 20_000_000, '#f59e0b')}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('kdif-guarantee.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('kdif-guarantee.coveredLabel')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-700">{fmt(results.covered)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('kdif-guarantee.covSavings')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.covSavings)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('kdif-guarantee.covOther')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.covOther)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('kdif-guarantee.covFx')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.covFx)}</span>
            </div>
            {results.offset > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('kdif-guarantee.offsetLabel')}</span>
                <span className="font-semibold text-amber-600">−{fmt(results.offset)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('kdif-guarantee.uncoveredLabel')}</span>
              <span className={`font-semibold ${results.uncovered > 0 ? 'text-red-600' : 'text-gray-900'}`}>{fmt(results.uncovered)}</span>
            </div>
            {results.uncovered > 0 && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">{t('kdif-guarantee.splitAdvice')}</p>
                </div>
              </div>
            )}
            <div className="rounded-lg bg-blue-50 p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('kdif-guarantee.payoutNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.total > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('kdif-guarantee.exportTitle')}
            description={t('kdif-guarantee.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {results.total > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('kdif-guarantee.export.title'),
              subtitle: `${t('kdif-guarantee.coveredLabel')}: ${fmt(results.covered)}`,
              sections: [{
                title: t('kdif-guarantee.export.results'),
                data: [
                  { label: t('kdif-guarantee.covSavings'), value: fmt(results.covSavings) },
                  { label: t('kdif-guarantee.covOther'), value: fmt(results.covOther) },
                  { label: t('kdif-guarantee.covFx'), value: fmt(results.covFx) },
                  { label: t('kdif-guarantee.coveredLabel'), value: fmt(results.covered) },
                  { label: t('kdif-guarantee.uncoveredLabel'), value: fmt(results.uncovered) },
                ],
              }],
              footer: t('kdif-guarantee.export.footer'),
            }}
            filename="kdif-guarantee"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="kdif-guarantee" />
      <MethodologySection calculatorId="kdif-guarantee" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`kdif-guarantee.faq.q${n}`), answer: t(`kdif-guarantee.faq.a${n}`) }))}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚДКҚ (kdif.kz) — кепілдік сомалары' : 'КФГД (kdif.kz) — суммы гарантии', url: 'https://kdif.kz/' },
          { title: i18n.language === 'kk' ? 'egov.kz — депозиттерге кепілдік беру жүйесі' : 'egov.kz — система гарантирования депозитов', url: 'https://egov.kz/cms/ru/articles/economics/deposit_guarantee_system' },
        ]}
      />
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="kdif-guarantee" calculatorTitle={t('kdif-guarantee.heading')} />
      <LastUpdated calculatorId="kdif-guarantee" />
    </div>
  );
}
