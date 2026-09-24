// Соцплатежи ИП «за себя» по нормам 2026 года (Социальный кодекс, Закон об ОСМС).
// Один расчёт на ip-payments и tax-regime-comparison, чтобы минимальный пакет на двух
// страницах не разъезжался. Констант не менять без сверки с реестром констант
// (ip_self_min_package_monthly, ip_self_vosms_fixed_monthly, opvr_rate).
//
//  - ОПВ 10% от заявляемого дохода (1–50 МЗП — ст. 248–249 Соцкодекса);
//  - ОПВР 3,5% (2026; по ст. 251 — 4,5% с 2027, 5% с 2028) с той же базы;
//    НЕ платится, если ИП родился до 01.01.1975 (п. 6 ст. 248);
//  - СО 5% от заявляемого дохода (1–7 МЗП — ст. 245; без вычета ОПВ у ИП);
//  - ВОСМС фикс: 5% × 1,4 МЗП = 5 950 ₸/мес (ст. 28 Закона об ОСМС).
// ООСМС 3% — отчисления работодателя за наёмных работников: «за себя» ИП их не платит.
// Минимальный пакет при заявляемом доходе 1 МЗП: 21 675 ₸/мес
// (8 500 + 2 975 + 4 250 + 5 950); без ОПВР (род. до 1975) — 18 700 ₸/мес.

export const MZP_2026 = 85000;
const OPV_RATE = 0.10;
const OPVR_RATE_2026 = 0.035;
const SO_RATE = 0.05;
const VOSMS_FIXED = Math.round(0.05 * 1.4 * MZP_2026); // 5 950
const BASE_MIN = MZP_2026;            // 85 000
const BASE_MAX_OPV = 50 * MZP_2026;   // 4 250 000
const BASE_MAX_SO = 7 * MZP_2026;     // 595 000

export interface IpSelfPayments {
  opv: number;
  opvr: number;
  so: number;
  vosms: number;
  total: number;
}

// Суммы без округления: вызывающий округляет сам, итог — от точной суммы.
export function calculateIpSelfPayments2026(declaredIncome: number, bornBefore1975 = false): IpSelfPayments {
  const opvBase = Math.min(Math.max(declaredIncome, BASE_MIN), BASE_MAX_OPV);
  const soBase = Math.min(Math.max(declaredIncome, BASE_MIN), BASE_MAX_SO);
  const opv = opvBase * OPV_RATE;
  const opvr = bornBefore1975 ? 0 : opvBase * OPVR_RATE_2026;
  const so = soBase * SO_RATE;
  return { opv, opvr, so, vosms: VOSMS_FIXED, total: opv + opvr + so + VOSMS_FIXED };
}
