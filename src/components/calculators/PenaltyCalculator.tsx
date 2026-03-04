import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Calculator, Clock, DollarSign, Info, Calendar, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function PenaltyCalculator() {
  const { t } = useTranslation('calculators');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [daysOverdue, setDaysOverdue] = useState<string>('');
  const [penaltyRate, setPenaltyRate] = useState<string>('');
  const [penaltyType, setPenaltyType] = useState<string>('custom');

  const [results, setResults] = useState({
    dailyPenalty: 0,
    totalPenalty: 0,
    totalToPay: 0,
    effectivePenaltyRate: 0,
    dailyPenaltyRate: 0
  });

  const penaltyTypes = [
    {
      id: 'tax',
      name: t('penalty.tax'),
      rate: t('penalty.taxRate'),
      description: t('penalty.taxDescription'),
      example: t('penalty.taxExample')
    },
    {
      id: 'utilities',
      name: t('penalty.utilities'),
      rate: t('penalty.utilitiesRate'),
      description: t('penalty.utilitiesDescription'),
      example: t('penalty.utilitiesExample')
    },
    {
      id: 'contract',
      name: t('penalty.contract'),
      rate: t('penalty.contractRate'),
      description: t('penalty.contractDescription'),
      example: t('penalty.contractExample')
    },
    {
      id: 'administrative',
      name: t('penalty.administrative'),
      rate: t('penalty.administrativeRate'),
      description: t('penalty.administrativeDescription'),
      example: t('penalty.administrativeExample')
    },
    {
      id: 'rent',
      name: t('penalty.rent'),
      rate: t('penalty.rentRate'),
      description: t('penalty.rentDescription'),
      example: t('penalty.rentExample')
    },
    {
      id: 'custom',
      name: t('penalty.custom'),
      rate: '',
      description: t('penalty.customDescription'),
      example: t('penalty.customExample')
    }
  ];

  const calculatePenalty = () => {
    const debt = parseFloat(debtAmount) || 0;
    const days = parseInt(daysOverdue) || 0;
    let rate = parseFloat(penaltyRate) || 0;

    if (penaltyType !== 'custom') {
      const selectedType = penaltyTypes.find(type => type.id === penaltyType);
      if (selectedType && selectedType.rate) {
        rate = parseFloat(selectedType.rate);
        setPenaltyRate(selectedType.rate);
      }
    }

    if (debt <= 0 || days <= 0 || rate <= 0) {
      setResults({
        dailyPenalty: 0,
        totalPenalty: 0,
        totalToPay: 0,
        effectivePenaltyRate: 0,
        dailyPenaltyRate: 0
      });
      return;
    }

    const dailyPenaltyRate = rate / 100;
    const dailyPenalty = debt * dailyPenaltyRate;
    const totalPenalty = dailyPenalty * days;
    const totalToPay = debt + totalPenalty;
    const effectivePenaltyRate = debt > 0 ? (totalPenalty / debt) * 100 : 0;

    setResults({
      dailyPenalty: Math.round(dailyPenalty),
      totalPenalty: Math.round(totalPenalty),
      totalToPay: Math.round(totalToPay),
      effectivePenaltyRate: Number(effectivePenaltyRate.toFixed(2)),
      dailyPenaltyRate: Number(dailyPenaltyRate.toFixed(4))
    });
  };

  useEffect(() => {
    calculatePenalty();
  }, [debtAmount, daysOverdue, penaltyRate, penaltyType]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const selectedPenaltyType = penaltyTypes.find(type => type.id === penaltyType);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('penalty.heading')}</h1>
            <p className="text-gray-600">{t('penalty.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('penalty.calculationParameters')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('penalty.debtType')}
              </label>
              <div className="space-y-2">
                {penaltyTypes.map((type) => (
                  <label key={type.id} className="flex items-start">
                    <input
                      type="radio"
                      name="penaltyType"
                      value={type.id}
                      checked={penaltyType === type.id}
                      onChange={(e) => setPenaltyType(e.target.value)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 mt-0.5"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{type.name}</div>
                      <div className="text-xs text-gray-600">{type.description}</div>
                      {type.example && (
                        <div className="text-xs text-gray-500 mt-1">{t('penalty.appliesTo')} {type.example}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('penalty.debtAmount')}
              </label>
              <RangeSlider
                value={parseFloat(debtAmount) || 0}
                onChange={(val) => setDebtAmount(String(val))}
                min={10000}
                max={10000000}
                step={10000}
                formatValue={(v) => `${v.toLocaleString()} ₸`}
                color="#ef4444"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  id="debtAmount"
                  value={debtAmount}
                  onChange={(e) => setDebtAmount(e.target.value)}
                  placeholder={t('penalty.debtAmountPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="daysOverdue" className="block text-sm font-medium text-gray-700 mb-2">
                {t('penalty.daysOverdue')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="daysOverdue"
                  value={daysOverdue}
                  onChange={(e) => setDaysOverdue(e.target.value)}
                  placeholder={t('penalty.daysOverduePlaceholder')}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('penalty.days')}</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="penaltyRate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('penalty.penaltyRate')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="penaltyRate"
                  value={penaltyRate}
                  onChange={(e) => setPenaltyRate(e.target.value)}
                  placeholder={t('penalty.penaltyRatePlaceholder')}
                  step="0.001"
                  disabled={penaltyType !== 'custom'}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                    penaltyType !== 'custom' ? 'bg-gray-50' : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{t('penalty.perDay')}</span>
                </div>
              </div>
              {penaltyType !== 'custom' && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('penalty.autoRate')}
                </p>
              )}
            </div>

            {selectedPenaltyType && (
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-red-900 mb-2">
                  {selectedPenaltyType.name}
                </h3>
                <p className="text-sm text-red-800">
                  {selectedPenaltyType.description}
                </p>
                {selectedPenaltyType.example && (
                  <p className="text-xs text-red-700 mt-2">
                    <strong>{t('penalty.appliesTo')}</strong> {selectedPenaltyType.example}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('penalty.calculationResults')}</h2>

          <div className="space-y-6">
            {results.totalPenalty > 0 ? (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{t('penalty.calculationParams')}</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>{t('penalty.debtAmountLabel')} <strong>{formatNumber(parseFloat(debtAmount) || 0)}</strong></div>
                    <div>{t('penalty.daysOverdueLabel')} <strong>{daysOverdue} {t('penalty.days')}</strong></div>
                    <div>{t('penalty.penaltyRateLabel')} <strong>{penaltyRate}{t('penalty.perDay')}</strong></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4">
                    <span className="font-medium text-blue-900">{t('penalty.dailyPenalty')}</span>
                    <span className="text-lg font-bold text-blue-700">{formatNumber(results.dailyPenalty)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-orange-50 rounded-lg px-4">
                    <span className="font-medium text-orange-900">{t('penalty.totalPenaltyForDays')} {daysOverdue} {t('penalty.days')}</span>
                    <span className="text-lg font-bold text-orange-700">{formatNumber(results.totalPenalty)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-red-50 rounded-lg px-4">
                    <span className="font-medium text-red-900">{t('penalty.principalDebt')}</span>
                    <span className="text-lg font-bold text-red-700">{formatNumber(parseFloat(debtAmount) || 0)}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-900">{t('penalty.totalToPay')}</span>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-6 h-6 text-red-600" />
                      <span className="text-2xl font-bold text-red-700">{formatNumber(results.totalToPay)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {t('penalty.principalPlusPenalty')}
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">{t('penalty.additionalInfo')}</h3>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div>{t('penalty.effectivePenaltyRate')} <strong>{results.effectivePenaltyRate}%</strong> {t('penalty.ofDebtAmount')}</div>
                    <div>{t('penalty.dailyRate')} <strong>{(results.dailyPenaltyRate * 100).toFixed(4)}%</strong> {t('penalty.ofDebtAmount')}</div>
                    {results.effectivePenaltyRate > 50 && (
                      <div className="text-red-600 font-medium">
                        {t('penalty.penaltyExceeds50')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('penalty.formula')}</h4>
                  <div className="font-mono text-sm text-gray-900 bg-white p-3 rounded border">
                    {formatNumber(parseFloat(debtAmount) || 0)} × {penaltyRate}% ÷ 100 × {daysOverdue} {t('penalty.days')} = {formatNumber(results.totalPenalty)}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('penalty.enterParameters')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('penalty.examples')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3">{t('penalty.taxDebtExample')}</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div><strong>{t('penalty.taxDebtIPNLabel')}</strong> 100,000 ₸</div>
              <div><strong>{t('penalty.overdueLabel')}</strong> 30 {t('penalty.days')}</div>
              <div><strong>{t('penalty.rateLabel')}</strong> 0.07{t('penalty.perDay')}</div>
              <div className="border-t pt-2">
                <div><strong>{t('penalty.penaltyLabel')}</strong> 100,000 × 0.07% × 30 = 2,100 ₸</div>
                <div><strong>{t('penalty.toPayLabel')}</strong> 102,100 ₸</div>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('penalty.utilitiesExample')}</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div><strong>{t('penalty.electricityDebt')}</strong> 25,000 ₸</div>
              <div><strong>{t('penalty.overdueLabel')}</strong> 45 {t('penalty.days')}</div>
              <div><strong>{t('penalty.rateLabel')}</strong> 0.05{t('penalty.perDay')}</div>
              <div className="border-t pt-2">
                <div><strong>{t('penalty.penaltyLabel')}</strong> 25,000 × 0.05% × 45 = 562 ₸</div>
                <div><strong>{t('penalty.toPayLabel')}</strong> 25,562 ₸</div>
              </div>
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('penalty.contractExample')}</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div><strong>{t('penalty.contractDebt')}</strong> 500,000 ₸</div>
              <div><strong>{t('penalty.overdueLabel')}</strong> 15 {t('penalty.days')}</div>
              <div><strong>{t('penalty.rateLabel')}</strong> 0.1{t('penalty.perDay')}</div>
              <div className="border-t pt-2">
                <div><strong>{t('penalty.penaltyLabel')}</strong> 500,000 × 0.1% × 15 = 7,500 ₸</div>
                <div><strong>{t('penalty.toPayLabel')}</strong> 507,500 ₸</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('penalty.legalRegulation')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('penalty.taxLegislation')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('penalty.taxLaw1')}</li>
                  <li>{t('penalty.taxLaw2')}</li>
                  <li>{t('penalty.taxLaw3')}</li>
                  <li>{t('penalty.taxLaw4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('penalty.civilLaw')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('penalty.civilLaw1')}</li>
                  <li>{t('penalty.civilLaw2')}</li>
                  <li>{t('penalty.civilLaw3')}</li>
                  <li>{t('penalty.civilLaw4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('penalty.penaltyRatesReference')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('penalty.debtTypeColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('penalty.dailyRateColumn')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('penalty.monthlyRateColumn')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('penalty.legalBasisColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {penaltyTypes.filter(type => type.id !== 'custom').map((type) => (
                <tr key={type.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{type.name}</td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-red-600">
                    {type.rate}%
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-900">
                    {(parseFloat(type.rate) * 30).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {type.id === 'tax' && t('penalty.taxCodeRK')}
                    {type.id === 'utilities' && t('penalty.naturalMonopoliesLaw')}
                    {type.id === 'contract' && t('penalty.civilCodeRK')}
                    {type.id === 'administrative' && t('penalty.coapRK')}
                    {type.id === 'rent' && t('penalty.civilCodeRK')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('penalty.importantPoints')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• <strong>{t('penalty.ratesMayChange')}</strong> {t('penalty.ratesMayChangeDesc')}</p>
                <p>• <strong>{t('penalty.contractualPenalties')}</strong> {t('penalty.contractualPenaltiesDesc')}</p>
                <p>• <strong>{t('penalty.courtMayReduce')}</strong> {t('penalty.courtMayReduceDesc')}</p>
                <p>• <strong>{t('penalty.penaltiesAccrue')}</strong> {t('penalty.penaltiesAccrueDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('penalty.applicationScenarios')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('penalty.taxesAndContributions')}</h3>
            <p className="text-gray-600 text-sm">
              {t('penalty.taxesAndContributionsDesc')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('penalty.utilitiesServices')}</h3>
            <p className="text-gray-600 text-sm">
              {t('penalty.utilitiesServicesDesc')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('penalty.commercialContracts')}</h3>
            <p className="text-gray-600 text-sm">
              {t('penalty.commercialContractsDesc')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('penalty.practicalTips')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('penalty.forDebtors')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('penalty.debtorTip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('penalty.debtorTip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('penalty.debtorTip3')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('penalty.forCreditors')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('penalty.creditorTip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('penalty.creditorTip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('penalty.creditorTip3')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('penalty.termCalculationFeatures')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('penalty.termCalculationFeaturesDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('penalty.faq.q1'), answer: t('penalty.faq.a1') },
          { question: t('penalty.faq.q2'), answer: t('penalty.faq.a2') },
          { question: t('penalty.faq.q3'), answer: t('penalty.faq.a3') },
          { question: t('penalty.faq.q4'), answer: t('penalty.faq.a4') },
          { question: t('penalty.faq.q5'), answer: t('penalty.faq.a5') }
        ]}
        sources={[
          { title: 'Гражданский кодекс РК, ст. 353', url: 'https://online.zakon.kz/document/?doc_id=1006061' },
          { title: 'Налоговый кодекс РК, ст. 117', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
        ]}
      />

      {/* Диаграмма структуры */}
      {results && results.penaltyAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Основной долг', value: results.debtAmount },
              { name: 'Пеня', value: results.penaltyAmount },
            ]}
            title="Структура задолженности"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.penaltyAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт пени',
              subtitle: `${results.daysOverdue} дней просрочки`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Сумма долга', value: `${results.debtAmount.toLocaleString()} ₸` },
                    { label: 'Дней просрочки', value: results.daysOverdue },
                    { label: 'Пеня', value: `${results.penaltyAmount.toLocaleString()} ₸` },
                    { label: 'Итого к оплате', value: `${results.totalAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="penalty-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="penalty"
        calculatorTitle="Калькулятор пеней"
      />
    </div>
  );
}
