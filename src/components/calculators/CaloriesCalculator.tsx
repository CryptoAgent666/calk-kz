import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, Calculator, Target, TrendingUp, Activity, Users, Heart, Zap, Info, BarChart3 } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { MedicalDisclaimer } from '../ui/MedicalDisclaimer';
import { EmbedWidget } from '../ui/EmbedWidget';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';
import { pluralize } from '../../utils/pluralize';

export default function CaloriesCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [age, setAge] = useState<string>('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState<string>('175');
  const [weight, setWeight] = useState<string>('75');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [goal, setGoal] = useState<'maintain' | 'lose' | 'gain'>('maintain');
  const [macroSplit, setMacroSplit] = useState<string>('balanced');

  const [results, setResults] = useState({
    bmr: 0,
    maintenanceCalories: 0,
    targetCalories: 0,
    calorieAdjustment: 0,
    macros: {
      protein: { grams: 0, calories: 0, percentage: 0 },
      fats: { grams: 0, calories: 0, percentage: 0 },
      carbs: { grams: 0, calories: 0, percentage: 0 }
    },
    recommendations: [] as string[]
  });

  const activityLevels = [
    { id: 'sedentary', coefficient: 1.2 },
    { id: 'light', coefficient: 1.375 },
    { id: 'moderate', coefficient: 1.55 },
    { id: 'high', coefficient: 1.725 },
    { id: 'extreme', coefficient: 1.9 }
  ];

  const goals = [
    { id: 'lose', adjustment: -0.18 },
    { id: 'maintain', adjustment: 0 },
    { id: 'gain', adjustment: 0.12 }
  ];

  const macroSplits = [
    { id: 'balanced', protein: 30, fats: 25, carbs: 45 },
    { id: 'athletic', protein: 35, fats: 20, carbs: 45 },
    { id: 'keto', protein: 25, fats: 70, carbs: 5 },
    { id: 'lowfat', protein: 25, fats: 15, carbs: 60 }
  ];

  const calculateCalories = () => {
    const ageYears = parseInt(age) || 0;
    const weightKg = parseFloat(weight) || 0;
    const heightCm = parseFloat(height) || 0;

    if (ageYears <= 0 || weightKg <= 0 || heightCm <= 0) {
      setResults({
        bmr: 0, maintenanceCalories: 0, targetCalories: 0, calorieAdjustment: 0,
        macros: { protein: { grams: 0, calories: 0, percentage: 0 }, fats: { grams: 0, calories: 0, percentage: 0 }, carbs: { grams: 0, calories: 0, percentage: 0 } },
        recommendations: []
      });
      return;
    }

    let bmr: number;
    if (gender === 'male') {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + 5;
    } else {
      bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) - 161;
    }

    const activityCoefficient = activityLevels.find(level => level.id === activityLevel)?.coefficient || 1.55;
    const maintenanceCalories = bmr * activityCoefficient;

    const goalData = goals.find(g => g.id === goal);
    const adjustment = goalData?.adjustment || 0;
    const targetCalories = maintenanceCalories * (1 + adjustment);
    const calorieAdjustment = targetCalories - maintenanceCalories;

    const macroData = macroSplits.find(split => split.id === macroSplit);
    if (!macroData) return;

    const proteinCalories = targetCalories * (macroData.protein / 100);
    const fatsCalories = targetCalories * (macroData.fats / 100);
    const carbsCalories = targetCalories * (macroData.carbs / 100);

    const macros = {
      protein: {
        grams: Math.round(proteinCalories / 4),
        calories: Math.round(proteinCalories),
        percentage: macroData.protein
      },
      fats: {
        grams: Math.round(fatsCalories / 9),
        calories: Math.round(fatsCalories),
        percentage: macroData.fats
      },
      carbs: {
        grams: Math.round(carbsCalories / 4),
        calories: Math.round(carbsCalories),
        percentage: macroData.carbs
      }
    };

    const recommendations = [];

    if (goal === 'lose') {
      recommendations.push(t('calories.recommendations.loseCalorieDeficit'));
      recommendations.push(t('calories.recommendations.loseProtein'));
      recommendations.push(t('calories.recommendations.loseWater'));
      recommendations.push(t('calories.recommendations.loseGradual'));
    } else if (goal === 'gain') {
      recommendations.push(t('calories.recommendations.gainMeals'));
      recommendations.push(t('calories.recommendations.gainStrength'));
      recommendations.push(t('calories.recommendations.gainCaloric'));
      recommendations.push(t('calories.recommendations.gainProtein'));
    } else {
      recommendations.push(t('calories.recommendations.maintainBalance'));
      recommendations.push(t('calories.recommendations.maintainQuality'));
      recommendations.push(t('calories.recommendations.maintainVariety'));
    }

    if (activityLevel === 'sedentary') {
      recommendations.push(t('calories.recommendations.sedentaryWalk'));
    } else if (activityLevel === 'extreme') {
      recommendations.push(t('calories.recommendations.extremeRecovery'));
    }

    if (gender === 'female') {
      recommendations.push(t('calories.recommendations.femaleHormones'));
      recommendations.push(t('calories.recommendations.femaleNutrients'));
    } else {
      recommendations.push(t('calories.recommendations.maleProtein'));
    }

    setResults({
      bmr: Math.round(bmr),
      maintenanceCalories: Math.round(maintenanceCalories),
      targetCalories: Math.round(targetCalories),
      calorieAdjustment: Math.round(calorieAdjustment),
      macros,
      recommendations
    });
  };

  useEffect(() => {
    calculateCalories();
  }, [age, gender, height, weight, activityLevel, goal, macroSplit]);

  const selectedActivity = activityLevels.find(level => level.id === activityLevel);

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="calories" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-lime-500 rounded-lg flex items-center justify-center">
            <Apple className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('calories.heading')}</h1>
            <p className="text-gray-600">{t('calories.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.basicData')}</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('calories.age')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t('calories.agePlaceholder')}
                    min="10"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">{t('calories.ageUnit')}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('calories.weight')}
                </label>
                <RangeSlider
                  value={parseFloat(weight) || 70}
                  onChange={(val) => setWeight(String(val))}
                  min={30}
                  max={200}
                  step={1}
                  formatValue={(v) => `${v} кг`}
                  color="#10b981"
                />
                <input
                  type="number"
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={t('calories.weightPlaceholder')}
                  step="0.1"
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('calories.height')}
                </label>
                <RangeSlider
                  value={parseFloat(height) || 170}
                  onChange={(val) => setHeight(String(val))}
                  min={120}
                  max={220}
                  step={1}
                  formatValue={(v) => `${v} см`}
                  color="#3b82f6"
                />
                <input
                  type="number"
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={t('calories.heightPlaceholder')}
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('calories.gender')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGender('male')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      gender === 'male'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">{t('calories.male')}</div>
                  </button>
                  <button
                    onClick={() => setGender('female')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      gender === 'female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Heart className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">{t('calories.female')}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.activityAndGoals')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('calories.activityLevel')}
                </label>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <label key={level.id} className="flex items-start">
                      <input
                        type="radio"
                        name="activityLevel"
                        value={level.id}
                        checked={activityLevel === level.id}
                        onChange={(e) => setActivityLevel(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{t(`calculators:calories.activityLevels.${level.id}.name`)}</div>
                        <div className="text-xs text-gray-600">{t(`calculators:calories.activityLevels.${level.id}.description`)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('calories.yourGoal')}
                </label>
                <div className="grid md:grid-cols-3 gap-3">
                  {goals.map((goalOption) => (
                    <button
                      key={goalOption.id}
                      onClick={() => setGoal(goalOption.id as any)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        goal === goalOption.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium mb-1">{t(`calculators:calories.goals.${goalOption.id}.name`)}</div>
                      <div className="text-xs text-gray-600">{t(`calculators:calories.goals.${goalOption.id}.description`)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('calories.macroDistribution')}
                </label>
                <div className="grid md:grid-cols-2 gap-3">
                  {macroSplits.map((split) => (
                    <button
                      key={split.id}
                      onClick={() => setMacroSplit(split.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        macroSplit === split.id
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium mb-1">{t(`calculators:calories.macroSplits.${split.id}.name`)}</div>
                      <div className="text-xs text-gray-600 mb-2">{t(`calculators:calories.macroSplits.${split.id}.description`)}</div>
                      <div className="text-xs">
                        Б: {split.protein}% • Ж: {split.fats}% • У: {split.carbs}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.yourCalorieNorm')}</h2>

            {results.bmr > 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{t('calories.bmr')}</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{results.bmr.toLocaleString()} {t('calories.kcal')}</div>
                  <div className="text-xs text-blue-600">{t('calories.bmrDescription')}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{t('calories.maintenance')}</span>
                  </div>
                  <div className="text-xl font-bold text-gray-700">{results.maintenanceCalories.toLocaleString()} {t('calories.kcal')}</div>
                  <div className="text-xs text-gray-600">{t('calories.maintenanceDescription')} ({t(`calculators:calories.activityLevels.${selectedActivity?.id}.name`)})</div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">{t('calories.targetGoal')} {t(`calculators:calories.goals.${goal}.name`)}</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">{results.targetCalories.toLocaleString()} {t('calories.kcal')}</div>
                  {results.calorieAdjustment !== 0 && (
                    <div className="text-xs text-green-600">
                      {results.calorieAdjustment > 0 ? '+' : ''}{results.calorieAdjustment.toLocaleString()} {t('calories.kcal')} {t('calories.fromMaintenance')}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('calories.enterDataPrompt')}
              </div>
            )}
          </div>

          {results.targetCalories > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.macronutrients')}</h2>

              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-600 mb-1">{t('calories.selectedProportion')}</div>
                  <div className="text-lg font-semibold text-teal-700">{t(`calculators:calories.macroSplits.${macroSplit}.name`)}</div>
                </div>

                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-red-900">{t('calories.protein')} ({results.macros.protein.percentage}%)</span>
                      <span className="text-lg font-bold text-red-700">{results.macros.protein.grams}г</span>
                    </div>
                    <div className="text-xs text-red-600">{results.macros.protein.calories.toLocaleString()} {t('calories.kcal')}</div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-yellow-900">{t('calories.fats')} ({results.macros.fats.percentage}%)</span>
                      <span className="text-lg font-bold text-yellow-700">{results.macros.fats.grams}г</span>
                    </div>
                    <div className="text-xs text-yellow-600">{results.macros.fats.calories.toLocaleString()} {t('calories.kcal')}</div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-green-900">{t('calories.carbs')} ({results.macros.carbs.percentage}%)</span>
                      <span className="text-lg font-bold text-green-700">{results.macros.carbs.grams}г</span>
                    </div>
                    <div className="text-xs text-green-600">{results.macros.carbs.calories.toLocaleString()} {t('calories.kcal')}</div>
                  </div>
                </div>

                <div className="bg-teal-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-teal-900 mb-2">{t('calories.total')}</h3>
                  <div className="text-teal-800 text-sm space-y-1">
                    <div>{results.macros.protein.grams + results.macros.fats.grams + results.macros.carbs.grams}г {t('calories.totalMacros')}</div>
                    <div>{(results.macros.protein.calories + results.macros.fats.calories + results.macros.carbs.calories).toLocaleString()} {t('calories.kcal')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results.recommendations.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.personalRecommendations')}</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">{t('calories.nutritionAndRoutine')}</h3>
              <div className="space-y-2">
                {results.recommendations.slice(0, Math.ceil(results.recommendations.length / 2)).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">{t('calories.additionalTips')}</h3>
              <div className="space-y-2">
                {results.recommendations.slice(Math.ceil(results.recommendations.length / 2)).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.formulaTitle')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('calories.formulaMale')}</h3>
            <div className="font-mono text-sm text-blue-800 bg-white p-3 rounded">
              {t('calories.formulaMaleText')}
            </div>
          </div>

          <div className="bg-pink-50 rounded-lg p-4">
            <h3 className="font-semibold text-pink-900 mb-3">{t('calories.formulaFemale')}</h3>
            <div className="font-mono text-sm text-pink-800 bg-white p-3 rounded">
              {t('calories.formulaFemaleText')}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">
                {t('calories.formulaAdvantagesTitle')}
              </h3>
              <div className="text-green-800 text-sm space-y-1">
                <p>• {t('calories.formulaAdvantages.modern')}</p>
                <p>• {t('calories.formulaAdvantages.comprehensive')}</p>
                <p>• {t('calories.formulaAdvantages.suitable')}</p>
                <p>• {t('calories.formulaAdvantages.professional')}</p>
                <p>• {t('calories.formulaAdvantages.accurate')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('calories.macroGuideTitle')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🥩</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('calories.proteinTitle')}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>{t('calories.proteinCalories')}</strong></div>
              <div>{t('calories.proteinSources')}</div>
              <div>{t('calories.proteinFunction')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-yellow-50 rounded-lg">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🥑</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('calories.fatsTitle')}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>{t('calories.fatsCalories')}</strong></div>
              <div>{t('calories.fatsSources')}</div>
              <div>{t('calories.fatsFunction')}</div>
            </div>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🍞</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('calories.carbsTitle')}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>{t('calories.carbsCalories')}</strong></div>
              <div>{t('calories.carbsSources')}</div>
              <div>{t('calories.carbsFunction')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма макронутриентов */}
      {results.targetCalories > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('calories.protein'), value: results.macros.protein.grams },
              { name: t('calories.fats'), value: results.macros.fats.grams },
              { name: t('calories.carbs'), value: results.macros.carbs.grams },
            ]}
            title={t('calories.macroDistributionChartTitle')}
            formatValue={(value) => `${value} г`}
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results.targetCalories > 0 && (
        <div className="mt-6">
          <ExportButtons
            data={{
              title: 'Расчёт калорий',
              subtitle: `Цель: ${goal === 'maintain' ? 'Поддержание' : goal === 'lose' ? 'Похудение' : 'Набор массы'}`,
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Возраст', value: `${age} ${pluralize(i18n.language, parseInt(age) || 0, 'год', 'года', 'лет')}` },
                    { label: 'Вес', value: `${weight} кг` },
                    { label: 'Рост', value: `${height} см` },
                    { label: 'Пол', value: gender === 'male' ? 'Мужской' : 'Женский' },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'Базовый метаболизм', value: `${results.bmr} ккал` },
                    { label: 'Целевые калории', value: `${results.targetCalories} ккал` },
                    { label: 'Белки', value: `${results.macros.protein.grams} г` },
                    { label: 'Жиры', value: `${results.macros.fats.grams} г` },
                    { label: 'Углеводы', value: `${results.macros.carbs.grams} г` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="calories-calculation"
          />
        </div>
      )}

      {/* Medical sources (Apple App Store Guideline 1.4.1 compliance) */}
      <MedicalDisclaimer
        sources={[
          {
            title: 'Mifflin MD, St Jeor ST, et al. "A new predictive equation for resting energy expenditure in healthy individuals" (1990)',
            url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
            description: 'Am J Clin Nutr. 51(2):241-7. Оригинальная рецензируемая публикация формулы Миффлина-Сан Жеора, которая используется в этом калькуляторе для расчёта базального метаболизма (BMR).',
          },
          {
            title: 'Academy of Nutrition and Dietetics — Position Paper on Energy Estimation',
            url: 'https://www.jandonline.org/article/S2212-2672(14)01200-6/fulltext',
            description: 'J Acad Nutr Diet. Рецензируемое подтверждение точности уравнения Миффлина-Сан Жеора для здоровых взрослых нормального и избыточного веса.',
          },
          {
            title: 'USDA — Dietary Guidelines for Americans 2020-2025',
            url: 'https://www.dietaryguidelines.gov/sites/default/files/2021-03/Dietary_Guidelines_for_Americans-2020-2025.pdf',
            description: 'Министерство сельского хозяйства США. Рекомендации по суточному потреблению энергии и распределению макронутриентов (белки, жиры, углеводы).',
          },
          {
            title: 'WHO — Healthy diet fact sheet',
            url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
            description: 'World Health Organization. Глобальные рекомендации по здоровому питанию: общее потребление, ограничения сахаров, соли, насыщенных жиров.',
          },
          {
            title: 'Institute of Medicine — Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids (Macronutrients)',
            url: 'https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids',
            description: 'National Academies Press. Источник коэффициентов активности (PAL 1.2–1.9) и диапазонов AMDR для распределения макронутриентов.',
          },
        ]}
      />

      {/* FAQ */}
      <CalculatorExamples calculatorId="calories" />
      <MethodologySection steps={getMethodology('calories')} />
      <FAQSection
        items={[
          { question: t('calories.faq.q1'), answer: t('calories.faq.a1') },
          { question: t('calories.faq.q2'), answer: t('calories.faq.a2') },
          { question: t('calories.faq.q3'), answer: t('calories.faq.a3') },
          { question: t('calories.faq.q4'), answer: t('calories.faq.a4') },
          { question: t('calories.faq.q5'), answer: t('calories.faq.a5') }
        ]}
        sources={[
          { title: 'Mifflin-St Jeor (1990) PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
          { title: 'WHO — Healthy diet', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' },
          { title: 'USDA Dietary Guidelines 2020-2025', url: 'https://www.dietaryguidelines.gov/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="calories"
        calculatorTitle="Калькулятор калорий"
      />
      <LastUpdated calculatorId="calories" />
    </div>
  );
}
