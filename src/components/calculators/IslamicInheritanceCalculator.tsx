import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Calculator, Users, Heart, AlertTriangle, Info, BookOpen, Star, Crown, Building, DollarSign, Target, Gavel, BarChart3 } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';

interface Heir {
  type: string;
  name: string;
  share: number;
  shareType: 'fixed' | 'residual';
  amount: number;
  percentage: number;
  description: string;
}

interface InheritanceResult {
  heirs: Heir[];
  totalDistributed: number;
  remainingAmount: number;
  isValidDistribution: boolean;
  warnings: string[];
  scenario: string;
}

export default function IslamicInheritanceCalculator() {
  const { t } = useTranslation('calculators');

  const [totalInheritance, setTotalInheritance] = useState<string>('10000000');
  const [hasSpouse, setHasSpouse] = useState<boolean>(false);
  const [spouseGender, setSpouseGender] = useState<'husband' | 'wife'>('wife');
  const [sons, setSons] = useState<string>('0');
  const [daughters, setDaughters] = useState<string>('0');
  const [hasFather, setHasFather] = useState<boolean>(false);
  const [hasMother, setHasMother] = useState<boolean>(false);
  const [brothers, setBrothers] = useState<string>('0');
  const [sisters, setSisters] = useState<string>('0');
  const [hasPatGrandfather, setHasPatGrandfather] = useState<boolean>(false);

  const [results, setResults] = useState<InheritanceResult>({
    heirs: [],
    totalDistributed: 0,
    remainingAmount: 0,
    isValidDistribution: true,
    warnings: [],
    scenario: ''
  });

  const calculateIslamicInheritance = () => {
    const inheritance = parseFloat(totalInheritance) || 0;
    const sonsCount = parseInt(sons) || 0;
    const daughtersCount = parseInt(daughters) || 0;
    const brothersCount = parseInt(brothers) || 0;
    const sistersCount = parseInt(sisters) || 0;

    if (inheritance <= 0) {
      setResults({
        heirs: [], totalDistributed: 0, remainingAmount: 0,
        isValidDistribution: true, warnings: [], scenario: ''
      });
      return;
    }

    const heirs: Heir[] = [];
    const warnings: string[] = [];
    let remainingForResidual = inheritance;
    let scenario = '';

    const hasChildren = sonsCount > 0 || daughtersCount > 0;
    const hasSiblings = brothersCount > 0 || sistersCount > 0;
    const hasParents = hasFather || hasMother;

    if (hasChildren) {
      scenario = t('islamic-inheritance.scenarioWithChildren');
    } else if (hasParents) {
      scenario = t('islamic-inheritance.scenarioWithParents');
    } else if (hasSiblings) {
      scenario = t('islamic-inheritance.scenarioWithSiblings');
    } else {
      scenario = t('islamic-inheritance.scenarioSpouseOnly');
    }

    // 1. ФИКСИРОВАННЫЕ ДОЛИ (FARA'ID)

    // Супруг/супруга
    if (hasSpouse) {
      let spouseShare = 0;
      let spouseShareType: 'fixed' | 'residual' = 'fixed';
      let spouseDescription = '';

      if (spouseGender === 'wife') {
        if (hasChildren) {
          spouseShare = 1/8;
          spouseDescription = t('islamic-inheritance.wifeShareWithChildren');
        } else {
          spouseShare = 1/4;
          spouseDescription = t('islamic-inheritance.wifeShareWithoutChildren');
        }
      } else {
        if (hasChildren) {
          spouseShare = 1/4;
          spouseDescription = t('islamic-inheritance.husbandShareWithChildren');
        } else {
          spouseShare = 1/2;
          spouseDescription = t('islamic-inheritance.husbandShareWithoutChildren');
        }
      }

      const spouseAmount = inheritance * spouseShare;
      remainingForResidual -= spouseAmount;

      heirs.push({
        type: spouseGender,
        name: spouseGender === 'wife' ? t('islamic-inheritance.wife') : t('islamic-inheritance.husband'),
        share: spouseShare,
        shareType: spouseShareType,
        amount: spouseAmount,
        percentage: spouseShare * 100,
        description: spouseDescription
      });
    }

    // Отец
    if (hasFather) {
      let fatherShare = 0;
      let fatherDescription = '';

      if (hasChildren) {
        fatherShare = 1/6;
        fatherDescription = t('islamic-inheritance.fatherShareWithChildren');
      } else {
        fatherShare = 1/6;
        fatherDescription = t('islamic-inheritance.fatherShareAsAsaba');
      }

      const fatherAmount = inheritance * fatherShare;
      remainingForResidual -= fatherAmount;

      heirs.push({
        type: 'father',
        name: t('islamic-inheritance.father'),
        share: fatherShare,
        shareType: 'fixed',
        amount: fatherAmount,
        percentage: fatherShare * 100,
        description: fatherDescription
      });
    }

    // Мать
    if (hasMother) {
      let motherShare = 0;
      let motherDescription = '';

      if (hasChildren || (brothersCount + sistersCount >= 2)) {
        motherShare = 1/6;
        motherDescription = t('islamic-inheritance.motherShareWithChildrenOrSiblings');
      } else {
        motherShare = 1/3;
        motherDescription = t('islamic-inheritance.motherShareDefault');
      }

      const motherAmount = inheritance * motherShare;
      remainingForResidual -= motherAmount;

      heirs.push({
        type: 'mother',
        name: t('islamic-inheritance.mother'),
        share: motherShare,
        shareType: 'fixed',
        amount: motherAmount,
        percentage: motherShare * 100,
        description: motherDescription
      });
    }

    // 2. ОСТАТОЧНЫЕ ДОЛИ (ASABA)

    // Дети (если есть)
    if (hasChildren) {
      const totalChildrenUnits = sonsCount * 2 + daughtersCount;

      if (totalChildrenUnits > 0) {
        const childrenShare = remainingForResidual / totalChildrenUnits;

        // Сыновья
        if (sonsCount > 0) {
          const sonAmount = childrenShare * 2;
          const totalSonsAmount = sonAmount * sonsCount;

          heirs.push({
            type: 'sons',
            name: `${t('islamic-inheritance.sons')} (${sonsCount})`,
            share: totalSonsAmount / inheritance,
            shareType: 'residual',
            amount: totalSonsAmount,
            percentage: (totalSonsAmount / inheritance) * 100,
            description: t('islamic-inheritance.sonsDescription')
          });
        }

        // Дочери
        if (daughtersCount > 0) {
          const daughterAmount = childrenShare;
          const totalDaughtersAmount = daughterAmount * daughtersCount;

          heirs.push({
            type: 'daughters',
            name: `${t('islamic-inheritance.daughters')} (${daughtersCount})`,
            share: totalDaughtersAmount / inheritance,
            shareType: 'residual',
            amount: totalDaughtersAmount,
            percentage: (totalDaughtersAmount / inheritance) * 100,
            description: t('islamic-inheritance.daughtersDescription')
          });
        }

        remainingForResidual = 0;
      }
    }
    // Братья/сестры (если нет детей и отца)
    else if (!hasFather && hasSiblings) {
      const totalSiblingsUnits = brothersCount * 2 + sistersCount;

      if (totalSiblingsUnits > 0 && remainingForResidual > 0) {
        const siblingShare = remainingForResidual / totalSiblingsUnits;

        // Братья
        if (brothersCount > 0) {
          const brotherAmount = siblingShare * 2;
          const totalBrothersAmount = brotherAmount * brothersCount;

          heirs.push({
            type: 'brothers',
            name: `${t('islamic-inheritance.brothers')} (${brothersCount})`,
            share: totalBrothersAmount / inheritance,
            shareType: 'residual',
            amount: totalBrothersAmount,
            percentage: (totalBrothersAmount / inheritance) * 100,
            description: t('islamic-inheritance.brothersDescription')
          });
        }

        // Сестры
        if (sistersCount > 0) {
          const sisterAmount = siblingShare;
          const totalSistersAmount = sisterAmount * sistersCount;

          heirs.push({
            type: 'sisters',
            name: `${t('islamic-inheritance.sisters')} (${sistersCount})`,
            share: totalSistersAmount / inheritance,
            shareType: 'residual',
            amount: totalSistersAmount,
            percentage: (totalSistersAmount / inheritance) * 100,
            description: t('islamic-inheritance.sistersDescription')
          });
        }

        remainingForResidual = 0;
      }
    }
    // Отец как 'асаба (если нет детей)
    else if (hasFather && !hasChildren) {
      if (remainingForResidual > 0) {
        const additionalFatherAmount = remainingForResidual;

        const fatherIndex = heirs.findIndex(h => h.type === 'father');
        if (fatherIndex !== -1) {
          heirs[fatherIndex].amount += additionalFatherAmount;
          heirs[fatherIndex].share = heirs[fatherIndex].amount / inheritance;
          heirs[fatherIndex].percentage = heirs[fatherIndex].share * 100;
          heirs[fatherIndex].description = t('islamic-inheritance.fatherShareAsAsaba');
        }

        remainingForResidual = 0;
      }
    }

    // 3. ПРОВЕРКИ И ПРЕДУПРЕЖДЕНИЯ

    const totalDistributed = heirs.reduce((sum, heir) => sum + heir.amount, 0);
    const isValidDistribution = totalDistributed <= inheritance * 1.01;

    if (!isValidDistribution) {
      warnings.push(t('islamic-inheritance.warningExceedsTotal'));
    }

    if (remainingForResidual > inheritance * 0.01) {
      warnings.push(t('islamic-inheritance.warningUndistributed', { amount: formatNumber(remainingForResidual) }));
    }

    if (!hasChildren && !hasParents && !hasSiblings && hasSpouse) {
      warnings.push(t('islamic-inheritance.warningSpouseOnly'));
    }

    if (hasChildren && sonsCount === 0 && daughtersCount > 0) {
      warnings.push(t('islamic-inheritance.warningDaughtersOnly'));
    }

    setResults({
      heirs,
      totalDistributed: Math.round(totalDistributed),
      remainingAmount: Math.round(remainingForResidual),
      isValidDistribution,
      warnings,
      scenario
    });
  };

  useEffect(() => {
    calculateIslamicInheritance();
  }, [totalInheritance, hasSpouse, spouseGender, sons, daughters, hasFather, hasMother, brothers, sisters, hasPatGrandfather]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const formatFraction = (decimal: number) => {
    const fractions = [
      { decimal: 1/2, text: '1/2' },
      { decimal: 1/3, text: '1/3' },
      { decimal: 1/4, text: '1/4' },
      { decimal: 1/6, text: '1/6' },
      { decimal: 1/8, text: '1/8' },
      { decimal: 2/3, text: '2/3' },
      { decimal: 3/4, text: '3/4' },
      { decimal: 5/6, text: '5/6' }
    ];

    const closestFraction = fractions.find(f => Math.abs(f.decimal - decimal) < 0.001);
    return closestFraction ? closestFraction.text : (decimal * 100).toFixed(1) + '%';
  };

  const familyCompositions = [
    {
      name: t('islamic-inheritance.familyPresetClassic'),
      setup: () => {
        setHasSpouse(true);
        setSpouseGender('wife');
        setSons('2');
        setDaughters('1');
        setHasFather(true);
        setHasMother(true);
        setBrothers('0');
        setSisters('0');
      }
    },
    {
      name: t('islamic-inheritance.familyPresetWifeAndDaughters'),
      setup: () => {
        setHasSpouse(true);
        setSpouseGender('wife');
        setSons('0');
        setDaughters('3');
        setHasFather(false);
        setHasMother(false);
        setBrothers('0');
        setSisters('0');
      }
    },
    {
      name: t('islamic-inheritance.familyPresetHusbandNoChildren'),
      setup: () => {
        setHasSpouse(true);
        setSpouseGender('husband');
        setSons('0');
        setDaughters('0');
        setHasFather(false);
        setHasMother(true);
        setBrothers('1');
        setSisters('1');
      }
    },
    {
      name: t('islamic-inheritance.familyPresetClearAll'),
      setup: () => {
        setHasSpouse(false);
        setSons('0');
        setDaughters('0');
        setHasFather(false);
        setHasMother(false);
        setBrothers('0');
        setSisters('0');
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <QuickAnswer calculatorId="islamic-inheritance" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('islamic-inheritance.title')}</h1>
            <p className="text-gray-600">{t('islamic-inheritance.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Critical Warning */}
      <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {t('islamic-inheritance.criticalWarningTitle')}
            </h3>
            <div className="text-red-800 space-y-2">
              <p>{t('islamic-inheritance.criticalWarningText1')}</p>
              <p>{t('islamic-inheritance.criticalWarningText2')}</p>
              <p>{t('islamic-inheritance.criticalWarningText3')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Inheritance Amount */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.totalInheritanceTitle')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('islamic-inheritance.totalInheritanceLabel')}
                </label>
                <RangeSlider
                  value={parseFloat(totalInheritance) || 0}
                  onChange={(val) => setTotalInheritance(String(val))}
                  min={1000000}
                  max={500000000}
                  step={5000000}
                  formatValue={(v) => `${v.toLocaleString()} ₸`}
                  color="#10b981"
                />
                <div className="relative mt-3">
                  <input
                    type="number"
                    id="totalInheritance"
                    value={totalInheritance}
                    onChange={(e) => setTotalInheritance(e.target.value)}
                    placeholder={t('islamic-inheritance.totalInheritancePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">₸</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('islamic-inheritance.totalInheritanceHint')}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">{t('islamic-inheritance.quickFamilySetup')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {familyCompositions.map((composition) => (
                    <button
                      key={composition.name}
                      onClick={composition.setup}
                      className="p-2 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      {composition.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Family Composition */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.familyCompositionTitle')}</h2>

            <div className="space-y-6">
              {/* Spouse */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="hasSpouse"
                    checked={hasSpouse}
                    onChange={(e) => setHasSpouse(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasSpouse" className="ml-2 block text-sm text-gray-700">
                    {t('islamic-inheritance.hasSpouse')}
                  </label>
                </div>

                {hasSpouse && (
                  <div className="ml-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSpouseGender('wife')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        spouseGender === 'wife'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Heart className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-sm font-medium">{t('islamic-inheritance.wife')}</div>
                    </button>
                    <button
                      onClick={() => setSpouseGender('husband')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        spouseGender === 'husband'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Users className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-sm font-medium">{t('islamic-inheritance.husband')}</div>
                    </button>
                  </div>
                )}
              </div>

              {/* Children */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('islamic-inheritance.childrenTitle')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sons" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('islamic-inheritance.sonsCount')}
                    </label>
                    <input
                      type="number"
                      id="sons"
                      value={sons}
                      onChange={(e) => setSons(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="daughters" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('islamic-inheritance.daughtersCount')}
                    </label>
                    <input
                      type="number"
                      id="daughters"
                      value={daughters}
                      onChange={(e) => setDaughters(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('islamic-inheritance.childrenHint')}
                </p>
              </div>

              {/* Parents */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('islamic-inheritance.parentsTitle')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasFather"
                      checked={hasFather}
                      onChange={(e) => setHasFather(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasFather" className="ml-2 block text-sm text-gray-700">
                      {t('islamic-inheritance.fatherAlive')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasMother"
                      checked={hasMother}
                      onChange={(e) => setHasMother(e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasMother" className="ml-2 block text-sm text-gray-700">
                      {t('islamic-inheritance.motherAlive')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Siblings */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t('islamic-inheritance.siblingsTitle')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="brothers" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('islamic-inheritance.brothersCount')}
                    </label>
                    <input
                      type="number"
                      id="brothers"
                      value={brothers}
                      onChange={(e) => setBrothers(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="sisters" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('islamic-inheritance.sistersCount')}
                    </label>
                    <input
                      type="number"
                      id="sisters"
                      value={sisters}
                      onChange={(e) => setSisters(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t('islamic-inheritance.siblingsHint')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Scenario Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('islamic-inheritance.scenarioTitle')}</h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{results.scenario}</h3>
              <div className="text-sm text-blue-800">
                {t('islamic-inheritance.totalAmount')}: {formatNumber(parseFloat(totalInheritance) || 0)}
              </div>
            </div>
          </div>

          {/* Distribution Results */}
          {results.heirs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.distributionTitle')}</h2>

              <div className="space-y-4">
                {results.heirs.map((heir, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{heir.name}</h3>
                        <p className="text-xs text-gray-600">{heir.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">{formatNumber(heir.amount)}</div>
                        <div className="text-sm text-gray-600">
                          {formatFraction(heir.share)} ({heir.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(heir.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <div className="text-sm text-emerald-700">{t('islamic-inheritance.totalDistributed')}</div>
                    <div className="text-lg font-bold text-emerald-800">{formatNumber(results.totalDistributed)}</div>
                  </div>
                  {results.remainingAmount > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-sm text-amber-700">{t('islamic-inheritance.remaining')}</div>
                      <div className="text-lg font-bold text-amber-800">{formatNumber(results.remainingAmount)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {results.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-4">{t('islamic-inheritance.specialCasesTitle')}</h3>
              <div className="space-y-2">
                {results.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-800">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Islamic Inheritance Principles */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.principlesTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>{t('islamic-inheritance.fixedSharesTitle')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.wife')}:</strong> {t('islamic-inheritance.wifeShares')}
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.husband')}:</strong> {t('islamic-inheritance.husbandShares')}
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.father')}:</strong> {t('islamic-inheritance.fatherShares')}
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.mother')}:</strong> {t('islamic-inheritance.motherShares')}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{t('islamic-inheritance.residualSharesTitle')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.sons')}:</strong> {t('islamic-inheritance.sonsShares')}
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.daughters')}:</strong> {t('islamic-inheritance.daughtersShares')}
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.brothers')}:</strong> {t('islamic-inheritance.brothersShares')}
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>{t('islamic-inheritance.sisters')}:</strong> {t('islamic-inheritance.sistersShares')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Examples */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.examplesTitle')}</h2>

        <div className="space-y-6">
          {/* Example 1 */}
          <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
            <h3 className="font-semibold text-emerald-900 mb-3">{t('islamic-inheritance.example1Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.inheritance')}:</div>
                <div>1,000,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.wife')}:</div>
                <div>125,000 ₸ (1/8)</div>
                <div className="text-xs text-emerald-700">{t('islamic-inheritance.withChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.sons')}:</div>
                <div>700,000 ₸ (350,000 ₸ {t('islamic-inheritance.each')})</div>
                <div className="text-xs text-emerald-700">{t('islamic-inheritance.remainderParts', { parts: '4/5' })}</div>
              </div>
              <div>
                <div className="font-medium text-emerald-700">{t('islamic-inheritance.daughter')}:</div>
                <div className="text-lg font-bold text-emerald-600">175,000 ₸</div>
                <div className="text-xs text-emerald-700">{t('islamic-inheritance.remainderParts', { parts: '1/5' })}</div>
              </div>
            </div>
          </div>

          {/* Example 2 */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('islamic-inheritance.example2Title')}</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.inheritance')}:</div>
                <div>800,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.husband')}:</div>
                <div>200,000 ₸ (1/4)</div>
                <div className="text-xs text-blue-700">{t('islamic-inheritance.withChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.mother')}:</div>
                <div>133,333 ₸ (1/6)</div>
                <div className="text-xs text-blue-700">{t('islamic-inheritance.withChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('islamic-inheritance.sons')}:</div>
                <div className="text-lg font-bold text-blue-600">466,667 ₸</div>
                <div className="text-xs text-blue-700">{t('islamic-inheritance.remainderEqually')}</div>
              </div>
            </div>
          </div>

          {/* Example 3 */}
          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-3">{t('islamic-inheritance.example3Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.inheritance')}:</div>
                <div>500,000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.wife')}:</div>
                <div>125,000 ₸ (1/4)</div>
                <div className="text-xs text-teal-700">{t('islamic-inheritance.withoutChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('islamic-inheritance.remainder')}:</div>
                <div className="text-lg font-bold text-teal-600">375,000 ₸</div>
                <div className="text-xs text-teal-700">{t('islamic-inheritance.toNearestAsaba')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Framework */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Gavel className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('islamic-inheritance.legalFrameworkTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.secularLawTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('islamic-inheritance.secularLaw1')}</li>
                  <li>{t('islamic-inheritance.secularLaw2')}</li>
                  <li>{t('islamic-inheritance.secularLaw3')}</li>
                  <li>{t('islamic-inheritance.secularLaw4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.islamicLawTitle')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('islamic-inheritance.islamicLaw1')}</li>
                  <li>{t('islamic-inheritance.islamicLaw2')}</li>
                  <li>{t('islamic-inheritance.islamicLaw3')}</li>
                  <li>{t('islamic-inheritance.islamicLaw4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('islamic-inheritance.legalPlanningTitle')}
              </h3>
              <p className="text-amber-800 text-sm">
                {t('islamic-inheritance.legalPlanningText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scholarly Opinions */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.sourcesTitle')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.quranTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('islamic-inheritance.quranText')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.sunnahTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('islamic-inheritance.sunnahText')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.ijmaTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('islamic-inheritance.ijmaText')}
            </p>
          </div>
        </div>
      </div>

      {/* Complex Cases */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.complexCasesTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('islamic-inheritance.specialRulesTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.alAwlTitle')}:</strong> {t('islamic-inheritance.alAwlText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.arRaddTitle')}:</strong> {t('islamic-inheritance.arRaddText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.alMusharakaTitle')}:</strong> {t('islamic-inheritance.alMusharakaText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.hijbTitle')}:</strong> {t('islamic-inheritance.hijbText')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('islamic-inheritance.obstaclesTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.murderTitle')}:</strong> {t('islamic-inheritance.murderText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.religionTitle')}:</strong> {t('islamic-inheritance.religionText')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <span><strong>{t('islamic-inheritance.slaveryTitle')}:</strong> {t('islamic-inheritance.slaveryText')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900 mb-1">
                {t('islamic-inheritance.limitationsTitle')}
              </h3>
              <div className="text-red-800 text-sm space-y-1">
                <p>{t('islamic-inheritance.limitation1')}</p>
                <p>{t('islamic-inheritance.limitation2')}</p>
                <p>{t('islamic-inheritance.limitation3')}</p>
                <p>{t('islamic-inheritance.limitation4')}</p>
                <p><strong>{t('islamic-inheritance.limitation5')}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Applications */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.practicalApplicationTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('islamic-inheritance.forPlanningTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.planning1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.planning2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.planning3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.planning4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('islamic-inheritance.legalAspectsTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.legalAspect1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.legalAspect2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.legalAspect3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('islamic-inheritance.legalAspect4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Value */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.wisdomTitle')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-emerald-50 rounded-lg">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.justiceTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('islamic-inheritance.justiceText')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.familyCareTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('islamic-inheritance.familyCareText')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('islamic-inheritance.socialStabilityTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('islamic-inheritance.socialStabilityText')}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Star className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('islamic-inheritance.uniquenessTitle')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('islamic-inheritance.uniquenessText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Where to Get Help */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.whereToGetHelpTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('islamic-inheritance.religiousConsultationTitle')}</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div>{t('islamic-inheritance.religiousConsultation1')}</div>
              <div>{t('islamic-inheritance.religiousConsultation2')}</div>
              <div>{t('islamic-inheritance.religiousConsultation3')}</div>
              <div>{t('islamic-inheritance.religiousConsultation4')}</div>
              <div>{t('islamic-inheritance.religiousConsultation5')}</div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('islamic-inheritance.legalHelpTitle')}</h3>
            <div className="space-y-1 text-sm text-green-800">
              <div>{t('islamic-inheritance.legalHelp1')}</div>
              <div>{t('islamic-inheritance.legalHelp2')}</div>
              <div>{t('islamic-inheritance.legalHelp3')}</div>
              <div>{t('islamic-inheritance.legalHelp4')}</div>
              <div>{t('islamic-inheritance.legalHelp5')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Building className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-teal-900 mb-1">
                {t('islamic-inheritance.adviceForMuslimsTitle')}
              </h3>
              <p className="text-teal-800 text-sm">
                {t('islamic-inheritance.adviceForMuslimsText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mathematical Beauty */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('islamic-inheritance.mathematicalBeautyTitle')}</h2>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Calculator className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-3">
                {t('islamic-inheritance.faraidScienceTitle')}
              </h3>
              <div className="text-emerald-800 space-y-2 text-sm">
                <p>{t('islamic-inheritance.faraidScienceText1')}</p>
                <p><strong>{t('islamic-inheritance.historicalSignificanceTitle')}:</strong> {t('islamic-inheritance.historicalSignificanceText')}</p>
                <p><strong>{t('islamic-inheritance.modernRelevanceTitle')}:</strong> {t('islamic-inheritance.modernRelevanceText')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              {t('islamic-inheritance.disclaimerTitle')}
            </h3>
            <div className="text-red-800 space-y-2">
              <p>{t('islamic-inheritance.disclaimerText1')}</p>
              <p>{t('islamic-inheritance.disclaimerText2')}</p>
              <p>{t('islamic-inheritance.disclaimerText3')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма распределения */}
      {results && results.heirs && results.heirs.length > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={results.heirs.map((heir: {name: string, amount: number}) => ({
              name: heir.name,
              value: heir.amount
            }))}
            title="Распределение наследства по долям"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.heirs && results.heirs.length > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт исламского наследования',
              subtitle: 'Распределение наследства',
              sections: [
                {
                  title: 'Наследство',
                  data: results.heirs.map(heir => ({
                    label: heir.name,
                    value: `${heir.amount.toLocaleString()} ₸ (${heir.percentage.toFixed(1)}%)`
                  }))
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="islamic-inheritance-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="islamic-inheritance" />
      <MethodologySection steps={getMethodology('islamic-inheritance')} />
      <FAQSection
        items={[
          { question: t('islamic-inheritance.faq.q1'), answer: t('islamic-inheritance.faq.a1') },
          { question: t('islamic-inheritance.faq.q2'), answer: t('islamic-inheritance.faq.a2') },
          { question: t('islamic-inheritance.faq.q3'), answer: t('islamic-inheritance.faq.a3') },
          { question: t('islamic-inheritance.faq.q4'), answer: t('islamic-inheritance.faq.a4') },
          { question: t('islamic-inheritance.faq.q5'), answer: t('islamic-inheritance.faq.a5') }
        ]}
        sources={[
          { title: 'ДУМК — Духовное управление мусульман', url: 'https://muftyat.kz/' },
          { title: 'IslamQ&A — Наследство', url: 'https://islamqa.info/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="religious" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="islamic-inheritance"
        calculatorTitle="Исламский калькулятор наследства"
      />
      <LastUpdated calculatorId="islamic-inheritance" />
    </div>
  );
}
