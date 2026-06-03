import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Calculator, AlertTriangle } from 'lucide-react';
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

type WorkType = 'weekend' | 'holiday' | 'night' | 'overtime12' | 'overtime3plus';

const MULTIPLIERS: Record<WorkType, number> = {
  weekend: 2.0,
  holiday: 2.0,
  night: 1.5,
  overtime12: 1.5,
  overtime3plus: 2.0,
};

export default function OvertimeCalculator() {
  const { t } = useTranslation('calculators');
  const [monthlySalary, setMonthlySalary] = useState<string>('300000');
  const [workType, setWorkType] = useState<WorkType>('weekend');
  const [hours, setHours] = useState<string>('8');
  const [monthHours, setMonthHours] = useState<string>('167');
  const [takeTimeOff, setTakeTimeOff] = useState<boolean>(false);

  const results = useMemo(() => {
    const salary = parseFloat(monthlySalary) || 0;
    const h = parseFloat(hours) || 0;
    const mh = parseFloat(monthHours) || 167;
    const mult = MULTIPLIERS[workType];

    const hourlyRate = salary / mh;
    const regularPay = hourlyRate * h;
    const overtimePay = hourlyRate * h * mult;
    const extraPay = overtimePay - regularPay;

    // Налоги с доплаты (ИПН 10%, ОПВ 10%, ВОСМС 2%)
    const opv = overtimePay * 0.10;
    const vosms = overtimePay * 0.02;
    const taxable = overtimePay - opv - vosms;
    const ipn = taxable * 0.10;
    const net = overtimePay - opv - vosms - ipn;

    // Дней отгула (если выбран)
    const daysOff = takeTimeOff && (workType === 'weekend' || workType === 'holiday') ? Math.ceil(h / 8) : 0;

    return {
      hourlyRate: Math.round(hourlyRate),
      regularPay: Math.round(regularPay),
      overtimePay: Math.round(overtimePay),
      extraPay: Math.round(extraPay),
      multiplier: mult,
      net: Math.round(net),
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      ipn: Math.round(ipn),
      daysOff,
    };
  }, [monthlySalary, hours, workType, monthHours, takeTimeOff]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="overtime" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('overtime.title')}</h1>
          <p className="text-gray-600">{t('overtime.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-xl font-semibold">{t('overtime.parameters')}</h2>

          <RangeSlider label={t('overtime.monthlySalary')} value={parseFloat(monthlySalary) || 0}
            onChange={v => setMonthlySalary(String(v))} min={85000} max={3000000} step={5000} formatValue={formatNumber} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('overtime.workType')}</label>
            <div className="space-y-2">
              {(['weekend', 'holiday', 'night', 'overtime12', 'overtime3plus'] as WorkType[]).map(wt => (
                <button key={wt} onClick={() => setWorkType(wt)}
                  className={`w-full p-3 rounded-lg border text-left ${workType === wt ? 'bg-red-50 border-red-500' : 'bg-white border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{t(`overtime.types.${wt}`)}</div>
                      <div className="text-xs text-gray-500">{t(`overtime.typesHint.${wt}`)}</div>
                    </div>
                    <div className="text-lg font-bold text-red-600">×{MULTIPLIERS[wt]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <RangeSlider label={t('overtime.hours')} value={parseFloat(hours) || 0}
            onChange={v => setHours(String(v))} min={1} max={24} step={1} formatValue={v => `${v} ч`} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('overtime.monthHours')}</label>
            <input type="number" value={monthHours} onChange={e => setMonthHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>

          {(workType === 'weekend' || workType === 'holiday') && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={takeTimeOff} onChange={e => setTakeTimeOff(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm text-gray-700">{t('overtime.takeTimeOff')}</span>
            </label>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('overtime.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-6 border border-red-200">
            <div className="text-sm text-gray-600">{t('overtime.overtimePay')}</div>
            <div className="text-3xl font-bold text-red-700">{formatNumber(results.overtimePay)}</div>
            <div className="text-sm text-gray-500 mt-1">+{formatNumber(results.extraPay)} ({t('overtime.extra')})</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>{t('overtime.hourlyRate')}</span><span className="font-semibold">{formatNumber(results.hourlyRate)}</span></div>
            <div className="flex justify-between"><span>{t('overtime.regularPay')}</span><span className="font-semibold">{formatNumber(results.regularPay)}</span></div>
            <div className="flex justify-between"><span>{t('overtime.multiplier')}</span><span className="font-semibold">×{results.multiplier}</span></div>
          </div>

          {takeTimeOff && results.daysOff > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-900">
              {t('overtime.timeOffNote', { days: results.daysOff })}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1 text-sm">
            <div className="font-medium text-blue-900 mb-2">{t('overtime.taxes')}</div>
            <div className="flex justify-between"><span>ОПВ 10%</span><span>{formatNumber(results.opv)}</span></div>
            <div className="flex justify-between"><span>ВОСМС 2%</span><span>{formatNumber(results.vosms)}</span></div>
            <div className="flex justify-between"><span>ИПН 10%</span><span>{formatNumber(results.ipn)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold"><span>{t('overtime.net')}</span><span>{formatNumber(results.net)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('overtime.title'),
            subtitle: t(`overtime.types.${workType}`),
            sections: [{ title: t('overtime.resultsTitle'), data: [
              { label: t('overtime.overtimePay'), value: formatNumber(results.overtimePay) },
              { label: t('overtime.extra'), value: formatNumber(results.extraPay) },
              { label: t('overtime.net'), value: formatNumber(results.net) },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="overtime-pay"
        />
      </div>

      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="overtime" />
      <MethodologySection steps={getMethodology('overtime')} />
      <FAQSection items={[
        { question: t('overtime.faq.q1'), answer: t('overtime.faq.a1') },
        { question: t('overtime.faq.q2'), answer: t('overtime.faq.a2') },
        { question: t('overtime.faq.q3'), answer: t('overtime.faq.a3') },
        { question: t('overtime.faq.q4'), answer: t('overtime.faq.a4') },
        { question: t('overtime.faq.q5'), answer: t('overtime.faq.a5') },
      ]} 
          sources={getSources('overtime')}
        />
      <EmbedWidget calculatorId="overtime" calculatorTitle={t('overtime.title')} />
      <LastUpdated calculatorId="overtime" />
    </div>
  );
}
