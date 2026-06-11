import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Calculator, TrendingUp, Info, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

interface PropertyType {
  id: string;
  labelKey: string;
  minOwnershipYears: number; // срок владения, после которого продажа освобождается от ИПН (0 = всегда облагается). Недвижимость: 2 года с 01.01.2026 (новый НК РК, ст. 331/363 + переходная ст. 842); ТС: 1 год.
  alwaysTaxable: boolean;
}

export default function PropertySaleTaxCalculator() {
  const { t } = useTranslation('calculators');

  const propertyTypes: PropertyType[] = [
    // Недвижимость: срок владения для освобождения от ИПН — 2 года с 01.01.2026 (ранее 1 год)
    { id: 'apartment', labelKey: 'property-sale-tax.typeApartment', minOwnershipYears: 2, alwaysTaxable: false },
    { id: 'house', labelKey: 'property-sale-tax.typeHouse', minOwnershipYears: 2, alwaysTaxable: false },
    { id: 'land', labelKey: 'property-sale-tax.typeLand', minOwnershipYears: 2, alwaysTaxable: false },
    { id: 'dacha', labelKey: 'property-sale-tax.typeDacha', minOwnershipYears: 2, alwaysTaxable: false },
    { id: 'garage', labelKey: 'property-sale-tax.typeGarage', minOwnershipYears: 2, alwaysTaxable: false },
    // ТС: срок владения остаётся 1 год (ст. 331 НК РК, изменение 2026 касается только недвижимости)
    { id: 'car', labelKey: 'property-sale-tax.typeCar', minOwnershipYears: 1, alwaysTaxable: false },
    { id: 'commercial', labelKey: 'property-sale-tax.typeCommercial', minOwnershipYears: 0, alwaysTaxable: true },
  ];

  const TAX_RATE = 0.10; // 10% ИПН

  const [selectedType, setSelectedType] = useState<string>('apartment');
  const [salePrice, setSalePrice] = useState<string>('25000000');
  const [purchasePrice, setPurchasePrice] = useState<string>('20000000');
  const [ownershipYears, setOwnershipYears] = useState<string>('0');
  const [ownershipMonths, setOwnershipMonths] = useState<string>('8');
  const [isMainHome, setIsMainHome] = useState<boolean>(false);
  const [isInherited, setIsInherited] = useState<boolean>(false);

  const [results, setResults] = useState({
    gain: 0,
    isTaxable: false,
    reasonKey: '' as string,
    tax: 0,
    netProfit: 0,
    effectiveRate: 0,
    declarationDeadline: '',
    recommendation: '' as string,
  });

  // Вычисление дедлайна декларации ФНО 240.00 — 31 марта следующего года
  const getDeclarationDeadline = (): string => {
    const now = new Date();
    const nextYear = now.getFullYear() + 1;
    return `31.03.${nextYear}`;
  };

  useEffect(() => {
    const sale = parseFloat(salePrice) || 0;
    const purchase = parseFloat(purchasePrice) || 0;
    const years = parseFloat(ownershipYears) || 0;
    const months = parseFloat(ownershipMonths) || 0;

    const gain = sale - purchase;
    const totalMonths = years * 12 + months;

    const propertyType = propertyTypes.find((p) => p.id === selectedType);
    if (!propertyType || sale <= 0) {
      setResults({
        gain: 0,
        isTaxable: false,
        reasonKey: '',
        tax: 0,
        netProfit: 0,
        effectiveRate: 0,
        declarationDeadline: getDeclarationDeadline(),
        recommendation: '',
      });
      return;
    }

    let isTaxable = true;
    let reasonKey = '';
    let recommendation = '';

    // 1. Если прироста нет — налог не платится
    if (gain <= 0) {
      isTaxable = false;
      reasonKey = 'property-sale-tax.exemptNoGain';
    }
    // 2. Коммерческая недвижимость — всегда облагается (если есть прирост)
    else if (propertyType.alwaysTaxable) {
      isTaxable = true;
      reasonKey = 'property-sale-tax.taxableCommercial';
    }
    // 3. Срок владения больше минимального — освобождение
    else if (totalMonths >= propertyType.minOwnershipYears * 12) {
      isTaxable = false;
      reasonKey = 'property-sale-tax.exemptOwnershipPeriod';
    }
    // 4. Иначе — облагается
    else {
      isTaxable = true;
      reasonKey = 'property-sale-tax.taxableShortOwnership';

      // Рекомендация: если до окончания льготного срока владения осталось меньше 3 месяцев
      const monthsLeft = propertyType.minOwnershipYears * 12 - totalMonths;
      if (monthsLeft > 0 && monthsLeft <= 3) {
        recommendation = 'property-sale-tax.recommendationWait';
      }
    }

    // Наследство: освобождается, если выдержан льготный срок владения для данного типа имущества
    // (недвижимость — 2 года с 01.01.2026, ТС — 1 год)
    if (isInherited && totalMonths >= propertyType.minOwnershipYears * 12 && !propertyType.alwaysTaxable) {
      isTaxable = false;
      reasonKey = 'property-sale-tax.exemptInherited';
    }

    const tax = isTaxable ? Math.round(gain * TAX_RATE) : 0;
    const netProfit = sale - purchase - tax;
    const effectiveRate = sale > 0 ? (tax / sale) * 100 : 0;

    setResults({
      gain: Math.round(gain),
      isTaxable,
      reasonKey,
      tax,
      netProfit: Math.round(netProfit),
      effectiveRate: Number(effectiveRate.toFixed(2)),
      declarationDeadline: getDeclarationDeadline(),
      recommendation,
    });
  }, [selectedType, salePrice, purchasePrice, ownershipYears, ownershipMonths, isMainHome, isInherited]);

  const formatCurrency = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const generateExportData = () => {
    if (!salePrice || parseFloat(salePrice) === 0) return null;

    const propertyType = propertyTypes.find((p) => p.id === selectedType);

    return `${t('property-sale-tax.exportTitle')}
─────────────────────────────
${t('property-sale-tax.propertyType')}: ${propertyType ? t(propertyType.labelKey) : ''}
${t('property-sale-tax.salePrice')}: ${formatCurrency(parseFloat(salePrice) || 0)}
${t('property-sale-tax.purchasePrice')}: ${formatCurrency(parseFloat(purchasePrice) || 0)}
${t('property-sale-tax.ownershipPeriod')}: ${ownershipYears} ${t('property-sale-tax.years')} ${ownershipMonths} ${t('property-sale-tax.months')}

${t('property-sale-tax.resultsTitle')}:
─────────────────────────────
${t('property-sale-tax.gain')}: ${formatCurrency(results.gain)}
${t('property-sale-tax.taxStatus')}: ${results.isTaxable ? t('property-sale-tax.statusTaxable') : t('property-sale-tax.statusExempt')}
${t('property-sale-tax.reason')}: ${results.reasonKey ? t(results.reasonKey) : '—'}
${t('property-sale-tax.taxAmount')}: ${formatCurrency(results.tax)}
${t('property-sale-tax.netProfit')}: ${formatCurrency(results.netProfit)}
${t('property-sale-tax.effectiveRate')}: ${results.effectiveRate}%
${t('property-sale-tax.declarationDeadline')}: ${results.declarationDeadline}
─────────────────────────────
calk.kz`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="property-sale-tax" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('property-sale-tax.heading')}</h1>
            <p className="text-gray-600">{t('property-sale-tax.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm">
          {t('property-sale-tax.warning')}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('property-sale-tax.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Property type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Home className="w-4 h-4 inline mr-1" />
                {t('property-sale-tax.propertyType')}
              </label>
              <div className="flex flex-wrap gap-2">
                {propertyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(type.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sale price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-sale-tax.salePrice')}
              </label>
              <RangeSlider
                value={parseFloat(salePrice) || 0}
                onChange={(val) => setSalePrice(String(val))}
                min={100000}
                max={200000000}
                step={100000}
                formatValue={(v) => formatCurrency(v)}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={t('property-sale-tax.enterSalePrice')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Purchase price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-sale-tax.purchasePrice')}
              </label>
              <RangeSlider
                value={parseFloat(purchasePrice) || 0}
                onChange={(val) => setPurchasePrice(String(val))}
                min={0}
                max={200000000}
                step={100000}
                formatValue={(v) => formatCurrency(v)}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder={t('property-sale-tax.enterPurchasePrice')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('property-sale-tax.purchasePriceHint')}</p>
            </div>

            {/* Ownership period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('property-sale-tax.ownershipPeriod')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={ownershipYears}
                    onChange={(e) => setOwnershipYears(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('property-sale-tax.years')}</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={ownershipMonths}
                    onChange={(e) => setOwnershipMonths(e.target.value)}
                    min="0"
                    max="11"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('property-sale-tax.months')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMainHome}
                  onChange={(e) => setIsMainHome(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('property-sale-tax.isMainHome')}</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInherited}
                  onChange={(e) => setIsInherited(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{t('property-sale-tax.isInherited')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            {t('property-sale-tax.resultsTitle')}
          </h2>

          <div className="space-y-4">
            {/* Gain */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('property-sale-tax.gain')}</span>
                <span className={`text-2xl font-bold ${results.gain > 0 ? 'text-blue-700' : 'text-gray-500'}`}>
                  {formatCurrency(results.gain)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {t('property-sale-tax.gainFormula')}
              </div>
            </div>

            {/* Tax status — green or yellow */}
            {results.isTaxable ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start space-x-3 mb-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-lg font-bold text-yellow-800">
                      {t('property-sale-tax.statusTaxable')}
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">
                      {results.reasonKey ? t(results.reasonKey) : ''}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('property-sale-tax.taxAmount')}</span>
                    <span className="text-2xl font-bold text-yellow-700">{formatCurrency(results.tax)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    10% × {formatCurrency(results.gain)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-lg font-bold text-green-800">
                      {t('property-sale-tax.statusExempt')}
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      {results.reasonKey ? t(results.reasonKey) : ''}
                    </div>
                    <div className="text-sm text-green-700 mt-2 font-semibold">
                      {t('property-sale-tax.taxAmount')}: 0 ₸
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Net profit */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('property-sale-tax.netProfit')}</div>
                <div className="text-xs text-gray-500">{t('property-sale-tax.netProfitFormula')}</div>
              </div>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(results.netProfit)}</span>
            </div>

            {/* Effective rate */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('property-sale-tax.effectiveRate')}</div>
                <div className="text-xs text-gray-500">{t('property-sale-tax.effectiveRateHint')}</div>
              </div>
              <span className="text-lg font-bold text-gray-900">{results.effectiveRate}%</span>
            </div>

            {/* Declaration deadline */}
            {results.isTaxable && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-blue-900">
                      {t('property-sale-tax.declarationDeadline')}
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {results.declarationDeadline}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {t('property-sale-tax.declarationForm')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {results.recommendation && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-800">
                    {t(results.recommendation)}
                  </div>
                </div>
              </div>
            )}

            {/* Info block */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <Info className="w-4 h-4 inline mr-1" />
              {t('property-sale-tax.infoNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="mt-8">
        <ExportButtons
          data={generateExportData()}
          filename={t('property-sale-tax.exportFilename')}
        />
      </div>

      {/* FAQ */}
      <CalculatorExamples calculatorId="property-sale-tax" />
      <MethodologySection steps={getMethodology('property-sale-tax')} />
      <FAQSection
        items={[
          { question: t('property-sale-tax.faq.q1'), answer: t('property-sale-tax.faq.a1') },
          { question: t('property-sale-tax.faq.q2'), answer: t('property-sale-tax.faq.a2') },
          { question: t('property-sale-tax.faq.q3'), answer: t('property-sale-tax.faq.a3') },
          { question: t('property-sale-tax.faq.q4'), answer: t('property-sale-tax.faq.a4') },
          { question: t('property-sale-tax.faq.q5'), answer: t('property-sale-tax.faq.a5') }
        ]}
      
          sources={getSources('property-sale-tax')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget />
      <LastUpdated calculatorId="property-sale-tax" />
    </div>
  );
}
