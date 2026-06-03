import React, { useState, useEffect } from 'react';
import { Baby, Calendar, Heart, Info, AlertTriangle, Star, Clock, Target, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { MedicalDisclaimer } from '../ui/MedicalDisclaimer';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { ProgressBar } from '../ui/ChartComponents';

export default function PregnancyCalculator() {
  const { t } = useTranslation('calculators');
  const [lastPeriodDate, setLastPeriodDate] = useState<string>('');

  const [results, setResults] = useState({
    estimatedDueDate: '',
    currentWeek: 0,
    currentDay: 0,
    daysPregnant: 0,
    daysRemaining: 0,
    trimester: 1,
    weekInfo: {
      title: '',
      description: '',
      size: '',
      developments: [] as string[],
      recommendations: [] as string[]
    },
    progressPercentage: 0
  });

  // Информация о развитии плода по неделям
  const pregnancyWeeks = {
    4: {
      title: t('pregnancy.week4.title'),
      description: t('pregnancy.week4.description'),
      size: t('pregnancy.week4.size'),
      developments: [
        t('pregnancy.week4.development1'),
        t('pregnancy.week4.development2'),
        t('pregnancy.week4.development3')
      ],
      recommendations: [
        t('pregnancy.week4.recommendation1'),
        t('pregnancy.week4.recommendation2'),
        t('pregnancy.week4.recommendation3')
      ]
    },
    8: {
      title: t('pregnancy.week8.title'),
      description: t('pregnancy.week8.description'),
      size: t('pregnancy.week8.size'),
      developments: [
        t('pregnancy.week8.development1'),
        t('pregnancy.week8.development2'),
        t('pregnancy.week8.development3')
      ],
      recommendations: [
        t('pregnancy.week8.recommendation1'),
        t('pregnancy.week8.recommendation2'),
        t('pregnancy.week8.recommendation3')
      ]
    },
    12: {
      title: t('pregnancy.week12.title'),
      description: t('pregnancy.week12.description'),
      size: t('pregnancy.week12.size'),
      developments: [
        t('pregnancy.week12.development1'),
        t('pregnancy.week12.development2'),
        t('pregnancy.week12.development3')
      ],
      recommendations: [
        t('pregnancy.week12.recommendation1'),
        t('pregnancy.week12.recommendation2'),
        t('pregnancy.week12.recommendation3')
      ]
    },
    16: {
      title: t('pregnancy.week16.title'),
      description: t('pregnancy.week16.description'),
      size: t('pregnancy.week16.size'),
      developments: [
        t('pregnancy.week16.development1'),
        t('pregnancy.week16.development2'),
        t('pregnancy.week16.development3')
      ],
      recommendations: [
        t('pregnancy.week16.recommendation1'),
        t('pregnancy.week16.recommendation2'),
        t('pregnancy.week16.recommendation3')
      ]
    },
    20: {
      title: t('pregnancy.week20.title'),
      description: t('pregnancy.week20.description'),
      size: t('pregnancy.week20.size'),
      developments: [
        t('pregnancy.week20.development1'),
        t('pregnancy.week20.development2'),
        t('pregnancy.week20.development3')
      ],
      recommendations: [
        t('pregnancy.week20.recommendation1'),
        t('pregnancy.week20.recommendation2'),
        t('pregnancy.week20.recommendation3')
      ]
    },
    24: {
      title: t('pregnancy.week24.title'),
      description: t('pregnancy.week24.description'),
      size: t('pregnancy.week24.size'),
      developments: [
        t('pregnancy.week24.development1'),
        t('pregnancy.week24.development2'),
        t('pregnancy.week24.development3')
      ],
      recommendations: [
        t('pregnancy.week24.recommendation1'),
        t('pregnancy.week24.recommendation2'),
        t('pregnancy.week24.recommendation3')
      ]
    },
    28: {
      title: t('pregnancy.week28.title'),
      description: t('pregnancy.week28.description'),
      size: t('pregnancy.week28.size'),
      developments: [
        t('pregnancy.week28.development1'),
        t('pregnancy.week28.development2'),
        t('pregnancy.week28.development3')
      ],
      recommendations: [
        t('pregnancy.week28.recommendation1'),
        t('pregnancy.week28.recommendation2'),
        t('pregnancy.week28.recommendation3')
      ]
    },
    32: {
      title: t('pregnancy.week32.title'),
      description: t('pregnancy.week32.description'),
      size: t('pregnancy.week32.size'),
      developments: [
        t('pregnancy.week32.development1'),
        t('pregnancy.week32.development2'),
        t('pregnancy.week32.development3')
      ],
      recommendations: [
        t('pregnancy.week32.recommendation1'),
        t('pregnancy.week32.recommendation2'),
        t('pregnancy.week32.recommendation3')
      ]
    },
    36: {
      title: t('pregnancy.week36.title'),
      description: t('pregnancy.week36.description'),
      size: t('pregnancy.week36.size'),
      developments: [
        t('pregnancy.week36.development1'),
        t('pregnancy.week36.development2'),
        t('pregnancy.week36.development3')
      ],
      recommendations: [
        t('pregnancy.week36.recommendation1'),
        t('pregnancy.week36.recommendation2'),
        t('pregnancy.week36.recommendation3')
      ]
    },
    40: {
      title: t('pregnancy.week40.title'),
      description: t('pregnancy.week40.description'),
      size: t('pregnancy.week40.size'),
      developments: [
        t('pregnancy.week40.development1'),
        t('pregnancy.week40.development2'),
        t('pregnancy.week40.development3')
      ],
      recommendations: [
        t('pregnancy.week40.recommendation1'),
        t('pregnancy.week40.recommendation2'),
        t('pregnancy.week40.recommendation3')
      ]
    }
  };

  const calculatePregnancy = () => {
    if (!lastPeriodDate) {
      setResults({
        estimatedDueDate: '', currentWeek: 0, currentDay: 0,
        daysPregnant: 0, daysRemaining: 0, trimester: 1,
        weekInfo: { title: '', description: '', size: '', developments: [], recommendations: [] },
        progressPercentage: 0
      });
      return;
    }

    const lmpDate = new Date(lastPeriodDate);
    const today = new Date();

    // Расчет ПДР по правилу Негеле
    const estimatedDueDate = new Date(lmpDate);
    estimatedDueDate.setMonth(estimatedDueDate.getMonth() - 3);
    estimatedDueDate.setDate(estimatedDueDate.getDate() + 7);

    // Расчет текущей недели беременности
    const diffTime = today.getTime() - lmpDate.getTime();
    const daysPregnant = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const currentWeek = Math.floor(daysPregnant / 7);
    const currentDay = daysPregnant % 7;

    // Дни до родов
    const daysRemaining = Math.max(0, Math.floor((estimatedDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Определение триместра
    let trimester = 1;
    if (currentWeek >= 13 && currentWeek < 27) {
      trimester = 2;
    } else if (currentWeek >= 27) {
      trimester = 3;
    }

    // Прогресс беременности в процентах
    const progressPercentage = Math.min(100, (daysPregnant / 280) * 100);

    // Информация о текущей неделе
    let weekInfo = {
      title: t('pregnancy.preConception.title'),
      description: t('pregnancy.preConception.description'),
      size: '',
      developments: [t('pregnancy.preConception.development')],
      recommendations: [t('pregnancy.preConception.recommendation1'), t('pregnancy.preConception.recommendation2')]
    };

    // Находим ближайшую неделю с информацией
    const availableWeeks = Object.keys(pregnancyWeeks).map(Number).sort((a, b) => a - b);
    let selectedWeek = 4; // По умолчанию 4 неделя

    for (const week of availableWeeks) {
      if (currentWeek >= week) {
        selectedWeek = week;
      }
    }

    if (currentWeek >= 4) {
      weekInfo = pregnancyWeeks[selectedWeek as keyof typeof pregnancyWeeks];
    }

    setResults({
      estimatedDueDate: estimatedDueDate.toLocaleDateString('ru-RU'),
      currentWeek,
      currentDay,
      daysPregnant,
      daysRemaining,
      trimester,
      weekInfo,
      progressPercentage: Number(progressPercentage.toFixed(1))
    });
  };

  useEffect(() => {
    calculatePregnancy();
  }, [lastPeriodDate]);

  const getTrimesterInfo = (trimester: number) => {
    switch (trimester) {
      case 1:
        return { name: t('pregnancy.trimester1.name'), period: t('pregnancy.trimester1.period'), color: 'blue', description: t('pregnancy.trimester1.description') };
      case 2:
        return { name: t('pregnancy.trimester2.name'), period: t('pregnancy.trimester2.period'), color: 'green', description: t('pregnancy.trimester2.description') };
      case 3:
        return { name: t('pregnancy.trimester3.name'), period: t('pregnancy.trimester3.period'), color: 'teal', description: t('pregnancy.trimester3.description') };
      default:
        return { name: t('pregnancy.beforePregnancy'), period: '', color: 'gray', description: '' };
    }
  };

  const trimesterInfo = getTrimesterInfo(results.trimester);

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return t('pregnancy.dueDatePassed');

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    if (weeks === 0) {
      return `${remainingDays} ${remainingDays === 1 ? t('pregnancy.day') : remainingDays < 5 ? t('pregnancy.days2') : t('pregnancy.days')}`;
    } else if (remainingDays === 0) {
      return `${weeks} ${weeks === 1 ? t('pregnancy.week') : weeks < 5 ? t('pregnancy.weeks2') : t('pregnancy.weeks')}`;
    } else {
      return `${weeks} ${weeks === 1 ? t('pregnancy.week') : weeks < 5 ? t('pregnancy.weeks2') : t('pregnancy.weeks')} ${remainingDays} ${remainingDays === 1 ? t('pregnancy.day') : remainingDays < 5 ? t('pregnancy.days2') : t('pregnancy.days')}`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('pregnancy.title')}</h1>
            <p className="text-gray-600">{t('pregnancy.description')}</p>
          </div>
        </div>
      </div>

      {/* Important Warning */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('pregnancy.importantInfo')}
            </h3>
            <div className="text-amber-800 space-y-2">
              <p>
                {t('pregnancy.warningText1')}
              </p>
              <p>
                {t('pregnancy.warningText2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="pregnancy" />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pregnancy.inputDataTitle')}</h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="lastPeriodDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t('pregnancy.lastPeriodLabel')}
              </label>
              <input
                type="date"
                id="lastPeriodDate"
                value={lastPeriodDate}
                onChange={(e) => setLastPeriodDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('pregnancy.lastPeriodHint')}
              </p>
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-pink-900 mb-2">{t('pregnancy.naegeleRule')}</h3>
              <p className="text-sm text-pink-800">
                {t('pregnancy.naegeleRuleText')}
              </p>
            </div>

            {results.currentWeek > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('pregnancy.yourProgress')}</h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{t('pregnancy.pregnancyProgress')}</span>
                      <span>{results.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${results.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg bg-${trimesterInfo.color}-50`}>
                    <div className={`text-${trimesterInfo.color}-900 font-medium`}>
                      {trimesterInfo.name}
                    </div>
                    <div className={`text-xs text-${trimesterInfo.color}-700`}>
                      {trimesterInfo.period} • {trimesterInfo.description}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pregnancy.resultsTitle')}</h2>

          {results.estimatedDueDate ? (
            <div className="space-y-6">
              {/* Due Date */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">{t('pregnancy.estimatedDueDate')}</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-6 h-6 text-pink-600" />
                    <span className="text-2xl font-bold text-pink-700">{results.estimatedDueDate}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {results.daysRemaining > 0 ? (
                    <>{t('pregnancy.remaining')}: {formatDaysRemaining(results.daysRemaining)}</>
                  ) : (
                    <>{t('pregnancy.dueDatePassedDays', { days: Math.abs(results.daysRemaining) })}</>
                  )}
                </div>
              </div>

              {/* Current Week */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                  <span className="font-medium text-blue-900">{t('pregnancy.currentWeekLabel')}</span>
                  <span className="text-xl font-bold text-blue-700">
                    {results.currentWeek} {t('pregnancy.weeks')} {results.currentDay} {t('pregnancy.days')}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('pregnancy.daysPregnant')}</span>
                  <span className="font-semibold text-gray-900">{results.daysPregnant}</span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('pregnancy.trimesterLabel')}</span>
                  <span className={`font-semibold text-${trimesterInfo.color}-600`}>
                    {results.trimester}-{t('pregnancy.trimesterSuffix')} ({trimesterInfo.name})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('pregnancy.enterDatePrompt')}
            </div>
          )}
        </div>
      </div>

      {/* Week Development Info */}
      {results.weekInfo.title && results.currentWeek >= 4 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('pregnancy.developmentAtWeek', { week: results.currentWeek })}: {results.weekInfo.title}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Development Info */}
            <div>
              <div className="bg-teal-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-teal-900 mb-2">{results.weekInfo.description}</h3>
                <div className="text-teal-800 text-sm">
                  <strong>{results.weekInfo.size}</strong>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>{t('pregnancy.keyChanges')}:</span>
              </h3>
              <div className="space-y-2">
                {results.weekInfo.developments.map((development, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{development}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span>{t('pregnancy.recommendations')}:</span>
              </h3>
              <div className="space-y-2">
                {results.weekInfo.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>

              {/* General recommendations by trimester */}
              <div className="mt-6 bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  {t('pregnancy.generalAdviceForTrimester', { trimester: results.trimester })}:
                </h4>
                <div className="text-sm text-green-800 space-y-1">
                  {results.trimester === 1 && (
                    <>
                      <p>• {t('pregnancy.trimester1Advice1')}</p>
                      <p>• {t('pregnancy.trimester1Advice2')}</p>
                      <p>• {t('pregnancy.trimester1Advice3')}</p>
                    </>
                  )}
                  {results.trimester === 2 && (
                    <>
                      <p>• {t('pregnancy.trimester2Advice1')}</p>
                      <p>• {t('pregnancy.trimester2Advice2')}</p>
                      <p>• {t('pregnancy.trimester2Advice3')}</p>
                    </>
                  )}
                  {results.trimester === 3 && (
                    <>
                      <p>• {t('pregnancy.trimester3Advice1')}</p>
                      <p>• {t('pregnancy.trimester3Advice2')}</p>
                      <p>• {t('pregnancy.trimester3Advice3')}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pregnancy Timeline */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pregnancy.keyMilestones')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Object.entries(pregnancyWeeks).map(([week, info], index) => {
            const weekNum = parseInt(week);
            const isPassed = results.currentWeek >= weekNum;
            const isCurrent = results.currentWeek >= weekNum && results.currentWeek < (Object.keys(pregnancyWeeks).map(Number).sort((a, b) => a - b)[index + 1] || 999);

            return (
              <div key={week} className={`p-4 rounded-lg border-2 transition-all ${
                isCurrent ? 'border-pink-500 bg-pink-50' :
                isPassed ? 'border-green-300 bg-green-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCurrent ? 'bg-pink-500 text-white' :
                    isPassed ? 'bg-green-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCurrent ? <Clock className="w-5 h-5" /> :
                     isPassed ? '✓' : weekNum}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{weekNum} {t('pregnancy.weekLabel')}</h3>
                      {isCurrent && <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">{t('pregnancy.current')}</span>}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{info.description}</p>
                    <p className="text-xs text-gray-500">{info.size}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('pregnancy.aboutCalculations')}
              </h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• {t('pregnancy.infoText1')}</p>
                <p>• {t('pregnancy.infoText2')}</p>
                <p>• {t('pregnancy.infoText3')}</p>
                <p>• {t('pregnancy.infoText4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Экспорт результатов */}
      {results.estimatedDueDate && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Калькулятор беременности',
              subtitle: `${results.currentWeek} неделя`,
              sections: [
                {
                  title: 'Данные',
                  data: [
                    { label: 'Последняя менструация', value: lastPeriodDate },
                    { label: 'Предполагаемая дата родов', value: results.estimatedDueDate },
                    { label: 'Текущая неделя', value: `${results.currentWeek} неделя, ${results.currentDay} день` },
                    { label: 'Триместр', value: `${results.trimester}` },
                    { label: 'Дней до родов', value: `${results.daysRemaining}` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="pregnancy-calculation"
          />
        </div>
      )}

      {/* Medical sources (Apple App Store Guideline 1.4.1 compliance) */}
      <MedicalDisclaimer
        sources={[
          {
            title: 'ACOG — Methods for Estimating the Due Date (Committee Opinion No. 700)',
            url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date',
            description: 'American College of Obstetricians and Gynecologists. Официальная методология определения ПДР, включая правило Негеле, на котором основан этот калькулятор.',
          },
          {
            title: 'WHO — Recommendations on antenatal care for a positive pregnancy experience',
            url: 'https://www.who.int/publications/i/item/9789241549912',
            description: 'World Health Organization. Глобальные рекомендации по антенатальному наблюдению, использовавшиеся для рекомендаций по триместрам.',
          },
          {
            title: 'NIH NICHD — Pregnancy Information',
            url: 'https://www.nichd.nih.gov/health/topics/pregnancy',
            description: 'National Institute of Child Health and Human Development. Информация о развитии плода по неделям и норме изменений в каждом триместре.',
          },
          {
            title: 'Mayo Clinic — Fetal development: The 1st trimester / 2nd trimester / 3rd trimester',
            url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20045302',
            description: 'Авторитетный медицинский ресурс. Описание этапов развития плода по неделям, используемое в графике беременности.',
          },
          {
            title: 'Минздрав РК — Клинические протоколы (Физиологическая беременность)',
            url: 'https://www.rcrz.kz/index.php/ru/2017-03-12-10-50-44/klinicheskie-protokoly',
            description: 'Республиканский центр развития здравоохранения МЗ РК. Локальные протоколы ведения беременности, применимые в Казахстане.',
          },
        ]}
      />

      {/* FAQ */}
      <CalculatorExamples calculatorId="pregnancy" />
      <MethodologySection steps={getMethodology('pregnancy')} />
      <FAQSection
        items={[
          { question: t('pregnancy.faq.q1'), answer: t('pregnancy.faq.a1') },
          { question: t('pregnancy.faq.q2'), answer: t('pregnancy.faq.a2') },
          { question: t('pregnancy.faq.q3'), answer: t('pregnancy.faq.a3') },
          { question: t('pregnancy.faq.q4'), answer: t('pregnancy.faq.a4') },
          { question: t('pregnancy.faq.q5'), answer: t('pregnancy.faq.a5') }
        ]}
        sources={[
          { title: 'ACOG — Estimating the Due Date', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date' },
          { title: 'WHO — Antenatal care', url: 'https://www.who.int/publications/i/item/9789241549912' },
          { title: 'Mayo Clinic — Fetal development', url: 'https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/fetal-development/art-20045302' },
          { title: 'РЦРЗ МЗ РК — Клинические протоколы', url: 'https://www.rcrz.kz/index.php/ru/2017-03-12-10-50-44/klinicheskie-protokoly' },
        ]}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="pregnancy"
        calculatorTitle="Калькулятор беременности"
      />
      <LastUpdated calculatorId="pregnancy" />
    </div>
  );
}
