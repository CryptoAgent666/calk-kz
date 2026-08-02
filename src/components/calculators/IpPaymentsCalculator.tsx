import { useState, useMemo } from 'react';
import { Banknote, Calculator, Info } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../LocalizedLink';
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

/**
 * Платежи ИП «за себя» 2026 (упрощёнка):
 *  - ОПВ 10% от заявляемого дохода (1–50 МЗП — ст. 248–249 Соцкодекса);
 *  - ОПВР 3,5% (2026, график ст. 251: →5% к 2028) с той же базы;
 *    НЕ платится, если ИП родился до 01.01.1975 (п. 6 ст. 248);
 *  - СО 5% от заявляемого дохода (1–7 МЗП — ст. 245; без вычета ОПВ у ИП);
 *  - ВОСМС фикс: 5% × 1,4 МЗП = 5 950 ₸/мес (ст. 28 Закона об ОСМС);
 *  - налог упрощёнки 4% от фактического дохода (ст. 726 НК-2026; СН отменён,
 *    деления 1,5+1,5 больше нет; маслихаты могут менять ставку ±50% → 2–6%).
 * Минимальный пакет при заявляемом доходе 1 МЗП: 21 675 ₸/мес
 * (8 500 + 2 975 + 4 250 + 5 950); без ОПВР (род. до 1975) — 18 700 ₸/мес.
 */
const MZP_2026 = 85000;
const OPV_RATE = 0.10;
const OPVR_RATE_2026 = 0.035;
const SO_RATE = 0.05;
const VOSMS_FIXED = Math.round(0.05 * 1.4 * MZP_2026); // 5 950
const TAX_RATE = 0.04;
const BASE_MIN = MZP_2026;            // 85 000
const BASE_MAX_OPV = 50 * MZP_2026;   // 4 250 000
const BASE_MAX_SO = 7 * MZP_2026;     // 595 000

