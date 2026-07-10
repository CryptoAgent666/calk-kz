/**
 * История расчётов — централизованная, БЕЗ правки 120 калькуляторов.
 *
 * Источник данных: ExportButtons. Каждый калькулятор и так собирает ExportData
 * (title + sections[label/value]) при каждом рендере результатов — мы просто
 * сохраняем последний снапшот (дебаунс 2.5 с после «затишья» ввода, дедуп по
 * содержимому). localStorage, максимум 50 записей, новые сверху.
 */

export interface HistorySection {
  title?: string;
  data: { label: string; value: string | number }[];
}

export interface HistoryEntry {
  /** Стабильный ключ калькулятора (filename из ExportButtons, напр. dividend-tax-calculation) */
  key: string;
  title: string;
  ts: number;
  sections: HistorySection[];
}

const STORAGE_KEY = 'calk_calc_history';
const MAX_ENTRIES = 50;
const DEBOUNCE_MS = 2500;

export const HISTORY_CHANGED_EVENT = 'calk:history-changed';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGED_EVENT));
  } catch {
    /* приватный режим/квота — история не критична */
  }
}

function fingerprint(sections: HistorySection[]): string {
  return JSON.stringify(sections);
}

/** Зовётся из ExportButtons на каждое изменение данных; сам дебаунсит и дедупит. */
export function saveCalcSnapshot(key: string, title: string, sections: HistorySection[]): void {
  if (!key || !sections?.length) return;
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      const entries = read();
      const fp = fingerprint(sections);
      const last = entries.find((e) => e.key === key);
      // Тот же расчёт с теми же цифрами — не плодим дубликаты.
      if (last && fingerprint(last.sections) === fp) return;
      const entry: HistoryEntry = { key, title, ts: Date.now(), sections };
      write([entry, ...entries]);
    }, DEBOUNCE_MS)
  );
}

export function getHistory(): HistoryEntry[] {
  return read();
}

export function removeHistoryEntry(ts: number): void {
  write(read().filter((e) => e.ts !== ts));
}

export function clearHistory(): void {
  write([]);
}

/** Запись → TSV для вставки в Excel/Sheets (тот же формат, что «Копировать в Excel»). */
export function historyEntryToTSV(entry: HistoryEntry): string {
  const rows: string[] = [entry.title];
  entry.sections.forEach((s) => {
    if (s.title) rows.push(s.title);
    s.data.forEach((i) => rows.push(`${i.label}\t${i.value}`));
  });
  return rows.join('\n');
}
