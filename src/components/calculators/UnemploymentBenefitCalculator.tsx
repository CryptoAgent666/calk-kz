import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Calculator, Users, DollarSign, Clock, Info, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { RangeSlider } from '../ui/RangeSlider';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';

/** МЗП 2026 (закон о республиканском бюджете). Именованной константой, а не
 *  литералом в выражении: при смене МЗП поиск по MZP_2026 обязан находить
 *  ВСЕ места, иначе предел дохода тихо останется на прошлогоднем уровне. */
const MZP_2026 = 85_000;
/** Объект исчисления соц. отчислений ограничен 7 МЗП. */
const SO_INCOME_CAP_MZP = 7;

export default function UnemploymentBenefitCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [workExperienceMonths, setWorkExperienceMonths] = useState<string>('36');
  const [socialContributions, setSocialContributions] = useState<string>('500000');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — гидратация падает (#418/#425).
  const EMPTY_RESULTS = {
    averageMonthlyIncome: 0,
    incomeReplacementCoef: 0.45,
    experienceCoef: 0,
    monthlyBenefit: 0,
    paymentPeriodMonths: 0,
    totalBenefit: 0,
    isEligible: false,
    minRequiredExperience: 6
  };

  // Коэффициент стажа участия (КСУ). Правила, утв. приказом от 22.06.2023 № 237
  // (рег. МЮ № 32881), п. 37, дословно:
  //   «При стаже участия 72 и более месяцев КСУ = 1,0 + 0,02 × ЦЕЛОЕ((Мсо − 60 мес.)/12 мес.)»,
  //   «за каждый год стажа участия СВЫШЕ ПЯТИ ЛЕТ», но не более 1,3.
  // Отсчёт надбавки идёт от 60 месяцев, а не от 72: при стаже 6 лет КСУ уже 1,02.
  // До 17.08.2026 в коде стояло (months − 72) — надбавка отставала на год и
  // занижала выплату всем со стажем 6–19 лет примерно на 2%.
  const getExperienceCoefficient = (months: number) => {
    if (months < 6) return 0;
    if (months < 12) return 0.7;
    if (months < 24) return 0.75;
    if (months < 36) return 0.85;
    if (months < 48) return 0.9;
    if (months < 60) return 0.95;
    if (months < 72) return 1.0;
    return Math.min(1.3, 1.0 + 0.02 * Math.floor((months - 60) / 12));
  };

  // Срок выплаты (ГФСС, 2026): от 6 мес стажа — 1 месяц ... 5+ лет — 6 месяцев
  const getPaymentPeriod = (months: number) => {
    if (months < 6) return 0;
    if (months < 12) return 1;
    if (months < 24) return 2;
    if (months < 36) return 3;
    if (months < 48) return 4;
    if (months < 60) return 5;
    return 6;
  };

  const normalizeNumberInput = (value: string) => {
    if (!value) {
      return 0;
    }

    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeMonthsInput = (value: string) =>
    Math.max(0, Math.floor(normalizeNumberInput(value)));

  const normalizeContributionsInput = (value: string) =>
    Math.max(0, normalizeNumberInput(value));

  const computeUnemploymentBenefit = () => {
    const experienceMonths = normalizeMonthsInput(workExperienceMonths);
    const contributions = normalizeContributionsInput(socialContributions);

    if (experienceMonths === 0 || contributions === 0) {
      return EMPTY_RESULTS;
    }

    const isEligible = experienceMonths >= 6;

    if (!isEligible) {
      return EMPTY_RESULTS;
    }

    // Средний доход восстанавливается из соц. отчислений (СО — 5% от дохода в 2026),
    // объект исчисления ограничен 7 МЗП (595 000 ₸ в 2026)
    const averageMonthlyIncome = Math.min(SO_INCOME_CAP_MZP * MZP_2026, contributions / 24 / 0.05);

    const incomeReplacementCoef = 0.45; // коэффициент замещения дохода ГФСС — 45% (Правила V2300032881, ст.118 Соц. кодекса)
    const experienceCoef = getExperienceCoefficient(experienceMonths);
    const paymentPeriodMonths = getPaymentPeriod(experienceMonths);

    const monthlyBenefit = averageMonthlyIncome * incomeReplacementCoef * experienceCoef;

    const totalBenefit = monthlyBenefit * paymentPeriodMonths;

    return {
      averageMonthlyIncome: Math.round(averageMonthlyIncome),
      incomeReplacementCoef,
      experienceCoef,
      monthlyBenefit: Math.round(monthlyBenefit),
      paymentPeriodMonths,
      totalBenefit: Math.round(totalBenefit),
      isEligible: true,
      minRequiredExperience: 6
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    computeUnemploymentBenefit,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workExperienceMonths, socialContributions]
  );

  const formatNumber = (num: number) => {
    const safeValue = Number.isFinite(num) ? num : 0;
    const locale = i18n.language === 'kk' ? 'kk-KZ' : 'ru-KZ';
    return safeValue.toLocaleString(locale) + ' ₸';
  };

  const getExperienceDescription = (months: number) => {
    const safeMonths = Number.isFinite(months) ? Math.max(0, months) : 0;
    const years = Math.floor(safeMonths / 12);
    const remainingMonths = safeMonths % 12;

    if (years === 0) {
      return `${remainingMonths} ${t('unemployment.months')}`;
    }
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? t('unemployment.year') : years < 5 ? t('unemployment.years2to4') : t('unemployment.years5plus')}`;
    }
    return `${years} ${years === 1 ? t('unemployment.year') : years < 5 ? t('unemployment.years2to4') : t('unemployment.years5plus')} ${remainingMonths} ${t('unemployment.months')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('unemployment.title')}</h1>
            <p className="text-gray-600">{t('unemployment.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('unemployment.yourData')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="workExperienceMonths" className="block text-sm font-medium text-gray-700 mb-2">
                {t('unemployment.totalExperience')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="workExperienceMonths"
                  value={workExperienceMonths}
                  onChange={(e) => setWorkExperienceMonths(e.target.value)}
                  placeholder={t('unemployment.enterMonths')}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('unemployment.monthsLabel')}</span>
                </div>
              </div>
              {workExperienceMonths && normalizeMonthsInput(workExperienceMonths) > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('unemployment.experienceLabel')}: {getExperienceDescription(normalizeMonthsInput(workExperienceMonths))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('unemployment.socialContributions')}
              </label>
              <RangeSlider
                value={Math.min(normalizeContributionsInput(socialContributions), 2000000)}
                onChange={(val) => setSocialContributions(String(val))}
                min={0}
                max={2000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#8b5cf6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="socialContributions"
                  value={socialContributions}
                  onChange={(e) => setSocialContributions(e.target.value)}
                  placeholder={t('unemployment.totalForTwoYears')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('unemployment.includesContributions')}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('unemployment.benefitConditions')}</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• {t('unemployment.minExperience')}</div>
                <div>• {t('unemployment.dismissalReason')}</div>
                <div>• {t('unemployment.employmentRegistration')}</div>
                <div>• {t('unemployment.activeJobSearch')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('unemployment.calculationResults')}</h2>

          {!results.isEligible && workExperienceMonths ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">{t('unemployment.insufficientExperience')}</h3>
                  <p className="text-red-800 text-sm">
                    {t('unemployment.insufficientExperienceText')}
                  </p>
                  <p className="text-red-700 text-sm mt-2">
                    <strong>{t('unemployment.yourExperience')}:</strong> {getExperienceDescription(normalizeMonthsInput(workExperienceMonths))}
                    <br />
                    <strong>{t('unemployment.required')}:</strong> {t('unemployment.minOneYear')}
                  </p>
                </div>
              </div>
            </div>
          ) : results.isEligible ? (
            <div className="space-y-6">
              {/* Calculation Details */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">{t('unemployment.calculationParameters')}</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>{t('unemployment.averageMonthlyIncome')}: {formatNumber(results.averageMonthlyIncome)}</div>
                    <div>{t('unemployment.replacementCoefficient')}: {results.incomeReplacementCoef} (45%)</div>
                    <div>{t('unemployment.experienceCoefficient')}: {results.experienceCoef}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('unemployment.monthlyBenefit')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.monthlyBenefit)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">{t('unemployment.paymentPeriod')}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {results.paymentPeriodMonths} {results.paymentPeriodMonths === 1 ? t('unemployment.month') : results.paymentPeriodMonths < 5 ? t('unemployment.months2to4') : t('unemployment.months5plus')}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">{t('unemployment.totalBenefit')}</span>
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-green-600" />
                      <span className="text-xl font-bold text-green-700">{formatNumber(results.totalBenefit)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t('unemployment.forEntirePeriod')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('unemployment.enterDataToCalculate')}
            </div>
          )}
        </div>
      </div>

      {/* Coefficients Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('unemployment.coefficientsTable')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Experience Coefficients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('unemployment.experienceCoefficients')}</h3>
            <div className="space-y-2">
              {[
                ['sixMonthsToYear', '0.7'],
                ['oneToTwoYears', '0.75'],
                ['twoToThreeYears', '0.85'],
                ['threeToFourYears', '0.9'],
                ['fourToFiveYears', '0.95'],
                ['fiveToSixYears', '1.0'],
                ['sixPlusYears', '1.02–1.3'],
              ].map(([k, v], i, arr) => (
                <div key={k} className={`flex justify-between text-sm py-2 px-3 rounded ${i === arr.length - 1 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <span className={i === arr.length - 1 ? 'text-green-800' : 'text-gray-700'}>{t(`unemployment.${k}`)}</span>
                  <span className={`font-medium ${i === arr.length - 1 ? 'text-green-700' : ''}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Periods */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('unemployment.paymentPeriodTitle')}</h3>
            <div className="space-y-2">
              {[
                ['sixMonthsToYear', 'oneMonth'],
                ['oneToTwoYears', 'twoMonths'],
                ['twoToThreeYears', 'threeMonths'],
                ['threeToFourYears', 'fourMonths'],
                ['fourToFiveYears', 'fiveMonths'],
                ['fivePlusYears', 'sixMonths'],
              ].map(([k, v], i, arr) => (
                <div key={k} className={`flex justify-between text-sm py-2 px-3 rounded ${i === arr.length - 1 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <span className={i === arr.length - 1 ? 'text-green-800' : 'text-gray-700'}>{t(`unemployment.${k}`)}</span>
                  <span className={`font-medium ${i === arr.length - 1 ? 'text-green-700' : ''}`}>{t(`unemployment.${v}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('unemployment.calculationFormula')}
              </h3>
              <p className="text-blue-800 text-sm">
                <strong>{t('unemployment.formulaText')}</strong>
                <br />
                {t('unemployment.formulaExplanation')}
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('unemployment.faq.q1'), answer: t('unemployment.faq.a1') },
          { question: t('unemployment.faq.q2'), answer: t('unemployment.faq.a2') },
          { question: t('unemployment.faq.q3'), answer: t('unemployment.faq.a3') },
          { question: t('unemployment.faq.q4'), answer: t('unemployment.faq.a4') },
          { question: t('unemployment.faq.q5'), answer: t('unemployment.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'МӘСҚ — Жұмыссыздық бойынша жәрдемақы' : 'ГФСС — Пособие по безработице', url: 'https://gfss.kz/' },
          { title: i18n.language === 'kk' ? 'Enbek.kz — Жұмыспен қамту орталығы' : 'Enbek.kz — Центр занятости', url: 'https://enbek.kz/' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.monthlyBenefit > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: i18n.language === 'kk' ? 'Ай сайынғы жәрдемақы' : 'Ежемесячное пособие', value: results.monthlyBenefit },
            ]}
            title={i18n.language === 'kk' ? 'Жұмыссыздық бойынша жәрдемақы' : 'Пособие по безработице'}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.monthlyBenefit > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт пособия по безработице',
              subtitle: `Стаж ${workExperienceMonths || 0} мес.`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Ежемесячное пособие', value: `${results.monthlyBenefit.toLocaleString()} ₸` },
                    { label: 'Период выплат', value: `${results.paymentPeriodMonths} мес.` },
                    { label: 'Общая сумма', value: `${results.totalBenefit.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="unemployment-benefit-calculation"
          />
        </div>
      )}

      <LegalDisclaimer type="social" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="unemployment-benefit"
        calculatorTitle="Калькулятор пособия по безработице"
      />
      <LastUpdated calculatorId="unemployment" />
    </div>
  );
}
