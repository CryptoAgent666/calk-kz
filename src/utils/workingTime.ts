/**
 * Баланс рабочего времени РК — общий источник для всех расчётов среднего заработка.
 *
 * ЗАЧЕМ: Единые правила исчисления средней заработной платы (приказ Министра
 * здравоохранения и соцразвития РК от 30.11.2015 № 908, рег. МЮ № 12533) требуют
 * считать по РАБОЧИМ дням:
 *   п. 8 — «средний дневной (часовой) заработок определяется путем деления суммы
 *           начисленной заработной платы в расчетном периоде на количество рабочих
 *           дней (часов) в расчетном периоде»;
 *   п. 7 — «средняя заработная плата исчисляется путем умножения среднего дневного
 *           заработка на количество рабочих дней, приходящихся на период события,
 *           исходя из баланса рабочего времени при пятидневной рабочей неделе».
 *
 * До 17.08.2026 отпускные и выходное пособие делили доход на 29,3 календарных дня.
 * Такого числа в праве РК НЕТ вовсе (полнотекстовый поиск по Единым правилам и
 * по ТК РК даёт ноль вхождений) — это константа ст. 139 ТК РФ. Из-за подмены
 * строка «средний дневной заработок» была занижена примерно в 1,42 раза.
 *
 * ⚠️ Rollover: на 2027 год добавить HOLIDAYS_2027 и запись в YEAR_NORM.
 *    Набор праздников/переносов дублирует ProductionCalendarCalculator —
 *    он и есть первоисточник этих данных внутри проекта (сверен с балансом
 *    Минтруда на egov.kz: 246 рабочих дней / 1968 часов при 5-дневке — до поправки ниже).
 *
 * С 01.07.2026 30 августа больше не праздник: Закон № 306-VIII от 11.06.2026 (ст. 1 п. 26) исключил
 * его из ст. 3 Закона «О праздниках» и добавил День Конституции 15 марта. 30.08.2026 — обычное
 * воскресенье, перенос на 31.08 не возникает, и в 2026 году 247 рабочих дней / 1976 часов.
 */

/** Праздники и переносы 2026 (5-дневка). Без переноса даже на выходной:
 *  7 января и 1-й день Курбан-айта. */
const HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-02', '2026-01-07',
  '2026-03-08', '2026-03-09',
  '2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25',
  '2026-05-01', '2026-05-07', '2026-05-09', '2026-05-11',
  '2026-05-27',
  '2026-07-06',
  '2026-10-25', '2026-10-26',
  '2026-12-16',
]);

/** Праздничные дни 2026 сами по себе, без перенесённых выходных (09.03, 24–25.03, 11.05,
 *  26.10). Нужны отпуску: праздник, выпавший на отпуск, в его календарные дни не
 *  входит и продлевает отпуск (ТК ст. 90 п. 1), а перенесённый выходной входит, но не
 *  оплачивается — оплачиваются рабочие дни периода (п. 7 Правил № 908). */
const PUBLIC_HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-02', '2026-01-07', '2026-03-08',
  '2026-03-21', '2026-03-22', '2026-03-23',
  '2026-05-01', '2026-05-07', '2026-05-09', '2026-05-27',
  '2026-07-06', '2026-10-25', '2026-12-16',
]);

/** Норма рабочего времени по балансу Минтруда (5-дневка 40 ч). */
export const YEAR_WORKING_DAYS_2026 = 247;

/** Среднемесячное число РАБОЧИХ дней 2026 = 247 / 12. Используется, когда точные
 *  даты расчётного периода неизвестны (пользователь вводит только месяцы). */
export const AVG_WORKING_DAYS_PER_MONTH = YEAR_WORKING_DAYS_2026 / 12; // 20,58

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Рабочий ли день (5-дневка): не суббота/воскресенье и не праздник. */
export function isWorkingDay(d: Date): boolean {
  const dow = d.getDay(); // 0=вс, 6=сб
  if (dow === 0 || dow === 6) return false;
  return !HOLIDAYS_2026.has(iso(d));
}

