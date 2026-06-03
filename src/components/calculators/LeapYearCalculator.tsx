import React, { useState, useEffect } from 'react';
import { Calendar, Calculator, Clock, Info, CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, Star, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { QuickAnswer } from '../ui/QuickAnswer';

export default function LeapYearCalculator() {
  const { t } = useTranslation('calculators');
  const [inputYear, setInputYear] = useState<string>(String(new Date().getFullYear()));
  const [currentYear] = useState<number>(new Date().getFullYear());
  const [rangeStart, setRangeStart] = useState<string>('2020');
  const [rangeEnd, setRangeEnd] = useState<string>('2030');
  const [showRange, setShowRange] = useState<boolean>(false);

  const [results, setResults] = useState({
    year: 0,
    isLeapYear: false,
    leapDate: '',
    nextLeapYear: 0,
    previousLeapYear: 0,
    dayNumber: 0,
    totalDaysInYear: 0,
    explanation: '',

    leapYearsInRange: [] as number[],
    totalLeapYears: 0,
    rangeLength: 0,
    frequency: 0
  });

  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  const getLeapDayNumber = (year: number): number => {
    if (!isLeapYear(year)) return 0;
    const jan31 = 31;
    const feb29 = 29;
    return jan31 + feb29;
  };

  const findNextLeapYear = (year: number): number => {
    let next = year + 1;
    while (!isLeapYear(next) && next < year + 8) {
      next++;
    }
    return next;
  };

  const findPreviousLeapYear = (year: number): number => {
    let prev = year - 1;
    while (!isLeapYear(prev) && prev > year - 8) {
      prev--;
    }
    return prev;
  };

  const getExplanation = (year: number): string => {
    if (year % 400 === 0) {
      return t('leap-year.explanation400', { year });
    } else if (year % 100 === 0) {
      return t('leap-year.explanation100', { year });
    } else if (year % 4 === 0) {
      return t('leap-year.explanation4', { year });
    } else {
      return t('leap-year.explanationNot4', { year });
    }
  };

  const calculateSingleYear = () => {
    const year = parseInt(inputYear) || 0;

    if (year === 0 || year < 1) {
      setResults(prev => ({
        ...prev,
        year: 0,
        isLeapYear: false,
        leapDate: '',
        nextLeapYear: 0,
        previousLeapYear: 0,
        dayNumber: 0,
        totalDaysInYear: 0,
        explanation: ''
      }));
      return;
    }

    const isLeap = isLeapYear(year);
    const leapDate = isLeap ? t('leap-year.leapDateFormat', { year }) : '';
    const nextLeap = findNextLeapYear(year);
    const prevLeap = findPreviousLeapYear(year);
    const dayNumber = getLeapDayNumber(year);
    const totalDaysInYear = isLeap ? 366 : 365;
    const explanation = getExplanation(year);

    setResults(prev => ({
      ...prev,
      year,
      isLeapYear: isLeap,
      leapDate,
      nextLeapYear: nextLeap,
      previousLeapYear: prevLeap,
      dayNumber,
      totalDaysInYear,
      explanation
    }));
  };

  const calculateRange = () => {
    const start = parseInt(rangeStart) || 0;
    const end = parseInt(rangeEnd) || 0;

    if (start === 0 || end === 0 || start > end) {
      setResults(prev => ({
        ...prev,
        leapYearsInRange: [],
        totalLeapYears: 0,
        rangeLength: 0,
        frequency: 0
      }));
      return;
    }

    const leapYearsInRange = [];
    for (let year = start; year <= end; year++) {
      if (isLeapYear(year)) {
        leapYearsInRange.push(year);
      }
    }

    const rangeLength = end - start + 1;
    const frequency = rangeLength > 0 ? (leapYearsInRange.length / rangeLength) * 100 : 0;

    setResults(prev => ({
      ...prev,
      leapYearsInRange,
      totalLeapYears: leapYearsInRange.length,
      rangeLength,
      frequency: Number(frequency.toFixed(1))
    }));
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const year = parseInt(inputYear) || currentYear;
    if (direction === 'prev') {
      setInputYear((year - 1).toString());
    } else {
      setInputYear((year + 1).toString());
    }
  };

  const setQuickYear = (year: number | 'current') => {
    if (year === 'current') {
      setInputYear(currentYear.toString());
    } else {
      setInputYear(year.toString());
    }
  };

  const clearAll = () => {
    setInputYear('');
    setRangeStart('');
    setRangeEnd('');
    setShowRange(false);
  };

  useEffect(() => {
    calculateSingleYear();
  }, [inputYear]);

  useEffect(() => {
    if (showRange) {
      calculateRange();
    }
  }, [rangeStart, rangeEnd, showRange]);

  const getRecentLeapYears = () => {
    const years = [];
    const baseYear = parseInt(inputYear) || currentYear;

    let prev = baseYear - 1;
    const prevYears = [];
    while (prevYears.length < 3 && prev > baseYear - 20) {
      if (isLeapYear(prev)) {
        prevYears.unshift(prev);
      }
      prev--;
    }

    let next = baseYear + 1;
    const nextYears = [];
    while (nextYears.length < 3 && next < baseYear + 20) {
      if (isLeapYear(next)) {
        nextYears.push(next);
      }
      next++;
    }

    return { previous: prevYears, next: nextYears };
  };

  const recentLeapYears = getRecentLeapYears();

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="leap-year" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('leap-year.title')}</h1>
            <p className="text-gray-600">{t('leap-year.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          {/* Single Year Check */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.yearCheckTitle')}</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="inputYear" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('leap-year.enterYearLabel')}
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateYear('prev')}
                    className="p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    id="inputYear"
                    value={inputYear}
                    onChange={(e) => setInputYear(e.target.value)}
                    placeholder={t('leap-year.yearPlaceholder', { year: currentYear })}
                    min="1"
                    max="9999"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center"
                  />

                  <button
                    onClick={() => navigateYear('next')}
                    className="p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('leap-year.quickSelection')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setQuickYear('current')}
                    className="p-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {t('leap-year.current', { year: currentYear })}
                  </button>
                  <button
                    onClick={() => setQuickYear(2024)}
                    className="p-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    2024
                  </button>
                  <button
                    onClick={() => setQuickYear(2000)}
                    className="p-2 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                  >
                    2000
                  </button>
                  <button
                    onClick={() => setQuickYear(1900)}
                    className="p-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                  >
                    1900
                  </button>
                </div>
              </div>

              {/* Range Analysis Toggle */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="showRange"
                    checked={showRange}
                    onChange={(e) => setShowRange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showRange" className="ml-2 block text-sm text-gray-700">
                    {t('leap-year.rangeAnalysis')}
                  </label>
                </div>

                {showRange && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rangeStart" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('leap-year.fromYear')}
                      </label>
                      <input
                        type="number"
                        id="rangeStart"
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        placeholder={t('leap-year.startYearPlaceholder')}
                        min="1"
                        max="9999"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="rangeEnd" className="block text-sm font-medium text-gray-700 mb-2">
                        {t('leap-year.toYear')}
                      </label>
                      <input
                        type="number"
                        id="rangeEnd"
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        placeholder={t('leap-year.endYearPlaceholder')}
                        min="1"
                        max="9999"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('leap-year.clear')}</span>
              </button>
            </div>
          </div>

          {/* Recent Leap Years */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.nearestLeapYears')}</h2>

            <div className="space-y-4">
              {recentLeapYears.previous.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">{t('leap-year.previous')}</h3>
                  <div className="flex space-x-2">
                    {recentLeapYears.previous.map((year) => (
                      <button
                        key={year}
                        onClick={() => setInputYear(year.toString())}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recentLeapYears.next.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">{t('leap-year.next')}</h3>
                  <div className="flex space-x-2">
                    {recentLeapYears.next.map((year) => (
                      <button
                        key={year}
                        onClick={() => setInputYear(year.toString())}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.resultTitle')}</h2>

            {results.year > 0 ? (
              <div className="space-y-6">
                {/* Main Status */}
                <div className={`bg-gradient-to-r rounded-lg p-6 ${
                  results.isLeapYear
                    ? 'from-green-50 to-emerald-50 border border-green-200'
                    : 'from-red-50 to-pink-50 border border-red-200'
                }`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {t('leap-year.yearLabel', { year: results.year })}
                    </span>
                    <div className="flex items-center space-x-2">
                      {results.isLeapYear ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                      <span className={`text-2xl font-bold ${
                        results.isLeapYear ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {results.isLeapYear ? t('leap-year.isLeap') : t('leap-year.isNotLeap')}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.explanation}
                  </div>
                </div>

                {/* Year Details */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('leap-year.totalDaysInYear')}</span>
                    <span className="font-semibold text-gray-900">{results.totalDaysInYear}</span>
                  </div>

                  {results.isLeapYear && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">{t('leap-year.additionalDay')}</span>
                        <span className="font-semibold text-green-600">{results.leapDate}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">{t('leap-year.dayNumber')}</span>
                        <span className="font-semibold text-gray-900">{results.dayNumber}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">{t('leap-year.previousLeapYear')}</span>
                    <button
                      onClick={() => setInputYear(results.previousLeapYear.toString())}
                      className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {results.previousLeapYear}
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">{t('leap-year.nextLeapYear')}</span>
                    <button
                      onClick={() => setInputYear(results.nextLeapYear.toString())}
                      className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {results.nextLeapYear}
                    </button>
                  </div>
                </div>

                {/* Special Cases Alert */}
                {results.year % 100 === 0 && (
                  <div className={`rounded-lg p-4 ${
                    results.isLeapYear
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        results.isLeapYear ? 'text-blue-600' : 'text-amber-600'
                      }`} />
                      <div>
                        <h3 className={`font-medium mb-1 ${
                          results.isLeapYear ? 'text-blue-900' : 'text-amber-900'
                        }`}>
                          {t('leap-year.specialCase')}
                        </h3>
                        <p className={`text-sm ${
                          results.isLeapYear ? 'text-blue-800' : 'text-amber-800'
                        }`}>
                          {results.isLeapYear
                            ? t('leap-year.specialCaseLeap', { year: results.year })
                            : t('leap-year.specialCaseNotLeap', { year: results.year })
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('leap-year.enterYearPrompt')}
              </div>
            )}
          </div>

          {/* Range Analysis Results */}
          {showRange && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.rangeAnalysisTitle')}</h2>

              {results.totalLeapYears > 0 && results.rangeLength > 0 ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-700">{results.totalLeapYears}</div>
                        <div className="text-sm text-gray-600">{t('leap-year.leapYears')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-700">{results.rangeLength}</div>
                        <div className="text-sm text-gray-600">{t('leap-year.totalYears')}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-teal-700">{results.frequency}%</div>
                        <div className="text-sm text-gray-600">{t('leap-year.frequency')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Leap Years List */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      {t('leap-year.leapYearsInRange', { start: rangeStart, end: rangeEnd })}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                      {results.leapYearsInRange.map((year) => (
                        <button
                          key={year}
                          onClick={() => setInputYear(year.toString())}
                          className="p-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : rangeStart && rangeEnd ? (
                <div className="text-center py-8 text-gray-500">
                  {t('leap-year.noLeapYearsInRange')}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('leap-year.specifyRange')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rules and Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.rulesTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('leap-year.gregorianCalendar')}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900">{t('leap-year.leapYearIf')}</div>
                  <div className="text-sm text-green-800">
                    {t('leap-year.leapYearRule')}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{t('leap-year.examples')}</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>{t('leap-year.example2024')}</div>
                  <div>{t('leap-year.example2000')}</div>
                  <div>{t('leap-year.example1900')}</div>
                  <div>{t('leap-year.example2023')}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('leap-year.whyNeeded')}</h3>
            <div className="space-y-3">
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">{t('leap-year.astronomicalReason')}</h4>
                <p className="text-sm text-yellow-800">
                  {t('leap-year.astronomicalExplanation')}
                </p>
              </div>

              <div className="bg-teal-50 rounded-lg p-4">
                <h4 className="font-medium text-teal-900 mb-2">{t('leap-year.withoutCorrection')}</h4>
                <p className="text-sm text-teal-800">
                  {t('leap-year.withoutCorrectionExplanation')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Examples */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.historicalExamples')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('leap-year.lastLeapDayTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('leap-year.lastLeapDayDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('leap-year.cycle400Title')}</h3>
            <p className="text-gray-600 text-sm">
              {t('leap-year.cycle400Description')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎂</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('leap-year.birthdayTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('leap-year.birthdayDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Reform History */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.calendarReformHistory')}</h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">{t('leap-year.julianCalendarTitle')}</h3>
              <p className="text-sm text-red-800">
                {t('leap-year.julianCalendarDescription')}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">{t('leap-year.gregorianCalendarTitle')}</h3>
              <p className="text-sm text-green-800">
                {t('leap-year.gregorianCalendarDescription')}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">{t('leap-year.transitionTitle')}</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <div>{t('leap-year.transition1582')}</div>
                <div>{t('leap-year.transition1752')}</div>
                <div>{t('leap-year.transition1918')}</div>
              </div>
              <div>
                <div>{t('leap-year.transition1873')}</div>
                <div>{t('leap-year.transition1912')}</div>
                <div>{t('leap-year.transition1923')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Accuracy */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.mathematicalAccuracy')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('leap-year.gregorianAccuracyTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div>{t('leap-year.astronomicalYear')}</div>
              <div>{t('leap-year.gregorianYear')}</div>
              <div>{t('leap-year.error')}</div>
              <div>{t('leap-year.errorAccumulation')}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('leap-year.frequencyTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div>{t('leap-year.averageFrequency')}</div>
              <div>{t('leap-year.usualRule')}</div>
              <div>{t('leap-year.exceptions')}</div>
              <div>{t('leap-year.nextException')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {t('leap-year.interestingFact')}
          </p>
        </div>
      </div>

      {/* Practical Applications */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('leap-year.practicalApplications')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-pink-50 rounded-lg">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👶</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('leap-year.pregnancyPlanningTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('leap-year.pregnancyPlanningDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('leap-year.businessPlanningTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('leap-year.businessPlanningDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚖️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('leap-year.legalTermsTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('leap-year.legalTermsDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Экспорт результатов */}
      {inputYear && results.isLeapYear !== undefined && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Проверка високосного года',
              subtitle: `Год ${inputYear}`,
              sections: [
                {
                  title: 'Результат',
                  data: [
                    { label: 'Год', value: inputYear },
                    { label: 'Високосный', value: results.isLeapYear ? 'Да (366 дней)' : 'Нет (365 дней)' },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="leap-year-check"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('leap-year.faq.q1'), answer: t('leap-year.faq.a1') },
          { question: t('leap-year.faq.q2'), answer: t('leap-year.faq.a2') },
          { question: t('leap-year.faq.q3'), answer: t('leap-year.faq.a3') },
          { question: t('leap-year.faq.q4'), answer: t('leap-year.faq.a4') },
          { question: t('leap-year.faq.q5'), answer: t('leap-year.faq.a5') }
        ]}
        sources={[
          { title: 'Григорианский календарь', url: 'https://ru.wikipedia.org/wiki/Григорианский_календарь' },
        ]}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="leap-year"
        calculatorTitle="Калькулятор високосного года"
      />
      <LastUpdated calculatorId="leap-year" />
    </div>
  );
}
