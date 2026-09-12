import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, TrendingUp, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

// Госипотеки 2026. Сверка 13.09.2026 по первоисточникам (kfu.kz, baspana72025.kz, hcsbk.kz):
// - «7-20-25» — НЕ продукт Отбасы банка: оператор АО «Казахстанский фонд устойчивости»
//   (КФУ), Отбасы среди банков-участников нет. 7 %, взнос от 20 %, до 25 лет, только
//   новостройки. Ограничена СТОИМОСТЬ ЖИЛЬЯ (не заём): 30 млн Астана/Алматы/Актау/Атырау/
//   Шымкент, 25 млн Караганда, 20 млн прочие (пост. НБ РК № 59 от 26.09.2025). Комиссии
//   за выдачу и обслуживание у оператора запрещены.
// - «Наурыз» и «Отау» (Отбасы банк): ДВЕ ставки — 7 % для состоящих на учёте по категории
//   СУСН, 9 % для остальных очередников; взнос от 20 %; до 19 лет; лимит ЗАЙМА 36 млн
//   в Астане/Алматы и 30 млн в регионах. «Наурыз» — заявки кампаниями.
// «Баспана хит» и «Баспана/Жас Отбасы» как ипотечные продукты не существуют — убраны.
type CityTier = 'capital' | 'big' | 'karaganda' | 'other';
const CITY_TIERS: CityTier[] = ['capital', 'big', 'karaganda', 'other'];

interface Program {
  id: string;
  labelKey: string;
  operatorKey: string;    // кто выдаёт: КФУ или Отбасы банк
  rate: number;           // базовая годовая ставка, %
  vulnerableRate?: number;// ставка для СУСН-очередников (двухуровневая шкала)
  maxTerm: number;        // макс. срок, лет
  downPaymentMin: number; // мин. первоначальный взнос, %
  capKind: 'price' | 'loan'; // что ограничено: стоимость жилья или сумма займа
  cap: Record<CityTier, number>;
}

const programs: Program[] = [
  { id: '7-20-25', labelKey: 'otbasy-bank.programs.program72025', operatorKey: 'otbasy-bank.operatorKfu',
    rate: 7, maxTerm: 25, downPaymentMin: 20, capKind: 'price',
    cap: { capital: 30_000_000, big: 30_000_000, karaganda: 25_000_000, other: 20_000_000 } },
  { id: 'nauryz', labelKey: 'otbasy-bank.programs.nauryz', operatorKey: 'otbasy-bank.operatorOtbasy',
    rate: 9, vulnerableRate: 7, maxTerm: 19, downPaymentMin: 20, capKind: 'loan',
    cap: { capital: 36_000_000, big: 30_000_000, karaganda: 30_000_000, other: 30_000_000 } },
  { id: 'otau', labelKey: 'otbasy-bank.programs.otau', operatorKey: 'otbasy-bank.operatorOtbasy',
    rate: 9, vulnerableRate: 7, maxTerm: 19, downPaymentMin: 20, capKind: 'loan',
    cap: { capital: 36_000_000, big: 30_000_000, karaganda: 30_000_000, other: 30_000_000 } },
];

function calcAnnuity(principal: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1));
}