/** Рабочие дни в диапазоне [from, to] включительно. */
export function countWorkingDays(from: Date, to: Date): number {
  if (isNaN(+from) || isNaN(+to) || to < from) return 0;
  let n = 0;
  const cur = new Date(from);
  while (cur <= to) {
    if (isWorkingDay(cur)) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

/** Наибольшее число рабочих дней в одном календарном месяце 2026 (22 — апрель, июнь,
 *  июль, сентябрь, декабрь). Нужен, чтобы по одному числу рабочих дней оценить,
 *  на сколько календарных месяцев минимум приходится период (лимит больничного
 *  25 МРП действует на каждый месяц отдельно, ст. 133 п. 4-1 ТК РК). */
export const MAX_WORKING_DAYS_IN_MONTH = Math.max(
  ...Array.from({ length: 12 }, (_, m) => countWorkingDays(new Date(2026, m, 1), new Date(2026, m + 1, 0)))
);

export interface MonthWorkingDays {
  /** 'YYYY-MM' */
  month: string;
  /** рабочих дней события в этом месяце */
  days: number;
  /** всего рабочих дней в месяце по календарю */
  monthWorkingDays: number;
}

/** 'YYYY-MM-DD' → локальная дата без сдвига часового пояса (new Date('2026-09-28')
 *  читается как полночь UTC и западнее Гринвича уезжает на день назад). */
export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(+d) ? null : d;
}

/** Локальная дата → 'YYYY-MM-DD'. Не toISOString(): та даёт дату по UTC, и в Казахстане
 *  (UTC+5) с полуночи до 05:00 «сегодня» превращалось во вчера. */
export function toIsoDateLocal(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Раскладывает N рабочих дней подряд, начиная с даты start, по календарным месяцам.
 * Нужна больничному: лимит 25 МРП действует на пособие за каждый месяц отдельно
 * (ст. 133 п. 4-1 ТК РК). Праздники известны только на 2026 — хвост в 2027 году
 * считается по одной пятидневке.
 */
export function splitWorkingDaysByMonth(start: Date, workingDays: number): MonthWorkingDays[] {
  const out: MonthWorkingDays[] = [];
  if (isNaN(+start) || !Number.isFinite(workingDays) || workingDays <= 0) return out;
  const cur = new Date(start);
  let left = Math.round(workingDays);
  for (let guard = 0; left > 0 && guard < 800; guard++) {
    if (isWorkingDay(cur)) {
      const month = iso(cur).slice(0, 7);
      let last = out[out.length - 1];
      if (!last || last.month !== month) {
        last = {
          month,
          days: 0,
          monthWorkingDays: countWorkingDays(
            new Date(cur.getFullYear(), cur.getMonth(), 1),
            new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
          ),
        };
        out.push(last);
      }
      last.days++;
      left--;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * Оплачиваемые рабочие дни ОТПУСКА длиной calendarDays календарных дней.
 *
 * Праздники в календарные дни отпуска не входят и продлевают его (ТК ст. 90 п. 1),
 * оплачиваются рабочие дни получившегося периода (п. 7 Правил № 908).
 * Если известна дата начала — идём по календарю. Если нет — оцениваем по годовой
 * доле: 247 рабочих дней на 351 «отпускной» (365 минус 14 праздников). Раньше делили
 * на 365, и праздники не продлевали отпуск: 24 дня давали 16,2 рабочего вместо 16,9.
 */
export function workingDaysForPeriod(calendarDays: number, startDate?: string): number {
  if (!Number.isFinite(calendarDays) || calendarDays <= 0) return 0;
  if (startDate) {
    const from = new Date(startDate);
    if (!isNaN(+from)) {
      const cur = new Date(from);
      let counted = 0;
      let paid = 0;
      for (let guard = 0; counted < Math.round(calendarDays) && guard < 800; guard++) {
        if (!PUBLIC_HOLIDAYS_2026.has(iso(cur))) {
          counted++;
          if (isWorkingDay(cur)) paid++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      return paid;
    }
  }
  return calendarDays * (YEAR_WORKING_DAYS_2026 / (365 - PUBLIC_HOLIDAYS_2026.size));
}
