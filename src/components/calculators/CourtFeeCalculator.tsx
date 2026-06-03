import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Calculator, Users, Building, AlertTriangle, Info, FileText, Gavel, BarChart3 } from 'lucide-react';
import { RangeSlider } from '../ui/RangeSlider';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function CourtFeeCalculator() {
  const { t } = useTranslation('calculators');
  const [claimantType, setClaimantType] = useState<'individual' | 'legal'>('individual');
  const [claimType, setClaimType] = useState<'property' | 'non-property'>('property');
  const [claimAmount, setClaimAmount] = useState<string>('1000000');
  const [nonPropertyClaimType, setNonPropertyClaimType] = useState<string>('divorce');

  const [results, setResults] = useState({
    feeAmount: 0,
    feeRate: 0,
    maxAmount: 0,
    isMaxReached: false,
    feeDescription: ''
  });

  const MRP_2026 = 4325;
  const MAX_FEE_INDIVIDUAL = 10000 * MRP_2026;
  const MAX_FEE_LEGAL = 20000 * MRP_2026;

  const nonPropertyFees = {
    divorce: { individual: 4, legal: 0 },
    alimony: { individual: 1, legal: 0 },
    labor: { individual: 0.5, legal: 2 },
    administrative: { individual: 2, legal: 5 },
    bankruptcy: { individual: 50, legal: 100 },
    arbitration: { individual: 10, legal: 20 },
    corporate: { individual: 0, legal: 15 },
    inheritance: { individual: 3, legal: 0 },
    consumer: { individual: 1, legal: 0 },
    housing: { individual: 2, legal: 5 }
  };

  const calculateCourtFee = () => {
    if (claimType === 'property') {
      const amount = parseFloat(claimAmount) || 0;

      if (amount <= 0) {
        setResults({
          feeAmount: 0, feeRate: 0, maxAmount: 0,
          isMaxReached: false, feeDescription: ''
        });
        return;
      }

      const rate = claimantType === 'individual' ? 0.01 : 0.03;
      const maxAmount = claimantType === 'individual' ? MAX_FEE_INDIVIDUAL : MAX_FEE_LEGAL;

      const calculatedFee = amount * rate;
      const feeAmount = Math.min(calculatedFee, maxAmount);
      const isMaxReached = calculatedFee >= maxAmount;

      setResults({
        feeAmount: Math.round(feeAmount),
        feeRate: rate * 100,
        maxAmount,
        isMaxReached,
        feeDescription: `${rate * 100}% ${t('court-fee.ofClaimAmount')}`
      });
    } else {
      const feeInfo = nonPropertyFees[nonPropertyClaimType as keyof typeof nonPropertyFees];
      const feeInMRP = claimantType === 'individual' ? feeInfo.individual : feeInfo.legal;

      if (feeInMRP === 0) {
        setResults({
          feeAmount: 0, feeRate: 0, maxAmount: 0,
          isMaxReached: false, feeDescription: t('court-fee.exemption')
        });
      } else {
        setResults({
          feeAmount: Math.round(feeInMRP * MRP_2026),
          feeRate: 0,
          maxAmount: 0,
          isMaxReached: false,
          feeDescription: `${feeInMRP} МРП`
        });
      }
    }
  };

  useEffect(() => {
    calculateCourtFee();
  }, [claimantType, claimType, claimAmount, nonPropertyClaimType]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatMRP = (mrpAmount: number) => {
    return `${mrpAmount} МРП (${formatNumber(mrpAmount * MRP_2026)})`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('court-fee.heading')}</h1>
            <p className="text-gray-600">{t('court-fee.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="court-fee" />
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('court-fee.claimParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('court-fee.claimantType')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setClaimantType('individual')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    claimantType === 'individual'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">{t('court-fee.individual')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('court-fee.individualDesc')}</div>
                </button>
                <button
                  onClick={() => setClaimantType('legal')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    claimantType === 'legal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Building className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">{t('court-fee.legal')}</div>
                  <div className="text-xs text-gray-600 mt-1">{t('court-fee.legalDesc')}</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('court-fee.claimNature')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setClaimType('property')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    claimType === 'property'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-medium mb-1">{t('court-fee.property')}</div>
                  <div className="text-xs text-gray-600">{t('court-fee.propertyDesc')}</div>
                </button>
                <button
                  onClick={() => setClaimType('non-property')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    claimType === 'non-property'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-medium mb-1">{t('court-fee.nonProperty')}</div>
                  <div className="text-xs text-gray-600">{t('court-fee.nonPropertyDesc')}</div>
                </button>
              </div>
            </div>

            {claimType === 'property' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('court-fee.claimAmount')}
                </label>
                <RangeSlider
                  value={parseFloat(claimAmount) || 0}
                  onChange={(val) => setClaimAmount(String(val))}
                  min={100000}
                  max={100000000}
                  step={500000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#6366f1"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="claimAmount"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder={t('court-fee.claimAmountPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>
            )}

            {claimType === 'non-property' && (
              <div>
                <label htmlFor="nonPropertyClaimType" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('court-fee.nonPropertyClaimType')}
                </label>
                <select
                  id="nonPropertyClaimType"
                  value={nonPropertyClaimType}
                  onChange={(e) => setNonPropertyClaimType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {Object.keys(nonPropertyFees).map((key) => (
                    <option key={key} value={key}>
                      {t(`calculators:court-fee.${key}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('court-fee.feeRates2025')}</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div><strong>{t('court-fee.propertyClaims')}</strong></div>
                <div>• {t('court-fee.individualRate')} {formatMRP(10000)}</div>
                <div>• {t('court-fee.legalRate')} {formatMRP(20000)}</div>
                <div><strong>{t('court-fee.nonPropertyFixed')}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('court-fee.calculationResult')}</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('court-fee.courtFeeAmount')}</span>
                <div className="flex items-center space-x-2">
                  <Gavel className="w-6 h-6 text-teal-600" />
                  <span className="text-2xl font-bold text-teal-700">{formatNumber(results.feeAmount)}</span>
                </div>
              </div>
              {results.feeDescription && (
                <div className="text-sm text-gray-600">{results.feeDescription}</div>
              )}
            </div>

            {claimType === 'property' && results.feeAmount > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('court-fee.claimAmount')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(parseFloat(claimAmount) || 0)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('court-fee.courtFeeAmount')}</span>
                  <span className="font-semibold text-gray-900">{results.feeRate}%</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{claimantType === 'individual' ? t('court-fee.maxForIndividuals') : t('court-fee.maxForLegal')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.maxAmount)}</span>
                </div>

                {results.isMaxReached && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-900">{t('court-fee.maxReached')}</h3>
                        <p className="text-amber-800 text-sm">
                          {t('court-fee.maxReachedText')} {claimantType === 'individual' ? t('court-fee.individuals') : t('court-fee.legalEntities')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {results.feeAmount === 0 && nonPropertyClaimType && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">{t('court-fee.exemptionTitle')}</h3>
                    <p className="text-green-800 text-sm">
                      {t('court-fee.exemptionText')} {claimantType === 'individual' ? t('court-fee.individuals') : t('court-fee.legalEntities')} {t('court-fee.exemptionTextEnd')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('court-fee.feeRatesTable')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('court-fee.propertyClaimsTable')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 px-3 bg-blue-50 rounded">
                <span className="text-blue-800">{t('court-fee.individualsFee')}</span>
                <span className="font-medium text-blue-700">{t('court-fee.individualsFeeRate')}</span>
              </div>
              <div className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                <span className="text-gray-700">{t('court-fee.maxForIndividuals')}</span>
                <span className="font-medium">{formatMRP(10000)}</span>
              </div>
              <div className="flex justify-between text-sm py-2 px-3 bg-orange-50 rounded">
                <span className="text-orange-800">{t('court-fee.legalEntitiesFee')}</span>
                <span className="font-medium text-orange-700">{t('court-fee.legalEntitiesFeeRate')}</span>
              </div>
              <div className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                <span className="text-gray-700">{t('court-fee.maxForLegal')}</span>
                <span className="font-medium">{formatMRP(20000)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6">{t('court-fee.nonPropertyClaimsExamples')}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.keys(nonPropertyFees).slice(0, 8).map((key) => {
                const value = nonPropertyFees[key as keyof typeof nonPropertyFees];
                return (
                  <div key={key} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                    <span className="text-gray-700">{t(`calculators:court-fee.${key}`)}</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {value.individual > 0 ? `${value.individual} МРП` : t('court-fee.exemption')} / {value.legal > 0 ? `${value.legal} МРП` : t('court-fee.exemption')}
                      </div>
                      <div className="text-xs text-gray-500">{t('court-fee.individualShort')} / {t('court-fee.legalShort')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('court-fee.importantNote')}</strong> {t('court-fee.importantText')}
            <br />
            <strong>{t('court-fee.mrp2025')}</strong> {formatNumber(MRP_2026)}
          </p>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="court-fee" />
      <MethodologySection steps={getMethodology('court-fee')} />
      <FAQSection
        items={[
          { question: t('court-fee.faq.q1'), answer: t('court-fee.faq.a1') },
          { question: t('court-fee.faq.q2'), answer: t('court-fee.faq.a2') },
          { question: t('court-fee.faq.q3'), answer: t('court-fee.faq.a3') },
          { question: t('court-fee.faq.q4'), answer: t('court-fee.faq.a4') },
          { question: t('court-fee.faq.q5'), answer: t('court-fee.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК, глава 78', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'Судебная система РК', url: 'https://sud.gov.kz/' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.feeAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Госпошлина', value: results.feeAmount },
            ]}
            title="Судебная госпошлина"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.feeAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт госпошлины',
              subtitle: claimType === 'property' ? 'Имущественный иск' : 'Неимущественный иск',
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Тип дела', value: claimType === 'property' ? 'Имущественный' : 'Неимущественный' },
                    { label: 'Сумма иска', value: `${parseFloat(claimAmount || '0').toLocaleString()} ₸` },
                    { label: 'Госпошлина', value: `${results.feeAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="court-fee-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="court-fee"
        calculatorTitle="Калькулятор госпошлины"
      />
      <LastUpdated calculatorId="court-fee" />
    </div>
  );
}
