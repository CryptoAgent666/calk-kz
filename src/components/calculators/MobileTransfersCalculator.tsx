import { useState, useMemo } from 'react';
import { Smartphone, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import LocalizedLink from '../LocalizedLink';

/**
 * Чекер критериев КГД по мобильным переводам (приказ МФ РК от 12.11.2025
 * № 698 к базовому № 323, действует с 01.01.2026).
 *
 * Признак предпринимательства — ВСЕ условия одновременно:
 *  1) поступления от 100 и более разных отправителей,
 *  2) в КАЖДОМ из трёх последовательных месяцев,
 *  3) сумма за эти 3 месяца свыше 12 МЗП (12 × 85 000 = 1 020 000 ₸),
 *  4) на личный счёт (не для предпринимательской деятельности).
 * Это критерий камерального контроля (банки отчитываются ежеквартально),
 * НЕ автоматический налог: письмо → уведомление (30 раб. дней) → доначисления;
 * деятельность без регистрации — ст. 463 КоАП (15–100 МРП).
 */
const MZP_2026 = 85000;
const SUM_THRESHOLD = 12 * MZP_2026; // 1 020 000 ₸ за 3 месяца
const SENDERS_THRESHOLD = 100;

export default function MobileTransfersCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [senders, setSenders] = useState<string[]>(['110', '95', '120']);
  const [amounts, setAmounts] = useState<string[]>(['400000', '350000', '420000']);

  const computeResults = () => {
    const s = senders.map((v) => parseInt(v) || 0);
    const a = amounts.map((v) => parseFloat(v) || 0);
    const monthsOver = s.map((n) => n >= SENDERS_THRESHOLD);
    const sendersEachMonth = monthsOver.every(Boolean);
    const totalSum = a.reduce((acc, v) => acc + v, 0);
    const sumExceeded = totalSum > SUM_THRESHOLD;
    return {
      sendersEachMonth,
      totalSum,
      sumExceeded,
      flagged: sendersEachMonth && sumExceeded,
      monthsOver,
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [senders, amounts]
  );

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const setMonthValue = (arr: string[], setter: (v: string[]) => void, idx: number, value: string) => {
    const next = [...arr];
    next[idx] = value;
    setter(next);
  };

  const criteria = [
    {
      ok: !results.sendersEachMonth,
      label: t('mobile-transfers.criterionSenders', { n: SENDERS_THRESHOLD }),
      detail: t('mobile-transfers.criterionSendersDetail'),
    },
    {
      ok: !results.sumExceeded,
      label: t('mobile-transfers.criterionSum', { kzt: formatNumber(SUM_THRESHOLD) }),
      detail: `${t('mobile-transfers.yourSum')}: ${formatNumber(results.totalSum)}`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('mobile-transfers.heading')}</h1>
            <p className="text-gray-600">{t('mobile-transfers.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {i18n.language === 'kk'
            ? 'Бұл — ҚМК критерийлері бойынша бағдарлы тексеру, салық есептеуіші емес. Нақты жағдай бойынша шешімді салық органы камералдық бақылау аясында қабылдайды.'
            : 'Это ориентировочная проверка по критериям КГД, а не расчёт налога. Решение по конкретной ситуации принимает налоговый орган в рамках камерального контроля.'}
        </p>
      </div>

      <QuickAnswer calculatorId="mobile-transfers" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('mobile-transfers.parameters')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('mobile-transfers.parametersHint')}</p>

          <div className="space-y-5">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('mobile-transfers.monthLabel', { n: idx + 1 })}
                  {results.monthsOver[idx] && (
                    <span className="ml-2 text-xs font-medium text-red-600">
                      ≥{SENDERS_THRESHOLD} {t('mobile-transfers.sendersShort')}
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('mobile-transfers.sendersLabel')}</label>
                    <input
                      type="number"
                      min="0"
                      value={senders[idx]}
                      onChange={(e) => setMonthValue(senders, setSenders, idx, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('mobile-transfers.amountLabel')}</label>
                    <input
                      type="number"
                      min="0"
                      value={amounts[idx]}
                      onChange={(e) => setMonthValue(amounts, setAmounts, idx, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('mobile-transfers.exclusionsText')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mobile-transfers.results')}</h2>

          <div
            className={`rounded-xl p-5 mb-5 ${
              results.flagged ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {results.flagged ? (
                <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <div className={`text-lg font-bold ${results.flagged ? 'text-red-700' : 'text-emerald-700'}`}>
                  {results.flagged ? t('mobile-transfers.verdictFlagged') : t('mobile-transfers.verdictOk')}
                </div>
                <p className={`text-sm ${results.flagged ? 'text-red-600' : 'text-emerald-600'}`}>
                  {results.flagged ? t('mobile-transfers.verdictFlaggedText') : t('mobile-transfers.verdictOkText')}
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('mobile-transfers.criteriaTitle')}</h3>
          <div className="space-y-3">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-start space-x-3 rounded-lg border border-gray-100 p-3">
                {c.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-800">{c.label}</div>
                  <div className="text-xs text-gray-500">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {results.flagged && (
            <div className="mt-5 rounded-lg bg-violet-50 border border-violet-200 p-4">
              <h4 className="text-sm font-semibold text-violet-900 mb-2">{t('mobile-transfers.whatToDoTitle')}</h4>
              <ul className="text-sm text-violet-800 space-y-1.5 list-disc list-inside">
                <li>
                  {t('mobile-transfers.whatToDo1')}{' '}
                  <LocalizedLink to="/calculator/self-employed/" className="underline font-medium">
                    {t('mobile-transfers.whatToDo1Link')}
                  </LocalizedLink>
                </li>
                <li>
                  {t('mobile-transfers.whatToDo2')}{' '}
                  <LocalizedLink to="/calculator/ip-simplified/" className="underline font-medium">
                    {t('mobile-transfers.whatToDo2Link')}
                  </LocalizedLink>
                </li>
                <li>{t('mobile-transfers.whatToDo3')}</li>
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            {t('mobile-transfers.processNote')}
          </div>
        </div>
      </div>

      <CalculatorExamples calculatorId="mobile-transfers" />
      <MethodologySection calculatorId="mobile-transfers" />
      <FAQSection
        items={[
          { question: t('mobile-transfers.faq.q1'), answer: t('mobile-transfers.faq.a1') },
          { question: t('mobile-transfers.faq.q2'), answer: t('mobile-transfers.faq.a2') },
          { question: t('mobile-transfers.faq.q3'), answer: t('mobile-transfers.faq.a3') },
          { question: t('mobile-transfers.faq.q4'), answer: t('mobile-transfers.faq.a4') },
          { question: t('mobile-transfers.faq.q5'), answer: t('mobile-transfers.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚМ бұйрығы — тәуекел критерийлері (№ 323, № 698 өзг.)' : 'Приказ МФ РК о критериях (№ 323 с изм. № 698)', url: 'https://adilet.zan.kz/rus/docs/V2200027305' },
          { title: i18n.language === 'kk' ? 'ҚМК ресми түсіндірмесі' : 'Разъяснение КГД МФ РК', url: 'https://kgd.gov.kz/ru/news/otnositelno-ogranicheniy-na-mobilnye-perevody-1-132716' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="mobile-transfers" calculatorTitle={t('mobile-transfers.heading')} />
      <LastUpdated calculatorId="mobile-transfers" />
    </div>
  );
}
