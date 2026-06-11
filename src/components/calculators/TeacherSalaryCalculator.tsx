import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Calculator, TrendingUp, Info, Award, MapPin } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

// БДО (базовый должностной оклад) 2026 = 17 697 ₸ (Постановление Правительства РК № 1193 от 31.12.2015; не индексировался с 2016)
const BDO_2026 = 17_697;
const MRP_2026 = 4_325;
const MZP_2026 = 85_000;

// Коэффициенты категория × стаж (приложение к приказу МОН РК)
// Формат: [категория][стажIndex] → коэффициент к БДО
const CATEGORIES = ['none', 'moderator', 'expert', 'researcher', 'master'] as const;
type Category = typeof CATEGORIES[number];

// Стаж: 0-1, 1-2, 2-3, 3-5, 5-7, 7-10, 10-14, 14-18, 18-22, 22-25, 25+
const EXPERIENCE_RANGES = [
  { min: 0, max: 1 },
  { min: 1, max: 2 },
  { min: 2, max: 3 },
  { min: 3, max: 5 },
  { min: 5, max: 7 },
  { min: 7, max: 10 },
  { min: 10, max: 14 },
  { min: 14, max: 18 },
  { min: 18, max: 22 },
  { min: 22, max: 25 },
  { min: 25, max: 99 },
];

// Коэффициенты — строки: категория, столбцы: стаж
const COEFFICIENTS: Record<Category, number[]> = {
  none:       [4.40, 4.49, 4.59, 4.68, 4.78, 4.97, 5.06, 5.15, 5.25, 5.34, 5.34],
  moderator:  [4.84, 4.94, 5.04, 5.14, 5.24, 5.48, 5.58, 5.68, 5.78, 5.88, 5.88],
  expert:     [5.28, 5.39, 5.50, 5.61, 5.72, 5.98, 6.09, 6.20, 6.31, 6.41, 6.41],
  researcher: [5.72, 5.84, 5.96, 6.07, 6.19, 6.49, 6.60, 6.72, 6.83, 6.95, 6.95],
  master:     [6.16, 6.29, 6.41, 6.54, 6.66, 6.99, 7.12, 7.24, 7.37, 7.49, 7.49],
};

// Доплаты (в МРП/месяц)
const BONUSES = {
  classTeacher: 5,       // классное руководство
  notebookCheck: 3,      // проверка тетрадей
  cabinetHead: 1,        // заведование кабинетом
  methodist: 2,          // методист
};

function getExperienceIndex(years: number): number {
  for (let i = 0; i < EXPERIENCE_RANGES.length; i++) {
    if (years >= EXPERIENCE_RANGES[i].min && years < EXPERIENCE_RANGES[i].max) return i;
  }
  return EXPERIENCE_RANGES.length - 1;
}

