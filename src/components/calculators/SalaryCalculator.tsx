import React, { useState, useMemo, useRef } from 'react';
import { Wallet, Users, Info, Building, DollarSign, Percent, Plus, Trash2, ClipboardPaste } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import {
  calculateSalary2026,
  sumSalaryRows,
  parseSalaryLines,
  SOCIAL_DEDUCTION_ANNUAL,
  type SocialDeduction,
  type SalaryRow,
  type SalaryResult,
  type SalaryTotals,
} from '../../utils/salary2026';

// Константы и формула расчёта (МЗП, МРП, пол СО 1 МЗП по ст. 245 СК, вычеты ст. 403/404 НК)
// живут в utils/salary2026.ts — одна функция считает и одиночный расчёт, и таблицу сотрудников.

type CalcMode = 'single' | 'multi';
const SOCIAL_OPTIONS = ['none', '882', '5000'] as const;

const newRow = (id: number, patch: Partial<SalaryRow> = {}): SalaryRow => ({
  id, name: '', gross: '', isPrimaryJob: true, isSpecialCategory: false, socialDeduction: 'none', ...patch,
});

// Колонки денежных итогов таблицы — общий список для строк, итога и экспорта.
type MoneyLine = Pick<SalaryResult,
  'opv' | 'vosms' | 'incomeTax' | 'totalEmployeeDeductions' | 'netSalary'
  | 'sn' | 'so' | 'oosms' | 'opvr' | 'totalEmployerContributions' | 'totalLaborCost'>;
const MONEY_COLUMNS: { key: keyof MoneyLine; label: string; strong?: 'red' | 'green' | 'orange' | 'blue' }[] = [
  { key: 'opv', label: 'colOpv' },
  { key: 'vosms', label: 'colVosms' },
  { key: 'incomeTax', label: 'colIpn' },
  { key: 'totalEmployeeDeductions', label: 'colDeductions', strong: 'red' },
  { key: 'netSalary', label: 'colNet', strong: 'green' },
  { key: 'sn', label: 'colSn' },
  { key: 'so', label: 'colSo' },
  { key: 'oosms', label: 'colOosms' },
  { key: 'opvr', label: 'colOpvr' },
  { key: 'totalEmployerContributions', label: 'colEmployer', strong: 'orange' },
  { key: 'totalLaborCost', label: 'colLaborCost', strong: 'blue' },
];
const STRONG_CLASS: Record<NonNullable<typeof MONEY_COLUMNS[number]['strong']>, string> = {
  red: 'font-semibold text-red-700',
  green: 'font-semibold text-green-700',
  orange: 'font-semibold text-orange-700',
  blue: 'font-semibold text-blue-700',
};

