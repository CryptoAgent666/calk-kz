import { useState, useEffect } from 'react';
import { Scale, Info, AlertTriangle } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { useTranslation } from 'react-i18next';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import LocalizedLink from '../LocalizedLink';

/**
 * Сравнитель госипотек 07.2026: 7-20-25 (7%, ≤25 лет, лимит цены 30/25/20 млн
 * по городам, только первичка), Наурыз (7% соц.уязвимые / 9% остальные,
 * ≤19 лет, лимит 36/30 млн, заявки — кампаниями), Отау (9%, ≤19 лет, 36/30 млн),
 * рыночная (ГЭСВ ~23–25%, дефолт 23,5%). Базовая ставка НБРК 17% (05.06.2026).
 */
type CityTier = 'capital' | 'big' | 'karaganda' | 'other';
// Лимит стоимости жилья по 7-20-25: Астана/Алматы/Актау/Атырау/Шымкент 30 млн, Караганда 25, прочие 20
const CAP_72025: Record<CityTier, number> = { capital: 30_000_000, big: 30_000_000, karaganda: 25_000_000, other: 20_000_000 };
// Лимит займа Наурыз/Отау: Астана/Алматы 36 млн, регионы 30 млн
const CAP_OTBASY: Record<CityTier, number> = { capital: 36_000_000, big: 30_000_000, karaganda: 30_000_000, other: 30_000_000 };
const MARKET_RATE_DEFAULT = 23.5;

function annuity(loan: number, ratePct: number, years: number): number {
  const i = ratePct / 100 / 12;
  const n = years * 12;
  if (loan <= 0 || n <= 0) return 0;
  if (i === 0) return loan / n;
  return (loan * i) / (1 - Math.pow(1 + i, -n));
}

interface ProgramResult {
  id: string;
  rate: number;
  term: number;
  monthly: number;
  overpay: number;
  eligible: boolean;
  reasonKey?: string;
}

