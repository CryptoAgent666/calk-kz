import { useCallback, useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import LocalizedLink from '../LocalizedLink';
import { useMounted } from '../../hooks/useMounted';
import {
  REMINDERS_CHANGED_EVENT,
  getCalculatorReminder,
  remindersAvailable,
  setCalculatorReminder,
} from '../../utils/reminders';

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/**
 * «🔔 Напомнить» на странице калькулятора — только в приложении (локальные
 * уведомления). Ежемесячное напоминание в выбранный день в 10:00; тап по
 * уведомлению откроет этот калькулятор. До маунта не рендерится: в статике
 * пререндера кнопки нет (там сайт, а не приложение).
 */
export function ReminderButton({ calculatorId }: { calculatorId: string }) {
  const { t } = useTranslation(['common', 'calculators']);
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [savedDay, setSavedDay] = useState<number | null>(null);
  const [day, setDay] = useState(() => Math.min(new Date().getDate(), 28));
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const sync = () => setSavedDay(getCalculatorReminder(calculatorId)?.day ?? null);
    sync();
    window.addEventListener(REMINDERS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(REMINDERS_CHANGED_EVENT, sync);
  }, [calculatorId]);

  const close = useCallback(() => { setOpen(false); setDenied(false); }, []);

  if (!mounted || !remindersAvailable()) return null;

  const openSheet = () => {
    if (savedDay) setDay(savedDay);
    setDenied(false);
    setOpen(true);
  };

  const save = async (value: number | null) => {
    setBusy(true);
    try {
      const result = await setCalculatorReminder(calculatorId, value);
      if (result === 'denied') setDenied(true);
      else close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
          savedDay
            ? 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {savedDay ? <BellRing className="h-4 w-4 text-blue-600" /> : <Bell className="h-4 w-4 text-gray-400" />}
        <span>{savedDay ? t('common:reminders.buttonSet', { day: savedDay }) : t('common:reminders.button')}</span>
      </button>

      <Modal open={open} onClose={close} labelledBy="reminder-sheet-title">
        <div className="p-5">
          <h2 id="reminder-sheet-title" className="text-lg font-bold text-gray-900">
            {t('common:reminders.sheetTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('common:reminders.sheetText', { title: t(`calculators:${calculatorId}.title`) })}
          </p>

          <div className="mt-4 text-sm font-medium text-gray-700">{t('common:reminders.dayLabel')}</div>
          <div className="mt-2 grid grid-cols-7 gap-1.5" role="radiogroup" aria-label={t('common:reminders.dayLabel')}>
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={day === d}
                onClick={() => setDay(d)}
                className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  day === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {denied && (
            <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {t('common:reminders.permissionDenied')}
            </p>
          )}

          <button
            type="button"
            onClick={() => save(day)}
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {t('common:reminders.save', { day })}
          </button>

          <div className="mt-3 flex items-center justify-between text-sm">
            {savedDay ? (
              <button type="button" onClick={() => save(null)} disabled={busy} className="text-red-600 hover:text-red-700 disabled:opacity-60">
                {t('common:reminders.remove')}
              </button>
            ) : (
              <LocalizedLink to="/reminders/" onClick={close} className="text-blue-600 hover:text-blue-800">
                {t('common:reminders.allReminders')}
              </LocalizedLink>
            )}
            <button type="button" onClick={close} className="text-gray-500 hover:text-gray-700">
              {t('common:reminders.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
