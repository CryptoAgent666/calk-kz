import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Calculator, TrendingUp, Info, AlertTriangle, PiggyBank, Building2, Award } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

interface FranchisePreset {
  id: string; labelKey: string; paushal: number; equipment: number; training: number;
  startStock: number; royalty: number; marketingFee: number; revenue: number; opex: number;
}

const DEPOSIT_RATE = 15; // % годовых — ориентир для сравнения

interface MoneyInputProps { label: string; value: string; onChange: (v: string) => void; suffix: string; step?: string; hint?: string; }

function MoneyInput({ label, value, onChange, suffix, step, hint }: MoneyInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm">{suffix}</span>
        </div>
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function FranchisePaybackCalculator() {
  const { t } = useTranslation('calculators');

  const presets: FranchisePreset[] = [
    { id: 'caffeine', labelKey: 'franchise-payback.presetCaffeine', paushal: 5_000_000, equipment: 15_000_000, training: 1_500_000, startStock: 2_000_000, royalty: 5, marketingFee: 2, revenue: 7_000_000, opex: 4_200_000 },
    { id: 'dodo', labelKey: 'franchise-payback.presetDodo', paushal: 8_000_000, equipment: 20_000_000, training: 2_000_000, startStock: 3_000_000, royalty: 5, marketingFee: 2, revenue: 12_000_000, opex: 7_500_000 },
    { id: 'magnum', labelKey: 'franchise-payback.presetMagnum', paushal: 3_000_000, equipment: 10_000_000, training: 800_000, startStock: 5_000_000, royalty: 3, marketingFee: 1, revenue: 8_000_000, opex: 5_500_000 },
    { id: 'education', labelKey: 'franchise-payback.presetEducation', paushal: 5_000_000, equipment: 8_000_000, training: 1_200_000, startStock: 500_000, royalty: 7, marketingFee: 2, revenue: 4_500_000, opex: 2_500_000 },
    { id: 'custom', labelKey: 'franchise-payback.presetCustom', paushal: 0, equipment: 0, training: 0, startStock: 0, royalty: 0, marketingFee: 0, revenue: 0, opex: 0 },
  ];

  const [preset, setPreset] = useState<string>('caffeine');
  const [paushal, setPaushal] = useState<string>('5000000');
  const [equipment, setEquipment] = useState<string>('15000000');
  const [training, setTraining] = useState<string>('1500000');
  const [startStock, setStartStock] = useState<string>('2000000');
  const [revenue, setRevenue] = useState<string>('7000000');
  const [royalty, setRoyalty] = useState<string>('5');
  const [marketingFee, setMarketingFee] = useState<string>('2');
  const [opex, setOpex] = useState<string>('4200000');
  const [taxMode, setTaxMode] = useState<'simple' | 'general'>('simple');

  const [results, setResults] = useState({
    startup: 0, royaltyAmount: 0, marketingAmount: 0, feesTotal: 0, taxAmount: 0,
    monthlyProfit: 0, yearlyProfit: 0, paybackMonths: 0, roi: 0, margin: 0, depositYearly: 0,
  });

  // Применяем пресет при его выборе
  useEffect(() => {
    const p = presets.find((x) => x.id === preset);
    if (!p || p.id === 'custom') return;
    setPaushal(String(p.paushal));
    setEquipment(String(p.equipment));
    setTraining(String(p.training));
    setStartStock(String(p.startStock));
    setRoyalty(String(p.royalty));
    setMarketingFee(String(p.marketingFee));
    setRevenue(String(p.revenue));
    setOpex(String(p.opex));
  }, [preset]);

  // Расчёт
  useEffect(() => {
    const pau = parseFloat(paushal) || 0;
    const eq = parseFloat(equipment) || 0;
    const tr = parseFloat(training) || 0;
    const stock = parseFloat(startStock) || 0;
    const rev = parseFloat(revenue) || 0;
    const roy = parseFloat(royalty) || 0;
    const mkt = parseFloat(marketingFee) || 0;
    const op = parseFloat(opex) || 0;

    const startup = pau + eq + tr + stock;
    const royaltyAmount = (rev * roy) / 100;
    const marketingAmount = (rev * mkt) / 100;
    const feesTotal = royaltyAmount + marketingAmount;
    const grossProfit = rev - op - feesTotal;
    // Упрощёнка 4% с оборота; ОУР ~20% с прибыли (упрощённо)
    const taxAmount = taxMode === 'simple' ? rev * 0.04 : Math.max(0, grossProfit) * 0.2;
    const monthlyProfit = grossProfit - taxAmount;
    const yearlyProfit = monthlyProfit * 12;
    const paybackMonths = monthlyProfit > 0 ? startup / monthlyProfit : 0;
    const roi = startup > 0 ? (yearlyProfit / startup) * 100 : 0;
    const margin = rev > 0 ? (monthlyProfit / rev) * 100 : 0;
    const depositYearly = (startup * DEPOSIT_RATE) / 100;

    setResults({
      startup: Math.round(startup),
      royaltyAmount: Math.round(royaltyAmount),
      marketingAmount: Math.round(marketingAmount),
      feesTotal: Math.round(feesTotal),
      taxAmount: Math.round(taxAmount),
      monthlyProfit: Math.round(monthlyProfit),
      yearlyProfit: Math.round(yearlyProfit),
      paybackMonths: Number(paybackMonths.toFixed(1)),
      roi: Number(roi.toFixed(1)),
      margin: Number(margin.toFixed(1)),
      depositYearly: Math.round(depositYearly),
    });
  }, [paushal, equipment, training, startStock, revenue, royalty, marketingFee, opex, taxMode]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const getRating = (): { key: string; color: string; bg: string; border: string } => {
    if (results.paybackMonths <= 0 || results.monthlyProfit <= 0)
      return { key: 'franchise-payback.ratingLoss', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (results.paybackMonths < 18)
      return { key: 'franchise-payback.ratingExcellent', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
    if (results.paybackMonths <= 36)
      return { key: 'franchise-payback.ratingNormal', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { key: 'franchise-payback.ratingBad', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const rating = getRating();

  const paybackYears = results.paybackMonths > 0 ? (results.paybackMonths / 12).toFixed(1) : '—';

  const generateExportData = () => {
    if (results.startup === 0) return null;
    return `${t('franchise-payback.exportTitle')}
─────────────────────────────
${t('franchise-payback.paushal')}: ${formatCurrency(parseFloat(paushal) || 0)}
${t('franchise-payback.equipment')}: ${formatCurrency(parseFloat(equipment) || 0)}
${t('franchise-payback.training')}: ${formatCurrency(parseFloat(training) || 0)}
${t('franchise-payback.startStock')}: ${formatCurrency(parseFloat(startStock) || 0)}
${t('franchise-payback.revenue')}: ${formatCurrency(parseFloat(revenue) || 0)}
${t('franchise-payback.royalty')}: ${royalty}%
${t('franchise-payback.marketingFee')}: ${marketingFee}%
${t('franchise-payback.opex')}: ${formatCurrency(parseFloat(opex) || 0)}
${t('franchise-payback.taxMode')}: ${t(taxMode === 'simple' ? 'franchise-payback.taxSimple' : 'franchise-payback.taxGeneral')}

${t('franchise-payback.resultsTitle')}:
─────────────────────────────
${t('franchise-payback.startup')}: ${formatCurrency(results.startup)}
${t('franchise-payback.feesTotal')}: ${formatCurrency(results.feesTotal)}
${t('franchise-payback.taxAmount')}: ${formatCurrency(results.taxAmount)}
${t('franchise-payback.monthlyProfit')}: ${formatCurrency(results.monthlyProfit)}
${t('franchise-payback.yearlyProfit')}: ${formatCurrency(results.yearlyProfit)}
${t('franchise-payback.paybackMonths')}: ${results.paybackMonths} ${t('franchise-payback.months')} (~${paybackYears} ${t('franchise-payback.years')})
ROI: ${results.roi}%
${t('franchise-payback.margin')}: ${results.margin}%
${t('franchise-payback.depositCompare')}: ${formatCurrency(results.depositYearly)} (${DEPOSIT_RATE}%)
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('franchise-payback.heading')}</h1>
            <p className="text-gray-600">{t('franchise-payback.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="franchise-payback" />

      {/* Risk warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-amber-800 text-sm">{t('franchise-payback.riskWarning')}</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('franchise-payback.parameters')}
          </h2>

          <div className="space-y-5">
            {/* Preset selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Building2 className="w-4 h-4 inline mr-1" />
                {t('franchise-payback.presetLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      preset === p.id
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <MoneyInput
              label={t('franchise-payback.paushal')}
              value={paushal}
              onChange={(v) => { setPaushal(v); setPreset('custom'); }}
              suffix="₸"
            />
            <MoneyInput
              label={t('franchise-payback.equipment')}
              value={equipment}
              onChange={(v) => { setEquipment(v); setPreset('custom'); }}
              suffix="₸"
            />
            <MoneyInput
              label={t('franchise-payback.training')}
              value={training}
              onChange={(v) => { setTraining(v); setPreset('custom'); }}
              suffix="₸"
            />
            <MoneyInput
              label={t('franchise-payback.startStock')}
              value={startStock}
              onChange={(v) => { setStartStock(v); setPreset('custom'); }}
              suffix="₸"
            />
            <MoneyInput
              label={t('franchise-payback.revenue')}
              value={revenue}
              onChange={(v) => { setRevenue(v); setPreset('custom'); }}
              suffix={`₸/${t('franchise-payback.month')}`}
            />

            <div className="grid grid-cols-2 gap-3">
              <MoneyInput
                label={t('franchise-payback.royalty')}
                value={royalty}
                onChange={(v) => { setRoyalty(v); setPreset('custom'); }}
                suffix="%"
                step="0.1"
              />
              <MoneyInput
                label={t('franchise-payback.marketingFee')}
                value={marketingFee}
                onChange={(v) => { setMarketingFee(v); setPreset('custom'); }}
                suffix="%"
                step="0.1"
              />
            </div>

            <MoneyInput
              label={t('franchise-payback.opex')}
              value={opex}
              onChange={(v) => { setOpex(v); setPreset('custom'); }}
              suffix={`₸/${t('franchise-payback.month')}`}
              hint={t('franchise-payback.opexHint')}
            />

            {/* Tax mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('franchise-payback.taxMode')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTaxMode('simple')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    taxMode === 'simple'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {t('franchise-payback.taxSimple')}
                </button>
                <button
                  onClick={() => setTaxMode('general')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    taxMode === 'general'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {t('franchise-payback.taxGeneral')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('franchise-payback.resultsTitle')}
          </h2>

          <div className="space-y-4">
            {/* Payback — main result */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('franchise-payback.paybackMonths')}</span>
                <div className="flex items-center space-x-2">
                  <PiggyBank className="w-6 h-6 text-violet-600" />
                  <span className="text-2xl font-bold text-violet-700">
                    {results.paybackMonths > 0 ? `${results.paybackMonths} ${t('franchise-payback.months')}` : '—'}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {results.paybackMonths > 0 && `~${paybackYears} ${t('franchise-payback.years')}`}
              </div>
            </div>

            {/* Rating */}
            <div className={`rounded-lg p-4 border ${rating.bg} ${rating.border} flex items-center gap-3`}>
              <Award className={`w-6 h-6 ${rating.color}`} />
              <div>
                <div className="text-xs text-gray-600">{t('franchise-payback.rating')}</div>
                <div className={`text-base font-bold ${rating.color}`}>{t(rating.key)}</div>
              </div>
            </div>

            {/* Startup investments */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('franchise-payback.startup')}</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(results.startup)}</div>
              </div>
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>

            {/* Royalty + marketing fees */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-gray-600">{t('franchise-payback.royalty')}</div>
                <div className="text-sm font-semibold text-gray-900">{formatCurrency(results.royaltyAmount)}</div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-gray-600">{t('franchise-payback.marketingFee')}</div>
                <div className="text-sm font-semibold text-gray-900">{formatCurrency(results.marketingAmount)}</div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700">{t('franchise-payback.feesTotal')}</div>
                <div className="text-base font-bold text-violet-700">{formatCurrency(results.feesTotal)}</div>
              </div>
            </div>

            {/* Tax */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('franchise-payback.taxAmount')}</div>
                <div className="text-xs text-gray-500">
                  {t(taxMode === 'simple' ? 'franchise-payback.taxSimpleHint' : 'franchise-payback.taxGeneralHint')}
                </div>
              </div>
              <div className="text-base font-bold text-gray-900">{formatCurrency(results.taxAmount)}</div>
            </div>

            {/* Monthly profit */}
            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-blue-600">{t('franchise-payback.monthlyProfit')}</div>
                <div className="text-xs text-blue-500">{t('franchise-payback.margin')}: {results.margin}%</div>
              </div>
              <span className="text-xl font-bold text-blue-700">{formatCurrency(results.monthlyProfit)}</span>
            </div>

            {/* Yearly profit + ROI */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-green-600">{t('franchise-payback.yearlyProfit')}</div>
                <span className="text-xl font-bold text-green-700">{formatCurrency(results.yearlyProfit)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700">ROI</span>
                <span className="font-bold text-green-800">{results.roi}%</span>
              </div>
            </div>

            {/* Deposit comparison */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm text-purple-600">{t('franchise-payback.depositCompare')}</div>
                <span className="text-base font-bold text-purple-700">{formatCurrency(results.depositYearly)}</span>
              </div>
              <div className="text-xs text-purple-500">
                {t('franchise-payback.depositHint', { rate: DEPOSIT_RATE })}
              </div>
            </div>

            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('franchise-payback.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename={t('franchise-payback.exportFilename')}
        />
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('franchise-payback.faq.q1'), answer: t('franchise-payback.faq.a1') },
          { question: t('franchise-payback.faq.q2'), answer: t('franchise-payback.faq.a2') },
          { question: t('franchise-payback.faq.q3'), answer: t('franchise-payback.faq.a3') },
          { question: t('franchise-payback.faq.q4'), answer: t('franchise-payback.faq.a4') },
          { question: t('franchise-payback.faq.q5'), answer: t('franchise-payback.faq.a5') },
        ]}
      
          sources={getSources('franchise-payback')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget />
      <LastUpdated calculatorId="franchise-payback" />
    </div>
  );
}
