import { useState, useMemo } from 'react';
import { CalendarDays, Calculator, Info } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';

/**
 * Производственный календарь РК 2026: рабочие дни/часы между датами + норма.
 *
 * Нерабочие даты 2026 = выходные (сб/вс) + праздники ТК РК с переносами
 * (ПП о переносах). Набор HOLIDAYS_2026 даёт ровно 246 рабочих дней / 1968 ч
 * при 5-дневке 40 ч (сверено с балансом Минтруда egov.kz).
 * Праздники без переноса (даже на выходной): 7 января и 1-й день Курбан-айта.
 * ⚠️ Rollover: на 2027 обновить HOLIDAYS_2027 и переносы.
 */
const HOLIDAYS_2026 = new Set([
  '2026-01-01', '2026-01-02', '2026-01-07',
  '2026-03-08', '2026-03-09',                                  // 8 марта + перенос
  '2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25', // Наурыз + переносы
  '2026-05-01', '2026-05-07', '2026-05-09', '2026-05-11',      // 9 мая + перенос
  '2026-05-27',                                                // Курбан-айт
  '2026-07-06',                                                // День столицы
  '2026-08-30', '2026-08-31',                                  // Конституция + перенос
  '2026-10-25', '2026-10-26',                                  // Республика + перенос
  '2026-12-16',                                                // Независимость
]);

// Норма 2026 (баланс Минтруда). Только 5-дневка: набор HOLIDAYS_2026 и переносы
// заданы для пятидневки и дают ровно 246 дней (сверено помесячно с egov.kz).
// 6-дневка (298 дн/1986 ч) не поддержана — у неё суббота = короткий рабочий день
// и другая схема переносов; между-датный подсчёт был бы неточным.
const YEAR_NORM = {
  '5x40': { days: 246, hours: 1968 },
  '5x36': { days: 246, hours: 1771.2 },
} as const;

type WorkMode = keyof typeof YEAR_NORM;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Считает рабочие/календарные/нерабочие дни в диапазоне [from, to] включительно. */
function countDays(from: Date, to: Date, sixDay: boolean) {
  let calendar = 0, working = 0, weekend = 0, holiday = 0;
  const cur = new Date(from);
  while (cur <= to) {
    calendar++;
    const dow = cur.getDay(); // 0=вс, 6=сб
    const isHoliday = HOLIDAYS_2026.has(iso(cur));
    const isWeekend = sixDay ? dow === 0 : (dow === 0 || dow === 6);
    if (isHoliday) holiday++;
    else if (isWeekend) weekend++;
    else working++;
    cur.setDate(cur.getDate() + 1);
  }
  return { calendar, working, weekend, holiday };
}

