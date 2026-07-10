import { Capacitor } from '@capacitor/core';

/**
 * Ненавязчивое предложение оценить приложение (место показа — RateAppToast).
 *
 * Сам диалог оценки — системный: iOS SKStoreReviewController / Google Play
 * In-App Review через @capacitor-community/in-app-review (ОС дополнительно
 * лимитирует частоту, напр. iOS ≤3 раза/год — наш тост лишь «вход»).
 *
 * Правила ненавязчивости:
 * - только в нативном приложении;
 * - юзер открыл ≥5 страниц калькуляторов И прошло ≥2 дней с первого запуска
 *   (успел получить пользу);
 * - после закрытия/автоскрытия тоста — пауза 90 дней;
 * - после тапа «Оценить» — больше не предлагаем никогда.
 *
 * ⚠️ Нативный плагин — доедет только новой сборкой в стор (не через OTA).
 */

export const OFFER_REVIEW_EVENT = 'calk:offer-review';

const KEY_VISITS = 'calk_review_visits';
const KEY_FIRST_TS = 'calk_review_first_ts';
const KEY_SNOOZE_TS = 'calk_review_snooze_ts';
const KEY_DONE = 'calk_review_done';

const MIN_VISITS = 5;
const MIN_AGE_MS = 2 * 24 * 3600 * 1000;
const SNOOZE_MS = 90 * 24 * 3600 * 1000;

function readNum(key: string): number {
  try { return Number(localStorage.getItem(key) || '0'); } catch { return 0; }
}
function write(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
}

/** Зовётся при заходе на страницу калькулятора; сам решает, предлагать ли оценку. */
export function trackCalculatorVisitForReview(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (!readNum(KEY_FIRST_TS)) write(KEY_FIRST_TS, Date.now());
  const visits = readNum(KEY_VISITS) + 1;
  write(KEY_VISITS, visits);

  if (readNum(KEY_DONE)) return;
  if (visits < MIN_VISITS) return;
  if (Date.now() - readNum(KEY_FIRST_TS) < MIN_AGE_MS) return;
  const snoozedAt = readNum(KEY_SNOOZE_TS);
  if (snoozedAt && Date.now() - snoozedAt < SNOOZE_MS) return;

  window.dispatchEvent(new CustomEvent(OFFER_REVIEW_EVENT));
}

/** Тост закрыт крестиком или сам погас → не беспокоить 90 дней. */
export function snoozeReviewOffer(): void {
  write(KEY_SNOOZE_TS, Date.now());
}

/** Тап «Оценить»: системный диалог + навсегда перестаём предлагать. */
export async function requestAppReview(): Promise<void> {
  write(KEY_DONE, 1);
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    // Система могла не показать диалог (лимит частоты) — это нормально.
  }
}
