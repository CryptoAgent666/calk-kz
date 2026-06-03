import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, AlertTriangle } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP_2026 = 4325;
const MZP_2026 = 85000;
const STANDARD_DEDUCTION = 30 * MRP_2026; // 129 750 ₸
const OPV_MAX_BASE = 50 * MZP_2026;
const VOSMS_MAX_BASE = 20 * MZP_2026;

function calcPrimary(gross: number) {
  const opvBase = Math.min(gross, OPV_MAX_BASE);
  const opv = opvBase * 0.10;
  const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
  const vosms = vosmsBase * 0.02;
  const taxable = Math.max(0, gross - opv - vosms - STANDARD_DEDUCTION);
  const ipn = taxable * 0.10;
  const net = gross - opv - vosms - ipn;
  return { opv, vosms, ipn, net, taxable };
}

function calcSecondary(gross: number) {
  const opvBase = Math.min(gross, OPV_MAX_BASE);
  const opv = opvBase * 0.10;
  const vosmsBase = Math.min(gross, VOSMS_MAX_BASE);
  const vosms = vosmsBase * 0.02;
  // БЕЗ стандартного вычета
  const taxable = Math.max(0, gross - opv - vosms);
  const ipn = taxable * 0.10;
  const net = gross - opv - vosms - ipn;
  return { opv, vosms, ipn, net, taxable };
}

export default function SecondJobCalculator() {
  const { t } = useTranslation('calculators');
  const { t: tCommon } = useTranslation('common');
  const [primary, setPrimary] = useState<string>('400000');
  const [secondary, setSecondary] = useState<string>('200000');
  const [type, setType] = useState<'internal' | 'external'>('external');
  const [weeklyHours, setWeeklyHours] = useState<string>('15');

  const results = useMemo(() => {
    const p = calcPrimary(parseFloat(primary) || 0);
    const s = calcSecondary(parseFloat(secondary) || 0);
    const totalGross = (parseFloat(primary) || 0) + (parseFloat(secondary) || 0);
    const totalNet = p.net + s.net;
    const totalTax = p.opv + p.vosms + p.ipn + s.opv + s.vosms + s.ipn;
    const effectiveRate = totalGross > 0 ? (totalTax / totalGross) * 100 : 0;
    const hoursExceeded = (parseFloat(weeklyHours) || 0) > 20;
    return { p, s, totalGross, totalNet, totalTax, effectiveRate, hoursExceeded };
  }, [primary, secondary, type, weeklyHours]);

  const formatNumber = (n: number) => Math.round(n).toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="second-job" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('second-job.title')}</h1>
          <p className="text-gray-600">{t('second-job.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-xl font-semibold">{t('second-job.parameters')}</h2>

          <RangeSlider label={t('second-job.primarySalary')} value={parseFloat(primary) || 0}
            onChange={v => setPrimary(String(v))} min={85000} max={3000000} step={5000} formatValue={formatNumber} />

          <RangeSlider label={t('second-job.secondarySalary')} value={parseFloat(secondary) || 0}
            onChange={v => setSecondary(String(v))} min={0} max={2000000} step={5000} formatValue={formatNumber} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('second-job.type')}</label>
            <div className="flex gap-2">
              <button onClick={() => setType('internal')}
                className={`flex-1 p-3 rounded-lg border text-sm ${type === 'internal' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {t('second-job.internal')}
              </button>
              <button onClick={() => setType('external')}
                className={`flex-1 p-3 rounded-lg border text-sm ${type === 'external' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {t('second-job.external')}
              </button>
            </div>
          </div>

          <RangeSlider label={t('second-job.weeklyHours')} value={parseFloat(weeklyHours) || 0}
            onChange={v => setWeeklyHours(String(v))} min={1} max={30} step={1} formatValue={v => `${v} ч/нед`} />

          {results.hoursExceeded && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">{t('second-job.hoursWarning')}</div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('second-job.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border border-cyan-200">
            <div className="text-sm text-gray-600">{t('second-job.totalNet')}</div>
            <div className="text-3xl font-bold text-cyan-700">{formatNumber(results.totalNet)}</div>
            <div className="text-xs text-gray-500 mt-1">{t('second-job.effectiveRate')}: {results.effectiveRate.toFixed(2)}%</div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="font-semibold text-blue-900 mb-2">{t('second-job.primaryJob')}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ОПВ: {formatNumber(results.p.opv)}</div>
                <div>ВОСМС: {formatNumber(results.p.vosms)}</div>
                <div>ИПН: {formatNumber(results.p.ipn)}</div>
                <div className="font-semibold">{tCommon('calculator.netPay')}: {formatNumber(results.p.net)}</div>
              </div>
              <div className="text-xs text-blue-700 mt-2">{t('second-job.primaryNote')}</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="font-semibold text-purple-900 mb-2">{t('second-job.secondaryJob')}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ОПВ: {formatNumber(results.s.opv)}</div>
                <div>ВОСМС: {formatNumber(results.s.vosms)}</div>
                <div>ИПН: {formatNumber(results.s.ipn)}</div>
                <div className="font-semibold">{tCommon('calculator.netPay')}: {formatNumber(results.s.net)}</div>
              </div>
              <div className="text-xs text-purple-700 mt-2">{t('second-job.secondaryNote')}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex justify-between mb-1"><span>{t('second-job.totalGross')}</span><span className="font-semibold">{formatNumber(results.totalGross)}</span></div>
            <div className="flex justify-between mb-1"><span>{t('second-job.totalTax')}</span><span className="font-semibold text-red-600">{formatNumber(results.totalTax)}</span></div>
            <div className="flex justify-between border-t pt-1"><span>{t('second-job.totalNet')}</span><span className="font-semibold text-green-600">{formatNumber(results.totalNet)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('second-job.title'),
            subtitle: type === 'internal' ? t('second-job.internal') : t('second-job.external'),
            sections: [{ title: t('second-job.resultsTitle'), data: [
              { label: t('second-job.primaryJob'), value: formatNumber(results.p.net) },
              { label: t('second-job.secondaryJob'), value: formatNumber(results.s.net) },
              { label: t('second-job.totalNet'), value: formatNumber(results.totalNet) },
              { label: t('second-job.totalTax'), value: formatNumber(results.totalTax) },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="second-job"
        />
      </div>

      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <FAQSection items={[
        { question: t('second-job.faq.q1'), answer: t('second-job.faq.a1') },
        { question: t('second-job.faq.q2'), answer: t('second-job.faq.a2') },
        { question: t('second-job.faq.q3'), answer: t('second-job.faq.a3') },
        { question: t('second-job.faq.q4'), answer: t('second-job.faq.a4') },
        { question: t('second-job.faq.q5'), answer: t('second-job.faq.a5') },
      ]} 
          sources={getSources('second-job')}
        />
      <EmbedWidget calculatorId="second-job" calculatorTitle={t('second-job.title')} />
      <LastUpdated calculatorId="second-job" />
    </div>
  );
}
