import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plane, MapPin, Info } from 'lucide-react';
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

type TripType = 'domestic' | 'foreign';
type DomesticCity = 'capital' | 'regional' | 'other';
type ForeignRegion = 'cis' | 'china' | 'eu' | 'uae';

const MRP_2026 = 4325;
const DOMESTIC_DAILY_MRP: Record<DomesticCity, number> = { capital: 6, regional: 5, other: 4 };
const FOREIGN_DAILY_USD: Record<ForeignRegion, number> = { cis: 75, china: 80, eu: 120, uae: 150 };

export default function BusinessTripCalculator() {
  const { t } = useTranslation('calculators');
  const [tripType, setTripType] = useState<TripType>('domestic');
  const [domesticCity, setDomesticCity] = useState<DomesticCity>('regional');
  const [foreignRegion, setForeignRegion] = useState<ForeignRegion>('cis');
  const [days, setDays] = useState<string>('5');
  const [usdRate, setUsdRate] = useState<string>('470');
  const [accommodation, setAccommodation] = useState<string>('15000');
  const [transport, setTransport] = useState<string>('60000');
  const [avgDaySalary, setAvgDaySalary] = useState<string>('15000');

  const results = useMemo(() => {
    const n = parseFloat(days) || 0;
    const rate = parseFloat(usdRate) || 470;
    let dailyPerDay = 0;

    if (tripType === 'domestic') {
      dailyPerDay = DOMESTIC_DAILY_MRP[domesticCity] * MRP_2026;
    } else {
      dailyPerDay = FOREIGN_DAILY_USD[foreignRegion] * rate;
    }

    const dailyTotal = dailyPerDay * n;
    const accTotal = (parseFloat(accommodation) || 0) * n;
    const transTotal = parseFloat(transport) || 0;
    const salaryTotal = (parseFloat(avgDaySalary) || 0) * n;
    const total = dailyTotal + accTotal + transTotal + salaryTotal;
    const advance = total * 0.75;

    // Налогообложение сверхнормативных сумм (НК РК 2026, ст. 366): не облагаются ИПН суточные
    // в пределах 6 МРП/сутки по РК и 8 МРП/сутки за рубежом. Превышение суточных — доход работника.
    // Проживание и проезд (ст. 260) возмещаются по факту и НЕ ограничены лимитом в МРП.
    const dailyTaxFreeLimit = (tripType === 'domestic' ? 6 : 8) * MRP_2026; // per day
    const overLimit = Math.max(0, dailyPerDay - dailyTaxFreeLimit) * n;
    const taxOnOverLimit = overLimit * 0.10;

    return {
      dailyPerDay: Math.round(dailyPerDay),
      dailyTotal: Math.round(dailyTotal),
      accTotal: Math.round(accTotal),
      transTotal: Math.round(transTotal),
      salaryTotal: Math.round(salaryTotal),
      total: Math.round(total),
      advance: Math.round(advance),
      overLimit: Math.round(overLimit),
      taxOnOverLimit: Math.round(taxOnOverLimit),
    };
  }, [tripType, domesticCity, foreignRegion, days, usdRate, accommodation, transport, avgDaySalary]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="business-trip" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-sky-600 rounded-lg flex items-center justify-center">
          <Plane className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('business-trip.title')}</h1>
          <p className="text-gray-600">{t('business-trip.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-xl font-semibold">{t('business-trip.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('business-trip.tripType')}</label>
            <div className="flex gap-2">
              <button onClick={() => setTripType('domestic')}
                className={`flex-1 p-3 rounded-lg border ${tripType === 'domestic' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {t('business-trip.domestic')}
              </button>
              <button onClick={() => setTripType('foreign')}
                className={`flex-1 p-3 rounded-lg border ${tripType === 'foreign' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {t('business-trip.foreign')}
              </button>
            </div>
          </div>

          {tripType === 'domestic' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('business-trip.cityCategory')}</label>
              <div className="space-y-2">
                {(['capital', 'regional', 'other'] as DomesticCity[]).map(c => (
                  <button key={c} onClick={() => setDomesticCity(c)}
                    className={`w-full p-3 rounded-lg border text-left ${domesticCity === c ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300'}`}>
                    <div className="text-sm font-medium">{t(`business-trip.city.${c}`)}</div>
                    <div className="text-xs text-gray-500">{DOMESTIC_DAILY_MRP[c]} МРП = {formatNumber(DOMESTIC_DAILY_MRP[c] * MRP_2026)}/сут</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('business-trip.region')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cis', 'china', 'eu', 'uae'] as ForeignRegion[]).map(r => (
                    <button key={r} onClick={() => setForeignRegion(r)}
                      className={`p-3 rounded-lg border text-xs ${foreignRegion === r ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300'}`}>
                      <div className="font-medium">{t(`business-trip.regions.${r}`)}</div>
                      <div className="text-gray-500">{FOREIGN_DAILY_USD[r]} USD/сут</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('business-trip.usdRate')}</label>
                <input type="number" value={usdRate} onChange={e => setUsdRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </>
          )}

          <RangeSlider label={t('business-trip.days')} value={parseFloat(days) || 0}
            onChange={v => setDays(String(v))} min={1} max={60} step={1} formatValue={v => `${v} дн.`} />
          <RangeSlider label={t('business-trip.accommodation')} value={parseFloat(accommodation) || 0}
            onChange={v => setAccommodation(String(v))} min={0} max={100000} step={1000} formatValue={formatNumber} />
          <RangeSlider label={t('business-trip.transport')} value={parseFloat(transport) || 0}
            onChange={v => setTransport(String(v))} min={0} max={500000} step={5000} formatValue={formatNumber} />
          <RangeSlider label={t('business-trip.avgDaySalary')} value={parseFloat(avgDaySalary) || 0}
            onChange={v => setAvgDaySalary(String(v))} min={0} max={100000} step={1000} formatValue={formatNumber} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('business-trip.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-lg p-6 border border-indigo-200">
            <div className="text-sm text-gray-600">{t('business-trip.total')}</div>
            <div className="text-3xl font-bold text-indigo-700">{formatNumber(results.total)}</div>
            <div className="text-sm text-gray-500 mt-1">{t('business-trip.advance')}: {formatNumber(results.advance)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between p-3 bg-gray-50 rounded"><span>{t('business-trip.dailyTotal')}</span><span className="font-semibold">{formatNumber(results.dailyTotal)}</span></div>
            <div className="flex justify-between p-3 bg-gray-50 rounded"><span>{t('business-trip.accTotal')}</span><span className="font-semibold">{formatNumber(results.accTotal)}</span></div>
            <div className="flex justify-between p-3 bg-gray-50 rounded"><span>{t('business-trip.transTotal')}</span><span className="font-semibold">{formatNumber(results.transTotal)}</span></div>
            <div className="flex justify-between p-3 bg-gray-50 rounded"><span>{t('business-trip.salaryTotal')}</span><span className="font-semibold">{formatNumber(results.salaryTotal)}</span></div>
          </div>

          {results.taxOnOverLimit > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <div className="font-medium">{t('business-trip.taxWarning')}</div>
                  <div>{t('business-trip.taxAmount')}: {formatNumber(results.taxOnOverLimit)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <MapPin className="w-4 h-4 inline mr-1" />
            {t('business-trip.normNote')}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('business-trip.title'),
            subtitle: `${days} дн.`,
            sections: [{ title: t('business-trip.resultsTitle'), data: [
              { label: t('business-trip.dailyTotal'), value: formatNumber(results.dailyTotal) },
              { label: t('business-trip.accTotal'), value: formatNumber(results.accTotal) },
              { label: t('business-trip.transTotal'), value: formatNumber(results.transTotal) },
              { label: t('business-trip.salaryTotal'), value: formatNumber(results.salaryTotal) },
              { label: t('business-trip.total'), value: formatNumber(results.total) },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="business-trip"
        />
      </div>

      <LegalDisclaimer type="social" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="business-trip" />
      <MethodologySection steps={getMethodology('business-trip')} />
      <FAQSection items={[
        { question: t('business-trip.faq.q1'), answer: t('business-trip.faq.a1') },
        { question: t('business-trip.faq.q2'), answer: t('business-trip.faq.a2') },
        { question: t('business-trip.faq.q3'), answer: t('business-trip.faq.a3') },
        { question: t('business-trip.faq.q4'), answer: t('business-trip.faq.a4') },
        { question: t('business-trip.faq.q5'), answer: t('business-trip.faq.a5') },
      ]} 
          sources={getSources('business-trip')}
        />
      <EmbedWidget calculatorId="business-trip" calculatorTitle={t('business-trip.title')} />
      <LastUpdated calculatorId="business-trip" />
    </div>
  );
}