export default function ProductionCalendarCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [mode, setMode] = useState<WorkMode>('5x40');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через
  // useState(нули) + useEffect: пререндер сохраняет страницу уже с числами, и
  // если первый клиентский рендер отдаёт нули — React валит гидратацию (#418/#425).
  const EMPTY_RESULTS = { calendar: 0, working: 0, weekend: 0, holiday: 0, hours: 0 };

  const results = useMemo(() => {
    const from = new Date(startDate);
    const to = new Date(endDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
      return EMPTY_RESULTS;
    }
    const c = countDays(from, to, false);
    // средняя длина рабочего дня: год-норма часов / год-норма дней
    const norm = YEAR_NORM[mode];
    const hoursPerDay = norm.hours / norm.days;
    return { ...c, hours: Math.round(c.working * hoursPerDay * 10) / 10 };
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [startDate, endDate, mode]);

  const nf = (n: number) => n.toLocaleString('ru-KZ');

  const generateExportData = () => {
    if (results.calendar <= 0) return '';
    return `${t('production-calendar.parameters')}:
- ${t('production-calendar.startLabel')}: ${startDate}
- ${t('production-calendar.endLabel')}: ${endDate}
- ${t('production-calendar.modeLabel')}: ${t(`production-calendar.mode_${mode}`)}

${t('production-calendar.results')}:
- ${t('production-calendar.working')}: ${nf(results.working)}
- ${t('production-calendar.hours')}: ${nf(results.hours)}
- ${t('production-calendar.weekend')}: ${nf(results.weekend)}
- ${t('production-calendar.holiday')}: ${nf(results.holiday)}`;
  };

  const yearNorm = YEAR_NORM[mode];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('production-calendar.heading')}</h1>
            <p className="text-gray-600">{t('production-calendar.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="production-calendar" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('production-calendar.parameters')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('production-calendar.startLabel')}</label>
                <input
                  type="date"
                  value={startDate}
                  min="2026-01-01"
                  max="2026-12-31"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('production-calendar.endLabel')}</label>
                <input
                  type="date"
                  value={endDate}
                  min="2026-01-01"
                  max="2026-12-31"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('production-calendar.modeLabel')}</label>
              <div className="grid grid-cols-1 gap-2">
                {(['5x40', '5x36'] as WorkMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors ${
                      mode === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`production-calendar.mode_${m}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">
                  {t('production-calendar.yearNorm', { days: yearNorm.days, hours: nf(yearNorm.hours) })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('production-calendar.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4">
              <div>
                <span className="text-lg font-semibold text-gray-900">{t('production-calendar.working')}</span>
                <span className="block text-xs text-gray-500">{t('production-calendar.hours')}: {nf(results.hours)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">{nf(results.working)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('production-calendar.calendar')}</span>
              <span className="font-semibold text-gray-900">{nf(results.calendar)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('production-calendar.weekend')}</span>
              <span className="font-semibold text-gray-900">{nf(results.weekend)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('production-calendar.holiday')}</span>
              <span className="font-semibold text-gray-900">{nf(results.holiday)}</span>
            </div>

            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              {t('production-calendar.holidaysNote')}
            </div>
          </div>
        </div>
      </div>

      {results.calendar > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('production-calendar.exportTitle')}
            description={t('production-calendar.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}

      {results.calendar > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('production-calendar.export.title'),
              subtitle: `${nf(results.working)} ${t('production-calendar.export.daysLabel')}`,
              sections: [
                {
                  title: t('production-calendar.export.results'),
                  data: [
                    { label: t('production-calendar.startLabel'), value: startDate },
                    { label: t('production-calendar.endLabel'), value: endDate },
                    { label: t('production-calendar.working'), value: nf(results.working) },
                    { label: t('production-calendar.hours'), value: nf(results.hours) },
                    { label: t('production-calendar.weekend'), value: nf(results.weekend) },
                    { label: t('production-calendar.holiday'), value: nf(results.holiday) },
                  ],
                },
              ],
              footer: t('production-calendar.export.footer'),
            }}
            filename="production-calendar"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="production-calendar" />
      <MethodologySection calculatorId="production-calendar" />
      <FAQSection
        items={[
          { question: t('production-calendar.faq.q1'), answer: t('production-calendar.faq.a1') },
          { question: t('production-calendar.faq.q2'), answer: t('production-calendar.faq.a2') },
          { question: t('production-calendar.faq.q3'), answer: t('production-calendar.faq.a3') },
          { question: t('production-calendar.faq.q4'), answer: t('production-calendar.faq.a4') },
          { question: t('production-calendar.faq.q5'), answer: t('production-calendar.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'Жұмыс уақытының балансы — egov.kz' : 'Баланс рабочего времени — egov.kz', url: 'https://egov.kz/cms/ru/articles/calendar_2026' },
          { title: i18n.language === 'kk' ? 'ҚР Еңбек кодексі (мереке күндері)' : 'Трудовой кодекс РК (праздничные дни)', url: 'https://adilet.zan.kz/rus/docs/K1500000414' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="production-calendar" calculatorTitle={t('production-calendar.heading')} />
      <LastUpdated calculatorId="production-calendar" />
    </div>
  );
}
