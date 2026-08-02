import { useState, useMemo } from 'react';
import { TrendingUp, Calculator, Info, AlertTriangle } from 'lucide-react';
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
 * ИПН с дивидендов 2026 (новый НК РК от 18.07.2025 № 214-VIII).
 *
 * Резидент (ст. 363 п.1 пп.3, порог за календарный год нарастающим итогом, ст. 441):
 *   до 230 000 МРП — 5%; свыше — 5% с порога + 15% с превышения.
 * Льгота 30 000 МРП и 3-летнее освобождение отменены с 01.01.2026.
 * Нерезидент: 15% у источника (ст. 682 п.1 пп.5); при доле ≥25% — та же прогрессия.
 * ТОО — налоговый агент: удержание при выплате, перечисление до 25 числа
 * следующего месяца (ф. 200.00). Начисленные в 2025 — по старым правилам
 * (10% + льгота 30 000 МРП) — определяет дата начисления (разъяснение КГД 02.03.2026).
 */
const MRP_2026 = 4325;
const THRESHOLD_MRP = 230000;
const THRESHOLD_KZT = THRESHOLD_MRP * MRP_2026; // 994 750 000 ₸
const RATE_LOW = 0.05;
const RATE_HIGH = 0.15;
const RATE_NONRESIDENT = 0.15;

type ResidencyStatus = 'resident' | 'nonresident';

