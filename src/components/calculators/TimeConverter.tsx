import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { QuickAnswer } from '../ui/QuickAnswer';
import { getSources } from '../../data/calculatorSources';
import { NUMBER_LOCALE } from '../../utils/localeFormat';

type Mode = 'units' | 'hm' | 'interval' | 'ampm';

// Секунд в единице. Месяц и год — средние по григорианскому календарю:
// год 365,2425 сут. (97 високосных за 400 лет), месяц = год / 12 ≈ 30,44 сут.
const UNIT_SECONDS = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2629746,
  year: 31556952,
} as const;
type Unit = keyof typeof UNIT_SECONDS;
const UNITS = Object.keys(UNIT_SECONDS) as Unit[];

const fmt = (x: number): string => {
  if (x === 0) return '0';
  return Math.abs(x) >= 1
    ? x.toLocaleString(NUMBER_LOCALE, { maximumFractionDigits: 4 })
    : x.toLocaleString(NUMBER_LOCALE, { maximumSignificantDigits: 4 });
};

const parseNum = (s: string): number => parseFloat(s.replace(',', '.'));

const toMinutes = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function TimeConverter() {
  const { t } = useTranslation('calculators');
  const [mode, setMode] = useState<Mode>('units');

  const [value, setValue] = useState<string>('45');
  const [unit, setUnit] = useState<Unit>('day');

  const [hmHours, setHmHours] = useState<string>('1');
  const [hmMinutes, setHmMinutes] = useState<string>('20');

  const [start, setStart] = useState<string>('08:00');
  const [end, setEnd] = useState<string>('18:00');
  const [breakMin, setBreakMin] = useState<string>('60');

  const [time24, setTime24] = useState<string>('23:00');

  const abbr = {
    d: t('time-converter.abbr.d'),
    h: t('time-converter.abbr.h'),
    m: t('time-converter.abbr.m'),
    s: t('time-converter.abbr.s'),
  };

  // «666 дн. 16 ч», «1 ч 40 мин» — только точные единицы (без месяцев и лет).
  const breakdown = (totalSeconds: number): string => {
    let rest = Math.round(Math.abs(totalSeconds));
    const d = Math.floor(rest / 86400); rest -= d * 86400;
    const h = Math.floor(rest / 3600); rest -= h * 3600;
    const m = Math.floor(rest / 60); rest -= m * 60;
    const out: string[] = [];
    if (d) out.push(`${d.toLocaleString(NUMBER_LOCALE)} ${abbr.d}`);
    if (h) out.push(`${h} ${abbr.h}`);
    if (m) out.push(`${m} ${abbr.m}`);
    if (rest) out.push(`${rest} ${abbr.s}`);
    return out.join(' ') || `0 ${abbr.s}`;
  };

  const unitsResult = useMemo(() => {
    const n = parseNum(value);
    if (!Number.isFinite(n) || n < 0) return null;
    const seconds = n * UNIT_SECONDS[unit];
    return { seconds, rows: UNITS.map(u => ({ unit: u, value: seconds / UNIT_SECONDS[u] })) };
  }, [value, unit]);

  const hmResult = useMemo(() => {
    const h = parseNum(hmHours || '0');
    const m = parseNum(hmMinutes || '0');
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || m < 0) return null;
    const minutes = h * 60 + m;
    return { minutes, hours: minutes / 60, seconds: minutes * 60 };
  }, [hmHours, hmMinutes]);

  const intervalResult = useMemo(() => {
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (s === null || e === null) return null;
    const overnight = e < s;
    const gross = (overnight ? e + 1440 : e) - s;
    const br = Math.max(0, Math.round(parseNum(breakMin || '0') || 0));
    const net = Math.max(0, gross - br);
    return { gross, net, overnight, hasBreak: br > 0 };
  }, [start, end, breakMin]);

  const ampmResult = useMemo(() => {
    const total = toMinutes(time24);
    if (total === null) return null;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
  }, [time24]);

  const hm = (minutes: number) => `${Math.floor(minutes / 60)} ${abbr.h} ${pad(minutes % 60)} ${abbr.m}`;

  const modes: Mode[] = ['units', 'hm', 'interval', 'ampm'];
  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg';

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="time-converter" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('time-converter.title')}</h1>
          <p className="text-gray-600">{t('time-converter.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {modes.map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`p-3 rounded-lg border text-sm ${mode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
              {t(`time-converter.modes.${m}`)}
            </button>
          ))}
        </div>

        {mode === 'units' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.value')}</label>
                <input type="number" min="0" step="any" value={value} onChange={e => setValue(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.unit')}</label>
                <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className={inputClass}>
                  {UNITS.map(u => <option key={u} value={u}>{t(`time-converter.units.${u}`)}</option>)}
                </select>
              </div>
            </div>
            {unitsResult && (
              <>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">{t('time-converter.breakdown')}</div>
                  <div className="text-2xl font-bold text-blue-700">{breakdown(unitsResult.seconds)}</div>
                </div>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {unitsResult.rows.map(r => (
                    <div key={r.unit} className={`flex justify-between px-4 py-2 ${r.unit === unit ? 'bg-blue-50 font-semibold' : ''}`}>
                      <span className="text-gray-700">{t(`time-converter.units.${r.unit}`)}</span>
                      <span className="font-mono text-gray-900">{fmt(r.value)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{t('time-converter.avgNote')}</p>
              </>
            )}
          </div>
        )}

        {mode === 'hm' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.hm.hours')}</label>
                <input type="number" min="0" step="any" value={hmHours} onChange={e => setHmHours(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.hm.minutes')}</label>
                <input type="number" min="0" step="any" value={hmMinutes} onChange={e => setHmMinutes(e.target.value)} className={inputClass} />
              </div>
            </div>
            {hmResult && (
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-gray-600">{t('time-converter.hm.totalMinutes')}</div>
                  <div className="text-2xl font-bold text-blue-700">{fmt(hmResult.minutes)} {abbr.m}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-gray-600">{t('time-converter.hm.decimalHours')}</div>
                  <div className="text-2xl font-bold text-blue-700">{fmt(hmResult.hours)} {abbr.h}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-gray-600">{t('time-converter.hm.totalSeconds')}</div>
                  <div className="text-2xl font-bold text-blue-700">{fmt(hmResult.seconds)} {abbr.s}</div>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">{t('time-converter.hm.tip')}</p>
          </div>
        )}

        {mode === 'interval' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.interval.start')}</label>
                <input type="time" value={start} onChange={e => setStart(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.interval.end')}</label>
                <input type="time" value={end} onChange={e => setEnd(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.interval.break')}</label>
                <input type="number" min="0" step="5" value={breakMin} onChange={e => setBreakMin(e.target.value)} className={inputClass} />
              </div>
            </div>
            {intervalResult && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-1">
                <div className="text-sm text-gray-600">{t('time-converter.interval.net')}</div>
                <div className="text-2xl font-bold text-blue-700">
                  {hm(intervalResult.net)} <span className="text-base font-normal text-gray-600">
                    ({fmt(intervalResult.net)} {abbr.m} = {fmt(intervalResult.net / 60)} {abbr.h})
                  </span>
                </div>
                {intervalResult.hasBreak && (
                  <div className="text-sm text-gray-600">{t('time-converter.interval.gross')}: {hm(intervalResult.gross)}</div>
                )}
                {intervalResult.overnight && (
                  <div className="text-sm text-blue-700">{t('time-converter.interval.overnight')}</div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">{t('time-converter.interval.tip')}</p>
          </div>
        )}

        {mode === 'ampm' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('time-converter.ampm.input')}</label>
                <input type="time" value={time24} onChange={e => setTime24(e.target.value)} className={inputClass} />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-sm text-gray-600">{t('time-converter.ampm.result')}</div>
                <div className="text-2xl font-bold text-blue-700">{ampmResult ?? '—'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('time-converter.ampm.table')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm font-mono">
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].flatMap(h => [
                  <div key={`am${h}`} className="text-gray-700">{h} AM = {pad(h % 12)}:00</div>,
                  <div key={`pm${h}`} className="text-gray-700">{h} PM = {pad((h % 12) + 12)}:00</div>,
                ])}
              </div>
            </div>
            <p className="text-xs text-gray-500">{t('time-converter.ampm.note')}</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('time-converter.reference.title')}</h2>
        <ul className="space-y-1 text-sm text-gray-700 list-disc pl-5">
          <li>{t('time-converter.reference.r1')}</li>
          <li>{t('time-converter.reference.r2')}</li>
          <li>{t('time-converter.reference.r3')}</li>
          <li>{t('time-converter.reference.r4')}</li>
        </ul>
      </div>

      <ExpertBlock />
      <FAQSection
        items={[
          { question: t('time-converter.faq.q1'), answer: t('time-converter.faq.a1') },
          { question: t('time-converter.faq.q2'), answer: t('time-converter.faq.a2') },
          { question: t('time-converter.faq.q3'), answer: t('time-converter.faq.a3') },
          { question: t('time-converter.faq.q4'), answer: t('time-converter.faq.a4') },
          { question: t('time-converter.faq.q5'), answer: t('time-converter.faq.a5') },
        ]}
        sources={getSources('time-converter')}
      />
      <EmbedWidget calculatorId="time-converter" calculatorTitle={t('time-converter.title')} />
      <LastUpdated calculatorId="time-converter" />
    </div>
  );
}
