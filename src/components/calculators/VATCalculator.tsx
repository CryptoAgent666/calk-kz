import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, Plus, Minus, FileText, Copy, Download, Trash2, RotateCcw, Info, AlertTriangle, Receipt, DollarSign, BarChart3 } from 'lucide-react';
import InputField from '../InputField';
import SharePrintButtons from '../SharePrintButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { getMethodology } from '../../data/calculatorMethodology';

interface VATItem {
  id: string;
  description: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
}

interface CalculationHistory {
  id: string;
  type: string;
  amount: number;
  vatRate: number;
  result: number;
  timestamp: Date;
}

export default function VATCalculator() {
  const { t } = useTranslation('calculators');
  const [calculationType, setCalculationType] = useState<'add' | 'extract' | 'bulk'>('add');
  const [amount, setAmount] = useState<string>('100000');
  const [vatRate, setVatRate] = useState<string>('16');
  const [precision, setPrecision] = useState<number>(2);

  const [items, setItems] = useState<VATItem[]>([]);
  const [newItemDescription, setNewItemDescription] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('');
  const [newItemVatRate, setNewItemVatRate] = useState<string>('16');

  const [history, setHistory] = useState<CalculationHistory[]>([]);

  const [results, setResults] = useState({
    amountWithoutVat: 0,
    vatAmount: 0,
    amountWithVat: 0,
    effectiveRate: 0,
    formula: ''
  });

  const [bulkResults, setBulkResults] = useState({
    totalWithoutVat: 0,
    totalVat: 0,
    totalWithVat: 0,
    itemCount: 0,
    averageVatRate: 0
  });

  const validateAmount = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('vat.validation.invalidAmount');
    if (num < 0) return t('vat.validation.negativeAmount');
    if (num > 1000000000) return t('vat.validation.tooLarge');
    return null;
  };

  const validateVatRate = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('vat.validation.invalidRate');
    if (num < 0) return t('vat.validation.negativeRate');
    if (num > 50) return t('vat.validation.rateTooHigh');
    return null;
  };

  const generateExportData = () => {
    let content = '';

    if (calculationType === 'bulk' && items.length > 0) {
      content += `${t('vat.bulk.title')}:\n\n`;

      items.forEach((item, index) => {
        content += `${index + 1}. ${item.description}
   ${t('vat.result.amountWithoutVat')}: ${formatNumber(item.amount)}
   ${t('vat.result.vat')} (${item.vatRate}%): ${formatNumber(item.vatAmount)}
   ${t('vat.result.amountWithVat')}: ${formatNumber(item.totalWithVat)}

`;
      });

      content += `${t('vat.bulk.total')}:
${t('vat.bulk.totalWithoutVat')}: ${formatNumber(bulkResults.totalWithoutVat)}
${t('vat.bulk.totalVat')}: ${formatNumber(bulkResults.totalVat)}
${t('vat.bulk.totalWithVat')}: ${formatNumber(bulkResults.totalWithVat)}
${t('vat.bulk.averageRate')}: ${bulkResults.averageVatRate.toFixed(2)}%`;
    } else if (results.formula) {
      content += `${calculationType === 'add' ? t('vat.types.add.name') : t('vat.types.extract.name')}

${t('vat.export.originalAmount')}: ${formatNumber(parseFloat(amount) || 0)}
${t('vat.export.vatRate')}: ${vatRate}%

${t('vat.export.result')}:
${t('vat.result.amountWithoutVat')}: ${formatNumber(results.amountWithoutVat)}
${t('vat.result.vat')}: ${formatNumber(results.vatAmount)}
${t('vat.result.amountWithVat')}: ${formatNumber(results.amountWithVat)}

${t('vat.export.formula')}: ${results.formula}`;
    }

    return content;
  };

  const vatRates = [
    { value: '0', label: t('vat.rates.zero.label'), description: t('vat.rates.zero.description') },
    { value: '16', label: t('vat.rates.standard.label'), description: t('vat.rates.standard.description') }
  ];

  const calculateVAT = () => {
    const baseAmount = parseFloat(amount) || 0;
    const rate = parseFloat(vatRate) || 0;

    if (baseAmount <= 0) {
      setResults({
        amountWithoutVat: 0, vatAmount: 0, amountWithVat: 0,
        effectiveRate: 0, description: '', formula: ''
      });
      return;
    }

    let amountWithoutVat = 0;
    let vatAmount = 0;
    let amountWithVat = 0;
    let description = '';
    let formula = '';

    if (calculationType === 'add') {
      amountWithoutVat = baseAmount;
      vatAmount = baseAmount * (rate / 100);
      amountWithVat = baseAmount + vatAmount;
      description = `${t('vat.result.addDescription', { amount: formatNumber(baseAmount), rate })}`;
      formula = `${baseAmount} + (${baseAmount} × ${rate}%) = ${formatNumber(amountWithVat)}`;
    } else {
      amountWithVat = baseAmount;
      amountWithoutVat = baseAmount / (1 + rate / 100);
      vatAmount = amountWithVat - amountWithoutVat;
      description = `${t('vat.result.extractDescription', { amount: formatNumber(baseAmount), rate })}`;
      formula = `${baseAmount} ÷ (1 + ${rate}%) = ${formatNumber(amountWithoutVat)} + ${formatNumber(vatAmount)}`;
    }

    const effectiveRate = amountWithoutVat > 0 ? (vatAmount / amountWithoutVat) * 100 : 0;

    setResults({
      amountWithoutVat: Number(amountWithoutVat.toFixed(precision)),
      vatAmount: Number(vatAmount.toFixed(precision)),
      amountWithVat: Number(amountWithVat.toFixed(precision)),
      effectiveRate: Number(effectiveRate.toFixed(precision)),
      description,
      formula
    });
  };

  const calculateBulkVAT = () => {
    if (items.length === 0) {
      setBulkResults({
        totalWithoutVat: 0, totalVat: 0, totalWithVat: 0,
        itemCount: 0, averageVatRate: 0
      });
      return;
    }

    const totalWithoutVat = items.reduce((sum, item) => sum + item.amount, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalWithVat = items.reduce((sum, item) => sum + item.totalWithVat, 0);
    const averageVatRate = totalWithoutVat > 0 ? (totalVat / totalWithoutVat) * 100 : 0;

    setBulkResults({
      totalWithoutVat: Number(totalWithoutVat.toFixed(precision)),
      totalVat: Number(totalVat.toFixed(precision)),
      totalWithVat: Number(totalWithVat.toFixed(precision)),
      itemCount: items.length,
      averageVatRate: Number(averageVatRate.toFixed(2))
    });
  };

  const addToHistory = () => {
    if (results.description && (calculationType === 'add' || calculationType === 'extract')) {
      const newEntry: CalculationHistory = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        type: calculationType === 'add' ? t('vat.types.add.name') : t('vat.types.extract.name'),
        amount: parseFloat(amount) || 0,
        vatRate: parseFloat(vatRate) || 0,
        result: calculationType === 'add' ? results.amountWithVat : results.amountWithoutVat,
        timestamp: new Date()
      };

      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    }
  };

  const addItem = () => {
    if (newItemDescription && newItemAmount) {
      const itemAmount = parseFloat(newItemAmount);
      const itemVatRate = parseFloat(newItemVatRate);
      const vatAmount = itemAmount * (itemVatRate / 100);
      const totalWithVat = itemAmount + vatAmount;

      const newItem: VATItem = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        description: newItemDescription,
        amount: itemAmount,
        vatRate: itemVatRate,
        vatAmount: Number(vatAmount.toFixed(precision)),
        totalWithVat: Number(totalWithVat.toFixed(precision))
      };

      setItems(prev => [...prev, newItem]);
      setNewItemDescription('');
      setNewItemAmount('');
      setNewItemVatRate('16');
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    setAmount('');
    setVatRate('16');
    setItems([]);
    setNewItemDescription('');
    setNewItemAmount('');
    setNewItemVatRate('16');
    setResults({
      amountWithoutVat: 0, vatAmount: 0, amountWithVat: 0,
      effectiveRate: 0, description: '', formula: ''
    });
    setBulkResults({
      totalWithoutVat: 0, totalVat: 0, totalWithVat: 0,
      itemCount: 0, averageVatRate: 0
    });
  };

  const copyResult = () => {
    let content = '';
    if (calculationType === 'bulk') {
      content = `${t('vat.bulk.totalWithoutVat')}: ${formatNumber(bulkResults.totalWithoutVat)}\n${t('vat.bulk.totalVat')}: ${formatNumber(bulkResults.totalVat)}\n${t('vat.bulk.totalWithVat')}: ${formatNumber(bulkResults.totalWithVat)}`;
    } else if (results.description) {
      content = results.description;
    }

    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const downloadResult = () => {
    let content = '';

    if (calculationType === 'bulk') {
      content = `${t('vat.download.bulkTitle')}\n\n`;
      items.forEach((item, index) => {
        content += `${index + 1}. ${item.description}\n`;
        content += `   ${t('vat.result.amountWithoutVat')}: ${formatNumber(item.amount)}\n`;
        content += `   ${t('vat.result.vat')} (${item.vatRate}%): ${formatNumber(item.vatAmount)}\n`;
        content += `   ${t('vat.result.amountWithVat')}: ${formatNumber(item.totalWithVat)}\n\n`;
      });
      content += `${t('vat.bulk.total')}:\n`;
      content += `${t('vat.bulk.totalWithoutVat')}: ${formatNumber(bulkResults.totalWithoutVat)}\n`;
      content += `${t('vat.bulk.totalVat')}: ${formatNumber(bulkResults.totalVat)}\n`;
      content += `${t('vat.bulk.totalWithVat')}: ${formatNumber(bulkResults.totalWithVat)}\n`;
    } else if (results.description) {
      content = `${t('vat.download.title')}\n\n${results.description}\n\n${t('vat.export.formula')}: ${results.formula}\n`;
    }

    if (content) {
      content += `\n${t('vat.download.calculatedAt')}: ${new Date().toLocaleString('ru-RU')}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t('vat.download.filename');
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (calculationType !== 'bulk') {
      calculateVAT();
    }
  }, [amount, vatRate, calculationType, precision]);

  useEffect(() => {
    if (calculationType === 'bulk') {
      calculateBulkVAT();
    }
  }, [items, precision]);

  useEffect(() => {
    if (results.description && (calculationType === 'add' || calculationType === 'extract')) {
      addToHistory();
    }
  }, [results.description]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }) + ' ₸';
  };

  const calculationTypes = [
    {
      id: 'add',
      name: t('vat.types.add.name'),
      description: t('vat.types.add.description'),
      example: t('vat.types.add.example'),
      icon: Plus
    },
    {
      id: 'extract',
      name: t('vat.types.extract.name'),
      description: t('vat.types.extract.description'),
      example: t('vat.types.extract.example'),
      icon: Minus
    },
    {
      id: 'bulk',
      name: t('vat.types.bulk.name'),
      description: t('vat.types.bulk.description'),
      example: t('vat.types.bulk.example'),
      icon: FileText
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('vat.title')}</h1>
            <p className="text-gray-600">{t('vat.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('vat.info.title')}
            </h3>
            <div className="text-blue-800 space-y-1 text-sm">
              <p>• <strong>{t('vat.info.standardRate.label')}:</strong> {t('vat.info.standardRate.description')}</p>
              <p>• <strong>{t('vat.info.zeroRate.label')}:</strong> {t('vat.info.zeroRate.description')}</p>
              <p>• <strong>{t('vat.info.exemption.label')}:</strong> {t('vat.info.exemption.description')}</p>
              <p>• <strong>{t('vat.info.payers.label')}:</strong> {t('vat.info.payers.description')}</p>
            </div>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="vat" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.calculationType')}</h2>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {calculationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setCalculationType(type.id as any)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      calculationType === type.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent className="w-5 h-5" />
                      <h3 className="font-semibold">{type.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    <div className="text-xs text-gray-500">{type.example}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {(calculationType === 'add' || calculationType === 'extract') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {calculationType === 'add' ? t('vat.types.add.name') : t('vat.types.extract.name')}
              </h2>

              <div className="space-y-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {calculationType === 'add' ? t('vat.input.amountWithoutVat') : t('vat.input.amountWithVat')}
                  </label>
                  <RangeSlider
                    value={parseFloat(amount) || 0}
                    onChange={(val) => setAmount(String(val))}
                    min={1000}
                    max={10000000}
                    step={10000}
                    formatValue={(v) => `${v.toLocaleString()} ₸`}
                    color="#22c55e"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label=""
                    value={amount}
                    onChange={setAmount}
                    type="number"
                    placeholder={t('vat.input.placeholder')}
                    step={`0.${'0'.repeat(precision - 1)}1`}
                    suffix="₸"
                    validation={validateAmount}
                    hint={calculationType === 'add' ? t('vat.input.hintBeforeVat') : t('vat.input.hintIncludingVat')}
                  />

                  <div>
                    <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vat.input.vatRate')}
                    </label>
                    <select
                      id="vatRate"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    >
                      {vatRates.map((rate) => (
                        <option key={rate.value} value={rate.value}>
                          {rate.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      {vatRates.find(r => r.value === vatRate)?.description}
                    </p>
                  </div>
                </div>

                {results.formula && (
                  <SharePrintButtons
                    title={t('vat.export.shareTitle')}
                    description={`${calculationType === 'add' ? t('vat.types.add.name') : t('vat.types.extract.name')} ${t('vat.export.atRate', { rate: vatRate })}`}
                    results={generateExportData() || ''}
                    disabled={!generateExportData()}
                  />
                )}

                <div>
                  <label htmlFor="precision" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('vat.input.precision')}
                  </label>
                  <select
                    id="precision"
                    value={precision}
                    onChange={(e) => setPrecision(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  >
                    <option value={0}>{t('vat.input.precision0')}</option>
                    <option value={2}>{t('vat.input.precision2')}</option>
                    <option value={4}>{t('vat.input.precision4')}</option>
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={clearAll}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('vat.actions.clear')}</span>
                  </button>

                </div>
              </div>
            </div>
          )}

          {calculationType === 'bulk' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.bulk.title')}</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('vat.bulk.addItem')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder={t('vat.bulk.itemDescription')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <input
                          type="number"
                          value={newItemAmount}
                          onChange={(e) => setNewItemAmount(e.target.value)}
                          placeholder={t('vat.bulk.amountWithoutVat')}
                          step={`0.${'0'.repeat(precision - 1)}1`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-xs">₸</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex">
                      <select
                        value={newItemVatRate}
                        onChange={(e) => setNewItemVatRate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm"
                      >
                        {vatRates.map((rate) => (
                          <option key={rate.value} value={rate.value}>
                            {rate.value}%
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={addItem}
                        disabled={!newItemDescription || !newItemAmount}
                        className={`px-4 py-2 rounded-r-lg transition-colors ${
                          newItemDescription && newItemAmount
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">{t('vat.bulk.itemList')}</h3>
                      <button
                        onClick={() => setItems([])}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      >
                        {t('vat.bulk.clearAll')}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {items.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{index + 1}. {item.description}</div>
                            <div className="text-sm text-gray-600">
                              {formatNumber(item.amount)} + {t('vat.result.vat')} {item.vatRate}% ({formatNumber(item.vatAmount)}) = {formatNumber(item.totalWithVat)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={clearAll}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('vat.actions.clearAll')}</span>
                  </button>

                  <SharePrintButtons
                    title={t('vat.export.bulkShareTitle')}
                    description={t('vat.export.bulkDescription', { count: items.length })}
                    results={generateExportData() || ''}
                    disabled={items.length === 0}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {(calculationType === 'add' || calculationType === 'extract') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.result.title')}</h2>

              {results.description ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{t('vat.result.amountWithoutVat')}</span>
                        <span className="text-lg font-bold text-gray-900">{formatNumber(results.amountWithoutVat)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{t('vat.result.vat')} ({vatRate}%)</span>
                        <span className="text-lg font-bold text-green-600">{formatNumber(results.vatAmount)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-t border-green-200">
                        <span className="text-lg font-semibold text-gray-900">{t('vat.result.amountWithVat')}</span>
                        <span className="text-2xl font-bold text-green-700">{formatNumber(results.amountWithVat)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('vat.result.formula')}</h4>
                    <div className="font-mono text-sm text-gray-900 bg-white p-3 rounded border">
                      {results.formula}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-700 mb-3">{t('vat.result.structure')}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{ width: `${(results.amountWithoutVat / results.amountWithVat) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-20">{t('vat.result.withoutVat')}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-3 mr-3">
                          <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{ width: `${(results.vatAmount / results.amountWithVat) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-20">{t('vat.result.vat')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('vat.result.enterAmount')}
                </div>
              )}
            </div>
          )}

          {calculationType === 'bulk' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.bulk.totalSums')}</h2>

              {items.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{t('vat.bulk.totalWithoutVat')}</span>
                        <span className="text-lg font-bold text-gray-900">{formatNumber(bulkResults.totalWithoutVat)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{t('vat.bulk.totalVat')}</span>
                        <span className="text-lg font-bold text-green-600">{formatNumber(bulkResults.totalVat)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-t border-green-200">
                        <span className="text-lg font-semibold text-gray-900">{t('vat.bulk.totalWithVat')}</span>
                        <span className="text-2xl font-bold text-green-700">{formatNumber(bulkResults.totalWithVat)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">{t('vat.bulk.statistics')}</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>{t('vat.bulk.itemCount')}: <strong>{bulkResults.itemCount}</strong></div>
                      <div>{t('vat.bulk.averageRate')}: <strong>{bulkResults.averageVatRate.toFixed(2)}%</strong></div>
                      <div>{t('vat.bulk.vatShare')}: <strong>
                        {((bulkResults.totalVat / bulkResults.totalWithVat) * 100).toFixed(1)}%
                      </strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('vat.bulk.addItemsPrompt')}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('vat.history.title')}</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('vat.history.clear')}
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">{item.type}</span>
                      <span className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatNumber(item.amount)} × {item.vatRate}% = {formatNumber(item.result)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">{t('vat.history.empty')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.reference.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('vat.reference.kazakhstan')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 px-3 bg-green-100 rounded border border-green-300">
                <span className="text-green-800">{t('vat.reference.standardRate')}</span>
                <span className="font-bold text-green-700">16%</span>
              </div>
              <div className="flex justify-between text-sm py-2 px-3 bg-blue-100 rounded">
                <span className="text-blue-800">{t('vat.reference.zeroRate')}</span>
                <span className="font-bold text-blue-700">0%</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              <p><strong>{t('vat.reference.zeroAppliesTo')}:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>{t('vat.reference.export')}</li>
                <li>{t('vat.reference.medical')}</li>
                <li>{t('vat.reference.education')}</li>
                <li>{t('vat.reference.social')}</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('vat.reference.comparison')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                <span className="text-gray-700">{t('vat.reference.russia')}</span>
                <span className="font-medium">20%</span>
              </div>
              <div className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                <span className="text-gray-700">{t('vat.reference.eu')}</span>
                <span className="font-medium">15-27%</span>
              </div>
              <div className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded">
                <span className="text-gray-700">{t('vat.reference.usa')}</span>
                <span className="font-medium">0-13%</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              <p><strong>{t('vat.reference.lowestRate')}</strong></p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.examples.title')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('vat.examples.retail.title')}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {t('vat.examples.retail.description')}
            </p>
            <p className="text-green-700 font-semibold">
              {t('vat.examples.retail.result')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('vat.examples.business.title')}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {t('vat.examples.business.description')}
            </p>
            <p className="text-blue-700 font-semibold">
              {t('vat.examples.business.result')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('vat.examples.mixed.title')}</h3>
            <p className="text-gray-600 text-sm mb-2">
              {t('vat.examples.mixed.description')}
            </p>
            <p className="text-teal-700 font-semibold">
              {t('vat.examples.mixed.result')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('vat.tips.title')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('vat.tips.business.title')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('vat.tips.business.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('vat.tips.business.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('vat.tips.business.tip3')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('vat.tips.accuracy.title')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('vat.tips.accuracy.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('vat.tips.accuracy.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('vat.tips.accuracy.tip3')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="vat" />
      <MethodologySection steps={getMethodology('vat')} />
      <FAQSection
        items={[
          { question: t('vat.faq.q1'), answer: t('vat.faq.a1') },
          { question: t('vat.faq.q2'), answer: t('vat.faq.a2') },
          { question: t('vat.faq.q3'), answer: t('vat.faq.a3') },
          { question: t('vat.faq.q4'), answer: t('vat.faq.a4') },
          { question: t('vat.faq.q5'), answer: t('vat.faq.a5') }
        ]}
        sources={[
          { title: 'Налоговый кодекс РК, Раздел 10', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
          { title: 'Комитет государственных доходов', url: 'https://kgd.gov.kz/' },
        ]}
      />

      {/* Диаграмма структуры НДС */}
      {results && results.vatAmount > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Сумма без НДС', value: results.amountWithoutVat },
              { name: 'НДС', value: results.vatAmount },
            ]}
            title="Структура суммы с НДС"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.vatAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт НДС',
              subtitle: `Ставка ${vatRate}%`,
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Сумма без НДС', value: `${results.amountWithoutVat.toLocaleString()} ₸` },
                    { label: 'НДС', value: `${results.vatAmount.toLocaleString()} ₸` },
                    { label: 'Сумма с НДС', value: `${results.amountWithVat.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="vat-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="vat"
        calculatorTitle="Калькулятор НДС"
      />
      <LastUpdated calculatorId="vat" />
    </div>
  );
}
