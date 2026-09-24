import { Capacitor } from '@capacitor/core';
import i18n from '../i18n';

/**
 * Напоминания о сроках — локальные уведомления в приложении (без сервера и
 * аккаунта, всё на устройстве). Зачем: 57–70% пользователей обычной недельной
 * когорты не возвращаются после первого дня (RevenueCat, 09.2026), а «убрать
 * рекламу навсегда» покупают постоянные — их ~190. Уведомление в нужный день —
 * повод вернуться с реальной задачей.
 *
 * Два вида:
 *  - готовые (PRESETS) — сроки, которые сайт уже называет в калькуляторах
 *    ИП (сверено 24.09.2026: соцплатежи за себя — до 25 числа следующего
 *    месяца; ф. 910.00 — сдать до 15 августа / 15 февраля, налог — до 25-го;
 *    zakon.kz, uchet.kz, bes.media), и коммуналка (FAQ «до 25 числа»);
 *  - свои — «каждый месяц N-го числа» для любого калькулятора.
 *
 * Модель «состояние → расписание»: состояние в localStorage, а расписание
 * пересобирается целиком (syncReminders): снять все наши id, поставить заново.
 * Так тексты следуют за языком интерфейса, а полугодовые даты 910 не кончаются.
 *
 * ⚠️ ScheduleOn.month на Android 0-based (Calendar.MONTH), на iOS 1-based —
 * одна и та же запись дала бы разные месяцы. Поэтому ежемесячные идут через
 * `on: { day, hour, minute }` (без месяца), а полугодовые — конкретными
 * датами `at` на 2 года вперёд.
 */

export type PresetId = 'ip-social' | 'form-910' | 'utilities';

interface Preset {
  id: PresetId;
  /** Куда ведёт тап по уведомлению (без языкового префикса). */
  path: string;
  /** i18n-ключ в common:reminders.presets */
  key: string;
}

export const PRESETS: Preset[] = [
  { id: 'ip-social', path: '/calculator/ip-payments/', key: 'ipSocial' },
  { id: 'form-910', path: '/calculator/ip-simplified/', key: 'form910' },
  { id: 'utilities', path: '/category/utilities/', key: 'utilities' },
];

export interface CustomReminder {
  calcId: string;
  /** День месяца 1–28 (29–31 бывают не в каждом месяце). */
  day: number;
}

interface ReminderState {
  presets: PresetId[];
  custom: CustomReminder[];
}

const STORAGE_KEY = 'calk_reminders';
const MAX_CUSTOM = 20;
const HOUR = 10;
// Ежемесячные готовые — за 5 дней до срока 25-го.
const MONTHLY_PRESET_DAY = 20;
// 910.00: за 10 дней до срока сдачи (15 августа / 15 февраля).
const FORM_910_DATES: { month: number; day: number; half: 1 | 2 }[] = [
  { month: 7, day: 5, half: 1 }, // 5 августа (месяц 0-based для new Date)
  { month: 1, day: 5, half: 2 }, // 5 февраля
];

// Диапазон id наших уведомлений: всё в нём снимается и ставится заново.
const ID_MIN = 7000;
const ID_MAX = 7999;
const ID = { ipSocial: 7001, utilities: 7002, form910Base: 7101, customBase: 7300 };

export const REMINDERS_CHANGED_EVENT = 'calk:reminders-changed';

/** Уведомления доступны: приложение и плагин в бинаре (на сайте — нет). */
export function remindersAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications');
}

export function getReminderState(): ReminderState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const presets = Array.isArray(raw.presets)
      ? raw.presets.filter((id: unknown): id is PresetId => PRESETS.some((p) => p.id === id))
      : [];
    const custom = Array.isArray(raw.custom)
      ? raw.custom.filter((c: unknown): c is CustomReminder =>
        !!c && typeof (c as CustomReminder).calcId === 'string'
        && Number.isInteger((c as CustomReminder).day)
        && (c as CustomReminder).day >= 1 && (c as CustomReminder).day <= 28)
      : [];
    return { presets, custom };
  } catch {
    return { presets: [], custom: [] };
  }
}

function writeState(state: ReminderState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* квота/приватный режим */
  }
  window.dispatchEvent(new CustomEvent(REMINDERS_CHANGED_EVENT));
}

/**
 * Модуль плагина, а НЕ сам плагин: объект плагина Capacitor — Proxy, который
 * отдаёт функцию на любое свойство, включая `then`. Верни его из async-функции
 * (или сделай `await` по нему) — промис примет его за thenable, позовёт
 * нативный «then» и зависнет навсегда (так и было в первой версии: переключатель
 * «крутился», системный запрос разрешения не появлялся). Поэтому только
 * `const { LocalNotifications } = await loadPlugin()`.
 */
function loadPlugin() {
  return import('@capacitor/local-notifications');
}

export type PermissionResult = 'granted' | 'denied';

/** Спросить разрешение на уведомления (системный диалог — только при первом включении). */
export async function ensurePermission(): Promise<PermissionResult> {
  const { LocalNotifications } = await loadPlugin();
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return 'granted';
  if (current.display === 'denied') return 'denied';
  const asked = await LocalNotifications.requestPermissions();
  return asked.display === 'granted' ? 'granted' : 'denied';
}

