import { useState, useEffect } from 'react';
import { Briefcase, Calculator, Info, AlertTriangle } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import LocalizedLink from '../LocalizedLink';

/**
 * СНР для самозанятых 2026 (гл. 77, ст. 718–721 нового НК РК, с 01.01.2026).
 *
 * ИПН 0%; соцплатежи 4% от дохода: ОПВ 1% + ОПВР 1% + СО 1% + ВОСМС 1%
 * (ставки — по Социальному кодексу). Лимит 300 МРП/мес (контроль помесячный,
 * годового лимита в НК нет). Без регистрации ИП и без наёмных работников;
 * 40 разрешённых видов деятельности (ПП РК от 21.11.2025 № 994).
 * Учёт и уплата — e-Salyq Business; операторы интернет-платформ (такси,
 * доставка) с 01.01.2026 удерживают 4% автоматически (приказ МТСЗН № 319).
 * База 4% при платформенной занятости: НПА прямо не уточняют «до или после
 * комиссии» — расчёт от суммы, начисленной исполнителю (см. сноску в UI).
 */
const MRP_2026 = 4325;
const LIMIT_MRP = 300;
const LIMIT_KZT = LIMIT_MRP * MRP_2026; // 1 297 500 ₸/мес
const RATE_TOTAL = 0.04;
// Разбивка 4% по компонентам (по 1%)
const COMPONENTS = ['opv', 'opvr', 'so', 'vosms'] as const;

type WorkMode = 'direct' | 'platform';

