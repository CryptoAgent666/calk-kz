import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, ArrowLeftRight, RefreshCw, TrendingUp, Info, AlertTriangle, Target, Clock, BarChart3 } from 'lucide-react';
import { useCurrencyRates } from '../../hooks/useCurrencyRates';
import SharePrintButtons from '../SharePrintButtons';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

interface ConversionHistory {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: Date;
}

export default function CurrencyConverter() {
  const { t } = useTranslation('calculators');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('KZT');
  const [amount, setAmount] = useState<string>('1000');
  const [history, setHistory] = useState<ConversionHistory[]>([]);

  const { rates, lastUpdated, loading, error, getRate, refreshRates } = useCurrencyRates();

  const [results, setResults] = useState({
    convertedAmount: 0,
    exchangeRate: 0,
    reverseRate: 0,
    isValidConversion: false
  });

  const currencies = [
    { code: 'KZT', name: t('currency-converter.currencies.KZT'), symbol: '₸', flag: '🇰🇿' },
    { code: 'USD', name: t('currency-converter.currencies.USD'), symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: t('currency-converter.currencies.EUR'), symbol: '€', flag: '🇪🇺' },
    { code: 'RUB', name: t('currency-converter.currencies.RUB'), symbol: '₽', flag: '🇷🇺' },
    { code: 'CNY', name: t('currency-converter.currencies.CNY'), symbol: '¥', flag: '🇨🇳' },
    { code: 'GBP', name: t('currency-converter.currencies.GBP'), symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: t('currency-converter.currencies.JPY'), symbol: '¥', flag: '🇯🇵' },
    { code: 'CHF', name: t('currency-converter.currencies.CHF'), symbol: 'Fr', flag: '🇨🇭' }
  ];

  const calculateConversion = () => {
    const inputAmount = parseFloat(amount) || 0;

    if (inputAmount <= 0) {
      setResults({
        convertedAmount: 0,
        exchangeRate: 0,
        reverseRate: 0,
        isValidConversion: false
      });
      return;
    }

    const exchangeRate = getRate(fromCurrency, toCurrency);
    const convertedAmount = inputAmount * exchangeRate;
    const reverseRate = getRate(toCurrency, fromCurrency);

    setResults({
      convertedAmount,
      exchangeRate,
      reverseRate,
      isValidConversion: true
    });

    if (exchangeRate > 0) {
      addToHistory(inputAmount, convertedAmount, exchangeRate);
    }
  };

  const addToHistory = (inputAmount: number, convertedAmount: number, rate: number) => {
    const newEntry: ConversionHistory = {
      id: Date.now().toString(),
      fromCurrency,
      toCurrency,
      amount: inputAmount,
      result: convertedAmount,
      rate,
      timestamp: new Date()
    };

    setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const setQuickAmount = (value: string) => {
    setAmount(value);
  };

  const clearAll = () => {
    setAmount('');
    setResults({
      convertedAmount: 0,
      exchangeRate: 0,
      reverseRate: 0,
      isValidConversion: false
    });
  };

  useEffect(() => {
    calculateConversion();
  }, [amount, fromCurrency, toCurrency, rates]);

  const formatNumber = (num: number, currency: string) => {
    const currencyInfo = currencies.find(c => c.code === currency);
    const decimals = currency === 'JPY' ? 0 : 2;

    return num.toLocaleString('ru-KZ', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + (currencyInfo ? ` ${currencyInfo.symbol}` : '');
  };

  const generateExportData = () => {
    if (!results.isValidConversion) return '';

    return `${t('currency-converter.exportConversion')}

${t('currency-converter.exportOriginalAmount')} ${formatNumber(parseFloat(amount) || 0, fromCurrency)}
${t('currency-converter.exportConvertedAmount')} ${formatNumber(results.convertedAmount, toCurrency)}

${t('currency-converter.exportRate')} 1 ${fromCurrency} = ${results.exchangeRate.toFixed(4)} ${toCurrency}
${t('currency-converter.exportReverseRate')} 1 ${toCurrency} = ${results.reverseRate.toFixed(4)} ${fromCurrency}

${t('currency-converter.exportCalculationTime')} ${new Date().toLocaleString('ru-RU')}
${t('currency-converter.exportSource')}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-[520px] bg-white rounded-xl border border-gray-100 shadow-sm" />
            <div className="h-[520px] bg-white rounded-xl border border-gray-100 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('currency-converter.heading')}</h1>
            <p className="text-gray-600">{t('currency-converter.subtitle')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">{t('currency-converter.warning')}</h3>
              <p className="text-amber-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('currency-converter.conversionTitle')}</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('currency-converter.amountLabel')}
              </label>
              <RangeSlider
                value={parseFloat(amount) || 0}
                onChange={(val) => setAmount(String(val))}
                min={100}
                max={10000000}
                step={1000}
                formatValue={(v) => v.toLocaleString()}
                color="#3b82f6"
              />
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('currency-converter.amountPlaceholder')}
                step="0.01"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-lg"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('currency-converter.fromCurrency')}
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={swapCurrencies}
                  className="p-3 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                  title={t('currency-converter.swapCurrencies')}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('currency-converter.toCurrency')}
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('currency-converter.quickAmountLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['100', '500', '1000', '5000', '10000', '50000', '100000', '1000000'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setQuickAmount(value)}
                    className="p-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {parseInt(value).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={refreshRates}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{t('currency-converter.updateRates')}</span>
              </button>

              <button
                onClick={clearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span>{t('currency-converter.clear')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('currency-converter.resultTitle')}</h2>

          {results.isValidConversion ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">{t('currency-converter.result')}</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">
                      {formatNumber(results.convertedAmount, toCurrency)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(parseFloat(amount) || 0, fromCurrency)} = {formatNumber(results.convertedAmount, toCurrency)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('currency-converter.exchangeRate')}</span>
                  <span className="font-semibold text-gray-900">
                    1 {fromCurrency} = {results.exchangeRate.toFixed(4)} {toCurrency}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t('currency-converter.reverseRate')}</span>
                  <span className="font-semibold text-gray-900">
                    1 {toCurrency} = {results.reverseRate.toFixed(4)} {fromCurrency}
                  </span>
                </div>
              </div>

              {lastUpdated && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{t('currency-converter.lastUpdated')}</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    {new Date(lastUpdated).toLocaleString('ru-RU')}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-700">
                        <span className="font-medium">{t('currency-converter.ratesSource')}:</span> {t('currency-converter.nbrkDisclaimer')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <SharePrintButtons
                title={t('currency-converter.exportTitle')}
                description={`${t('currency-converter.conversionTitle')} ${fromCurrency} ${toCurrency}`}
                results={generateExportData()}
                disabled={!generateExportData()}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('currency-converter.enterAmount')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{t('currency-converter.historyTitle')}</h2>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t('currency-converter.clearHistory')}
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {formatNumber(item.amount, item.fromCurrency)} → {formatNumber(item.result, item.toCurrency)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {t('currency-converter.rate')} 1 {item.fromCurrency} = {item.rate.toFixed(4)} {item.toCurrency}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm">{t('currency-converter.historyEmpty')}</div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('currency-converter.currentRatesTitle')}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">{t('currency-converter.tableHeaders.currency')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('currency-converter.tableHeaders.rateToTenge')}</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">{t('currency-converter.tableHeaders.change')}</th>
              </tr>
            </thead>
            <tbody>
              {currencies.filter(c => c.code !== 'KZT').map((currency) => {
                const rate = getRate(currency.code, 'KZT');
                return (
                  <tr key={currency.code} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span>{currency.flag}</span>
                        <div>
                          <div className="font-medium text-gray-900">{currency.code}</div>
                          <div className="text-xs text-gray-500">{currency.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">
                      {rate > 0 ? rate.toFixed(2) + ' ₸' : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-gray-500">
                      —
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('currency-converter.ratesSourceTitle')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('currency-converter.ratesSourceText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('currency-converter.popularConversionsTitle')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇺🇸→🇰🇿</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('currency-converter.popularPairs.usdKzt')}</h3>
            <p className="text-gray-600 text-sm">
              {t('currency-converter.popularPairs.usdKztDesc')}
            </p>
            <div className="text-lg font-bold text-blue-600 mt-2">
              1 USD = {getRate('USD', 'KZT').toFixed(2)} ₸
            </div>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇪🇺→🇰🇿</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('currency-converter.popularPairs.eurKzt')}</h3>
            <p className="text-gray-600 text-sm">
              {t('currency-converter.popularPairs.eurKztDesc')}
            </p>
            <div className="text-lg font-bold text-teal-600 mt-2">
              1 EUR = {getRate('EUR', 'KZT').toFixed(2)} ₸
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🇷🇺→🇰🇿</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('currency-converter.popularPairs.rubKzt')}</h3>
            <p className="text-gray-600 text-sm">
              {t('currency-converter.popularPairs.rubKztDesc')}
            </p>
            <div className="text-lg font-bold text-red-600 mt-2">
              1 RUB = {getRate('RUB', 'KZT').toFixed(2)} ₸
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('currency-converter.tipsTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('currency-converter.usefulTips')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.tips.compare')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.tips.fees')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.tips.changes')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.tips.largeSums')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('currency-converter.importantPoints')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.warnings.marketRates')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.warnings.weekends')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.warnings.spread')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('currency-converter.warnings.consultation')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('currency-converter.faq.q1'), answer: t('currency-converter.faq.a1') },
          { question: t('currency-converter.faq.q2'), answer: t('currency-converter.faq.a2') },
          { question: t('currency-converter.faq.q3'), answer: t('currency-converter.faq.a3') },
          { question: t('currency-converter.faq.q4'), answer: t('currency-converter.faq.a4') },
          { question: t('currency-converter.faq.q5'), answer: t('currency-converter.faq.a5') }
        ]}
        sources={[
          { title: 'Национальный Банк РК — Курсы валют', url: 'https://nationalbank.kz/ru/exchangerates' },
          { title: 'KASE — Казахстанская фондовая биржа', url: 'https://kase.kz/' },
        ]}
      />

      {/* Экспорт результатов */}
      {results.convertedAmount > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Конвертация валюты',
              subtitle: `${fromCurrency} → ${toCurrency}`,
              sections: [
                {
                  title: 'Результат',
                  data: [
                    { label: 'Исходная сумма', value: `${amount} ${fromCurrency}` },
                    { label: 'Результат', value: `${results.convertedAmount.toLocaleString()} ${toCurrency}` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="currency-conversion"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="currency-converter"
        calculatorTitle="Конвертер валют"
      />
    </div>
  );
}
