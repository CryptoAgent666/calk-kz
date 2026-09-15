// Чистый расчёт зарплаты работника по нормам 2026 года (НК РК, Социальный кодекс,
// Закон об ОСМС). Вынесен из SalaryCalculator, чтобы одна и та же функция считала
// и одиночный расчёт, и таблицу по списку сотрудников. Констант и формул не менять
// без сверки с реестром констант (scripts/stale-values.json).

// Социальный вычет по ИПН (НК РК 2026 ст. 404): 5 000 МРП/год — инвалидность I–II группы;
// 882 МРП/год — III группа, дети с инвалидностью, участники ВОВ, родители и опекуны детей с инвалидностью.
export type SocialDeduction = 'none' | '882' | '5000';

export const MZP = 85000;
export const MRP = 4325;
export const OPV_RATE = 0.10;
export const VOSMS_RATE = 0.02;
export const IPN_RATE_BASE = 0.10;
export const IPN_RATE_HIGH = 0.15;
export const IPN_ANNUAL_THRESHOLD = 8500 * MRP; // 36,762,500 тенге/год
export const IPN_MONTHLY_THRESHOLD = IPN_ANNUAL_THRESHOLD / 12; // ~3,063,542 тенге/мес
export const SO_RATE = 0.05;
export const OOSMS_RATE = 0.03;
export const OPVR_RATE = 0.035;
export const SN_RATE = 0.06; // СН с 2026: 6%, взаимозачёт с СО отменён (новый НК РК)
export const SN_MIN_BASE = 14 * MRP; // минимальный объект СН = 14 МРП
export const STANDARD_DEDUCTION = 30 * MRP;
export const OPV_MAX_BASE = 50 * MZP;
export const VOSMS_MAX_BASE = 20 * MZP; // С 2026: макс. база ВОСМС = 20 МЗП
export const SO_MAX_BASE = 7 * MZP;
// Соцкодекс ст. 245 п. 1: объект СО за календарный месяц ниже МЗП → СО считаются с МЗП.
// Для работников; по ГПХ минимум с 01.01.2026 не применяется (приказ Минтруда № 299 от 30.09.2025).
export const SO_MIN_BASE = MZP;
export const OOSMS_MAX_BASE = 40 * MZP; // С 2026: макс. база ООСМС = 40 МЗП
export const SOCIAL_DEDUCTION_ANNUAL: Record<SocialDeduction, number> = { none: 0, '882': 882 * MRP, '5000': 5000 * MRP };

export interface SalaryInput {
  gross: number;
  isResident: boolean;
  isPrimaryJob: boolean;
  isSpecialCategory: boolean;
  socialDeduction: SocialDeduction;
}

export interface SalaryResult {
  opv: number;
  vosms: number;
  standardDeduction: number;
  socialDeduction: number;
  socialDeductionMonths: number;
  taxableIncome: number;
  incomeTax: number;
  incomeTaxWithoutSocial: number;
  totalEmployeeDeductions: number;
  sn: number;
  so: number;
  soFloorApplied: boolean;
  oosms: number;
  opvr: number;
  totalEmployerContributions: number;
  netSalary: number;
  totalLaborCost: number;
  effectiveEmployeeTaxRate: number;
  effectiveEmployerRate: number;
}

export const EMPTY_SALARY_RESULT: SalaryResult = {
  opv: 0, vosms: 0, standardDeduction: 0, socialDeduction: 0, socialDeductionMonths: 0,
  taxableIncome: 0, incomeTax: 0, incomeTaxWithoutSocial: 0,
  totalEmployeeDeductions: 0, sn: 0, so: 0, soFloorApplied: false, oosms: 0, opvr: 0, totalEmployerContributions: 0,
  netSalary: 0, totalLaborCost: 0,
  effectiveEmployeeTaxRate: 0, effectiveEmployerRate: 0
};

