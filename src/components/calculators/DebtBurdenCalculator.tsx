import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Calculator, Plus, Trash2, AlertTriangle, CheckCircle, Info, CreditCard } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { ProgressBar } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

interface CreditEntry {
  id: number;
  name: string;
  payment: string;
}

let nextId = 1;

export default function DebtBurdenCalculator() {
  const { t } = useTranslation('calculators');

  const [income, setIncome] = useState<string>('300000');
  const [credits, setCredits] = useState<CreditEntry[]>([
    { id: nextId++, name: '', payment: '' }
  ]);
  const [newCreditPayment, setNewCreditPayment] = useState<string>('');

  const totalPayments = useMemo(() => {
    return credits.reduce((sum, c) => sum + (parseFloat(c.payment) || 0), 0);
  }, [credits]);

  const incomeNum = parseFloat(income) || 0;

  const dti = useMemo(() => {
    if (incomeNum <= 0) return 0;
    return (totalPayments / incomeNum) * 100;
  }, [totalPayments, incomeNum]);

  const freeIncome = Math.max(0, incomeNum - totalPayments);

  const newPaymentNum = parseFloat(newCreditPayment) || 0;
  const newDti = useMemo(() => {
    if (incomeNum <= 0) return 0;
    return ((totalPayments + newPaymentNum) / incomeNum) * 100;
  }, [totalPayments, newPaymentNum, incomeNum]);

  const getZone = (value: number) => {
    if (value < 30) return 'green';
    if (value <= 50) return 'yellow';
    if (value <= 70) return 'red';
    return 'critical';
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      case 'critical': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getZoneBg = (zone: string) => {
    switch (zone) {
      case 'green': return 'from-green-50 to-emerald-50';
      case 'yellow': return 'from-yellow-50 to-amber-50';
      case 'red': return 'from-red-50 to-orange-50';
      case 'critical': return 'from-red-100 to-red-50';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  const getZoneBorderColor = (zone: string) => {
    switch (zone) {
      case 'green': return 'border-green-200';
      case 'yellow': return 'border-yellow-200';
      case 'red': return 'border-red-200';
      case 'critical': return 'border-red-300';
      default: return 'border-gray-200';
    }
  };

  const getProgressColor = (zone: string) => {
    switch (zone) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      case 'critical': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const zone = getZone(dti);
  const newZone = getZone(newDti);

  const addCredit = () => {
    if (credits.length >= 10) return;
    setCredits([...credits, { id: nextId++, name: '', payment: '' }]);
  };

  const removeCredit = (id: number) => {
    if (credits.length <= 1) return;
    setCredits(credits.filter(c => c.id !== id));
  };

  const updateCredit = (id: number, field: 'name' | 'payment', value: string) => {
    setCredits(credits.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ');
  };

  const generateExportData = () => {
    if (incomeNum <= 0) return null;

    const creditLines = credits
      .filter(c => parseFloat(c.payment) > 0)
      .map(c => `- ${c.name || t('debt-burden.untitledCredit')}: ${formatNumber(parseFloat(c.payment) || 0)} ${t('debt-burden.currency')}`)
      .join('\n');

    return `${t('debt-burden.exportTitle')}

${t('debt-burden.incomeLabel')}: ${formatNumber(incomeNum)} ${t('debt-burden.currency')}

${t('debt-burden.creditsTitle')}:
${creditLines || '-'}

${t('debt-burden.totalObligations')}: ${formatNumber(totalPayments)} ${t('debt-burden.currency')}
${t('debt-burden.freeIncome')}: ${formatNumber(freeIncome)} ${t('debt-burden.currency')}
DTI: ${dti.toFixed(1)}%
${t('debt-burden.status')}: ${t(`debt-burden.zones.${zone}.title`)}

${t('debt-burden.calculatedOn')} calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="debt-burden" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('debt-burden.heading')}</h1>
            <p className="text-gray-600">{t('debt-burden.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">{t('debt-burden.warningTitle')}</h3>
            <p className="text-sm text-amber-800 mt-1">{t('debt-burden.warningText')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left column - Inputs */}
        <div className="space-y-6">
          {/* Income */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('debt-burden.incomeSection')}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('debt-burden.incomeLabel')}
              </label>
              <RangeSlider
                value={parseFloat(income) || 300000}
                onChange={(val) => setIncome(String(val))}
                min={100000}
                max={2000000}
                step={10000}
                formatValue={(v) => `${formatNumber(v)} ${t('debt-burden.currency')}`}
                color="#6366f1"
              />
              <div className="mt-2">
                <div className="relative">
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder={t('debt-burden.incomePlaceholder')}
                    min={0}
                    step={10000}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {t('debt-burden.currency')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Credits list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('debt-burden.creditsTitle')}</h2>
              <span className="text-sm text-gray-500">{credits.length}/10</span>
            </div>

            <div className="space-y-4">
              {credits.map((credit, index) => (
                <div key={credit.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {t('debt-burden.creditNumber', { n: index + 1 })}
                      </span>
                    </div>
                    {credits.length > 1 && (
                      <button
                        onClick={() => removeCredit(credit.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('debt-burden.removeCredit')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t('debt-burden.creditName')}
                      </label>
                      <input
                        type="text"
                        value={credit.name}
                        onChange={(e) => updateCredit(credit.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        placeholder={t('debt-burden.creditNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t('debt-burden.monthlyPayment')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={credit.payment}
                          onChange={(e) => updateCredit(credit.id, 'payment', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="0"
                          min={0}
                          step={1000}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                          {t('debt-burden.currency')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {credits.length < 10 && (
              <button
                onClick={addCredit}
                className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('debt-burden.addCredit')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right column - Results */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('debt-burden.resultsTitle')}</h2>

            {incomeNum > 0 ? (
              <div className="space-y-6">
                {/* DTI percentage */}
                <div className={`bg-gradient-to-r ${getZoneBg(zone)} rounded-lg p-4 sm:p-6`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-base sm:text-lg font-semibold text-gray-900">
                      {t('debt-burden.dtiLabel')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-6 h-6 text-gray-600" />
                      <span className={`text-3xl sm:text-4xl font-bold ${getZoneColor(zone)}`}>
                        {dti.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {formatNumber(totalPayments)} / {formatNumber(incomeNum)} x 100%
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <ProgressBar
                    value={Math.min(dti, 100)}
                    max={100}
                    color={getProgressColor(zone)}
                    label={t('debt-burden.dtiLevel')}
                    formatValue={(v) => `${v.toFixed(1)}%`}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>30%</span>
                    <span>50%</span>
                    <span>70%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Status */}
                <div className={`border ${getZoneBorderColor(zone)} rounded-lg p-4`}>
                  <div className="flex items-start space-x-3">
                    {zone === 'green' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        zone === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    )}
                    <div>
                      <h3 className={`font-semibold ${getZoneColor(zone)}`}>
                        {t(`debt-burden.zones.${zone}.title`)}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        {t(`debt-burden.zones.${zone}.description`)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">{t('debt-burden.totalObligations')}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatNumber(totalPayments)} {t('debt-burden.currency')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">{t('debt-burden.freeIncome')}</span>
                    <span className={`text-sm font-semibold ${freeIncome > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(freeIncome)} {t('debt-burden.currency')}
                    </span>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">{t('debt-burden.recommendationTitle')}</h3>
                      <p className="text-sm text-blue-800 mt-1">
                        {t(`debt-burden.zones.${zone}.recommendation`)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* New credit simulation */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('debt-burden.newCreditTitle')}</h3>
                  <p className="text-sm text-gray-600 mb-3">{t('debt-burden.newCreditDescription')}</p>

                  <div className="relative mb-4">
                    <input
                      type="number"
                      value={newCreditPayment}
                      onChange={(e) => setNewCreditPayment(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder={t('debt-burden.newCreditPlaceholder')}
                      min={0}
                      step={1000}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      {t('debt-burden.currency')}
                    </span>
                  </div>

                  {newPaymentNum > 0 && incomeNum > 0 && (
                    <div className={`bg-gradient-to-r ${getZoneBg(newZone)} rounded-lg p-3`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{t('debt-burden.newDtiLabel')}</span>
                        <span className={`text-lg font-bold ${getZoneColor(newZone)}`}>
                          {newDti.toFixed(1)}%
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${getZoneColor(newZone)}`}>
                        {t(`debt-burden.zones.${newZone}.title`)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                {t('debt-burden.enterDataPrompt')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export */}
      {incomeNum > 0 && totalPayments > 0 && (
        <div className="mt-6 sm:mt-8">
          <ExportButtons
            data={{
              title: t('debt-burden.exportTitle'),
              subtitle: `DTI: ${dti.toFixed(1)}%`,
              sections: [
                {
                  title: t('debt-burden.incomeLabel'),
                  data: [
                    { label: t('debt-burden.incomeLabel'), value: `${formatNumber(incomeNum)} ${t('debt-burden.currency')}` }
                  ]
                },
                {
                  title: t('debt-burden.creditsTitle'),
                  data: credits
                    .filter(c => parseFloat(c.payment) > 0)
                    .map(c => ({
                      label: c.name || t('debt-burden.untitledCredit'),
                      value: `${formatNumber(parseFloat(c.payment) || 0)} ${t('debt-burden.currency')}`
                    }))
                },
                {
                  title: t('debt-burden.resultsTitle'),
                  data: [
                    { label: 'DTI', value: `${dti.toFixed(1)}%` },
                    { label: t('debt-burden.totalObligations'), value: `${formatNumber(totalPayments)} ${t('debt-burden.currency')}` },
                    { label: t('debt-burden.freeIncome'), value: `${formatNumber(freeIncome)} ${t('debt-burden.currency')}` },
                    { label: t('debt-burden.status'), value: t(`debt-burden.zones.${zone}.title`) }
                  ]
                }
              ],
              footer: t('debt-burden.calculatedOn') + ' calk.kz'
            }}
            filename="debt-burden-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="debt-burden" />
      <MethodologySection steps={getMethodology('debt-burden')} />
      <FAQSection
        items={[
          { question: t('debt-burden.faq.q1'), answer: t('debt-burden.faq.a1') },
          { question: t('debt-burden.faq.q2'), answer: t('debt-burden.faq.a2') },
          { question: t('debt-burden.faq.q3'), answer: t('debt-burden.faq.a3') },
          { question: t('debt-burden.faq.q4'), answer: t('debt-burden.faq.a4') },
          { question: t('debt-burden.faq.q5'), answer: t('debt-burden.faq.a5') }
        ]}
        sources={[
          { title: t('debt-burden.sourceNBRK'), url: 'https://www.nationalbank.kz' },
        ]}
      />

      {/* Expert */}
      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      {/* Embed Widget */}
      <EmbedWidget
        calculatorId="debt-burden"
        calculatorTitle={t('debt-burden.heading')}
      />
      <LastUpdated calculatorId="debt-burden" />
    </div>
  );
}
