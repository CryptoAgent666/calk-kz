import { useState, useEffect } from 'react';
import { FileSignature, Calculator, Info } from 'lucide-react';
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

/**
 * Налоги по договору ГПХ 2026 (физлицо-исполнитель без ИП).
 * Заказчик — налоговый агент, все платежи удерживаются из дохода:
 *  - ОПВ 10% (база ≤ 50 МЗП/мес — ст. 249 Соцкодекса);
 *  - ВОСМС 2% (база ≤ 20 МЗП/мес — предел повышен с 10 до 20 МЗП с 01.01.2026);
 *  - СО 5% × (доход − ОПВ), база ≤ 7 МЗП; с 01.01.2026 УДЕРЖИВАЮТСЯ из дохода
 *    (в 2025 платил агент за свой счёт) — письмо ГФСС № ЖТ-2026-01464407;
 *  - ИПН 10% × (доход − ОПВ − ВОСМС − СО − вычет 30 МРП, если заявлен);
 *    свыше 8 500 МРП/год — 15% с превышения (ст. 363 НК; здесь помесячно 10%).
 * ОПВР по ГПХ НЕ уплачивается (только за работников).
 * Контрольный пример: 500 000 ₸ (с вычетом) → на руки 388 725 ₸.
 */
const MRP_2026 = 4325;
const MZP_2026 = 85000;
const OPV_RATE = 0.10;
const OPV_BASE_CAP = 50 * MZP_2026; // 4 250 000
const VOSMS_RATE = 0.02;
const VOSMS_BASE_CAP = 20 * MZP_2026; // 1 700 000
const SO_RATE = 0.05;
const SO_BASE_CAP = 7 * MZP_2026; // 595 000
const IPN_RATE = 0.10;
const DEDUCTION_30MRP = 30 * MRP_2026; // 129 750