export default function SalaryCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [mode, setMode] = useState<CalcMode>('single');
  const [grossSalary, setGrossSalary] = useState<string>('300000');
  const [isResident, setIsResident] = useState<boolean>(true);
  const [isPrimaryJob, setIsPrimaryJob] = useState<boolean>(true);
  const [isSpecialCategory, setIsSpecialCategory] = useState<boolean>(false);
  const [socialDeduction, setSocialDeduction] = useState<SocialDeduction>('none');

  // Режим «несколько сотрудников»: строки таблицы + текстовое быстрое заполнение.
  // Резидентство — общий флаг на всю таблицу (isResident выше).
  const [rows, setRows] = useState<SalaryRow[]>(() => [newRow(1, { gross: '300000' }), newRow(2), newRow(3)]);
  const nextRowId = useRef(4);
  const [pasteText, setPasteText] = useState('');

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    () => calculateSalary2026({ gross: parseFloat(grossSalary) || 0, isResident, isPrimaryJob, isSpecialCategory, socialDeduction }),
    [grossSalary, isResident, isPrimaryJob, isSpecialCategory, socialDeduction]
  );

  const multiRows = useMemo(
    () => rows.map((row, idx) => {
      const gross = parseFloat(row.gross) || 0;
      const result = calculateSalary2026({
        gross, isResident, isPrimaryJob: row.isPrimaryJob, isSpecialCategory: row.isSpecialCategory, socialDeduction: row.socialDeduction,
      });
      return { row, idx, gross, result };
    }),
    [rows, isResident]
  );
  const totals: SalaryTotals = useMemo(() => sumSalaryRows(multiRows), [multiRows]);
  const filledRows = multiRows.filter((r) => r.gross > 0);
  const anySoFloor = filledRows.some((r) => r.result.soFloorApplied);

  const updateRow = (id: number, patch: Partial<SalaryRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, newRow(nextRowId.current++)]);
  const removeRow = (id: number) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const applyPaste = () => {
    const parsed = parseSalaryLines(pasteText);
    if (!parsed.length) return;
    // Пустые строки-заготовки уходят, заполненные остаются, вставленные добавляются в конец.
    setRows((prev) => [
      ...prev.filter((r) => (parseFloat(r.gross) || 0) > 0),
      ...parsed.map((p) => newRow(nextRowId.current++, { name: p.name, gross: String(p.gross) })),
    ]);
    setPasteText('');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };
  const fmtCell = (num: number) => num.toLocaleString('ru-KZ');
  const employeeLabel = (row: SalaryRow, idx: number) => row.name.trim() || t('salary.multi.exportEmployee', { n: idx + 1 });

  const generateExportData = () => {
    if (!grossSalary || parseFloat(grossSalary) <= 0) return '';

    return `${t('salary.parameters')}:
- ${t('salary.grossSalary')}: ${formatNumber(parseFloat(grossSalary))}
- ${t('salary.isResident')}: ${isResident ? t('common.yes') : t('common.no')}
- ${t('salary.isPrimaryJob')}: ${isPrimaryJob ? t('common.yes') : t('common.no')}
- ${t('salary.isSpecialCategory')}: ${isSpecialCategory ? t('common.yes') : t('common.no')}

${t('salary.employeeDeductions')}:
- ${t('salary.opv')}: ${formatNumber(results.opv)}
- ${t('salary.vosms')}: ${formatNumber(results.vosms)}${results.socialDeduction > 0 ? `\n- ${t('salary.socialDeductionRow')}: -${formatNumber(results.socialDeduction)}` : ''}
- ${t('salary.ipn')}: ${formatNumber(results.incomeTax)}
- ${t('salary.totalDeducted')}: ${formatNumber(results.totalEmployeeDeductions)}
- ${t('salary.netSalary')}: ${formatNumber(results.netSalary)}

${t('salary.employerContributions')}:
- ${t('salary.sn')}: ${formatNumber(results.sn)}
- ${t('salary.so')}: ${formatNumber(results.so)}
- ${t('salary.oosms')}: ${formatNumber(results.oosms)}
- ${t('salary.opvr')}: ${formatNumber(results.opvr)}
- ${t('salary.totalEmployerPays')}: ${formatNumber(results.totalEmployerContributions)}
- ${t('salary.totalLaborCost')}: ${formatNumber(results.totalLaborCost)}

${t('salary.effectiveTaxRate')}:
- ${t('salary.employeeDeductions')}: ${results.effectiveEmployeeTaxRate}%
- ${t('salary.employerSurcharge')}: ${results.effectiveEmployerRate}%`;
  };

  const moneyLines = (gross: number, line: MoneyLine) => [
    { label: t('salary.multi.colGross'), value: formatNumber(gross) },
    ...MONEY_COLUMNS.map((c) => ({ label: t(`salary.multi.${c.label}`), value: formatNumber(line[c.key]) })),
  ];

  const generateMultiExportData = () => {
    if (!filledRows.length) return '';
    const rowsText = filledRows.map((r) =>
      `${r.idx + 1}. ${employeeLabel(r.row, r.idx)}: ${moneyLines(r.gross, r.result).map((l) => `${l.label} ${l.value}`).join('; ')}`
    ).join('\n');
    const totalsText = moneyLines(totals.gross, totals).map((l) => `- ${l.label}: ${l.value}`).join('\n');
    return `${t('salary.multi.title')} (${t('salary.multi.employeesCount', { count: totals.count })}):
- ${t('salary.isResident')}: ${isResident ? t('common.yes') : t('common.no')}

${rowsText}

${t('salary.multi.totals')}:
${totalsText}`;
  };

  const exportText = mode === 'multi' ? generateMultiExportData() : generateExportData();
  const hasResult = mode === 'multi' ? totals.count > 0 : results.netSalary > 0;
  const chartSource: MoneyLine = mode === 'multi' ? totals : results;

  const exportButtonsData = mode === 'multi'
    ? {
        title: t('salary.export.title'),
        subtitle: t('salary.multi.exportSubtitle', { net: totals.netSalary.toLocaleString(), count: totals.count }),
        sections: [
          ...filledRows.map((r) => ({ title: `${r.idx + 1}. ${employeeLabel(r.row, r.idx)}`, data: moneyLines(r.gross, r.result) })),
          { title: t('salary.multi.totals'), data: moneyLines(totals.gross, totals) },
        ],
        footer: t('salary.export.footer'),
      }
    : {
        title: t('salary.export.title'),
        subtitle: `${results.netSalary.toLocaleString()} ₸ ${t('salary.export.netSalaryLabel')}`,
        sections: [
          {
            title: t('salary.export.results'),
            data: [
              { label: t('salary.accrued'), value: `${parseFloat(grossSalary || '0').toLocaleString()} ₸` },
              { label: t('salary.incomeTax'), value: `${results.incomeTax.toLocaleString()} ₸` },
              { label: t('salary.opv'), value: `${results.opv.toLocaleString()} ₸` },
              { label: t('salary.netSalary'), value: `${results.netSalary.toLocaleString()} ₸` },
            ]
          }
        ],
        footer: t('salary.export.footer')
      };

  const cellInput = 'px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('salary.heading')}</h1>
            <p className="text-gray-600">{t('salary.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="salary" />

      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('salary.modeLabel')}</label>
        <div className="grid grid-cols-2 gap-2 max-w-md">
          {(['single', 'multi'] as CalcMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t(`salary.mode_${m}`)}
            </button>
          ))}
        </div>
      </div>

      {mode === 'single' && (
      <>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('salary.parameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('salary.grossSalary')}
              </label>
              <RangeSlider
                value={parseFloat(grossSalary) || 0}
                onChange={(val) => setGrossSalary(String(val))}
                min={100000}
                max={3000000}
                step={50000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#3b82f6"
              />
              <input
                type="number"
                id="grossSalary"
                value={grossSalary}
                onChange={(e) => setGrossSalary(e.target.value)}
                placeholder={t('salary.grossSalaryPlaceholder')}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isResident"
                  checked={isResident}
                  onChange={(e) => setIsResident(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isResident" className="ml-2 block text-sm text-gray-700">
                  {t('salary.isResident')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimaryJob"
                  checked={isPrimaryJob}
                  onChange={(e) => setIsPrimaryJob(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimaryJob" className="ml-2 block text-sm text-gray-700">
                  {t('salary.isPrimaryJob')}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSpecialCategory"
                  checked={isSpecialCategory}
                  onChange={(e) => setIsSpecialCategory(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isSpecialCategory" className="ml-2 block text-sm text-gray-700">
                  {t('salary.isSpecialCategory')}
                </label>
              </div>

              <div>
                <label htmlFor="socialDeduction" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('salary.socialDeductionLabel')}
                </label>
                <select
                  id="socialDeduction"
                  value={socialDeduction}
                  onChange={(e) => setSocialDeduction(e.target.value as SocialDeduction)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SOCIAL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{t(`salary.socialDeduction_${opt}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('salary.currentRates')}</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div><strong>{t('salary.fromEmployee')}</strong></div>
                <div>• {t('salary.rates')}</div>
                <div><strong>{t('salary.fromEmployer')}</strong></div>
                <div>• {t('salary.employerRates')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('salary.employeeDeductions')}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.opv')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.opv)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.vosms')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.vosms)}</span>
            </div>

            {results.standardDeduction > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">{t('salary.standardDeduction')}</span>
                <span className="font-semibold text-green-600">-{formatNumber(results.standardDeduction)}</span>
              </div>
            )}

            {results.socialDeduction > 0 && (
              <div className="py-2 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('salary.socialDeductionRow')}</span>
                  <span className="font-semibold text-green-600">-{formatNumber(results.socialDeduction)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {results.socialDeductionMonths >= 12
                    ? t('salary.socialDeductionHintFull', { limit: formatNumber(SOCIAL_DEDUCTION_ANNUAL[socialDeduction]) })
                    : t('salary.socialDeductionHintPartial', {
                        limit: formatNumber(SOCIAL_DEDUCTION_ANNUAL[socialDeduction]),
                        months: results.socialDeductionMonths,
                        ipn: formatNumber(results.incomeTaxWithoutSocial),
                      })}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.ipn')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.incomeTax)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-3 border-t border-gray-200">
              <span className="font-semibold text-red-900">{t('salary.totalDeducted')}</span>
              <span className="text-lg font-bold text-red-700">{formatNumber(results.totalEmployeeDeductions)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('salary.netSalary')}</span>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-700">{formatNumber(results.netSalary)}</span>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">{t('salary.effectiveTaxRate')}</div>
              <div className="text-lg font-bold text-gray-900">{results.effectiveEmployeeTaxRate}%</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('salary.employerContributions')}
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.sn')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.sn)}</span>
            </div>

            <div className="py-2 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('salary.so')}</span>
                <span className="font-semibold text-gray-900">{formatNumber(results.so)}</span>
              </div>
              {results.soFloorApplied && (
                <p className="text-xs text-amber-700 mt-1">{t('salary.soFloorNote')}</p>
              )}
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.oosms')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.oosms)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('salary.opvr')}</span>
              <span className="font-semibold text-gray-900">{formatNumber(results.opvr)}</span>
            </div>

            <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-3 border-t border-gray-200">
              <span className="font-semibold text-orange-900">{t('salary.totalEmployerPays')}</span>
              <span className="text-lg font-bold text-orange-700">{formatNumber(results.totalEmployerContributions)}</span>
            </div>

            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('salary.totalLaborCost')}</span>
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-xl font-bold text-blue-700">{formatNumber(results.totalLaborCost)}</span>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">{t('salary.employerSurcharge')}</div>
              <div className="text-lg font-bold text-gray-900">{results.effectiveEmployerRate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('salary.expensesSummary')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-6 h-6 text-gray-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.employee')}</span>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-1">{formatNumber(results.totalEmployeeDeductions)}</div>
            <div className="text-sm text-gray-600">{results.effectiveEmployeeTaxRate}% {t('salary.ofSalary')}</div>
          </div>

          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building className="w-6 h-6 text-orange-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.employer')}</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">{formatNumber(results.totalEmployerContributions)}</div>
            <div className="text-sm text-gray-600">{results.effectiveEmployerRate}% {t('salary.ofSalary')}</div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Percent className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.totalToBudget')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatNumber(results.totalEmployeeDeductions + results.totalEmployerContributions)}
            </div>
            <div className="text-sm text-gray-600">
              {(results.effectiveEmployeeTaxRate + results.effectiveEmployerRate).toFixed(1)}% {t('salary.ofSalary')}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('salary.understandingStructure')}
              </h3>
              <p className="text-blue-800 text-sm">
                <strong>{t('salary.employeeReceives')}</strong> {formatNumber(results.netSalary)} {t('salary.of')} {formatNumber(parseFloat(grossSalary) || 0)} {t('salary.accrued')}
                <br />
                <strong>{t('salary.employerAdds')}</strong> {formatNumber(results.totalEmployerContributions)} {t('salary.aboveSalary')}
                <br />
                <strong>{t('salary.fullCostEmployee')}</strong> {formatNumber(results.totalLaborCost)} {t('salary.forEmployer')}
              </p>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {mode === 'multi' && (
      <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">{t('salary.multi.title')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('salary.multi.hint')}</p>
          </div>
          <label className="flex items-center text-sm text-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              id="isResidentAll"
              checked={isResident}
              onChange={(e) => setIsResident(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2">{t('salary.multi.residentAll')}</span>
          </label>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="min-w-full text-sm" id="salaryMultiTable">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-2 text-left font-medium">{t('salary.multi.colNo')}</th>
                <th className="py-2 pr-2 text-left font-medium">{t('salary.multi.colName')}</th>
                <th className="py-2 pr-2 text-left font-medium">{t('salary.multi.colGross')}</th>
                <th className="py-2 px-2 text-center font-medium">{t('salary.multi.colPrimary')}</th>
                <th className="py-2 px-2 text-center font-medium">{t('salary.multi.colSpecial')}</th>
                <th className="py-2 pr-2 text-left font-medium">{t('salary.multi.colSocial')}</th>
                {MONEY_COLUMNS.map((c) => (
                  <th key={c.key} className="py-2 px-2 text-right font-medium whitespace-nowrap">{t(`salary.multi.${c.label}`)}</th>
                ))}
                <th className="py-2 pl-2" />
              </tr>
            </thead>
            <tbody>
              {multiRows.map(({ row, idx, gross, result }) => (
                <tr key={row.id} className="border-b border-gray-100 align-middle">
                  <td className="py-2 pr-2 text-gray-500">{idx + 1}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, { name: e.target.value })}
                      placeholder={t('salary.multi.namePlaceholder')}
                      aria-label={`${t('salary.multi.colName')} ${idx + 1}`}
                      className={`${cellInput} w-36`}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      value={row.gross}
                      onChange={(e) => updateRow(row.id, { gross: e.target.value })}
                      placeholder="0"
                      aria-label={`${t('salary.multi.colGross')} ${idx + 1}`}
                      className={`${cellInput} w-32`}
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.isPrimaryJob}
                      onChange={(e) => updateRow(row.id, { isPrimaryJob: e.target.checked })}
                      aria-label={`${t('salary.isPrimaryJob')} ${idx + 1}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.isSpecialCategory}
                      onChange={(e) => updateRow(row.id, { isSpecialCategory: e.target.checked })}
                      aria-label={`${t('salary.isSpecialCategory')} ${idx + 1}`}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      value={row.socialDeduction}
                      onChange={(e) => updateRow(row.id, { socialDeduction: e.target.value as SocialDeduction })}
                      aria-label={`${t('salary.socialDeductionLabel')} ${idx + 1}`}
                      className={`${cellInput} w-28`}
                    >
                      {SOCIAL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} title={t(`salary.socialDeduction_${opt}`)}>{t(`salary.multi.socialShort_${opt}`)}</option>
                      ))}
                    </select>
                  </td>
                  {MONEY_COLUMNS.map((c) => (
                    <td key={c.key} className={`py-2 px-2 text-right whitespace-nowrap tabular-nums ${c.strong ? STRONG_CLASS[c.strong] : 'text-gray-900'}`}>
                      {gross > 0 ? fmtCell(result[c.key]) : '—'}
                      {c.key === 'so' && gross > 0 && result.soFloorApplied && <span className="text-amber-700">*</span>}
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      aria-label={t('salary.multi.removeRow')}
                      title={t('salary.multi.removeRow')}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-gray-900" id="salaryMultiTotals">
                <td className="py-3 pr-2" colSpan={2}>
                  {t('salary.multi.totals')}
                  <span className="block text-xs font-normal text-gray-500">{t('salary.multi.employeesCount', { count: totals.count })}</span>
                </td>
                <td className="py-3 pr-2 whitespace-nowrap tabular-nums">{fmtCell(totals.gross)}</td>
                <td colSpan={3} />
                {MONEY_COLUMNS.map((c) => (
                  <td key={c.key} className={`py-3 px-2 text-right whitespace-nowrap tabular-nums ${c.strong ? STRONG_CLASS[c.strong] : ''}`}>
                    {fmtCell(totals[c.key])}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-2">{t('salary.multi.unitsNote')}</p>
        {anySoFloor && (
          <p className="text-xs text-amber-700 mt-1">* {t('salary.soFloorNote')}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('salary.multi.addRow')}
          </button>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <label htmlFor="salaryPaste" className="block text-sm font-medium text-gray-700 mb-2">
            {t('salary.multi.pasteLabel')}
          </label>
          <textarea
            id="salaryPaste"
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={t('salary.multi.pastePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={applyPaste}
            disabled={!pasteText.trim()}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            {t('salary.multi.pasteButton')}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('salary.expensesSummary')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-6 h-6 text-gray-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.multi.summaryGross')}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatNumber(totals.gross)}</div>
            <div className="text-sm text-gray-600">{t('salary.multi.employeesCount', { count: totals.count })}</div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.multi.summaryNet')}</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{formatNumber(totals.netSalary)}</div>
            <div className="text-sm text-gray-600">{t('salary.totalDeducted')}: {formatNumber(totals.totalEmployeeDeductions)}</div>
          </div>

          <div className="text-center p-6 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Building className="w-6 h-6 text-orange-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.employer')}</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">{formatNumber(totals.totalEmployerContributions)}</div>
            <div className="text-sm text-gray-600">{t('salary.totalEmployerPays')}</div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Percent className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">{t('salary.totalLaborCost')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">{formatNumber(totals.totalLaborCost)}</div>
            <div className="text-sm text-gray-600">
              {t('salary.totalToBudget')}: {formatNumber(totals.totalEmployeeDeductions + totals.totalEmployerContributions)}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {exportText && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('salary.exportTitle')}
            description={t('salary.exportDescription')}
            results={exportText}
            disabled={!exportText}
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="salary" />
      <MethodologySection calculatorId="salary" />
      <FAQSection
        items={[
          { question: t('salary.faq.q1'), answer: t('salary.faq.a1') },
          { question: t('salary.faq.q2'), answer: t('salary.faq.a2') },
          { question: t('salary.faq.q3'), answer: t('salary.faq.a3') },
          { question: t('salary.faq.q4'), answer: t('salary.faq.a4') },
          { question: t('salary.faq.q5'), answer: t('salary.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі' : 'Налоговый кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: i18n.language === 'kk' ? 'БЖЗҚ — Зейнетақы аударымдары' : 'ЕНПФ — Пенсионные отчисления', url: 'https://enpf.kz/' },
        ]}
      />

      {/* Диаграмма структуры зарплаты (в режиме списка — по итогам таблицы) */}
      {hasResult && chartSource.netSalary > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('salary.chart.netSalary'), value: chartSource.netSalary },
              { name: t('salary.chart.opv'), value: chartSource.opv },
              { name: t('salary.chart.ipn'), value: chartSource.incomeTax },
              { name: t('salary.chart.vosms'), value: chartSource.vosms },
            ].filter(item => item.value > 0)}
            title={t('salary.chart.title')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {hasResult && (
        <div className="mt-8">
          <ExportButtons
            data={exportButtonsData}
            filename={mode === 'multi' ? 'salary-multi' : 'salary-calculation'}
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="salary"
        calculatorTitle="Калькулятор зарплаты"
      />
      <LastUpdated calculatorId="salary" />
    </div>
  );
}
