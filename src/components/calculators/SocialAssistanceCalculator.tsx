import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HandHeart, Calculator, Users, MapPin, Baby, Info, CheckCircle, XCircle, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, ProgressBar } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';
import { NUMBER_LOCALE } from '../../utils/localeFormat';

// Ориентир по умолчанию: 70% среднего по РК прожиточного минимума за II квартал 2026
// (67 618 ₸, Бюро национальной статистики) ≈ 47 333 ₸. Официальная черта в регионе — у акимата.
const DEFAULT_POVERTY_LINE = 47333;

export default function SocialAssistanceCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [quarterlyIncome, setQuarterlyIncome] = useState<string>('200000');
  const [familyMembers, setFamilyMembers] = useState<string>('4');
  // Черта бедности вводит пользователь: её ежеквартально рассчитывает акимат региона (ст. 120 п. 4 СК).
  const [povertyLine, setPovertyLine] = useState<string>(String(DEFAULT_POVERTY_LINE));
  const [childrenAge1to6, setChildrenAge1to6] = useState<string>('1');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — React валит гидратацию (#418/#425).
  const EMPTY_RESULTS = {
    averageMonthlyIncomePerPerson: 0,
    povertyThreshold: 0,
    isEligible: false,
    aspAmount: 0,
    childrenBonus: 0,
    totalAspAmount: 0,
    incomeShortfall: 0
  };

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const CHILD_BONUS_MRP = 1.5; // 1.5 МРП на ребенка 1-6 лет
  const CHILD_BONUS_KZT = CHILD_BONUS_MRP * MRP_2026; // 6 487,5 тенге

  const calculateASP = () => {
    const totalIncome = parseFloat(quarterlyIncome) || 0;
    const members = parseInt(familyMembers) || 0;
    const children = parseInt(childrenAge1to6) || 0;

    if (totalIncome <= 0 || members <= 0) {
      return EMPTY_RESULTS;
    }

    // Расчет среднедушевого месячного дохода
    const averageMonthlyIncomePerPerson = totalIncome / members / 3; // за квартал (3 месяца)

    // Черта бедности региона (ст. 120 СК): её публикует акимат ежеквартально
    const povertyThreshold = parseFloat(povertyLine) || 0;

    // Проверка права на АСП
    const isEligible = averageMonthlyIncomePerPerson < povertyThreshold;

    let aspAmount = 0;
    let childrenBonus = 0;
    let totalAspAmount = 0;
    let incomeShortfall = 0;

    if (isEligible) {
      // Расчет нехватки дохода на человека
      incomeShortfall = povertyThreshold - averageMonthlyIncomePerPerson;

      // Размер АСП = нехватка × количество членов семьи
      aspAmount = incomeShortfall * members;

      // Дополнительная выплата на детей 1-6 лет
      childrenBonus = children * CHILD_BONUS_KZT;

      // Общая сумма АСП
      totalAspAmount = aspAmount + childrenBonus;
    }

    return {
      averageMonthlyIncomePerPerson: Math.round(averageMonthlyIncomePerPerson),
      povertyThreshold: Math.round(povertyThreshold),
      isEligible,
      aspAmount: Math.round(aspAmount),
      childrenBonus: Math.round(childrenBonus),
      totalAspAmount: Math.round(totalAspAmount),
      incomeShortfall: Math.round(incomeShortfall)
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    calculateASP,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quarterlyIncome, familyMembers, povertyLine, childrenAge1to6, i18n.language]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount} ${t('social-assistance.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };


  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="social-assistance" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <HandHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('social-assistance.title')}</h1>
            <p className="text-gray-600">{t('social-assistance.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('social-assistance.familyData')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('social-assistance.quarterlyIncome')}
              </label>
              <RangeSlider
                ariaLabel={t('social-assistance.quarterlyIncome')}
                value={parseFloat(quarterlyIncome) || 0}
                onChange={(val) => setQuarterlyIncome(String(val))}
                min={0}
                max={500000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString(NUMBER_LOCALE)} ₸`}
                color="#10b981"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="quarterlyIncome"
                  value={quarterlyIncome}
                  onChange={(e) => setQuarterlyIncome(e.target.value)}
                  placeholder={t('social-assistance.quarterlyIncomePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('social-assistance.quarterlyIncomeHint')}
              </p>
            </div>

            <div>
              <label htmlFor="familyMembers" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                {t('social-assistance.familyMembers')}
              </label>
              <input
                type="number"
                id="familyMembers"
                value={familyMembers}
                onChange={(e) => setFamilyMembers(e.target.value)}
                placeholder={t('social-assistance.familyMembersPlaceholder')}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="povertyLine" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('social-assistance.povertyLineInput')}
              </label>
              <input
                type="number"
                id="povertyLine"
                value={povertyLine}
                onChange={(e) => setPovertyLine(e.target.value)}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('social-assistance.povertyLineHint', { amount: formatNumber(DEFAULT_POVERTY_LINE) })}
              </p>
            </div>

            <div>
              <label htmlFor="childrenAge1to6" className="block text-sm font-medium text-gray-700 mb-2">
                <Baby className="w-4 h-4 inline mr-1" />
                {t('social-assistance.childrenAge1to6')}
              </label>
              <input
                type="number"
                id="childrenAge1to6"
                value={childrenAge1to6}
                onChange={(e) => setChildrenAge1to6(e.target.value)}
                placeholder={t('social-assistance.childrenAge1to6Placeholder')}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('social-assistance.childBonusHint', { amount: formatMRP(CHILD_BONUS_MRP) })}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('social-assistance.criteria2026')}</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>{t('social-assistance.criterion1')}</li>
                <li>{t('social-assistance.criterion2', { amount: formatNumber(DEFAULT_POVERTY_LINE) })}</li>
                <li>{t('social-assistance.criterion3', { amount: formatMRP(CHILD_BONUS_MRP) })}</li>
                <li>{t('social-assistance.criterion4', { amount: formatNumber(MRP_2026) })}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('social-assistance.results')}</h2>

          {familyMembers && quarterlyIncome ? (
            <div className="space-y-6">
              {/* Eligibility Status */}
              <div className={`bg-gradient-to-r rounded-lg p-6 border-2 ${
                results.isEligible
                  ? 'from-green-50 to-emerald-50 border-green-300'
                  : 'from-red-50 to-pink-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {t('social-assistance.eligibility')}
                  </span>
                  <div className="flex items-center space-x-2">
                    {results.isEligible ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <span className={`text-2xl font-bold ${
                      results.isEligible ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {results.isEligible ? t('social-assistance.yes') : t('social-assistance.no')}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {results.isEligible
                    ? t('social-assistance.eligibleMessage')
                    : t('social-assistance.notEligibleMessage')
                  }
                </div>
              </div>

              {/* Income Analysis */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">{t('social-assistance.incomeAnalysis')}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('social-assistance.povertyThresholdLabel')}</span>
                    <span className="font-semibold text-gray-900">{formatNumber(results.povertyThreshold)}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('social-assistance.averageIncomeLabel')}</span>
                    <span className={`font-semibold ${
                      results.isEligible ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatNumber(results.averageMonthlyIncomePerPerson)}
                    </span>
                  </div>

                  {results.isEligible && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('social-assistance.incomeShortfall')}</span>
                      <span className="font-semibold text-red-600">{formatNumber(results.incomeShortfall)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ASP Calculation */}
              {results.isEligible && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">{t('social-assistance.aspCalculation')}</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                      <span className="font-medium text-blue-900">{t('social-assistance.baseAsp')}</span>
                      <span className="text-lg font-bold text-blue-700">{formatNumber(results.aspAmount)}</span>
                    </div>

                    {results.childrenBonus > 0 && (
                      <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                        <span className="font-medium text-green-900">
                          {t('social-assistance.childrenBonus', {
                            count: parseInt(childrenAge1to6) || 0,
                            amount: formatMRP(CHILD_BONUS_MRP)
                          })}
                        </span>
                        <span className="text-lg font-bold text-green-700">{formatNumber(results.childrenBonus)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4 border-t border-blue-200">
                      <span className="text-lg font-semibold text-gray-900">{t('social-assistance.totalAspPerMonth')}</span>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-700">{formatNumber(results.totalAspAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{t('social-assistance.referenceInfo')}</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>{t('social-assistance.totalQuarterlyIncome')}: <strong>{formatNumber(parseFloat(quarterlyIncome) || 0)}</strong></div>
                  <div>{t('social-assistance.averageMonthlyIncome')}: <strong>{formatNumber(Math.round((parseFloat(quarterlyIncome) || 0) / 3))}</strong></div>
                  <div>{t('social-assistance.familyMembersCount')}: <strong>{familyMembers}</strong></div>
                  {parseInt(childrenAge1to6) > 0 && (
                    <div>{t('social-assistance.children1to6Count')}: <strong>{childrenAge1to6}</strong></div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('social-assistance.enterDataPrompt')}
            </div>
          )}
        </div>
      </div>

      {/* Where to find the official poverty line */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('social-assistance.regionalThresholds')}</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>{t('social-assistance.povertyLineRule')}</p>
          <p>{t('social-assistance.povertyLineWhere')}</p>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('social-assistance.important')}:</strong> {t('social-assistance.thresholdExplanation', { amount: formatNumber(DEFAULT_POVERTY_LINE) })}
          </p>
        </div>
      </div>

      {/* Requirements and Process */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('social-assistance.conditionsAndProcess')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('social-assistance.assignmentConditions')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('social-assistance.condition1')}</li>
                  <li>{t('social-assistance.condition2')}</li>
                  <li>{t('social-assistance.condition3')}</li>
                  <li>{t('social-assistance.condition4')}</li>
                  <li>{t('social-assistance.condition5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('social-assistance.requiredDocuments')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('social-assistance.document1')}</li>
                  <li>{t('social-assistance.document2')}</li>
                  <li>{t('social-assistance.document3')}</li>
                  <li>{t('social-assistance.document4')}</li>
                  <li>{t('social-assistance.document5')}</li>
                  <li>{t('social-assistance.document6')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                {t('social-assistance.whereToApply')}
              </h4>
              <p className="text-green-800 text-sm">
                {t('social-assistance.applicationInfo')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('social-assistance.examples')}</h2>

        <div className="space-y-6">
          {/* Example 1 - Eligible */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('social-assistance.example1Title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('social-assistance.exampleSourceData')}</div>
                <div>{t('social-assistance.example1QuarterlyIncome')}</div>
                <div>{t('social-assistance.example1FamilyMembers')}</div>
                <div>{t('social-assistance.example1Children')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('social-assistance.exampleCalculation')}</div>
                <div>{t('social-assistance.example1IncomePerPerson')}</div>
                <div>{t('social-assistance.example1Threshold')}</div>
                <div>{t('social-assistance.example1Shortfall')}</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('social-assistance.exampleAsp')}</div>
                <div>{t('social-assistance.example1BaseAsp')}</div>
                <div>{t('social-assistance.example1ChildBonus')}</div>
                <div className="text-lg font-bold text-green-600">{t('social-assistance.example1Total')}</div>
              </div>
            </div>
          </div>

          {/* Example 2 - Not Eligible */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-3">{t('social-assistance.example2Title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('social-assistance.exampleSourceData')}</div>
                <div>{t('social-assistance.example2QuarterlyIncome')}</div>
                <div>{t('social-assistance.example2FamilyMembers')}</div>
                <div>{t('social-assistance.example2Children')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('social-assistance.exampleCalculation')}</div>
                <div>{t('social-assistance.example2IncomePerPerson')}</div>
                <div>{t('social-assistance.example2Threshold')}</div>
                <div>{t('social-assistance.example2Excess')}</div>
              </div>
              <div>
                <div className="font-medium text-red-700">{t('social-assistance.exampleResult')}</div>
                <div>{t('social-assistance.example2Eligibility')}</div>
                <div>{t('social-assistance.example2Reason')}</div>
              </div>
            </div>
          </div>

          {/* Example 3 - Minimum Threshold */}
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
            <h3 className="font-semibold text-amber-900 mb-3">{t('social-assistance.example3Title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('social-assistance.exampleSourceData')}</div>
                <div>{t('social-assistance.example3QuarterlyIncome')}</div>
                <div>{t('social-assistance.example3FamilyMembers')}</div>
                <div>{t('social-assistance.example3Region')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('social-assistance.exampleCalculation')}</div>
                <div>{t('social-assistance.example3IncomePerPerson')}</div>
                <div>{t('social-assistance.example3Percent35')}</div>
                <div>{t('social-assistance.example3MinThreshold')}</div>
              </div>
              <div>
                <div className="font-medium text-amber-700">{t('social-assistance.exampleAsp')}</div>
                <div>{t('social-assistance.example3BaseAsp')}</div>
                <div>{t('social-assistance.example3MinApplied')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('social-assistance.importantFeatures')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('social-assistance.termsAndReview')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('social-assistance.term1')}</li>
                  <li>{t('social-assistance.term2')}</li>
                  <li>{t('social-assistance.term3')}</li>
                  <li>{t('social-assistance.term4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('social-assistance.limitationsAndControl')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('social-assistance.limitation1')}</li>
                  <li>{t('social-assistance.limitation2')}</li>
                  <li>{t('social-assistance.limitation3')}</li>
                  <li>{t('social-assistance.limitation4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800">
            <strong>{t('social-assistance.updates2025')}:</strong> {t('social-assistance.updates2025Text')}
          </p>
        </div>
      </div>

      {/* Диаграмма */}
      {results.aspAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: i18n.language === 'kk' ? 'АӘК' : 'АСП', value: results.aspAmount },
            ]}
            title={i18n.language === 'kk' ? 'Атаулы әлеуметтік көмек' : 'Адресная социальная помощь'}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.aspAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт социальной помощи',
              subtitle: results.isEligible ? 'Имеете право на АСП' : 'Не имеете права',
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Доход на человека', value: `${results.averageMonthlyIncomePerPerson.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: 'Черта бедности', value: `${results.povertyThreshold.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: 'Членов семьи', value: familyMembers },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Размер АСП', value: `${results.aspAmount.toLocaleString(NUMBER_LOCALE)} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="social-assistance-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('social-assistance.faq.q1'), answer: t('social-assistance.faq.a1') },
          { question: t('social-assistance.faq.q2'), answer: t('social-assistance.faq.a2') },
          { question: t('social-assistance.faq.q3'), answer: t('social-assistance.faq.a3') },
          { question: t('social-assistance.faq.q4'), answer: t('social-assistance.faq.a4') },
          { question: t('social-assistance.faq.q5'), answer: t('social-assistance.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Әлеуметтік кодексі (АӘК)' : 'Социальный кодекс РК (АСП)', url: 'https://adilet.zan.kz/rus/docs/K2300000224' },
          { title: i18n.language === 'kk' ? 'eGov.kz — әлеуметтік көмек' : 'eGov.kz — соцпомощь', url: 'https://egov.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="social-assistance"
        calculatorTitle="Калькулятор АСП"
      />
      <LastUpdated calculatorId="social-assistance" />
    </div>
  );
}
