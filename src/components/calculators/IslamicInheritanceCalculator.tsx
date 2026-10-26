import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Calculator, Users, Heart, AlertTriangle, Info, BookOpen, Star, Crown, Building, DollarSign, Target, Gavel, BarChart3 } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { RangeSlider } from '../ui/RangeSlider';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { NUMBER_LOCALE } from '../../utils/localeFormat';

// Доли считаются простыми дробями, чтобы аул и радд давали точные 3/8, 16/27 и т. п.
type Frac = [number, number];
const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const fr = (n: number, d: number): Frac => {
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
};
const fAdd = (a: Frac, b: Frac): Frac => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const fSub = (a: Frac, b: Frac): Frac => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const fMul = (a: Frac, b: Frac): Frac => fr(a[0] * b[0], a[1] * b[1]);
const fDiv = (a: Frac, b: Frac): Frac => fr(a[0] * b[1], a[1] * b[0]);
const fVal = (a: Frac) => a[0] / a[1];
const fText = (a: Frac) => (a[0] === a[1] ? '1' : `${a[0]}/${a[1]}`);

interface Heir {
  type: string;
  name: string;
  share: number;
  shareText: string;
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
  const { t, i18n } = useTranslation('calculators');

  const [totalInheritance, setTotalInheritance] = useState<string>('10000000');
  // По умолчанию — состав из пресета «классическая семья», чтобы страница сразу показывала раздел.
  const [hasSpouse, setHasSpouse] = useState<boolean>(true);
  const [spouseGender, setSpouseGender] = useState<'husband' | 'wife'>('wife');
  const [sons, setSons] = useState<string>('2');
  const [daughters, setDaughters] = useState<string>('1');
  const [hasFather, setHasFather] = useState<boolean>(true);
  const [hasMother, setHasMother] = useState<boolean>(true);
  const [brothers, setBrothers] = useState<string>('0');
  const [sisters, setSisters] = useState<string>('0');

  // Результаты считаются СИНХРОННО (useMemo ниже), а не через useState+useEffect:
  // иначе первый клиентский рендер отдаёт пустоту и гидратация падает (#418/#425).
  const EMPTY_RESULTS: InheritanceResult = {
    heirs: [],
    totalDistributed: 0,
    remainingAmount: 0,
    isValidDistribution: true,
    warnings: [],
    scenario: ''
  };

