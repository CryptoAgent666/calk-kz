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

// Поправочный коэффициент для педагогов — 2,0, применяется с 01.01.2023 (ПП РК № 1193)
const TEACHER_FACTOR = 2.0;

// Учитель — блок B, звено B2, ступени 1–4 (прил. 1 и прил. 2 ПП РК № 1193
// в ред. ПП РК от 21.05.2019 № 302 с изм. ПП РК от 26.12.2023 № 1184, с 01.01.2024).
// Ступень определяется КВАЛИФИКАЦИОННОЙ категорией педагога.
const QUAL_CATEGORIES = ['highest', 'first', 'second', 'none'] as const;
type QualCategory = typeof QUAL_CATEGORIES[number];

const TIER_BY_QUAL: Record<QualCategory, number> = {
  highest: 1,
  first: 2,
  second: 3,
  none: 4,
};

// 11 стажевых полос: 0-1, 1-2, 2-3, 3-5, 5-7, 7-10, 10-13, 13-16, 16-20, 20-25, свыше 25
const EXPERIENCE_RANGES = [
  { min: 0, max: 1 },
  { min: 1, max: 2 },
  { min: 2, max: 3 },
  { min: 3, max: 5 },
  { min: 5, max: 7 },
  { min: 7, max: 10 },
  { min: 10, max: 13 },
  { min: 13, max: 16 },
  { min: 16, max: 20 },
  { min: 20, max: 25 },
  { min: 25, max: Infinity },
];

// Коэффициенты к БДО — строки: ступень (квалификационная категория), столбцы: стажевая полоса
const COEFFICIENTS: Record<QualCategory, number[]> = {
  highest: [4.67, 4.74, 4.81, 4.88, 4.95, 5.01, 5.08, 5.16, 5.24, 5.32, 5.41],
  first:   [4.39, 4.50, 4.57, 4.65, 4.72, 4.79, 4.86, 4.95, 5.03, 5.12, 5.20],
  second:  [4.36, 4.44, 4.51, 4.59, 4.66, 4.74, 4.81, 4.90, 4.99, 5.08, 5.16],
  none:    [4.10, 4.14, 4.19, 4.23, 4.27, 4.33, 4.38, 4.49, 4.59, 4.67, 4.73],
};

// Педагогическая категория — это ДОПЛАТА к должностному окладу, а не строка сетки
// (прил. 4 стр. 7–8, п. 3 пп. 2 ПП РК № 1193). Считается с учётом фактической нагрузки.
const PED_CATEGORIES = ['none', 'moderator', 'expert', 'researcher', 'master'] as const;
type PedCategory = typeof PED_CATEGORIES[number];

const PED_CATEGORY_RATES: Record<PedCategory, number> = {
  none: 0,
  moderator: 0.30,
  expert: 0.35,
  researcher: 0.40,
  master: 0.50,
};

// Доплаты. ВСЕ они задаются Приложением 4 к ПП РК № 1193 процентом от БДО —
// не суммой в МРП. Сверка Tier-2 29.08.2026 по тексту постановления на adilet:
//   классное руководство — 50% БДО (1-4 кл.), 60% БДО (5-11(12) кл.);
//   проверка тетрадей   — 40% БДО (базовая ставка);
//   заведование кабинетом — 20% БДО (школы, школы-интернаты, детдома).
// До этой сверки в коде стояли 5 / 3 / 2 МРП — ровная убывающая лесенка, которой
// нет ни в одном НПА: классное руководство было завышено в 2,0-2,4 раза, проверка
// тетрадей — в 1,5-1,8 раза. Доплата «методисту» (2 МРП) удалена: такой доплаты
// не существует, «методист» в ПП № 1193 — это наименование штатной должности,
// а не надбавка и не квалификационная категория (их шесть: педагог-стажёр,
// педагог, педагог-модератор, педагог-эксперт, педагог-исследователь,
// педагог-мастер). В МРП Закон «О статусе педагога» (ст. 8) задаёт только
// доплаты за учёные степени и магистратуру — их калькулятор не считает.
type SchoolLevel = 'primary' | 'secondary';
type BonusSpec = { value: number; prorated: boolean };

