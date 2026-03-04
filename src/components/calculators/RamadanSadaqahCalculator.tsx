import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Calculator, Users, Calendar, Heart, Star, Info, AlertTriangle, Gift, Clock, Book, Target, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';

export default function RamadanSadaqahCalculator() {
  const { t } = useTranslation('calculators');
  const [calculationType, setCalculationType] = useState<'fitr' | 'fidya' | 'both'>('fitr');
  const [familyMembers, setFamilyMembers] = useState<string>('1');
  const [missedFastingDays, setMissedFastingDays] = useState<string>('');
  const [alternativeCalculation, setAlternativeCalculation] = useState<'flour' | 'dates' | 'raisins'>('flour');

  const [results, setResults] = useState({
    // Фитр-садака
    fitrSadaqahAmount: 0,
    fitrPerPerson: 0,
    fitrBasedOn: '',

    // Фидия-садака
    fidyaSadaqahAmount: 0,
    fidyaPerDay: 0,

    // Общие
    totalSadaqahAmount: 0,
    alternativeFitrAmount: 0,
    recommendedMinimum: 0,

    // Информация
    ramadanInfo: {
      currentYear: 2026,
      estimatedRamadanStart: 'середина февраля 2026',
      ramadanDays: 30
    }
  });

  // Константы на 2026 год
  const CURRENT_YEAR = 2026;
  const DUMK_FITR_RATE_2026 = 655; // 655 тенге - ставка ДУМК на 2026 год
  const DUMK_FIDYA_RATE_2026 = 3000; // 3000 тенге в день

  // Альтернативные расчеты фитр-садака для состоятельных людей
  const alternativeRates = {
    flour: {
      rate: DUMK_FITR_RATE_2026,
      name: t('ramadan-sadaqah.flour'),
      description: t('ramadan-sadaqah.flourDescription'),
      category: t('ramadan-sadaqah.minimumLevel')
    },
    dates: {
      rate: 2200,
      name: t('ramadan-sadaqah.dates'),
      description: t('ramadan-sadaqah.datesDescription'),
      category: t('ramadan-sadaqah.mediumLevel')
    },
    raisins: {
      rate: 1800,
      name: t('ramadan-sadaqah.raisins'),
      description: t('ramadan-sadaqah.raisinsDescription'),
      category: t('ramadan-sadaqah.alternativeCalculation')
    }
  };

  const calculateSadaqah = () => {
    const members = parseInt(familyMembers) || 1;
    const missedDays = parseInt(missedFastingDays) || 0;

    // Фитр-садака
    const fitrPerPerson = DUMK_FITR_RATE_2026;
    const fitrSadaqahAmount = members * fitrPerPerson;

    // Альтернативный расчет фитр-садака
    const alternativeRate = alternativeRates[alternativeCalculation];
    const alternativeFitrAmount = members * alternativeRate.rate;

    // Фидия-садака
    const fidyaPerDay = DUMK_FIDYA_RATE_2026;
    const fidyaSadaqahAmount = missedDays * fidyaPerDay;

    // Общая сумма
    let totalSadaqahAmount = 0;
    if (calculationType === 'fitr') {
      totalSadaqahAmount = fitrSadaqahAmount;
    } else if (calculationType === 'fidya') {
      totalSadaqahAmount = fidyaSadaqahAmount;
    } else {
      totalSadaqahAmount = fitrSadaqahAmount + fidyaSadaqahAmount;
    }

    // Рекомендуемый минимум
    const recommendedMinimum = Math.max(fitrSadaqahAmount, alternativeFitrAmount);

    setResults({
      fitrSadaqahAmount,
      fitrPerPerson,
      fitrBasedOn: alternativeRate.name,
      fidyaSadaqahAmount,
      fidyaPerDay,
      totalSadaqahAmount,
      alternativeFitrAmount,
      recommendedMinimum,
      ramadanInfo: {
        currentYear: CURRENT_YEAR,
        estimatedRamadanStart: t('ramadan-sadaqah.estimatedRamadanStart'),
        ramadanDays: 30
      }
    });
  };

  useEffect(() => {
    calculateSadaqah();
  }, [calculationType, familyMembers, missedFastingDays, alternativeCalculation]);

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-KZ') + ' ₸';
  };

  const calculationTypes = [
    {
      id: 'fitr',
      name: t('ramadan-sadaqah.fitrSadaqah'),
      description: t('ramadan-sadaqah.fitrSadaqahDescription'),
      timing: t('ramadan-sadaqah.beforePrayerTiming'),
      icon: Star
    },
    {
      id: 'fidya',
      name: t('ramadan-sadaqah.fidyaSadaqah'),
      description: t('ramadan-sadaqah.fidyaSadaqahDescription'),
      timing: t('ramadan-sadaqah.anytimeTiming'),
      icon: Calendar
    },
    {
      id: 'both',
      name: t('ramadan-sadaqah.bothTypes'),
      description: t('ramadan-sadaqah.bothTypesDescription'),
      timing: t('ramadan-sadaqah.fullCalculationTiming'),
      icon: Gift
    }
  ];

  const ramadanGuidance = [
    {
      title: t('ramadan-sadaqah.whoMustPay'),
      content: t('ramadan-sadaqah.whoMustPayContent')
    },
    {
      title: t('ramadan-sadaqah.whenToPay'),
      content: t('ramadan-sadaqah.whenToPayContent')
    },
    {
      title: t('ramadan-sadaqah.whoCanReceive'),
      content: t('ramadan-sadaqah.whoCanReceiveContent')
    },
    {
      title: t('ramadan-sadaqah.canPayMoney'),
      content: t('ramadan-sadaqah.canPayMoneyContent')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Moon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('ramadan-sadaqah.title')}</h1>
            <p className="text-gray-600">{t('ramadan-sadaqah.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Ramadan Context */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Moon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('ramadan-sadaqah.ramadanYear', { year: results.ramadanInfo.currentYear })}
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                <strong>{t('ramadan-sadaqah.fitrSadaqah')}</strong> {t('ramadan-sadaqah.fitrSadaqahExplanation')}
              </p>
              <p>
                <strong>{t('ramadan-sadaqah.fidyaSadaqah')}</strong> {t('ramadan-sadaqah.fidyaSadaqahExplanation')}
              </p>
              <p className="text-sm">
                <strong>{t('ramadan-sadaqah.ratesForYear', { year: CURRENT_YEAR })}</strong> {t('ramadan-sadaqah.fitrSadaqah')} {formatNumber(DUMK_FITR_RATE_2026)} {t('ramadan-sadaqah.perPerson')} •
                {t('ramadan-sadaqah.fidyaSadaqah')} {formatNumber(DUMK_FIDYA_RATE_2026)} {t('ramadan-sadaqah.perDay')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          {/* Calculation Type Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.sadaqahType')}</h2>

            <div className="space-y-4">
              {calculationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setCalculationType(type.id as any)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      calculationType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <IconComponent className="w-5 h-5" />
                      <h3 className="font-semibold">{type.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    <div className="text-xs text-gray-500">{type.timing}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fitr-Sadaqah Input */}
          {(calculationType === 'fitr' || calculationType === 'both') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.fitrSadaqahRequired')}</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    {t('ramadan-sadaqah.familyMembersLabel')}
                  </label>
                  <RangeSlider
                    value={parseFloat(familyMembers) || 1}
                    onChange={(val) => setFamilyMembers(String(val))}
                    min={1}
                    max={20}
                    step={1}
                    formatValue={(v) => `${v} чел.`}
                    color="#10b981"
                  />
                  <input
                    type="number"
                    id="familyMembers"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(e.target.value)}
                    placeholder={t('ramadan-sadaqah.familyMembersPlaceholder')}
                    min="1"
                    className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('ramadan-sadaqah.familyMembersHint')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('ramadan-sadaqah.calculationBasis')}
                  </label>
                  <div className="space-y-2">
                    {Object.entries(alternativeRates).map(([key, alternative]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="radio"
                          name="alternativeCalculation"
                          value={key}
                          checked={alternativeCalculation === key}
                          onChange={(e) => setAlternativeCalculation(e.target.value as any)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {alternative.name} - {formatNumber(alternative.rate)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {alternative.description} • {alternative.category}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">{t('ramadan-sadaqah.fitrRateForYear', { year: CURRENT_YEAR })}</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• {t('ramadan-sadaqah.baseRateDUMK', { rate: formatNumber(DUMK_FITR_RATE_2026) })}</div>
                    <div>• {t('ramadan-sadaqah.baseFlourCost')}</div>
                    <div>• {t('ramadan-sadaqah.payBeforePrayer')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fidya-Sadaqah Input */}
          {(calculationType === 'fidya' || calculationType === 'both') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.fidyaSadaqahCompensation')}</h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="missedFastingDays" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {t('ramadan-sadaqah.missedDaysLabel')}
                  </label>
                  <input
                    type="number"
                    id="missedFastingDays"
                    value={missedFastingDays}
                    onChange={(e) => setMissedFastingDays(e.target.value)}
                    placeholder={t('ramadan-sadaqah.missedDaysPlaceholder')}
                    min="0"
                    max="30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('ramadan-sadaqah.missedDaysHint')}
                  </p>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-teal-900 mb-2">{t('ramadan-sadaqah.whenFidyaPaid')}</h3>
                  <div className="text-sm text-teal-800 space-y-1">
                    <div>• <strong>{t('ramadan-sadaqah.chronicIllness')}</strong> {t('ramadan-sadaqah.chronicIllnessDesc')}</div>
                    <div>• <strong>{t('ramadan-sadaqah.oldAge')}</strong> {t('ramadan-sadaqah.oldAgeDesc')}</div>
                    <div>• <strong>{t('ramadan-sadaqah.pregnancyNursing')}</strong> {t('ramadan-sadaqah.pregnancyNursingDesc')}</div>
                    <div>• <strong>{t('ramadan-sadaqah.rate')}</strong> {formatNumber(DUMK_FIDYA_RATE_2026)} {t('ramadan-sadaqah.perEachDay')}</div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-900 mb-1">
                        {t('ramadan-sadaqah.importantClarification')}
                      </h4>
                      <p className="text-amber-800 text-sm">
                        {t('ramadan-sadaqah.fidyaOnlyWhen')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.calculationResults')}</h2>

            <div className="space-y-6">
              {/* Fitr-Sadaqah Results */}
              {(calculationType === 'fitr' || calculationType === 'both') && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {t('ramadan-sadaqah.fitrSadaqah')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Star className="w-6 h-6 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-700">{formatNumber(results.fitrSadaqahAmount)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {familyMembers} {parseInt(familyMembers) === 1 ? t('ramadan-sadaqah.person1') : parseInt(familyMembers) < 5 ? t('ramadan-sadaqah.person24') : t('ramadan-sadaqah.person5plus')} × {formatNumber(results.fitrPerPerson)}
                    </div>
                  </div>

                  {results.alternativeFitrAmount !== results.fitrSadaqahAmount && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        {t('ramadan-sadaqah.alternativeCalc', { name: alternativeRates[alternativeCalculation].name })}
                      </h4>
                      <div className="text-blue-800">
                        <span className="text-lg font-bold">{formatNumber(results.alternativeFitrAmount)}</span>
                        <span className="text-sm ml-2">
                          ({familyMembers} × {formatNumber(alternativeRates[alternativeCalculation].rate)})
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        {alternativeRates[alternativeCalculation].description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Fidya-Sadaqah Results */}
              {(calculationType === 'fidya' || calculationType === 'both') && missedFastingDays && parseInt(missedFastingDays) > 0 && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {t('ramadan-sadaqah.fidyaSadaqah')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-6 h-6 text-teal-600" />
                      <span className="text-2xl font-bold text-teal-700">{formatNumber(results.fidyaSadaqahAmount)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {missedFastingDays} {parseInt(missedFastingDays) === 1 ? t('ramadan-sadaqah.day1') : parseInt(missedFastingDays) < 5 ? t('ramadan-sadaqah.day24') : t('ramadan-sadaqah.day5plus')} × {formatNumber(results.fidyaPerDay)}
                  </div>
                </div>
              )}

              {/* Total Amount */}
              {calculationType === 'both' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {t('ramadan-sadaqah.totalSadaqah')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Gift className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">{formatNumber(results.totalSadaqahAmount)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('ramadan-sadaqah.fitrPlusFidya')}
                  </div>
                </div>
              )}

              {/* Timing Information */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">
                      {t('ramadan-sadaqah.paymentDeadlines')}
                    </h4>
                    <div className="text-yellow-800 text-sm space-y-1">
                      <p>• <strong>{t('ramadan-sadaqah.fitrSadaqah')}:</strong> {t('ramadan-sadaqah.beforePrayerDeadline')}</p>
                      <p>• <strong>{t('ramadan-sadaqah.fidyaSadaqah')}:</strong> {t('ramadan-sadaqah.anytimePayment')}</p>
                      <p>• <strong>{t('ramadan-sadaqah.ramadanYear', { year: CURRENT_YEAR })}:</strong> {t('ramadan-sadaqah.approximately')} {results.ramadanInfo.estimatedRamadanStart}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Religious Guidance */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.religiousGuidance')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {ramadanGuidance.map((guidance, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{guidance.title}</h3>
              <p className="text-gray-600 text-sm">{guidance.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Book className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('ramadan-sadaqah.wisdomOfFitr')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('ramadan-sadaqah.wisdomOfFitrContent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Rates */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.historicalRates')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('ramadan-sadaqah.fitrByYears')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2025')}</span>
                <span className="font-semibold text-blue-600">{formatNumber(655)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2024')}</span>
                <span className="font-medium">600 ₸</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2023')}</span>
                <span className="font-medium">550 ₸</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2022')}</span>
                <span className="font-medium">500 ₸</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('ramadan-sadaqah.fidyaByYears')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2025')}</span>
                <span className="font-semibold text-teal-600">{formatNumber(3000)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2024')}</span>
                <span className="font-medium">2800 ₸</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2023')}</span>
                <span className="font-medium">2500 ₸</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                <span>{t('ramadan-sadaqah.year2022')}</span>
                <span className="font-medium">2200 ₸</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('ramadan-sadaqah.dumkMethodology')}</strong> {t('ramadan-sadaqah.dumkMethodologyContent')}
          </p>
        </div>
      </div>

      {/* Examples Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.examplesTitle')}</h2>

        <div className="space-y-6">
          {/* Example 1 - Large Family */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-blue-900 mb-3">{t('ramadan-sadaqah.example1Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('ramadan-sadaqah.familyComposition')}</div>
                <div>{t('ramadan-sadaqah.example1Parents')}</div>
                <div>{t('ramadan-sadaqah.example1Children')}</div>
                <div>{t('ramadan-sadaqah.example1Total')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('ramadan-sadaqah.calculation')}</div>
                <div>7 × 655 ₸ = 4,585 ₸</div>
                <div>{t('ramadan-sadaqah.example1Basis')}</div>
              </div>
              <div>
                <div className="font-medium text-blue-700">{t('ramadan-sadaqah.toPay')}</div>
                <div className="text-lg font-bold text-blue-600">4,585 ₸</div>
                <div className="text-xs text-blue-600">{t('ramadan-sadaqah.fitrSadaqah')}</div>
              </div>
            </div>
          </div>

          {/* Example 2 - Elderly Person with Missed Days */}
          <div className="border border-teal-200 rounded-lg p-4 bg-teal-50">
            <h3 className="font-semibold text-teal-900 mb-3">{t('ramadan-sadaqah.example2Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('ramadan-sadaqah.situation')}</div>
                <div>{t('ramadan-sadaqah.example2Family')}</div>
                <div>{t('ramadan-sadaqah.example2Missed')}</div>
                <div>{t('ramadan-sadaqah.example2Reason')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('ramadan-sadaqah.calculation')}</div>
                <div>{t('ramadan-sadaqah.example2Fitr')}</div>
                <div>{t('ramadan-sadaqah.example2Fidya')}</div>
                <div>{t('ramadan-sadaqah.example2Total')}</div>
              </div>
              <div>
                <div className="font-medium text-teal-700">{t('ramadan-sadaqah.toPay')}</div>
                <div className="text-lg font-bold text-teal-600">46,310 ₸</div>
                <div className="text-xs text-teal-600">{t('ramadan-sadaqah.fitrPlusFidya')}</div>
              </div>
            </div>
          </div>

          {/* Example 3 - Wealthy Family Alternative */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-green-900 mb-3">{t('ramadan-sadaqah.example3Title')}</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">{t('ramadan-sadaqah.parameters')}</div>
                <div>{t('ramadan-sadaqah.example3Family')}</div>
                <div>{t('ramadan-sadaqah.example3Basis')}</div>
                <div>{t('ramadan-sadaqah.example3Level')}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">{t('ramadan-sadaqah.calculation')}</div>
                <div>4 × 2,200 ₸ = 8,800 ₸</div>
                <div>{t('ramadan-sadaqah.example3InsteadOf')}</div>
                <div>{t('ramadan-sadaqah.example3Voluntary')}</div>
              </div>
              <div>
                <div className="font-medium text-green-700">{t('ramadan-sadaqah.toPay')}</div>
                <div className="text-lg font-bold text-green-600">8,800 ₸</div>
                <div className="text-xs text-green-600">{t('ramadan-sadaqah.example3Generous')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Categories */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.recipientsTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            t('ramadan-sadaqah.recipient1'),
            t('ramadan-sadaqah.recipient2'),
            t('ramadan-sadaqah.recipient3'),
            t('ramadan-sadaqah.recipient4'),
            t('ramadan-sadaqah.recipient5'),
            t('ramadan-sadaqah.recipient6'),
            t('ramadan-sadaqah.recipient7'),
            t('ramadan-sadaqah.recipient8')
          ].map((recipient, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">{index + 1}</span>
              </div>
              <span className="text-sm text-green-800">{recipient}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Heart className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('ramadan-sadaqah.prioritiesInKazakhstan')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('ramadan-sadaqah.prioritiesInKazakhstanContent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Practical Guidelines */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.practicalRecommendations')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🕌</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.throughMosques')}</h3>
            <p className="text-gray-600 text-sm">
              {t('ramadan-sadaqah.throughMosquesContent')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.charitableFunds')}</h3>
            <p className="text-gray-600 text-sm">
              {t('ramadan-sadaqah.charitableFundsContent')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.directlyToFamilies')}</h3>
            <p className="text-gray-600 text-sm">
              {t('ramadan-sadaqah.directlyToFamiliesContent')}
            </p>
          </div>
        </div>
      </div>

      {/* DUMK Information */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.dumkRoleTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('ramadan-sadaqah.dumkTitle')}</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>{t('ramadan-sadaqah.dumkFunctions')}</strong> {t('ramadan-sadaqah.dumkFunctionsContent')}
              </p>
              <p>
                <strong>{t('ramadan-sadaqah.dumkMethodology')}</strong> {t('ramadan-sadaqah.dumkMethodologyShort')}
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('ramadan-sadaqah.annualUpdate')}</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p>
                <strong>{t('ramadan-sadaqah.announcementTime')}</strong> {t('ramadan-sadaqah.announcementTimeContent')}
              </p>
              <p>
                <strong>{t('ramadan-sadaqah.growthFactors')}</strong> {t('ramadan-sadaqah.growthFactorsContent')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Target className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-teal-900 mb-1">
                {t('ramadan-sadaqah.regionalAdaptation')}
              </h3>
              <p className="text-teal-800 text-sm">
                {t('ramadan-sadaqah.regionalAdaptationContent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spiritual Significance */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.spiritualSignificance')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{t('ramadan-sadaqah.fitrSadaqah')}:</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.spiritualBenefit1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.spiritualBenefit2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.spiritualBenefit3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.spiritualBenefit4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Heart className="w-5 h-5 text-teal-500" />
              <span>{t('ramadan-sadaqah.fidyaSadaqah')}:</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.fidyaBenefit1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.fidyaBenefit2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.fidyaBenefit3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('ramadan-sadaqah.fidyaBenefit4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Moon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('ramadan-sadaqah.ramadanMonthOfMercy')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('ramadan-sadaqah.ramadanMonthOfMercyContent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('ramadan-sadaqah.importantPrinciples')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.fitrConditions')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('ramadan-sadaqah.fitrCondition1')}</li>
                  <li>{t('ramadan-sadaqah.fitrCondition2')}</li>
                  <li>{t('ramadan-sadaqah.fitrCondition3')}</li>
                  <li>{t('ramadan-sadaqah.fitrCondition4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.fidyaWhenPaid')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('ramadan-sadaqah.fidyaCondition1')}</li>
                  <li>{t('ramadan-sadaqah.fidyaCondition2')}</li>
                  <li>{t('ramadan-sadaqah.fidyaCondition3')}</li>
                  <li>{t('ramadan-sadaqah.fidyaCondition4')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('ramadan-sadaqah.consultScholars')}
              </h3>
              <p className="text-amber-800 text-sm">
                {t('ramadan-sadaqah.consultScholarsContent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Methods */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.paymentMethodsTitle')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('ramadan-sadaqah.statePrograms')}</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• {t('ramadan-sadaqah.stateProgram1')}</div>
              <div>• {t('ramadan-sadaqah.stateProgram2')}</div>
              <div>• {t('ramadan-sadaqah.stateProgram3')}</div>
              <div>• {t('ramadan-sadaqah.stateProgram4')}</div>
            </div>
          </div>

          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('ramadan-sadaqah.throughMosquesShort')}</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div>• {t('ramadan-sadaqah.mosquesMethod1')}</div>
              <div>• {t('ramadan-sadaqah.mosquesMethod2')}</div>
              <div>• {t('ramadan-sadaqah.mosquesMethod3')}</div>
              <div>• {t('ramadan-sadaqah.mosquesMethod4')}</div>
            </div>
          </div>

          <div className="border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-3">{t('ramadan-sadaqah.privateInitiatives')}</h3>
            <div className="text-sm text-teal-800 space-y-1">
              <div>• {t('ramadan-sadaqah.privateInitiative1')}</div>
              <div>• {t('ramadan-sadaqah.privateInitiative2')}</div>
              <div>• {t('ramadan-sadaqah.privateInitiative3')}</div>
              <div>• {t('ramadan-sadaqah.privateInitiative4')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('ramadan-sadaqah.modernPaymentForms')}
              </h3>
              <p className="text-green-800 text-sm">
                {t('ramadan-sadaqah.modernPaymentFormsContent')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timing and Calendar */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.ramadanCalendar')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('ramadan-sadaqah.ramadanYear', { year: CURRENT_YEAR })}</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>{t('ramadan-sadaqah.estimatedStart')}</strong> {results.ramadanInfo.estimatedRamadanStart}</p>
              <p><strong>{t('ramadan-sadaqah.duration')}</strong> {t('ramadan-sadaqah.durationDays')}</p>
              <p><strong>{t('ramadan-sadaqah.nightOfPower')}</strong> {t('ramadan-sadaqah.nightOfPowerDesc')}</p>
              <p><strong>{t('ramadan-sadaqah.eidAlFitr')}</strong> {t('ramadan-sadaqah.eidAlFitrDesc')}</p>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">{t('ramadan-sadaqah.paymentDeadlinesCalendar')}</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>{t('ramadan-sadaqah.fitrSadaqah')}:</strong></p>
              <div className="ml-4 space-y-1">
                <div>• {t('ramadan-sadaqah.bestTimeLastDays')}</div>
                <div>• {t('ramadan-sadaqah.deadlineBeforePrayer')}</div>
                <div>• {t('ramadan-sadaqah.canPayFromStart')}</div>
              </div>
              <p><strong>{t('ramadan-sadaqah.fidyaSadaqah')}:</strong> {t('ramadan-sadaqah.anytimeYear')}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{t('ramadan-sadaqah.lunarCalendar')}</strong> {t('ramadan-sadaqah.lunarCalendarContent')}
          </p>
        </div>
      </div>

      {/* Community Impact */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('ramadan-sadaqah.socialSignificance')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.socialCohesion')}</h3>
            <p className="text-gray-600 text-sm">
              {t('ramadan-sadaqah.socialCohesionContent')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.economicSupport')}</h3>
            <p className="text-gray-600 text-sm">
              {t('ramadan-sadaqah.economicSupportContent')}
            </p>
          </div>

          <div className="text-center p-6 bg-teal-50 rounded-lg">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('ramadan-sadaqah.spiritualPurification')}</h3>
            <p className="text-gray-600 text-sm">
              {t('ramadan-sadaqah.spiritualPurificationContent')}
            </p>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      {results.fitrTotal > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Фитр-садака', value: results.fitrTotal },
              { name: 'Фидия', value: results.fidyaTotal },
            ].filter(item => item.value > 0)}
            title="Структура выплат Рамадан"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.fitrTotal > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Расчёт Рамадан',
              subtitle: calculationType === 'fitr' ? 'Фитр-садака' : calculationType === 'fidya' ? 'Фидия' : 'Фитр и Фидия',
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Членов семьи', value: familyMembers },
                    { label: 'Пропущенных дней', value: missedFastingDays || '0' },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Фитр-садака', value: `${results.fitrTotal.toLocaleString()} ₸` },
                    { label: 'Фидия', value: `${results.fidyaTotal.toLocaleString()} ₸` },
                    { label: 'Итого', value: `${results.grandTotal.toLocaleString()} ₸` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="ramadan-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('ramadan-sadaqah.faq.q1'), answer: t('ramadan-sadaqah.faq.a1') },
          { question: t('ramadan-sadaqah.faq.q2'), answer: t('ramadan-sadaqah.faq.a2') },
          { question: t('ramadan-sadaqah.faq.q3'), answer: t('ramadan-sadaqah.faq.a3') },
          { question: t('ramadan-sadaqah.faq.q4'), answer: t('ramadan-sadaqah.faq.a4') },
          { question: t('ramadan-sadaqah.faq.q5'), answer: t('ramadan-sadaqah.faq.a5') }
        ]}
        sources={[
          { title: 'ДУМК — Рамадан', url: 'https://muftyat.kz/' },
          { title: 'IslamQ&A — Садака', url: 'https://islamqa.info/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="ramadan-sadaqah"
        calculatorTitle="Калькулятор садаки"
      />
    </div>
  );
}