  // Ханафитский расчёт для круга наследников калькулятора: супруг(а), сыновья, дочери, отец,
  // мать, полнородные братья и сёстры. Порядок: фиксированные доли (фараид) → аул, если их сумма
  // больше 1 → остаток асабе (сыновья с дочерьми 2:1 → отец → братья с сёстрами 2:1 → сёстры
  // вместе с дочерьми) → радд, если асабы нет (супругу не возвращается).
  const calculateIslamicInheritance = (): InheritanceResult => {
    const inheritance = parseFloat(totalInheritance) || 0;
    const sonsCount = Math.max(0, parseInt(sons) || 0);
    const daughtersCount = Math.max(0, parseInt(daughters) || 0);
    const brothersCount = Math.max(0, parseInt(brothers) || 0);
    const sistersCount = Math.max(0, parseInt(sisters) || 0);

    if (inheritance <= 0) {
      return EMPTY_RESULTS;
    }

    const warnings: string[] = [];
    const hasChildren = sonsCount > 0 || daughtersCount > 0;
    const siblingsCount = brothersCount + sistersCount;
    const hasSiblings = siblingsCount > 0;
    const hasParents = hasFather || hasMother;
    // Полнородных братьев и сестёр исключают сын и отец.
    const siblingsBlocked = sonsCount > 0 || hasFather;
    const brothersInherit = brothersCount > 0 && !siblingsBlocked;
    const sistersInherit = sistersCount > 0 && !siblingsBlocked;

    let scenario = '';
    if (hasChildren) scenario = t('islamic-inheritance.scenarioWithChildren');
    else if (hasParents) scenario = t('islamic-inheritance.scenarioWithParents');
    else if (hasSiblings) scenario = t('islamic-inheritance.scenarioWithSiblings');
    else if (hasSpouse) scenario = t('islamic-inheritance.scenarioSpouseOnly');
    else scenario = t('islamic-inheritance.scenarioNoHeirs');

    interface Entry { type: string; name: string; share: Frac; residual: boolean; description: string }
    const fixed: Entry[] = [];

    // 1. Фиксированные доли
    let spouseShare: Frac = fr(0, 1);
    if (hasSpouse) {
      const isWife = spouseGender === 'wife';
      spouseShare = isWife ? (hasChildren ? fr(1, 8) : fr(1, 4)) : (hasChildren ? fr(1, 4) : fr(1, 2));
      fixed.push({
        type: spouseGender,
        name: isWife ? t('islamic-inheritance.wife') : t('islamic-inheritance.husband'),
        share: spouseShare,
        residual: false,
        description: t(`islamic-inheritance.${isWife ? 'wife' : 'husband'}Share${hasChildren ? 'WithChildren' : 'WithoutChildren'}`),
      });
    }

    if (hasFather && hasChildren) {
      fixed.push({
        type: 'father', name: t('islamic-inheritance.father'), share: fr(1, 6), residual: false,
        description: t(sonsCount > 0 ? 'islamic-inheritance.fatherShareWithChildren' : 'islamic-inheritance.fatherShareWithDaughters'),
      });
    }

    if (hasMother) {
      // Умарийя: супруг(а) + отец + мать без детей и без двух братьев/сестёр — мать получает 1/3 остатка.
      const umariyya = hasSpouse && hasFather && !hasChildren && siblingsCount < 2;
      let share: Frac;
      let description: string;
      if (hasChildren || siblingsCount >= 2) {
        share = fr(1, 6);
        description = t('islamic-inheritance.motherShareWithChildrenOrSiblings');
      } else if (umariyya) {
        share = fMul(fr(1, 3), fSub(fr(1, 1), spouseShare));
        description = t('islamic-inheritance.motherShareUmariyya');
      } else {
        share = fr(1, 3);
        description = t('islamic-inheritance.motherShareDefault');
      }
      fixed.push({ type: 'mother', name: t('islamic-inheritance.mother'), share, residual: false, description });
    }

    if (daughtersCount > 0 && sonsCount === 0) {
      fixed.push({
        type: 'daughters', name: `${t('islamic-inheritance.daughters')} (${daughtersCount})`,
        share: daughtersCount === 1 ? fr(1, 2) : fr(2, 3), residual: false,
        description: t(daughtersCount === 1 ? 'islamic-inheritance.daughterShareHalf' : 'islamic-inheritance.daughtersShareTwoThirds'),
      });
    }

    if (sistersInherit && brothersCount === 0 && daughtersCount === 0) {
      fixed.push({
        type: 'sisters', name: `${t('islamic-inheritance.sisters')} (${sistersCount})`,
        share: sistersCount === 1 ? fr(1, 2) : fr(2, 3), residual: false,
        description: t(sistersCount === 1 ? 'islamic-inheritance.sisterShareHalf' : 'islamic-inheritance.sistersShareTwoThirds'),
      });
    }

    // 2. Аул: сумма фиксированных долей больше наследства — все доли уменьшаются пропорционально
    const fixedSum = fixed.reduce<Frac>((acc, e) => fAdd(acc, e.share), fr(0, 1));
    let residue: Frac = fr(0, 1);
    if (fVal(fixedSum) > 1) {
      // Классическая запись аула — в общем знаменателе исходных долей: «с 6 до 8», «с 24 до 27».
      const base = fixed.reduce((l, e) => (l * e.share[1]) / gcd(l, e.share[1]), 1);
      const raised = fixed.reduce((sum, e) => sum + (e.share[0] * base) / e.share[1], 0);
      fixed.forEach((e) => { e.share = fDiv(e.share, fixedSum); });
      warnings.push(t('islamic-inheritance.warningAwl', { from: base, to: raised }));
    } else {
      residue = fSub(fr(1, 1), fixedSum);
    }

    // 3. Асаба — остаток по очереди
    const residualEntries: Entry[] = [];
    const splitResidue = (groups: { type: string; name: string; units: number; description: string }[]) => {
      const totalUnits = groups.reduce((sum, g) => sum + g.units, 0);
      groups.forEach((g) => residualEntries.push({
        type: g.type, name: g.name, share: fMul(residue, fr(g.units, totalUnits)), residual: true, description: g.description,
      }));
      residue = fr(0, 1);
    };
    if (fVal(residue) > 0) {
      if (sonsCount > 0) {
        splitResidue([
          { type: 'sons', name: `${t('islamic-inheritance.sons')} (${sonsCount})`, units: sonsCount * 2, description: t('islamic-inheritance.sonsDescription') },
          ...(daughtersCount > 0 ? [{ type: 'daughters', name: `${t('islamic-inheritance.daughters')} (${daughtersCount})`, units: daughtersCount, description: t('islamic-inheritance.daughtersWithSons') }] : []),
        ]);
      } else if (hasFather) {
        splitResidue([{ type: 'father', name: t('islamic-inheritance.father'), units: 1, description: t('islamic-inheritance.fatherShareAsAsaba') }]);
      } else if (brothersInherit) {
        splitResidue([
          { type: 'brothers', name: `${t('islamic-inheritance.brothers')} (${brothersCount})`, units: brothersCount * 2, description: t('islamic-inheritance.brothersDescription') },
          ...(sistersCount > 0 ? [{ type: 'sisters', name: `${t('islamic-inheritance.sisters')} (${sistersCount})`, units: sistersCount, description: t('islamic-inheritance.sistersWithBrothers') }] : []),
        ]);
      } else if (sistersInherit && daughtersCount > 0) {
        splitResidue([{ type: 'sisters', name: `${t('islamic-inheritance.sisters')} (${sistersCount})`, units: 1, description: t('islamic-inheritance.sistersWithDaughters') }]);
      }
    }

    // 4. Радд: асабы нет — остаток возвращается владельцам фиксированных долей, кроме супруга(и)
    if (fVal(residue) > 0) {
      const raddHeirs = fixed.filter((e) => e.type !== 'wife' && e.type !== 'husband');
      if (raddHeirs.length > 0) {
        const raddBase = raddHeirs.reduce<Frac>((acc, e) => fAdd(acc, e.share), fr(0, 1));
        const rest = residue;
        raddHeirs.forEach((e) => { e.share = fAdd(e.share, fMul(rest, fDiv(e.share, raddBase))); });
        residue = fr(0, 1);
        warnings.push(t('islamic-inheritance.warningRadd'));
      }
    }

    // Отец с дочерьми без сыновей: 1/6 + остаток — показываем одной строкой
    const heirs: Heir[] = [];
    [...fixed, ...residualEntries].forEach((e) => {
      const existing = heirs.find((h) => h.type === e.type);
      if (existing) return; // только отец: 1/6 + остаток, сводится ниже
      heirs.push({
        type: e.type, name: e.name, share: fVal(e.share), shareText: fText(e.share),
        shareType: e.residual ? 'residual' : 'fixed', amount: inheritance * fVal(e.share),
        percentage: fVal(e.share) * 100, description: e.description,
      });
    });
    // Точная дробь для отца 1/6 + остаток
    const fatherFixed = fixed.find((e) => e.type === 'father');
    const fatherResidual = residualEntries.find((e) => e.type === 'father');
    if (fatherFixed && fatherResidual) {
      const total = fAdd(fatherFixed.share, fatherResidual.share);
      const h = heirs.find((x) => x.type === 'father')!;
      h.share = fVal(total);
      h.shareText = fText(total);
      h.amount = inheritance * h.share;
      h.percentage = h.share * 100;
      h.description = t('islamic-inheritance.fatherShareWithDaughters');
    }

    if (hasSiblings && siblingsBlocked) {
      warnings.push(t('islamic-inheritance.warningSiblingsExcluded'));
    }

    const remaining = inheritance * fVal(residue);
    if (remaining > 0.5) {
      warnings.push(t(hasSpouse && fixed.length === 1 ? 'islamic-inheritance.warningSpouseOnly' : 'islamic-inheritance.warningUndistributed', { amount: formatNumber(Math.round(remaining)) }));
    }

    const totalDistributed = heirs.reduce((sum, h) => sum + h.amount, 0);
    return {
      heirs,
      totalDistributed: Math.round(totalDistributed),
      remainingAmount: Math.round(remaining),
      isValidDistribution: true,
      warnings,
      scenario,
    };
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  // (useMemo стоит после formatNumber — он используется внутри расчёта.)
  const results = useMemo(
    calculateIslamicInheritance,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalInheritance, hasSpouse, spouseGender, sons, daughters, hasFather, hasMother, brothers, sisters, i18n.language]
  );

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
                ariaLabel={t('islamic-inheritance.totalInheritanceLabel')}
                  value={parseFloat(totalInheritance) || 0}
                  onChange={(val) => setTotalInheritance(String(val))}
                  min={1000000}
                  max={500000000}
                  step={5000000}
                  formatValue={(v) => `${v.toLocaleString(NUMBER_LOCALE)} ₸`}
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
                          {heir.shareText} ({heir.percentage.toFixed(1).replace('.', ',')}%)
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
                <div>1 000 000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.wife')}:</div>
                <div>125 000 ₸ (1/8)</div>
                <div className="text-xs text-emerald-700">{t('islamic-inheritance.withChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.sons')}:</div>
                <div>700 000 ₸ (350 000 ₸ {t('islamic-inheritance.each')})</div>
                <div className="text-xs text-emerald-700">{t('islamic-inheritance.remainderParts', { parts: '4/5' })}</div>
              </div>
              <div>
                <div className="font-medium text-emerald-700">{t('islamic-inheritance.daughter')}:</div>
                <div className="text-lg font-bold text-emerald-600">175 000 ₸</div>
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
                <div>800 000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.husband')}:</div>
                <div>200 000 ₸ (1/4)</div>
                <div className="text-xs text-blue-700">{t('islamic-inheritance.withChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.mother')}:</div>
                <div>133 333 ₸ (1/6)</div>
                <div className="text-xs text-blue-700">{t('islamic-inheritance.withChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('islamic-inheritance.sons')}:</div>
                <div className="text-lg font-bold text-blue-600">466 667 ₸</div>
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
                <div>500 000 ₸</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('islamic-inheritance.wife')}:</div>
                <div>125 000 ₸ (1/4)</div>
                <div className="text-xs text-teal-700">{t('islamic-inheritance.withoutChildren')}</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('islamic-inheritance.remainder')}:</div>
                <div className="text-lg font-bold text-teal-600">375 000 ₸</div>
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
            title={i18n.language === 'kk' ? 'Мұраны үлестерге бөлу' : 'Распределение наследства по долям'}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.heirs && results.heirs.length > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('islamic-inheritance.title'),
              subtitle: t('islamic-inheritance.distributionTitle'),
              sections: [
                {
                  title: t('islamic-inheritance.distributionTitle'),
                  data: results.heirs.map(heir => ({
                    label: heir.name,
                    value: `${heir.amount.toLocaleString(NUMBER_LOCALE)} ₸ (${heir.percentage.toFixed(1)}%)`
                  }))
                }
              ],
              footer: 'Calk.kz'
            }}
            filename="islamic-inheritance-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <CalculatorExamples calculatorId="islamic-inheritance" />
      <MethodologySection calculatorId="islamic-inheritance" />
      <FAQSection
        items={[
          { question: t('islamic-inheritance.faq.q1'), answer: t('islamic-inheritance.faq.a1') },
          { question: t('islamic-inheritance.faq.q2'), answer: t('islamic-inheritance.faq.a2') },
          { question: t('islamic-inheritance.faq.q3'), answer: t('islamic-inheritance.faq.a3') },
          { question: t('islamic-inheritance.faq.q4'), answer: t('islamic-inheritance.faq.a4') },
          { question: t('islamic-inheritance.faq.q5'), answer: t('islamic-inheritance.faq.a5') }
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚМДБ — Мұсылмандар діни басқармасы' : 'ДУМК — Духовное управление мусульман', url: 'https://muftyat.kz/' },
          { title: i18n.language === 'kk' ? 'ҚР Азаматтық кодексі (Ерекше бөлім), 6-бөлім — мұрагерлік құқық' : 'ГК РК (Особенная часть), раздел 6 — наследственное право', url: 'https://adilet.zan.kz/rus/docs/K990000409_' },
        ]}
      />

      {/* Виджет для встраивания */}
      <LegalDisclaimer type="religious" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="islamic-inheritance"
        calculatorTitle={t('islamic-inheritance.title')}
      />
      <LastUpdated calculatorId="islamic-inheritance" />
    </div>
  );
}
