import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Calculator, Percent, TrendingDown, Target, Info, AlertTriangle, Copy, Download, RotateCcw, Tag, BarChart3 } from 'lucide-react';
import InputField from '../InputField';
import SharePrintButtons from '../SharePrintButtons';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

interface DiscountCalculation {
  originalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  savings: number;
}

interface CascadeDiscount {
  id: string;
  description: string;
  discountPercent: number;
}

interface ComparisonScenario {
  id: string;
  name: string;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  savings: number;
}

export default function DiscountCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [calculationType, setCalculationType] = useState<'single' | 'cascade' | 'reverse' | 'compare'>('single');
  
  // Одиночная скидка
  const [originalPrice, setOriginalPrice] = useState<string>('50000');
  const [discountPercent, setDiscountPercent] = useState<string>('20');
  
  // Каскадные скидки
  const [cascadeOriginalPrice, setCascadeOriginalPrice] = useState<string>('');
  const [cascadeDiscounts, setCascadeDiscounts] = useState<CascadeDiscount[]>([
    { id: '1', description: t('discount.firstDiscountLabel'), discountPercent: 0 }
  ]);
  
  // Обратный расчет
  const [reverseOriginalPrice, setReverseOriginalPrice] = useState<string>('');
  const [reverseFinalPrice, setReverseFinalPrice] = useState<string>('');
  
  const [compareScenarios, setCompareScenarios] = useState<ComparisonScenario[]>([
    { id: '1', name: `${t('discount.optionN')} 1`, originalPrice: 0, discountPercent: 0, finalPrice: 0, savings: 0 },
    { id: '2', name: `${t('discount.optionN')} 2`, originalPrice: 0, discountPercent: 0, finalPrice: 0, savings: 0 }
  ]);
  
  const [results, setResults] = useState({
    // Основные результаты
    finalPrice: 0,
    discountAmount: 0,
    savings: 0,
    effectiveDiscountPercent: 0,
    
    // Каскадные скидки
    cascadeSteps: [] as Array<{
      step: number;
      description: string;
      priceBefore: number;
      discountPercent: number;
      discountAmount: number;
      priceAfter: number;
    }>,
    totalCascadeDiscount: 0,
    
    // Обратный расчет
    calculatedDiscountPercent: 0,
    
    // Сравнение
    bestScenario: null as ComparisonScenario | null,
    comparisonResults: [] as ComparisonScenario[]
  });

  const normalizeNumberInput = (value: string) => {
    if (!value) {
      return 0;
    }

    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizePriceInput = (value: string) => Math.max(0, normalizeNumberInput(value));

  const normalizePercentInput = (value: string) => {
    const parsed = normalizeNumberInput(value);
    return Math.min(Math.max(parsed, 0), 100);
  };

  const normalizePercentValue = (value: number) => {
    const numeric = Number.isFinite(value) ? value : 0;
    return Math.min(Math.max(numeric, 0), 100);
  };

  const validatePrice = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('discount.validationEnterCorrectPrice');
    if (num <= 0) return t('discount.validationPriceAboveZero');
    if (num > 100000000) return t('discount.validationPriceTooLarge');
    return null;
  };

  const validateDiscountPercent = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('discount.validationEnterCorrectPercent');
    if (num < 0) return t('discount.validationDiscountNegative');
    if (num > 100) return t('discount.validationDiscountOver100');
    return null;
  };

  // Генерация данных для экспорта
  const generateExportData = () => {
    let content = '';
    
    switch (calculationType) {
      case 'single':
        if (results.finalPrice > 0) {
          content = `Расчет одиночной скидки:
Первоначальная цена: ${formatNumber(parseFloat(originalPrice) || 0)}
Размер скидки: ${discountPercent}%
Сумма скидки: ${formatNumber(results.discountAmount)}
Итоговая цена: ${formatNumber(results.finalPrice)}
Экономия: ${formatNumber(results.savings)}`;
        }
        break;
        
      case 'cascade':
        if (results.cascadeSteps.length > 0) {
          content = `Расчет каскадных скидок:
Первоначальная цена: ${formatNumber(parseFloat(cascadeOriginalPrice) || 0)}

Этапы применения скидок:
${results.cascadeSteps.map((step, index) => 
  `${index + 1}. ${step.description}: ${step.discountPercent}%
   Цена до: ${formatNumber(step.priceBefore)}
   Скидка: ${formatNumber(step.discountAmount)}
   Цена после: ${formatNumber(step.priceAfter)}`
).join('\n\n')}

Итого:
Общая экономия: ${formatNumber(results.totalCascadeDiscount)}
Эффективная скидка: ${results.effectiveDiscountPercent.toFixed(1)}%
Итоговая цена: ${formatNumber(results.finalPrice)}`;
        }
        break;
        
      case 'reverse':
        if (results.calculatedDiscountPercent > 0) {
          content = `Обратный расчет скидки:
Первоначальная цена: ${formatNumber(parseFloat(reverseOriginalPrice) || 0)}
Итоговая цена: ${formatNumber(parseFloat(reverseFinalPrice) || 0)}
Рассчитанная скидка: ${results.calculatedDiscountPercent.toFixed(2)}%
Сумма экономии: ${formatNumber(results.discountAmount)}`;
        }
        break;
        
      case 'compare':
        if (results.comparisonResults.length > 0) {
          content = `Сравнение вариантов скидок:

${results.comparisonResults.map((scenario, index) => 
  `${scenario.name}:
   Цена: ${formatNumber(scenario.originalPrice)} → ${formatNumber(scenario.finalPrice)}
   Скидка: ${scenario.discountPercent}%
   Экономия: ${formatNumber(scenario.savings)}`
).join('\n\n')}

${results.bestScenario ? `Лучший вариант: ${results.bestScenario.name} (экономия ${formatNumber(results.bestScenario.savings)})` : ''}`;
        }
        break;
    }
    
    return content;
  };

  // Расчет одиночной скидки
  const calculateSingleDiscount = () => {
    const price = normalizePriceInput(originalPrice);
    const discount = normalizePercentInput(discountPercent);
    
    if (price <= 0) {
      setResults(prev => ({
        ...prev,
        finalPrice: 0,
        discountAmount: 0,
        savings: 0,
        effectiveDiscountPercent: 0
      }));
      return;
    }

    const discountAmount = price * (discount / 100);
    const finalPrice = price - discountAmount;
    const savings = discountAmount;
    const effectiveDiscountPercent = discount;

    setResults(prev => ({
      ...prev,
      finalPrice,
      discountAmount,
      savings,
      effectiveDiscountPercent
    }));
  };

  // Расчет каскадных скидок
  const calculateCascadeDiscounts = () => {
    const price = normalizePriceInput(cascadeOriginalPrice);
    
    if (price <= 0 || cascadeDiscounts.length === 0) {
      setResults(prev => ({
        ...prev,
        cascadeSteps: [],
        totalCascadeDiscount: 0,
        finalPrice: 0,
        effectiveDiscountPercent: 0
      }));
      return;
    }

    let currentPrice = price;
    const steps = [];
    let totalDiscountAmount = 0;

    cascadeDiscounts.forEach((discount, index) => {
      const discountPercentValue = normalizePercentValue(discount.discountPercent);
      if (discountPercentValue > 0) {
        const priceBefore = currentPrice;
        const discountAmount = currentPrice * (discountPercentValue / 100);
        const priceAfter = currentPrice - discountAmount;
        
        steps.push({
          step: index + 1,
          description: discount.description,
          priceBefore,
          discountPercent: discountPercentValue,
          discountAmount,
          priceAfter
        });
        
        currentPrice = priceAfter;
        totalDiscountAmount += discountAmount;
      }
    });

    const finalPrice = currentPrice;
    const effectiveDiscountPercent = price > 0 ? ((price - finalPrice) / price) * 100 : 0;

    setResults(prev => ({
      ...prev,
      cascadeSteps: steps,
      totalCascadeDiscount: totalDiscountAmount,
      finalPrice,
      effectiveDiscountPercent
    }));
  };

  // Обратный расчет
  const calculateReverseDiscount = () => {
    const originalPriceValue = normalizePriceInput(reverseOriginalPrice);
    const finalPriceValue = normalizePriceInput(reverseFinalPrice);
    
    if (originalPriceValue <= 0 || finalPriceValue < 0 || finalPriceValue > originalPriceValue) {
      setResults(prev => ({
        ...prev,
        calculatedDiscountPercent: 0,
        discountAmount: 0
      }));
      return;
    }

    const discountAmount = originalPriceValue - finalPriceValue;
    const calculatedDiscountPercent = (discountAmount / originalPriceValue) * 100;

    setResults(prev => ({
      ...prev,
      calculatedDiscountPercent,
      discountAmount
    }));
  };

  // Сравнение сценариев
  const calculateComparison = () => {
    const validScenarios = compareScenarios
      .map((scenario) => ({
        ...scenario,
        originalPrice: Math.max(0, Number.isFinite(scenario.originalPrice) ? scenario.originalPrice : 0),
        discountPercent: normalizePercentValue(scenario.discountPercent)
      }))
      .filter(s => s.originalPrice > 0);
    
    const comparisonResults = validScenarios.map(scenario => {
      const discountAmount = scenario.originalPrice * (scenario.discountPercent / 100);
      const finalPrice = scenario.originalPrice - discountAmount;
      const savings = discountAmount;
      
      return {
        ...scenario,
        finalPrice,
        savings
      };
    });

    // Найти лучший вариант (максимальная экономия)
    const bestScenario = comparisonResults.length > 0
      ? comparisonResults.reduce((best, current) => 
          current.savings > best.savings ? current : best
        )
      : null;

    setResults(prev => ({
      ...prev,
      comparisonResults,
      bestScenario
    }));
  };

  const addCascadeDiscount = () => {
    const newId = (cascadeDiscounts.length + 1).toString();
    const getDiscountLabel = () => {
      if (newId === '2') return t('discount.secondDiscountLabel');
      if (newId === '3') return t('discount.thirdDiscountLabel');
      if (newId === '4') return t('discount.fourthDiscountLabel');
      return t('discount.additionalDiscountLabel');
    };
    setCascadeDiscounts([...cascadeDiscounts, {
      id: newId,
      description: getDiscountLabel(),
      discountPercent: 0
    }]);
  };

  // Удалить каскадную скидку
  const removeCascadeDiscount = (id: string) => {
    if (cascadeDiscounts.length > 1) {
      setCascadeDiscounts(cascadeDiscounts.filter(d => d.id !== id));
    }
  };

  // Обновить каскадную скидку
  const updateCascadeDiscount = (id: string, field: keyof CascadeDiscount, value: string | number) => {
    setCascadeDiscounts(cascadeDiscounts.map(discount => 
      discount.id === id ? { ...discount, [field]: value } : discount
    ));
  };

  const addCompareScenario = () => {
    const newId = (compareScenarios.length + 1).toString();
    setCompareScenarios([...compareScenarios, {
      id: newId,
      name: `${t('discount.optionN')} ${newId}`,
      originalPrice: 0,
      discountPercent: 0,
      finalPrice: 0,
      savings: 0
    }]);
  };

  // Удалить сценарий сравнения
  const removeCompareScenario = (id: string) => {
    if (compareScenarios.length > 2) {
      setCompareScenarios(compareScenarios.filter(s => s.id !== id));
    }
  };

  // Обновить сценарий сравнения
  const updateCompareScenario = (id: string, field: keyof ComparisonScenario, value: string | number) => {
    setCompareScenarios(compareScenarios.map(scenario => 
      scenario.id === id ? { ...scenario, [field]: value } : scenario
    ));
  };

  useEffect(() => {
    switch (calculationType) {
      case 'single':
        calculateSingleDiscount();
        break;
      case 'cascade':
        calculateCascadeDiscounts();
        break;
      case 'reverse':
        calculateReverseDiscount();
        break;
      case 'compare':
        calculateComparison();
        break;
    }
  }, [calculationType, originalPrice, discountPercent, cascadeOriginalPrice, cascadeDiscounts, 
      reverseOriginalPrice, reverseFinalPrice, compareScenarios]);

  const formatNumber = (num: number) => {
    const safeValue = Number.isFinite(num) ? num : 0;
    const locale = i18n.language === 'kk' ? 'kk-KZ' : 'ru-KZ';
    return safeValue.toLocaleString(locale) + ' ₸';
  };

  const formatPercent = (num: number) => {
    const safeValue = Number.isFinite(num) ? num : 0;
    return safeValue.toFixed(1) + '%';
  };

  const originalPriceValue = normalizePriceInput(originalPrice);
  const discountPercentValue = normalizePercentInput(discountPercent);

  const calculationTypes = [
    {
      id: 'single',
      name: t('discount.singleDiscount'),
      description: t('discount.singleDescription'),
      example: t('discount.singleExample'),
      icon: Tag
    },
    {
      id: 'cascade',
      name: t('discount.cascadeDiscounts'),
      description: t('discount.cascadeDescription'),
      example: t('discount.cascadeExample'),
      icon: TrendingDown
    },
    {
      id: 'reverse',
      name: t('discount.reverseCalculation'),
      description: t('discount.reverseDescription'),
      example: t('discount.reverseExample'),
      icon: Target
    },
    {
      id: 'compare',
      name: t('discount.compareDiscounts'),
      description: t('discount.compareDescription'),
      example: t('discount.compareExample'),
      icon: ShoppingBag
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('discount.heading')}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t('discount.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Calculation Type Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.calculationType')}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {calculationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setCalculationType(type.id as any)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                      calculationType === type.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <h3 className="font-semibold text-xs sm:text-sm lg:text-base truncate">{type.name}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{type.description}</p>
                    <div className="text-xs text-gray-500 break-all">{type.example}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single Discount */}
          {calculationType === 'single' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.singleDiscount')}</h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('discount.originalPrice')}
                    </label>
                    <RangeSlider
                      value={Math.max(0, originalPriceValue)}
                      onChange={(val) => setOriginalPrice(String(val))}
                      min={1000}
                      max={1000000}
                      step={1000}
                      formatValue={(v) => `${v.toLocaleString()} ₸`}
                      color="#3b82f6"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label=""
                      value={originalPrice}
                      onChange={setOriginalPrice}
                      type="number"
                      placeholder={t('discount.enterPrice')}
                      suffix="₸"
                      validation={validatePrice}
                      hint={t('discount.priceBeforeDiscount')}
                    />

                    <InputField
                      label={t('discount.discountSize')}
                      value={discountPercent}
                      onChange={setDiscountPercent}
                      type="number"
                      placeholder={t('discount.enterPercent')}
                      step="0.1"
                      suffix="%"
                      validation={validateDiscountPercent}
                      hint={t('discount.discountPercent')}
                    />
                  </div>
                </div>

                {results.finalPrice > 0 && (
                  <SharePrintButtons
                    title={t('discount.exportSingleTitle')}
                    description={t('discount.exportSingleDesc')}
                    results={generateExportData()}
                    disabled={!generateExportData()}
                  />
                )}
              </div>
            </div>
          )}

          {calculationType === 'cascade' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.cascadeDiscounts')}</h2>

              <div className="space-y-4 sm:space-y-6">
                <InputField
                  label={t('discount.originalPrice')}
                  value={cascadeOriginalPrice}
                  onChange={setCascadeOriginalPrice}
                  type="number"
                  placeholder={t('discount.enterPrice')}
                  suffix="₸"
                  validation={validatePrice}
                  hint={t('discount.priceBeforeAllDiscounts')}
                />

                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('discount.appliedDiscounts')}</h3>
                    <button
                      onClick={addCascadeDiscount}
                      className="text-xs sm:text-sm text-orange-600 hover:text-orange-800 transition-colors"
                    >
                      + {t('discount.addDiscount')}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cascadeDiscounts.map((discount, index) => (
                      <div key={discount.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <h4 className="font-medium text-gray-900 text-sm">{discount.description}</h4>
                          {cascadeDiscounts.length > 1 && (
                            <button
                              onClick={() => removeCascadeDiscount(discount.id)}
                              className="text-xs text-red-500 hover:text-red-700 transition-colors"
                            >
                              {t('discount.remove')}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={discount.description}
                            onChange={(e) => updateCascadeDiscount(discount.id, 'description', e.target.value)}
                            placeholder={t('discount.discountName')}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          />
                          <div className="relative">
                            <input
                              type="number"
                              value={discount.discountPercent}
                              onChange={(e) => updateCascadeDiscount(discount.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                              placeholder={t('discount.percent')}
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-xs">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {results.cascadeSteps.length > 0 && (
                  <SharePrintButtons
                    title={t('discount.exportCascadeTitle')}
                    description={t('discount.exportCascadeDesc')}
                    results={generateExportData()}
                    disabled={!generateExportData()}
                  />
                )}
              </div>
            </div>
          )}

          {calculationType === 'reverse' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.reverseCalculation')}</h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label={t('discount.originalPrice')}
                    value={reverseOriginalPrice}
                    onChange={setReverseOriginalPrice}
                    type="number"
                    placeholder={t('discount.priceBeforeDiscountShort')}
                    suffix="₸"
                    validation={validatePrice}
                  />

                  <InputField
                    label={t('discount.priceWithDiscount')}
                    value={reverseFinalPrice}
                    onChange={setReverseFinalPrice}
                    type="number"
                    placeholder={t('discount.priceAfterDiscount')}
                    suffix="₸"
                    validation={validatePrice}
                  />
                </div>

                {results.calculatedDiscountPercent > 0 && (
                  <SharePrintButtons
                    title={t('discount.exportReverseTitle')}
                    description={t('discount.exportReverseDesc')}
                    results={generateExportData()}
                    disabled={!generateExportData()}
                  />
                )}
              </div>
            </div>
          )}

          {calculationType === 'compare' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.compareDiscounts')}</h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('discount.optionsToCompare')}</h3>
                  <button
                    onClick={addCompareScenario}
                    className="text-xs sm:text-sm text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    + {t('discount.addOption')}
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {compareScenarios.map((scenario, index) => (
                    <div key={scenario.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <input
                          type="text"
                          value={scenario.name}
                          onChange={(e) => updateCompareScenario(scenario.id, 'name', e.target.value)}
                          className="font-medium text-gray-900 bg-transparent border-none p-0 text-sm focus:outline-none focus:ring-0"
                        />
                        {compareScenarios.length > 2 && (
                          <button
                            onClick={() => removeCompareScenario(scenario.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          >
                            {t('discount.remove')}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <input
                            type="number"
                            value={scenario.originalPrice}
                            onChange={(e) => updateCompareScenario(scenario.id, 'originalPrice', parseFloat(e.target.value) || 0)}
                            placeholder={t('discount.price')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">₸</span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={scenario.discountPercent}
                            onChange={(e) => updateCompareScenario(scenario.id, 'discountPercent', parseFloat(e.target.value) || 0)}
                            placeholder={t('discount.discount')}
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {results.comparisonResults.length > 0 && (
                  <SharePrintButtons
                    title={t('discount.exportCompareTitle')}
                    description={t('discount.exportCompareDesc')}
                    results={generateExportData()}
                    disabled={!generateExportData()}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {calculationType === 'single' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.result')}</h2>

              {results.finalPrice > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">{t('discount.finalPriceWithDiscount')}</span>
                      <div className="flex items-center space-x-2">
                        <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        <span className="text-xl sm:text-2xl font-bold text-orange-700 break-all">{formatNumber(results.finalPrice)}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 break-all">
                      {t('discount.savings')}: {formatNumber(results.savings)} ({formatPercent(results.effectiveDiscountPercent)})
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                      <span className="text-sm text-gray-600">{t('discount.originalPrice')}</span>
                      <span className="font-semibold text-gray-900 text-sm break-all">{formatNumber(parseFloat(originalPrice) || 0)}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                      <span className="text-sm text-gray-600">{t('discount.discountSize')}</span>
                      <span className="font-semibold text-orange-600 text-sm">{discountPercent}%</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between py-2 space-y-1 sm:space-y-0">
                      <span className="text-sm text-gray-600">{t('discount.discountAmount')}</span>
                      <span className="font-semibold text-green-600 text-sm break-all">{formatNumber(results.discountAmount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                  {t('discount.enterPriceAndDiscount')}
                </div>
              )}
            </div>
          )}

          {calculationType === 'cascade' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.cascadeResult')}</h2>

              {results.cascadeSteps.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">{t('discount.finalPrice')}</span>
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        <span className="text-xl sm:text-2xl font-bold text-orange-700 break-all">{formatNumber(results.finalPrice)}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 break-all">
                      {t('discount.totalSavings')}: {formatNumber(results.totalCascadeDiscount)} ({formatPercent(results.effectiveDiscountPercent)})
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{t('discount.applyingSteps')}</h4>
                    {results.cascadeSteps.map((step, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">{step.description}</div>
                        <div className="text-xs text-blue-800 space-y-1">
                          <div className="break-all">{formatNumber(step.priceBefore)} - {formatPercent(step.discountPercent)} = {formatNumber(step.priceAfter)}</div>
                          <div>{t('discount.savings')}: {formatNumber(step.discountAmount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                  {t('discount.enterPriceAndSetup')}
                </div>
              )}
            </div>
          )}

          {calculationType === 'reverse' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.calculationResult')}</h2>

              {results.calculatedDiscountPercent > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">{t('discount.discountSize')}</span>
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        <span className="text-xl sm:text-2xl font-bold text-blue-700">{formatPercent(results.calculatedDiscountPercent)}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 break-all">
                      {t('discount.savings')}: {formatNumber(results.discountAmount)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100 space-y-1 sm:space-y-0">
                      <span className="text-sm text-gray-600">{t('discount.originalPrice')}</span>
                      <span className="font-semibold text-gray-900 text-sm break-all">{formatNumber(parseFloat(reverseOriginalPrice) || 0)}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between py-2 space-y-1 sm:space-y-0">
                      <span className="text-sm text-gray-600">{t('discount.priceWithDiscount')}</span>
                      <span className="font-semibold text-green-600 text-sm break-all">{formatNumber(parseFloat(reverseFinalPrice) || 0)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                  {t('discount.enterBothPrices')}
                </div>
              )}
            </div>
          )}

          {calculationType === 'compare' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.comparisonResults')}</h2>

              {results.comparisonResults.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {results.bestScenario && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 sm:p-6 border border-green-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-2">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">{t('discount.bestOption')}</span>
                        <div className="flex items-center space-x-2">
                          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                          <span className="text-base sm:text-xl font-bold text-green-700 break-all">{results.bestScenario.name}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 break-all">
                        {t('discount.maximumSavings')}: {formatNumber(results.bestScenario.savings)}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 sm:space-y-3">
                    {results.comparisonResults.map((scenario, index) => (
                      <div key={scenario.id} className={`p-3 sm:p-4 rounded-lg border ${
                        results.bestScenario && scenario.id === results.bestScenario.id
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{scenario.name}</div>
                            <div className="text-xs text-gray-600 break-all">
                              {formatNumber(scenario.originalPrice)} → {formatNumber(scenario.finalPrice)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900 text-sm break-all">{formatPercent(scenario.discountPercent)}</div>
                            <div className="text-xs text-green-600 break-all">-{formatNumber(scenario.savings)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                  {t('discount.fillOptionsForComparison')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.savingsTips')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Percent className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('discount.cascadeDiscountsTip')}</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              {t('discount.cascadeTipDesc')}
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('discount.compareOffersTip')}</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              {t('discount.compareTipDesc')}
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Info className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('discount.hiddenConditionsTip')}</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              {t('discount.hiddenTipDesc')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.calculationExamples')}</h2>

        <div className="space-y-4 sm:space-y-6">
          <div className="border border-orange-200 rounded-lg p-3 sm:p-4 bg-orange-50">
            <h3 className="font-semibold text-orange-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.example1')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('discount.initialData')}</div>
                <div>{t('discount.productPrice')} 50,000 ₸</div>
                <div>{t('discount.discountLabel')} 25%</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('discount.calculation')}</div>
                <div>50,000 x 25% = 12,500 ₸</div>
                <div>50,000 - 12,500 = 37,500 ₸</div>
              </div>
              <div>
                <div className="font-medium text-orange-700">{t('discount.resultLabel')}</div>
                <div className="text-base sm:text-lg font-bold text-orange-600">37,500 ₸</div>
                <div className="text-xs text-orange-600">{t('discount.economyLabel')} 12,500 ₸</div>
              </div>
            </div>
          </div>

          <div className="border border-blue-200 rounded-lg p-3 sm:p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.example2')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('discount.initialData')}</div>
                <div>{t('discount.price')}: 100,000 ₸</div>
                <div>{t('discount.firstDiscount')} 20%</div>
                <div>{t('discount.secondDiscount')} 10%</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('discount.calculation')}</div>
                <div>100,000 - 20% = 80,000 ₸</div>
                <div>80,000 - 10% = 72,000 ₸</div>
                <div>{t('discount.effectiveDiscount')} 28%</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('discount.resultLabel')}</div>
                <div className="text-base sm:text-lg font-bold text-blue-600">72,000 ₸</div>
                <div className="text-xs text-blue-600">{t('discount.economyLabel')} 28,000 ₸</div>
              </div>
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-3 sm:p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.example3')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('discount.initialData')}</div>
                <div>{t('discount.priceWithoutDiscount')} 80,000 ₸</div>
                <div>{t('discount.priceWithDiscountLabel')} 64,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('discount.calculation')}</div>
                <div>{t('discount.savings')}: 16,000 ₸</div>
                <div>16,000 / 80,000 x 100%</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('discount.resultLabel')}</div>
                <div className="text-base sm:text-lg font-bold text-green-600">20%</div>
                <div className="text-xs text-green-600">{t('discount.economyLabel')} 16,000 ₸</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.calculationFormulas')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.directCalculation')}</h3>
            <div className="font-mono text-xs sm:text-sm text-blue-800 bg-white p-2 sm:p-3 rounded border break-all">
              {t('discount.formula1')}
              <br />
              {t('discount.formula2')}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-green-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.reverseCalculationFormula')}</h3>
            <div className="font-mono text-xs sm:text-sm text-green-800 bg-white p-2 sm:p-3 rounded border break-all">
              {t('discount.formula3')}
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-amber-900 mb-1">
                {t('discount.cascadeFeatures')}
              </h3>
              <p className="text-amber-800 text-xs sm:text-sm leading-relaxed">
                {t('discount.cascadeFeaturesDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.practicalTips')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.maximizeSavings')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.whatToWatch')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.watch1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.watch2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.watch3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.watch4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.seasonalCalendar')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">{t('discount.januaryFebruary')}</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div>- {t('discount.afterHolidaySales')}</div>
              <div>- {t('discount.winterClothes')}</div>
              <div>- {t('discount.holidayGoods')}</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2 text-sm">{t('discount.marchMay')}</h4>
            <div className="text-xs text-green-800 space-y-1">
              <div>- {t('discount.springDiscounts')}</div>
              <div>- {t('discount.gardenGoods')}</div>
              <div>- {t('discount.sportsGoods')}</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2 text-sm">{t('discount.juneAugust')}</h4>
            <div className="text-xs text-yellow-800 space-y-1">
              <div>- {t('discount.summerSales')}</div>
              <div>- {t('discount.touristGoods')}</div>
              <div>- {t('discount.coolingDevices')}</div>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2 text-sm">{t('discount.septemberDecember')}</h4>
            <div className="text-xs text-orange-800 space-y-1">
              <div>- {t('discount.blackFriday')}</div>
              <div>- {t('discount.preNewYearDiscounts')}</div>
              <div>- {t('discount.schoolOfficeGoods')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('discount.discountPsychology')}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.marketingTricks')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.trick1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.trick2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.trick3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.trick4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('discount.rationalApproach')}</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.rational1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.rational2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.rational3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                <span className="leading-relaxed">{t('discount.rational4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-teal-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-teal-900 mb-1">
                {t('discount.paretoLaw')}
              </h3>
              <p className="text-teal-800 text-xs sm:text-sm leading-relaxed">
                {t('discount.paretoDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма и экспорт */}
      {results && results.finalPrice > 0 && calculationType === 'single' && (
        <div className="mt-8 space-y-6">
          <TaxPieChart
            data={[
              { name: 'Скидка', value: results.discountAmount },
              { name: 'К оплате', value: results.finalPrice },
            ]}
            title="Структура цены"
          />
          <ExportButtons
            data={{
              title: 'Расчёт скидки',
              subtitle: `Скидка ${discountPercentValue}%`,
              sections: [
                {
                  title: 'Расчёт',
                  data: [
                    { label: 'Первоначальная цена', value: formatNumber(originalPriceValue) },
                    { label: 'Скидка', value: `${discountPercentValue}%` },
                    { label: 'Сумма скидки', value: formatNumber(results.discountAmount) },
                    { label: 'Итоговая цена', value: formatNumber(results.finalPrice) },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="discount-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('discount.faq.q1'), answer: t('discount.faq.a1') },
          { question: t('discount.faq.q2'), answer: t('discount.faq.a2') },
          { question: t('discount.faq.q3'), answer: t('discount.faq.a3') },
          { question: t('discount.faq.q4'), answer: t('discount.faq.a4') },
          { question: t('discount.faq.q5'), answer: t('discount.faq.a5') }
        ]}
        sources={[
          { title: 'Права потребителей РК', url: 'https://adilet.zan.kz/rus/docs/Z010000221_' },
          { title: 'Kaspi.kz — сравнение цен', url: 'https://kaspi.kz/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="discount"
        calculatorTitle="Калькулятор скидок"
      />
    </div>
  );
}