import React, { useState, useEffect } from 'react';
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
import { getMethodology } from '../../data/calculatorMethodology';

export default function PensionCalculator() {
  const { t } = useTranslation('calculators');
  const [birthYear, setBirthYear] = useState<string>('1965');
  const [workExperienceBefore1998, setWorkExperienceBefore1998] = useState<string>('15');
  const [workExperienceAfter1998, setWorkExperienceAfter1998] = useState<string>('20');
  const [averageIncomeBefore1998, setAverageIncomeBefore1998] = useState<string>('50000');
  const [currentAccumulations, setCurrentAccumulations] = useState<string>('3000000');

  const [results, setResults] = useState({
    age: 0,
    totalWorkExperience: 0,
    basePension: 0,
    solidarityPension: 0,
    accumulativePension: 0,
    totalMonthlyPension: 0,
    retirementAge: { men: 63, women: 58 },
    yearsToRetirement: 0,
    estimatedAccumulationsAtRetirement: 0
  });

  // Константы на 2026 год
  const PM = 50851; // Прожиточный минимум
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
      setResults({
        age: 0, totalWorkExperience: 0, basePension: 0, solidarityPension: 0,
        accumulativePension: 0, totalMonthlyPension: 0, retirementAge: { men: 63, women: 58 },
        yearsToRetirement: 0, estimatedAccumulationsAtRetirement: 0
      });
      return;
    }

    const age = CURRENT_YEAR - year;
    const totalWorkExperience = experienceBefore + experienceAfter;

    // Пенсионный возраст в РК (ст. 11 Закона "О пенсионном обеспечении"):
    // Мужчины — 63 года (стабильно с 2018 г., повышение не планируется).
    // Женщины — поэтапное повышение с 58 (2018) до 63 (по графику до 2027):
    //   2024 → 61, 2025 → 61, 2026 → 61, 2027 → 63 (по последним поправкам).
    const retirementAgeMen = 63;
    const retirementAgeWomen = 61;

    // 1. Базовая государственная пенсия
    let basePension = 0;
    if (totalWorkExperience >= 10) {
      let baseRate = 70; // 70% от ПМ
      const additionalYears = Math.floor(totalWorkExperience - 10);
      baseRate = Math.min(baseRate + (additionalYears * 2), 110); // максимум 110%
      basePension = (PM * baseRate) / 100;
    }

    // 2. Солидарная пенсия (упрощенный расчет)
    let solidarityPension = 0;
    if (experienceBefore > 0 && incomeBefore > 0) {
      // Упрощенная формула: зависит от стажа и дохода до 1998 года
      const experienceCoef = Math.min(experienceBefore / 25, 0.75); // максимум 75% замещения
      const incomeCoef = Math.min(incomeBefore / 50000, 3); // ограничение по доходу
      solidarityPension = incomeBefore * experienceCoef * 0.6 * incomeCoef;
    }

    // 3. Накопительная пенсия
    const yearsToRetirement = Math.max(retirementAgeMen - age, 0);

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

    // Расчет ежемесячной накопительной пенсии (средний период выплат 19 лет)
    const averagePayoutPeriodMonths = 19 * 12;
    const accumulativePension = estimatedAccumulationsAtRetirement / averagePayoutPeriodMonths;

    const totalMonthlyPension = basePension + solidarityPension + accumulativePension;

    setResults({
      age,
      totalWorkExperience,
      basePension: Math.round(basePension),
      solidarityPension: Math.round(solidarityPension),
      accumulativePension: Math.round(accumulativePension),
      totalMonthlyPension: Math.round(totalMonthlyPension),
      retirementAge: { men: retirementAgeMen, women: retirementAgeWomen },
      yearsToRetirement: Math.max(yearsToRetirement, 0),
      estimatedAccumulationsAtRetirement: Math.round(estimatedAccumulationsAtRetirement)
    });
  };

  useEffect(() => {
    calculatePension();
  }, [birthYear, workExperienceBefore1998, workExperienceAfter1998, averageIncomeBefore1998, currentAccumulations]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (results.age === 0) return '';

    return `${t('pension.sourceData')}:
- ${t('pension.birthYear')}: ${birthYear}
- ${t('pension.age')}: ${results.age} ${t('pension.years')}
- ${t('pension.workExperienceBefore1998')}: ${workExperienceBefore1998} ${t('pension.years')}
- ${t('pension.workExperienceAfter1998')}: ${workExperienceAfter1998} ${t('pension.years')}
- ${t('pension.totalWorkExperience')}: ${results.totalWorkExperience} ${t('pension.years')}
- ${t('pension.averageIncomeBefore1998')}: ${averageIncomeBefore1998 ? formatNumber(parseFloat(averageIncomeBefore1998)) : t('pension.notSpecified')}
- ${t('pension.currentAccumulations')}: ${currentAccumulations ? formatNumber(parseFloat(currentAccumulations)) : t('pension.notSpecified')}

${t('pension.pensionComponents')}:
- ${t('pension.basePension')}: ${formatNumber(results.basePension)}
- ${t('pension.solidarityPension')}: ${formatNumber(results.solidarityPension)}
- ${t('pension.accumulativePension')}: ${formatNumber(results.accumulativePension)}

${t('pension.result')}:
- ${t('pension.totalPensionSize')}: ${formatNumber(results.totalMonthlyPension)} ${t('pension.perMonth')}
- ${t('pension.retirementAge')}: ${results.retirementAge.men} ${t('pension.years')} (${t('pension.men')}) / ${results.retirementAge.women} ${t('pension.years')} (${t('pension.women')})
- ${t('pension.untilRetirement')}: ${results.yearsToRetirement} ${t('pension.years')}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension.workExperienceBefore1998')}
              </label>
              <RangeSlider
                value={parseFloat(workExperienceBefore1998) || 0}
                onChange={(val) => setWorkExperienceBefore1998(String(val))}
                min={0}
                max={40}
                step={0.5}
                formatValue={(v) => `${v} ${t('pension.years')}`}
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
                value={parseFloat(workExperienceAfter1998) || 0}
                onChange={(val) => setWorkExperienceAfter1998(String(val))}
                min={0}
                max={30}
                step={0.5}
                formatValue={(v) => `${v} ${t('pension.years')}`}
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
                  <div>{t('pension.age')}: {results.age} {t('pension.years')}</div>
                  <div>{t('pension.totalWorkExperience')}: {results.totalWorkExperience} {t('pension.years')}</div>
                  <div>{t('pension.untilRetirement')}: {results.yearsToRetirement} {t('pension.years')}</div>
                  <div>{t('pension.retirementAge')}: {results.retirementAge.men} {t('pension.years')} ({t('pension.men')}) / {results.retirementAge.women} {t('pension.years')} ({t('pension.women')})</div>
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
      <MethodologySection steps={getMethodology('pension')} />
      <FAQSection
        items={[
          { question: t('pension.faq.q1'), answer: t('pension.faq.a1') },
          { question: t('pension.faq.q2'), answer: t('pension.faq.a2') },
          { question: t('pension.faq.q3'), answer: t('pension.faq.a3') },
          { question: t('pension.faq.q4'), answer: t('pension.faq.a4') },
          { question: t('pension.faq.q5'), answer: t('pension.faq.a5') }
        ]}
        sources={[
          { title: 'ЕНПФ — Пенсионный калькулятор', url: 'https://enpf.kz/' },
          { title: 'Закон о пенсионном обеспечении', url: 'https://online.zakon.kz/document/?doc_id=1005298' },
        ]}
      />

      {/* Диаграмма структуры пенсии */}
      {results && results.totalMonthlyPension > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Базовая пенсия', value: results.basePension },
              { name: 'Солидарная', value: results.solidarityPension },
              { name: 'Накопительная', value: results.accumulativePension },
            ].filter(item => item.value > 0)}
            title="Структура пенсии"
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
                    { label: 'Базовая пенсия', value: `${results.basePension.toLocaleString()} ₸` },
                    { label: 'Солидарная', value: `${results.solidarityPension.toLocaleString()} ₸` },
                    { label: 'Накопительная', value: `${results.accumulativePension.toLocaleString()} ₸` },
                    { label: 'Итого', value: `${results.totalMonthlyPension.toLocaleString()} ₸` },
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