export default function GphTaxCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [amount, setAmount] = useState<string>('500000');
  const [useDeduction, setUseDeduction] = useState(true);

  const [results, setResults] = useState({
    opv: 0, vosms: 0, so: 0, ipn: 0, total: 0, net: 0,
  });

  useEffect(() => {
    const gross = parseFloat(amount) || 0;
    if (gross <= 0) {
      setResults({ opv: 0, vosms: 0, so: 0, ipn: 0, total: 0, net: 0 });
      return;
    }
    const opv = Math.min(gross, OPV_BASE_CAP) * OPV_RATE;
    const vosms = Math.min(gross, VOSMS_BASE_CAP) * VOSMS_RATE;
    const so = Math.min(gross - opv, SO_BASE_CAP) * SO_RATE;
    const taxable = Math.max(0, gross - opv - vosms - so - (useDeduction ? DEDUCTION_30MRP : 0));
    const ipn = taxable * IPN_RATE;
    const total = opv + vosms + so + ipn;
    setResults({
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      so: Math.round(so),
      ipn: Math.round(ipn),
      total: Math.round(total),
      net: Math.round(gross - total),
    });
  }, [amount, useDeduction]);

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    const gross = parseFloat(amount) || 0;
    if (gross <= 0) return '';
    return `${t('gph-tax.parameters')}:
- ${t('gph-tax.amountLabel')}: ${formatNumber(gross)}
- ${t('gph-tax.deductionLabel')}: ${useDeduction ? t('yes', { ns: 'common' }) : t('no', { ns: 'common' })}

${t('gph-tax.results')}:
- ${t('gph-tax.opv')}: ${formatNumber(results.opv)}
- ${t('gph-tax.vosms')}: ${formatNumber(results.vosms)}
- ${t('gph-tax.so')}: ${formatNumber(results.so)}
- ${t('gph-tax.ipn')}: ${formatNumber(results.ipn)}
- ${t('gph-tax.netLabel')}: ${formatNumber(results.net)}`;
  };

  const breakdown = [
    { key: 'opv', value: results.opv, color: '#3b82f6' },
    { key: 'vosms', value: results.vosms, color: '#10b981' },
    { key: 'so', value: results.so, color: '#8b5cf6' },
    { key: 'ipn', value: results.ipn, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('gph-tax.heading')}</h1>
            <p className="text-gray-600">{t('gph-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          <strong>{t('gph-tax.changeTitle')}</strong> {t('gph-tax.changeText')}
        </p>
      </div>

      <QuickAnswer calculatorId="gph-tax" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gph-tax.parameters')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('gph-tax.amountLabel')}</label>
              <RangeSlider
                value={parseFloat(amount) || 0}
                onChange={(val) => setAmount(String(val))}
                min={50000}
                max={3000000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#6366f1"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('gph-tax.amountPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useDeduction}
                onChange={(e) => setUseDeduction(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{t('gph-tax.deductionLabel')}</span>
                <br />
                <span className="text-gray-500">{t('gph-tax.deductionHint', { kzt: formatNumber(DEDUCTION_30MRP) })}</span>
              </span>
            </label>

            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">{t('gph-tax.ratesTitle')}</h3>
              <div className="text-xs text-indigo-800 space-y-1">
                <div>• {t('gph-tax.rateOpv')}</div>
                <div>• {t('gph-tax.rateVosms')}</div>
                <div>• {t('gph-tax.rateSo')}</div>
                <div>• {t('gph-tax.rateIpn')}</div>
                <div>• {t('gph-tax.rateOpvr')}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('gph-tax.agentText')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('gph-tax.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('gph-tax.netLabel')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <span className="text-xl font-bold text-indigo-700">{formatNumber(results.net)}</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 pt-2">{t('gph-tax.breakdown')}</h3>
            {breakdown.map((item) => (
              <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{t(`gph-tax.${item.key}`)}</span>
                </div>
                <span className="font-semibold text-red-600">−{formatNumber(item.value)}</span>
              </div>
            ))}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('gph-tax.totalWithheld')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.total)}</span>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {t('gph-tax.progressiveNote')}
            </div>
          </div>
        </div>
      </div>

      {results.total > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('gph-tax.chartNet'), value: results.net },
              ...breakdown.map((b) => ({ name: t(`gph-tax.${b.key}`), value: b.value })),
            ]}
            title={t('gph-tax.chartTitle')}
          />
        </div>
      )}

      {parseFloat(amount) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('gph-tax.exportTitle')}
            description={t('gph-tax.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.total > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('gph-tax.export.title'),
              subtitle: `${formatNumber(results.net)} ${t('gph-tax.export.netLabel')}`,
              sections: [
                {
                  title: t('gph-tax.export.results'),
                  data: [
                    { label: t('gph-tax.amountLabel'), value: formatNumber(parseFloat(amount) || 0) },
                    { label: t('gph-tax.opv'), value: formatNumber(results.opv) },
                    { label: t('gph-tax.vosms'), value: formatNumber(results.vosms) },
                    { label: t('gph-tax.so'), value: formatNumber(results.so) },
                    { label: t('gph-tax.ipn'), value: formatNumber(results.ipn) },
                    { label: t('gph-tax.netLabel'), value: formatNumber(results.net) },
                  ],
                },
              ],
              footer: t('gph-tax.export.footer'),
            }}
            filename="gph-tax-calculation"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="gph-tax" />
      <MethodologySection calculatorId="gph-tax" />
      <FAQSection
        items={[
          { question: t('gph-tax.faq.q1'), answer: t('gph-tax.faq.a1') },
          { question: t('gph-tax.faq.q2'), answer: t('gph-tax.faq.a2') },
          { question: t('gph-tax.faq.q3'), answer: t('gph-tax.faq.a3') },
          { question: t('gph-tax.faq.q4'), answer: t('gph-tax.faq.a4') },
          { question: t('gph-tax.faq.q5'), answer: t('gph-tax.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі (363, 402–403-баптар)' : 'НК РК (ст. 363, 402–403)', url: 'https://adilet.zan.kz/rus/docs/K2500000214' },
          { title: i18n.language === 'kk' ? 'ҚР Әлеуметтік кодексі (245, 249-баптар)' : 'Социальный кодекс РК (ст. 245, 249)', url: 'https://adilet.zan.kz/rus/docs/K2300000224' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="gph-tax" calculatorTitle={t('gph-tax.heading')} />
      <LastUpdated calculatorId="gph-tax" />
    </div>
  );
}