export function calculateSalary2026({ gross, isResident, isPrimaryJob, isSpecialCategory, socialDeduction }: SalaryInput): SalaryResult {
  if (gross <= 0) {
    return { ...EMPTY_SALARY_RESULT };
  }

  const opvBase = Math.min(gross, OPV_MAX_BASE);
  const opv = isSpecialCategory ? 0 : opvBase * OPV_RATE;

  const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
  const vosms = isSpecialCategory ? 0 : vosmsBase * VOSMS_RATE;

  const standardDeduction = (isResident && isPrimaryJob) ? STANDARD_DEDUCTION : 0;

  const taxableBeforeSocial = Math.max(0, gross - opv - vosms - standardDeduction);

  // Социальный вычет — годовой лимит, применяется к доходу до исчерпания (ст. 404 НК РК):
  // в месяц берётся не больше облагаемого дохода, поэтому первые месяцы ИПН = 0.
  const socialAnnual = isResident ? SOCIAL_DEDUCTION_ANNUAL[socialDeduction] : 0;
  const socialDeductionMonth = Math.min(taxableBeforeSocial, socialAnnual);
  const taxableIncome = taxableBeforeSocial - socialDeductionMonth;
  const socialDeductionMonths = socialAnnual > 0 && taxableBeforeSocial > 0
    ? Math.min(12, Math.max(1, Math.floor(socialAnnual / taxableBeforeSocial)))
    : 0;

  // С 01.01.2026 90%-корректировка ИПН для дохода ≤25 МРП ОТМЕНЕНА: новый НК РК
  // (ст. 401 содержит исчерпывающий перечень вычетов и этой нормы не содержит),
  // вместо неё действует единый базовый вычет 30 МРП (STANDARD_DEDUCTION выше).
  const ipnOf = (base: number) => base <= IPN_MONTHLY_THRESHOLD
    ? base * IPN_RATE_BASE
    : IPN_MONTHLY_THRESHOLD * IPN_RATE_BASE + (base - IPN_MONTHLY_THRESHOLD) * IPN_RATE_HIGH;
  const incomeTax = ipnOf(taxableIncome);
  const incomeTaxWithoutSocial = ipnOf(taxableBeforeSocial);
  const totalEmployeeDeductions = opv + vosms + incomeTax;

  // СН 6% (новый НК РК 2026): база = доход − ОПВ − ВОСМС, но не менее 14 МРП.
  // Уплачивается в т.ч. за особые категории (пенсионеров, лиц с инвалидностью).
  const snBase = Math.max(gross - opv - vosms, SN_MIN_BASE);
  const sn = snBase * SN_RATE;

  // СО 5 % с дохода за минусом ОПВ, но не ниже 1 МЗП и не выше 7 МЗП (Соцкодекс ст. 245 п. 1).
  // Пол действует на календарный месяц целиком — и при неполном месяце (5 дней из 21).
  const soFloorApplied = !isSpecialCategory && gross - opv < SO_MIN_BASE;
  const soBase = Math.min(Math.max(gross - opv, SO_MIN_BASE), SO_MAX_BASE);
  const so = isSpecialCategory ? 0 : soBase * SO_RATE;

  // За пенсионеров и лиц с инвалидностью работодатель ООСМС не платит
  // (взносы за них уплачивает государство — ст. 26, 27 Закона об ОСМС)
  const oosmsBase = Math.min(gross, OOSMS_MAX_BASE);
  const oosms = isSpecialCategory ? 0 : oosmsBase * OOSMS_RATE;

  const opvrBase = Math.min(gross, OPV_MAX_BASE);
  const opvr = isSpecialCategory ? 0 : opvrBase * OPVR_RATE;

  const totalEmployerContributions = sn + so + oosms + opvr;
  const netSalary = gross - totalEmployeeDeductions;
  const totalLaborCost = gross + totalEmployerContributions;

  const effectiveEmployeeTaxRate = gross > 0 ? (totalEmployeeDeductions / gross) * 100 : 0;
  const effectiveEmployerRate = gross > 0 ? (totalEmployerContributions / gross) * 100 : 0;

  return {
    opv: Math.round(opv),
    vosms: Math.round(vosms),
    standardDeduction: Math.round(standardDeduction),
    socialDeduction: Math.round(socialDeductionMonth),
    socialDeductionMonths,
    taxableIncome: Math.round(taxableIncome),
    incomeTax: Math.round(incomeTax),
    incomeTaxWithoutSocial: Math.round(incomeTaxWithoutSocial),
    totalEmployeeDeductions: Math.round(totalEmployeeDeductions),
    sn: Math.round(sn),
    so: Math.round(so),
    soFloorApplied,
    oosms: Math.round(oosms),
    opvr: Math.round(opvr),
    totalEmployerContributions: Math.round(totalEmployerContributions),
    netSalary: Math.round(netSalary),
    totalLaborCost: Math.round(totalLaborCost),
    effectiveEmployeeTaxRate: Number(effectiveEmployeeTaxRate.toFixed(2)),
    effectiveEmployerRate: Number(effectiveEmployerRate.toFixed(2))
  };
}

/** Одна строка таблицы «несколько сотрудников» (значения полей — как в инпутах). */
export interface SalaryRow {
  id: number;
  name: string;
  gross: string;
  isPrimaryJob: boolean;
  isSpecialCategory: boolean;
  socialDeduction: SocialDeduction;
}

export type SalaryTotals = Pick<SalaryResult,
  'opv' | 'vosms' | 'incomeTax' | 'totalEmployeeDeductions' | 'netSalary'
  | 'sn' | 'so' | 'oosms' | 'opvr' | 'totalEmployerContributions' | 'totalLaborCost'
> & { gross: number; count: number };

/** Сумма по колонкам: каждая колонка итога равна сумме уже округлённых значений строк. */
export function sumSalaryRows(rows: { gross: number; result: SalaryResult }[]): SalaryTotals {
  const totals: SalaryTotals = {
    gross: 0, count: 0, opv: 0, vosms: 0, incomeTax: 0, totalEmployeeDeductions: 0, netSalary: 0,
    sn: 0, so: 0, oosms: 0, opvr: 0, totalEmployerContributions: 0, totalLaborCost: 0
  };
  for (const { gross, result } of rows) {
    if (gross <= 0) continue;
    totals.count += 1;
    totals.gross += gross;
    totals.opv += result.opv;
    totals.vosms += result.vosms;
    totals.incomeTax += result.incomeTax;
    totals.totalEmployeeDeductions += result.totalEmployeeDeductions;
    totals.netSalary += result.netSalary;
    totals.sn += result.sn;
    totals.so += result.so;
    totals.oosms += result.oosms;
    totals.opvr += result.opvr;
    totals.totalEmployerContributions += result.totalEmployerContributions;
    totals.totalLaborCost += result.totalLaborCost;
  }
  return totals;
}

/**
 * Быстрое заполнение из текста: по одной зарплате в строке, опционально с именем
 * («Иванов 300 000», «Петрова; 250000», «180000 ₸»). Строки без числа пропускаются.
 */
export function parseSalaryLines(text: string): { name: string; gross: number }[] {
  const out: { name: string; gross: number }[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^(.*?)[\s;,\t|:—-]*(\d[\d\s\u00a0_]*(?:[.,]\d+)?)\s*(?:₸|тг\.?|тенге|теңге|kzt)?\s*$/i);
    if (!m) continue;
    const gross = parseFloat(m[2].replace(/[\s\u00a0_]/g, '').replace(',', '.'));
    if (!Number.isFinite(gross) || gross <= 0) continue;
    out.push({ name: m[1].trim(), gross });
  }
  return out;
}