// prorated: по п. 37 Правил исчисления зарплаты педагогов (приказ МОН РК № 622)
// доплаты считаются от ФАКТИЧЕСКОЙ нагрузки. Единственное исключение из тех,
// что здесь есть, — проверка тетрадей у основного учителя 1-4 классов.
const bonusSpecsFor = (level: SchoolLevel): Record<string, BonusSpec> => ({
  classTeacher:  { value: level === 'primary' ? 0.50 : 0.60, prorated: true },
  notebookCheck: { value: 0.40, prorated: level !== 'primary' },
  cabinetHead:   { value: 0.20, prorated: true },
});

function bonusAmountFor(spec: BonusSpec, bdo: number, loadFactor: number): number {
  return Math.round(spec.value * bdo * (spec.prorated ? loadFactor : 1));
}

function getExperienceIndex(years: number): number {
  for (let i = 0; i < EXPERIENCE_RANGES.length; i++) {
    if (years >= EXPERIENCE_RANGES[i].min && years < EXPERIENCE_RANGES[i].max) return i;
  }
  return EXPERIENCE_RANGES.length - 1;
}

export default function TeacherSalaryCalculator() {
  const { t } = useTranslation('calculators');

  const [qualCategory, setQualCategory] = useState<QualCategory>('first');
  const [pedCategory, setPedCategory] = useState<PedCategory>('moderator');
  const [experience, setExperience] = useState<string>('10');
  const [hoursPerWeek, setHoursPerWeek] = useState<string>('18');
  const [isRural, setIsRural] = useState(false);
  const [isSmallSchool, setIsSmallSchool] = useState(false);
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('secondary');
  const [bonuses, setBonuses] = useState({
    classTeacher: true,
    notebookCheck: false,
    cabinetHead: false,
  });

  const results = useMemo(() => {
    const years = parseFloat(experience) || 0;
    const hours = parseFloat(hoursPerWeek) || 0;
    const standardHours = 18; // норма часов педагога

    const expIndex = getExperienceIndex(years);
    const coeff = COEFFICIENTS[qualCategory][expIndex];
    const tier = TIER_BY_QUAL[qualCategory];

    // Должностной оклад = БДО × коэффициент(ступень, стажевая полоса) × 2,0
    const baseOklad = Math.round(BDO_2026 * coeff * TEACHER_FACTOR);

    // Пропорционально нагрузке
    const loadFactor = hours / standardHours;
    const okladByLoad = Math.round(baseOklad * loadFactor);

    // Доплата за педагогическую категорию — с учётом фактической нагрузки
    const pedRate = PED_CATEGORY_RATES[pedCategory];
    const pedCategoryBonus = Math.round(okladByLoad * pedRate);

    // Региональные надбавки
    const ruralBonus = isRural ? Math.round(okladByLoad * 0.25) : 0;
    const smallSchoolBonus = isSmallSchool ? Math.round(okladByLoad * 0.20) : 0;

    const bonusAmount = Object.entries(bonusSpecsFor(schoolLevel)).reduce(
      (sum, [key, spec]) =>
        bonuses[key as keyof typeof bonuses] ? sum + bonusAmountFor(spec, BDO_2026, loadFactor) : sum,
      0
    );

    const grossSalary = okladByLoad + pedCategoryBonus + ruralBonus + smallSchoolBonus + bonusAmount;

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
      tier,
      expIndex,
      pedRate,
      loadFactor,
      baseOklad,
      okladByLoad,
      pedCategoryBonus,
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
  }, [qualCategory, pedCategory, experience, hoursPerWeek, isRural, isSmallSchool, bonuses, schoolLevel]);

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
            { label: t('teacher-salary.qualCategory'), value: t(`teacher-salary.qualCategories.${qualCategory}`) },
            { label: t('teacher-salary.pedCategory'), value: t(`teacher-salary.categories.${pedCategory}`) },
            { label: t('teacher-salary.experience'), value: `${experience} ${t('teacher-salary.years')}` },
            { label: t('teacher-salary.hoursPerWeek'), value: `${hoursPerWeek} ${t('teacher-salary.hours')}` },
            { label: t('teacher-salary.coefficient'), value: String(results.coeff) },
            { label: t('teacher-salary.correctionFactor'), value: '2,0' },
          ],
        },
        {
          title: t('teacher-salary.resultsTitle'),
          data: [
            { label: t('teacher-salary.baseOklad'), value: formatCurrency(results.baseOklad) },
            { label: t('teacher-salary.okladByLoad'), value: formatCurrency(results.okladByLoad) },
            { label: t('teacher-salary.pedCategoryBonus'), value: formatCurrency(results.pedCategoryBonus) },
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
            {/* Qualification category → tier of the pay grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Award className="w-4 h-4 inline mr-1" />
                {t('teacher-salary.qualCategory')}
              </label>
              <div className="space-y-2">
                {QUAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setQualCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                      qualCategory === cat
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    {t(`teacher-salary.qualCategories.${cat}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('teacher-salary.qualCategoryHint')}</p>
            </div>

            {/* Pedagogical category → surcharge on top of the salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Award className="w-4 h-4 inline mr-1" />
                {t('teacher-salary.pedCategory')}
              </label>
              <div className="space-y-2">
                {PED_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPedCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                      pedCategory === cat
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    {t(`teacher-salary.categories.${cat}`)}
                    {PED_CATEGORY_RATES[cat] > 0 && (
                      <span className="text-xs opacity-70"> +{Math.round(PED_CATEGORY_RATES[cat] * 100)}%</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('teacher-salary.pedCategoryHint')}</p>
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

            {/* School level — от него зависят ставки доплат по Прил. 4 ПП № 1193 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('teacher-salary.schoolLevel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['primary', 'secondary'] as SchoolLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSchoolLevel(lvl)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      schoolLevel === lvl
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(`teacher-salary.schoolLevels.${lvl}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">{t('teacher-salary.schoolLevelHint')}</p>
            </div>

            {/* Additional bonuses */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {t('teacher-salary.additionalBonuses')}
              </label>
              {Object.entries(bonusSpecsFor(schoolLevel)).map(([key, spec]) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bonuses[key as keyof typeof bonuses]}
                    onChange={(e) => setBonuses((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t(`teacher-salary.bonus.${key}`)} ({Math.round(spec.value * 100)}% {t('teacher-salary.bdoShort')}
                    {' = '}
                    {formatCurrency(bonusAmountFor(spec, BDO_2026, results.loadFactor))})
                  </span>
                </label>
              ))}
              <p className="text-xs text-gray-500">{t('teacher-salary.notebookCheckHint')}</p>
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
                <div className="text-sm text-blue-600">
                  {t('teacher-salary.coefficient')} · {t('teacher-salary.tier')} {results.tier}
                </div>
                <div className="text-xs text-blue-500">
                  {t(`teacher-salary.qualCategories.${qualCategory}`)}, {experience} {t('teacher-salary.years')}
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-700">{results.coeff}</span>
            </div>

            {/* Formula reminder */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              {t('teacher-salary.formula')}
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
              {results.pedCategoryBonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {t('teacher-salary.pedCategoryBonus')} (+{Math.round(results.pedRate * 100)}%)
                  </span>
                  <span className="font-medium text-green-600">+{formatCurrency(results.pedCategoryBonus)}</span>
                </div>
              )}
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
                <th className="text-left py-2 px-1 text-gray-600">{t('teacher-salary.qualCategory')}</th>
                {EXPERIENCE_RANGES.map((r, i) => (
                  <th key={i} className="text-center py-2 px-1 text-gray-600">
                    {Number.isFinite(r.max) ? `${r.min}-${r.max}` : `${r.min}+`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUAL_CATEGORIES.map((cat) => (
                <tr key={cat} className={`border-b border-gray-50 ${qualCategory === cat ? 'bg-blue-50' : ''}`}>
                  <td className="py-2 px-1 font-medium">{t(`teacher-salary.qualCategories.${cat}`)}</td>
                  {COEFFICIENTS[cat].map((c, i) => (
                    <td
                      key={i}
                      className={`text-center py-2 px-1 ${
                        qualCategory === cat && results.expIndex === i
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