export default function SelfEmployedCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [income, setIncome] = useState<string>('400000');
  const [mode, setMode] = useState<WorkMode>('direct');
  const [commission, setCommission] = useState<string>('15');

  const [results, setResults] = useState({
    base: 0,
    payments: 0,
    perComponent: 0,
    commissionAmount: 0,
    net: 0,
    overLimit: false,
  });

  useEffect(() => {
    const gross = parseFloat(income) || 0;
    const commPct = mode === 'platform' ? Math.min(Math.max(parseFloat(commission) || 0, 0), 90) : 0;
    if (gross <= 0) {
      setResults({ base: 0, payments: 0, perComponent: 0, commissionAmount: 0, net: 0, overLimit: false });
      return;
    }
    const commissionAmount = gross * (commPct / 100);
    // База 4% — доход, начисленный исполнителю платформой (после её комиссии)
    const base = gross - commissionAmount;
    const payments = base * RATE_TOTAL;
    setResults({
      base: Math.round(base),
      payments: Math.round(payments),
      perComponent: Math.round(payments / 4),
      commissionAmount: Math.round(commissionAmount),
      net: Math.round(base - payments),
      overLimit: base > LIMIT_KZT,
    });
  }, [income, mode, commission]);

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    const gross = parseFloat(income) || 0;
    if (gross <= 0) return '';
    return `${t('self-employed.parameters')}:
- ${t('self-employed.incomeLabel')}: ${formatNumber(gross)}
- ${t('self-employed.modeLabel')}: ${t(`self-employed.mode_${mode}`)}

${t('self-employed.results')}:
- ${t('self-employed.paymentsLabel')} (4%): ${formatNumber(results.payments)}
- ${t('self-employed.netLabel')}: ${formatNumber(results.net)}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('self-employed.heading')}</h1>
            <p className="text-gray-600">{t('self-employed.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {i18n.language === 'kk'
            ? 'Есептеулер нәтижелері анықтамалық сипатта. Қаржылық шешімдер қабылдау үшін деректерді ресми көздерден тексеріп, мамандармен кеңесуді ұсынамыз.'
            : 'Результаты расчётов носят справочный характер. Для принятия финансовых решений рекомендуем сверять данные с официальными источниками и консультироваться со специалистами.'}
        </p>
      </div>

      <QuickAnswer calculatorId="self-employed" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('self-employed.parameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('self-employed.modeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['direct', 'platform'] as WorkMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      mode === m
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`self-employed.mode_${m}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'platform' ? t('self-employed.incomeLabelPlatform') : t('self-employed.incomeLabel')}
              </label>
              <RangeSlider
                value={parseFloat(income) || 0}
                onChange={(val) => setIncome(String(val))}
                min={50000}
                max={2000000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#0ea5e9"
              />
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder={t('self-employed.incomePlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
              />
            </div>

            {mode === 'platform' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('self-employed.commissionLabel')}
                </label>
                <input
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  min="0"
                  max="90"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                />
                <p className="mt-2 text-xs text-gray-500">{t('self-employed.commissionNote')}</p>
              </div>
            )}

            <div className="bg-sky-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-sky-900 mb-2">{t('self-employed.ratesTitle')}</h3>
              <div className="text-xs text-sky-800 space-y-1">
                <div>• {t('self-employed.rateLine')}</div>
                <div>• {t('self-employed.limitLine', { mrp: LIMIT_MRP, kzt: formatNumber(LIMIT_KZT) })}</div>
                <div>• {t('self-employed.noIpLine')}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">{t('self-employed.whoCanUseTitle')}</h3>
                  <p className="text-blue-800 text-sm">{t('self-employed.whoCanUseText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('self-employed.results')}</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('self-employed.netLabel')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-sky-600" />
                <span className="text-xl font-bold text-sky-700">{formatNumber(results.net)}</span>
              </div>
            </div>

            {mode === 'platform' && results.commissionAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('self-employed.commissionAmount')}</span>
                <span className="font-semibold text-red-600">−{formatNumber(results.commissionAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('self-employed.baseLabel')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.base)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('self-employed.paymentsLabel')} (4%)</span>
              <span className="font-semibold text-red-600">−{formatNumber(results.payments)}</span>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 pt-2">{t('self-employed.breakdown')}</h3>
            {COMPONENTS.map((c) => (
              <div key={c} className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-600 text-sm">
                  {t(`self-employed.${c}`)} <span className="text-xs text-gray-400">(1%)</span>
                </span>
                <span className="font-semibold text-gray-900">{formatNumber(results.perComponent)}</span>
              </div>
            ))}

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">{t('self-employed.ipnLabel')}</span>
              <span className="font-semibold text-emerald-600">0 ₸ (0%)</span>
            </div>

            {results.overLimit && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-xs">
                    {t('self-employed.overLimitWarning', { mrp: LIMIT_MRP, kzt: formatNumber(LIMIT_KZT) })}{' '}
                    <LocalizedLink to="/calculator/ip-simplified/" className="underline font-medium">
                      {t('self-employed.overLimitLink')}
                    </LocalizedLink>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {results.payments > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('self-employed.chartNet'), value: results.net },
              { name: t('self-employed.chartPayments'), value: results.payments },
              ...(results.commissionAmount > 0
                ? [{ name: t('self-employed.chartCommission'), value: results.commissionAmount }]
                : []),
            ]}
            title={t('self-employed.chartTitle')}
          />
        </div>
      )}

      {parseFloat(income) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('self-employed.exportTitle')}
            description={t('self-employed.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.payments > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('self-employed.export.title'),
              subtitle: `${formatNumber(results.net)} ${t('self-employed.export.netLabel')}`,
              sections: [
                {
                  title: t('self-employed.export.results'),
                  data: [
                    { label: t('self-employed.incomeLabel'), value: formatNumber(parseFloat(income) || 0) },
                    { label: t('self-employed.paymentsLabel'), value: formatNumber(results.payments) },
                    { label: t('self-employed.opv'), value: formatNumber(results.perComponent) },
                    { label: t('self-employed.opvr'), value: formatNumber(results.perComponent) },
                    { label: t('self-employed.so'), value: formatNumber(results.perComponent) },
                    { label: t('self-employed.vosms'), value: formatNumber(results.perComponent) },
                    { label: t('self-employed.netLabel'), value: formatNumber(results.net) },
                  ],
                },
              ],
              footer: t('self-employed.export.footer'),
            }}
            filename="self-employed-calculation"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="self-employed" />
      <MethodologySection calculatorId="self-employed" />
      <FAQSection
        items={[
          { question: t('self-employed.faq.q1'), answer: t('self-employed.faq.a1') },
          { question: t('self-employed.faq.q2'), answer: t('self-employed.faq.a2') },
          { question: t('self-employed.faq.q3'), answer: t('self-employed.faq.a3') },
          { question: t('self-employed.faq.q4'), answer: t('self-employed.faq.a4') },
          { question: t('self-employed.faq.q5'), answer: t('self-employed.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі, 77-тарау (718–721-баптар)' : 'НК РК, гл. 77 (ст. 718–721)', url: 'https://adilet.zan.kz/rus/docs/K2500000214' },
          { title: i18n.language === 'kk' ? 'Рұқсат етілген қызмет түрлері — ҚР ҮҚ № 994' : 'Перечень видов деятельности — ПП РК № 994', url: 'https://adilet.zan.kz/rus/docs/P2500000994' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="self-employed" calculatorTitle={t('self-employed.heading')} />
      <LastUpdated calculatorId="self-employed" />
    </div>
  );
}
