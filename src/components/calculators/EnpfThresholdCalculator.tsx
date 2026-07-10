import { useState, useEffect } from 'react';
import { Wallet, Calculator, Info, CheckCircle2, XCircle } from 'lucide-react';
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
 * Пороги минимальной достаточности (ПМД) ЕНПФ и доступный излишек на
 * жильё/лечение. Методика: ПП РК № 521 от 30.06.2023 в ред. ПП № 422 от
 * 21.05.2026 (без учёта будущих взносов — пороги выросли на 79%+).
 * Таблица опубликована ЕНПФ 06.06.2026, обновляется ежегодно (декабрь,
 * после закона о бюджете). Формула: излишек = накопления − ПМД(возраст).
 * Для получателей пенсии по возрасту ПМД не применяется.
 * ⚠️ Rollover: при новой таблице ЕНПФ обновить PMD_2026 разом.
 */
const PMD_2026: Record<number, number> = {
  20: 6670000, 21: 6960000, 22: 7250000, 23: 7540000, 24: 7840000,
  25: 8150000, 26: 8460000, 27: 8770000, 28: 9090000, 29: 9420000,
  30: 9750000, 31: 10090000, 32: 10430000, 33: 10780000, 34: 11130000,
  35: 11490000, 36: 11850000, 37: 12220000, 38: 12600000, 39: 12980000,
  40: 13370000, 41: 13760000, 42: 14160000, 43: 14560000, 44: 14980000,
  45: 15400000, 46: 15820000, 47: 16250000, 48: 16690000, 49: 17140000,
  50: 17590000, 51: 18050000, 52: 18510000, 53: 18980000, 54: 19460000,
  55: 19950000, 56: 20450000, 57: 20950000, 58: 21460000, 59: 21970000,
  60: 22500000, 61: 23030000, 62: 23570000,
};
const MIN_AGE = 20;
const MAX_AGE = 62;