export default function MortgageCompareCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [price, setPrice] = useState<string>('28000000');
  const [downPercent, setDownPercent] = useState<string>('20');
  const [termYears, setTermYears] = useState<string>('19');
  const [city, setCity] = useState<CityTier>('capital');
  const [vulnerable, setVulnerable] = useState(false);
  const [marketRate, setMarketRate] = useState<string>(String(MARKET_RATE_DEFAULT));

  const [programs, setPrograms] = useState<ProgramResult[]>([]);

  useEffect(() => {
    const p = parseFloat(price) || 0;
    const dp = Math.min(90, Math.max(0, parseFloat(downPercent) || 0));
    const term = Math.max(1, parseFloat(termYears) || 1);
    const loan = p * (1 - dp / 100);
    const mkt = parseFloat(marketRate) || MARKET_RATE_DEFAULT;

    const mk = (id: string, rate: number, maxTerm: number, eligible: boolean, reasonKey?: string): ProgramResult => {
      const tEff = Math.min(term, maxTerm);
      const monthly = annuity(loan, rate, tEff);
      return { id, rate, term: tEff, monthly: Math.round(monthly), overpay: Math.round(monthly * tEff * 12 - loan), eligible, reasonKey };
    };

    const nauryzRate = vulnerable ? 7 : 9;
    setPrograms([
      mk('72025', 7, 25,
        p <= CAP_72025[city] && dp >= 20,
        p > CAP_72025[city] ? 'mortgage-compare.reasonPriceCap' : dp < 20 ? 'mortgage-compare.reasonDown20' : undefined),
      mk('nauryz', nauryzRate, 19,
        loan <= CAP_OTBASY[city] && dp >= 10,
        loan > CAP_OTBASY[city] ? 'mortgage-compare.reasonLoanCap' : dp < 10 ? 'mortgage-compare.reasonDown10' : undefined),
      mk('otau', 9, 19,
        loan <= CAP_OTBASY[city] && dp >= 20,
        loan > CAP_OTBASY[city] ? 'mortgage-compare.reasonLoanCap' : dp < 20 ? 'mortgage-compare.reasonDown20' : undefined),
      mk('market', mkt, 25, true),
    ]);
  }, [price, downPercent, termYears, city, vulnerable, marketRate]);

  const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';
  const loan = Math.round((parseFloat(price) || 0) * (1 - (Math.min(90, Math.max(0, parseFloat(downPercent) || 0))) / 100));
  const eligible = programs.filter((pr) => pr.eligible);
  const best = eligible.length ? eligible.reduce((a, b) => (a.monthly <= b.monthly ? a : b)) : null;
  const market = programs.find((pr) => pr.id === 'market');
  const savings = best && market && best.id !== 'market' ? market.monthly - best.monthly : 0;

  const generateExportData = () => {
    if (!programs.length || loan <= 0) return '';
    const rows = programs
      .map((pr) => `- ${t(`mortgage-compare.program_${pr.id}`)} (${pr.rate}%${pr.term !== (parseFloat(termYears) || 0) ? `, ${pr.term} ${t('mortgage-compare.yearsShort')}` : ''}): ${pr.eligible ? `${fmt(pr.monthly)}/${t('mortgage-compare.monthShort')}, ${t('mortgage-compare.overpayLabel')} ${fmt(pr.overpay)}` : t('mortgage-compare.notEligible')}`)
      .join('\n');
    return `${t('mortgage-compare.parameters')}:
- ${t('mortgage-compare.priceLabel')}: ${fmt(parseFloat(price) || 0)}
- ${t('mortgage-compare.loanLabel')}: ${fmt(loan)}

${t('mortgage-compare.results')}:
${rows}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('mortgage-compare.heading')}</h1>
            <p className="text-gray-600">{t('mortgage-compare.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="mortgage-compare" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('mortgage-compare.parameters')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('mortgage-compare.priceLabel')}</label>
              <RangeSlider
                value={parseFloat(price) || 0}
                onChange={(v) => setPrice(String(v))}
                min={5_000_000} max={80_000_000} step={500_000}
                formatValue={(v) => `${(v / 1_000_000).toLocaleString('ru-KZ', { maximumFractionDigits: 1 })} ${t('mortgage-compare.mln')}`}
                color="#6366f1"
              />
              <input
                type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('mortgage-compare.cityLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['capital', 'big', 'karaganda', 'other'] as CityTier[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      city === c ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`mortgage-compare.city_${c}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('mortgage-compare.downLabel')}</label>
              <RangeSlider
                value={parseFloat(downPercent) || 0}
                onChange={(v) => setDownPercent(String(v))}
                min={0} max={70} step={5}
                formatValue={(v) => `${v}%`}
                color="#6366f1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('mortgage-compare.termLabel')}</label>
              <RangeSlider
                value={parseFloat(termYears) || 0}
                onChange={(v) => setTermYears(String(v))}
                min={3} max={25} step={1}
                formatValue={(v) => `${v} ${t('mortgage-compare.yearsShort')}`}
                color="#6366f1"
              />
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox" checked={vulnerable}
                onChange={(e) => setVulnerable(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{t('mortgage-compare.vulnerableLabel')}</span>
                <br /><span className="text-gray-500">{t('mortgage-compare.vulnerableHint')}</span>
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('mortgage-compare.marketRateLabel')}</label>
              <RangeSlider
                value={parseFloat(marketRate) || 0}
                onChange={(v) => setMarketRate(String(v))}
                min={15} max={30} step={0.5}
                formatValue={(v) => `${v}%`}
                color="#6366f1"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('mortgage-compare.results')}</h2>
          <p className="text-sm text-gray-500 mb-6">{t('mortgage-compare.loanLabel')}: <span className="font-semibold text-gray-900">{fmt(loan)}</span></p>
          <div className="space-y-3">
            {programs.map((pr) => (
              <div
                key={pr.id}
                className={`rounded-lg border p-4 ${
                  !pr.eligible ? 'border-gray-200 bg-gray-50 opacity-70' : best && pr.id === best.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{t(`mortgage-compare.program_${pr.id}`)}</span>
                    <span className="ml-2 text-xs text-gray-500">{pr.rate}% · {pr.term} {t('mortgage-compare.yearsShort')}</span>
                    {best && pr.id === best.id && pr.eligible && (
                      <span className="ml-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">{t('mortgage-compare.bestBadge')}</span>
                    )}
                  </div>
                  {pr.eligible ? (
                    <span className="text-lg font-bold text-indigo-700">{fmt(pr.monthly)}<span className="text-xs font-normal text-gray-500">/{t('mortgage-compare.monthShort')}</span></span>
                  ) : (
                    <span className="text-xs font-medium text-red-500">{t('mortgage-compare.notEligible')}</span>
                  )}
                </div>
                {pr.eligible ? (
                  <p className="mt-1 text-xs text-gray-500">{t('mortgage-compare.overpayLabel')}: {fmt(pr.overpay)}</p>
                ) : (
                  pr.reasonKey && <p className="mt-1 text-xs text-red-400">{t(pr.reasonKey)}</p>
                )}
              </div>
            ))}
          </div>

          {savings > 0 && best && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3">
              <p className="text-emerald-800 text-sm">
                {t('mortgage-compare.savingsNote', { program: t(`mortgage-compare.program_${best.id}`), amount: fmt(savings), yearly: fmt(savings * 12) })}
              </p>
            </div>
          )}

          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">{t('mortgage-compare.eligibilityNote')}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-blue-50 p-3">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-800 text-sm">
                {t('mortgage-compare.crossLinkText')}{' '}
                <LocalizedLink to="/calculator/otbasy-bank" className="font-medium text-blue-700 underline hover:text-blue-900">
                  {t('mortgage-compare.crossLinkLabel')}
                </LocalizedLink>
              </p>
            </div>
          </div>
        </div>
      </div>

      {loan > 0 && (
        <div className="mt-8">
          <SharePrintButtons
            title={t('mortgage-compare.exportTitle')}
            description={t('mortgage-compare.exportDescription')}
            results={generateExportData()}
            disabled={!generateExportData()}
          />
        </div>
      )}
      {loan > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('mortgage-compare.export.title'),
              subtitle: `${t('mortgage-compare.loanLabel')}: ${fmt(loan)}`,
              sections: [{
                title: t('mortgage-compare.export.results'),
                data: programs.map((pr) => ({
                  label: `${t(`mortgage-compare.program_${pr.id}`)} (${pr.rate}%)`,
                  value: pr.eligible ? `${fmt(pr.monthly)}/${t('mortgage-compare.monthShort')}` : t('mortgage-compare.notEligible'),
                })),
              }],
              footer: t('mortgage-compare.export.footer'),
            }}
            filename="mortgage-compare"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="mortgage-compare" />
      <MethodologySection calculatorId="mortgage-compare" />
      <FAQSection
        items={[1, 2, 3, 4].map((n) => ({ question: t(`mortgage-compare.faq.q${n}`), answer: t(`mortgage-compare.faq.a${n}`) }))}
        sources={[
          { title: i18n.language === 'kk' ? '«7-20-25» бағдарламасы (КФУ)' : 'Программа «7-20-25» (КФУ)', url: 'https://kfu.kz/' },
          { title: i18n.language === 'kk' ? 'Отбасы банк — «Наурыз»' : 'Отбасы банк — «Наурыз»', url: 'https://hcsbk.kz/ru/to-get-a-loan/nauryz/' },
          { title: i18n.language === 'kk' ? 'Отбасы банк — «Отау»' : 'Отбасы банк — «Отау»', url: 'https://hcsbk.kz/ru/to-get-a-loan/otau/' },
        ]}
      />
      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="mortgage-compare" calculatorTitle={t('mortgage-compare.heading')} />
      <LastUpdated calculatorId="mortgage-compare" />
    </div>
  );
}