export async function permissionGranted(): Promise<boolean> {
  if (!remindersAvailable()) return false;
  try {
    const { LocalNotifications } = await loadPlugin();
    return (await LocalNotifications.checkPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

/** Ближайшие даты напоминаний о 910.00 (2 года вперёд). */
function next910Dates(now: Date): { at: Date; half: 1 | 2 }[] {
  const out: { at: Date; half: 1 | 2 }[] = [];
  for (let year = now.getFullYear(); year <= now.getFullYear() + 2; year += 1) {
    for (const d of FORM_910_DATES) {
      const at = new Date(year, d.month, d.day, HOUR, 0, 0);
      if (at.getTime() > now.getTime()) out.push({ at, half: d.half });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 4);
}

function buildNotifications(state: ReminderState) {
  const t = i18n.getFixedT(i18n.language === 'kk' ? 'kk' : 'ru');
  const list: {
    id: number; title: string; body: string;
    schedule: { on?: { day: number; hour: number; minute: number }; at?: Date; allowWhileIdle: boolean };
    extra: { path: string };
  }[] = [];
  const monthly = (day: number) => ({ on: { day, hour: HOUR, minute: 0 }, allowWhileIdle: true });

  for (const preset of PRESETS) {
    if (!state.presets.includes(preset.id)) continue;
    const base = `common:reminders.presets.${preset.key}`;
    if (preset.id === 'form-910') {
      next910Dates(new Date()).forEach(({ at, half }, i) => {
        list.push({
          id: ID.form910Base + i,
          title: t(`${base}.notifTitleH${half}`),
          body: t(`${base}.notifBodyH${half}`),
          schedule: { at, allowWhileIdle: true },
          extra: { path: preset.path },
        });
      });
    } else {
      list.push({
        id: preset.id === 'ip-social' ? ID.ipSocial : ID.utilities,
        title: t(`${base}.notifTitle`),
        body: t(`${base}.notifBody`),
        schedule: monthly(MONTHLY_PRESET_DAY),
        extra: { path: preset.path },
      });
    }
  }

  state.custom.slice(0, MAX_CUSTOM).forEach((c, i) => {
    list.push({
      id: ID.customBase + i,
      title: t(`calculators:${c.calcId}.title`),
      body: t('common:reminders.customBody'),
      schedule: monthly(c.day),
      extra: { path: `/calculator/${c.calcId}/` },
    });
  });
  return list;
}

/**
 * Пересобрать расписание из состояния: снять все наши уведомления и поставить
 * заново. Зовётся при старте приложения, при смене языка и после любой правки.
 */
export async function syncReminders(): Promise<void> {
  if (!remindersAvailable()) return;
  try {
    const { LocalNotifications } = await loadPlugin();
    const { notifications } = await LocalNotifications.getPending();
    const ours = notifications.filter((n) => n.id >= ID_MIN && n.id <= ID_MAX).map((n) => ({ id: n.id }));
    if (ours.length) await LocalNotifications.cancel({ notifications: ours });
    if ((await LocalNotifications.checkPermissions()).display !== 'granted') return;
    const list = buildNotifications(getReminderState());
    if (list.length) await LocalNotifications.schedule({ notifications: list });
  } catch (e) {
    console.error('[reminders] расписание не обновлено:', e);
  }
}

/** Включить/выключить готовое напоминание. При включении спрашивает разрешение. */
export async function setPresetEnabled(id: PresetId, enabled: boolean): Promise<PermissionResult> {
  if (enabled) {
    const perm = await ensurePermission();
    if (perm !== 'granted') return perm;
  }
  const state = getReminderState();
  const presets = enabled
    ? Array.from(new Set([...state.presets, id]))
    : state.presets.filter((p) => p !== id);
  writeState({ ...state, presets });
  await syncReminders();
  return 'granted';
}

export function getCalculatorReminder(calcId: string): CustomReminder | null {
  return getReminderState().custom.find((c) => c.calcId === calcId) ?? null;
}

/** Своё напоминание для калькулятора: day 1–28 — поставить/сменить, null — удалить. */
export async function setCalculatorReminder(calcId: string, day: number | null): Promise<PermissionResult> {
  if (day !== null) {
    const perm = await ensurePermission();
    if (perm !== 'granted') return perm;
  }
  const state = getReminderState();
  const others = state.custom.filter((c) => c.calcId !== calcId);
  const custom = day === null ? others : [{ calcId, day }, ...others].slice(0, MAX_CUSTOM);
  writeState({ ...state, custom });
  await syncReminders();
  return 'granted';
}

/**
 * Тап по уведомлению → открыть нужную страницу. Событие плагин держит до
 * подписки (retainUntilConsumed), поэтому работает и при холодном старте.
 */
export async function listenReminderTaps(open: (path: string) => void): Promise<() => void> {
  if (!remindersAvailable()) return () => {};
  const { LocalNotifications } = await loadPlugin();
  const handle = await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const path = (action.notification?.extra as { path?: unknown } | undefined)?.path;
    if (typeof path === 'string' && path.startsWith('/')) open(path);
  });
  return () => { void handle.remove(); };
}