export default function TeacherSalaryCalculator() {
  const { t } = useTranslation('calculators');

  const [category, setCategory] = useState<Category>('moderator');
  const [experience, setExperience] = useState<string>('10');
  const [hoursPerWeek, setHoursPerWeek] = useState<string>('18');
  const [isRural, setIsRural] = useState(false);
  const [isSmallSchool, setIsSmallSchool] = useState(false);
  const [bonuses, setBonuses] = useState({
    classTeacher: true,
    notebookCheck: false,
    cabinetHead: false,
    methodist: false,
  });

  const results = useMemo(() => {
    const years = parseFloat(experience) || 0;
    const hours = parseFloat(hoursPerWeek) || 0;
    const standardHours = 18; // норма часов педагога

    const expIndex = getExperienceIndex(years);
    const coeff = COEFFICIENTS[category][expIndex];

    // Базовый оклад = БДО × коэффициент
    const baseOklad = Math.round(BDO_2026 * coeff);

    // Пропорционально нагрузке
    const loadFactor = hours / standardHours;
    const okladByLoad = Math.round(baseOklad * loadFactor);

    // Региональные надбавки
    const ruralBonus = isRural ? Math.round(okladByLoad * 0.25) : 0;
    const smallSchoolBonus = isSmallSchool ? Math.round(okladByLoad * 0.20) : 0;

    // Доплаты в МРП
    let bonusMRP = 0;
    if (bonuses.classTeacher) bonusMRP += BONUSES.classTeacher;
    if (bonuses.notebookCheck) bonusMRP += BONUSES.notebookCheck;
    if (bonuses.cabinetHead) bonusMRP += BONUSES.cabinetHead;
    if (bonuses.methodist) bonusMRP += BONUSES.methodist;
    const bonusAmount = bonusMRP * MRP_2026;

    const grossSalary = okladByLoad + ruralBonus + smallSchoolBonus + bonusAmount;

    // Удержания
    const opv = Math.round(Math.min(grossSalary, 50 * MZP_2026) * 0.10);
    const vosms = Math.round(Math.min(grossSalary, 20 * MZP_2026) * 0.02);
    const standardDeduction = 30 * MRP_2026;
    const taxableIncome = Math.max(0, grossSalary - opv - vosms - standardDeduction);
    const ipn = Math.round(taxableIncome * 0.10);
    const totalDeductions = opv + vosms + ipn;
    const netSalary = grossSalary - totalDeductions;

    return {
      coeff,
      baseOklad,
      okladByLoad,
      ruralBonus,
      smallSchoolBonus,
      bonusAmount,
      grossSalary,
      opv,
      vosms,
      ipn,
      totalDeductions,
      netSalary,
    };
  }, [category, experience, hoursPerWeek, isRural, isSmallSchool, bonuses]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const pieData = useMemo(() => {
    if (results.grossSalary <= 0) return [];
    return [
      { name: t('teacher-salary.netSalary'), value: results.netSalary },
      { name: t('teacher-salary.opv'), value: results.opv },
      { name: t('teacher-salary.vosms'), value: results.vosms },
      { name: t('teacher-salary.ipn'), value: results.ipn },
    ];
  }, [results, t]);

  const generateExportData = () => {
    if (results.grossSalary <= 0) return null;
    return {
      title: t('teacher-salary.exportTitle'),
      sections: [
        {
          title: t('teacher-salary.parameters'),
          data: [
            { label: t('teacher-salary.category'), value: t(`teacher-salary.categories.${category}`) },
            { label: t('teacher-salary.experience'), value: `${experience} ${t('teacher-salary.years')}` },
            { label: t('teacher-salary.hoursPerWeek'), value: `${hoursPerWeek} ${t('teacher-salary.hours')}` },
            { label: t('teacher-salary.coefficient'), value: String(results.coeff) },
          ],
        },
        {
          title: t('teacher-salary.resultsTitle'),
          data: [
            { label: t('teacher-salary.baseOklad'), value: formatCurrency(results.baseOklad) },
            { label: t('teacher-salary.okladByLoad'), value: formatCurrency(results.okladByLoad) },
            { label: t('teacher-salary.grossSalary'), value: formatCurrency(results.grossSalary) },
            { label: t('teacher-salary.totalDeductions'), value: formatCurrency(results.totalDeductions) },
            { label: t('teacher-salary.netSalary'), value: formatCurrency(results.netSalary) },
          ],
        },
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="teacher-salary" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('teacher-salary.heading')}</h1>
            <p className="text-gray-600">{t('teacher-salary.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('teacher-salary.warning')}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('teacher-salary.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Award className="w-4 h-4 inline mr-1" />
                {t('teacher-salary.category')}
              </label>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                      category === cat
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    {t(`teacher-salary.categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teacher-salary.experience')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('teacher-salary.years')}</span>
                </div>
              </div>
            </div>

            {/* Hours per week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('teacher-salary.hoursPerWeek')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  min="1"
                  max="40"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('teacher-salary.hours')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('teacher-salary.standardHours')}</p>
            </div>

            {/* Regional bonuses */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('teacher-salary.regionalBonuses')}
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRural}
                  onChange={(e) => setIsRural(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('teacher-salary.ruralBonus')} (+25%)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSmallSchool}
                  onChange={(e) => setIsSmallSchool(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('teacher-salary.smallSchoolBonus')} (+20%)</span>
              </label>
            </div>

            {/* Additional bonuses */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('teacher-salary.additionalBonuses')}
              </label>
              {Object.entries(BONUSES).map(([key, mrp]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bonuses[key as keyof typeof bonuses]}
                    onChange={(e) => setBonuses((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t(`teacher-salary.bonus.${key}`)} ({mrp} МРП = {formatCurrency(mrp * MRP_2026)})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('teacher-salary.resultsTitle')}
          </h2>

          <div className="space-y-6">
            {/* Coefficient */}
            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-blue-600">{t('teacher-salary.coefficient')}</div>
                <div className="text-xs text-blue-500">
                  {t(`teacher-salary.categories.${category}`)}, {experience} {t('teacher-salary.years')}
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-700">{results.coeff}</span>
            </div>

            {/* Salary breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('teacher-salary.baseOklad')}</span>
                <span className="font-medium">{formatCurrency(results.baseOklad)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('teacher-salary.okladByLoad')}</span>
                <span className="font-medium">{formatCurrency(results.okladByLoad)}</span>
              </div>
              {results.ruralBonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('teacher-salary.ruralBonus')} (+25%)</span>
                  <span className="font-medium text-green-600">+{formatCurrency(results.ruralBonus)}</span>
                </div>
              )}
              {results.smallSchoolBonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('teacher-salary.smallSchoolBonus')} (+20%)</span>
                  <span className="font-medium text-green-600">+{formatCurrency(results.smallSchoolBonus)}</span>
                </div>
              )}
              {results.bonusAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('teacher-salary.additionalBonuses')}</span>
                  <span className="font-medium text-green-600">+{formatCurrency(results.bonusAmount)}</span>
                </div>
              )}
            </div>

            {/* Gross */}
            <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-900">{t('teacher-salary.grossSalary')}</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(results.grossSalary)}</span>
            </div>

            {/* Deductions */}
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">{t('teacher-salary.deductions')}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('teacher-salary.opv')} (10%)</span>
                <span className="text-red-600">-{formatCurrency(results.opv)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('teacher-salary.vosms')} (2%)</span>
                <span className="text-red-600">-{formatCurrency(results.vosms)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('teacher-salary.ipn')} (10%)</span>
                <span className="text-red-600">-{formatCurrency(results.ipn)}</span>
              </div>
            </div>

            {/* Net salary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-green-900">{t('teacher-salary.netSalary')}</span>
                <span className="text-2xl font-bold text-green-700">{formatCurrency(results.netSalary)}</span>
              </div>
            </div>

            {/* Pie chart */}
            {pieData.length > 0 && (
              <TaxPieChart
                data={pieData}
                title={t('teacher-salary.chartTitle')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('teacher-salary.exportFilename')} />
      </div>

      {/* Coefficient table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('teacher-salary.coeffTable')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-1 text-gray-600">{t('teacher-salary.category')}</th>
                {EXPERIENCE_RANGES.map((r, i) => (
                  <th key={i} className="text-center py-2 px-1 text-gray-600">
                    {r.max === 99 ? `${r.min}+` : `${r.min}-${r.max}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr key={cat} className={`border-b border-gray-50 ${category === cat ? 'bg-blue-50' : ''}`}>
                  <td className="py-2 px-1 font-medium">{t(`teacher-salary.categories.${cat}`)}</td>
                  {COEFFICIENTS[cat].map((c, i) => (
                    <td
                      key={i}
                      className={`text-center py-2 px-1 ${
                        category === cat && getExperienceIndex(parseFloat(experience) || 0) === i
                          ? 'bg-blue-200 font-bold rounded'
                          : ''
                      }`}
                    >
                      {c.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <Info className="w-3 h-3 inline mr-1" />
          {t('teacher-salary.coeffNote')}
        </p>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('teacher-salary.faq.q1'), answer: t('teacher-salary.faq.a1') },
          { question: t('teacher-salary.faq.q2'), answer: t('teacher-salary.faq.a2') },
          { question: t('teacher-salary.faq.q3'), answer: t('teacher-salary.faq.a3') },
          { question: t('teacher-salary.faq.q4'), answer: t('teacher-salary.faq.a4') },
          { question: t('teacher-salary.faq.q5'), answer: t('teacher-salary.faq.a5') },
        ]}
      
          sources={getSources('teacher-salary')}
        />

      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget calculatorId="teacher-salary" calculatorTitle={t('teacher-salary.heading')} />
      <LastUpdated calculatorId="teacher-salary" />
    </div>
  );
}