export default function OtbasyBankCalculator() {
  const { t } = useTranslation('calculators');

  const [selectedProgram, setSelectedProgram] = useState('7-20-25');
  const [propertyPrice, setPropertyPrice] = useState<string>('25000000');
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>('20');
  const [term, setTerm] = useState<string>('20');
  const [city, setCity] = useState<CityTier>('capital');
  const [vulnerable, setVulnerable] = useState(false);

  const program = programs.find((p) => p.id === selectedProgram)!;

  const results = useMemo(() => {
    const price = parseFloat(propertyPrice) || 0;
    const dpPercent = parseFloat(downPaymentPercent) || 0;
    const termYears = parseInt(term) || 0;

    if (price <= 0 || termYears <= 0) return null;

    const downPayment = Math.round(price * (dpPercent / 100));
    const actualLoan = Math.max(0, price - downPayment);
    const rate = vulnerable && program.vulnerableRate ? program.vulnerableRate : program.rate;
    const capValue = program.cap[city];

    const monthlyPayment = calcAnnuity(actualLoan, rate, termYears);
    const totalPayments = monthlyPayment * termYears * 12;
    const overpayment = totalPayments - actualLoan;
    const requiredIncome = Math.round(monthlyPayment / 0.5); // DTI не более 50%

    const isDownPaymentOk = dpPercent >= program.downPaymentMin;
    const isTermOk = termYears <= program.maxTerm;
    // 7-20-25 ограничивает стоимость жилья, Наурыз/Отау — сумму займа.
    const isAmountOk = program.capKind === 'price' ? price <= capValue : actualLoan <= capValue;

    return {
      rate,
      capValue,
      downPayment,
      loanAmount: actualLoan,
      monthlyPayment,
      totalPayments,
      overpayment,
      requiredIncome,
      isDownPaymentOk,
      isTermOk,
      isAmountOk,
      isEligible: isDownPaymentOk && isTermOk && isAmountOk,
    };
  }, [propertyPrice, downPaymentPercent, term, program, city, vulnerable]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const pieData = useMemo(() => {
    if (!results || results.loanAmount <= 0) return [];
    return [
      { name: t('otbasy-bank.downPayment'), value: results.downPayment },
      { name: t('otbasy-bank.loanBody'), value: results.loanAmount },
      { name: t('otbasy-bank.overpayment'), value: results.overpayment },
    ];
  }, [results, t]);

  const generateExportData = () => {
    if (!results) return null;
    return {
      title: t('otbasy-bank.exportTitle'),
      sections: [
        {
          title: t(program.labelKey),
          data: [
            { label: t('otbasy-bank.propertyPrice'), value: formatCurrency(parseFloat(propertyPrice) || 0) },
            { label: t('otbasy-bank.downPayment'), value: formatCurrency(results.downPayment) },
            { label: t('otbasy-bank.loanAmount'), value: formatCurrency(results.loanAmount) },
            { label: t('otbasy-bank.monthlyPayment'), value: formatCurrency(results.monthlyPayment) },
            { label: t('otbasy-bank.overpayment'), value: formatCurrency(results.overpayment) },
            { label: t('otbasy-bank.requiredIncome'), value: formatCurrency(results.requiredIncome) },
          ],
        },
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="otbasy-bank" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('otbasy-bank.heading')}</h1>
            <p className="text-gray-600">{t('otbasy-bank.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">{t('otbasy-bank.warning')}</p>
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('otbasy-bank.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Program selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('otbasy-bank.selectProgram')}</label>
              <div className="space-y-2">
                {programs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProgram(p.id);
                      if (parseFloat(downPaymentPercent) < p.downPaymentMin) {
                        setDownPaymentPercent(String(p.downPaymentMin));
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedProgram === p.id
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{t(p.labelKey)} <span className="font-normal text-gray-500">· {t(p.operatorKey)}</span></span>
                      <span className="text-sm text-sky-700 font-bold">{p.vulnerableRate ? `${p.vulnerableRate}–${p.rate}` : p.rate}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('otbasy-bank.downPaymentFrom')} {p.downPaymentMin}% · {t('otbasy-bank.upTo')} {p.maxTerm} {t('otbasy-bank.years')} · {t(p.capKind === 'price' ? 'otbasy-bank.capPrice' : 'otbasy-bank.capLoan')} {formatCurrency(p.cap[city])}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Регион: у 7-20-25 лимит стоимости жилья, у Наурыз/Отау лимит займа — оба региональные */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('otbasy-bank.cityLabel')}</label>
              <div className="grid grid-cols-2 gap-2">
                {CITY_TIERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      city === c ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`otbasy-bank.city_${c}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* СУСН-очередники: по «Наурыз» и «Отау» ставка 7 % вместо 9 % */}
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={vulnerable}
                onChange={(e) => setVulnerable(e.target.checked)}
                className="mt-1 h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
              />
              <span>
                <span className="font-medium text-gray-900">{t('otbasy-bank.vulnerableLabel')}</span>
                <br /><span className="text-gray-500">{t('otbasy-bank.vulnerableHint')}</span>
              </span>
            </label>

            {/* Property price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('otbasy-bank.propertyPrice')}</label>
              <RangeSlider
                value={parseFloat(propertyPrice) || 0}
                onChange={(val) => setPropertyPrice(String(val))}
                min={5000000}
                max={80000000}
                step={1000000}
                formatValue={(v) => `${(v / 1000000).toFixed(0)} ${t('otbasy-bank.mln')}`}
                color="#0ea5e9"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Down payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('otbasy-bank.downPaymentPercent')}</label>
              <RangeSlider
                value={parseFloat(downPaymentPercent) || 0}
                onChange={(val) => setDownPaymentPercent(String(val))}
                min={0}
                max={80}
                step={5}
                formatValue={(v) => `${v}%`}
                color="#0ea5e9"
              />
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('otbasy-bank.term')}</label>
              <RangeSlider
                value={parseInt(term) || 0}
                onChange={(val) => setTerm(String(val))}
                min={1}
                max={25}
                step={1}
                formatValue={(v) => `${v} ${t('otbasy-bank.years')}`}
                color="#0ea5e9"
              />
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('otbasy-bank.resultsTitle')}
          </h2>

          {results ? (
            <div className="space-y-6">
              {/* Eligibility */}
              <div className={`rounded-lg p-4 border ${results.isEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  {results.isEligible ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${results.isEligible ? 'text-green-800' : 'text-red-800'}`}>
                    {results.isEligible ? t('otbasy-bank.eligible') : t('otbasy-bank.notEligible')}
                  </span>
                </div>
                {!results.isDownPaymentOk && (
                  <p className="text-xs text-red-600 mt-1">{t('otbasy-bank.errorDownPayment')} {program.downPaymentMin}%</p>
                )}
                {!results.isAmountOk && (
                  <p className="text-xs text-red-600 mt-1">{t(program.capKind === 'price' ? 'otbasy-bank.errorMaxPrice' : 'otbasy-bank.errorMaxAmount')} {formatCurrency(results.capValue)}</p>
                )}
              </div>

              {/* Monthly payment — main */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-6 border border-sky-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-sky-900">{t('otbasy-bank.monthlyPayment')}</span>
                  <span className="text-2xl font-bold text-sky-700">{formatCurrency(results.monthlyPayment)}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('otbasy-bank.downPayment')}</span>
                  <span className="font-medium">{formatCurrency(results.downPayment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('otbasy-bank.loanAmount')}</span>
                  <span className="font-medium">{formatCurrency(results.loanAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('otbasy-bank.rate')}</span>
                  <span className="font-medium">{results.rate}% {t('otbasy-bank.annual')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('otbasy-bank.totalPayments')}</span>
                  <span className="font-medium">{formatCurrency(results.totalPayments)}</span>
                </div>
              </div>

              {/* Overpayment */}
              <div className="bg-red-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-red-600">{t('otbasy-bank.overpayment')}</span>
                <span className="text-lg font-bold text-red-700">{formatCurrency(results.overpayment)}</span>
              </div>

              {/* Required income */}
              <div className="bg-purple-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-purple-600">{t('otbasy-bank.requiredIncome')}</div>
                  <div className="text-xs text-purple-500">DTI ≤ 50%</div>
                </div>
                <span className="text-lg font-bold text-purple-700">{formatCurrency(results.requiredIncome)}</span>
              </div>

              {/* Pie chart */}
              {pieData.length > 0 && (
                <TaxPieChart data={pieData} title={t('otbasy-bank.chartTitle')} />
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">{t('otbasy-bank.enterData')}</div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename="otbasy-bank" />
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('otbasy-bank.faq.q1'), answer: t('otbasy-bank.faq.a1') },
          { question: t('otbasy-bank.faq.q2'), answer: t('otbasy-bank.faq.a2') },
          { question: t('otbasy-bank.faq.q3'), answer: t('otbasy-bank.faq.a3') },
          { question: t('otbasy-bank.faq.q4'), answer: t('otbasy-bank.faq.a4') },
          { question: t('otbasy-bank.faq.q5'), answer: t('otbasy-bank.faq.a5') },
        ]}
      
          sources={getSources('otbasy-bank')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <EmbedWidget calculatorId="otbasy-bank" calculatorTitle={t('otbasy-bank.heading')} />
      <LastUpdated calculatorId="otbasy-bank" />
    </div>
  );
}