export default function EnpfThresholdCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [age, setAge] = useState<string>('35');
  const [savings, setSavings] = useState<string>('12000000');

  const [results, setResults] = useState({
    pmd: 0,
    available: 0,
    shortfall: 0,
    eligible: false,
  });

  useEffect(() => {
    const a = Math.min(Math.max(parseInt(age) || MIN_AGE, MIN_AGE), MAX_AGE);
    const s = parseFloat(savings) || 0;
    const pmd = PMD_2026[a] ?? PMD_2026[MAX_AGE];
    const diff = s - pmd;
    setResults({
      pmd,
      available: Math.max(0, Math.round(diff)),
      shortfall: Math.max(0, Math.round(-diff)),
      eligible: diff > 0,
    });
  }, [age, savings]);

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    const s = parseFloat(savings) || 0;
    if (s <= 0) return '';
    return `${t('enpf-threshold.parameters')}:
- ${t('enpf-threshold.ageLabel')}: ${age}
- ${t('enpf-threshold.savingsLabel')}: ${formatNumber(s)}

${t('enpf-threshold.results')}:
- ${t('enpf-threshold.pmdLabel')}: ${formatNumber(results.pmd)}
- ${results.eligible ? t('enpf-threshold.availableLabel') : t('enpf-threshold.shortfallLabel')}: ${formatNumber(results.eligible ? results.available : results.shortfall)}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('enpf-threshold.heading')}</h1>
            <p className="text-gray-600">{t('enpf-threshold.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          <strong>{t('enpf-threshold.methodTitle')}</strong> {t('enpf-threshold.methodText')}
        </p>
      </div>

      <QuickAnswer calculatorId="enpf-threshold" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('enpf-threshold.parameters')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('enpf-threshold.ageLabel')}</label>
              <RangeSlider
                value={parseInt(age) || MIN_AGE}
                onChange={(val) => setAge(String(val))}
                min={MIN_AGE}
                max={MAX_AGE}
                step={1}
                formatValue={(v) => `${v}`}
                color="#14b8a6"
              />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={MIN_AGE}
                max={MAX_AGE}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('enpf-threshold.savingsLabel')}</label>
              <RangeSlider
                value={parseFloat(savings) || 0}
                onChange={(val) => setSavings(String(val))}
                min={1000000}
                max={50000000}
                step={500000}
                formatValue={(v) => `${(v / 1000000).toFixed(1)} млн ₸`}
                color="#14b8a6"
              />
              <input
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                placeholder={t('enpf-threshold.savingsPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">{t('enpf-threshold.savingsHint')}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">{t('enpf-threshold.usageTitle')}</h3>
                  <p className="text-blue-800 text-sm">{t('enpf-threshold.usageText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('enpf-threshold.results')}</h2>
          <div className="space-y-4">
            <div
              className={`rounded-xl p-5 ${
                results.eligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {results.eligible ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                )}
                <div>
                  <div className={`text-lg font-bold ${results.eligible ? 'text-emerald-700' : 'text-red-700'}`}>
                    {results.eligible ? t('enpf-threshold.verdictYes') : t('enpf-threshold.verdictNo')}
                  </div>
                  <p className={`text-sm ${results.eligible ? 'text-emerald-600' : 'text-red-600'}`}>
                    {results.eligible
                      ? t('enpf-threshold.verdictYesText')
                      : t('enpf-threshold.verdictNoText')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">
                {results.eligible ? t('enpf-threshold.availableLabel') : t('enpf-threshold.shortfallLabel')}
              </span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-teal-600" />
                <span className={`text-xl font-bold ${results.eligible ? 'text-teal-700' : 'text-red-600'}`}>
                  {formatNumber(results.eligible ? results.available : results.shortfall)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('enpf-threshold.pmdLabel')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.pmd)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('enpf-threshold.savingsLabel')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(parseFloat(savings) || 0)}</span>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {t('enpf-threshold.operatorsNote')}
            </div>
          </div>
        </div>
      </div>

      {parseFloat(savings) > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('enpf-threshold.exportTitle')}
            description={t('enpf-threshold.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.pmd > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('enpf-threshold.export.title'),
              subtitle: `${formatNumber(results.eligible ? results.available : 0)} ${t('enpf-threshold.export.availableLabel')}`,
              sections: [
                {
                  title: t('enpf-threshold.export.results'),
                  data: [
                    { label: t('enpf-threshold.ageLabel'), value: age },
                    { label: t('enpf-threshold.savingsLabel'), value: formatNumber(parseFloat(savings) || 0) },
                    { label: t('enpf-threshold.pmdLabel'), value: formatNumber(results.pmd) },
                    {
                      label: results.eligible ? t('enpf-threshold.availableLabel') : t('enpf-threshold.shortfallLabel'),
                      value: formatNumber(results.eligible ? results.available : results.shortfall),
                    },
                  ],
                },
              ],
              footer: t('enpf-threshold.export.footer'),
            }}
            filename="enpf-threshold-calculation"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="enpf-threshold" />
      <MethodologySection calculatorId="enpf-threshold" />
      <FAQSection
        items={[
          { question: t('enpf-threshold.faq.q1'), answer: t('enpf-threshold.faq.a1') },
          { question: t('enpf-threshold.faq.q2'), answer: t('enpf-threshold.faq.a2') },
          { question: t('enpf-threshold.faq.q3'), answer: t('enpf-threshold.faq.a3') },
          { question: t('enpf-threshold.faq.q4'), answer: t('enpf-threshold.faq.a4') },
          { question: t('enpf-threshold.faq.q5'), answer: t('enpf-threshold.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'БЖЗҚ — біржолғы зейнетақы төлемдері' : 'ЕНПФ — единовременные пенсионные выплаты', url: 'https://www.enpf.kz/ru/services/vyplaty/57499/' },
          { title: i18n.language === 'kk' ? 'ҚР ҮҚ № 422 (21.05.2026) — әдістеме' : 'ПП РК № 422 от 21.05.2026 — методика ПМД', url: 'https://adilet.zan.kz/rus/docs/P2600000422' },
        ]}
      />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="enpf-threshold" calculatorTitle={t('enpf-threshold.heading')} />
      <LastUpdated calculatorId="enpf-threshold" />
    </div>
  );
}
