import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Percent,
  Calculator,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RotateCcw,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import InputField from '../InputField';
import SharePrintButtons from '../SharePrintButtons';
import { ExportButtons } from '../ui/ExportButtons';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { EmbedWidget } from '../ui/EmbedWidget';

type CalculationType = 'percentOf' | 'percentFrom' | 'percentChange' | 'findBase';

interface ResultInfo {
  isValid: boolean;
  error?: string | null;
  mainLabel: string;
  mainValue: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  formula?: string;
  inputs: { label: string; value: string }[];
  directionLabel?: string;
  directionTone?: 'up' | 'down' | 'equal';
}

export default function PercentageCalculator() {
  const { t, i18n } = useTranslation(['calculators', 'common']);
  const locale = i18n.language === 'kk' ? 'kk-KZ' : 'ru-KZ';

  const [calculationType, setCalculationType] = useState<CalculationType>('percentOf');
  const [percentOfBase, setPercentOfBase] = useState('1000');
  const [percentOfRate, setPercentOfRate] = useState('15');
  const [partValue, setPartValue] = useState('');
  const [wholeValue, setWholeValue] = useState('');
  const [changeFrom, setChangeFrom] = useState('');
  const [changeTo, setChangeTo] = useState('');
  const [reverseResult, setReverseResult] = useState('');
  const [reversePercent, setReversePercent] = useState('');

  const parseNumber = (value: string) => {
    if (!value.trim()) {
      return null;
    }
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatNumber = (value: number, digits = 2) => {
    if (!Number.isFinite(value)) {
      return '—';
    }
    return value.toLocaleString(locale, { maximumFractionDigits: digits });
  };

  const formatPercent = (value: number, digits = 2) => `${formatNumber(value, digits)}%`;

  const formatSignedNumber = (value: number, digits = 2) => {
    if (!Number.isFinite(value)) {
      return '—';
    }
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${formatNumber(Math.abs(value), digits)}`;
  };

  const formatSignedPercent = (value: number, digits = 2) => `${formatSignedNumber(value, digits)}%`;

  const hasValue = (value: string) => value.trim().length > 0;

  const validateNonZero = (value: string, errorKey: string) => {
    if (!hasValue(value)) {
      return null;
    }
    const num = parseNumber(value);
    if (num === null) {
      return t('percentage.validation.invalidNumber');
    }
    if (num === 0) {
      return t(errorKey);
    }
    return null;
  };

  const percentOfBaseNumber = parseNumber(percentOfBase);
  const percentOfRateNumber = parseNumber(percentOfRate);
  const percentOfValid = percentOfBaseNumber !== null && percentOfRateNumber !== null;
  const percentOfValue = percentOfValid ? (percentOfBaseNumber * percentOfRateNumber) / 100 : 0;

  const partNumber = parseNumber(partValue);
  const wholeNumber = parseNumber(wholeValue);
  const percentFromError = wholeNumber === 0 && hasValue(wholeValue) ? t('percentage.validation.zeroWhole') : null;
  const percentFromValid = partNumber !== null && wholeNumber !== null && wholeNumber !== 0;
  const percentFromValue = percentFromValid ? (partNumber / wholeNumber) * 100 : 0;

  const changeFromNumber = parseNumber(changeFrom);
  const changeToNumber = parseNumber(changeTo);
  const percentChangeError = changeFromNumber === 0 && hasValue(changeFrom) ? t('percentage.validation.zeroBase') : null;
  const percentChangeValid = changeFromNumber !== null && changeToNumber !== null && changeFromNumber !== 0;
  const changeAmount = percentChangeValid ? changeToNumber - changeFromNumber : 0;
  const changePercent = percentChangeValid ? (changeAmount / changeFromNumber) * 100 : 0;
  const changeDirection: 'up' | 'down' | 'equal' =
    changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'equal';

  const reverseResultNumber = parseNumber(reverseResult);
  const reversePercentNumber = parseNumber(reversePercent);
  const findBaseError = reversePercentNumber === 0 && hasValue(reversePercent)
    ? t('percentage.validation.zeroPercent')
    : null;
  const findBaseValid = reverseResultNumber !== null && reversePercentNumber !== null && reversePercentNumber !== 0;
  const findBaseValue = findBaseValid ? reverseResultNumber / (reversePercentNumber / 100) : 0;

  const resultsByType: Record<CalculationType, ResultInfo> = {
    percentOf: {
      isValid: percentOfValid,
      mainLabel: t('percentage.results.resultValue'),
      mainValue: formatNumber(percentOfValue),
      formula: percentOfValid
        ? `${formatNumber(percentOfBaseNumber ?? 0)} × ${formatNumber(percentOfRateNumber ?? 0)}% = ${formatNumber(percentOfValue)}`
        : '',
      inputs: [
        { label: t('percentage.inputs.baseNumber'), value: formatNumber(percentOfBaseNumber ?? 0) },
        { label: t('percentage.inputs.percent'), value: formatPercent(percentOfRateNumber ?? 0) }
      ]
    },
    percentFrom: {
      isValid: percentFromValid,
      error: percentFromError,
      mainLabel: t('percentage.results.percentOfWhole'),
      mainValue: formatPercent(percentFromValue),
      formula: percentFromValid
        ? `${formatNumber(partNumber ?? 0)} ÷ ${formatNumber(wholeNumber ?? 0)} × 100 = ${formatPercent(percentFromValue)}`
        : '',
      inputs: [
        { label: t('percentage.inputs.partNumber'), value: formatNumber(partNumber ?? 0) },
        { label: t('percentage.inputs.wholeNumber'), value: formatNumber(wholeNumber ?? 0) }
      ]
    },
    percentChange: {
      isValid: percentChangeValid,
      error: percentChangeError,
      mainLabel: t('percentage.results.changePercent'),
      mainValue: formatSignedPercent(changePercent),
      secondaryLabel: t('percentage.results.changeAmount'),
      secondaryValue: formatSignedNumber(changeAmount),
      formula: percentChangeValid
        ? `(${formatNumber(changeToNumber ?? 0)} - ${formatNumber(changeFromNumber ?? 0)}) ÷ ${formatNumber(changeFromNumber ?? 0)} × 100 = ${formatSignedPercent(changePercent)}`
        : '',
      inputs: [
        { label: t('percentage.inputs.oldValue'), value: formatNumber(changeFromNumber ?? 0) },
        { label: t('percentage.inputs.newValue'), value: formatNumber(changeToNumber ?? 0) }
      ],
      directionLabel: changeDirection === 'up'
        ? t('percentage.results.directionUp')
        : changeDirection === 'down'
          ? t('percentage.results.directionDown')
          : t('percentage.results.directionEqual'),
      directionTone: changeDirection
    },
    findBase: {
      isValid: findBaseValid,
      error: findBaseError,
      mainLabel: t('percentage.results.baseNumber'),
      mainValue: formatNumber(findBaseValue),
      formula: findBaseValid
        ? `${formatNumber(reverseResultNumber ?? 0)} ÷ (${formatNumber(reversePercentNumber ?? 0)} / 100) = ${formatNumber(findBaseValue)}`
        : '',
      inputs: [
        { label: t('percentage.inputs.resultValue'), value: formatNumber(reverseResultNumber ?? 0) },
        { label: t('percentage.inputs.percent'), value: formatPercent(reversePercentNumber ?? 0) }
      ]
    }
  };

  const activeResult = resultsByType[calculationType];
  const isActiveValid = activeResult.isValid && !activeResult.error;

  const clearInputs = () => {
    setPercentOfBase('');
    setPercentOfRate('');
    setPartValue('');
    setWholeValue('');
    setChangeFrom('');
    setChangeTo('');
    setReverseResult('');
    setReversePercent('');
  };

  const shareResults = (() => {
    if (!isActiveValid) {
      return '';
    }
    const inputLines = activeResult.inputs
      .map(item => `${item.label}: ${item.value}`)
      .join('\n');
    const resultLines = [
      `${activeResult.mainLabel}: ${activeResult.mainValue}`,
      activeResult.secondaryLabel && activeResult.secondaryValue
        ? `${activeResult.secondaryLabel}: ${activeResult.secondaryValue}`
        : '',
      activeResult.formula
        ? `${t('percentage.results.formula')}: ${activeResult.formula}`
        : ''
    ].filter(Boolean).join('\n');

    return `${t(`percentage.types.${calculationType}.title`)}\n\n${inputLines}\n\n${resultLines}`;
  })();

  const exportData = isActiveValid ? {
    title: t('percentage.export.title'),
    subtitle: t(`percentage.types.${calculationType}.title`),
    sections: [
      {
        title: t('percentage.export.inputSection'),
        data: activeResult.inputs.map(item => ({ label: item.label, value: item.value }))
      },
      {
        title: t('percentage.export.resultSection'),
        data: [
          { label: activeResult.mainLabel, value: activeResult.mainValue },
          ...(activeResult.secondaryLabel && activeResult.secondaryValue
            ? [{ label: activeResult.secondaryLabel, value: activeResult.secondaryValue }]
            : []),
          ...(activeResult.formula
            ? [{ label: t('percentage.results.formula'), value: activeResult.formula }]
            : [])
        ]
      }
    ],
    footer: t('percentage.export.footer')
  } : null;

  const directionStyle = {
    up: { icon: ArrowUpRight, className: 'bg-green-100 text-green-700' },
    down: { icon: ArrowDownRight, className: 'bg-red-100 text-red-700' },
    equal: { icon: Minus, className: 'bg-gray-100 text-gray-700' }
  } as const;

  const typeOptions = [
    {
      id: 'percentOf' as const,
      icon: Percent,
      title: t('percentage.types.percentOf.title'),
      description: t('percentage.types.percentOf.description')
    },
    {
      id: 'percentFrom' as const,
      icon: Calculator,
      title: t('percentage.types.percentFrom.title'),
      description: t('percentage.types.percentFrom.description')
    },
    {
      id: 'percentChange' as const,
      icon: TrendingUp,
      title: t('percentage.types.percentChange.title'),
      description: t('percentage.types.percentChange.description')
    },
    {
      id: 'findBase' as const,
      icon: Target,
      title: t('percentage.types.findBase.title'),
      description: t('percentage.types.findBase.description')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Percent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('percentage.title')}</h1>
            <p className="text-gray-600">{t('percentage.description')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="percentage" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                {t('percentage.inputData')}
              </h2>
              <button
                onClick={clearInputs}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t('common:calculator.reset')}
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">{t('percentage.calculationType')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {typeOptions.map(option => {
                  const OptionIcon = option.icon;
                  const isActive = calculationType === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setCalculationType(option.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <OptionIcon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-gray-900">{option.title}</h3>
                      </div>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              {calculationType === 'percentOf' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label={t('percentage.inputs.baseNumber')}
                    value={percentOfBase}
                    onChange={setPercentOfBase}
                    placeholder={t('percentage.placeholders.baseNumber')}
                    type="number"
                    step={0.01}
                  />
                  <InputField
                    label={t('percentage.inputs.percent')}
                    value={percentOfRate}
                    onChange={setPercentOfRate}
                    placeholder={t('percentage.placeholders.percent')}
                    type="number"
                    step={0.01}
                    suffix="%"
                  />
                </div>
              )}

              {calculationType === 'percentFrom' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label={t('percentage.inputs.partNumber')}
                    value={partValue}
                    onChange={setPartValue}
                    placeholder={t('percentage.placeholders.partNumber')}
                    type="number"
                    step={0.01}
                  />
                  <InputField
                    label={t('percentage.inputs.wholeNumber')}
                    value={wholeValue}
                    onChange={setWholeValue}
                    placeholder={t('percentage.placeholders.wholeNumber')}
                    type="number"
                    step={0.01}
                    validation={(value) => validateNonZero(value, 'percentage.validation.zeroWhole')}
                  />
                </div>
              )}

              {calculationType === 'percentChange' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label={t('percentage.inputs.oldValue')}
                    value={changeFrom}
                    onChange={setChangeFrom}
                    placeholder={t('percentage.placeholders.oldValue')}
                    type="number"
                    step={0.01}
                    validation={(value) => validateNonZero(value, 'percentage.validation.zeroBase')}
                  />
                  <InputField
                    label={t('percentage.inputs.newValue')}
                    value={changeTo}
                    onChange={setChangeTo}
                    placeholder={t('percentage.placeholders.newValue')}
                    type="number"
                    step={0.01}
                  />
                </div>
              )}

              {calculationType === 'findBase' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label={t('percentage.inputs.resultValue')}
                    value={reverseResult}
                    onChange={setReverseResult}
                    placeholder={t('percentage.placeholders.resultValue')}
                    type="number"
                    step={0.01}
                  />
                  <InputField
                    label={t('percentage.inputs.percent')}
                    value={reversePercent}
                    onChange={setReversePercent}
                    placeholder={t('percentage.placeholders.percent')}
                    type="number"
                    step={0.01}
                    suffix="%"
                    validation={(value) => validateNonZero(value, 'percentage.validation.zeroPercent')}
                  />
                </div>
              )}
            </div>

            {activeResult.error && (
              <div className="mt-6 flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{activeResult.error}</p>
              </div>
            )}
          </div>

          {isActiveValid && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                {t('percentage.resultsTitle')}
              </h2>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-sm font-medium text-blue-900">{activeResult.mainLabel}</span>
                    <span className="text-2xl font-bold text-blue-900">{activeResult.mainValue}</span>
                  </div>

                  {activeResult.directionLabel && activeResult.directionTone && (
                    <div className="mt-3">
                      {(() => {
                        const direction = directionStyle[activeResult.directionTone];
                        const DirectionIcon = direction.icon;
                        return (
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${direction.className}`}>
                            <DirectionIcon className="w-4 h-4" />
                            {activeResult.directionLabel}
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {activeResult.secondaryLabel && activeResult.secondaryValue && (
                    <div className="mt-3 flex items-center justify-between text-sm text-blue-900">
                      <span>{activeResult.secondaryLabel}</span>
                      <span className="font-semibold">{activeResult.secondaryValue}</span>
                    </div>
                  )}
                </div>

                {activeResult.formula && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      {t('percentage.results.formula')}
                    </div>
                    <code className="block text-sm text-gray-900 font-mono break-words">
                      {activeResult.formula}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <Percent className="w-6 h-6" />
                <h3 className="text-lg font-semibold">{t('percentage.summaryTitle')}</h3>
              </div>

              {isActiveValid ? (
                <>
                  <div className="mb-6">
                    <div className="text-sm opacity-90 mb-1">{activeResult.mainLabel}</div>
                    <div className="text-3xl font-bold">{activeResult.mainValue}</div>
                    {activeResult.secondaryLabel && activeResult.secondaryValue && (
                      <div className="text-sm opacity-90 mt-2">
                        {activeResult.secondaryLabel}: {activeResult.secondaryValue}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/20">
                    {activeResult.inputs.map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="opacity-90">{item.label}</span>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <SharePrintButtons
                      title={t('percentage.shareTitle')}
                      description={t('percentage.shareDescription')}
                      results={shareResults}
                      disabled={!shareResults}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-60" />
                  <p className="text-sm opacity-90">{t('percentage.summaryPrompt')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {exportData && (
        <div className="mt-8">
          <ExportButtons data={exportData} filename="percentage-calculation" />
        </div>
      )}

      <CalculatorExamples calculatorId="percentage" />

      <MethodologySection steps={getMethodology('percentage')} />

      <FAQSection
        items={[
          { question: t('percentage.faq.q1'), answer: t('percentage.faq.a1') },
          { question: t('percentage.faq.q2'), answer: t('percentage.faq.a2') },
          { question: t('percentage.faq.q3'), answer: t('percentage.faq.a3') },
          { question: t('percentage.faq.q4'), answer: t('percentage.faq.a4') },
          { question: t('percentage.faq.q5'), answer: t('percentage.faq.a5') }
        ]}
        sources={[
          { title: t('percentage.sources.wiki'), url: 'https://ru.wikipedia.org/wiki/Процент' }
        ]}
      />

      <ExpertBlock />
      <EmbedWidget
        calculatorId="percentage"
        calculatorTitle={t('percentage.title')}
      />
      <LastUpdated calculatorId="percentage" />
    </div>
  );
}
