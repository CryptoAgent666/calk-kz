import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Calculator, TrendingUp, AlertTriangle, Info, Plus, Trash2, Calendar } from 'lucide-react';
import SharePrintButtons from '../SharePrintButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

interface WinningEntry {
  id: string;
  amount: string;
  stake: string;
  date: string;
}

export default function CasinoWinningsTaxCalculator() {
  const { t } = useTranslation('calculators');
  const [winningAmount, setWinningAmount] = useState<string>('500000');
  const [stakeAmount, setStakeAmount] = useState<string>('50000');
  const [isResident, setIsResident] = useState<boolean>(true);
  const [winningDate, setWinningDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [locationInKz, setLocationInKz] = useState<boolean>(true);
  const [multipleMode, setMultipleMode] = useState<boolean>(false);
  const [winningEntries, setWinningEntries] = useState<WinningEntry[]>([
    { id: '1', amount: '', stake: '', date: '' }
  ]);

  const [results, setResults] = useState({
    grossWinning: 0,
    totalStake: 0,
    taxFreeThreshold: 0,
    taxableBase: 0,
    taxAmount: 0,
    netAmount: 0,
    effectiveRate: 0,
    isAboveThreshold: false,
    isTaxable: false,
    requiresSelfDeclaration: false
  });

  const MRP_2026 = 4325;
  // НК РК 2026: специального необлагаемого минимума по выигрышам нет.
  // ИПН 10% удерживается у источника с чистого выигрыша (выигрыш − сумма ставки).
  const TAX_FREE_THRESHOLD = 0;
  const TAX_RATE = 0.10;

  const calculateTax = (gross: number, stake: number) => {
    if (gross <= 0) {
      return {
        grossWinning: 0,
        totalStake: 0,
        taxFreeThreshold: TAX_FREE_THRESHOLD,
        taxableBase: 0,
        taxAmount: 0,
        netAmount: 0,
        effectiveRate: 0,
        isAboveThreshold: false,
        isTaxable: false,
        requiresSelfDeclaration: false
      };
    }

    const totalStake = Math.max(0, stake);

    // Облагается чистый выигрыш (выигрыш − ставка), без необлагаемого минимума.
    const taxableBase = Math.max(0, gross - totalStake);
    const isTaxable = taxableBase > 0;
    const taxAmount = isTaxable ? taxableBase * TAX_RATE : 0;
    const isAboveThreshold = isTaxable;

    const netAmount = gross - taxAmount;
    const effectiveRate = gross > 0 ? (taxAmount / gross) * 100 : 0;

    const requiresSelfDeclaration = !locationInKz;

    return {
      grossWinning: Math.round(gross),
      totalStake: Math.round(totalStake),
      taxFreeThreshold: TAX_FREE_THRESHOLD,
      taxableBase: Math.round(taxableBase),
      taxAmount: Math.round(taxAmount),
      netAmount: Math.round(netAmount),
      effectiveRate: Number(effectiveRate.toFixed(2)),
      isAboveThreshold,
      isTaxable,
      requiresSelfDeclaration
    };
  };

  const calculateMultipleWinnings = () => {
    let totalGross = 0;
    let totalStake = 0;
    let totalTax = 0;

    winningEntries.forEach(entry => {
      const gross = parseFloat(entry.amount) || 0;
      const stake = parseFloat(entry.stake) || 0;

      totalGross += gross;
      totalStake += stake;

      const taxableBase = Math.max(0, gross - stake);
      totalTax += taxableBase * TAX_RATE;
    });

    const netAmount = totalGross - totalTax;
    const effectiveRate = totalGross > 0 ? (totalTax / totalGross) * 100 : 0;

    return {
      grossWinning: Math.round(totalGross),
      totalStake: Math.round(totalStake),
      taxFreeThreshold: TAX_FREE_THRESHOLD,
      taxableBase: Math.round(totalGross - totalStake),
      taxAmount: Math.round(totalTax),
      netAmount: Math.round(netAmount),
      effectiveRate: Number(effectiveRate.toFixed(2)),
      isAboveThreshold: totalTax > 0,
      isTaxable: totalTax > 0,
      requiresSelfDeclaration: !locationInKz
    };
  };

  useEffect(() => {
    if (multipleMode) {
      setResults(calculateMultipleWinnings());
    } else {
      const gross = parseFloat(winningAmount) || 0;
      const stake = parseFloat(stakeAmount) || 0;
      setResults(calculateTax(gross, stake));
    }
  }, [winningAmount, stakeAmount, isResident, locationInKz, multipleMode, winningEntries, t]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const addWinningEntry = () => {
    const newEntry: WinningEntry = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
      amount: '',
      stake: '',
      date: ''
    };
    setWinningEntries([...winningEntries, newEntry]);
  };

  const removeWinningEntry = (id: string) => {
    if (winningEntries.length > 1) {
      setWinningEntries(winningEntries.filter(entry => entry.id !== id));
    }
  };

  const updateWinningEntry = (id: string, field: keyof WinningEntry, value: string) => {
    setWinningEntries(winningEntries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const clearAll = () => {
    setWinningAmount('');
    setStakeAmount('');
    setWinningDate('');
    setWinningEntries([{ id: '1', amount: '', stake: '', date: '' }]);
  };

  const loadExample = () => {
    setWinningAmount('500000');
    setStakeAmount('10000');
    setIsResident(true);
    setLocationInKz(true);
    setMultipleMode(false);
    setWinningDate(new Date().toISOString().split('T')[0]);
  };

  const generateExportData = () => {
    if (multipleMode) {
      const entriesText = winningEntries
        .filter(e => parseFloat(e.amount) > 0)
        .map((e, i) =>
          `${i + 1}. ${t('casino-winnings-tax.winning')}: ${formatNumber(parseFloat(e.amount))}, ${t('casino-winnings-tax.stakeAmountPlaceholder')}: ${formatNumber(parseFloat(e.stake) || 0)}`
        )
        .join('\n');

      return `${t('casino-winnings-tax.multipleWinningsCalculation')}

${t('casino-winnings-tax.parameters')}
- ${t('casino-winnings-tax.taxResident')}: ${isResident ? t('casino-winnings-tax.residentYes') : t('casino-winnings-tax.residentNo')}
- ${t('casino-winnings-tax.gameLocation')}: ${locationInKz ? t('casino-winnings-tax.locationInKz') : t('casino-winnings-tax.locationAbroad')}
- ${t('casino-winnings-tax.winningsCount')} ${winningEntries.length}

${t('casino-winnings-tax.winnings')}
${entriesText}

${t('casino-winnings-tax.calculationResults')}
- ${t('casino-winnings-tax.totalWinnings')} ${formatNumber(results.grossWinning)}
- ${t('casino-winnings-tax.totalStakes')} ${formatNumber(results.totalStake)}
- ${t('casino-winnings-tax.taxFreeMinimum')}: ${formatNumber(results.taxFreeThreshold)}
- ${t('casino-winnings-tax.taxableBase')}: ${formatNumber(results.taxableBase)}
- ${t('casino-winnings-tax.tax')} ${formatNumber(results.taxAmount)}
- ${t('casino-winnings-tax.netAmount')} ${formatNumber(results.netAmount)}
- ${t('casino-winnings-tax.effectiveRate')} ${results.effectiveRate}%`;
    }

    if (!winningAmount || parseFloat(winningAmount) <= 0) return '';

    return `${t('casino-winnings-tax.singleWinningCalculation')}

${t('casino-winnings-tax.parameters')}
- ${t('casino-winnings-tax.winningSum')}: ${formatNumber(parseFloat(winningAmount))}
- ${t('casino-winnings-tax.stakeAmountPlaceholder')}: ${formatNumber(parseFloat(stakeAmount) || 0)}
- ${t('casino-winnings-tax.taxResident')}: ${isResident ? t('casino-winnings-tax.residentYes') : t('casino-winnings-tax.residentNo')}
- ${t('casino-winnings-tax.gameLocation')}: ${locationInKz ? t('casino-winnings-tax.locationInKz') : t('casino-winnings-tax.locationAbroad')}
${winningDate ? `- ${t('casino-winnings-tax.winningDateLabel')} ${winningDate}` : ''}

${t('casino-winnings-tax.calculationResults')}
- ${t('casino-winnings-tax.grossWinningAmount')} ${formatNumber(results.grossWinning)}
- ${t('casino-winnings-tax.deductibleStake')} ${formatNumber(results.totalStake)}
- ${t('casino-winnings-tax.taxFreeMinimum')}: ${formatNumber(results.taxFreeThreshold)}
- ${t('casino-winnings-tax.taxableBase')}: ${formatNumber(results.taxableBase)}
- ${t('casino-winnings-tax.tax')} ${formatNumber(results.taxAmount)}
- ${t('casino-winnings-tax.netAmount')} ${formatNumber(results.netAmount)}
- ${t('casino-winnings-tax.effectiveRate')} ${results.effectiveRate}%

${t('casino-winnings-tax.taxationStatus')}: ${results.isTaxable ? t('casino-winnings-tax.taxable') : t('casino-winnings-tax.notTaxableStatus')}
${results.requiresSelfDeclaration ? `\n⚠️ ${t('casino-winnings-tax.declarationRequiredShort')}` : ''}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="casino-winnings-tax" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('casino-winnings-tax.heading')}</h1>
            <p className="text-gray-600">{t('casino-winnings-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('casino-winnings-tax.calculationParameters')}</h2>
            <div className="flex space-x-2">
              <button
                onClick={loadExample}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                {t('casino-winnings-tax.example')}
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                {t('casino-winnings-tax.clear')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-900">{t('casino-winnings-tax.multipleWinnings')}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={multipleMode}
                  onChange={(e) => setMultipleMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {!multipleMode ? (
              <>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <span>{t('casino-winnings-tax.winningAmount')}</span>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        {t('casino-winnings-tax.winningAmountTooltip')}
                      </div>
                    </div>
                  </label>
                  <RangeSlider
                    value={parseFloat(winningAmount) || 0}
                    onChange={(val) => setWinningAmount(String(val))}
                    min={10000}
                    max={10000000}
                    step={50000}
                    formatValue={(v) => `${v.toLocaleString()} ₸`}
                    color="#f59e0b"
                  />
                  <input
                    type="number"
                    value={winningAmount}
                    onChange={(e) => setWinningAmount(e.target.value)}
                    placeholder="500000"
                    className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <span>{t('casino-winnings-tax.stakeAmount')}</span>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                        {t('casino-winnings-tax.stakeAmountTooltip')}
                      </div>
                    </div>
                  </label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{t('casino-winnings-tax.winningDate')}</span>
                  </label>
                  <input
                    type="date"
                    value={winningDate}
                    onChange={(e) => setWinningDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{t('casino-winnings-tax.winningsList')}</h3>
                  <button
                    onClick={addWinningEntry}
                    className="flex items-center space-x-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('casino-winnings-tax.add')}</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {winningEntries.map((entry, index) => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">{t('casino-winnings-tax.winning')} #{index + 1}</span>
                        {winningEntries.length > 1 && (
                          <button
                            onClick={() => removeWinningEntry(entry.id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={entry.amount}
                          onChange={(e) => updateWinningEntry(entry.id, 'amount', e.target.value)}
                          placeholder={t('casino-winnings-tax.winningAmountPlaceholder')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          value={entry.stake}
                          onChange={(e) => updateWinningEntry(entry.id, 'stake', e.target.value)}
                          placeholder={t('casino-winnings-tax.stakeAmountPlaceholder')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                        <input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateWinningEntry(entry.id, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{t('casino-winnings-tax.taxResident')}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isResident}
                    onChange={(e) => setIsResident(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{t('casino-winnings-tax.gameInKz')}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationInKz}
                    onChange={(e) => setLocationInKz(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h2 className="text-xl font-bold">{t('casino-winnings-tax.calculationResults')}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-amber-100">{t('casino-winnings-tax.grossWinning')}</span>
                <span className="text-2xl font-bold">{formatNumber(results.grossWinning)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-amber-100">{t('casino-winnings-tax.stakeDeduction')}</span>
                <span className="text-lg font-semibold">- {formatNumber(results.totalStake)}</span>
              </div>

              <div className="border-t border-amber-400 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-amber-100">{t('casino-winnings-tax.tax')}</span>
                  <span className="text-xl font-bold text-red-100">- {formatNumber(results.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-100">{t('casino-winnings-tax.netAmount')}</span>
                  <span className="text-2xl font-bold">{formatNumber(results.netAmount)}</span>
                </div>
              </div>

              <div className="bg-white/20 rounded-lg p-3 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span>{t('casino-winnings-tax.effectiveRate')}</span>
                  <span className="font-bold">{results.effectiveRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {results.grossWinning > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('casino-winnings-tax.calculationDetails')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('casino-winnings-tax.winningSum')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.grossWinning)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('casino-winnings-tax.minusStake')}</span>
                  <span className="font-semibold text-gray-900">- {formatNumber(results.totalStake)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('casino-winnings-tax.taxFreeMinimum')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.taxFreeThreshold)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('casino-winnings-tax.taxableBase')}</span>
                  <span className="font-semibold text-gray-900">{formatNumber(results.taxableBase)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('casino-winnings-tax.taxRate')}</span>
                  <span className="font-semibold text-amber-600">10%</span>
                </div>
                <div className="flex justify-between py-3 bg-amber-50 rounded-lg px-3 mt-2">
                  <span className="font-semibold text-gray-900">{t('casino-winnings-tax.taxToPay')}</span>
                  <span className="font-bold text-amber-600">{formatNumber(results.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-3 bg-green-50 rounded-lg px-3">
                  <span className="font-semibold text-gray-900">{t('casino-winnings-tax.toReceive')}</span>
                  <span className="font-bold text-green-600">{formatNumber(results.netAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {results.grossWinning > 0 && !results.isAboveThreshold && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">{t('casino-winnings-tax.notTaxable')}</h4>
                <p className="text-sm text-green-700">
                  Чистый выигрыш (выигрыш за вычетом суммы ставки) равен нулю — налогооблагаемой базы по ИПН нет.
                </p>
              </div>
            </div>
          )}

          {results.requiresSelfDeclaration && results.isTaxable && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">{t('casino-winnings-tax.declarationRequired')}</h4>
                <p className="text-sm text-orange-700">
                  {t('casino-winnings-tax.declarationRequiredDesc')}
                </p>
              </div>
            </div>
          )}

          {!results.requiresSelfDeclaration && results.isTaxable && locationInKz && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">{t('casino-winnings-tax.automaticWithholding')}</h4>
                <p className="text-sm text-blue-700">
                  {t('casino-winnings-tax.automaticWithholdingDesc')}
                </p>
              </div>
            </div>
          )}

          {parseFloat(stakeAmount) > parseFloat(winningAmount) && stakeAmount && winningAmount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">{t('casino-winnings-tax.checkData')}</h4>
                <p className="text-sm text-red-700">
                  {t('casino-winnings-tax.checkDataDesc')}
                </p>
              </div>
            </div>
          )}

          {results.grossWinning > 0 && (
            <SharePrintButtons
              title={t('casino-winnings-tax.heading')}
              description={t('casino-winnings-tax.subtitle')}
              results={generateExportData()}
              disabled={!generateExportData()}
            />
          )}
        </div>
      </div>

      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('casino-winnings-tax.taxationInfo')}</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-2">
                <Calculator className="w-4 h-4 text-amber-600" />
              </div>
              {t('casino-winnings-tax.legalBasis')}
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                {t('casino-winnings-tax.legalBasisText1')}. <strong>{t('casino-winnings-tax.legalBasisText2')}</strong>. {t('casino-winnings-tax.legalBasisText3')}. <strong>{t('casino-winnings-tax.legalBasisText4')}</strong>.
              </p>
              <p>
                {t('casino-winnings-tax.legalBasisText5')}. <strong>{t('casino-winnings-tax.legalBasisText6')}</strong>. {t('casino-winnings-tax.legalBasisText7')}. {t('casino-winnings-tax.legalBasisText8')}.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                <Info className="w-4 h-4 text-green-600" />
              </div>
              {t('casino-winnings-tax.paymentProcedure')}
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>{t('casino-winnings-tax.automaticWithholdingTitle')}</strong> {t('casino-winnings-tax.automaticWithholdingText')}
              </p>
              <p>
                <strong>{t('casino-winnings-tax.selfPaymentTitle')}</strong> {t('casino-winnings-tax.selfPaymentText')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              {t('casino-winnings-tax.deductionsExpenses')}
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                {t('casino-winnings-tax.deductionsText1')}
              </p>
              <p>
                <strong>{t('casino-winnings-tax.calculationFormula')}</strong> {t('casino-winnings-tax.formulaText')}
              </p>
              <p className="text-sm text-gray-600">
                {t('casino-winnings-tax.formulaNote')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-2">
                <AlertTriangle className="w-4 h-4 text-teal-600" />
              </div>
              {t('casino-winnings-tax.importantPoints')}
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>{t('casino-winnings-tax.taxationMoment')}</strong> {t('casino-winnings-tax.taxationMomentText')}
              </p>
              <p>
                <strong>{t('casino-winnings-tax.nonResidents')}</strong> {t('casino-winnings-tax.nonResidentsText')}
              </p>
              <p className="text-sm text-amber-600 font-medium">
                {t('casino-winnings-tax.consultationRecommended')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">{t('casino-winnings-tax.faqTitle')}</h4>
          <div className="space-y-4">
            <details className="group">
              <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {t('casino-winnings-tax.faqQ1')}
                <span className="ml-2 transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-700 text-sm pl-4">
                {t('casino-winnings-tax.faqA1')} {formatNumber(TAX_FREE_THRESHOLD)} {t('casino-winnings-tax.faqA1b')}
              </p>
            </details>

            <details className="group">
              <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {t('casino-winnings-tax.faqQ2')}
                <span className="ml-2 transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-700 text-sm pl-4">
                {t('casino-winnings-tax.faqA2')}
              </p>
            </details>

            <details className="group">
              <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {t('casino-winnings-tax.faqQ3')}
                <span className="ml-2 transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-700 text-sm pl-4">
                {t('casino-winnings-tax.faqA3')}
              </p>
            </details>

            <details className="group">
              <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {t('casino-winnings-tax.faqQ4')}
                <span className="ml-2 transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-700 text-sm pl-4">
                {t('casino-winnings-tax.faqA4')}
              </p>
            </details>

            <details className="group">
              <summary className="font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {t('casino-winnings-tax.faqQ5')}
                <span className="ml-2 transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 text-gray-700 text-sm pl-4">
                {t('casino-winnings-tax.faqA5')}
              </p>
            </details>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>{t('casino-winnings-tax.disclaimer')}</strong> {t('casino-winnings-tax.disclaimerText')}
          </p>
        </div>
      </div>

      {/* Диаграмма */}
      {results && results.taxAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('casino-winnings-tax.netAmount'), value: results.netAmount },
              { name: t('casino-winnings-tax.tax'), value: results.taxAmount },
            ]}
            title={t('casino-winnings-tax.calculationResults')}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.taxAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('casino-winnings-tax.heading'),
              subtitle: t('casino-winnings-tax.subtitle'),
              sections: [
                {
                  title: t('casino-winnings-tax.calculationResults'),
                  data: [
                    { label: t('casino-winnings-tax.grossWinning'), value: `${results.grossWinning.toLocaleString()} ₸` },
                    { label: t('casino-winnings-tax.netAmount'), value: `${results.netAmount.toLocaleString()} ₸` },
                    { label: t('casino-winnings-tax.tax'), value: `${results.taxAmount.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'calk.kz'
            }}
            filename="casino-tax-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="casino-winnings-tax"
        calculatorTitle="Калькулятор налога на выигрыш"
      />
      <MethodologySection steps={getMethodology('casino-winnings-tax')} />
      <CalculatorExamples calculatorId="casino-winnings-tax" />
      <LastUpdated calculatorId="casino-winnings-tax" />
    </div>
  );
}
