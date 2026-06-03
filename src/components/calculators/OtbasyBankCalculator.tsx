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

// Программы Отбасы банк 2026
interface Program {
  id: string;
  labelKey: string;
  rate: number;           // годовая ставка %
  maxTerm: number;        // макс. срок (лет)
  downPaymentMin: number; // мин. первоначальный взнос %
  maxAmount: number;      // макс. сумма кредита
}

// Программы и ставки Отбасы банк на апрель 2026 (источник: hcsbk.kz)
// Отау: ставка повышена с 5% до 7% (для городов Астана/Алматы — лимит 36M, остальные регионы — 30M)
const programs: Program[] = [
  { id: 'baspana-hit', labelKey: 'otbasy-bank.programs.baspanaHit', rate: 5, maxTerm: 25, downPaymentMin: 20, maxAmount: 30_000_000 },
  { id: '7-20-25', labelKey: 'otbasy-bank.programs.program72025', rate: 7, maxTerm: 25, downPaymentMin: 20, maxAmount: 25_000_000 },
  { id: 'baspana-zhas', labelKey: 'otbasy-bank.programs.baspanaZhas', rate: 2, maxTerm: 25, downPaymentMin: 10, maxAmount: 18_000_000 },
  { id: 'otau', labelKey: 'otbasy-bank.programs.otau', rate: 7, maxTerm: 20, downPaymentMin: 20, maxAmount: 36_000_000 },
];

function calcAnnuity(principal: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const n = termYears * 12;
  if (monthlyRate === 0) return principal / n;
  return Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1));
}

export default function OtbasyBankCalculator() {
  const { t } = useTranslation('calculators');

  const [selectedProgram, setSelectedProgram] = useState('baspana-hit');
  const [propertyPrice, setPropertyPrice] = useState<string>('25000000');
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>('20');
  const [term, setTerm] = useState<string>('20');

  const program = programs.find((p) => p.id === selectedProgram)!;

  const results = useMemo(() => {
    const price = parseFloat(propertyPrice) || 0;
    const dpPercent = parseFloat(downPaymentPercent) || 0;
    const termYears = parseInt(term) || 0;

    if (price <= 0 || termYears <= 0) return null;

    const downPayment = Math.round(price * (dpPercent / 100));
    const loanAmount = Math.min(price - downPayment, program.maxAmount);
    const actualLoan = Math.max(0, loanAmount);

    const monthlyPayment = calcAnnuity(actualLoan, program.rate, termYears);
    const totalPayments = monthlyPayment * termYears * 12;
    const overpayment = totalPayments - actualLoan;
    const requiredIncome = Math.round(monthlyPayment / 0.5); // DTI не более 50%

    const isDownPaymentOk = dpPercent >= program.downPaymentMin;
    const isTermOk = termYears <= program.maxTerm;
    const isAmountOk = actualLoan <= program.maxAmount;

    return {
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
  }, [propertyPrice, downPaymentPercent, term, program]);

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
                      <span className="text-sm font-medium text-gray-900">{t(p.labelKey)}</span>
                      <span className="text-sm text-sky-700 font-bold">{p.rate}%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('otbasy-bank.downPaymentFrom')} {p.downPaymentMin}% · {t('otbasy-bank.upTo')} {p.maxTerm} {t('otbasy-bank.years')} · {t('otbasy-bank.maxLabel')} {formatCurrency(p.maxAmount)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

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
                  <p className="text-xs text-red-600 mt-1">{t('otbasy-bank.errorMaxAmount')} {formatCurrency(program.maxAmount)}</p>
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
                  <span className="font-medium">{program.rate}% {t('otbasy-bank.annual')}</span>
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
