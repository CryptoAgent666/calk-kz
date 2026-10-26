/**
 * «Наурыз» и «Отау» (Отбасы банк) — не один аннуитет на 19 лет, а две стадии
 * (hcsbk.kz, страницы программ и «Предварительный заём», сверка 26.10.2026):
 *  1) предварительный заём под 7/9 % на 8 лет: платёж покрывает только вознаграждение,
 *     сверху вкладчик пополняет депозит (2 % годовых + премия государства), основной долг
 *     не гасится;
 *  2) когда на депозите 50 % суммы займа, накопления закрывают часть предварительного займа,
 *     остаток становится жилищным займом под 3,5–5 % на оставшийся срок.
 * Параметры взяты из справочной таблицы банка: на депозите в начале — 20 % суммы займа,
 * пополнение — 0,26 % суммы займа в месяц (20 млн под 9 %: 150 000 + 52 000 = 202 000 ₸).
 * Жилищный заём считаем по верхней ставке 5 %: таблица банка даёт 81 647 ₸ за 11 лет
 * на 20 млн, модель — 86 603 ₸. До 26.10.2026 сайт считал аннуитет 183 379 ₸ на все
 * 19 лет и переплату 21,8 млн при 14,2 млн в таблице банка (модель — 14,8 млн).
 */
const STAGE1_MONTHS = 96;
const START_DEPOSIT_SHARE = 0.2;
const MONTHLY_TOPUP_SHARE = 0.0026;
const DEPOSIT_RATE = 0.02;
const STATE_PREMIUM_RATE = 0.2;
// Премия начисляется на взносы за год, но не более чем на 200 МРП (Закон о ЖСС, ст. 10).
const STATE_PREMIUM_BASE_CAP = 200 * 4325;
export const OTBASY_HOUSING_LOAN_RATE = 5;
export const OTBASY_STAGE1_YEARS = STAGE1_MONTHS / 12;
/** Модель двух стадий имеет смысл, когда после 8 лет остаётся хотя бы год жилищного займа. */
export const OTBASY_MIN_TERM_YEARS = OTBASY_STAGE1_YEARS + 1;

export interface OtbasyTwoStage {
  stage1Payment: number;
  stage2Payment: number;
  stage2Months: number;
  housingLoan: number;
  totalPaid: number;
  overpayment: number;
}

export function otbasyTwoStage(loan: number, ratePct: number, termYears: number): OtbasyTwoStage {
  const stage2Months = Math.max(12, Math.round(termYears * 12) - STAGE1_MONTHS);
  const interest = loan * ratePct / 100 / 12;
  const topup = loan * MONTHLY_TOPUP_SHARE;

  let deposit = loan * START_DEPOSIT_SHARE;
  let yearContrib = 0;
  for (let m = 1; m <= STAGE1_MONTHS; m++) {
    deposit += topup;
    yearContrib += topup;
    if (m % 12 === 0) {
      deposit *= 1 + DEPOSIT_RATE;
      deposit += STATE_PREMIUM_RATE * Math.min(yearContrib, STATE_PREMIUM_BASE_CAP);
      yearContrib = 0;
    }
  }
  const housingLoan = Math.max(0, loan - deposit);
  const i = OTBASY_HOUSING_LOAN_RATE / 100 / 12;
  const stage2Payment = housingLoan > 0 ? housingLoan * i / (1 - Math.pow(1 + i, -stage2Months)) : 0;

  // Переплата — вознаграждение по обоим займам минус доход депозита (2 % и премия), то есть
  // всё, что вкладчик внёс (взнос на депозит и платежи), минус сумма займа. Так же считает
  // банк: 20 млн под 9 % — 30 169 404 выплат + 4 000 000 взноса − 20 000 000 = 14 169 408.
  const depositGain = deposit - loan * START_DEPOSIT_SHARE - topup * STAGE1_MONTHS;
  const overpayment = interest * STAGE1_MONTHS + (stage2Payment * stage2Months - housingLoan) - depositGain;

  return {
    stage1Payment: Math.round(interest + topup),
    stage2Payment: Math.round(stage2Payment),
    stage2Months,
    housingLoan: Math.round(housingLoan),
    totalPaid: Math.round((interest + topup) * STAGE1_MONTHS + stage2Payment * stage2Months),
    overpayment: Math.round(overpayment),
  };
}
