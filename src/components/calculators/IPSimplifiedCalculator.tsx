import React, { useState, useMemo } from 'react';
import { Briefcase, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocalizedLink from '../LocalizedLink';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';
import { NUMBER_LOCALE } from '../../utils/localeFormat';
import { calculateSalary2026 } from '../../utils/salary2026';

export default function IPSimplifiedCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [semiannualIncome, setSemiannualIncome] = useState<string>('3000000');
  const [hasEmployees, setHasEmployees] = useState<boolean>(false);
  const [numberOfEmployees, setNumberOfEmployees] = useState<string>('1');
  const [totalEmployeeSalaries, setTotalEmployeeSalaries] = useState<string>('');
  const [declaredIncome, setDeclaredIncome] = useState<number>(85000); // Минимум 1 МЗП

  // Платежи за сотрудников — за месяц, по всем сотрудникам вместе
  const EMPTY_EMPLOYEES = {
    count: 0,
    payroll: 0,
    averageSalary: 0,

    // Удерживаются из зарплаты
    ipn: 0,
    opv: 0,
    vosms: 0,
    withheld: 0,

    // За счёт ИП
    opvr: 0,
    so: 0,
    oosms: 0,
    employerContributions: 0,

    totalMonthly: 0
  };

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — гидратация падает (#418/#425).
  const EMPTY_RESULTS = {
    totalTax: 0,
    ipnTax: 0,
    socialTax: 0,

    // Социальные платежи за себя (ежемесячно)
    opvSelf: 0,
    opvrSelf: 0,
    soSelf: 0,
    vosmsSelf: 0,
    totalMonthlySelf: 0,
    totalYearlySelf: 0,

    // Сотрудники
    employees: EMPTY_EMPLOYEES,
    yearlyEmployerContributions: 0,

    // Сводка
    semiannualTotalTax: 0,
    yearlyTotalPayments: 0,

    // Проекции
    yearlyPensionContributions: 0,
    effectiveMonthlyBurden: 0
  };

  // Константы на 2026 год
  const MZP = 85000; // МЗП
  const MRP = 4325; // МРП 2026
  const OPV_MAX_BASE = 50 * MZP; // 4,250,000 тенге
  const SO_MAX_BASE = 7 * MZP; // 595,000 тенге
  const VOSMS_FIXED = 5950; // Фиксированная сумма
  const SIMPLIFIED_LIMIT_YEAR = 600_000 * MRP; // 600 000 МРП/год — годовой лимит дохода упрощёнки (НК РК 2026, № 214-VIII); налоговый период — полугодие

  // Платежи за сотрудников. Из зарплаты ИП удерживает ИПН, ОПВ и ВОСМС, за свой
  // счёт платит ОПВР, СО и ООСМС — ставки, базы и вычет 30 МРП те же, что в
  // калькуляторе зарплаты (utils/salary2026). Социальный налог упрощенцы не платят
  // ни за себя, ни за работников (п. 4 ст. 722 НК РК), поэтому sn оттуда не берём.
  // Считаем по средней зарплате: ФОТ ÷ число сотрудников.
  const calculateEmployees = () => {
    const count = Math.floor(parseFloat(numberOfEmployees) || 0);
    const payroll = parseFloat(totalEmployeeSalaries) || 0;

    if (!hasEmployees || count <= 0 || payroll <= 0) {
      return EMPTY_EMPLOYEES;
    }

    const perEmployee = calculateSalary2026({
      gross: payroll / count,
      isResident: true,
      isPrimaryJob: true, // вычет 30 МРП — по основному месту работы
      isSpecialCategory: false,
      socialDeduction: 'none'
    });

    // Значения на одного сотрудника уже округлены до тенге, поэтому строки
    // карточки в сумме дают ровно итог.
    const ipn = perEmployee.incomeTax * count;
    const opv = perEmployee.opv * count;
    const vosms = perEmployee.vosms * count;
    const opvr = perEmployee.opvr * count;
    const so = perEmployee.so * count;
    const oosms = perEmployee.oosms * count;
    const withheld = ipn + opv + vosms;
    const employerContributions = opvr + so + oosms;

    return {
      count,
      payroll: Math.round(payroll),
      averageSalary: Math.round(payroll / count),

      ipn,
      opv,
      vosms,
      withheld,

      opvr,
      so,
      oosms,
      employerContributions,

      totalMonthly: withheld + employerContributions
    };
  };

  const calculateTaxes = () => {
    const income = parseFloat(semiannualIncome) || 0;

    if (income <= 0) {
      return EMPTY_RESULTS;
    }

    // 1. Расчет налога с дохода (раз в полгода).
    // С 2026 ставка 4% от дохода — это ИПН; социальный налог на упрощёнке отменён.
    const totalTax = income * 0.04;
    const ipnTax = totalTax;
    const socialTax = 0;

    // 2. Расчет социальных платежей "за себя" (ежемесячно)
    const monthlyDeclaredIncome = Math.min(declaredIncome, OPV_MAX_BASE); // Ограничение для ОПВ/ОПВР
    const monthlyDeclaredIncomeForSO = Math.min(declaredIncome, SO_MAX_BASE); // Ограничение для СО

    const opvSelf = monthlyDeclaredIncome * 0.10;
    const opvrSelf = monthlyDeclaredIncome * 0.035; // ОПВР 3.5% с 2026
    const soSelf = monthlyDeclaredIncomeForSO * 0.05;
    const vosmsSelf = VOSMS_FIXED;

    const totalMonthlySelf = opvSelf + opvrSelf + soSelf + vosmsSelf;
    const totalYearlySelf = totalMonthlySelf * 12;

    // 3. Сотрудники (ежемесячно). В годовую нагрузку ИП идут только взносы за его
    // счёт: удержанные ИПН, ОПВ и ВОСМС — часть зарплаты сотрудников.
    const employees = calculateEmployees();
    const yearlyEmployerContributions = employees.employerContributions * 12;

    // 4. Общие расчеты
    const semiannualTotalTax = ipnTax + socialTax;
    const yearlyTotalPayments = (semiannualTotalTax * 2) + totalYearlySelf + yearlyEmployerContributions;

    // 5. Проекции
    const yearlyPensionContributions = (opvSelf + opvrSelf) * 12;
    const effectiveMonthlyBurden = yearlyTotalPayments / 12;

    return {
      totalTax: Math.round(totalTax),
      ipnTax: Math.round(ipnTax),
      socialTax: Math.round(socialTax),

      opvSelf: Math.round(opvSelf),
      opvrSelf: Math.round(opvrSelf),
      soSelf: Math.round(soSelf),
      vosmsSelf: Math.round(vosmsSelf),
      totalMonthlySelf: Math.round(totalMonthlySelf),
      totalYearlySelf: Math.round(totalYearlySelf),

      employees,
      yearlyEmployerContributions,

      semiannualTotalTax: Math.round(semiannualTotalTax),
      yearlyTotalPayments: Math.round(yearlyTotalPayments),

      yearlyPensionContributions: Math.round(yearlyPensionContributions),
      effectiveMonthlyBurden: Math.round(effectiveMonthlyBurden)
    };
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    calculateTaxes,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [semiannualIncome, hasEmployees, numberOfEmployees, totalEmployeeSalaries, declaredIncome]
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const handleDeclaredIncomeChange = (value: number) => {
    const clampedValue = Math.max(MZP, Math.min(OPV_MAX_BASE, value));
    setDeclaredIncome(clampedValue);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <QuickAnswer calculatorId="ip-simplified" />

      {/* Кросс-ссылка на быстрый калькулятор «платежи за себя» (без работников) */}
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        <span>{t('ip-simplified.crossLinkText')}</span>
        <LocalizedLink to="/calculator/ip-payments/" className="font-medium underline hover:text-blue-900">
          {t('ip-simplified.crossLinkLabel')} →
        </LocalizedLink>
      </div>

      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('ip-simplified.title')}</h1>
            <p className="text-gray-600">{t('ip-simplified.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Доходы */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ip-simplified.incomeAndEmployees')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('ip-simplified.semiannualIncome')}
                </label>
                <RangeSlider
                  value={parseFloat(semiannualIncome) || 0}
                  onChange={(val) => setSemiannualIncome(String(val))}
                  min={500000}
                  max={50000000}
                  step={500000}
                  formatValue={(v) => `${v.toLocaleString(NUMBER_LOCALE)} ₸`}
                  color="#3b82f6"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="semiannualIncome"
                    value={semiannualIncome}
                    onChange={(e) => setSemiannualIncome(e.target.value)}
                    placeholder={t('ip-simplified.semiannualIncomePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasEmployees"
                  checked={hasEmployees}
                  onChange={(e) => setHasEmployees(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hasEmployees" className="ml-2 block text-sm text-gray-700">
                  {t('ip-simplified.hasEmployees')}
                </label>
              </div>

              {hasEmployees && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <label htmlFor="numberOfEmployees" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ip-simplified.numberOfEmployees')}
                    </label>
                    <input
                      type="number"
                      id="numberOfEmployees"
                      min={1}
                      step={1}
                      value={numberOfEmployees}
                      onChange={(e) => setNumberOfEmployees(e.target.value)}
                      placeholder={t('ip-simplified.numberOfEmployeesPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="totalEmployeeSalaries" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('ip-simplified.totalEmployeeSalaries')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="totalEmployeeSalaries"
                        min={0}
                        value={totalEmployeeSalaries}
                        onChange={(e) => setTotalEmployeeSalaries(e.target.value)}
                        placeholder={t('ip-simplified.totalEmployeeSalariesPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">₸</span>
                      </div>
                    </div>
                  </div>
                  {(parseFloat(totalEmployeeSalaries) || 0) > 0 && Math.floor(parseFloat(numberOfEmployees) || 0) <= 0 && (
                    <p className="col-span-2 text-xs text-amber-700">
                      {t('ip-simplified.employees.countHint')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Заявленный доход */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('ip-simplified.socialContributionsPlanning')}
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="declaredIncome" className="block text-sm font-medium text-gray-700">
                    {t('ip-simplified.declaredIncome')}
                  </label>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatNumber(declaredIncome)}
                  </span>
                </div>

                <div className="space-y-4">
                  <input
                    type="range"
                    id="declaredIncome"
                    min={MZP}
                    max={OPV_MAX_BASE}
                    step={5000}
                    value={declaredIncome}
                    onChange={(e) => handleDeclaredIncomeChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{t('ip-simplified.min')}: {formatNumber(MZP)}</span>
                    <span>{t('ip-simplified.max')}: {formatNumber(OPV_MAX_BASE)}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setDeclaredIncome(MZP)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t('ip-simplified.oneMZP')}
                    </button>
                    <button
                      onClick={() => setDeclaredIncome(MZP * 3)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t('ip-simplified.threeMZP')}
                    </button>
                    <button
                      onClick={() => setDeclaredIncome(MZP * 5)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t('ip-simplified.fiveMZP')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-900 mb-1">
                      {t('ip-simplified.declaredIncomeImpact')}
                    </h3>
                    <p className="text-amber-800 text-sm">
                      <strong>{t('ip-simplified.higherIncomeNow')}:</strong> {t('ip-simplified.higherIncomeNowDescription')}
                      <br />
                      <strong>{t('ip-simplified.lowerIncomeNow')}:</strong> {t('ip-simplified.lowerIncomeNowDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-8">
          {/* Налоги с дохода */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('ip-simplified.incomeTaxes')}
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.totalTax')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.totalTax)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.ipnTax')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.ipnTax)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.socialTax')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.socialTax)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg px-3">
                <span className="font-semibold text-gray-900">{t('ip-simplified.semiannualPayment')}</span>
                <span className="text-lg font-bold text-blue-700">{formatNumber(results.semiannualTotalTax)}</span>
              </div>
            </div>
          </div>

          {/* Социальные взносы за себя */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('ip-simplified.socialContributionsSelf')}
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.opv')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.opvSelf)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.opvr')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.opvrSelf)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.so')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.soSelf)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('ip-simplified.vosms')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.vosmsSelf)}</span>
              </div>

              <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3">
                <span className="font-semibold text-gray-900">{t('ip-simplified.totalMonthly')}</span>
                <span className="text-lg font-bold text-green-700">{formatNumber(results.totalMonthlySelf)}</span>
              </div>
            </div>
          </div>

          {/* За сотрудников */}
          {results.employees.count > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {t('ip-simplified.employees.title')}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {t('ip-simplified.employees.summary', {
                  n: results.employees.count,
                  payroll: formatNumber(results.employees.payroll),
                  average: formatNumber(results.employees.averageSalary)
                })}
              </p>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">{t('ip-simplified.employees.withheldTitle')}</h3>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.ipn')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.employees.ipn)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.opv')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.employees.opv)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.vosms')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.employees.vosms)}</span>
                </div>

                <h3 className="text-sm font-medium text-gray-900 pt-2">{t('ip-simplified.employees.employerTitle')}</h3>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.opvr')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.employees.opvr)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.so')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.employees.so)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.oosms')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.employees.oosms)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('ip-simplified.employees.socialTax')}</span>
                  <span className="text-gray-500">{t('ip-simplified.employees.socialTaxValue')}</span>
                </div>

                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-3">
                  <span className="font-semibold text-gray-900">{t('ip-simplified.employees.total')}</span>
                  <span className="text-lg font-bold text-amber-700">{formatNumber(results.employees.totalMonthly)}</span>
                </div>

                <p className="text-xs text-gray-500">{t('ip-simplified.employees.note')}</p>
                <p className="text-xs text-gray-500">
                  {t('ip-simplified.employees.averageNote')}{' '}
                  <LocalizedLink to="/calculator/salary/" className="underline hover:text-gray-700">
                    {t('ip-simplified.employees.salaryLink')} →
                  </LocalizedLink>
                </p>
              </div>
            </div>
          )}

          {/* Годовая сводка */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ip-simplified.yearlyTotals')}</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('ip-simplified.yearlyPensionContributions')}</span>
                <span className="font-semibold text-blue-600">{formatNumber(results.yearlyPensionContributions)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">{t('ip-simplified.yearlyContributions')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.totalYearlySelf)}</span>
              </div>

              {results.yearlyEmployerContributions > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">{t('ip-simplified.employees.yearlyEmployer')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.yearlyEmployerContributions)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg px-3 border-t border-gray-200">
                <span className="font-semibold text-gray-900">{t('ip-simplified.totalYearlyBurden')}</span>
                <span className="text-lg font-bold text-teal-700">{formatNumber(results.yearlyTotalPayments)}</span>
              </div>

              <div className="text-center pt-2">
                <div className="text-sm text-gray-600">{t('ip-simplified.effectiveMonthlyBurden')}</div>
                <div className="text-xl font-bold text-gray-900">{formatNumber(results.effectiveMonthlyBurden)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('ip-simplified.importantInfo')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="mb-2">
                  <strong>{t('ip-simplified.incomeTaxesLabel')}:</strong> {t('ip-simplified.incomeTaxesInfo')}
                </p>
                <p className="mb-2">
                  <strong>{t('ip-simplified.taxRateLabel')}:</strong> {t('ip-simplified.taxRateInfo')}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <strong>{t('ip-simplified.socialContributionsLabel')}:</strong> {t('ip-simplified.socialContributionsInfo')}
                </p>
                <p>
                  <strong>{t('ip-simplified.declaredIncomeLabel')}:</strong> {t('ip-simplified.declaredIncomeInfo')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма и экспорт */}
      {results.totalTax > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            // Всё приводим к ГОДУ. Раньше здесь стоял полугодовой ipnTax рядом с
            // годовыми ОПВ/СО (×12), из-за чего доли на диаграмме (44/37/19%)
            // не отражали ни год, ни полугодие. ИПН платится за два полугодия.
            // Заодно добавлены ОПВР и ВОСМС — без них «структура» неполная.
            data={[
              { name: t('ip-simplified.ipnTax'), value: results.ipnTax * 2 },
              { name: t('ip-simplified.socialTax'), value: results.socialTax * 2 },
              { name: t('ip-simplified.opv'), value: results.opvSelf * 12 },
              { name: t('ip-simplified.opvr'), value: results.opvrSelf * 12 },
              { name: t('ip-simplified.so'), value: results.soSelf * 12 },
              { name: t('ip-simplified.vosms'), value: results.vosmsSelf * 12 },
              { name: t('ip-simplified.employees.chartLabel'), value: results.yearlyEmployerContributions },
            ].filter(item => item.value > 0)}
            title={t('ip-simplified.taxStructure')}
          />
          <ExportButtons
            data={{
              title: t('ip-simplified.title'),
              subtitle: t('ip-simplified.subtitle'),
              sections: [
                {
                  title: t('ip-simplified.incomeAndEmployees'),
                  data: [
                    { label: t('ip-simplified.semiannualIncome'), value: `${parseFloat(semiannualIncome || '0').toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('ip-simplified.numberOfEmployees'), value: results.employees.count },
                    ...(results.employees.count > 0 ? [
                      { label: t('ip-simplified.totalEmployeeSalaries'), value: formatNumber(results.employees.payroll) },
                    ] : []),
                  ]
                },
                {
                  // Налог 4% платится за полугодие — раньше эта секция ошибочно
                  // называлась «Годовые итоги».
                  title: t('ip-simplified.incomeTaxes'),
                  data: [
                    { label: t('ip-simplified.ipnTax'), value: `${results.ipnTax.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('ip-simplified.socialTax'), value: `${results.socialTax.toLocaleString(NUMBER_LOCALE)} ₸` },
                    { label: t('ip-simplified.totalTax'), value: `${results.totalTax.toLocaleString(NUMBER_LOCALE)} ₸` },
                  ]
                },
                ...(results.employees.count > 0 ? [{
                  title: t('ip-simplified.employees.title'),
                  data: [
                    { label: t('ip-simplified.employees.ipn'), value: formatNumber(results.employees.ipn) },
                    { label: t('ip-simplified.employees.opv'), value: formatNumber(results.employees.opv) },
                    { label: t('ip-simplified.employees.vosms'), value: formatNumber(results.employees.vosms) },
                    { label: t('ip-simplified.employees.opvr'), value: formatNumber(results.employees.opvr) },
                    { label: t('ip-simplified.employees.so'), value: formatNumber(results.employees.so) },
                    { label: t('ip-simplified.employees.oosms'), value: formatNumber(results.employees.oosms) },
                    { label: t('ip-simplified.employees.socialTax'), value: t('ip-simplified.employees.socialTaxValue') },
                    { label: t('ip-simplified.employees.total'), value: formatNumber(results.employees.totalMonthly) },
                  ]
                }] : []),
                {
                  title: t('ip-simplified.yearlyTotals'),
                  data: [
                    { label: t('ip-simplified.yearlyContributions'), value: formatNumber(results.totalYearlySelf) },
                    ...(results.yearlyEmployerContributions > 0 ? [
                      { label: t('ip-simplified.employees.yearlyEmployer'), value: formatNumber(results.yearlyEmployerContributions) },
                    ] : []),
                    { label: t('ip-simplified.totalYearlyBurden'), value: formatNumber(results.yearlyTotalPayments) },
                  ]
                }
              ],
              footer: 'calk.kz'
            }}
            filename="ip-simplified-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="ip-simplified" />
      <MethodologySection calculatorId="ip-simplified" />
      <FAQSection
        items={[
          { question: t('ip-simplified.faq.q1'), answer: t('ip-simplified.faq.a1') },
          { question: t('ip-simplified.faq.q2'), answer: t('ip-simplified.faq.a2') },
          { question: t('ip-simplified.faq.q3'), answer: t('ip-simplified.faq.a3') },
          { question: t('ip-simplified.faq.q4'), answer: t('ip-simplified.faq.a4') },
          { question: t('ip-simplified.faq.q5'), answer: t('ip-simplified.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі — АСР' : 'Налоговый кодекс РК — СНР', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: i18n.language === 'kk' ? 'Egov.kz — ЖК тіркеу' : 'Egov.kz — Регистрация ИП', url: 'https://egov.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="ip-simplified"
        calculatorTitle="Калькулятор ИП на упрощёнке"
      />
      <LastUpdated calculatorId="ip-simplified" />
    </div>
  );
}