export default function DividendTaxCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [amount, setAmount] = useState<string>('5000000');
  const [status, setStatus] = useState<ResidencyStatus>('resident');

  const EMPTY_RESULTS = {
    tax: 0,
    net: 0,
    lowPart: 0,
    highPart: 0,
    effectiveRate: 0,
    overThreshold: false,
  };

  const computeResults = () => {
    const gross = parseFloat(amount) || 0;
    if (gross <= 0) {
      return EMPTY_RESULTS;
    }
    let tax = 0;
    let lowPart = 0;
    let highPart = 0;
    let overThreshold = false;
    if (status === 'nonresident') {
      tax = gross * RATE_NONRESIDENT;
    } else if (gross <= THRESHOLD_KZT) {
      lowPart = gross * RATE_LOW;
      tax = lowPart;
    } else {
      overThreshold = true;
      lowPart = THRESHOLD_KZT * RATE_LOW;
      highPart = (gross - THRESHOLD_KZT) * RATE_HIGH;
      tax = lowPart + highPart;
    }
    return {
      tax: Math.round(tax),
      net: Math.round(gross - tax),
      lowPart: Math.round(lowPart),
      highPart: Math.round(highPart),
      effectiveRate: (tax / gross) * 100,
      overThreshold,
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [amount, status, i18n.language]
  );

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    const gross = parseFloat(amount) || 0;
    if (gross <= 0) return '';
    return `${t('dividend-tax.parameters')}:
- ${t('dividend-tax.amountLabel')}: ${formatNumber(gross)}
- ${t('dividend-tax.statusLabel')}: ${t(`dividend-tax.${status}`)}

${t('dividend-tax.results')}:
- ${t('dividend-tax.taxLabel')}: ${formatNumber(results.tax)}
- ${t('dividend-tax.netLabel')}: ${formatNumber(results.net)}
- ${t('dividend-tax.effectiveRate')}: ${results.effectiveRate.toFixed(2)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('dividend-tax.heading')}</h1>
            <p className="text-gray-600">{t('dividend-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            <strong>{t('dividend-tax.transitionTitle')}</strong> {t('dividend-tax.transitionText')}
          </p>
        </div>
      </div>

      <QuickAnswer calculatorId="dividend-tax" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('dividend-tax.parameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dividend-tax.amountLabel')}
              </label>
              <RangeSlider
                value={parseFloat(amount) || 0}
                onChange={(val) => setAmount(String(val))}
                min={100000}
                max={20000000}
                step={100000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#10b981"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('dividend-tax.amountPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dividend-tax.statusLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['resident', 'nonresident'] as ResidencyStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      status === s
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`dividend-tax.${s}`)}
                  </button>
                ))}
              </div>
              {status === 'nonresident' && (
                <p className="mt-2 text-xs text-gray-500">{t('dividend-tax.nonResidentNote')}</p>
              )}
            </div>

            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-emerald-900 mb-2">{t('dividend-tax.ratesTitle')}</h3>
              <div className="text-xs text-emerald-800 space-y-1">
                <div>• {t('dividend-tax.rateLow', { threshold: THRESHOLD_MRP.toLocaleString('ru-KZ'), kzt: formatNumber(THRESHOLD_KZT) })}</div>
                <div>• {t('dividend-tax.rateHigh')}</div>
                <div>• {t('dividend-tax.rateNonResident')}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">{t('dividend-tax.agentTitle')}</h3>
                  <p className="text-blue-800 text-sm">{t('dividend-tax.agentText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('dividend-tax.results')}</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('dividend-tax.netLabel')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-700">{formatNumber(results.net)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('dividend-tax.taxLabel')}</span>
              <span className="font-semibold text-red-600">−{formatNumber(results.tax)}</span>
            </div>

            {status === 'resident' && results.overThreshold && (
              <>
                <h3 className="text-sm font-semibold text-gray-700 pt-2">{t('dividend-tax.breakdown')}</h3>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('dividend-tax.part5')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.lowPart)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 text-sm">{t('dividend-tax.part15')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.highPart)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">{t('dividend-tax.effectiveRate')}</span>
              <span className="font-semibold text-gray-900">{results.effectiveRate.toFixed(2)}%</span>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {t('dividend-tax.thresholdInfo', { threshold: THRESHOLD_MRP.toLocaleString('ru-KZ'), kzt: formatNumber(THRESHOLD_KZT) })}
            </div>
          </div>
        </div>
      </div>

      {results.tax > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('dividend-tax.chartNet'), value: results.net },
              { name: t('dividend-tax.chartTax'), value: results.tax },
            ]}
            title={t('dividend-tax.chartTitle')}
          />
        </div>
      )}

      {parseFloat(amount) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('dividend-tax.exportTitle')}
            description={t('dividend-tax.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.tax > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('dividend-tax.export.title'),
              subtitle: `${formatNumber(results.net)} ${t('dividend-tax.export.netLabel')}`,
              sections: [
                {
                  title: t('dividend-tax.export.results'),
                  data: [
                    { label: t('dividend-tax.amountLabel'), value: formatNumber(parseFloat(amount) || 0) },
                    { label: t('dividend-tax.statusLabel'), value: t(`dividend-tax.${status}`) },
                    { label: t('dividend-tax.taxLabel'), value: formatNumber(results.tax) },
                    { label: t('dividend-tax.netLabel'), value: formatNumber(results.net) },
                    { label: t('dividend-tax.effectiveRate'), value: `${results.effectiveRate.toFixed(2)}%` },
                  ],
                },
              ],
              footer: t('dividend-tax.export.footer'),
            }}
            filename="dividend-tax-calculation"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="dividend-tax" />
      <MethodologySection calculatorId="dividend-tax" />
      <FAQSection
        items={[
          { question: t('dividend-tax.faq.q1'), answer: t('dividend-tax.faq.a1') },
          { question: t('dividend-tax.faq.q2'), answer: t('dividend-tax.faq.a2') },
          { question: t('dividend-tax.faq.q3'), answer: t('dividend-tax.faq.a3') },
          { question: t('dividend-tax.faq.q4'), answer: t('dividend-tax.faq.a4') },
          { question: t('dividend-tax.faq.q5'), answer: t('dividend-tax.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі, 363, 441-баптар' : 'НК РК, ст. 363, 441', url: 'https://adilet.zan.kz/rus/docs/K2500000214' },
          { title: i18n.language === 'kk' ? 'ҚМ Мемлекеттік кірістер комитеті' : 'КГД МФ РК', url: 'https://kgd.gov.kz/' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="dividend-tax" calculatorTitle={t('dividend-tax.heading')} />
      <LastUpdated calculatorId="dividend-tax" />
    </div>
  );
}
