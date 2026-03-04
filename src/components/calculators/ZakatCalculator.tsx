import React, { useState, useEffect } from 'react';
import { Heart, Calculator, DollarSign, Coins, TrendingUp, Info, AlertTriangle, Star, Target, Building, Gift, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';

export default function ZakatCalculator() {
  const { t } = useTranslation('calculators');
  const [cashSavings, setCashSavings] = useState<string>('');
  const [goldValue, setGoldValue] = useState<string>('');
  const [silverValue, setSilverValue] = useState<string>('');
  const [businessGoods, setBusinessGoods] = useState<string>('');
  const [debts, setDebts] = useState<string>('');
  const [goldPricePerGram, setGoldPricePerGram] = useState<string>('32000');
  const [silverPricePerGram, setSilverPricePerGram] = useState<string>('400');
  const [calculateByWeight, setCalculateByWeight] = useState<boolean>(false);
  const [goldWeight, setGoldWeight] = useState<string>('');
  const [silverWeight, setSilverWeight] = useState<string>('');

  const [results, setResults] = useState({
    totalAssets: 0,
    totalDebts: 0,
    netWealth: 0,
    goldNisab: 0,
    silverNisab: 0,
    applicableNisab: 0,
    nisabType: '',
    isAboveNisab: false,
    zakatableAmount: 0,
    zakatAmount: 0,
    zakatRate: 2.5,
    breakdown: {
      cash: 0,
      gold: 0,
      silver: 0,
      business: 0,
      debts: 0
    }
  });

  const GOLD_NISAB_GRAMS = 85;
  const SILVER_NISAB_GRAMS = 595;
  const ZAKAT_RATE = 0.025;

  const calculateZakat = () => {
    const cash = parseFloat(cashSavings) || 0;
    const business = parseFloat(businessGoods) || 0;
    const debtsAmount = parseFloat(debts) || 0;
    const goldPrice = parseFloat(goldPricePerGram) || 32000;
    const silverPrice = parseFloat(silverPricePerGram) || 400;

    let gold = 0;
    let silver = 0;

    if (calculateByWeight) {
      const goldWeightGrams = parseFloat(goldWeight) || 0;
      const silverWeightGrams = parseFloat(silverWeight) || 0;
      gold = goldWeightGrams * goldPrice;
      silver = silverWeightGrams * silverPrice;
    } else {
      gold = parseFloat(goldValue) || 0;
      silver = parseFloat(silverValue) || 0;
    }

    const totalAssets = cash + gold + silver + business;
    const netWealth = Math.max(0, totalAssets - debtsAmount);
    const goldNisab = GOLD_NISAB_GRAMS * goldPrice;
    const silverNisab = SILVER_NISAB_GRAMS * silverPrice;
    const applicableNisab = Math.min(goldNisab, silverNisab);
    const nisabType = goldNisab <= silverNisab ? t('zakat.nisabTypeGold') : t('zakat.nisabTypeSilver');
    const isAboveNisab = netWealth >= applicableNisab;

    let zakatableAmount = 0;
    let zakatAmount = 0;

    if (isAboveNisab) {
      zakatableAmount = netWealth;
      zakatAmount = zakatableAmount * ZAKAT_RATE;
    }

    setResults({
      totalAssets: Math.round(totalAssets),
      totalDebts: Math.round(debtsAmount),
      netWealth: Math.round(netWealth),
      goldNisab: Math.round(goldNisab),
      silverNisab: Math.round(silverNisab),
      applicableNisab: Math.round(applicableNisab),
      nisabType,
      isAboveNisab,
      zakatableAmount: Math.round(zakatableAmount),
      zakatAmount: Math.round(zakatAmount),
      zakatRate: ZAKAT_RATE * 100,
      breakdown: {
        cash: Math.round(cash),
        gold: Math.round(gold),
        silver: Math.round(silver),
        business: Math.round(business),
        debts: Math.round(debtsAmount)
      }
    });
  };

  useEffect(() => {
    calculateZakat();
  }, [cashSavings, goldValue, silverValue, businessGoods, debts, goldPricePerGram, silverPricePerGram, calculateByWeight, goldWeight, silverWeight]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatGrams = (grams: number) => {
    return grams.toLocaleString('ru-KZ') + ' ' + t('zakat.grams');
  };

  const getZakatPurposes = () => [
    t('zakat.purpose1'),
    t('zakat.purpose2'),
    t('zakat.purpose3'),
    t('zakat.purpose4'),
    t('zakat.purpose5'),
    t('zakat.purpose6'),
    t('zakat.purpose7'),
    t('zakat.purpose8')
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('zakat.title')}</h1>
            <p className="text-gray-600">{t('zakat.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Islamic Context */}
      <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Star className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {t('zakat.contextTitle')}
            </h3>
            <div className="text-green-800 space-y-2">
              <p>
                {t('zakat.contextDescription')}
              </p>
              <p>
                {t('zakat.contextDetails')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          {/* Assets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.assets')}</h2>

            <div className="space-y-6">
              {/* Cash Savings */}
              <div>
                <label htmlFor="cashSavings" className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  {t('zakat.cashSavings')}
                </label>
                <RangeSlider
                  value={parseFloat(cashSavings) || 0}
                  onChange={(val) => setCashSavings(String(val))}
                  min={0}
                  max={50000000}
                  step={100000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#10b981"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="cashSavings"
                    value={cashSavings}
                    onChange={(e) => setCashSavings(e.target.value)}
                    placeholder={t('zakat.cashSavingsPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('zakat.cashSavingsHint')}
                </p>
              </div>

              {/* Gold and Silver Calculation Mode */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="calculateByWeight"
                    checked={calculateByWeight}
                    onChange={(e) => setCalculateByWeight(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="calculateByWeight" className="ml-2 block text-sm text-gray-700">
                    {t('zakat.calculateByWeight')}
                  </label>
                </div>

                {calculateByWeight ? (
                  <div className="space-y-4">
                    {/* Gold by Weight */}
                    <div>
                      <label htmlFor="goldWeight" className="block text-sm font-medium text-gray-700 mb-2">
                        <Coins className="w-4 h-4 inline mr-1" />
                        {t('zakat.goldWeight')}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            id="goldWeight"
                            value={goldWeight}
                            onChange={(e) => setGoldWeight(e.target.value)}
                            placeholder={t('zakat.goldWeightPlaceholder')}
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">{t('zakat.grams')}</span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={goldPricePerGram}
                            onChange={(e) => setGoldPricePerGram(e.target.value)}
                            placeholder={t('zakat.pricePerGram')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">₸/{t('zakat.grams')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Silver by Weight */}
                    <div>
                      <label htmlFor="silverWeight" className="block text-sm font-medium text-gray-700 mb-2">
                        <Coins className="w-4 h-4 inline mr-1" />
                        {t('zakat.silverWeight')}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            id="silverWeight"
                            value={silverWeight}
                            onChange={(e) => setSilverWeight(e.target.value)}
                            placeholder={t('zakat.silverWeightPlaceholder')}
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">{t('zakat.grams')}</span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={silverPricePerGram}
                            onChange={(e) => setSilverPricePerGram(e.target.value)}
                            placeholder={t('zakat.pricePerGram')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">₸/{t('zakat.grams')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Gold Value */}
                    <div>
                      <label htmlFor="goldValue" className="block text-sm font-medium text-gray-700 mb-2">
                        <Coins className="w-4 h-4 inline mr-1" />
                        {t('zakat.goldValue')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="goldValue"
                          value={goldValue}
                          onChange={(e) => setGoldValue(e.target.value)}
                          placeholder={t('zakat.goldValuePlaceholder')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">₸</span>
                        </div>
                      </div>
                    </div>

                    {/* Silver Value */}
                    <div>
                      <label htmlFor="silverValue" className="block text-sm font-medium text-gray-700 mb-2">
                        <Coins className="w-4 h-4 inline mr-1" />
                        {t('zakat.silverValue')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id="silverValue"
                          value={silverValue}
                          onChange={(e) => setSilverValue(e.target.value)}
                          placeholder={t('zakat.silverValuePlaceholder')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 text-sm">₸</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Business Goods */}
              <div>
                <label htmlFor="businessGoods" className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4 inline mr-1" />
                  {t('zakat.businessGoods')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="businessGoods"
                    value={businessGoods}
                    onChange={(e) => setBusinessGoods(e.target.value)}
                    placeholder={t('zakat.businessGoodsPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('zakat.businessGoodsHint')}
                </p>
              </div>

              {/* Debts */}
              <div>
                <label htmlFor="debts" className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1 rotate-180" />
                  {t('zakat.debts')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="debts"
                    value={debts}
                    onChange={(e) => setDebts(e.target.value)}
                    placeholder={t('zakat.debtsPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('zakat.debtsHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Current Prices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.currentPrices')}</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="goldPricePerGram" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('zakat.goldPricePerGram')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="goldPricePerGram"
                    value={goldPricePerGram}
                    onChange={(e) => setGoldPricePerGram(e.target.value)}
                    placeholder={t('zakat.currentGoldPrice')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="silverPricePerGram" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('zakat.silverPricePerGram')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="silverPricePerGram"
                    value={silverPricePerGram}
                    onChange={(e) => setSilverPricePerGram(e.target.value)}
                    placeholder={t('zakat.currentSilverPrice')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-amber-900 mb-2">{t('zakat.currentNisabs')}:</h3>
                <div className="text-sm text-amber-800 space-y-1">
                  <div>• {t('zakat.goldNisab')}: {formatGrams(GOLD_NISAB_GRAMS)} = {formatNumber(results.goldNisab)}</div>
                  <div>• {t('zakat.silverNisab')}: {formatGrams(SILVER_NISAB_GRAMS)} = {formatNumber(results.silverNisab)}</div>
                  <div>• {t('zakat.applicableNisab')}: <strong>{results.nisabType} ({formatNumber(results.applicableNisab)})</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.calculation')}</h2>

            <div className="space-y-6">
              {/* Assets Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.yourAssets')}:</h3>
                <div className="space-y-2 text-sm">
                  {results.breakdown.cash > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('zakat.cashFunds')}:</span>
                      <span className="font-medium">{formatNumber(results.breakdown.cash)}</span>
                    </div>
                  )}
                  {results.breakdown.gold > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('zakat.gold')}:</span>
                      <span className="font-medium">{formatNumber(results.breakdown.gold)}</span>
                    </div>
                  )}
                  {results.breakdown.silver > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('zakat.silver')}:</span>
                      <span className="font-medium">{formatNumber(results.breakdown.silver)}</span>
                    </div>
                  )}
                  {results.breakdown.business > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('zakat.tradeGoods')}:</span>
                      <span className="font-medium">{formatNumber(results.breakdown.business)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">{t('zakat.totalAssets')}:</span>
                    <span className="font-bold">{formatNumber(results.totalAssets)}</span>
                  </div>
                  {results.breakdown.debts > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('zakat.debtsLabel')}:</span>
                        <span className="font-medium text-red-600">-{formatNumber(results.breakdown.debts)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="font-semibold text-gray-900">{t('zakat.netAssets')}:</span>
                        <span className="font-bold text-green-600">{formatNumber(results.netWealth)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Nisab Check */}
              <div className={`rounded-lg p-6 border-2 ${
                results.isAboveNisab
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {t('zakat.nisabExceeded')}
                  </span>
                  <div className="flex items-center space-x-2">
                    {results.isAboveNisab ? (
                      <Target className="w-6 h-6 text-green-600" />
                    ) : (
                      <Target className="w-6 h-6 text-red-600" />
                    )}
                    <span className={`text-2xl font-bold ${
                      results.isAboveNisab ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {results.isAboveNisab ? t('zakat.yes') : t('zakat.no')}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>{t('zakat.applicableNisabLabel')} ({results.nisabType}): {formatNumber(results.applicableNisab)}</div>
                  <div>{t('zakat.yourNetAssets')}: {formatNumber(results.netWealth)}</div>
                  <div>
                    {results.isAboveNisab
                      ? `${t('zakat.excessBy')} ${formatNumber(results.netWealth - results.applicableNisab)}`
                      : `${t('zakat.shortfallToNisab')}: ${formatNumber(results.applicableNisab - results.netWealth)}`
                    }
                  </div>
                </div>
              </div>

              {/* Zakat Amount */}
              {results.isAboveNisab && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">{t('zakat.zakatAmount')}</span>
                    <div className="flex items-center space-x-2">
                      <Gift className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">{formatNumber(results.zakatAmount)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.zakatRate}% {t('zakat.from')} {formatNumber(results.zakatableAmount)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nisab Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.nisabConcept')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">{t('zakat.goldNisabTitle')}</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>{t('zakat.size')}:</strong> {t('zakat.goldNisabSize')}</p>
              <p><strong>{t('zakat.basis')}:</strong> {t('zakat.goldNisabBasis')}</p>
              <p><strong>{t('zakat.currentValue')}:</strong> {formatNumber(results.goldNisab)}</p>
              <p className="text-xs text-yellow-700">
                {t('zakat.goldNisabNote')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.silverNisabTitle')}</h3>
            <div className="text-sm text-gray-800 space-y-2">
              <p><strong>{t('zakat.size')}:</strong> {t('zakat.silverNisabSize')}</p>
              <p><strong>{t('zakat.basis')}:</strong> {t('zakat.silverNisabBasis')}</p>
              <p><strong>{t('zakat.currentValue')}:</strong> {formatNumber(results.silverNisab)}</p>
              <p className="text-xs text-gray-600">
                {t('zakat.silverNisabNote')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('zakat.whichNisabTitle')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('zakat.whichNisabDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Zakat Recipients */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.recipientsTitle')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {getZakatPurposes().map((purpose, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">{index + 1}</span>
              </div>
              <span className="text-sm text-green-800">{purpose}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('zakat.modernDistributionTitle')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('zakat.modernDistributionDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Examples */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.examplesTitle')}</h2>

        <div className="space-y-6">
          {/* Example 1 - Above Nisab */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('zakat.example1Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('zakat.assets')}:</div>
                <div>{t('zakat.cash')}: 3,000,000 ₸</div>
                <div>{t('zakat.gold')}: 1,000,000 ₸</div>
                <div>{t('zakat.business')}: 2,000,000 ₸</div>
                <div>{t('zakat.totalAssets')}: 6,000,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('zakat.obligations')}:</div>
                <div>{t('zakat.debtsLabel')}: 500,000 ₸</div>
                <div>{t('zakat.netAssets')}: 5,500,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('zakat.nisab')}:</div>
                <div>{t('zakat.silverNisabShort')}: {formatNumber(SILVER_NISAB_GRAMS * 400)} ₸</div>
                <div>{t('zakat.exceeded')}: {t('zakat.yes')}</div>
                <div>{t('zakat.taxableAmount')}: 5,500,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('zakat.zakat')}:</div>
                <div className="text-lg font-bold text-green-600">137,500 ₸</div>
                <div className="text-xs text-green-600">2.5% {t('zakat.from')} 5,500,000 ₸</div>
              </div>
            </div>
          </div>

          {/* Example 2 - Below Nisab */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-3">{t('zakat.example2Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('zakat.assets')}:</div>
                <div>{t('zakat.cash')}: 150,000 ₸</div>
                <div>{t('zakat.gold')}: 0 ₸</div>
                <div>{t('zakat.business')}: 50,000 ₸</div>
                <div>{t('zakat.totalAssets')}: 200,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('zakat.obligations')}:</div>
                <div>{t('zakat.debtsLabel')}: 0 ₸</div>
                <div>{t('zakat.netAssets')}: 200,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('zakat.nisab')}:</div>
                <div>{t('zakat.silverNisabShort')}: {formatNumber(SILVER_NISAB_GRAMS * 400)} ₸</div>
                <div>{t('zakat.notReached')}</div>
                <div>{t('zakat.shortfall')}: {formatNumber((SILVER_NISAB_GRAMS * 400) - 200000)} ₸</div>
              </div>
              <div>
                <div className="font-medium text-red-700">{t('zakat.zakat')}:</div>
                <div className="text-lg font-bold text-red-600">0 ₸</div>
                <div className="text-xs text-red-600">{t('zakat.belowNisab')}</div>
              </div>
            </div>
          </div>

          {/* Example 3 - With Debts */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('zakat.example3Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('zakat.assets')}:</div>
                <div>{t('zakat.cash')}: 1,000,000 ₸</div>
                <div>{t('zakat.gold')}: 500,000 ₸</div>
                <div>{t('zakat.totalAssets')}: 1,500,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('zakat.obligations')}:</div>
                <div>{t('zakat.mortgage')}: 800,000 ₸</div>
                <div>{t('zakat.loan')}: 200,000 ₸</div>
                <div>{t('zakat.totalDebts')}: 1,000,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('zakat.calculation')}:</div>
                <div>{t('zakat.netAssets')}: 500,000 ₸</div>
                <div>{t('zakat.nisab')}: {formatNumber(SILVER_NISAB_GRAMS * 400)} ₸</div>
                <div>{t('zakat.exceeded')}: {t('zakat.yes')}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('zakat.zakat')}:</div>
                <div className="text-lg font-bold text-blue-600">12,500 ₸</div>
                <div className="text-xs text-blue-600">2.5% {t('zakat.from')} 500,000 ₸</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Rules */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('zakat.importantRulesTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('zakat.conditionsTitle')}:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('zakat.condition1')}</li>
                  <li>{t('zakat.condition2')}</li>
                  <li>{t('zakat.condition3')}</li>
                  <li>{t('zakat.condition4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('zakat.notTaxableTitle')}:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('zakat.notTaxable1')}</li>
                  <li>{t('zakat.notTaxable2')}</li>
                  <li>{t('zakat.notTaxable3')}</li>
                  <li>{t('zakat.notTaxable4')}</li>
                  <li>{t('zakat.notTaxable5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Star className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('zakat.spiritualSignificanceTitle')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('zakat.spiritualSignificanceDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Guidelines */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.practicalGuidelinesTitle')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('zakat.regularityTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('zakat.regularityDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('zakat.recordKeepingTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('zakat.recordKeepingDescription')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('zakat.recipientSelectionTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('zakat.recipientSelectionDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Calculations for Different Assets */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.assetTypesTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.cashAssetsTitle')}:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.cashAsset1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.cashAsset2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.cashAsset3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.cashAsset4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.tradeGoodsTitle')}:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tradeAsset1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tradeAsset2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tradeAsset3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tradeAsset4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('zakat.controversialIssuesTitle')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• {t('zakat.controversy1')}</p>
                <p>• {t('zakat.controversy2')}</p>
                <p>• {t('zakat.controversy3')}</p>
                <p>• {t('zakat.controversy4')}</p>
                <p>• {t('zakat.controversy5')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Context */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.historicalContextTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">{t('zakat.historicalBasesTitle')}</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>
                {t('zakat.historicalBase1')}
              </p>
              <p>
                {t('zakat.historicalBase2')}
              </p>
              <p>
                {t('zakat.historicalBase3')}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('zakat.modernPracticeTitle')}</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                {t('zakat.modernPractice1')}
              </p>
              <p>
                {t('zakat.modernPractice2')}
              </p>
              <p>
                {t('zakat.modernPractice3')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Tips */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.tipsTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.whatToConsiderTitle')}:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.practicalTipsTitle')}:</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.practicalTip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.practicalTip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.practicalTip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('zakat.practicalTip4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Heart className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-teal-900 mb-1">
                {t('zakat.charitiesInKazakhstanTitle')}
              </h3>
              <p className="text-teal-800 text-sm">
                {t('zakat.charitiesInKazakhstanDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lunar vs Solar Year */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('zakat.lunarYearTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('zakat.lunarYearSubtitle')}</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>{t('zakat.tradition')}:</strong> {t('zakat.lunarTradition')}</p>
              <p><strong>{t('zakat.difference')}:</strong> {t('zakat.lunarDifference')}</p>
              <p><strong>{t('zakat.advantage')}:</strong> {t('zakat.lunarAdvantage')}</p>
              <p><strong>{t('zakat.practice')}:</strong> {t('zakat.lunarPractice')}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t('zakat.solarYearSubtitle')}</h3>
            <div className="text-sm text-gray-800 space-y-2">
              <p><strong>{t('zakat.modernity')}:</strong> {t('zakat.solarModernity')}</p>
              <p><strong>{t('zakat.convenience')}:</strong> {t('zakat.solarConvenience')}</p>
              <p><strong>{t('zakat.adjustment')}:</strong> {t('zakat.solarAdjustment')}</p>
              <p><strong>{t('zakat.flexibility')}:</strong> {t('zakat.solarFlexibility')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            {t('zakat.lunarRecommendation')}
          </p>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('zakat.faq.q1'), answer: t('zakat.faq.a1') },
          { question: t('zakat.faq.q2'), answer: t('zakat.faq.a2') },
          { question: t('zakat.faq.q3'), answer: t('zakat.faq.a3') },
          { question: t('zakat.faq.q4'), answer: t('zakat.faq.a4') },
          { question: t('zakat.faq.q5'), answer: t('zakat.faq.a5') }
        ]}
        sources={[
          { title: 'ДУМК — Духовное управление мусульман Казахстана', url: 'https://muftyat.kz/' },
          { title: 'IslamQ&A — Вопросы о закяте', url: 'https://islamqa.info/' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.totalZakat > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Закят (2.5%)', value: results.totalZakat },
              { name: 'Остаток', value: results.totalAssets - results.totalZakat },
            ]}
            title="Распределение активов"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.totalZakat > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт закята',
              subtitle: 'Обязательный закят',
              sections: [
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Общее имущество', value: `${results.totalAssets.toLocaleString()} ₸` },
                    { label: 'Нисаб (порог)', value: `${results.nisab.toLocaleString()} ₸` },
                    { label: 'Закят (2.5%)', value: `${results.totalZakat.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="zakat-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="zakat"
        calculatorTitle="Калькулятор закята"
      />
    </div>
  );
}
