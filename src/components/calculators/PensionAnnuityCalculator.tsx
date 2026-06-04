import React, { useState, useEffect } from 'react';
import { Shield, Calculator, Users, DollarSign, TrendingUp, Info, AlertTriangle, Clock, Target, Heart, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart, TrendLineChart, ComparisonBarChart } from '../ui/ChartComponents';
import { ScenarioComparison } from '../ui/ScenarioComparison';
import { pluralize } from '../../utils/pluralize';

export default function PensionAnnuityCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<string>('55');
  const [currentAccumulations, setCurrentAccumulations] = useState<string>('5000000');
  const [insuranceCompany, setInsuranceCompany] = useState<string>('halyk-life');

  const [results, setResults] = useState({
    // Базовые показатели
    sufficientAmount: 0,
    isSufficientForAnnuity: false,
    shortfall: 0,

    // Аннуитетные расчеты
    monthlyAnnuityPayment: 0,
    lifeExpectancy: 0,
    totalPayoutsLifetime: 0,

    // Сравнение с ЕНПФ
    enpfMonthlyPayment: 0,
    enpfPayoutPeriod: 19,
    enpfTotalPayouts: 0,

    // Анализ эффективности
    annuityAdvantage: 0,
    isAnnuityBetter: false,
    breakEvenAge: 0,

    // Дополнительная информация
    retirementAge: 0,
    annuityFactor: 0
  });

  // Константы на 2026 год
  const MRP_2026 = 4325;
  const SUFFICIENT_AMOUNT_MRP = 656; // 656 МРП для аннуитета
  const SUFFICIENT_AMOUNT_KZT = SUFFICIENT_AMOUNT_MRP * MRP_2026; // 2,583,392 тенге
  const CURRENT_YEAR = 2026;

  // Пенсионный возраст по гендеру (РК 2026)
  // Мужчины: 63 (с 2023)
  // Женщины: поэтапное повышение до 63 (в 2026 — 61 год)
  const getRetirementAge = (_birthYear: number, gender: 'male' | 'female') => {
    if (gender === 'male') {
      return 63;
    } else {
      return 61; // 2026 год — переходный период
    }
  };

  // Ожидаемая продолжительность жизни (актуарные данные для Казахстана)
  const getLifeExpectancy = (currentAge: number, gender: 'male' | 'female') => {
    const baseLifeExpectancy = gender === 'male' ? 69.5 : 77.2; // Средние показатели для РК

    // Корректировка для пенсионного возраста
    if (currentAge >= 55) {
      return gender === 'male' ?
        Math.max(75, baseLifeExpectancy + (65 - currentAge) * 0.3) :
        Math.max(82, baseLifeExpectancy + (60 - currentAge) * 0.2);
    }

    return baseLifeExpectancy;
  };

  // Аннуитетный фактор (упрощенный расчет)
  const calculateAnnuityFactor = (currentAge: number, gender: 'male' | 'female') => {
    const lifeExpectancy = getLifeExpectancy(currentAge, gender);
    const remainingYears = Math.max(1, lifeExpectancy - currentAge);
    const monthsRemaining = remainingYears * 12;

    // Учитываем дисконтирование (примерно 3% годовых)
    const discountRate = 0.03 / 12; // Месячная ставка

    // Формула приведенной стоимости аннуитета
    return (1 - Math.pow(1 + discountRate, -monthsRemaining)) / discountRate;
  };

  // Страховые компании-участники
  const insuranceCompanies = [
    {
      id: 'halyk-life',
      name: t('pension-annuity.companies.halykLife.name'),
      description: t('pension-annuity.companies.halykLife.description'),
      annuityRate: 0.95, // 95% от расчетного аннуитета
      features: [
        t('pension-annuity.companies.halykLife.features.0'),
        t('pension-annuity.companies.halykLife.features.1'),
        t('pension-annuity.companies.halykLife.features.2')
      ]
    },
    {
      id: 'nomad-life',
      name: t('pension-annuity.companies.nomadLife.name'),
      description: t('pension-annuity.companies.nomadLife.description'),
      annuityRate: 0.98, // 98% от расчетного аннуитета
      features: [
        t('pension-annuity.companies.nomadLife.features.0'),
        t('pension-annuity.companies.nomadLife.features.1'),
        t('pension-annuity.companies.nomadLife.features.2')
      ]
    },
    {
      id: 'kazkommerts-life',
      name: t('pension-annuity.companies.kazkommertsLife.name'),
      description: t('pension-annuity.companies.kazkommertsLife.description'),
      annuityRate: 0.92, // 92% от расчетного аннуитета
      features: [
        t('pension-annuity.companies.kazkommertsLife.features.0'),
        t('pension-annuity.companies.kazkommertsLife.features.1'),
        t('pension-annuity.companies.kazkommertsLife.features.2')
      ]
    }
  ];

  const calculatePensionAnnuity = () => {
    const currentAge = parseInt(age) || 0;
    const accumulations = parseFloat(currentAccumulations) || 0;

    if (currentAge === 0 || accumulations === 0) {
      setResults({
        sufficientAmount: SUFFICIENT_AMOUNT_KZT,
        isSufficientForAnnuity: false,
        shortfall: 0,
        monthlyAnnuityPayment: 0,
        lifeExpectancy: 0,
        totalPayoutsLifetime: 0,
        enpfMonthlyPayment: 0,
        enpfPayoutPeriod: 19,
        enpfTotalPayouts: 0,
        annuityAdvantage: 0,
        isAnnuityBetter: false,
        breakEvenAge: 0,
        retirementAge: 0,
        annuityFactor: 0
      });
      return;
    }

    // Определение пенсионного возраста
    const birthYear = CURRENT_YEAR - currentAge;
    const retirementAge = getRetirementAge(birthYear, gender);

    // Проверка достаточности накоплений
    const isSufficientForAnnuity = accumulations >= SUFFICIENT_AMOUNT_KZT;
    const shortfall = Math.max(0, SUFFICIENT_AMOUNT_KZT - accumulations);

    // Ожидаемая продолжительность жизни
    const lifeExpectancy = getLifeExpectancy(currentAge, gender);

    // Расчет аннуитетного фактора
    const annuityFactor = calculateAnnuityFactor(currentAge, gender);

    // Выбранная страховая компания
    const selectedCompany = insuranceCompanies.find(c => c.id === insuranceCompany);
    const companyRate = selectedCompany?.annuityRate || 0.95;

    // Расчет ежемесячного аннуитетного платежа
    let monthlyAnnuityPayment = 0;
    if (isSufficientForAnnuity && annuityFactor > 0) {
      monthlyAnnuityPayment = (accumulations / annuityFactor) * companyRate;
    }

    // Общие выплаты за всю жизнь (теоретические)
    const remainingLifeMonths = Math.max(0, (lifeExpectancy - currentAge) * 12);
    const totalPayoutsLifetime = monthlyAnnuityPayment * remainingLifeMonths;

    // Сравнение с ЕНПФ (стандартная выплата в течение 19 лет)
    const enpfPayoutPeriod = 19; // лет
    const enpfMonthlyPayment = accumulations / (enpfPayoutPeriod * 12);
    const enpfTotalPayouts = enpfMonthlyPayment * enpfPayoutPeriod * 12;

    // Анализ эффективности
    const annuityAdvantage = totalPayoutsLifetime - enpfTotalPayouts;
    const isAnnuityBetter = annuityAdvantage > 0;

    // Точка безубыточности (когда аннуитет станет выгоднее)
    const breakEvenAge = currentAge + enpfPayoutPeriod;

    setResults({
      sufficientAmount: SUFFICIENT_AMOUNT_KZT,
      isSufficientForAnnuity,
      shortfall: Math.round(shortfall),
      monthlyAnnuityPayment: Math.round(monthlyAnnuityPayment),
      lifeExpectancy: Number(lifeExpectancy.toFixed(1)),
      totalPayoutsLifetime: Math.round(totalPayoutsLifetime),
      enpfMonthlyPayment: Math.round(enpfMonthlyPayment),
      enpfPayoutPeriod,
      enpfTotalPayouts: Math.round(enpfTotalPayouts),
      annuityAdvantage: Math.round(annuityAdvantage),
      isAnnuityBetter,
      breakEvenAge: Math.round(breakEvenAge),
      retirementAge,
      annuityFactor: Number(annuityFactor.toFixed(2))
    });
  };

  useEffect(() => {
    calculatePensionAnnuity();
  }, [gender, age, currentAccumulations, insuranceCompany]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount.toLocaleString()} ${t('pension-annuity.mrp')} (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  const selectedCompany = insuranceCompanies.find(c => c.id === insuranceCompany);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('pension-annuity.title')}</h1>
            <p className="text-gray-600">{t('pension-annuity.description')}</p>
          </div>
        </div>
      </div>

      {/* Important Warning */}
      <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              {t('pension-annuity.warning.title')}
            </h3>
            <div className="text-amber-800 space-y-2">
              <p>
                {t('pension-annuity.warning.paragraph1')}
              </p>
              <p>
                {t('pension-annuity.warning.paragraph2')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="pension-annuity" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.inputs.title')}</h2>

          <div className="space-y-6">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('pension-annuity.inputs.gender.label')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGender('male')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Users className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">{t('pension-annuity.inputs.gender.male')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('pension-annuity.inputs.gender.pensionFrom')} 63 {t('pension-annuity.inputs.gender.years')}</div>
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Heart className="w-5 h-5 mx-auto mb-2" />
                  <div className="font-medium">{t('pension-annuity.inputs.gender.female')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('pension-annuity.inputs.gender.pensionFrom')} 61 {t('pension-annuity.inputs.gender.years')}</div>
                </button>
              </div>
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension-annuity.inputs.age.label')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t('pension-annuity.inputs.age.placeholder')}
                  min="45"
                  max="70"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('pension-annuity.inputs.age.years')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('pension-annuity.inputs.age.hint')}
              </p>
            </div>

            {/* Current Accumulations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension-annuity.inputs.accumulations.label')}
              </label>
              <RangeSlider
                value={parseFloat(currentAccumulations) || 0}
                onChange={(val) => setCurrentAccumulations(String(val))}
                min={1000000}
                max={50000000}
                step={500000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="currentAccumulations"
                  value={currentAccumulations}
                  onChange={(e) => setCurrentAccumulations(e.target.value)}
                  placeholder={t('pension-annuity.inputs.accumulations.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Insurance Company */}
            <div>
              <label htmlFor="insuranceCompany" className="block text-sm font-medium text-gray-700 mb-2">
                {t('pension-annuity.inputs.insuranceCompany.label')}
              </label>
              <select
                id="insuranceCompany"
                value={insuranceCompany}
                onChange={(e) => setInsuranceCompany(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {insuranceCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {selectedCompany && (
                <div className="mt-2 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">{selectedCompany.description}</p>
                  <div className="text-xs text-blue-700 mt-1 space-y-1">
                    {selectedCompany.features.map((feature, index) => (
                      <div key={index}>• {feature}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                {t('pension-annuity.inputs.sufficientAmount.label')}
              </h3>
              <div className="text-blue-800">
                <strong>{formatMRP(SUFFICIENT_AMOUNT_MRP)}</strong>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {t('pension-annuity.inputs.sufficientAmount.hint')}
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.results.title')}</h2>

          <div className="space-y-6">
            {/* Eligibility Status */}
            <div className={`bg-gradient-to-r rounded-lg p-4 sm:p-6 border-2 min-w-0 ${
              results.isSufficientForAnnuity
                ? 'from-green-50 to-emerald-50 border-green-300'
                : 'from-red-50 to-pink-50 border-red-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                <span className="text-lg font-semibold text-gray-900">
                  {t('pension-annuity.results.eligibility.label')}
                </span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {results.isSufficientForAnnuity ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                  <span className={`text-2xl font-bold ${
                    results.isSufficientForAnnuity ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results.isSufficientForAnnuity ? t('pension-annuity.results.eligibility.available') : t('pension-annuity.results.eligibility.unavailable')}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 break-words">
                {results.isSufficientForAnnuity
                  ? t('pension-annuity.results.eligibility.sufficientMessage')
                  : t('pension-annuity.results.eligibility.insufficientMessage', { amount: formatNumber(results.shortfall) })
                }
              </div>
            </div>

            {/* Current Status */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('pension-annuity.results.yourAccumulations')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(parseFloat(currentAccumulations) || 0)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('pension-annuity.results.sufficientAmount')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.sufficientAmount)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('pension-annuity.results.lifeExpectancy')}</span>
                <span className="font-semibold text-gray-900">{results.lifeExpectancy} {t('pension-annuity.results.years')}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('pension-annuity.results.insuranceCompany')}</span>
                <span className="font-semibold text-gray-900">{selectedCompany?.name}</span>
              </div>
            </div>

            {/* Annuity Payments */}
            {results.isSufficientForAnnuity && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 sm:p-6 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                  <span className="text-lg font-semibold text-gray-900">{t('pension-annuity.results.monthlyPayment')}</span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Target className="w-6 h-6 text-blue-600" />
                    <span className="text-xl sm:text-2xl font-bold text-blue-700 break-all">{formatNumber(results.monthlyAnnuityPayment)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {t('pension-annuity.results.guaranteedPayment')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      {results.isSufficientForAnnuity && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6 break-words">{t('pension-annuity.comparison.title')}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Annuity Option */}
            <div className="border border-blue-200 rounded-lg p-4 sm:p-6 bg-blue-50 min-w-0">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>{t('pension-annuity.comparison.annuity.title')}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-sm text-blue-700">{t('pension-annuity.comparison.annuity.monthlyPayment')}</span>
                  <span className="font-semibold text-blue-900 break-all">{formatNumber(results.monthlyAnnuityPayment)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-sm text-blue-700">{t('pension-annuity.comparison.annuity.payoutPeriod')}</span>
                  <span className="font-semibold text-blue-900">{t('pension-annuity.comparison.annuity.lifetime')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-sm text-blue-700">{t('pension-annuity.comparison.annuity.totalPayouts')}</span>
                  <span className="font-semibold text-blue-900 break-all">{formatNumber(results.totalPayoutsLifetime)}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>{t('pension-annuity.comparison.annuity.pros.0')}</div>
                    <div>{t('pension-annuity.comparison.annuity.pros.1')}</div>
                    <div>{t('pension-annuity.comparison.annuity.pros.2')}</div>
                    <div>{t('pension-annuity.comparison.annuity.cons.0')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ENPF Option */}
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{t('pension-annuity.comparison.enpf.title')}</span>
              </h3>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-sm text-gray-600">{t('pension-annuity.comparison.enpf.monthlyPayment')}</span>
                  <span className="font-semibold text-gray-900 break-all">{formatNumber(results.enpfMonthlyPayment)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-sm text-gray-600">{t('pension-annuity.comparison.enpf.payoutPeriod')}</span>
                  <span className="font-semibold text-gray-900">{results.enpfPayoutPeriod} {t('pension-annuity.comparison.enpf.years')}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-sm text-gray-600">{t('pension-annuity.comparison.enpf.totalPayouts')}</span>
                  <span className="font-semibold text-gray-900 break-all">{formatNumber(results.enpfTotalPayouts)}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{t('pension-annuity.comparison.enpf.pros.0')}</div>
                    <div>{t('pension-annuity.comparison.enpf.pros.1')}</div>
                    <div>{t('pension-annuity.comparison.enpf.pros.2')}</div>
                    <div>{t('pension-annuity.comparison.enpf.cons.0')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advantage Analysis */}
          <div className="mt-6">
            <div className={`rounded-lg p-4 ${
              results.isAnnuityBetter
                ? 'bg-green-50 border border-green-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <div className="flex items-start space-x-2">
                <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  results.isAnnuityBetter ? 'text-green-600' : 'text-amber-600'
                }`} />
                <div>
                  <h3 className={`font-medium mb-1 ${
                    results.isAnnuityBetter ? 'text-green-900' : 'text-amber-900'
                  }`}>
                    {results.isAnnuityBetter ? t('pension-annuity.comparison.advantage.annuityBetter') : t('pension-annuity.comparison.advantage.enpfBetter')}
                  </h3>
                  <p className={`text-sm ${
                    results.isAnnuityBetter ? 'text-green-800' : 'text-amber-800'
                  }`}>
                    {results.isAnnuityBetter
                      ? t('pension-annuity.comparison.advantage.annuityBetterMessage', { amount: formatNumber(Math.abs(results.annuityAdvantage)) })
                      : t('pension-annuity.comparison.advantage.enpfBetterMessage', { amount: formatNumber(Math.abs(results.annuityAdvantage)), age: results.breakEvenAge })
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Companies Comparison */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.companiesComparison.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {insuranceCompanies.map((company) => (
            <div key={company.id} className={`border-2 rounded-lg p-4 transition-all ${
              insuranceCompany === company.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}>
              <h3 className="font-semibold text-gray-900 mb-2">{company.name}</h3>
              <p className="text-sm text-gray-600 mb-3 break-words">{company.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                {company.features.map((feature, index) => (
                  <div key={index} className="break-words">• {feature}</div>
                ))}
              </div>
              <div className="mt-3 text-sm font-semibold">
                {t('pension-annuity.companiesComparison.coefficient')}: {(company.annuityRate * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {t('pension-annuity.companiesComparison.coefficientExplanation')}
          </p>
        </div>
      </div>

      {/* Key Factors */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.keyFactors.title')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>{t('pension-annuity.keyFactors.forAnnuity.title')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forAnnuity.point1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forAnnuity.point2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forAnnuity.point3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forAnnuity.point4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>{t('pension-annuity.keyFactors.forEnpf.title')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forEnpf.point1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forEnpf.point2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forEnpf.point3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className="break-words">{t('pension-annuity.keyFactors.forEnpf.point4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.riskAnalysis.title')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3">{t('pension-annuity.riskAnalysis.annuityRisks.title')}</h3>
            <div className="space-y-1 text-sm text-red-800">
              <div>• {t('pension-annuity.riskAnalysis.annuityRisks.risk1')}</div>
              <div>• {t('pension-annuity.riskAnalysis.annuityRisks.risk2')}</div>
              <div>• {t('pension-annuity.riskAnalysis.annuityRisks.risk3')}</div>
              <div>• {t('pension-annuity.riskAnalysis.annuityRisks.risk4')}</div>
              <div>• {t('pension-annuity.riskAnalysis.annuityRisks.risk5')}</div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('pension-annuity.riskAnalysis.enpfRisks.title')}</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div>• {t('pension-annuity.riskAnalysis.enpfRisks.risk1')}</div>
              <div>• {t('pension-annuity.riskAnalysis.enpfRisks.risk2')}</div>
              <div>• {t('pension-annuity.riskAnalysis.enpfRisks.risk3')}</div>
              <div>• {t('pension-annuity.riskAnalysis.enpfRisks.risk4')}</div>
              <div>• {t('pension-annuity.riskAnalysis.enpfRisks.risk5')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('pension-annuity.riskAnalysis.recommendations.title')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>{t('pension-annuity.riskAnalysis.recommendations.point1')}</p>
                <p>{t('pension-annuity.riskAnalysis.recommendations.point2')}</p>
                <p>{t('pension-annuity.riskAnalysis.recommendations.point3')}</p>
                <p>{t('pension-annuity.riskAnalysis.recommendations.point4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health and Longevity Context */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.longevityContext.title')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('pension-annuity.longevityContext.men.title')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('pension-annuity.longevityContext.men.avgLife')}: <strong>69.5 {pluralize(i18n.language, 69.5, 'год', 'года', 'лет')}</strong></div>
              <div className="break-words">{t('pension-annuity.longevityContext.men.retirementAge')}: <strong>63 {pluralize(i18n.language, 63, 'год', 'года', 'лет')}</strong></div>
              <div className="break-words">{t('pension-annuity.longevityContext.men.avgPeriod')}: <strong>6-12 {t('pension-annuity.longevityContext.years')}</strong></div>
            </div>
          </div>

          <div className="text-center p-6 bg-pink-50 rounded-lg">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('pension-annuity.longevityContext.women.title')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('pension-annuity.longevityContext.women.avgLife')}: <strong>77.2 {pluralize(i18n.language, 77.2, 'год', 'года', 'лет')}</strong></div>
              <div className="break-words">{t('pension-annuity.longevityContext.women.retirementAge')}: <strong>61 {pluralize(i18n.language, 61, 'год', 'года', 'лет')}</strong></div>
              <div className="break-words">{t('pension-annuity.longevityContext.women.avgPeriod')}: <strong>14-19 {t('pension-annuity.longevityContext.years')}</strong></div>
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('pension-annuity.longevityContext.trends.title')}</h3>
            <div className="text-gray-600 text-sm space-y-1">
              <div>{t('pension-annuity.longevityContext.trends.growth')}: <strong>+0.3 {t('pension-annuity.longevityContext.trends.yearPerYear')}</strong></div>
              <div className="break-words">{t('pension-annuity.longevityContext.trends.medicineImprovement')}</div>
              <div className="break-words">{t('pension-annuity.longevityContext.trends.healthyLifestyle')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('pension-annuity.longevityContext.personalApproach.title')}
              </h3>
              <p className="text-blue-800 text-sm break-words">
                {t('pension-annuity.longevityContext.personalApproach.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Framework */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('pension-annuity.decisionFramework.title')}</h2>

        <div className="space-y-4">
          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('pension-annuity.decisionFramework.step1.title')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-1">{t('pension-annuity.decisionFramework.step1.chooseAnnuity.title')}</h4>
                <ul className="space-y-1 list-disc list-inside break-words">
                  <li>{t('pension-annuity.decisionFramework.step1.chooseAnnuity.point1')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.chooseAnnuity.point2')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.chooseAnnuity.point3')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.chooseAnnuity.point4')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.chooseAnnuity.point5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">{t('pension-annuity.decisionFramework.step1.stayInEnpf.title')}</h4>
                <ul className="space-y-1 list-disc list-inside break-words">
                  <li>{t('pension-annuity.decisionFramework.step1.stayInEnpf.point1')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.stayInEnpf.point2')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.stayInEnpf.point3')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.stayInEnpf.point4')}</li>
                  <li>{t('pension-annuity.decisionFramework.step1.stayInEnpf.point5')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-2">{t('pension-annuity.decisionFramework.step2.title')}</h3>
            <p className="text-sm text-teal-800 break-words">
              {t('pension-annuity.decisionFramework.step2.description')}
            </p>
          </div>

          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-2">{t('pension-annuity.decisionFramework.step3.title')}</h3>
            <p className="text-sm text-green-800 break-words">
              {t('pension-annuity.decisionFramework.step3.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      {results.monthlyAnnuity > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Ежемесячная выплата', value: results.monthlyAnnuity },
              { name: 'Годовая выплата', value: results.yearlyAnnuity },
            ]}
            title="Пенсионный аннуитет"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.monthlyAnnuity > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт пенсионного аннуитета',
              subtitle: `${gender === 'male' ? 'Мужчина' : 'Женщина'}, ${age} лет`,
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Возраст', value: `${age} лет` },
                    { label: 'Накопления', value: `${parseFloat(currentAccumulations || '0').toLocaleString()} ₸` },
                    { label: 'Страховая компания', value: insuranceCompany },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Ежемесячная выплата', value: `${results.monthlyAnnuity.toLocaleString()} ₸` },
                    { label: 'Годовая выплата', value: `${results.yearlyAnnuity.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="pension-annuity-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="pension-annuity" />
      <MethodologySection steps={getMethodology('pension-annuity')} />
      <FAQSection
        items={[
          { question: t('pension-annuity.faq.q1'), answer: t('pension-annuity.faq.a1') },
          { question: t('pension-annuity.faq.q2'), answer: t('pension-annuity.faq.a2') },
          { question: t('pension-annuity.faq.q3'), answer: t('pension-annuity.faq.a3') },
          { question: t('pension-annuity.faq.q4'), answer: t('pension-annuity.faq.a4') },
          { question: t('pension-annuity.faq.q5'), answer: t('pension-annuity.faq.a5') }
        ]}
        sources={[
          { title: 'ЕНПФ — Пенсионный аннуитет', url: 'https://enpf.kz/' },
          { title: 'АРРФР — Страховые компании', url: 'https://finreg.kz/' },
        ]}
      />

      <LegalDisclaimer type="social" />
      <ExpertBlock />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="pension-annuity"
        calculatorTitle="Калькулятор пенсионного аннуитета"
      />
      <LastUpdated calculatorId="pension-annuity" />
    </div>
  );
}
