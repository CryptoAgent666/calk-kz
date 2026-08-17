import { useState, useMemo } from 'react';
import { Briefcase, Calculator, Info, Plus, Trash2 } from 'lucide-react';
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
 * Трудовой стаж: суммирование периодов работы по кадровой методике —
 * по каждому периоду считаются полные годы/месяцы/дни (включая день
 * увольнения), затем суммируются с переводом 30 дней → месяц, 12 мес → год.
 */
interface Period { from: string; to: string }

function diffPeriod(fromS: string, toS: string): { y: number; m: number; d: number } | null {
  const from = new Date(fromS);
  const to = new Date(toS);
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return null;
  // включительно: +1 день (день увольнения входит в стаж)
  const end = new Date(to);
  end.setDate(end.getDate() + 1);
  let y = end.getFullYear() - from.getFullYear();
  let m = end.getMonth() - from.getMonth();
  let d = end.getDate() - from.getDate();
  if (d < 0) { m -= 1; d += 30; }
  if (m < 0) { y -= 1; m += 12; }
  return { y, m, d };
}

export default function WorkExperienceCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [periods, setPeriods] = useState<Period[]>([{ from: '2018-01-10', to: '2022-06-30' }, { from: '2022-08-01', to: '2026-07-11' }]);

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const computeTotal = () => {
    // Пересекающиеся периоды (совместительство) НЕ удваивают стаж: календарный
    // трудовой стаж считается по объединению интервалов, а не по их сумме.
    // Раньше 2020–2023 + 2022–2026 давали «7 л. 11 мес.» вместо честных 6,5 лет.
    const intervals = periods
      .map((p) => ({ from: new Date(p.from), to: new Date(p.to) }))
      .filter((iv) => !isNaN(+iv.from) && !isNaN(+iv.to) && iv.to >= iv.from)
      .sort((a, b) => +a.from - +b.from);
    const valid = intervals.length;
    const merged: typeof intervals = [];
    for (const iv of intervals) {
      const last = merged[merged.length - 1];
      // +1 день: смежные периоды («…по 30.06» и «с 01.07») — непрерывный стаж
      if (last && +iv.from <= +last.to + 86_400_000) {
        if (+iv.to > +last.to) last.to = iv.to;
      } else {
        merged.push({ ...iv });
      }
    }
    let y = 0, m = 0, d = 0;
    for (const iv of merged) {
      const r = diffPeriod(iv.from.toISOString().slice(0, 10), iv.to.toISOString().slice(0, 10));
      if (!r) continue;
      y += r.y; m += r.m; d += r.d;
    }
    m += Math.floor(d / 30); d = d % 30;
    y += Math.floor(m / 12); m = m % 12;
    return { y, m, d, valid };
  };

  const total = useMemo(
    computeTotal,
     
    [periods]
  );

  const upd = (i: number, k: keyof Period, v: string) =>
    setPeriods((ps) => ps.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const add = () => setPeriods((ps) => [...ps, { from: '', to: '' }]);
  const del = (i: number) => setPeriods((ps) => ps.filter((_, idx) => idx !== i));

  const totalText = t('work-experience.totalFmt', { y: total.y, m: total.m, d: total.d });

  const generateExportData = () => {
    if (!total.valid) return '';
    const lines = periods
      .map((p, i) => {
        const r = diffPeriod(p.from, p.to);
        return r ? `- ${t('work-experience.period')} ${i + 1}: ${p.from} — ${p.to} (${t('work-experience.totalFmt', { y: r.y, m: r.m, d: r.d })})` : null;
      })
      .filter(Boolean);
    return `${t('work-experience.parameters')}:\n${lines.join('\n')}\n\n${t('work-experience.results')}: ${totalText}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('work-experience.heading')}</h1>
            <p className="text-gray-600">{t('work-experience.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="work-experience" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('work-experience.parameters')}</h2>
          <div className="space-y-4">
            {periods.map((p, i) => {
              const r = diffPeriod(p.from, p.to);
              return (
                <div key={i} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{t('work-experience.period')} {i + 1}</span>
                    <div className="flex items-center gap-2">
                      {r && <span className="text-xs text-gray-400">{t('work-experience.totalFmt', { y: r.y, m: r.m, d: r.d })}</span>}
                      {periods.length > 1 && (
                        <button onClick={() => del(i)} aria-label={t('work-experience.remove')} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('work-experience.fromLabel')}</label>
                      <input type="date" value={p.from} onChange={(e) => upd(i, 'from', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('work-experience.toLabel')}</label>
                      <input type="date" value={p.to} onChange={(e) => upd(i, 'to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={add} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Plus className="h-4 w-4" /> {t('work-experience.addPeriod')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('work-experience.results')}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg px-4">
              <span className="text-lg font-semibold text-gray-900">{t('work-experience.totalLabel')}</span>
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-gray-600" />
                <span className="text-xl font-bold text-gray-800">{totalText}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">{t('work-experience.periodsCount')}</span>
              <span className="font-semibold text-gray-900">{total.valid}</span>
            </div>
            <div className="mt-2 rounded-lg bg-blue-50 p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{t('work-experience.methodNote')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {total.valid > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('work-experience.exportTitle')}
            description={t('work-experience.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {total.valid > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('work-experience.export.title'),
              subtitle: totalText,
              sections: [{
                title: t('work-experience.export.results'),
                data: [
                  ...periods.map((p, i) => ({ label: `${t('work-experience.period')} ${i + 1}`, value: `${p.from} — ${p.to}` })),
                  { label: t('work-experience.totalLabel'), value: totalText },
                ],
              }],
              footer: t('work-experience.export.footer'),
            }}
            filename="work-experience"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="work-experience" />
      <MethodologySection calculatorId="work-experience" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`work-experience.faq.q${n}`), answer: t(`work-experience.faq.a${n}`) }))}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Еңбек кодексі' : 'Трудовой кодекс РК', url: 'https://adilet.zan.kz/rus/docs/K1500000414' },
          { title: i18n.language === 'kk' ? 'ҚР Әлеуметтік кодексі (зейнетақы өтілі)' : 'Социальный кодекс РК (стаж для пенсии)', url: 'https://adilet.zan.kz/rus/docs/K2300000224' },
        ]}
      />
      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <EmbedWidget calculatorId="work-experience" calculatorTitle={t('work-experience.heading')} />
      <LastUpdated calculatorId="work-experience" />
    </div>
  );
}
