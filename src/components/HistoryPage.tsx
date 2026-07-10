import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Trash2, ClipboardCopy, Check, ArrowLeft } from 'lucide-react';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import {
  getHistory,
  removeHistoryEntry,
  clearHistory,
  historyEntryToTSV,
  HISTORY_CHANGED_EVENT,
  type HistoryEntry,
} from '../utils/calcHistory';

/**
 * /history — журнал последних расчётов (до 50): что считали, когда, ключевые
 * цифры. Копирование в Excel-формате, удаление по записи, полная очистка.
 * Данные только в localStorage устройства — на сервер ничего не уходит.
 */
export default function HistoryPage() {
  const { t, i18n } = useTranslation('common');
  const navigate = useLocalizedNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());
  const [copiedTs, setCopiedTs] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setEntries(getHistory());
    window.addEventListener(HISTORY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(HISTORY_CHANGED_EVENT, sync);
  }, []);

  const copy = async (entry: HistoryEntry) => {
    const text = historyEntryToTSV(entry);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    }
    setCopiedTs(entry.ts);
    setTimeout(() => setCopiedTs(null), 2000);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('calculator.back')}</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('history.title')}</h1>
            <p className="text-sm text-gray-500">{t('history.subtitle')}</p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={() => { clearHistory(); }}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            {t('history.clearAll')}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          <History className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-700">{t('history.emptyTitle')}</p>
          <p className="mt-1 text-sm">{t('history.emptyText')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.ts} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{entry.title}</div>
                  <div className="text-xs text-gray-400">{formatDate(entry.ts)}</div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => copy(entry)}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title={t('export.copyForExcel')}
                  >
                    {copiedTs === entry.ts ? <Check className="h-4 w-4 text-green-600" /> : <ClipboardCopy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => removeHistoryEntry(entry.ts)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('history.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-gray-100 pt-3">
                {entry.sections.flatMap((s) => s.data).slice(0, 4).map((row, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-gray-500 truncate">{row.label}</span>
                    <span className="font-medium text-gray-900 whitespace-nowrap">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">{t('history.privacyNote')}</p>
    </div>
  );
}
