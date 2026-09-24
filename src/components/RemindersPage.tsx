import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ArrowLeft, Trash2 } from 'lucide-react';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { useMounted } from '../hooks/useMounted';
import LocalizedLink from './LocalizedLink';
import {
  PRESETS,
  REMINDERS_CHANGED_EVENT,
  getReminderState,
  permissionGranted,
  remindersAvailable,
  setCalculatorReminder,
  setPresetEnabled,
  type PresetId,
} from '../utils/reminders';

/**
 * /reminders — напоминания о сроках (только в приложении): готовые про ИП и
 * коммуналку + свои «каждый месяц N-го числа» по калькуляторам. Клиентская
 * страница без пререндера. На сайте — пояснение, что это функция приложения.
 */
export default function RemindersPage() {
  const { t } = useTranslation(['common', 'calculators']);
  const navigate = useLocalizedNavigate();
  const mounted = useMounted();
  const [state, setState] = useState(getReminderState);
  const [granted, setGranted] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setState(getReminderState());
    void permissionGranted().then(setGranted);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(REMINDERS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(REMINDERS_CHANGED_EVENT, refresh);
  }, [refresh]);

  const available = mounted && remindersAvailable();

  const togglePreset = async (id: PresetId, enabled: boolean) => {
    setBusy(id);
    try {
      const result = await setPresetEnabled(id, enabled);
      setDenied(result === 'denied');
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const removeCustom = async (calcId: string) => {
    setBusy(calcId);
    try { await setCalculatorReminder(calcId, null); } finally { setBusy(null); refresh(); }
  };

  const hasAny = state.presets.length > 0 || state.custom.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common:calculator.back')}</span>
      </button>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common:reminders.title')}</h1>
          <p className="text-sm text-gray-500">{t('common:reminders.subtitle')}</p>
        </div>
      </div>

      {!available ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          <Bell className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-800">{t('common:reminders.appOnlyTitle')}</p>
          <p className="mt-1 text-sm">{t('common:reminders.appOnlyText')}</p>
          <div className="store-badges mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <a
              href="https://apps.apple.com/kz/app/calk-kz/id6770814234"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
            >
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=calk.kz"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
            >
              Google Play
            </a>
          </div>
        </div>
      ) : (
        <>
          {(denied || (hasAny && !granted)) && (
            <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {t('common:reminders.permissionDenied')}
            </div>
          )}

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {t('common:reminders.presetsTitle')}
          </h2>
          <div className="space-y-3">
            {PRESETS.map((preset) => {
              const enabled = state.presets.includes(preset.id);
              const base = `common:reminders.presets.${preset.key}`;
              return (
                <div key={preset.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{t(`${base}.title`)}</div>
                      <p className="mt-1 text-sm leading-snug text-gray-600">{t(`${base}.desc`)}</p>
                      <LocalizedLink to={preset.path} className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800">
                        {t('common:reminders.openCalculator')}
                      </LocalizedLink>
                    </div>
                    <button
                      role="switch"
                      aria-checked={enabled}
                      aria-label={t(`${base}.title`)}
                      disabled={busy !== null}
                      onClick={() => togglePreset(preset.id, !enabled)}
                      className={`relative mt-1 h-7 w-12 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                        enabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                          enabled ? 'left-[22px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {t('common:reminders.customTitle')}
          </h2>
          {state.custom.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600">
              {t('common:reminders.customEmpty')}
            </div>
          ) : (
            <div className="space-y-3">
              {state.custom.map((c) => (
                <div key={c.calcId} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <LocalizedLink to={`/calculator/${c.calcId}/`} className="min-w-0 flex-1">
                    <div className="truncate font-medium text-gray-900 hover:text-blue-700">
                      {t(`calculators:${c.calcId}.title`)}
                    </div>
                    <div className="text-xs text-gray-500">{t('common:reminders.monthlyOn', { day: c.day })}</div>
                  </LocalizedLink>
                  <button
                    onClick={() => removeCustom(c.calcId)}
                    disabled={busy !== null}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    aria-label={t('common:reminders.delete')}
                    title={t('common:reminders.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-gray-400">{t('common:reminders.note')}</p>
        </>
      )}
    </div>
  );
}
