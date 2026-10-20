import React, { useState, useMemo } from 'react';
import { Clock, Calculator, Users, DollarSign, TrendingUp, Info, AlertTriangle, Building, PiggyBank, BarChart3 } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { TaxPieChart, TrendLineChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { NUMBER_LOCALE } from '../../utils/localeFormat';
import { pluralizeRu } from '../../utils/pluralize';

export default function PensionCalculator() {
  const { t, i18n } = useTranslation('calculators');
  // «61 год», «2 года», «35 лет»; в казахском форма одна — «жыл»
  const yearsWord = (n: number) => (i18n.language === 'kk' ? t('pension.years') : pluralizeRu(n, 'год', 'года', 'лет'));
  const [birthYear, setBirthYear] = useState<string>('1965');
  // Пол: норма стажа для полной солидарной пенсии 25 лет у мужчин и 20 у женщин (ст. 210 п. 4),
  // пенсионный возраст 63 / 61 (ст. 207).
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [workExperienceBefore1998, setWorkExperienceBefore1998] = useState<string>('15');
  const [workExperienceAfter1998, setWorkExperienceAfter1998] = useState<string>('20');
  const [averageIncomeBefore1998, setAverageIncomeBefore1998] = useState<string>('50000');
  const [currentAccumulations, setCurrentAccumulations] = useState<string>('3000000');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — React валит гидратацию (#418/#425).
  const EMPTY_RESULTS = {
    age: 0,
    totalWorkExperience: 0,
    basePension: 0,
    solidarityPension: 0,
    accumulativePension: 0,
    totalMonthlyPension: 0,
    retirementAge: { men: 63, women: 61 },
    yearsToRetirement: 0,
    estimatedAccumulationsAtRetirement: 0
  };

  // Константы на 2026 год
  const PM = 50851; // Прожиточный минимум
  const MIN_PENSION = 69049; // минимальная пенсия 2026 — Закон о респ. бюджете № 239-VIII, ст. 7
  const SOLIDARITY_INCOME_CAP = 55 * 4325; // 237 875 ₸ — потолок дохода для солидарной пенсии (ст. 211 п. 2)
  // График выплат ЕНПФ (ПП РК от 30.06.2023 № 521, Методика п. 4–6, приложение): в первый год —
  // 6,5 % накоплений в год, далее +5 % ежегодно, до исчерпания счёта; не менее 70 % ПМ; при
  // накоплениях ≤ 12 минимальных пенсий — единовременно. Никаких «19 лет» в правилах нет.
  const ENPF_PAYOUT_RATE_FIRST_YEAR = 0.065;
  const CURRENT_YEAR = 2026;
  const AVERAGE_RETURN_RATE = 0.06; // 6% годовых доходность ЕНПФ
  const MONTHLY_CONTRIBUTION_RATE = 0.10; // 10% ОПВ
  const AVERAGE_MONTHLY_INCOME = 250000; // Средний доход для прогноза

  const calculatePension = () => {
    const year = parseInt(birthYear) || 0;
    const experienceBefore = parseFloat(workExperienceBefore1998) || 0;
    const experienceAfter = parseFloat(workExperienceAfter1998) || 0;
    const incomeBefore = parseFloat(averageIncomeBefore1998) || 0;
    const accumulations = parseFloat(currentAccumulations) || 0;

    if (year === 0) {
      return EMPTY_RESULTS;
    }

    const age = CURRENT_YEAR - year;
    const totalWorkExperience = experienceBefore + experienceAfter;

    // Пенсионный возраст в РК (Социальный кодекс, ст. 207 п. 1) на текущий 2026 год:
    // мужчины — 63, женщины — 61 (61 до 2027 г. включительно, затем +0,5 года ежегодно:
    // 61,5 — 2028, 62 — 2029, 62,5 — 2030, 63 — 2031). Для будущей даты выхода по году
    // рождения график считает AgeCalculator.
    const retirementAgeMen = 63;
    const retirementAgeWomen = 61;

    // 1. Базовая государственная пенсия (ст. 206 п. 1): при стаже 10 лет и меньше или без стажа —
    // 70% ПМ, +2% за каждый полный год сверх 10, максимум 118% ПМ (60 004 ₸ при ПМ 50 851 ₸).
    // Раньше при стаже меньше 10 лет базовая пенсия выходила 0.
    const additionalYears = Math.max(0, Math.floor(totalWorkExperience - 10));
    const baseRate = Math.min(70 + additionalYears * 2, 118);
    const basePension = (PM * baseRate) / 100;

    // 2. Солидарная пенсия (Соцкодекс ст. 210–211): доход — среднемесячный за любые 3 года подряд
    // с 1998 года, не выше 55 МРП; полная = 60% дохода + 1% за каждый год стажа до 1998 сверх нормы
    // (25 лет мужчинам, 20 женщинам), не более 75%, и не ниже минимальной пенсии (п. 5);
    // при меньшем стаже (от 6 месяцев) — доля от полной пропорционально стажу (п. 6–7).
    // Раньше: норма 25 лет для всех, без потолка 55 МРП и без доведения до минимальной пенсии.
    let solidarityPension = 0;
    const stakeNorm = gender === 'female' ? 20 : 25;
    if (experienceBefore >= 0.5 && incomeBefore > 0) {
      const income = Math.min(incomeBefore, SOLIDARITY_INCOME_CAP);
      const fullRate = Math.min(0.6 + 0.01 * Math.max(0, Math.floor(experienceBefore - stakeNorm)), 0.75);
      const fullPension = Math.max(income * fullRate, MIN_PENSION);
      solidarityPension = experienceBefore >= stakeNorm ? fullPension : fullPension * (experienceBefore / stakeNorm);
    }

    // 3. Накопительная пенсия
    const yearsToRetirement = Math.max((gender === 'female' ? retirementAgeWomen : retirementAgeMen) - age, 0);

    // Прогноз накоплений к пенсии
    let estimatedAccumulationsAtRetirement = accumulations;
    if (yearsToRetirement > 0) {
      // Сложный процент на текущие накопления
      estimatedAccumulationsAtRetirement = accumulations * Math.pow(1 + AVERAGE_RETURN_RATE, yearsToRetirement);

      // Плюс будущие взносы
      const monthlyContribution = AVERAGE_MONTHLY_INCOME * MONTHLY_CONTRIBUTION_RATE;
      const futureContributions = monthlyContribution * 12 * yearsToRetirement;
      const futureContributionsWithReturn = futureContributions * Math.pow(1 + AVERAGE_RETURN_RATE, yearsToRetirement / 2);

      estimatedAccumulationsAtRetirement += futureContributionsWithReturn;
    }

    // Ежемесячная выплата из ЕНПФ по графику первого года (Методика к ПП № 521).
    const accumulativePension = estimatedAccumulationsAtRetirement <= 12 * MIN_PENSION
      ? estimatedAccumulationsAtRetirement / 12 // единовременная выплата, показана помесячно условно
      : Math.max(estimatedAccumulationsAtRetirement * ENPF_PAYOUT_RATE_FIRST_YEAR / 12, 0.7 * PM);

    const totalMonthlyPension = basePension + solidarityPension + accumulativePension;

    return {
      age,
      totalWorkExperience,
      basePension: Math.round(basePension),
      solidarityPension: Math.round(solidarityPension),
      accumulativePension: Math.round(accumulativePension),
      totalMonthlyPension: Math.round(totalMonthlyPension),
      retirementAge: { men: retirementAgeMen, women: retirementAgeWomen },
      yearsToRetirement: Math.max(yearsToRetirement, 0),
      estimatedAccumulationsAtRetirement: Math.round(estimatedAccumulationsAtRetirement)
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    calculatePension,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [birthYear, gender, workExperienceBefore1998, workExperienceAfter1998, averageIncomeBefore1998, currentAccumulations]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (results.age === 0) return '';

    return `${t('pension.sourceData')}:
- ${t('pension.birthYear')}: ${birthYear}
- ${t('pension.age')}: ${results.age} ${yearsWord(results.age)}
- ${t('pension.workExperienceBefore1998')}: ${workExperienceBefore1998} ${yearsWord(Number(workExperienceBefore1998))}
- ${t('pension.workExperienceAfter1998')}: ${workExperienceAfter1998} ${yearsWord(Number(workExperienceAfter1998))}
- ${t('pension.totalWorkExperience')}: ${results.totalWorkExperience} ${yearsWord(results.totalWorkExperience)}
- ${t('pension.averageIncomeBefore1998')}: ${averageIncomeBefore1998 ? formatNumber(parseFloat(averageIncomeBefore1998)) : t('pension.notSpecified')}
- ${t('pension.currentAccumulations')}: ${currentAccumulations ? formatNumber(parseFloat(currentAccumulations)) : t('pension.notSpecified')}

${t('pension.pensionComponents')}:
- ${t('pension.basePension')}: ${formatNumber(results.basePension)}
- ${t('pension.solidarityPension')}: ${formatNumber(results.solidarityPension)}
- ${t('pension.accumulativePension')}: ${formatNumber(results.accumulativePension)}

${t('pension.result')}:
- ${t('pension.totalPensionSize')}: ${formatNumber(results.totalMonthlyPension)} ${t('pension.perMonth')}
- ${t('pension.retirementAge')}: ${results.retirementAge.men} ${yearsWord(results.retirementAge.men)} (${t('pension.men')}) / ${results.retirementAge.women} ${yearsWord(results.retirementAge.women)} (${t('pension.women')})
- ${t('pension.untilRetirement')}: ${results.yearsToRetirement} ${yearsWord(results.yearsToRetirement)}
${results.estimatedAccumulationsAtRetirement > 0 ? `- ${t('pension.estimatedAccumulationsAtRetirement')}: ${formatNumber(results.estimatedAccumulationsAtRetirement)}` : ''}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('pension.title')}</h1>
            <p className="text-gray-600">{t('pension.description')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('pension.warningTitle')}
            </h3>
            <p className="text-amber-800">
              {t('pension.warningText')}
            </p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="pension" />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension.yourData')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension.birthYear')}
              </label>
              <input
                type="number"
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder={t('pension.birthYearPlaceholder')}
                min="1930"
                max="2007"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">{t('pension.genderLabel')}</span>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('pension.genderLabel')}>
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={gender === g}
                    onClick={() => setGender(g)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium ${gender === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'}`}
                  >
                    {t(g === 'male' ? 'pension.men' : 'pension.women')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension.workExperienceBefore1998')}
              </label>
              <RangeSlider
                ariaLabel={t('pension.workExperienceBefore1998')}
                value={parseFloat(workExperienceBefore1998) || 0}
                onChange={(val) => setWorkExperienceBefore1998(String(val))}
                min={0}
                max={40}
                step={0.5}
                formatValue={(v) => `${v} ${yearsWord(v)}`}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="workExperienceBefore1998"
                  value={workExperienceBefore1998}
                  onChange={(e) => setWorkExperienceBefore1998(e.target.value)}
                  placeholder={t('pension.experienceInYears')}
                  step="0.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('pension.years')}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension.workExperienceAfter1998')}
              </label>
              <RangeSlider
                ariaLabel={t('pension.workExperienceAfter1998')}
                value={parseFloat(workExperienceAfter1998) || 0}
                onChange={(val) => setWorkExperienceAfter1998(String(val))}
                min={0}
                max={30}
                step={0.5}
                formatValue={(v) => `${v} ${yearsWord(v)}`}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="workExperienceAfter1998"
                  value={workExperienceAfter1998}
                  onChange={(e) => setWorkExperienceAfter1998(e.target.value)}
                  placeholder={t('pension.experienceInYears')}
                  step="0.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('pension.years')}</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="averageIncomeBefore1998" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension.averageIncomeBefore1998')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="averageIncomeBefore1998"
                  value={averageIncomeBefore1998}
                  onChange={(e) => setAverageIncomeBefore1998(e.target.value)}
                  placeholder={t('pension.averageMonthlyIncome')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="currentAccumulations" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension.currentAccumulations')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="currentAccumulations"
                  value={currentAccumulations}
                  onChange={(e) => setCurrentAccumulations(e.target.value)}
                  placeholder={t('pension.currentAccumulationsPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension.pensionEstimate')}</h2>

          {results.age > 0 && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{t('pension.yourStatus')}</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>{t('pension.age')}: {results.age} {yearsWord(results.age)}</div>
                  <div>{t('pension.totalWorkExperience')}: {results.totalWorkExperience} {yearsWord(results.totalWorkExperience)}</div>
                  <div>{t('pension.untilRetirement')}: {results.yearsToRetirement} {yearsWord(results.yearsToRetirement)}</div>
                  <div>{t('pension.retirementAge')}: {results.retirementAge.men} {yearsWord(results.retirementAge.men)} ({t('pension.men')}) / {results.retirementAge.women} {yearsWord(results.retirementAge.women)} ({t('pension.women')})</div>
                </div>
              </div>

              {/* Pension Components */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('pension.pensionComponents')}</h3>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">{t('pension.basePension')}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatNumber(results.basePension)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">{t('pension.solidarityPension')}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatNumber(results.solidarityPension)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="w-4 h-4 text-teal-600" />
                    <span className="text-gray-600">{t('pension.accumulativePension')}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatNumber(results.accumulativePension)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">{t('pension.totalPensionSize')}</span>
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <span className="text-xl font-bold text-green-700">{formatNumber(results.totalMonthlyPension)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">{t('pension.monthly')}</div>
              </div>

              {/* Future Accumulations */}
              {results.yearsToRetirement > 0 && (
                <div className="bg-teal-50 rounded-lg p-4">
                  <h3 className="font-semibold text-teal-900 mb-2">{t('pension.accumulationsForecast')}</h3>
                  <div className="text-sm text-teal-800 space-y-1">
                    <div>{t('pension.estimatedAccumulationsAtRetirement')}:</div>
                    <div className="font-semibold text-lg">{formatNumber(results.estimatedAccumulationsAtRetirement)}</div>
                    <div className="text-xs">{t('pension.withAverageReturn')}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('pension.pensionSystemComponents')}</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('pension.basePension')}</h4>
                <p>
                  {t('pension.basePensionDescription')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('pension.solidarityPension')}</h4>
                <p>
                  {t('pension.solidarityPensionDescription')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('pension.accumulativePension')}</h4>
                <p>
                  {t('pension.accumulativePensionDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-green-800">
            <strong>{t('pension.important')}:</strong> {t('pension.importantNote', { pm: formatNumber(PM) })}
          </p>
        </div>
      </div>

      <SharePrintButtons
        title={t('pension.title')}
        description={t('pension.description')}
        results={generateExportData()}
      />

      {/* FAQ */}
      <CalculatorExamples calculatorId="pension" />
      <MethodologySection calculatorId="pension" />
      <FAQSection
        items={[
          { question: t('pension.faq.q1'), answer: t('pension.faq.a1') },
          { question: t('pension.faq.q2'), answer: t('pension.faq.a2') },
          { question: t('pension.faq.q3'), answer: t('pension.faq.a3') },
          { question: t('pension.faq.q4'), answer: t('pension.faq.a4') },
          { question: t('pension.faq.q5'), answer: t('pension.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'БЖЗҚ — Зейнетақы калькуляторы' : 'ЕНПФ — Пенсионный калькулятор', url: 'https://enpf.kz/' },
          // Закон «О пенсионном обеспечении» утратил силу с 01.07.2023 — нормы перенесены в Социальный кодекс
          { title: i18n.language === 'kk' ? 'ҚР Әлеуметтік кодексі (206-бап — базалық зейнетақы, 207-бап — зейнеткерлік жас)' : 'Социальный кодекс РК (ст. 206 — базовая пенсия, ст. 207 — пенсионный возраст)', url: 'https://adilet.zan.kz/rus/docs/K2300000224' },
        ]}
      />

      {/* Диаграмма структуры пенсии */}
      {results && results.totalMonthlyPension > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: i18n.language === 'kk' ? 'Базалық зейнетақы' : 'Базовая пенсия', value: results.basePension },
              { name: i18n.language === 'kk' ? 'Ынтымақты' : 'Солидарная', value: results.solidarityPension },
              { name: i18n.language === 'kk' ? 'Жинақтаушы' : 'Накопительная', value: results.accumulativePension },
            ].filter(item => item.value > 0)}
            title={i18n.language === 'kk' ? 'Зейнетақы құрылымы' : 'Структура пенсии'}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalMonthlyPension > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт пенсии',
              subtitle: `Год рождения: ${birthYear}`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Базовая пенсия', value: `${results.basePension.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: 'Солидарная', value: `${results.solidarityPension.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: 'Накопительная', value: `${results.accumulativePension.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: 'Итого', value: `${results.totalMonthlyPension.toLocaleString(NUMBER_LOCALE)} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="pension-calculation"
          />
        </div>
      )}

      <LegalDisclaimer type="social" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="pension"
        calculatorTitle="Пенсионный калькулятор"
      />
      <LastUpdated calculatorId="pension" />
    </div>
  );
}
