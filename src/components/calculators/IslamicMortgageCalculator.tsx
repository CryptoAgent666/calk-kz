import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Info } from 'lucide-react';
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
import { pluralize } from '../../utils/pluralize';

// Исламские продукты в КЗ:
// Мурабаха — банк покупает дом и продаёт клиенту с наценкой (основной продукт Al Hilal, Заман Банк)
// Иджара — лизинг (банк сдаёт в аренду, клиент выкупает)
// Иджара мунтаха биль-тамлик — аренда с выкупом
// Нет ссудного процента (риба) — запрещено шариатом

type Product = 'murabaha' | 'ijara';

// Типичная наценка в КЗ: 8-12% годовых (для мурабаха — общая наценка, не проценты)
// При сроке 15 лет наценка ~100-150% от стоимости

export default function IslamicMortgageCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [product, setProduct] = useState<Product>('murabaha');
  const [propertyPrice, setPropertyPrice] = useState<string>('25000000');
  const [downPayment, setDownPayment] = useState<string>('30'); // %
  const [termYears, setTermYears] = useState<string>('15');
  const [markup, setMarkup] = useState<string>('10'); // % годовых

  const results = useMemo(() => {
    const price = parseFloat(propertyPrice) || 0;
    const dp = parseFloat(downPayment) || 0;
    const years = parseFloat(termYears) || 0;
    const rate = parseFloat(markup) || 0;

    if (price <= 0 || years <= 0) return null;

    const downAmount = price * dp / 100;
    const financedAmount = price - downAmount;

    // Мурабаха: фиксированная наценка за весь срок
    // Общая сумма к возврату = financedAmount × (1 + rate/100 × years)
    // Равные ежемесячные платежи
    let totalToPay = 0;
    let monthlyPayment = 0;
    let overpayment = 0;

    if (product === 'murabaha') {
      // Простая наценка (простой процент на общий срок)
      const totalMarkup = financedAmount * (rate / 100) * years;
      totalToPay = financedAmount + totalMarkup;
      monthlyPayment = totalToPay / (years * 12);
      overpayment = totalMarkup;
    } else {
      // Иджара — как аннуитетный платёж
      const monthlyRate = rate / 100 / 12;
      const n = years * 12;
      monthlyPayment = financedAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -n));
      totalToPay = monthlyPayment * n;
      overpayment = totalToPay - financedAmount;
    }

    // Сравнение с обычной ипотекой (ставка ~18% в КЗ 2026)
    const conventionalRate = 18;
    const convMonthlyRate = conventionalRate / 100 / 12;
    const convN = years * 12;
    const convMonthly = financedAmount * convMonthlyRate / (1 - Math.pow(1 + convMonthlyRate, -convN));
    const convTotal = convMonthly * convN;
    const convOverpayment = convTotal - financedAmount;

    const effectiveRate = (Math.pow(totalToPay / financedAmount, 1 / years) - 1) * 100;

    return {
      downAmount: Math.round(downAmount),
      financedAmount: Math.round(financedAmount),
      monthlyPayment: Math.round(monthlyPayment),
      totalToPay: Math.round(totalToPay + downAmount),
      overpayment: Math.round(overpayment),
      totalWithDown: Math.round(totalToPay + downAmount),
      effectiveRate: effectiveRate.toFixed(2),
      convMonthly: Math.round(convMonthly),
      convOverpayment: Math.round(convOverpayment),
      savingsVsConv: Math.round(convOverpayment - overpayment),
    };
  }, [product, propertyPrice, downPayment, termYears, markup]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="islamic-mortgage" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-700 to-emerald-800 rounded-lg flex items-center justify-center">
          <Home className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('islamic-mortgage.title')}</h1>
          <p className="text-gray-600">{t('islamic-mortgage.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('islamic-mortgage.parameters')}</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('islamic-mortgage.product')}</label>
            <div className="space-y-2">
              <button onClick={() => setProduct('murabaha')}
                className={`w-full p-3 rounded-lg border text-left ${product === 'murabaha' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'}`}>
                <div className="font-medium">{t('islamic-mortgage.murabaha')}</div>
                <div className="text-xs text-gray-500">{t('islamic-mortgage.murabahaHint')}</div>
              </button>
              <button onClick={() => setProduct('ijara')}
                className={`w-full p-3 rounded-lg border text-left ${product === 'ijara' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'}`}>
                <div className="font-medium">{t('islamic-mortgage.ijara')}</div>
                <div className="text-xs text-gray-500">{t('islamic-mortgage.ijaraHint')}</div>
              </button>
            </div>
          </div>

          <RangeSlider label={t('islamic-mortgage.propertyPrice')} value={parseFloat(propertyPrice) || 0}
            onChange={v => setPropertyPrice(String(v))} min={5000000} max={200000000} step={500000} formatValue={formatNumber} />
          <RangeSlider label={t('islamic-mortgage.downPayment')} value={parseFloat(downPayment) || 0}
            onChange={v => setDownPayment(String(v))} min={20} max={70} step={5} formatValue={v => `${v}%`} />
          <RangeSlider label={t('islamic-mortgage.term')} value={parseFloat(termYears) || 0}
            onChange={v => setTermYears(String(v))} min={3} max={25} step={1} formatValue={v => `${v} ${pluralize(i18n.language, v, 'год', 'года', 'лет')}`} />
          <RangeSlider label={t('islamic-mortgage.markup')} value={parseFloat(markup) || 0}
            onChange={v => setMarkup(String(v))} min={5} max={18} step={0.5} formatValue={v => `${v}%`} />

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-900">
            🕌 {t('islamic-mortgage.shariaNote')}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('islamic-mortgage.resultsTitle')}</h2>

          {results && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-300">
                <div className="text-sm text-gray-600">{t('islamic-mortgage.monthlyPayment')}</div>
                <div className="text-4xl font-bold text-green-700">{formatNumber(results.monthlyPayment)}</div>
                <div className="text-xs text-gray-500 mt-1">{t('islamic-mortgage.effectiveRate')}: ~{results.effectiveRate}%</div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('islamic-mortgage.downAmount')}</span>
                  <span className="font-semibold">{formatNumber(results.downAmount)}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('islamic-mortgage.financed')}</span>
                  <span className="font-semibold">{formatNumber(results.financedAmount)}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between">
                  <span>{t('islamic-mortgage.markupTotal')}</span>
                  <span className="font-semibold text-amber-700">{formatNumber(results.overpayment)}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between">
                  <span>{t('islamic-mortgage.totalWithDown')}</span>
                  <span className="font-bold">{formatNumber(results.totalWithDown)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">{t('islamic-mortgage.comparison')}</div>
                <div className="text-xs space-y-1 text-blue-800">
                  <div>{t('islamic-mortgage.conventional')} (18%): {formatNumber(results.convMonthly)}/мес</div>
                  <div>{t('islamic-mortgage.convOverpayment')}: {formatNumber(results.convOverpayment)}</div>
                  <div className={`font-semibold ${results.savingsVsConv > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {results.savingsVsConv > 0 ? t('islamic-mortgage.savings') : t('islamic-mortgage.extra')}: {formatNumber(Math.abs(results.savingsVsConv))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700">
                🏦 {t('islamic-mortgage.banks')}: Al Hilal Islamic Bank, Заман Банк
              </div>
            </>
          )}
        </div>
      </div>

      {results && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('islamic-mortgage.title'),
              subtitle: t(`islamic-mortgage.${product}`),
              sections: [{ title: t('islamic-mortgage.resultsTitle'), data: [
                { label: t('islamic-mortgage.monthlyPayment'), value: formatNumber(results.monthlyPayment) },
                { label: t('islamic-mortgage.markupTotal'), value: formatNumber(results.overpayment) },
                { label: t('islamic-mortgage.totalWithDown'), value: formatNumber(results.totalWithDown) },
              ]}],
              footer: 'Calk.kz'
            }}
            filename="islamic-mortgage"
          />
        </div>
      )}

      <LegalDisclaimer type="religious" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="islamic-mortgage" />
      <MethodologySection steps={getMethodology('islamic-mortgage')} />
      <FAQSection items={[
        { question: t('islamic-mortgage.faq.q1'), answer: t('islamic-mortgage.faq.a1') },
        { question: t('islamic-mortgage.faq.q2'), answer: t('islamic-mortgage.faq.a2') },
        { question: t('islamic-mortgage.faq.q3'), answer: t('islamic-mortgage.faq.a3') },
        { question: t('islamic-mortgage.faq.q4'), answer: t('islamic-mortgage.faq.a4') },
        { question: t('islamic-mortgage.faq.q5'), answer: t('islamic-mortgage.faq.a5') },
      ]} 
          sources={getSources('islamic-mortgage')}
        />
      <EmbedWidget calculatorId="islamic-mortgage" calculatorTitle={t('islamic-mortgage.title')} />
      <LastUpdated calculatorId="islamic-mortgage" />
    </div>
  );
}
