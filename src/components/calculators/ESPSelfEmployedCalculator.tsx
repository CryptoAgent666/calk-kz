import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, Calculator, Info, AlertTriangle, PieChart } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

export default function ESPSelfEmployedCalculator() {
  const { t } = useTranslation('calculators');

  // Константы на 2026 год
  const MRP = 4325;
  const MZP = 85000;
  const ESP_CATEGORY_A = 1 * MRP; // 4 325 тг/мес — услуги физлицам
  const ESP_CATEGORY_B = 2 * MRP; // 8 650 тг/мес — услуги юрлицам/ИП
  const INCOME_LIMIT = 1175 * MRP; // 5 081 875 тг/год

  // Распределение ЕСП по фондам
  const IPN_SHARE = 0.10;
  const SO_SHARE = 0.181;
  const VOSMS_SHARE = 0.333;
  const OPV_SHARE = 0.386;

  // State
  const [espCategory, setEspCategory] = useState<'individual' | 'business'>('individual');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('150000');
  const [activeMonths, setActiveMonths] = useState<number>(12);

  const [results, setResults] = useState({
    espMonthly: 0,
    espYearly: 0,
    ipnPart: 0,
    soPart: 0,
    vosmsPart: 0,
    opvPart: 0,
    yearlyPensionAccumulation: 0,
    incomeLimit: 0,
    yearlyIncome: 0,
    isWithinLimit: true,
    effectiveRate: 0,
    comparisonIPSimplified: 0
  });

  const calculateESP = () => {
    const espMonthly = espCategory === 'individual' ? ESP_CATEGORY_A : ESP_CATEGORY_B;
    const espYearly = espMonthly * activeMonths;

    // Распределение ЕСП по фондам
    const ipnPart = Math.round(espMonthly * IPN_SHARE);
    const soPart = Math.round(espMonthly * SO_SHARE);
    const vosmsPart = Math.round(espMonthly * VOSMS_SHARE);
    const opvPart = Math.round(espMonthly * OPV_SHARE);

    const yearlyPensionAccumulation = opvPart * activeMonths;
    const income = parseFloat(monthlyIncome) || 0;
    const yearlyIncome = income * activeMonths;
    const isWithinLimit = yearlyIncome <= INCOME_LIMIT;
    const effectiveRate = yearlyIncome > 0 ? (espYearly / yearlyIncome) * 100 : 0;

    // Сравнение: сколько бы стоил ИП на упрощёнке при таком же доходе
    const comparisonIPSimplified = yearlyIncome * 0.04
      + (MZP * 0.10 + MZP * 0.035 + MZP * 0.05 + 5950) * activeMonths;

    setResults({
      espMonthly,
      espYearly,
      ipnPart,
      soPart,
      vosmsPart,
      opvPart,
      yearlyPensionAccumulation,
      incomeLimit: INCOME_LIMIT,
      yearlyIncome,
      isWithinLimit,
      effectiveRate: Number(effectiveRate.toFixed(2)),
      comparisonIPSimplified: Math.round(comparisonIPSimplified)
    });
  };

  useEffect(() => {
    calculateESP();
  }, [espCategory, monthlyIncome, activeMonths]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const savings = results.comparisonIPSimplified - results.espYearly;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('esp-self-employed.title')}</h1>
            <p className="text-gray-600">{t('esp-self-employed.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Input Section (col-span-2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Категория ЕСП */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('esp-self-employed.categoryTitle')}</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setEspCategory('individual')}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  espCategory === 'individual'
                    ? 'border-cyan-500 bg-cyan-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50'
                }`}
              >
                {espCategory === 'individual' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="text-lg font-bold text-gray-900 mb-1">{t('esp-self-employed.categoryA')}</div>
                <div className="text-sm text-gray-600 mb-2">{t('esp-self-employed.categoryADescription')}</div>
                <div className="text-xl font-bold text-cyan-600">
                  {formatNumber(ESP_CATEGORY_A)}<span className="text-sm font-normal text-gray-500">/{t('esp-self-employed.perMonth')}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">1 {t('esp-self-employed.mrp')}</div>
              </button>

              <button
                onClick={() => setEspCategory('business')}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  espCategory === 'business'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                {espCategory === 'business' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="text-lg font-bold text-gray-900 mb-1">{t('esp-self-employed.categoryB')}</div>
                <div className="text-sm text-gray-600 mb-2">{t('esp-self-employed.categoryBDescription')}</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatNumber(ESP_CATEGORY_B)}<span className="text-sm font-normal text-gray-500">/{t('esp-self-employed.perMonth')}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">2 {t('esp-self-employed.mrp')}</div>
              </button>
            </div>

            {/* Ежемесячный доход */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('esp-self-employed.monthlyIncome')}
                </label>
                <RangeSlider
                  value={parseFloat(monthlyIncome) || 0}
                  onChange={(val) => setMonthlyIncome(String(val))}
                  min={10000}
                  max={500000}
                  step={10000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#06b6d4"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="monthlyIncome"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder={t('esp-self-employed.monthlyIncomePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>

              {/* Количество активных месяцев */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('esp-self-employed.activeMonths')}
                  </label>
                  <span className="text-sm font-semibold text-cyan-600">
                    {activeMonths} {t('esp-self-employed.months')}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={activeMonths}
                  onChange={(e) => setActiveMonths(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((activeMonths - 1) / 11) * 100}%, #e5e7eb ${((activeMonths - 1) / 11) * 100}%, #e5e7eb 100%)`,
                    accentColor: '#06b6d4'
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">1 {t('esp-self-employed.month')}</span>
                  <span className="text-xs text-gray-500">12 {t('esp-self-employed.monthsShort')}</span>
                </div>
              </div>
            </div>

            {/* Предупреждение о превышении лимита */}
            {!results.isWithinLimit && (
              <div className="mt-6 bg-red-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-900 mb-1">
                      {t('esp-self-employed.incomeLimitWarningTitle')}
                    </h3>
                    <p className="text-red-800 text-sm">
                      {t('esp-self-employed.incomeLimitWarningText', {
                        income: formatNumber(results.yearlyIncome),
                        limit: formatNumber(INCOME_LIMIT)
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Информация о допустимых видах деятельности */}
            <div className="mt-6 bg-cyan-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-cyan-900 mb-1">
                    {t('esp-self-employed.eligibleActivitiesTitle')}
                  </h3>
                  <p className="text-cyan-800 text-sm">
                    {t('esp-self-employed.eligibleActivitiesText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results Section (col-span-1, sticky) */}
        <div className="space-y-8 lg:sticky lg:top-8 lg:self-start">
          {/* Основная карточка с результатом */}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5" />
              <h2 className="text-lg font-semibold">{t('esp-self-employed.espPayment')}</h2>
            </div>

            <div className="text-center mb-4">
              <div className="text-sm opacity-80">{t('esp-self-employed.monthly')}</div>
              <div className="text-4xl font-bold my-2">{formatNumber(results.espMonthly)}</div>
            </div>

            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-80">{t('esp-self-employed.yearlyTotal')}</span>
                <span className="text-xl font-bold">{formatNumber(results.espYearly)}</span>
              </div>
              <div className="text-xs opacity-60 text-right mt-1">
                {activeMonths} {t('esp-self-employed.months')}
              </div>
            </div>
          </div>

          {/* Распределение ЕСП */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">{t('esp-self-employed.distributionTitle')}</h2>
            </div>

            <div className="space-y-4">
              {/* ОПВ: 38.6% */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{t('esp-self-employed.opv')}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(results.opvPart)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: '38.6%', backgroundColor: '#0ea5e9' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">38.6%</div>
              </div>

              {/* ВОСМС: 33.3% */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{t('esp-self-employed.vosms')}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(results.vosmsPart)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: '33.3%', backgroundColor: '#22c55e' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">33.3%</div>
              </div>

              {/* СО: 18.1% */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{t('esp-self-employed.so')}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(results.soPart)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: '18.1%', backgroundColor: '#f97316' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">18.1%</div>
              </div>

              {/* ИПН: 10% */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{t('esp-self-employed.ipn')}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(results.ipnPart)}</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: '10%', backgroundColor: '#eab308' }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">10%</div>
              </div>
            </div>

            {/* Эффективная ставка */}
            {results.yearlyIncome > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-sm text-gray-600">{t('esp-self-employed.effectiveRate')}</div>
                  <div className="text-2xl font-bold text-cyan-600">{results.effectiveRate}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Пенсионные накопления */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('esp-self-employed.pensionTitle')}</h2>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{t('esp-self-employed.yearlyPensionAccumulation')}</span>
              <span className="text-lg font-bold text-blue-600">{formatNumber(results.yearlyPensionAccumulation)}</span>
            </div>
          </div>

          {/* Сравнение с ИП на упрощёнке */}
          {results.yearlyIncome > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('esp-self-employed.comparisonTitle')}</h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('esp-self-employed.espRegime')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.espYearly)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">{t('esp-self-employed.ipSimplified')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.comparisonIPSimplified)}</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3">
                    <span className="font-semibold text-green-900">{t('esp-self-employed.savings')}</span>
                    <span className="text-lg font-bold text-green-700">{formatNumber(savings)}</span>
                  </div>
                )}

                {savings <= 0 && (
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg px-3">
                    <span className="font-semibold text-orange-900">{t('esp-self-employed.overpay')}</span>
                    <span className="text-lg font-bold text-orange-700">{formatNumber(Math.abs(savings))}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('esp-self-employed.importantInfo')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="mb-2">
                  <strong>{t('esp-self-employed.whatIsESP')}:</strong> {t('esp-self-employed.whatIsESPDescription')}
                </p>
                <p className="mb-2">
                  <strong>{t('esp-self-employed.whoCanUse')}:</strong> {t('esp-self-employed.whoCanUseDescription')}
                </p>
                <p className="mb-2">
                  <strong>{t('esp-self-employed.incomeLimitLabel')}:</strong> {t('esp-self-employed.incomeLimitDescription', { limit: formatNumber(INCOME_LIMIT) })}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>{t('esp-self-employed.paymentDeadline')}:</strong> {t('esp-self-employed.paymentDeadlineDescription')}
                </p>
                <p className="mb-2">
                  <strong>{t('esp-self-employed.registrationLabel')}:</strong> {t('esp-self-employed.registrationDescription')}
                </p>
                <p>
                  <strong>{t('esp-self-employed.advantageLabel')}:</strong> {t('esp-self-employed.advantageDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма распределения ЕСП и экспорт */}
      {results.espMonthly > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: t('esp-self-employed.opv'), value: results.opvPart },
              { name: t('esp-self-employed.vosms'), value: results.vosmsPart },
              { name: t('esp-self-employed.so'), value: results.soPart },
              { name: t('esp-self-employed.ipn'), value: results.ipnPart },
            ].filter(item => item.value > 0)}
            title={t('esp-self-employed.chartTitle')}
          />
          <ExportButtons
            data={{
              title: t('esp-self-employed.title'),
              subtitle: `${t('esp-self-employed.espPayment')}: ${formatNumber(results.espMonthly)}`,
              sections: [
                {
                  title: t('esp-self-employed.inputParameters'),
                  data: [
                    { label: t('esp-self-employed.categoryLabel'), value: espCategory === 'individual' ? t('esp-self-employed.categoryA') : t('esp-self-employed.categoryB') },
                    { label: t('esp-self-employed.monthlyIncome'), value: `${(parseFloat(monthlyIncome) || 0).toLocaleString()} ₸` },
                    { label: t('esp-self-employed.activeMonths'), value: `${activeMonths}` },
                  ]
                },
                {
                  title: t('esp-self-employed.resultsTitle'),
                  data: [
                    { label: t('esp-self-employed.espMonthlyLabel'), value: `${results.espMonthly.toLocaleString()} ₸` },
                    { label: t('esp-self-employed.espYearlyLabel'), value: `${results.espYearly.toLocaleString()} ₸` },
                    { label: t('esp-self-employed.opv'), value: `${results.opvPart.toLocaleString()} ₸` },
                    { label: t('esp-self-employed.vosms'), value: `${results.vosmsPart.toLocaleString()} ₸` },
                    { label: t('esp-self-employed.so'), value: `${results.soPart.toLocaleString()} ₸` },
                    { label: t('esp-self-employed.ipn'), value: `${results.ipnPart.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'calk.kz'
            }}
            filename="esp-self-employed-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('esp-self-employed.faq.q1'), answer: t('esp-self-employed.faq.a1') },
          { question: t('esp-self-employed.faq.q2'), answer: t('esp-self-employed.faq.a2') },
          { question: t('esp-self-employed.faq.q3'), answer: t('esp-self-employed.faq.a3') },
          { question: t('esp-self-employed.faq.q4'), answer: t('esp-self-employed.faq.a4') },
          { question: t('esp-self-employed.faq.q5'), answer: t('esp-self-employed.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК — ЕСП', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'Egov.kz — Самозанятые', url: 'https://egov.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="esp-self-employed"
        calculatorTitle={t('esp-self-employed.title')}
      />
    </div>
  );
}
