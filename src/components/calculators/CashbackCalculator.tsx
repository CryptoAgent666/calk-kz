import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, TrendingUp } from 'lucide-react';
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

interface Card {
  id: string;
  name: string;
  annualFee: number;
  cashback: { grocery: number; restaurant: number; fuel: number; online: number; other: number };
  maxMonthly: number; // лимит кэшбека в месяц
  bonusNote?: string;
}

const CARDS: Card[] = [
  { id: 'kaspiGold', name: 'Kaspi Gold', annualFee: 0,
    cashback: { grocery: 0, restaurant: 0, fuel: 0, online: 0, other: 0 },
    maxMonthly: 0, bonusNote: 'Бонусы рассрочки + бонусы Kaspi (до 30%)' },
  { id: 'kaspiRed', name: 'Kaspi Red', annualFee: 0,
    cashback: { grocery: 0, restaurant: 0, fuel: 0, online: 0, other: 0 },
    maxMonthly: 0, bonusNote: 'Рассрочка 3-24 мес' },
  { id: 'halykBank', name: 'Halyk Bonus', annualFee: 3000,
    cashback: { grocery: 5, restaurant: 10, fuel: 3, online: 3, other: 1 },
    maxMonthly: 30000 },
  { id: 'jusanBonus', name: 'Jusan Bonus', annualFee: 0,
    cashback: { grocery: 4, restaurant: 7, fuel: 3, online: 5, other: 1 },
    maxMonthly: 25000 },
  { id: 'forteBank', name: 'ForteBank Platinum', annualFee: 18000,
    cashback: { grocery: 5, restaurant: 10, fuel: 5, online: 5, other: 2 },
    maxMonthly: 100000 },
  { id: 'bankCC', name: 'БЦК / BCC Visa Platinum', annualFee: 15000,
    cashback: { grocery: 4, restaurant: 8, fuel: 3, online: 4, other: 1 },
    maxMonthly: 50000 },
];

export default function CashbackCalculator() {
  const { t } = useTranslation('calculators');
  const [grocery, setGrocery] = useState<string>('150000');
  const [restaurant, setRestaurant] = useState<string>('50000');
  const [fuel, setFuel] = useState<string>('30000');
  const [online, setOnline] = useState<string>('70000');
  const [other, setOther] = useState<string>('100000');

  const results = useMemo(() => {
    const g = parseFloat(grocery) || 0;
    const r = parseFloat(restaurant) || 0;
    const f = parseFloat(fuel) || 0;
    const o = parseFloat(online) || 0;
    const ot = parseFloat(other) || 0;
    const totalSpending = g + r + f + o + ot;

    const cardResults = CARDS.map(card => {
      const monthlyCashback =
        g * card.cashback.grocery / 100 +
        r * card.cashback.restaurant / 100 +
        f * card.cashback.fuel / 100 +
        o * card.cashback.online / 100 +
        ot * card.cashback.other / 100;

      const cappedCashback = card.maxMonthly > 0 ? Math.min(monthlyCashback, card.maxMonthly) : monthlyCashback;
      const yearlyCashback = cappedCashback * 12 - card.annualFee;
      return {
        ...card,
        monthlyCashback: Math.round(cappedCashback),
        yearlyCashback: Math.round(yearlyCashback),
      };
    }).sort((a, b) => b.yearlyCashback - a.yearlyCashback);

    return { cardResults, totalSpending };
  }, [grocery, restaurant, fuel, online, other]);

  const formatNumber = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-green-700 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('cashback.title')}</h1>
          <p className="text-gray-600">{t('cashback.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold">{t('cashback.spendings')}</h2>
          <p className="text-sm text-gray-600">{t('cashback.spendingsHint')}</p>

          <RangeSlider label={`🛒 ${t('cashback.grocery')}`} value={parseFloat(grocery) || 0}
            onChange={v => setGrocery(String(v))} min={0} max={500000} step={5000} formatValue={formatNumber} />
          <RangeSlider label={`🍽 ${t('cashback.restaurant')}`} value={parseFloat(restaurant) || 0}
            onChange={v => setRestaurant(String(v))} min={0} max={300000} step={5000} formatValue={formatNumber} />
          <RangeSlider label={`⛽ ${t('cashback.fuel')}`} value={parseFloat(fuel) || 0}
            onChange={v => setFuel(String(v))} min={0} max={200000} step={5000} formatValue={formatNumber} />
          <RangeSlider label={`💻 ${t('cashback.online')}`} value={parseFloat(online) || 0}
            onChange={v => setOnline(String(v))} min={0} max={500000} step={5000} formatValue={formatNumber} />
          <RangeSlider label={`🛍 ${t('cashback.other')}`} value={parseFloat(other) || 0}
            onChange={v => setOther(String(v))} min={0} max={500000} step={5000} formatValue={formatNumber} />

          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex justify-between font-semibold">
              <span>{t('cashback.totalMonthly')}</span>
              <span>{formatNumber(results.totalSpending)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{t('cashback.totalYearly')}: {formatNumber(results.totalSpending * 12)}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="text-xl font-semibold">{t('cashback.resultsTitle')}</h2>
          <p className="text-xs text-gray-500">{t('cashback.disclaimer')}</p>

          {results.cardResults.map((card, i) => (
            <div key={card.id} className={`rounded-lg border p-4 ${i === 0 ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">{card.name}</div>
                  {i === 0 && <div className="inline-block text-xs bg-emerald-600 text-white px-2 py-0.5 rounded mt-1">👑 {t('cashback.best')}</div>}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{t('cashback.yearlyCashback')}</div>
                  <div className={`font-bold ${card.yearlyCashback > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatNumber(card.yearlyCashback)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>{t('cashback.monthly')}: {formatNumber(card.monthlyCashback)}</div>
                {card.annualFee > 0 && <div>{t('cashback.fee')}: {formatNumber(card.annualFee)}/год</div>}
                {card.bonusNote && <div className="italic">ℹ️ {card.bonusNote}</div>}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
            💡 {t('cashback.comboNote')}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('cashback.title'),
            sections: [{ title: t('cashback.resultsTitle'),
              data: results.cardResults.slice(0, 3).map(c => ({
                label: c.name, value: `${formatNumber(c.yearlyCashback)}/год`
              }))
            }],
            footer: 'Calk.kz'
          }}
          filename="cashback"
        />
      </div>

      <LegalDisclaimer type="finance" />
      <ExpertBlock />
      <CalculatorExamples calculatorId="cashback" />
      <MethodologySection steps={getMethodology('cashback')} />
      <FAQSection items={[
        { question: t('cashback.faq.q1'), answer: t('cashback.faq.a1') },
        { question: t('cashback.faq.q2'), answer: t('cashback.faq.a2') },
        { question: t('cashback.faq.q3'), answer: t('cashback.faq.a3') },
        { question: t('cashback.faq.q4'), answer: t('cashback.faq.a4') },
        { question: t('cashback.faq.q5'), answer: t('cashback.faq.a5') },
      ]} 
          sources={getSources('cashback')}
        />
      <EmbedWidget calculatorId="cashback" calculatorTitle={t('cashback.title')} />
      <LastUpdated calculatorId="cashback" />
    </div>
  );
}
