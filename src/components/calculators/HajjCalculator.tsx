import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Plane } from 'lucide-react';
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

type TripType = 'hajj' | 'umra';
type Package = 'economy' | 'standard' | 'premium';

// Стоимость туров из Казахстана (2026, USD)
const PRICES: Record<TripType, Record<Package, number>> = {
  hajj: {
    economy: 5500,   // Хадж эконом (15-20 дней, отель 3*)
    standard: 7500,  // Стандарт (отель 4*, ближе к Харам)
    premium: 12000,  // VIP (отель 5*, вид на Каабу)
  },
  umra: {
    economy: 1200,   // Умра эконом (7-10 дней)
    standard: 1800,  // Стандарт
    premium: 3500,   // VIP
  },
};

export default function HajjCalculator() {
  const { t } = useTranslation('calculators');
  const [tripType, setTripType] = useState<TripType>('umra');
  const [pkg, setPkg] = useState<Package>('standard');
  const [persons, setPersons] = useState<string>('1');
  const [usdRate, setUsdRate] = useState<string>('470');
  const [addKurban, setAddKurban] = useState<boolean>(true);
  const [addSouvenirs, setAddSouvenirs] = useState<string>('300'); // USD на сувениры/еду

  const results = useMemo(() => {
    const p = parseFloat(persons) || 1;
    const rate = parseFloat(usdRate) || 470;
    const basePriceUSD = PRICES[tripType][pkg];

    // Дополнительно
    const kurbanUSD = tripType === 'hajj' && addKurban ? 150 : 0; // Курбан в Мекке
    const souvenirsUSD = parseFloat(addSouvenirs) || 0;
    // Виза включена в тур (для КЗ граждан Саудия упростила)
    // Страховка ≈ $30
    const insuranceUSD = 30;

    const perPersonUSD = basePriceUSD + kurbanUSD + souvenirsUSD + insuranceUSD;
    const totalUSD = perPersonUSD * p;
    const totalKZT = totalUSD * rate;

    // Срок ожидания хаджа — 1-5 лет в КЗ (по квоте 5000/год)
    const waitYears = tripType === 'hajj' ? '1-5 лет' : 'доступно круглый год';
    // Длительность поездки
    const duration = tripType === 'hajj' ? '15-25 дней' : '7-10 дней';

    return {
      perPersonUSD: Math.round(perPersonUSD),
      perPersonKZT: Math.round(perPersonUSD * rate),
      totalUSD: Math.round(totalUSD),
      totalKZT: Math.round(totalKZT),
      basePriceUSD,
      kurbanUSD,
      souvenirsUSD,
      insuranceUSD,
      waitYears,
      duration,
    };
  }, [tripType, pkg, persons, usdRate, addKurban, addSouvenirs]);

  const formatKZT = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';
  const formatUSD = (n: number) => '$' + n.toLocaleString('en-US');

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="hajj" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-700 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('hajj.title')}</h1>
          <p className="text-gray-600">{t('hajj.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('hajj.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('hajj.tripType')}</label>
            <div className="flex gap-2">
              <button onClick={() => setTripType('hajj')}
                className={`flex-1 p-4 rounded-lg border ${tripType === 'hajj' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-gray-300'}`}>
                <div className="text-lg">🕋 {t('hajj.hajj')}</div>
                <div className="text-xs opacity-75">{t('hajj.hajjHint')}</div>
              </button>
              <button onClick={() => setTripType('umra')}
                className={`flex-1 p-4 rounded-lg border ${tripType === 'umra' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-gray-300'}`}>
                <div className="text-lg">🌙 {t('hajj.umra')}</div>
                <div className="text-xs opacity-75">{t('hajj.umraHint')}</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('hajj.package')}</label>
            <div className="space-y-2">
              {(['economy', 'standard', 'premium'] as Package[]).map(p => (
                <button key={p} onClick={() => setPkg(p)}
                  className={`w-full p-3 rounded-lg border text-left ${pkg === p ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{t(`hajj.packages.${p}`)}</div>
                      <div className="text-xs text-gray-500">{t(`hajj.packageHints.${p}`)}</div>
                    </div>
                    <div className="font-bold text-emerald-700">${PRICES[tripType][p]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <RangeSlider label={t('hajj.persons')} value={parseFloat(persons) || 0}
            onChange={v => setPersons(String(v))} min={1} max={10} step={1} formatValue={v => `${v} ${t('hajj.personsUnit')}`} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('hajj.usdRate')}</label>
            <input type="number" value={usdRate} onChange={e => setUsdRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>

          {tripType === 'hajj' && (
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={addKurban} onChange={e => setAddKurban(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('hajj.kurbanInMecca')} (+$150)</span>
            </label>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('hajj.souvenirs')} ($)</label>
            <input type="number" value={addSouvenirs} onChange={e => setAddSouvenirs(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('hajj.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border-2 border-emerald-300">
            <div className="text-sm text-gray-600">{t('hajj.totalCost')}</div>
            <div className="text-4xl font-bold text-emerald-700">{formatKZT(results.totalKZT)}</div>
            <div className="text-sm text-gray-600 mt-1">≈ {formatUSD(results.totalUSD)}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="font-medium mb-2">{t('hajj.perPerson')}</div>
            <div className="flex justify-between"><span>{formatUSD(results.perPersonUSD)}</span><span className="font-semibold">{formatKZT(results.perPersonKZT)}</span></div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('hajj.base')}</span>
              <span className="font-semibold">{formatUSD(results.basePriceUSD)}</span>
            </div>
            {results.kurbanUSD > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('hajj.kurbanInMecca')}</span>
                <span className="font-semibold">{formatUSD(results.kurbanUSD)}</span>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
              <span>{t('hajj.insurance')}</span>
              <span className="font-semibold">{formatUSD(results.insuranceUSD)}</span>
            </div>
            {results.souvenirsUSD > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                <span>{t('hajj.souvenirs')}</span>
                <span className="font-semibold">{formatUSD(results.souvenirsUSD)}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 space-y-1">
            <div className="flex items-center gap-2"><Plane className="w-4 h-4" /> <span>{t('hajj.duration')}: {results.duration}</span></div>
            <div>⏳ {t('hajj.waitTime')}: {results.waitYears}</div>
            <div className="text-xs text-blue-700 mt-2">ℹ️ {t('hajj.includedNote')}</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('hajj.title'),
            subtitle: `${t(`hajj.${tripType}`)} • ${t(`hajj.packages.${pkg}`)}`,
            sections: [{ title: t('hajj.resultsTitle'), data: [
              { label: t('hajj.totalCost'), value: `${formatKZT(results.totalKZT)} (${formatUSD(results.totalUSD)})` },
              { label: t('hajj.perPerson'), value: formatUSD(results.perPersonUSD) },
              { label: t('hajj.duration'), value: results.duration },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="hajj-umra"
        />
      </div>

      <LegalDisclaimer type="religious" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="hajj" />
      <MethodologySection steps={getMethodology('hajj')} />
      <FAQSection items={[
        { question: t('hajj.faq.q1'), answer: t('hajj.faq.a1') },
        { question: t('hajj.faq.q2'), answer: t('hajj.faq.a2') },
        { question: t('hajj.faq.q3'), answer: t('hajj.faq.a3') },
        { question: t('hajj.faq.q4'), answer: t('hajj.faq.a4') },
        { question: t('hajj.faq.q5'), answer: t('hajj.faq.a5') },
      ]} 
          sources={getSources('hajj')}
        />
      <EmbedWidget calculatorId="hajj" calculatorTitle={t('hajj.title')} />
      <LastUpdated calculatorId="hajj" />
    </div>
  );
}
