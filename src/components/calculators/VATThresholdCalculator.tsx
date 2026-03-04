import React, { useState, useEffect } from 'react';
import { Receipt, Calculator, AlertTriangle, CheckCircle, Calendar, TrendingUp, Info, Target, Building, FileText, BarChart3 } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, TrendLineChart, ProgressBar } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';

interface MonthlyTurnover {
  month: string;
  monthName: string;
  amount: number;
  runningTotal: number;
  isExceeded: boolean;
}

export default function VATThresholdCalculator() {
  const { t } = useTranslation('calculators');
  const [calculationYear, setCalculationYear] = useState<number>(2026);
  const [monthlyTurnovers, setMonthlyTurnovers] = useState<{ [key: string]: string }>({
    january: '',
    february: '',
    march: '',
    april: '',
    may: '',
    june: '',
    july: '',
    august: '',
    september: '',
    october: '',
    november: '',
    december: ''
  });

  const [results, setResults] = useState({
    currentTotal: 0,
    thresholdAmount: 0,
    isExceeded: false,
    exceedanceMonth: '',
    exceedanceMonthName: '',
    remainingToThreshold: 0,
    excessAmount: 0,
    registrationDeadline: '',
    monthlyBreakdown: [] as MonthlyTurnover[],
    projectedYearEnd: 0,
    averageMonthlyTurnover: 0
  });

  const MRP_VALUES = {
    2024: 3692,
    2025: 3932,
    2026: 4325,
    2027: 4580,
    2028: 4938
  };

  const VAT_THRESHOLD_MRP = 20000;

  const months = [
    { id: 'january', name: t('vat-threshold.months.january'), shortName: t('vat-threshold.months.januaryShort') },
    { id: 'february', name: t('vat-threshold.months.february'), shortName: t('vat-threshold.months.februaryShort') },
    { id: 'march', name: t('vat-threshold.months.march'), shortName: t('vat-threshold.months.marchShort') },
    { id: 'april', name: t('vat-threshold.months.april'), shortName: t('vat-threshold.months.aprilShort') },
    { id: 'may', name: t('vat-threshold.months.may'), shortName: t('vat-threshold.months.mayShort') },
    { id: 'june', name: t('vat-threshold.months.june'), shortName: t('vat-threshold.months.juneShort') },
    { id: 'july', name: t('vat-threshold.months.july'), shortName: t('vat-threshold.months.julyShort') },
    { id: 'august', name: t('vat-threshold.months.august'), shortName: t('vat-threshold.months.augustShort') },
    { id: 'september', name: t('vat-threshold.months.september'), shortName: t('vat-threshold.months.septemberShort') },
    { id: 'october', name: t('vat-threshold.months.october'), shortName: t('vat-threshold.months.octoberShort') },
    { id: 'november', name: t('vat-threshold.months.november'), shortName: t('vat-threshold.months.novemberShort') },
    { id: 'december', name: t('vat-threshold.months.december'), shortName: t('vat-threshold.months.decemberShort') }
  ];

  const calculateVATThreshold = () => {
    const mrpValue = MRP_VALUES[calculationYear as keyof typeof MRP_VALUES] || 3876;
    const thresholdAmount = VAT_THRESHOLD_MRP * mrpValue;

    let runningTotal = 0;
    let isExceeded = false;
    let exceedanceMonth = '';
    let exceedanceMonthName = '';
    const monthlyBreakdown: MonthlyTurnover[] = [];

    for (const month of months) {
      const monthAmount = parseFloat(monthlyTurnovers[month.id]) || 0;
      runningTotal += monthAmount;

      const isMonthExceeded = runningTotal >= thresholdAmount && !isExceeded;
      if (isMonthExceeded) {
        isExceeded = true;
        exceedanceMonth = month.id;
        exceedanceMonthName = month.name;
      }

      monthlyBreakdown.push({
        month: month.id,
        monthName: month.name,
        amount: monthAmount,
        runningTotal,
        isExceeded: runningTotal >= thresholdAmount
      });
    }

    const remainingToThreshold = Math.max(0, thresholdAmount - runningTotal);
    const excessAmount = Math.max(0, runningTotal - thresholdAmount);

    let registrationDeadline = '';
    if (isExceeded && exceedanceMonth) {
      const monthIndex = months.findIndex(m => m.id === exceedanceMonth);
      if (monthIndex !== -1) {
        const nextMonth = months[monthIndex + 1];
        if (nextMonth) {
          registrationDeadline = t('vat-threshold.registrationDeadlineFormat', {
            month: nextMonth.name.toLowerCase(),
            year: calculationYear
          });
        } else {
          registrationDeadline = t('vat-threshold.registrationDeadlineNextYear', {
            year: calculationYear + 1
          });
        }
      }
    }

    const filledMonths = monthlyBreakdown.filter(m => m.amount > 0).length;
    const averageMonthlyTurnover = filledMonths > 0 ? runningTotal / filledMonths : 0;
    const projectedYearEnd = filledMonths > 0 ? averageMonthlyTurnover * 12 : 0;

    setResults({
      currentTotal: Math.round(runningTotal),
      thresholdAmount: Math.round(thresholdAmount),
      isExceeded,
      exceedanceMonth,
      exceedanceMonthName,
      remainingToThreshold: Math.round(remainingToThreshold),
      excessAmount: Math.round(excessAmount),
      registrationDeadline,
      monthlyBreakdown,
      projectedYearEnd: Math.round(projectedYearEnd),
      averageMonthlyTurnover: Math.round(averageMonthlyTurnover)
    });
  };

  useEffect(() => {
    calculateVATThreshold();
  }, [monthlyTurnovers, calculationYear]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    const mrpValue = MRP_VALUES[calculationYear as keyof typeof MRP_VALUES] || 3876;
    return t('vat-threshold.mrpFormat', {
      amount: mrpAmount.toLocaleString(),
      tenge: formatNumber(mrpAmount * mrpValue)
    });
  };

  const updateMonthlyTurnover = (monthId: string, value: string) => {
    setMonthlyTurnovers(prev => ({
      ...prev,
      [monthId]: value
    }));
  };

  const clearAll = () => {
    setMonthlyTurnovers({
      january: '', february: '', march: '', april: '', may: '', june: '',
      july: '', august: '', september: '', october: '', november: '', december: ''
    });
  };

  const setQuickValues = (monthlyAmount: number) => {
    const newValues: { [key: string]: string } = {};
    months.forEach(month => {
      newValues[month.id] = monthlyAmount.toString();
    });
    setMonthlyTurnovers(newValues);
  };

  const getShareData = () => {
    const mrpValue = MRP_VALUES[calculationYear as keyof typeof MRP_VALUES] || 3876;

    const title = t('vat-threshold.shareTitle', { year: calculationYear });
    const description = t('vat-threshold.shareDescription', { threshold: formatMRP(VAT_THRESHOLD_MRP) });

    let shareResultsString = t('vat-threshold.shareMonthlyBreakdown') + '\n';

    results.monthlyBreakdown.forEach(month => {
      if (month.amount > 0) {
        shareResultsString += `${month.monthName}: ${formatNumber(month.amount)} → ${t('vat-threshold.total')}: ${formatNumber(month.runningTotal)}`;
        if (month.month === results.exceedanceMonth) {
          shareResultsString += ` [${t('vat-threshold.thresholdExceeded')}]`;
        }
        shareResultsString += '\n';
      }
    });

    if (results.isExceeded) {
      shareResultsString += `\n${t('vat-threshold.resultExceeded')}
${t('vat-threshold.exceedanceMonth')}: ${results.exceedanceMonthName}
${t('vat-threshold.excessAmount')}: ${formatNumber(results.excessAmount)}
${t('vat-threshold.registrationDeadline')}: ${results.registrationDeadline}

${t('vat-threshold.mandatoryActions')}:
1. ${t('vat-threshold.action1')}
2. ${t('vat-threshold.action2')}
3. ${t('vat-threshold.action3')}`;
    } else {
      shareResultsString += `\n${t('vat-threshold.resultNotExceeded')}
${t('vat-threshold.currentTurnover')}: ${formatNumber(results.currentTotal)}
${t('vat-threshold.remainingToThreshold')}: ${formatNumber(results.remainingToThreshold)}
${t('vat-threshold.yearEndProjection')}: ${formatNumber(results.projectedYearEnd)}`;
    }

    return { title, description, results: shareResultsString };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('vat-threshold.title')}</h1>
            <p className="text-gray-600">{t('vat-threshold.description')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              {t('vat-threshold.infoTitle', { year: calculationYear })}
            </h3>
            <div className="text-orange-800 space-y-2">
              <p>
                {t('vat-threshold.infoText1', { threshold: formatMRP(VAT_THRESHOLD_MRP) })}
              </p>
              <p>
                {t('vat-threshold.infoText2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat-threshold.calculationYear')}</h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[2024, 2025, 2026, 2027, 2028, 2029].map((year) => (
                <button
                  key={year}
                  onClick={() => setCalculationYear(year)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    calculationYear === year
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-semibold">{year}</div>
                  <div className="text-xs text-gray-600">
                    {t('vat-threshold.mrpLabel')}: {MRP_VALUES[year as keyof typeof MRP_VALUES] || '?'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                {t('vat-threshold.thresholdForYear', { year: calculationYear })}
              </h3>
              <div className="text-blue-800">
                <strong>{formatMRP(VAT_THRESHOLD_MRP)}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('vat-threshold.monthlyTurnoverTitle', { year: calculationYear })}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setQuickValues(5000000)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {t('vat-threshold.quickValue5M')}
                </button>
                <button
                  onClick={() => setQuickValues(7000000)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {t('vat-threshold.quickValue7M')}
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  {t('vat-threshold.clear')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {months.map((month) => {
                const monthData = results.monthlyBreakdown.find(m => m.month === month.id);
                const isExceededInThisMonth = monthData?.isExceeded &&
                  (results.monthlyBreakdown.find(m => m.month === months[months.indexOf(month) - 1]?.id)?.isExceeded === false ||
                   months.indexOf(month) === 0);

                return (
                  <div key={month.id} className={`border-2 rounded-lg p-4 transition-all ${
                    isExceededInThisMonth
                      ? 'border-red-300 bg-red-50'
                      : monthData?.isExceeded
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200'
                  }`}>
                    <label htmlFor={month.id} className="block text-sm font-medium text-gray-700 mb-2">
                      {month.name}
                      {isExceededInThisMonth && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          {t('vat-threshold.exceeded')}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id={month.id}
                        value={monthlyTurnovers[month.id]}
                        onChange={(e) => updateMonthlyTurnover(month.id, e.target.value)}
                        placeholder={t('vat-threshold.turnoverPlaceholder')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                          isExceededInThisMonth
                            ? 'border-red-300 focus:ring-red-200'
                            : monthData?.isExceeded
                            ? 'border-orange-300 focus:ring-orange-200'
                            : 'border-gray-300 focus:ring-blue-200'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">₸</span>
                      </div>
                    </div>
                    {monthData && monthData.amount > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        {t('vat-threshold.cumulative')}: {formatNumber(monthData.runningTotal)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {results.monthlyBreakdown.some(m => m.amount > 0) && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-600">{t('vat-threshold.tableMonth')}</th>
                      <th className="text-right py-2 text-gray-600">{t('vat-threshold.tableTurnover')}</th>
                      <th className="text-right py-2 text-gray-600">{t('vat-threshold.tableCumulative')}</th>
                      <th className="text-center py-2 text-gray-600">{t('vat-threshold.tableStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.monthlyBreakdown.map((month, index) => {
                      if (month.amount === 0) return null;

                      const isExceededInThisMonth = month.isExceeded &&
                        (index === 0 || !results.monthlyBreakdown[index - 1].isExceeded);

                      return (
                        <tr key={month.month} className={`border-b border-gray-100 ${
                          isExceededInThisMonth ? 'bg-red-50' : month.isExceeded ? 'bg-orange-50' : ''
                        }`}>
                          <td className="py-2 font-medium">{month.monthName}</td>
                          <td className="py-2 text-right">{formatNumber(month.amount)}</td>
                          <td className="py-2 text-right font-medium">{formatNumber(month.runningTotal)}</td>
                          <td className="py-2 text-center">
                            {isExceededInThisMonth ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {t('vat-threshold.statusExceedance')}
                              </span>
                            ) : month.isExceeded ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                <Target className="w-3 h-3 mr-1" />
                                {t('vat-threshold.statusExceeded')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('vat-threshold.statusNormal')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-xl border-2 p-6 ${
            results.isExceeded
              ? 'border-red-300 bg-red-50'
              : 'border-green-300 bg-green-50'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              {results.isExceeded ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              <div>
                <h3 className={`text-lg font-bold ${
                  results.isExceeded ? 'text-red-900' : 'text-green-900'
                }`}>
                  {results.isExceeded ? t('vat-threshold.thresholdExceededTitle') : t('vat-threshold.thresholdNotExceededTitle')}
                </h3>
                {results.isExceeded && (
                  <p className="text-red-800">
                    {t('vat-threshold.exceededIn', { month: results.exceedanceMonthName })}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">{t('vat-threshold.currentTurnover')}:</span>
                <span className="font-semibold">{formatNumber(results.currentTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">{t('vat-threshold.thresholdFor', { year: calculationYear })}:</span>
                <span className="font-semibold">{formatNumber(results.thresholdAmount)}</span>
              </div>
              {results.isExceeded ? (
                <div className="flex justify-between text-red-700">
                  <span>{t('vat-threshold.exceedance')}:</span>
                  <span className="font-semibold">{formatNumber(results.excessAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-green-700">
                  <span>{t('vat-threshold.remainingToThreshold')}:</span>
                  <span className="font-semibold">{formatNumber(results.remainingToThreshold)}</span>
                </div>
              )}
            </div>
          </div>

          {results.isExceeded && results.registrationDeadline && (
            <div className="bg-red-100 border border-red-300 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    {t('vat-threshold.urgentRegistration')}
                  </h3>
                  <p className="text-red-800 mb-3">
                    {t('vat-threshold.submitApplication')} <strong>{results.registrationDeadline}</strong>.
                  </p>
                  <div className="bg-red-200 rounded-lg p-3 text-sm text-red-900">
                    <strong>{t('vat-threshold.mandatoryActions')}:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>{t('vat-threshold.mandatoryAction1')}</li>
                      <li>{t('vat-threshold.mandatoryAction2')}</li>
                      <li>{t('vat-threshold.mandatoryAction3')}</li>
                      <li>{t('vat-threshold.mandatoryAction4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              {t('vat-threshold.statisticsTitle')}
            </h3>

            <div className="space-y-3">
              {results.averageMonthlyTurnover > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">{t('vat-threshold.averageMonthly')}:</span>
                  <span className="font-medium">{formatNumber(results.averageMonthlyTurnover)}</span>
                </div>
              )}

              {results.projectedYearEnd > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">{t('vat-threshold.yearEndProjection')}:</span>
                  <span className={`font-medium ${
                    results.projectedYearEnd > results.thresholdAmount ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatNumber(results.projectedYearEnd)}
                  </span>
                </div>
              )}

              {results.projectedYearEnd > results.thresholdAmount && !results.isExceeded && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      {t('vat-threshold.warningProjection')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-600" />
              {t('vat-threshold.progressTitle')}
            </h3>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    results.isExceeded ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (results.currentTotal / results.thresholdAmount) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-600">
                <span>0 ₸</span>
                <span>{Math.round((results.currentTotal / results.thresholdAmount) * 100)}%</span>
                <span>{formatNumber(results.thresholdAmount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              {t('vat-threshold.referenceInfo')}
            </h3>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('vat-threshold.includedInTurnover')}:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('vat-threshold.included1')}</li>
                  <li>{t('vat-threshold.included2')}</li>
                  <li>{t('vat-threshold.included3')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('vat-threshold.notIncludedInTurnover')}:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('vat-threshold.notIncluded1')}</li>
                  <li>{t('vat-threshold.notIncluded2')}</li>
                  <li>{t('vat-threshold.notIncluded3')}</li>
                  <li>{t('vat-threshold.notIncluded4')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">{t('vat-threshold.afterExceedance')}:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t('vat-threshold.after1')}</li>
                  <li>{t('vat-threshold.after2')}</li>
                  <li>{t('vat-threshold.after3')}</li>
                  <li>{t('vat-threshold.after4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {(() => {
            const shareData = getShareData();
            return (
              <SharePrintButtons
                title={shareData.title}
                description={shareData.description}
                results={shareData.results}
                filename="vat-threshold-tracking"
                disabled={results.currentTotal === 0}
              />
            );
          })()}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('vat-threshold.summaryTitle')}</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('vat-threshold.period')}:</span>
                <span className="font-medium">{t('vat-threshold.periodValue', { year: calculationYear })}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t('vat-threshold.threshold')}:</span>
                <span className="font-medium">{formatNumber(results.thresholdAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">{t('vat-threshold.currentTurnover')}:</span>
                <span className="font-medium">{formatNumber(results.currentTotal)}</span>
              </div>

              <hr className="border-gray-200" />

              {results.isExceeded ? (
                <div className="text-red-700 space-y-2">
                  <div className="flex justify-between">
                    <span>{t('vat-threshold.status')}:</span>
                    <span className="font-semibold">{t('vat-threshold.statusExceeded')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('vat-threshold.exceedanceMonth')}:</span>
                    <span className="font-semibold">{results.exceedanceMonthName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('vat-threshold.exceedance')}:</span>
                    <span className="font-semibold">{formatNumber(results.excessAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-green-700 space-y-2">
                  <div className="flex justify-between">
                    <span>{t('vat-threshold.status')}:</span>
                    <span className="font-semibold">{t('vat-threshold.statusWithinNormal')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('vat-threshold.remaining')}:</span>
                    <span className="font-semibold">{formatNumber(results.remainingToThreshold)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      {results && results.totalTurnover > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Оборот', value: results.totalTurnover },
              { name: 'До порога', value: Math.max(0, results.remaining) },
            ]}
            title="Прогресс к порогу НДС"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalTurnover > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт порога НДС',
              subtitle: results.isExceeded ? 'Порог превышен' : 'Порог не превышен',
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Общий оборот', value: `${results.totalTurnover.toLocaleString()} ₸` },
                    { label: 'Порог НДС', value: `${results.threshold.toLocaleString()} ₸` },
                    { label: 'До порога', value: `${results.remaining.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="vat-threshold-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('vat-threshold.faq.q1'), answer: t('vat-threshold.faq.a1') },
          { question: t('vat-threshold.faq.q2'), answer: t('vat-threshold.faq.a2') },
          { question: t('vat-threshold.faq.q3'), answer: t('vat-threshold.faq.a3') },
          { question: t('vat-threshold.faq.q4'), answer: t('vat-threshold.faq.a4') },
          { question: t('vat-threshold.faq.q5'), answer: t('vat-threshold.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК — НДС', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'КГД — НДС', url: 'https://kgd.gov.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="vat-threshold"
        calculatorTitle="Калькулятор порога НДС"
      />
    </div>
  );
}
