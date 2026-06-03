import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Car,
  Calculator,
  MapPin,
  User,
  Percent,
  Info,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Award,
} from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';

type Region = 'almaty-astana' | 'shymkent-karaganda' | 'other';
type Coverage = 'full' | 'partial' | 'theft-only';
type Deductible = '0' | '50000' | '200000' | '500000';

interface CoeffEntry {
  label: string;
  value: number;
}

export default function KaskoCalculator() {
  const { t, i18n } = useTranslation('calculators');

  // Базовая ставка КАСКО — 4% от стоимости авто
  const BASE_RATE = 0.04;

  const [carValue, setCarValue] = useState<string>('8000000');
  const [driverAge, setDriverAge] = useState<string>('35');
  const [drivingExperience, setDrivingExperience] = useState<string>('10');
  const [region, setRegion] = useState<Region>('almaty-astana');
  const [carAge, setCarAge] = useState<string>('3');
  const [coverage, setCoverage] = useState<Coverage>('full');
  const [deductible, setDeductible] = useState<Deductible>('50000');

  const [results, setResults] = useState({
    basePremium: 0,
    driverCoeff: 1,
    experienceCoeff: 1,
    regionCoeff: 1,
    carAgeCoeff: 1,
    coverageCoeff: 1,
    deductibleCoeff: 1,
    finalPremium: 0,
    monthlyPremium: 0,
    percentOfValue: 0,
    maxPayout: 0,
    ogpoReference: 0,
    refused: false,
  });

  const regionOptions = useMemo(
    () => [
      { id: 'almaty-astana' as Region, label: t('kasko.regions.almatyAstana'), coeff: 1.2 },
      { id: 'shymkent-karaganda' as Region, label: t('kasko.regions.shymkentKaraganda'), coeff: 1.1 },
      { id: 'other' as Region, label: t('kasko.regions.other'), coeff: 1.0 },
    ],
    [t]
  );

  const coverageOptions = useMemo(
    () => [
      { id: 'full' as Coverage, label: t('kasko.coverage.full'), hint: t('kasko.coverage.fullHint'), coeff: 1.0 },
      { id: 'partial' as Coverage, label: t('kasko.coverage.partial'), hint: t('kasko.coverage.partialHint'), coeff: 0.7 },
      { id: 'theft-only' as Coverage, label: t('kasko.coverage.theftOnly'), hint: t('kasko.coverage.theftOnlyHint'), coeff: 0.5 },
    ],
    [t]
  );

  const deductibleOptions = useMemo(
    () => [
      { id: '0' as Deductible, label: t('kasko.deductible.none'), value: 0, coeff: 1.2 },
      { id: '50000' as Deductible, label: '50 000 ₸', value: 50000, coeff: 1.0 },
      { id: '200000' as Deductible, label: '200 000 ₸', value: 200000, coeff: 0.85 },
      { id: '500000' as Deductible, label: '500 000 ₸', value: 500000, coeff: 0.7 },
    ],
    [t]
  );

  const driverAgeCoefficient = (age: number): number => {
    if (age < 25) return 1.5;
    if (age < 30) return 1.2;
    if (age < 55) return 1.0;
    return 1.15;
  };

  const experienceCoefficient = (exp: number): number => {
    if (exp < 3) return 1.3;
    if (exp < 10) return 1.0;
    return 0.9;
  };

  const carAgeCoefficient = (age: number): { coeff: number; refused: boolean } => {
    if (age <= 3) return { coeff: 1.0, refused: false };
    if (age <= 7) return { coeff: 1.1, refused: false };
    if (age <= 12) return { coeff: 1.3, refused: false };
    return { coeff: 1.5, refused: true };
  };

  useEffect(() => {
    const value = parseFloat(carValue) || 0;
    const age = parseInt(driverAge) || 0;
    const exp = parseInt(drivingExperience) || 0;
    const vAge = parseInt(carAge) || 0;

    const selectedRegion = regionOptions.find((r) => r.id === region)!;
    const selectedCoverage = coverageOptions.find((c) => c.id === coverage)!;
    const selectedDeductible = deductibleOptions.find((d) => d.id === deductible)!;

    const driverCoeff = driverAgeCoefficient(age);
    const experienceCoeff = experienceCoefficient(exp);
    const { coeff: carAgeCoeff, refused } = carAgeCoefficient(vAge);

    const basePremium = value * BASE_RATE;
    const finalPremium =
      basePremium *
      driverCoeff *
      experienceCoeff *
      selectedRegion.coeff *
      carAgeCoeff *
      selectedCoverage.coeff *
      selectedDeductible.coeff;

    const monthlyPremium = finalPremium / 12;
    const percentOfValue = value > 0 ? (finalPremium / value) * 100 : 0;

    // Примерная ОГПО для сравнения — фиксированная базовая премия ~12 000 ₸
    const ogpoReference = 12000;

    setResults({
      basePremium: Math.round(basePremium),
      driverCoeff,
      experienceCoeff,
      regionCoeff: selectedRegion.coeff,
      carAgeCoeff,
      coverageCoeff: selectedCoverage.coeff,
      deductibleCoeff: selectedDeductible.coeff,
      finalPremium: Math.round(finalPremium),
      monthlyPremium: Math.round(monthlyPremium),
      percentOfValue: Number(percentOfValue.toFixed(2)),
      maxPayout: Math.round(value),
      ogpoReference,
      refused,
    });
  }, [
    carValue,
    driverAge,
    drivingExperience,
    region,
    carAge,
    coverage,
    deductible,
    regionOptions,
    coverageOptions,
    deductibleOptions,
  ]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const coeffBreakdown: CoeffEntry[] = [
    { label: t('kasko.breakdown.driverAge'), value: results.driverCoeff },
    { label: t('kasko.breakdown.experience'), value: results.experienceCoeff },
    { label: t('kasko.breakdown.region'), value: results.regionCoeff },
    { label: t('kasko.breakdown.carAge'), value: results.carAgeCoeff },
    { label: t('kasko.breakdown.coverage'), value: results.coverageCoeff },
    { label: t('kasko.breakdown.deductible'), value: results.deductibleCoeff },
  ];

  const recommendation = useMemo(() => {
    const vAge = parseInt(carAge) || 0;
    if (vAge <= 3) return t('kasko.recommendation.new');
    if (vAge <= 7) return t('kasko.recommendation.mid');
    if (vAge <= 12) return t('kasko.recommendation.old');
    return t('kasko.recommendation.veryOld');
  }, [carAge, t]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('kasko.title')}</h1>
            <p className="text-gray-600">{t('kasko.description')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">{t('kasko.warning')}</p>
        </div>
      </div>

      <QuickAnswer calculatorId="kasko" />
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2 text-blue-600" />
            {t('kasko.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Car value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-1" />
                {t('kasko.carValue')}
              </label>
              <RangeSlider
                value={parseFloat(carValue) || 0}
                onChange={(val) => setCarValue(String(val))}
                min={1000000}
                max={50000000}
                step={100000}
                formatValue={(v) => formatCurrency(v)}
                color="#0ea5e9"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={carValue}
                  onChange={(e) => setCarValue(e.target.value)}
                  placeholder={t('kasko.carValuePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Driver age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                {t('kasko.driverAge')}
              </label>
              <RangeSlider
                value={parseInt(driverAge) || 18}
                onChange={(val) => setDriverAge(String(val))}
                min={18}
                max={80}
                step={1}
                formatValue={(v) => `${v} ${t('kasko.years')}`}
                color="#0ea5e9"
              />
              <input
                type="number"
                value={driverAge}
                onChange={(e) => setDriverAge(e.target.value)}
                min="18"
                max="80"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Driving experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline mr-1" />
                {t('kasko.experience')}
              </label>
              <RangeSlider
                value={parseInt(drivingExperience) || 0}
                onChange={(val) => setDrivingExperience(String(val))}
                min={0}
                max={50}
                step={1}
                formatValue={(v) => `${v} ${t('kasko.years')}`}
                color="#0ea5e9"
              />
              <input
                type="number"
                value={drivingExperience}
                onChange={(e) => setDrivingExperience(e.target.value)}
                min="0"
                max="60"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="w-4 h-4 inline mr-1" />
                {t('kasko.region')}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {regionOptions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRegion(r.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left flex justify-between items-center ${
                      region === r.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className="text-xs">×{r.coeff}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Car age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="w-4 h-4 inline mr-1" />
                {t('kasko.carAge')}
              </label>
              <RangeSlider
                value={parseInt(carAge) || 0}
                onChange={(val) => setCarAge(String(val))}
                min={0}
                max={20}
                step={1}
                formatValue={(v) => `${v} ${t('kasko.years')}`}
                color="#0ea5e9"
              />
              <input
                type="number"
                value={carAge}
                onChange={(e) => setCarAge(e.target.value)}
                min="0"
                max="30"
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Coverage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Shield className="w-4 h-4 inline mr-1" />
                {t('kasko.coverageLabel')}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {coverageOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCoverage(c.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      coverage === c.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{c.label}</span>
                      <span className="text-xs">×{c.coeff}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{c.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Deductible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Percent className="w-4 h-4 inline mr-1" />
                {t('kasko.deductibleLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {deductibleOptions.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDeductible(d.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      deductible === d.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-xs text-gray-500">×{d.coeff}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('kasko.deductibleHint')}</p>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <TrendingUp className="w-5 h-5 inline mr-2 text-cyan-600" />
            {t('kasko.resultsTitle')}
          </h2>

          {results.refused && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              {t('kasko.refusedNote')}
            </div>
          )}

          <div className="space-y-4">
            {/* Main result */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">{t('kasko.annualPremium')}</div>
              <div className="text-3xl font-bold text-blue-700">
                {formatCurrency(results.finalPremium)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('kasko.approximateNote')}</div>
            </div>

            {/* Monthly */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('kasko.monthlyEquivalent')}</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(results.monthlyPremium)}
                </div>
              </div>
              <Calculator className="w-8 h-8 text-gray-400" />
            </div>

            {/* Percent of value */}
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-600">{t('kasko.percentOfValue')}</div>
                <div className="text-lg font-bold text-gray-900">{results.percentOfValue}%</div>
              </div>
              <Percent className="w-8 h-8 text-gray-400" />
            </div>

            {/* Max payout */}
            <div className="bg-cyan-50 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-cyan-700">{t('kasko.maxPayout')}</div>
                <div className="text-lg font-bold text-cyan-800">
                  {formatCurrency(results.maxPayout)}
                </div>
              </div>
              <Shield className="w-8 h-8 text-cyan-500" />
            </div>

            {/* OGPO comparison */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-700 mb-2">{t('kasko.ogpoComparison')}</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{t('kasko.ogpoApprox')}</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(results.ogpoReference)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-700">{t('kasko.kaskoValue')}</span>
                <span className="font-semibold text-purple-700">
                  {formatCurrency(results.finalPremium)}
                </span>
              </div>
              <div className="mt-2 text-xs text-purple-600 flex items-center">
                {results.finalPremium > results.ogpoReference ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {t('kasko.kaskoMoreExpensive', {
                      times: (results.finalPremium / results.ogpoReference).toFixed(1),
                    })}
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {t('kasko.kaskoCheaper')}
                  </>
                )}
              </div>
            </div>

            {/* Coefficient breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                {t('kasko.breakdown.title')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('kasko.breakdown.base')}</span>
                  <span className="text-gray-900">{formatCurrency(results.basePremium)}</span>
                </div>
                {coeffBreakdown.map((c, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">{c.label}</span>
                    <span
                      className={
                        c.value > 1
                          ? 'text-red-600 font-medium'
                          : c.value < 1
                          ? 'text-green-600 font-medium'
                          : 'text-gray-900'
                      }
                    >
                      ×{c.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <Info className="w-4 h-4 inline mr-1" />
              {recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('kasko.formulaTitle')}</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
          {t('kasko.formula')}
        </div>
        <p className="text-gray-600 text-sm mt-3">{t('kasko.formulaNote')}</p>
      </div>

      {/* Export */}
      {results.finalPremium > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('kasko.export.title'),
              subtitle: `${t('kasko.export.region')}: ${
                regionOptions.find((r) => r.id === region)?.label
              }`,
              sections: [
                {
                  title: t('kasko.export.parameters'),
                  data: [
                    { label: t('kasko.carValue'), value: formatCurrency(parseFloat(carValue) || 0) },
                    { label: t('kasko.driverAge'), value: driverAge },
                    { label: t('kasko.experience'), value: drivingExperience },
                    { label: t('kasko.carAge'), value: carAge },
                    {
                      label: t('kasko.coverageLabel'),
                      value: coverageOptions.find((c) => c.id === coverage)?.label || '',
                    },
                    {
                      label: t('kasko.deductibleLabel'),
                      value: deductibleOptions.find((d) => d.id === deductible)?.label || '',
                    },
                  ],
                },
                {
                  title: t('kasko.export.results'),
                  data: [
                    { label: t('kasko.annualPremium'), value: formatCurrency(results.finalPremium) },
                    { label: t('kasko.monthlyEquivalent'), value: formatCurrency(results.monthlyPremium) },
                    { label: t('kasko.percentOfValue'), value: `${results.percentOfValue}%` },
                    { label: t('kasko.maxPayout'), value: formatCurrency(results.maxPayout) },
                  ],
                },
              ],
              footer: t('kasko.export.footer'),
            }}
            filename="kasko-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="kasko" />
      <MethodologySection steps={getMethodology('kasko')} />
      <FAQSection
        items={[
          { question: t('kasko.faq.q1'), answer: t('kasko.faq.a1') },
          { question: t('kasko.faq.q2'), answer: t('kasko.faq.a2') },
          { question: t('kasko.faq.q3'), answer: t('kasko.faq.a3') },
          { question: t('kasko.faq.q4'), answer: t('kasko.faq.a4') },
          { question: t('kasko.faq.q5'), answer: t('kasko.faq.a5') },
        ]}
      
          sources={getSources('kasko')}
        />

      <LegalDisclaimer type="finance" />
      <ExpertBlock />

      <EmbedWidget calculatorId="kasko" calculatorTitle={t('kasko.title')} />
      <LastUpdated calculatorId="kasko" />
    </div>
  );
}
