import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bitcoin, Calculator, TrendingUp, Info, AlertTriangle, FileText, Shield } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

type OperationType = 'trade' | 'mining' | 'staking' | 'swap';
type PayerType = 'individual' | 'ip' | 'too';

export default function CryptoTaxCalculator() {
  const { t } = useTranslation('calculators');

  const [operation, setOperation] = useState<OperationType>('trade');
  const [payer, setPayer] = useState<PayerType>('individual');
  const [buyPrice, setBuyPrice] = useState<string>('1000000');
  const [sellPrice, setSellPrice] = useState<string>('1500000');
  const [transactions, setTransactions] = useState<string>('1');
  const [aifcLicensed, setAifcLicensed] = useState<boolean>(true);

  const [results, setResults] = useState({
    gainPerTx: 0,
    totalGain: 0,
    taxRate: 0,
    taxAmount: 0,
    netProfit: 0,
    effectiveRate: 0,
  });

  useEffect(() => {
    const buy = parseFloat(buyPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    const txCount = Math.max(1, parseInt(transactions) || 1);

    // Для майнинга и стейкинга "прибыль" = sellPrice (вся полученная сумма)
    // Для покупки/продажи и обмена: sell - buy
    const gainPerTx = operation === 'mining' || operation === 'staking' ? sell : sell - buy;
    const totalGain = Math.max(0, gainPerTx * txCount);

    // Ставка: физлицо — 10% ИПН с прироста; ИП на упрощёнке — 4% с оборота (НК РК 2026); ТОО — 20% КПН с прироста
    const taxRate = payer === 'too' ? 20 : payer === 'ip' ? 4 : 10;
    const totalRevenue = Math.max(0, sell * txCount);
    const taxBase = payer === 'ip' ? totalRevenue : totalGain;
    const taxAmount = Math.round((taxBase * taxRate) / 100);
    const netProfit = totalGain - taxAmount;
    const effectiveRate = totalGain > 0 ? (taxAmount / totalGain) * 100 : 0;

    setResults({
      gainPerTx: Math.round(gainPerTx),
      totalGain: Math.round(totalGain),
      taxRate,
      taxAmount,
      netProfit: Math.round(netProfit),
      effectiveRate: Number(effectiveRate.toFixed(2)),
    });
  }, [operation, payer, buyPrice, sellPrice, transactions]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const reportForm = payer === 'too' ? 'ФНО 100.00' : 'ФНО 240.00';
  const reportDeadline = t('crypto-tax.deadlineValue');

  const generateExportData = () => {
    if (results.totalGain === 0) return null;
    return {
      title: t('crypto-tax.exportTitle'),
      subtitle: t('crypto-tax.subtitle'),
      sections: [
        {
          title: t('crypto-tax.parameters'),
          data: [
            { label: t('crypto-tax.operation'), value: t(`crypto-tax.op_${operation}`) },
            { label: t('crypto-tax.payer'), value: t(`crypto-tax.payer_${payer}`) },
            { label: t('crypto-tax.buyPrice'), value: formatCurrency(parseFloat(buyPrice) || 0) },
            { label: t('crypto-tax.sellPrice'), value: formatCurrency(parseFloat(sellPrice) || 0) },
            { label: t('crypto-tax.transactions'), value: transactions },
            { label: t('crypto-tax.aifc'), value: aifcLicensed ? t('crypto-tax.yes') : t('crypto-tax.no') },
          ],
        },
        {
          title: t('crypto-tax.resultsTitle'),
          data: [
            { label: t('crypto-tax.totalGain'), value: formatCurrency(results.totalGain) },
            { label: t('crypto-tax.taxAmount'), value: formatCurrency(results.taxAmount) },
            { label: t('crypto-tax.taxRate'), value: `${results.taxRate}%` },
            { label: t('crypto-tax.effectiveRate'), value: `${results.effectiveRate}%` },
            { label: t('crypto-tax.netProfit'), value: formatCurrency(results.netProfit) },
            { label: t('crypto-tax.reportForm'), value: reportForm },
            { label: t('crypto-tax.deadline'), value: reportDeadline },
          ],
        },
      ],
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('crypto-tax.heading')}</h1>
            <p className="text-gray-600">{t('crypto-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          {t('crypto-tax.warning')}
        </p>
      </div>

      <QuickAnswer calculatorId="crypto-tax" />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('crypto-tax.parameters')}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('crypto-tax.operation')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['trade', 'mining', 'staking', 'swap'] as OperationType[]).map((op) => (
                  <button
                    key={op}
                    onClick={() => setOperation(op)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      operation === op
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(`crypto-tax.op_${op}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('crypto-tax.payer')}
              </label>
              <div className="flex flex-wrap gap-2">
                {(['individual', 'ip', 'too'] as PayerType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPayer(p)}
                    className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      payer === p
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(`crypto-tax.payer_${p}`)}
                  </button>
                ))}
              </div>
            </div>

            {(operation === 'trade' || operation === 'swap') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('crypto-tax.buyPrice')}
                </label>
                <RangeSlider
                  value={parseFloat(buyPrice) || 0}
                  onChange={(val) => setBuyPrice(String(val))}
                  min={0}
                  max={50000000}
                  step={10000}
                  formatValue={(v) => formatCurrency(v)}
                  color="#f97316"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {operation === 'mining' || operation === 'staking'
                  ? t('crypto-tax.receivedAmount')
                  : t('crypto-tax.sellPrice')}
              </label>
              <RangeSlider
                value={parseFloat(sellPrice) || 0}
                onChange={(val) => setSellPrice(String(val))}
                min={0}
                max={50000000}
                step={10000}
                formatValue={(v) => formatCurrency(v)}
                color="#eab308"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('crypto-tax.transactions')}
              </label>
              <input
                type="number"
                value={transactions}
                onChange={(e) => setTransactions(e.target.value)}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{t('crypto-tax.transactionsHint')}</p>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer bg-orange-50 rounded-lg p-3 border border-orange-100">
              <input
                type="checkbox"
                checked={aifcLicensed}
                onChange={(e) => setAifcLicensed(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  <Shield className="w-4 h-4 inline mr-1" />
                  {t('crypto-tax.aifc')}
                </div>
                <div className="text-xs text-gray-600">{t('crypto-tax.aifcHint')}</div>
              </div>
            </label>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('crypto-tax.resultsTitle')}
          </h2>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('crypto-tax.taxAmount')}</span>
                <span className="text-2xl font-bold text-orange-700">{formatCurrency(results.taxAmount)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {t('crypto-tax.taxRate')}: {results.taxRate}% ({payer === 'too' ? t('crypto-tax.kpn') : t('crypto-tax.ipn')})
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('crypto-tax.totalGain')}</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(results.totalGain)}</span>
            </div>

            <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-green-700">{t('crypto-tax.netProfit')}</span>
              <span className="text-lg font-bold text-green-700">{formatCurrency(results.netProfit)}</span>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-blue-700">{t('crypto-tax.effectiveRate')}</span>
              <span className="text-lg font-bold text-blue-700">{results.effectiveRate}%</span>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <FileText className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-purple-900">
                    {t('crypto-tax.reportForm')}: <span className="font-bold">{reportForm}</span>
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    {t('crypto-tax.deadline')}: {reportDeadline}
                  </div>
                </div>
              </div>
            </div>

            {aifcLicensed && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                {t('crypto-tax.aifcNote')}
              </div>
            )}

            {!aifcLicensed && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                {t('crypto-tax.nonAifcWarning')}
              </div>
            )}
          </div>
        </div>
      </div>

      {results.taxAmount > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: t('crypto-tax.taxAmount'), value: results.taxAmount },
              { name: t('crypto-tax.netProfit'), value: Math.max(0, results.netProfit) },
            ].filter((i) => i.value > 0)}
            title={t('crypto-tax.chartTitle')}
          />
          <ExportButtons data={generateExportData()} filename="crypto-tax" />
        </div>
      )}

      <CalculatorExamples calculatorId="crypto-tax" />

      <MethodologySection steps={getMethodology('crypto-tax')} />
      <FAQSection
        items={[
          { question: t('crypto-tax.faq.q1'), answer: t('crypto-tax.faq.a1') },
          { question: t('crypto-tax.faq.q2'), answer: t('crypto-tax.faq.a2') },
          { question: t('crypto-tax.faq.q3'), answer: t('crypto-tax.faq.a3') },
          { question: t('crypto-tax.faq.q4'), answer: t('crypto-tax.faq.a4') },
          { question: t('crypto-tax.faq.q5'), answer: t('crypto-tax.faq.a5') },
        ]}
      
          sources={getSources('crypto-tax')}
        />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget calculatorId="crypto-tax" calculatorTitle={t('crypto-tax.title')} />
      <LastUpdated calculatorId="crypto-tax" />
    </div>
  );
}