export default function IpPaymentsCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [declaredIncome, setDeclaredIncome] = useState<string>(String(MZP_2026));
  const [actualIncome, setActualIncome] = useState<string>('600000');
  const [bornBefore1975, setBornBefore1975] = useState(false);

  const computeResults = () => {
    const declared = Math.max(parseFloat(declaredIncome) || 0, 0);
    const actual = Math.max(parseFloat(actualIncome) || 0, 0);
    const opvBase = Math.min(Math.max(declared, BASE_MIN), BASE_MAX_OPV);
    const soBase = Math.min(Math.max(declared, BASE_MIN), BASE_MAX_SO);
    const opv = opvBase * OPV_RATE;
    const opvr = bornBefore1975 ? 0 : opvBase * OPVR_RATE_2026;
    const so = soBase * SO_RATE;
    const selfTotal = opv + opvr + so + VOSMS_FIXED;
    const tax = actual * TAX_RATE;
    return {
      opv: Math.round(opv),
      opvr: Math.round(opvr),
      so: Math.round(so),
      vosms: VOSMS_FIXED,
      selfTotal: Math.round(selfTotal),
      tax: Math.round(tax),
      grandTotal: Math.round(selfTotal + tax),
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [declaredIncome, actualIncome, bornBefore1975]
  );

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (results.selfTotal <= 0) return '';
    return `${t('ip-payments.parameters')}:
- ${t('ip-payments.declaredLabel')}: ${formatNumber(parseFloat(declaredIncome) || 0)}
- ${t('ip-payments.actualLabel')}: ${formatNumber(parseFloat(actualIncome) || 0)}

${t('ip-payments.results')}:
- ${t('ip-payments.selfTotal')}: ${formatNumber(results.selfTotal)}
- ${t('ip-payments.taxLabel')}: ${formatNumber(results.tax)}
- ${t('ip-payments.grandTotal')}: ${formatNumber(results.grandTotal)}`;
  };

  const breakdown = [
    { key: 'opv', value: results.opv, color: '#3b82f6' },
    { key: 'opvr', value: results.opvr, color: '#8b5cf6' },
    { key: 'so', value: results.so, color: '#10b981' },
    { key: 'vosms', value: results.vosms, color: '#06b6d4' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('ip-payments.heading')}</h1>
            <p className="text-gray-600">{t('ip-payments.subtitle')}</p>
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

      <QuickAnswer calculatorId="ip-payments" />

      {/* Кросс-ссылка на полный калькулятор (с работниками), чтобы не конкурировать за один запрос */}
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        <span>{t('ip-payments.crossLinkText')}</span>
        <LocalizedLink to="/calculator/ip-simplified/" className="font-medium underline hover:text-blue-900">
          {t('ip-payments.crossLinkLabel')} →
        </LocalizedLink>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ip-payments.parameters')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('ip-payments.declaredLabel')}</label>
              <RangeSlider
                value={parseFloat(declaredIncome) || 0}
                onChange={(val) => setDeclaredIncome(String(val))}
                min={MZP_2026}
                max={1000000}
                step={5000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#10b981"
              />
              <input
                type="number"
                value={declaredIncome}
                onChange={(e) => setDeclaredIncome(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">{t('ip-payments.declaredHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('ip-payments.actualLabel')}</label>
              <RangeSlider
                value={parseFloat(actualIncome) || 0}
                onChange={(val) => setActualIncome(String(val))}
                min={0}
                max={5000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#10b981"
              />
              <input
                type="number"
                value={actualIncome}
                onChange={(e) => setActualIncome(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">{t('ip-payments.actualHint')}</p>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bornBefore1975}
                onChange={(e) => setBornBefore1975(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{t('ip-payments.born1975Label')}</span>
                <br />
                <span className="text-gray-500">{t('ip-payments.born1975Hint')}</span>
              </span>
            </label>

            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-emerald-900 mb-2">{t('ip-payments.ratesTitle')}</h3>
              <div className="text-xs text-emerald-800 space-y-1">
                <div>• {t('ip-payments.rateOpv')}</div>
                <div>• {t('ip-payments.rateOpvr')}</div>
                <div>• {t('ip-payments.rateSo')}</div>
                <div>• {t('ip-payments.rateVosms')}</div>
                <div>• {t('ip-payments.rateTax')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ip-payments.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg px-4">
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('ip-payments.grandTotal')}</span>
                <span className="block text-xs text-gray-500">{t('ip-payments.perMonth')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-700">{formatNumber(results.grandTotal)}</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 pt-2">{t('ip-payments.selfTitle')}</h3>
            {breakdown.map((item) => (
              <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{t(`ip-payments.${item.key}`)}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatNumber(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">{t('ip-payments.selfTotal')}</span>
              <span className="font-bold text-gray-900">{formatNumber(results.selfTotal)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('ip-payments.taxLabel')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.tax)}</span>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {t('ip-payments.deadlinesNote')}
            </div>
          </div>
        </div>
      </div>

      {results.selfTotal > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              ...breakdown.map((b) => ({ name: t(`ip-payments.${b.key}`), value: b.value })),
              { name: t('ip-payments.taxLabel'), value: results.tax },
            ]}
            title={t('ip-payments.chartTitle')}
          />
        </div>
      )}

      {results.selfTotal > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('ip-payments.exportTitle')}
            description={t('ip-payments.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.selfTotal > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('ip-payments.export.title'),
              subtitle: `${formatNumber(results.grandTotal)} ${t('ip-payments.export.perMonthLabel')}`,
              sections: [
                {
                  title: t('ip-payments.export.results'),
                  data: [
                    { label: t('ip-payments.declaredLabel'), value: formatNumber(parseFloat(declaredIncome) || 0) },
                    { label: t('ip-payments.opv'), value: formatNumber(results.opv) },
                    { label: t('ip-payments.opvr'), value: formatNumber(results.opvr) },
                    { label: t('ip-payments.so'), value: formatNumber(results.so) },
                    { label: t('ip-payments.vosms'), value: formatNumber(results.vosms) },
                    { label: t('ip-payments.taxLabel'), value: formatNumber(results.tax) },
                    { label: t('ip-payments.grandTotal'), value: formatNumber(results.grandTotal) },
                  ],
                },
              ],
              footer: t('ip-payments.export.footer'),
            }}
            filename="ip-payments-calculation"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="ip-payments" />
      <MethodologySection calculatorId="ip-payments" />
      <FAQSection
        items={[
          { question: t('ip-payments.faq.q1'), answer: t('ip-payments.faq.a1') },
          { question: t('ip-payments.faq.q2'), answer: t('ip-payments.faq.a2') },
          { question: t('ip-payments.faq.q3'), answer: t('ip-payments.faq.a3') },
          { question: t('ip-payments.faq.q4'), answer: t('ip-payments.faq.a4') },
          { question: t('ip-payments.faq.q5'), answer: t('ip-payments.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Әлеуметтік кодексі (245, 248–251-баптар)' : 'Социальный кодекс РК (ст. 245, 248–251)', url: 'https://adilet.zan.kz/rus/docs/K2300000224' },
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі (722, 726-баптар)' : 'НК РК (ст. 722, 726)', url: 'https://adilet.zan.kz/rus/docs/K2500000214' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="ip-payments" calculatorTitle={t('ip-payments.heading')} />
      <LastUpdated calculatorId="ip-payments" />
    </div>
  );
}
