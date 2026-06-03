import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Calculator, Plus, Minus, Clock, Info, RotateCcw, Copy, Download, ArrowRight, CalendarDays, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';

interface DateCalculation {
  startDate: Date;
  endDate: Date;
  operation: 'add' | 'subtract';
  period: {
    years: number;
    months: number;
    days: number;
  };
  totalDays: number;
}

interface CalculationHistory {
  id: string;
  calculation: DateCalculation;
  result: string;
  timestamp: Date;
}

export default function DateCalculator() {
  const { t } = useTranslation('calculators');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [years, setYears] = useState<string>('');
  const [months, setMonths] = useState<string>('');
  const [days, setDays] = useState<string>('');
  const [calculateDifference, setCalculateDifference] = useState<boolean>(false);
  const [endDateForDiff, setEndDateForDiff] = useState<string>('');

  const [history, setHistory] = useState<CalculationHistory[]>([]);

  const [results, setResults] = useState({
    resultDate: '',
    resultDateFormatted: '',
    totalDaysChanged: 0,
    dayOfWeek: '',
    isWeekend: false,
    monthName: '',
    yearInfo: '',

    daysDifference: 0,
    weeksDifference: 0,
    monthsDifference: 0,
    yearsDifference: 0,
    diffDescription: '',

    warnings: [] as string[]
  });

  const monthNames = [
    t('date-calculator.january'),
    t('date-calculator.february'),
    t('date-calculator.march'),
    t('date-calculator.april'),
    t('date-calculator.may'),
    t('date-calculator.june'),
    t('date-calculator.july'),
    t('date-calculator.august'),
    t('date-calculator.september'),
    t('date-calculator.october'),
    t('date-calculator.november'),
    t('date-calculator.december')
  ];

  const dayNames = [
    t('date-calculator.sunday'),
    t('date-calculator.monday'),
    t('date-calculator.tuesday'),
    t('date-calculator.wednesday'),
    t('date-calculator.thursday'),
    t('date-calculator.friday'),
    t('date-calculator.saturday')
  ];

  const calculateDate = () => {
    if (!startDate) {
      setResults({
        resultDate: '', resultDateFormatted: '', totalDaysChanged: 0,
        dayOfWeek: '', isWeekend: false, monthName: '', yearInfo: '',
        daysDifference: 0, weeksDifference: 0, monthsDifference: 0, yearsDifference: 0,
        diffDescription: '', warnings: []
      });
      return;
    }

    const baseDate = new Date(startDate);
    const yearsToAdd = parseInt(years) || 0;
    const monthsToAdd = parseInt(months) || 0;
    const daysToAdd = parseInt(days) || 0;

    if (isNaN(baseDate.getTime())) {
      setResults(prev => ({
        ...prev,
        warnings: [t('date-calculator.invalidStartDate')]
      }));
      return;
    }

    const originalDate = new Date(baseDate);
    const resultDate = new Date(baseDate);

    const multiplier = operation === 'add' ? 1 : -1;

    if (yearsToAdd !== 0) {
      resultDate.setFullYear(resultDate.getFullYear() + (yearsToAdd * multiplier));
    }

    if (monthsToAdd !== 0) {
      resultDate.setMonth(resultDate.getMonth() + (monthsToAdd * multiplier));
    }

    if (daysToAdd !== 0) {
      resultDate.setDate(resultDate.getDate() + (daysToAdd * multiplier));
    }

    const timeDifference = resultDate.getTime() - originalDate.getTime();
    const totalDaysChanged = Math.round(timeDifference / (1000 * 60 * 60 * 24));

    const resultDateISO = resultDate.toISOString().split('T')[0];
    const dayOfWeek = dayNames[resultDate.getDay()];
    const isWeekend = resultDate.getDay() === 0 || resultDate.getDay() === 6;
    const monthName = monthNames[resultDate.getMonth()];
    const resultDateFormatted = `${resultDate.getDate()} ${monthName} ${resultDate.getFullYear()} (${dayOfWeek})`;

    const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const yearInfo = isLeapYear(resultDate.getFullYear()) ?
      `${resultDate.getFullYear()} - ${t('date-calculator.leapYear')} (${t('date-calculator.366daysText')})` :
      `${resultDate.getFullYear()} - ${t('date-calculator.regularYear')} (${t('date-calculator.365daysText')})`;

    const warnings = [];

    if (monthsToAdd !== 0 || yearsToAdd !== 0) {
      const startMonth = originalDate.getMonth();
      const endMonth = resultDate.getMonth();
      const startYear = originalDate.getFullYear();
      const endYear = resultDate.getFullYear();

      if (isLeapYear(startYear) || isLeapYear(endYear)) {
        if ((startMonth <= 1 && endMonth >= 1) || (startMonth >= 1 && endMonth <= 1)) {
          warnings.push(t('date-calculator.leapYearDay'));
        }
      }
    }

    if (originalDate.getMonth() !== resultDate.getMonth()) {
      warnings.push(t('date-calculator.differentMonth'));
    }

    if (isWeekend) {
      warnings.push(t('date-calculator.weekendWarning'));
    }

    setResults({
      resultDate: resultDateISO,
      resultDateFormatted,
      totalDaysChanged: Math.abs(totalDaysChanged),
      dayOfWeek,
      isWeekend,
      monthName,
      yearInfo,
      daysDifference: 0,
      weeksDifference: 0,
      monthsDifference: 0,
      yearsDifference: 0,
      diffDescription: '',
      warnings
    });
  };

  const calculateDateDifference = () => {
    if (!startDate || !endDateForDiff) {
      setResults(prev => ({
        ...prev,
        daysDifference: 0,
        weeksDifference: 0,
        monthsDifference: 0,
        yearsDifference: 0,
        diffDescription: ''
      }));
      return;
    }

    const date1 = new Date(startDate);
    const date2 = new Date(endDateForDiff);

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return;
    }

    const [earlierDate, laterDate] = date1 <= date2 ? [date1, date2] : [date2, date1];

    const timeDifference = laterDate.getTime() - earlierDate.getTime();
    const daysDifference = Math.round(timeDifference / (1000 * 60 * 60 * 24));
    const weeksDifference = Math.floor(daysDifference / 7);

    let yearsDifference = laterDate.getFullYear() - earlierDate.getFullYear();
    let monthsDifference = laterDate.getMonth() - earlierDate.getMonth();

    if (laterDate.getDate() < earlierDate.getDate()) {
      monthsDifference--;
    }

    if (monthsDifference < 0) {
      yearsDifference--;
      monthsDifference += 12;
    }

    const diffDescription = `${t('date-calculator.from')} ${date1.toLocaleDateString('ru-RU')} ${t('date-calculator.to')} ${date2.toLocaleDateString('ru-RU')}`;

    setResults(prev => ({
      ...prev,
      daysDifference,
      weeksDifference,
      monthsDifference,
      yearsDifference,
      diffDescription
    }));
  };

  const addToHistory = () => {
    if (results.resultDate && startDate) {
      const calculation: DateCalculation = {
        startDate: new Date(startDate),
        endDate: new Date(results.resultDate),
        operation,
        period: {
          years: parseInt(years) || 0,
          months: parseInt(months) || 0,
          days: parseInt(days) || 0
        },
        totalDays: results.totalDaysChanged
      };

      const newEntry: CalculationHistory = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        calculation,
        result: results.resultDateFormatted,
        timestamp: new Date()
      };

      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    }
  };

  const setQuickPeriod = (yearsVal: string, monthsVal: string, daysVal: string) => {
    setYears(yearsVal);
    setMonths(monthsVal);
    setDays(daysVal);
  };

  const setToday = () => {
    const today = new Date();
    setStartDate(today.toISOString().split('T')[0]);
  };

  const clearAll = () => {
    setStartDate('');
    setYears('');
    setMonths('');
    setDays('');
    setEndDateForDiff('');
    setCalculateDifference(false);
    setResults({
      resultDate: '', resultDateFormatted: '', totalDaysChanged: 0,
      dayOfWeek: '', isWeekend: false, monthName: '', yearInfo: '',
      daysDifference: 0, weeksDifference: 0, monthsDifference: 0, yearsDifference: 0,
      diffDescription: '', warnings: []
    });
  };

  const copyResult = () => {
    let content = '';
    if (calculateDifference && results.diffDescription) {
      content = `${results.diffDescription}\n${t('date-calculator.differenceLabel')} ${results.daysDifference} ${t('date-calculator.daysText')} (${results.weeksDifference} ${t('date-calculator.weeksText')})`;
      if (results.yearsDifference > 0 || results.monthsDifference > 0) {
        content += `\n${t('date-calculator.exactDifference')}: ${results.yearsDifference} ${t('date-calculator.yearsText')} ${results.monthsDifference} ${t('date-calculator.monthsText')}`;
      }
    } else if (results.resultDateFormatted) {
      const periodStr = [
        years && `${years} ${t('date-calculator.yearsText')}`,
        months && `${months} ${t('date-calculator.monthsText')}`,
        days && `${days} ${t('date-calculator.daysText')}`
      ].filter(Boolean).join(' ');

      content = `${operation === 'add' ? t('date-calculator.add') : t('date-calculator.subtract')} ${periodStr}\n`;
      content += `${t('date-calculator.startDate')}: ${new Date(startDate).toLocaleDateString('ru-RU')}\n`;
      content += `${t('date-calculator.result')}: ${results.resultDateFormatted}\n`;
      content += `${t('date-calculator.totalChange')}: ${results.totalDaysChanged} ${t('date-calculator.daysText')}`;
    }

    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const downloadResult = () => {
    if (results.resultDateFormatted || results.diffDescription) {
      let content = `${t('date-calculator.dateCalculation')}\n\n`;

      if (calculateDifference) {
        content += `${t('date-calculator.differenceBetweenDates')}\n`;
        content += `${results.diffDescription}\n`;
        content += `${t('date-calculator.differenceLabel')} ${results.daysDifference} ${t('date-calculator.daysText')}\n`;
        content += `${t('date-calculator.inWeeks')}: ${results.weeksDifference} ${t('date-calculator.weeksText')}\n`;
        if (results.yearsDifference > 0 || results.monthsDifference > 0) {
          content += `${t('date-calculator.exactDifference')}: ${results.yearsDifference} ${t('date-calculator.yearsText')} ${results.monthsDifference} ${t('date-calculator.monthsText')}\n`;
        }
      } else {
        const periodStr = [
          years && `${years} ${t('date-calculator.yearsText')}`,
          months && `${months} ${t('date-calculator.monthsText')}`,
          days && `${days} ${t('date-calculator.daysText')}`
        ].filter(Boolean).join(' ');

        content += `${operation === 'add' ? t('date-calculator.addingPeriod') : t('date-calculator.subtractingPeriod')}:\n`;
        content += `${t('date-calculator.startDate')}: ${new Date(startDate).toLocaleDateString('ru-RU')}\n`;
        content += `${t('date-calculator.period')}: ${periodStr}\n`;
        content += `${t('date-calculator.result')}: ${results.resultDateFormatted}\n`;
        content += `${t('date-calculator.totalChange')}: ${results.totalDaysChanged} ${t('date-calculator.daysText')}\n`;
        content += `${results.yearInfo}\n`;
      }

      content += `\n${t('date-calculator.calculationTime')}: ${new Date().toLocaleString('ru-RU')}`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'date_calculation.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!calculateDifference) {
      calculateDate();
    }
  }, [startDate, operation, years, months, days, t]);

  useEffect(() => {
    if (calculateDifference) {
      calculateDateDifference();
    }
  }, [startDate, endDateForDiff, calculateDifference, t]);

  useEffect(() => {
    if (results.resultDate && startDate) {
      addToHistory();
    }
  }, [results.resultDateFormatted]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('date-calculator.heading')}</h1>
            <p className="text-gray-600">{t('date-calculator.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('date-calculator.workMode')}</h2>

            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <button
                onClick={() => setCalculateDifference(false)}
                className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                  !calculateDifference
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
                  <Plus className="w-5 h-5" />
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base">{t('date-calculator.addSubtractMode')}</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('date-calculator.addSubtractDesc')}
                </p>
              </button>

              <button
                onClick={() => setCalculateDifference(true)}
                className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                  calculateDifference
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
                  <Calculator className="w-5 h-5" />
                  <h3 className="font-semibold text-xs sm:text-sm lg:text-base">{t('date-calculator.differenceMo')}</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('date-calculator.differenceDesc')}
                </p>
              </button>
            </div>
          </div>

          {!calculateDifference && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {operation === 'add' ? t('date-calculator.addingPeriod') : t('date-calculator.subtractingPeriod')}
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      {t('date-calculator.startDate')}
                    </label>
                    <button
                      onClick={setToday}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {t('date-calculator.today')}
                    </button>
                  </div>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('date-calculator.operation')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setOperation('add')}
                      className={`p-3 rounded-lg border-2 transition-all min-w-0 ${
                        operation === 'add'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Plus className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">{t('date-calculator.add')}</div>
                    </button>
                    <button
                      onClick={() => setOperation('subtract')}
                      className={`p-3 rounded-lg border-2 transition-all min-w-0 ${
                        operation === 'subtract'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Minus className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">{t('date-calculator.subtract')}</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('date-calculator.timePeriod')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <label htmlFor="years" className="block text-xs font-medium text-gray-600 mb-1 truncate">
                        {t('date-calculator.years')}
                      </label>
                      <input
                        type="number"
                        id="years"
                        value={years}
                        onChange={(e) => setYears(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-w-0"
                      />
                    </div>

                    <div>
                      <label htmlFor="months" className="block text-xs font-medium text-gray-600 mb-1 truncate">
                        {t('date-calculator.months')}
                      </label>
                      <input
                        type="number"
                        id="months"
                        value={months}
                        onChange={(e) => setMonths(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="12"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-w-0"
                      />
                    </div>

                    <div>
                      <label htmlFor="days" className="block text-xs font-medium text-gray-600 mb-1 truncate">
                        {t('date-calculator.days')}
                      </label>
                      <input
                        type="number"
                        id="days"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="366"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-w-0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('date-calculator.quickPeriods')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    <button
                      onClick={() => setQuickPeriod('0', '0', '7')}
                      className="p-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors truncate"
                    >
                      {t('date-calculator.oneWeek')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('0', '1', '0')}
                      className="p-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors truncate"
                    >
                      {t('date-calculator.oneMonth')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('0', '3', '0')}
                      className="p-2 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors truncate"
                    >
                      {t('date-calculator.quarter')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('1', '0', '0')}
                      className="p-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors truncate"
                    >
                      {t('date-calculator.oneYear')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('0', '0', '30')}
                      className="p-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors truncate"
                    >
                      {t('date-calculator.thirtyDays')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('0', '0', '90')}
                      className="p-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors truncate"
                    >
                      {t('date-calculator.ninetyDays')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('0', '6', '0')}
                      className="p-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors truncate"
                    >
                      {t('date-calculator.halfYear')}
                    </button>
                    <button
                      onClick={() => setQuickPeriod('0', '0', '365')}
                      className="p-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors truncate"
                    >
                      {t('date-calculator.365days')}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">{t('date-calculator.calculationFeatures')}</h3>
                  <div className="text-xs sm:text-sm text-blue-800 space-y-1">
                    <div>• {t('date-calculator.leapYearsConsidered')}</div>
                    <div>• {t('date-calculator.monthsAddedCalendar')}</div>
                    <div>• {t('date-calculator.daysAddedExactly')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {calculateDifference && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('date-calculator.dateDifference')}</h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="startDateDiff" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('date-calculator.firstDate')}
                  </label>
                  <input
                    type="date"
                    id="startDateDiff"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="endDateForDiff" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('date-calculator.secondDate')}
                  </label>
                  <input
                    type="date"
                    id="endDateForDiff"
                    value={endDateForDiff}
                    onChange={(e) => setEndDateForDiff(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-green-900 mb-2">{t('date-calculator.differenceCalculation')}</h3>
                  <p className="text-xs text-green-800">
                    {t('date-calculator.differenceCalcDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('date-calculator.actions')}</h2>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={clearAll}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t('date-calculator.clear')}</span>
              </button>

              <button
                onClick={copyResult}
                disabled={!results.resultDateFormatted && !results.diffDescription}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  (results.resultDateFormatted || results.diffDescription)
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>{t('date-calculator.copy')}</span>
              </button>

              <button
                onClick={downloadResult}
                disabled={!results.resultDateFormatted && !results.diffDescription}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  (results.resultDateFormatted || results.diffDescription)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{t('date-calculator.download')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {calculateDifference ? t('date-calculator.dateDifferenceResult') : t('date-calculator.calculationResult')}
            </h2>

            {calculateDifference ? (
              results.diffDescription ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">{t('date-calculator.difference')}</span>
                      <div className="flex items-center space-x-2">
                        <Calculator className="w-6 h-6 text-green-600" />
                        <span className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                          {results.daysDifference.toLocaleString()} {t('date-calculator.daysText')}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {results.diffDescription}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                      <span className="text-gray-600">{t('date-calculator.inWeeks')}</span>
                      <span className="font-semibold text-gray-900">
                        {results.weeksDifference} {t('date-calculator.weeksText')} {results.daysDifference % 7} {t('date-calculator.daysText')}
                      </span>
                    </div>

                    {(results.yearsDifference > 0 || results.monthsDifference > 0) && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                        <span className="text-gray-600">{t('date-calculator.exactDifference')}</span>
                        <span className="font-semibold text-gray-900">
                          {results.yearsDifference > 0 && `${results.yearsDifference} ${t('date-calculator.yearsText')} `}
                          {results.monthsDifference > 0 && `${results.monthsDifference} ${t('date-calculator.monthsText')}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('date-calculator.enterBothDates')}
                </div>
              )
            ) : (
              results.resultDateFormatted ? (
                <div className="space-y-6">
                  <div className={`bg-gradient-to-r ${
                    operation === 'add'
                      ? 'from-blue-50 to-cyan-50'
                      : 'from-red-50 to-pink-50'
                  } rounded-lg p-6`}>
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {t('date-calculator.resultDate')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Calendar className={`w-6 h-6 ${
                          operation === 'add' ? 'text-blue-600' : 'text-red-600'
                        }`} />
                        <span className={`text-base sm:text-lg lg:text-xl font-bold ${
                          operation === 'add' ? 'text-blue-700' : 'text-red-700'
                        }`}>
                          {results.resultDateFormatted}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {operation === 'add' ? t('date-calculator.added') : t('date-calculator.subtracted')}: {results.totalDaysChanged} {t('date-calculator.daysText')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                      <span className="text-gray-600">{t('date-calculator.dayOfWeek')}</span>
                      <span className={`font-semibold ${
                        results.isWeekend ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {results.dayOfWeek}
                        {results.isWeekend && ` (${t('date-calculator.weekend')})`}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                      <span className="text-gray-600">{t('date-calculator.month')}</span>
                      <span className="font-semibold text-gray-900">{results.monthName}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 space-y-1 sm:space-y-0">
                      <span className="text-gray-600">{t('date-calculator.year')}</span>
                      <span className="font-semibold text-gray-900">{results.yearInfo}</span>
                    </div>
                  </div>

                  {results.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h3 className="font-medium text-amber-900 mb-2">{t('date-calculator.features')}</h3>
                      <div className="space-y-1">
                        {results.warnings.map((warning, index) => (
                          <div key={index} className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                            • {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('date-calculator.enterDateAndPeriod')}
                </div>
              )
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('date-calculator.calculationHistory')}</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('date-calculator.clearHistory')}
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {item.calculation.operation === 'add' ? '+' : '-'}
                        {[
                          item.calculation.period.years && `${item.calculation.period.years}г`,
                          item.calculation.period.months && `${item.calculation.period.months}м`,
                          item.calculation.period.days && `${item.calculation.period.days}д`
                        ].filter(Boolean).join(' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 break-all">
                      {item.calculation.startDate.toLocaleDateString('ru-RU')} → {item.result}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">{t('date-calculator.historyEmpty')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('date-calculator.popularUseCases')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-6 bg-pink-50 rounded-lg">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👶</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('date-calculator.pregnancy')}</h3>
            <div className="text-gray-600 text-xs sm:text-sm space-y-1">
              <div>{t('date-calculator.pregnancyPDD')}</div>
              <div>{t('date-calculator.pregnancyTrimesters')}</div>
              <div>{t('date-calculator.pregnancyMaternity')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('date-calculator.business')}</h3>
            <div className="text-gray-600 text-xs sm:text-sm space-y-1">
              <div>{t('date-calculator.businessContracts')}</div>
              <div>{t('date-calculator.businessProjects')}</div>
              <div>{t('date-calculator.businessReporting')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚖️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('date-calculator.legalTerms')}</h3>
            <div className="text-gray-600 text-xs space-y-1">
              <div>{t('date-calculator.legalLimitation')}</div>
              <div>{t('date-calculator.legalAppeal')}</div>
              <div>{t('date-calculator.legalObligations')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('date-calculator.dateCalculationRules')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('date-calculator.addSubtractMonths')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('date-calculator.rule1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('date-calculator.rule2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('date-calculator.rule3')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('date-calculator.leapYearFeatures')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('date-calculator.leap1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('date-calculator.leap2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('date-calculator.leap3')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('date-calculator.calculationAccuracy')}
              </h3>
              <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                {t('date-calculator.accuracyDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('date-calculator.practicalExamples')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📅 {t('date-calculator.forPlanning')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div>• {t('date-calculator.planning1')}</div>
              <div>• {t('date-calculator.planning2')}</div>
              <div>• {t('date-calculator.planning3')}</div>
              <div>• {t('date-calculator.planning4')}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">⚖️ {t('date-calculator.forLegal')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div>• {t('date-calculator.legal1')}</div>
              <div>• {t('date-calculator.legal2')}</div>
              <div>• {t('date-calculator.legal3')}</div>
              <div>• {t('date-calculator.legal4')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Экспорт результатов */}
      {results && results.startDate && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('date-calculator.title'),
              subtitle: t('date-calculator.description'),
              sections: [
                {
                  title: t('date-calculator.resultLabel'),
                  data: [
                    { label: t('date-calculator.startDate'), value: results.startDate ? results.startDate.toLocaleDateString('ru-KZ') : '' },
                    { label: t('date-calculator.operation'), value: results.operation === 'add' ? t('date-calculator.add') : t('date-calculator.subtract') },
                    { label: t('date-calculator.result'), value: results.endDate ? results.endDate.toLocaleDateString('ru-KZ') : '' },
                    { label: t('date-calculator.totalDays'), value: `${results.totalDays || 0}` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="date-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('date-calculator.faq.q1'), answer: t('date-calculator.faq.a1') },
          { question: t('date-calculator.faq.q2'), answer: t('date-calculator.faq.a2') },
          { question: t('date-calculator.faq.q3'), answer: t('date-calculator.faq.a3') },
          { question: t('date-calculator.faq.q4'), answer: t('date-calculator.faq.a4') },
          { question: t('date-calculator.faq.q5'), answer: t('date-calculator.faq.a5') }
        ]}
        sources={[
          { title: 'Производственный календарь РК', url: 'https://egov.kz/' },
          { title: 'Трудовой кодекс РК — праздники', url: 'https://online.zakon.kz/document/?doc_id=38910832' },
        ]}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="date-calculator"
        calculatorTitle="Калькулятор дат"
      />
      <LastUpdated calculatorId="date-calculator" />
    </div>
  );
}
