import React, { useState, useEffect } from 'react';
import { Receipt, Calculator, Info, PieChart } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';

export default function UnifiedPaymentCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [grossSalary, setGrossSalary] = useState<string>('300000');

  // Единый платёж — 24.8% от ФОТ
  const EP_RATE = 0.248;

  // Распределение ЕП по фондам
  const OPV_SHARE = 0.403;
  const VOSMS_SHARE = 0.081;
  const IPN_SHARE = 0.073;
  const OPVR_SHARE = 0.141;
  const OOSMS_SHARE = 0.121;
  const SO_SHARE = 0.181;

  const [results, setResults] = useState({
    epTotal: 0,
    opv: 0,
    vosms: 0,
    ipn: 0,
    opvr: 0,
    oosms: 0,
    so: 0,
  });

  const calculate = (gross: number) => {
    if (gross <= 0) {
      return { epTotal: 0, opv: 0, vosms: 0, ipn: 0, opvr: 0, oosms: 0, so: 0 };
    }

    const epTotal = gross * EP_RATE;

    return {
      epTotal: Math.round(epTotal),
      opv: Math.round(epTotal * OPV_SHARE),
      vosms: Math.round(epTotal * VOSMS_SHARE),
      ipn: Math.round(epTotal * IPN_SHARE),
      opvr: Math.round(epTotal * OPVR_SHARE),
      oosms: Math.round(epTotal * OOSMS_SHARE),
      so: Math.round(epTotal * SO_SHARE),
    };
  };

  useEffect(() => {
    const gross = parseFloat(grossSalary) || 0;
    setResults(calculate(gross));
  }, [grossSalary]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' \u20B8';
  };

  const generateExportData = () => {
    const gross = parseFloat(grossSalary) || 0;
    if (gross <= 0) return '';

    return `${t('unified-payment.parameters')}:
- ${t('unified-payment.grossSalary')}: ${formatNumber(gross)}

${t('unified-payment.results')}:
- ${t('unified-payment.epTotal')} (${(EP_RATE * 100).toFixed(1)}%): ${formatNumber(results.epTotal)}

${t('unified-payment.breakdown')}:
- ${t('unified-payment.opv')} (${(OPV_SHARE * 100).toFixed(1)}%): ${formatNumber(results.opv)}
- ${t('unified-payment.vosms')} (${(VOSMS_SHARE * 100).toFixed(1)}%): ${formatNumber(results.vosms)}
- ${t('unified-payment.ipn')} (${(IPN_SHARE * 100).toFixed(1)}%): ${formatNumber(results.ipn)}
- ${t('unified-payment.opvr')} (${(OPVR_SHARE * 100).toFixed(1)}%): ${formatNumber(results.opvr)}
- ${t('unified-payment.oosms')} (${(OOSMS_SHARE * 100).toFixed(1)}%): ${formatNumber(results.oosms)}
- ${t('unified-payment.so')} (${(SO_SHARE * 100).toFixed(1)}%): ${formatNumber(results.so)}`;
  };

  const breakdownItems = [
    { key: 'opv', share: OPV_SHARE, value: results.opv, color: '#3b82f6' },
    { key: 'vosms', share: VOSMS_SHARE, value: results.vosms, color: '#10b981' },
    { key: 'ipn', share: IPN_SHARE, value: results.ipn, color: '#f59e0b' },
    { key: 'opvr', share: OPVR_SHARE, value: results.opvr, color: '#8b5cf6' },
    { key: 'oosms', share: OOSMS_SHARE, value: results.oosms, color: '#06b6d4' },
    { key: 'so', share: SO_SHARE, value: results.so, color: '#ef4444' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('unified-payment.heading')}</h1>
            <p className="text-gray-600">{t('unified-payment.subtitle')}</p>
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

      <QuickAnswer calculatorId="unified-payment" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('unified-payment.parameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('unified-payment.grossSalary')}
              </label>
              <RangeSlider
                value={parseFloat(grossSalary) || 0}
                onChange={(val) => setGrossSalary(String(val))}
                min={100000}
                max={3000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} \u20B8`}
                color="#6366f1"
              />
              <input
                type="number"
                id="grossSalary"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
                placeholder={t('unified-payment.grossSalaryPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">{t('unified-payment.ratesTitle')}</h3>
              <div className="text-xs text-indigo-800 space-y-1">
                <div><strong>{t('unified-payment.epRateLabel')}</strong> 24.8%</div>
                <div className="mt-2"><strong>{t('unified-payment.distributionLabel')}</strong></div>
                <div>• {t('unified-payment.opv')} — 40.3%</div>
                <div>• {t('unified-payment.vosms')} — 8.1%</div>
                <div>• {t('unified-payment.ipn')} — 7.3%</div>
                <div>• {t('unified-payment.opvr')} — 14.1%</div>
                <div>• {t('unified-payment.oosms')} — 12.1%</div>
                <div>• {t('unified-payment.so')} — 18.1%</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    {t('unified-payment.whoCanUseTitle')}
                  </h3>
                  <p className="text-blue-800 text-sm">
                    {t('unified-payment.whoCanUseText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('unified-payment.results')}</h2>

          <div className="space-y-4">
            {/* Total EP */}
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-4">
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('unified-payment.epTotal')}</span>
                <span className="text-sm text-gray-500 ml-2">(24.8%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <span className="text-xl font-bold text-indigo-700">{formatNumber(results.epTotal)}</span>
              </div>
            </div>

            {/* Breakdown */}
            <h3 className="text-sm font-semibold text-gray-700 pt-2">{t('unified-payment.breakdown')}</h3>

            {breakdownItems.map((item) => (
              <div key={item.key} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">
                    {t(`unified-payment.${item.key}`)}
                    <span className="text-xs text-gray-400 ml-1">({(item.share * 100).toFixed(1)}%)</span>
                  </span>
                </div>
                <span className="font-semibold text-gray-900">{formatNumber(item.value)}</span>
              </div>
            ))}

            {/* Salary info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('unified-payment.grossSalary')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(parseFloat(grossSalary) || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('unified-payment.totalWithEP')}</span>
                <span className="font-bold text-indigo-700">
                  {formatNumber((parseFloat(grossSalary) || 0) + results.epTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      {results.epTotal > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={breakdownItems.map((item) => ({
              name: t(`unified-payment.${item.key}`),
              value: item.value,
            }))}
            title={t('unified-payment.chartTitle')}
          />
        </div>
      )}

      {/* Share/Print */}
      {parseFloat(grossSalary) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('unified-payment.exportTitle')}
            description={t('unified-payment.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {/* Export */}
      {results.epTotal > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('unified-payment.export.title'),
              subtitle: `${formatNumber(results.epTotal)} ${t('unified-payment.export.epLabel')}`,
              sections: [
                {
                  title: t('unified-payment.export.results'),
                  data: [
                    { label: t('unified-payment.grossSalary'), value: formatNumber(parseFloat(grossSalary) || 0) },
                    { label: t('unified-payment.epTotal'), value: formatNumber(results.epTotal) },
                    { label: t('unified-payment.opv'), value: formatNumber(results.opv) },
                    { label: t('unified-payment.vosms'), value: formatNumber(results.vosms) },
                    { label: t('unified-payment.ipn'), value: formatNumber(results.ipn) },
                    { label: t('unified-payment.opvr'), value: formatNumber(results.opvr) },
                    { label: t('unified-payment.oosms'), value: formatNumber(results.oosms) },
                    { label: t('unified-payment.so'), value: formatNumber(results.so) },
                  ],
                },
              ],
              footer: t('unified-payment.export.footer'),
            }}
            filename="unified-payment-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="unified-payment" />
      <MethodologySection steps={getMethodology('unified-payment')} />
      <FAQSection
        items={[
          { question: t('unified-payment.faq.q1'), answer: t('unified-payment.faq.a1') },
          { question: t('unified-payment.faq.q2'), answer: t('unified-payment.faq.a2') },
          { question: t('unified-payment.faq.q3'), answer: t('unified-payment.faq.a3') },
          { question: t('unified-payment.faq.q4'), answer: t('unified-payment.faq.a4') },
          { question: t('unified-payment.faq.q5'), answer: t('unified-payment.faq.a5') },
        ]}
        sources={[
          { title: 'Налоговый кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'Единый платёж — egov.kz', url: 'https://egov.kz/' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="unified-payment"
        calculatorTitle={t('unified-payment.heading')}
      />
      <LastUpdated calculatorId="unified-payment" />
    </div>
  );
}
