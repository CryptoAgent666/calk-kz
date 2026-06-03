import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Clock, Info } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

type Purpose = 'vacation' | 'sickLeave' | 'businessTrip' | 'dismissal' | 'maternity';

const PURPOSE_MONTHS: Record<Purpose, number> = {
  vacation: 13,
  sickLeave: 12,
  businessTrip: 12,
  dismissal: 24,
  maternity: 12,
};

export default function AverageEarningsCalculator() {
  const { t } = useTranslation('calculators');
  const [purpose, setPurpose] = useState<Purpose>('vacation');
  const [mode, setMode] = useState<'simple' | 'detailed'>('simple');
  const [monthlySalary, setMonthlySalary] = useState<string>('300000');
  const [workMonths, setWorkMonths] = useState<string>('24');
  const [yearlyBonus, setYearlyBonus] = useState<string>('100000');
  const [allowances, setAllowances] = useState<string>('0');
  const [totalPayments, setTotalPayments] = useState<string>('7200000');
  const [workedDays, setWorkedDays] = useState<string>('504');
  const [workedHours, setWorkedHours] = useState<string>('4032');

  const MZP_2026 = 85000;

  const results = useMemo(() => {
    const months = Math.min(parseFloat(workMonths) || 0, PURPOSE_MONTHS[purpose]);
    let totalPay = 0;
    let days = 0;
    let hours = 0;

    if (mode === 'simple') {
      const salary = parseFloat(monthlySalary) || 0;
      const bonus = parseFloat(yearlyBonus) || 0;
      const allow = parseFloat(allowances) || 0;
      totalPay = (salary + allow) * months + (bonus * months / 12);
      days = months * 21;
      hours = days * 8;
    } else {
      totalPay = parseFloat(totalPayments) || 0;
      days = parseFloat(workedDays) || 0;
      hours = parseFloat(workedHours) || 0;
    }

    const avgMonth = months > 0 ? totalPay / months : 0;
    const avgDay = days > 0 ? totalPay / days : 0;
    const avgHour = hours > 0 ? totalPay / hours : 0;
    const avgWeek = avgDay * 5;
    const avgYear = avgMonth * 12;

    return {
      avgMonth: Math.round(avgMonth),
      avgDay: Math.round(avgDay),
      avgHour: Math.round(avgHour),
      avgWeek: Math.round(avgWeek),
      avgYear: Math.round(avgYear),
      totalPay: Math.round(totalPay),
      months,
      days,
      vsMzp: avgMonth > 0 ? (avgMonth / MZP_2026).toFixed(1) : '0',
    };
  }, [purpose, mode, monthlySalary, workMonths, yearlyBonus, allowances, totalPayments, workedDays, workedHours]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="average-earnings" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('average-earnings.title')}</h1>
            <p className="text-gray-600">{t('average-earnings.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">{t('average-earnings.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('average-earnings.purpose')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PURPOSE_MONTHS) as Purpose[]).map(p => (
                <button key={p} onClick={() => setPurpose(p)}
                  className={`p-3 rounded-lg text-sm font-medium border transition ${
                    purpose === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}>
                  {t(`average-earnings.purposes.${p}`)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{t(`average-earnings.purposes.${purpose}Hint`)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('average-earnings.inputMode')}</label>
            <div className="flex gap-2">
              <button onClick={() => setMode('simple')}
                className={`flex-1 p-2 rounded-lg text-sm border ${mode === 'simple' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {t('average-earnings.modeSimple')}
              </button>
              <button onClick={() => setMode('detailed')}
                className={`flex-1 p-2 rounded-lg text-sm border ${mode === 'detailed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {t('average-earnings.modeDetailed')}
              </button>
            </div>
          </div>

          {mode === 'simple' ? (
            <>
              <RangeSlider label={t('average-earnings.monthlySalary')} value={parseFloat(monthlySalary) || 0}
                onChange={v => setMonthlySalary(String(v))} min={85000} max={5000000} step={5000} formatValue={formatNumber} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('average-earnings.workMonths')}</label>
                <input type="number" value={workMonths} onChange={e => setWorkMonths(e.target.value)} min="1" max="24"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <RangeSlider label={t('average-earnings.yearlyBonus')} value={parseFloat(yearlyBonus) || 0}
                onChange={v => setYearlyBonus(String(v))} min={0} max={2000000} step={10000} formatValue={formatNumber} />
              <RangeSlider label={t('average-earnings.allowances')} value={parseFloat(allowances) || 0}
                onChange={v => setAllowances(String(v))} min={0} max={500000} step={5000} formatValue={formatNumber} />
            </>
          ) : (
            <>
              <RangeSlider label={t('average-earnings.totalPayments')} value={parseFloat(totalPayments) || 0}
                onChange={v => setTotalPayments(String(v))} min={100000} max={100000000} step={50000} formatValue={formatNumber} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('average-earnings.workedDays')}</label>
                <input type="number" value={workedDays} onChange={e => setWorkedDays(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('average-earnings.workedHours')}</label>
                <input type="number" value={workedHours} onChange={e => setWorkedHours(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('average-earnings.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">{t('average-earnings.avgMonth')}</div>
            <div className="text-3xl font-bold text-blue-700">{formatNumber(results.avgMonth)}</div>
            <div className="text-xs text-gray-500 mt-1">≈ {results.vsMzp} × МЗП (2026)</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">{t('average-earnings.avgDay')}</div>
              <div className="text-lg font-bold text-gray-900">{formatNumber(results.avgDay)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">{t('average-earnings.avgHour')}</div>
              <div className="text-lg font-bold text-gray-900">{formatNumber(results.avgHour)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">{t('average-earnings.avgWeek')}</div>
              <div className="text-lg font-bold text-gray-900">{formatNumber(results.avgWeek)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">{t('average-earnings.avgYear')}</div>
              <div className="text-lg font-bold text-gray-900">{formatNumber(results.avgYear)}</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <div className="font-medium mb-1">{t('average-earnings.exampleTitle')}</div>
                <div>{t('average-earnings.exampleText', { days: 14, amount: formatNumber(results.avgDay * 14) })}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('average-earnings.title'),
            subtitle: t(`average-earnings.purposes.${purpose}`),
            sections: [
              {
                title: t('average-earnings.resultsTitle'),
                data: [
                  { label: t('average-earnings.avgMonth'), value: formatNumber(results.avgMonth) },
                  { label: t('average-earnings.avgDay'), value: formatNumber(results.avgDay) },
                  { label: t('average-earnings.avgHour'), value: formatNumber(results.avgHour) },
                ]
              }
            ],
            footer: 'Calk.kz'
          }}
          filename="average-earnings"
        />
      </div>

      <LegalDisclaimer type="social" />
      <ExpertBlock />

      <CalculatorExamples calculatorId="average-earnings" />

      <MethodologySection steps={getMethodology('average-earnings')} />

      <FAQSection
        items={[
          { question: t('average-earnings.faq.q1'), answer: t('average-earnings.faq.a1') },
          { question: t('average-earnings.faq.q2'), answer: t('average-earnings.faq.a2') },
          { question: t('average-earnings.faq.q3'), answer: t('average-earnings.faq.a3') },
          { question: t('average-earnings.faq.q4'), answer: t('average-earnings.faq.a4') },
          { question: t('average-earnings.faq.q5'), answer: t('average-earnings.faq.a5') },
        ]}
      
          sources={getSources('average-earnings')}
        />

      <EmbedWidget calculatorId="average-earnings" calculatorTitle={t('average-earnings.title')} />
      <LastUpdated calculatorId="average-earnings" />
    </div>
  );
}
