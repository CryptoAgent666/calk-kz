import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Calculator, BarChart3, Info, Calendar } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { QuickAnswer } from '../ui/QuickAnswer';

// Cumulative CPI index (base: 2015 = 100)
const CPI_DATA: Record<number, number> = {
  2015: 100.0,
  2016: 114.6,
  2017: 122.8,
  2018: 130.8,
  2019: 137.8,
  2020: 147.2,
  2021: 159.5,
  2022: 185.7,
  2023: 213.5,
  2024: 231.7,
  2025: 252.6,
  2026: 281.9
};

// MRP values by year (tenge)
const MRP_DATA: Record<number, string> = {
  2015: '1 982',
  2016: '2 121',
  2017: '2 269',
  2018: '2 405',
  2019: '2 525',
  2020: '2 651',
  2021: '2 917',
  2022: '3 063 / 3 180',
  2023: '3 450',
  2024: '3 692',
  2025: '3 932',
  2026: '4 325'
};

const YEARS = Object.keys(CPI_DATA).map(Number);
const MIN_YEAR = YEARS[0];
const MAX_YEAR = YEARS[YEARS.length - 1];

export default function InflationCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const locale = i18n.language === 'kk' ? 'kk-KZ' : 'ru-KZ';

  const [amount, setAmount] = useState<number>(100000);
  const [yearFrom, setYearFrom] = useState<number>(2015);
  const [yearTo, setYearTo] = useState<number>(2026);
  const [showMrpTable, setShowMrpTable] = useState<boolean>(false);

  const [results, setResults] = useState({
    adjustedAmount: 0,
    purchasingPowerLoss: 0,
    averageAnnualInflation: 0,
    cpiRatio: 0
  });

  const formatCurrency = (value: number) => {
    return value.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' \u20B8';
  };

  const formatPercent = (value: number, digits = 1) => {
    return value.toLocaleString(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }) + '%';
  };

  useEffect(() => {
    if (amount <= 0 || yearFrom === yearTo) {
      setResults({
        adjustedAmount: amount,
        purchasingPowerLoss: 0,
        averageAnnualInflation: 0,
        cpiRatio: 1
      });
      return;
    }

    const cpiSource = CPI_DATA[yearFrom];
    const cpiTarget = CPI_DATA[yearTo];

    if (!cpiSource || !cpiTarget) return;

    const cpiRatio = cpiTarget / cpiSource;
    const adjustedAmount = amount * cpiRatio;

    // Purchasing power loss (how much value was lost)
    const purchasingPowerLoss = yearTo > yearFrom
      ? (1 - cpiSource / cpiTarget) * 100
      : (cpiSource / cpiTarget - 1) * 100;

    // Average annual inflation between years
    const yearDiff = Math.abs(yearTo - yearFrom);
    const averageAnnualInflation = yearDiff > 0
      ? (Math.pow(cpiRatio, 1 / yearDiff) - 1) * 100
      : 0;

    setResults({
      adjustedAmount: Math.round(adjustedAmount),
      purchasingPowerLoss: Math.abs(purchasingPowerLoss),
      averageAnnualInflation: Math.abs(averageAnnualInflation),
      cpiRatio
    });
  }, [amount, yearFrom, yearTo]);

  const erosionPercent = Math.min(results.purchasingPowerLoss, 100);
  const isForward = yearTo > yearFrom;

  const generateExportData = () => ({
    title: t('inflation.title'),
    subtitle: `${yearFrom} \u2192 ${yearTo}`,
    sections: [
      {
        title: t('inflation.export.inputTitle'),
        data: [
          { label: t('inflation.amount'), value: formatCurrency(amount) },
          { label: t('inflation.yearFrom'), value: String(yearFrom) },
          { label: t('inflation.yearTo'), value: String(yearTo) }
        ]
      },
      {
        title: t('inflation.export.resultTitle'),
        data: [
          { label: t('inflation.result.equivalentAmount'), value: formatCurrency(results.adjustedAmount) },
          { label: t('inflation.result.purchasingPowerLoss'), value: formatPercent(results.purchasingPowerLoss) },
          { label: t('inflation.result.averageAnnualInflation'), value: formatPercent(results.averageAnnualInflation) },
          { label: t('inflation.result.cpiRatio'), value: results.cpiRatio.toFixed(3) }
        ]
      }
    ],
    footer: t('inflation.export.footer')
  });

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="inflation" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inflation.title')}</h1>
            <p className="text-gray-600">{t('inflation.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {t('inflation.warning')}
        </p>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Inputs */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-gray-500" />
              <span>{t('inflation.inputTitle')}</span>
            </h2>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inflation.amount')}
              </label>
              <RangeSlider
                value={amount}
                onChange={setAmount}
                min={10000}
                max={10000000}
                step={10000}
                formatValue={(v) => formatCurrency(v)}
                color="#ef4444"
              />
            </div>

            {/* Year From */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inflation.yearFrom')}
              </label>
              <select
                value={yearFrom}
                onChange={(e) => setYearFrom(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Year To */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('inflation.yearTo')}
              </label>
              <select
                value={yearTo}
                onChange={(e) => setYearTo(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Info block */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p>{t('inflation.infoBlock')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <span>{t('inflation.resultTitle')}</span>
            </h2>

            {/* Equivalent amount */}
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
              <p className="text-sm text-gray-600 mb-1">{t('inflation.result.equivalentAmount')}</p>
              <p className="text-3xl font-bold text-red-700">{formatCurrency(results.adjustedAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('inflation.result.equivalentDescription', { yearFrom, yearTo })}
              </p>
            </div>

            {/* Loss percent */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600">
                  {isForward
                    ? t('inflation.result.purchasingPowerLoss')
                    : t('inflation.result.purchasingPowerGain')}
                </p>
                <p className="text-xl font-bold text-red-600">{formatPercent(results.purchasingPowerLoss)}</p>
              </div>

              {/* Erosion bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
                  style={{ width: `${erosionPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Average annual inflation */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">{t('inflation.result.averageAnnualInflation')}</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatPercent(results.averageAnnualInflation)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('inflation.result.averageAnnualDescription', {
                  years: Math.abs(yearTo - yearFrom)
                })}
              </p>
            </div>

            {/* CPI ratio */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">{t('inflation.result.cpiRatio')}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {results.cpiRatio.toFixed(3)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('inflation.result.cpiRatioDescription', { yearFrom, yearTo })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MRP Reference Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
        <button
          onClick={() => setShowMrpTable(!showMrpTable)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900">
              {t('inflation.mrpTable.title')}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showMrpTable ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMrpTable && (
          <div className="px-6 pb-6">
            <p className="text-sm text-gray-500 mb-4">{t('inflation.mrpTable.description')}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-600">{t('inflation.mrpTable.year')}</th>
                    <th className="text-right py-2 pr-4 font-medium text-gray-600">{t('inflation.mrpTable.mrp')}</th>
                    <th className="text-right py-2 font-medium text-gray-600">{t('inflation.mrpTable.cpi')}</th>
                  </tr>
                </thead>
                <tbody>
                  {YEARS.map((year) => (
                    <tr key={year} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-900">{year}</td>
                      <td className="py-2 pr-4 text-right text-gray-700">{MRP_DATA[year]} \u20B8</td>
                      <td className="py-2 text-right text-gray-700">{CPI_DATA[year].toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename="inflation-calculation"
        />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="inflation" />
      <MethodologySection steps={getMethodology('inflation')} />
      <FAQSection
        items={[
          { question: t('inflation.faq.q1'), answer: t('inflation.faq.a1') },
          { question: t('inflation.faq.q2'), answer: t('inflation.faq.a2') },
          { question: t('inflation.faq.q3'), answer: t('inflation.faq.a3') },
          { question: t('inflation.faq.q4'), answer: t('inflation.faq.a4') },
          { question: t('inflation.faq.q5'), answer: t('inflation.faq.a5') }
        ]}
        sources={[
          { title: 'stat.gov.kz', url: 'https://stat.gov.kz/' },
          { title: 'nationalbank.kz', url: 'https://nationalbank.kz/' }
        ]}
      />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="inflation"
        calculatorTitle={t('inflation.title')}
      />
      <LastUpdated calculatorId="inflation" />
    </div>
  );
}
