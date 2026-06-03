import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Cake, Calendar, Clock, Heart, User, Users } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { QuickAnswer } from '../ui/QuickAnswer';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';

type Gender = 'male' | 'female';

const LIFE_EXPECTANCY_YEARS = 73;
const RETIREMENT_AGE_MALE = 63;
const RETIREMENT_AGE_FEMALE = 61;

export default function AgeCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const isKazakh = i18n.language === 'kk';

  const todayIso = new Date().toISOString().split('T')[0];

  const [birthDate, setBirthDate] = useState<string>('1990-01-01');
  const [gender, setGender] = useState<Gender>('male');
  const [targetDate, setTargetDate] = useState<string>(todayIso);

  const weekDayNames = useMemo(() => (
    isKazakh
      ? ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі']
      : ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  ), [isKazakh]);

  const isLeapYear = (year: number) =>
    (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  const results = useMemo(() => {
    if (!birthDate || !targetDate) return null;
    const birth = new Date(birthDate);
    const target = new Date(targetDate);
    if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
    if (birth > target) return { invalid: true as const };

    // Age in years/months/days
    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    if (days < 0) {
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += prevMonth.getDate();
      months -= 1;
    }
    if (months < 0) {
      months += 12;
      years -= 1;
    }

    const diffMs = target.getTime() - birth.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Next birthday
    const currentYear = target.getFullYear();
    let nextBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
    if (nextBirthday <= target) {
      nextBirthday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
    }
    const daysUntilNextBirthday = Math.ceil(
      (nextBirthday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
    );
    const nextBirthdayWeekDay = weekDayNames[nextBirthday.getDay()];

    const birthWeekDay = weekDayNames[birth.getDay()];

    // Leap years lived fully (years in which person was alive for Feb 29)
    let leapYearsLived = 0;
    for (let y = birth.getFullYear(); y <= target.getFullYear(); y++) {
      if (!isLeapYear(y)) continue;
      const feb29 = new Date(y, 1, 29);
      if (feb29 >= birth && feb29 <= target) leapYearsLived++;
    }

    // Percent of life (based on 73y expectancy)
    const expectancyDays = LIFE_EXPECTANCY_YEARS * 365.25;
    const lifePercent = Math.min(100, (totalDays / expectancyDays) * 100);

    // Retirement
    const retirementAge = gender === 'male' ? RETIREMENT_AGE_MALE : RETIREMENT_AGE_FEMALE;
    const retirementDate = new Date(birth.getFullYear() + retirementAge, birth.getMonth(), birth.getDate());
    const isRetired = retirementDate <= target;
    let yearsUntilRetirement = 0;
    let monthsUntilRetirement = 0;
    if (!isRetired) {
      yearsUntilRetirement = retirementDate.getFullYear() - target.getFullYear();
      monthsUntilRetirement = retirementDate.getMonth() - target.getMonth();
      if (retirementDate.getDate() < target.getDate()) monthsUntilRetirement -= 1;
      if (monthsUntilRetirement < 0) {
        monthsUntilRetirement += 12;
        yearsUntilRetirement -= 1;
      }
    }

    return {
      invalid: false as const,
      years, months, days,
      totalDays, totalHours, totalMinutes, totalSeconds,
      daysUntilNextBirthday,
      nextBirthdayWeekDay,
      nextBirthdayDate: nextBirthday,
      birthWeekDay,
      leapYearsLived,
      lifePercent,
      retirementAge,
      isRetired,
      yearsUntilRetirement,
      monthsUntilRetirement,
      retirementDate
    };
  }, [birthDate, targetDate, gender, weekDayNames]);

  useEffect(() => {
    setTargetDate(new Date().toISOString().split('T')[0]);
  }, []);

  const formatDate = (d: Date) => d.toLocaleDateString(isKazakh ? 'kk-KZ' : 'ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="age" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Cake className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('age.title')}</h1>
            <p className="text-gray-600">{t('age.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('age.inputTitle')}</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('age.birthDate')}
                </label>
                <input
                  type="date"
                  id="birthDate"
                  value={birthDate}
                  max={todayIso}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('age.gender')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGender('male')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      gender === 'male'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <User className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">{t('age.male')}</div>
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      gender === 'female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">{t('age.female')}</div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700">
                    {t('age.targetDate')}
                  </label>
                  <button
                    onClick={() => setTargetDate(new Date().toISOString().split('T')[0])}
                    className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    {t('age.today')}
                  </button>
                </div>
                <input
                  type="date"
                  id="targetDate"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!results ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
              {t('age.enterData')}
            </div>
          ) : results.invalid ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
              {t('age.invalidDates')}
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Cake className="w-6 h-6 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('age.exactAgeTitle')}</h2>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-700">{results.years}</div>
                    <div className="text-xs text-gray-600">{t('age.yearsUnit')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-pink-700">{results.months}</div>
                    <div className="text-xs text-gray-600">{t('age.monthsUnit')}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-700">{results.days}</div>
                    <div className="text-xs text-gray-600">{t('age.daysUnit')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('age.totalsTitle')}</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.totalDays')}</span>
                    <span className="font-semibold text-gray-900">{results.totalDays.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.totalHours')}</span>
                    <span className="font-semibold text-gray-900">{results.totalHours.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.totalMinutes')}</span>
                    <span className="font-semibold text-gray-900">{results.totalMinutes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.totalSeconds')}</span>
                    <span className="font-semibold text-gray-900">{results.totalSeconds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.leapYearsLived')}</span>
                    <span className="font-semibold text-gray-900">{results.leapYearsLived}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">{t('age.birthWeekDay')}</span>
                    <span className="font-semibold text-gray-900">{results.birthWeekDay}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-pink-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('age.nextBirthdayTitle')}</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-pink-100">
                    <span className="text-gray-600">{t('age.daysUntilBirthday')}</span>
                    <span className="font-semibold text-pink-700">{results.daysUntilNextBirthday}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-pink-100">
                    <span className="text-gray-600">{t('age.birthdayDate')}</span>
                    <span className="font-semibold text-gray-900">{formatDate(results.nextBirthdayDate)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">{t('age.birthdayWeekDay')}</span>
                    <span className="font-semibold text-gray-900">{results.nextBirthdayWeekDay}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">{t('age.retirementTitle')}</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.retirementAge')}</span>
                    <span className="font-semibold text-gray-900">
                      {results.retirementAge} {t('age.yearsUnit')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('age.retirementDate')}</span>
                    <span className="font-semibold text-gray-900">{formatDate(results.retirementDate)}</span>
                  </div>
                  {results.isRetired ? (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                      {t('age.alreadyRetired')}
                    </div>
                  ) : (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">{t('age.untilRetirement')}</span>
                      <span className="font-semibold text-purple-700">
                        {results.yearsUntilRetirement} {t('age.yearsUnit')}{' '}
                        {results.monthsUntilRetirement} {t('age.monthsUnit')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('age.lifePercentTitle')}</h2>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{t('age.lifePercentHint')}</span>
                  <span className="text-2xl font-bold text-purple-700">{results.lifePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${results.lifePercent}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export */}
      {results && !results.invalid && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('age.title'),
              subtitle: `${t('age.birthDate')}: ${formatDate(new Date(birthDate))}`,
              sections: [
                {
                  title: t('age.exactAgeTitle'),
                  data: [
                    { label: t('age.exactAgeTitle'), value: `${results.years} / ${results.months} / ${results.days}` },
                    { label: t('age.totalDays'), value: results.totalDays.toLocaleString() },
                    { label: t('age.totalHours'), value: results.totalHours.toLocaleString() },
                    { label: t('age.birthWeekDay'), value: results.birthWeekDay },
                    { label: t('age.leapYearsLived'), value: String(results.leapYearsLived) },
                    { label: t('age.daysUntilBirthday'), value: String(results.daysUntilNextBirthday) },
                    { label: t('age.retirementDate'), value: formatDate(results.retirementDate) },
                    { label: t('age.lifePercentTitle'), value: `${results.lifePercent.toFixed(1)}%` }
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="age-calculation"
          />
        </div>
      )}

      {/* Expert */}
      <ExpertBlock />

      {/* FAQ */}
      <CalculatorExamples calculatorId="age" />
      <MethodologySection steps={getMethodology('age')} />
      <FAQSection
        items={[
          { question: t('age.faq.q1'), answer: t('age.faq.a1') },
          { question: t('age.faq.q2'), answer: t('age.faq.a2') },
          { question: t('age.faq.q3'), answer: t('age.faq.a3') },
          { question: t('age.faq.q4'), answer: t('age.faq.a4') },
          { question: t('age.faq.q5'), answer: t('age.faq.a5') }
        ]}
        sources={[
          { title: 'Пенсионный возраст РК', url: 'https://www.enbek.gov.kz/' },
          { title: 'Григорианский календарь', url: 'https://ru.wikipedia.org/wiki/Григорианский_календарь' }
        ]}
      />

      {/* Embed */}
      <EmbedWidget
        calculatorId="age"
        calculatorTitle={isKazakh ? 'Жас калькуляторы' : 'Калькулятор возраста'}
      />
      <LastUpdated calculatorId="age" />
    </div>
  );
}
