import React, { useState, useEffect } from 'react';
import { Activity, Calculator, Users, TrendingUp, AlertTriangle, Info, Target, Heart, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InputField from '../InputField';
import SharePrintButtons from '../SharePrintButtons';
import { ProgressBar } from '../ui/ChartComponents';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { QuickAnswer } from '../ui/QuickAnswer';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { MedicalDisclaimer } from '../ui/MedicalDisclaimer';
import { EmbedWidget } from '../ui/EmbedWidget';
import { getMethodology } from '../../data/calculatorMethodology';

export default function BMICalculator() {
  const { t } = useTranslation('calculators');
  const [height, setHeight] = useState<string>('175');
  const [weight, setWeight] = useState<string>('75');
  const [age, setAge] = useState<string>('30');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'm'>('cm');
  
  // Состояния для валидации
  const [errors, setErrors] = useState({
    height: '',
    weight: '',
    age: ''
  });
  
  const [results, setResults] = useState({
    bmi: 0,
    category: '',
    categoryDescription: '',
    healthRisk: '',
    normalWeightRange: { min: 0, max: 0 },
    weightDifference: 0,
    ageAdjustedCategory: '',
    recommendations: [] as string[]
  });

  const validateHeight = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('bmi.errors.invalidNumber');
    if (heightUnit === 'cm') {
      if (num < 100) return t('bmi.errors.heightMinCm');
      if (num > 250) return t('bmi.errors.heightMaxCm');
    } else {
      if (num < 1.0) return t('bmi.errors.heightMinM');
      if (num > 2.5) return t('bmi.errors.heightMaxM');
    }
    return null;
  };

  const validateWeight = (value: string): string | null => {
    const num = parseFloat(value);
    if (!value) return null;
    if (isNaN(num)) return t('bmi.errors.invalidNumber');
    if (num < 20) return t('bmi.errors.weightMin');
    if (num > 300) return t('bmi.errors.weightMax');
    return null;
  };

  const validateAge = (value: string): string | null => {
    const num = parseInt(value);
    if (!value) return null;
    if (isNaN(num)) return t('bmi.errors.invalidNumber');
    if (num < 1) return t('bmi.errors.ageMin');
    if (num > 120) return t('bmi.errors.ageMax');
    return null;
  };

  const generateExportData = () => {
    if (results.bmi === 0) return null;

    return `${t('bmi.yourData')}:
- ${t('bmi.height')}: ${height} ${heightUnit}
- ${t('bmi.weight')}: ${weight} ${t('bmi.weightUnit')}
- ${t('bmi.age')}: ${age} ${t('bmi.ageUnit')}
- ${t('bmi.gender')}: ${gender === 'male' ? t('bmi.male') : t('bmi.female')}

${t('bmi.results')}:
- ${t('bmi.yourBMI')}: ${results.bmi}
- ${t('bmi.category')}: ${results.category}
- ${t('bmi.categoryDescription')}: ${results.categoryDescription}
- ${t('bmi.healthRisk')}: ${results.healthRisk}

${t('bmi.normalWeightRange')}
${results.normalWeightRange.min} - ${results.normalWeightRange.max} ${t('bmi.weightUnit')}

${t('bmi.recommendations')}
${results.recommendations.map(rec => `• ${rec}`).join('\n')}`;
  };

  const bmiCategories = [
    { min: 0, max: 18.5, category: t('bmi.categories.underweight'), description: t('bmi.categories.underweightDesc'), risk: t('bmi.categories.underweightRisk'), color: 'blue' },
    { min: 18.5, max: 25, category: t('bmi.categories.normal'), description: t('bmi.categories.normalDesc'), risk: t('bmi.categories.normalRisk'), color: 'green' },
    { min: 25, max: 30, category: t('bmi.categories.overweight'), description: t('bmi.categories.overweightDesc'), risk: t('bmi.categories.overweightRisk'), color: 'yellow' },
    { min: 30, max: 35, category: t('bmi.categories.obese1'), description: t('bmi.categories.obese1Desc'), risk: t('bmi.categories.obese1Risk'), color: 'orange' },
    { min: 35, max: 40, category: t('bmi.categories.obese2'), description: t('bmi.categories.obese2Desc'), risk: t('bmi.categories.obese2Risk'), color: 'red' },
    { min: 40, max: Infinity, category: t('bmi.categories.obese3'), description: t('bmi.categories.obese3Desc'), risk: t('bmi.categories.obese3Risk'), color: 'red' }
  ];

  const calculateBMI = () => {
    const weightKg = parseFloat(weight) || 0;
    let heightM = 0;
    
    if (heightUnit === 'cm') {
      heightM = (parseFloat(height) || 0) / 100;
    } else {
      heightM = parseFloat(height) || 0;
    }
    
    const ageYears = parseInt(age) || 0;
    
    if (weightKg <= 0 || heightM <= 0) {
      setResults({
        bmi: 0, category: '', categoryDescription: '', healthRisk: '',
        normalWeightRange: { min: 0, max: 0 }, weightDifference: 0,
        ageAdjustedCategory: '', recommendations: []
      });
      return;
    }

    // Валидация при расчете
    const heightError = validateHeight(height);
    const weightError = validateWeight(weight);
    const ageError = validateAge(age);

    setErrors({
      height: heightError || '',
      weight: weightError || '',
      age: ageError || ''
    });

    // Если есть ошибки, не рассчитываем
    if (heightError || weightError || (age && ageError)) {
      setResults({
        bmi: 0, category: '', categoryDescription: '', healthRisk: '',
        normalWeightRange: { min: 0, max: 0 }, weightDifference: 0,
        ageAdjustedCategory: '', recommendations: []
      });
      return;
    }
    // Расчет ИМТ
    const bmi = weightKg / (heightM * heightM);
    
    // Определение категории
    const categoryInfo = bmiCategories.find(cat => bmi >= cat.min && bmi < cat.max) || bmiCategories[bmiCategories.length - 1];
    
    // Расчет нормального диапазона веса
    const normalMinWeight = 18.5 * heightM * heightM;
    const normalMaxWeight = 24.9 * heightM * heightM;
    
    // Разница с нормальным весом
    let weightDifference = 0;
    if (weightKg < normalMinWeight) {
      weightDifference = normalMinWeight - weightKg; // Нужно набрать
    } else if (weightKg > normalMaxWeight) {
      weightDifference = weightKg - normalMaxWeight; // Нужно сбросить
    }

    let ageAdjustedCategory = categoryInfo.category;
    if (ageYears > 65) {
      if (bmi >= 22 && bmi < 27) {
        ageAdjustedCategory = t('bmi.ageAdjustedNormal');
      }
    }

    const recommendations = [];

    if (bmi < 18.5) {
      recommendations.push(t('bmi.recommendationsList.consultDoctor'));
      recommendations.push(t('bmi.recommendationsList.highCalorieDiet'));
      recommendations.push(t('bmi.recommendationsList.strengthTraining'));
    } else if (bmi >= 18.5 && bmi < 25) {
      recommendations.push(t('bmi.recommendationsList.maintainWeight'));
      recommendations.push(t('bmi.recommendationsList.regularExercise'));
      recommendations.push(t('bmi.recommendationsList.balancedNutrition'));
      recommendations.push(t('bmi.recommendationsList.medicalCheckups'));
    } else if (bmi >= 25 && bmi < 30) {
      recommendations.push(t('bmi.recommendationsList.gradualWeightLoss'));
      recommendations.push(t('bmi.recommendationsList.increaseActivity'));
      recommendations.push(t('bmi.recommendationsList.portionControl'));
      recommendations.push(t('bmi.recommendationsList.dietitianConsultation'));
    } else if (bmi >= 30) {
      recommendations.push(t('bmi.recommendationsList.mandatoryConsultation'));
      recommendations.push(t('bmi.recommendationsList.weightLossProgram'));
      recommendations.push(t('bmi.recommendationsList.regularPhysicalExercise'));
      recommendations.push(t('bmi.recommendationsList.dietaryHabits'));
      if (bmi >= 35) {
        recommendations.push(t('bmi.recommendationsList.medicalTreatment'));
      }
    }

    if (gender === 'female') {
      recommendations.push(t('bmi.recommendationsList.hormonalConsideration'));
    } else {
      recommendations.push(t('bmi.recommendationsList.abdominalControl'));
    }

    setResults({
      bmi: Number(bmi.toFixed(1)),
      category: categoryInfo.category,
      categoryDescription: categoryInfo.description,
      healthRisk: categoryInfo.risk,
      normalWeightRange: { 
        min: Number(normalMinWeight.toFixed(1)), 
        max: Number(normalMaxWeight.toFixed(1)) 
      },
      weightDifference: Number(Math.abs(weightDifference).toFixed(1)),
      ageAdjustedCategory,
      recommendations
    });
  };

  useEffect(() => {
    calculateBMI();
  }, [height, weight, age, gender, heightUnit]);

  const formatWeight = (weight: number) => {
    return weight.toFixed(1) + ' ' + t('bmi.weightUnit');
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    if (bmi < 35) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBMIBackgroundColor = (bmi: number) => {
    if (bmi < 18.5) return 'from-blue-50 to-cyan-50';
    if (bmi < 25) return 'from-green-50 to-emerald-50';
    if (bmi < 30) return 'from-yellow-50 to-amber-50';
    if (bmi < 35) return 'from-orange-50 to-red-50';
    return 'from-red-50 to-pink-50';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('bmi.heading')}</h1>
            <p className="text-gray-600">{t('bmi.subtitle')}</p>
          </div>
        </div>
      </div>

      <QuickAnswer calculatorId="bmi" />

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('bmi.yourData')}</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  {t('bmi.height')}
                </label>
                <div className="flex border border-gray-300 rounded-lg ml-2">
                  <button
                    onClick={() => setHeightUnit('cm')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      heightUnit === 'cm'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } rounded-l-lg`}
                  >
                    {t('bmi.heightUnitCm')}
                  </button>
                  <button
                    onClick={() => setHeightUnit('m')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      heightUnit === 'm'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } rounded-r-lg`}
                  >
                    {t('bmi.heightUnitM')}
                  </button>
                </div>
              </div>

              <RangeSlider
                value={parseFloat(height) || (heightUnit === 'cm' ? 170 : 1.7)}
                onChange={(val) => setHeight(String(val))}
                min={heightUnit === 'cm' ? 100 : 1.0}
                max={heightUnit === 'cm' ? 220 : 2.2}
                step={heightUnit === 'cm' ? 1 : 0.01}
                formatValue={(v) => `${v} ${heightUnit}`}
                color="#3b82f6"
              />
              <InputField
                label=""
                value={height}
                onChange={setHeight}
                type="number"
                placeholder={heightUnit === 'cm' ? t('bmi.heightPlaceholderCm') : t('bmi.heightPlaceholderM')}
                step={heightUnit === 'cm' ? '1' : '0.01'}
                suffix={heightUnit}
                validation={validateHeight}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">{t('bmi.formulaTitle')}</h3>
              <p className="text-sm text-blue-800">
                <strong>{t('bmi.formulaText')}</strong>
                <br />
                {t('bmi.formulaDescription')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('bmi.weight')}
              </label>
              <RangeSlider
                value={parseFloat(weight) || 70}
                onChange={(val) => setWeight(String(val))}
                min={30}
                max={200}
                step={1}
                formatValue={(v) => `${v} кг`}
                color="#22c55e"
              />
              <InputField
                label=""
                value={weight}
                onChange={setWeight}
                type="number"
                placeholder={t('bmi.weightPlaceholder')}
                step="0.1"
                suffix={t('bmi.weightUnit')}
                validation={validateWeight}
              />
            </div>

            <InputField
              label={t('bmi.age')}
              value={age}
              onChange={setAge}
              type="number"
              placeholder={t('bmi.agePlaceholder')}
              step="1"
              suffix={t('bmi.ageUnit')}
              validation={validateAge}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('bmi.gender')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Users className="w-5 h-5 mx-auto mb-1 sm:mb-2" />
                  <div className="text-sm font-medium">{t('bmi.male')}</div>
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Heart className="w-5 h-5 mx-auto mb-1 sm:mb-2" />
                  <div className="text-sm font-medium">{t('bmi.female')}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('bmi.results')}</h2>

          {results.bmi > 0 ? (
            <div className="space-y-6">
              <div className={`bg-gradient-to-r ${getBMIBackgroundColor(results.bmi)} rounded-lg p-4 sm:p-6`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base sm:text-lg font-semibold text-gray-900">{t('bmi.yourBMI')}</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-6 h-6 text-gray-600" />
                    <span className={`text-2xl sm:text-3xl font-bold ${getBMIColor(results.bmi)}`}>
                      {results.bmi}
                    </span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {weight} {t('bmi.weightUnit')} ÷ ({heightUnit === 'cm' ? (parseFloat(height) / 100).toFixed(2) : height} {t('bmi.heightUnitM')})² = {results.bmi}
                </div>
              </div>

              {results.bmi > 0 && (
                <SharePrintButtons
                  title={t('bmi.exportTitle')}
                  description={t('bmi.exportDescription')}
                  results={generateExportData() || ''}
                  disabled={!generateExportData()}
                />
              )}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{t('bmi.whoClassification')}</h3>
                  <div className={`text-lg font-bold ${getBMIColor(results.bmi)} mb-1`}>
                    {results.category}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{results.categoryDescription}</div>
                  <div className="text-sm text-gray-700">{results.healthRisk}</div>
                </div>

                {parseInt(age) > 65 && results.ageAdjustedCategory !== results.category && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900">{t('bmi.ageAdjusted')}</h3>
                        <p className="text-blue-800 text-sm">{results.ageAdjustedCategory}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">{t('bmi.normalWeightRange')}</h3>
                  <div className="text-green-800">
                    <span className="text-lg font-bold">
                      {formatWeight(results.normalWeightRange.min)} - {formatWeight(results.normalWeightRange.max)}
                    </span>
                  </div>

                  {results.weightDifference > 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      {parseFloat(weight) < results.normalWeightRange.min ? (
                        <span>{t('bmi.recommendedGain')} <strong>{formatWeight(results.weightDifference)}</strong></span>
                      ) : parseFloat(weight) > results.normalWeightRange.max ? (
                        <span>{t('bmi.recommendedLoss')} <strong>{formatWeight(results.weightDifference)}</strong></span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{t('bmi.recommendations')}</h3>
                <div className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              {t('bmi.enterDataPrompt')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('bmi.classificationsTable')}</h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('bmi.bmiRange')}</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700">{t('bmi.category')}</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 hidden sm:table-cell">{t('bmi.categoryDescription')}</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-700 hidden md:table-cell">{t('bmi.healthRisk')}</th>
              </tr>
            </thead>
            <tbody>
              {bmiCategories.map((category, index) => (
                <tr key={index} className={`border-b border-gray-100 ${
                  results.bmi >= category.min && results.bmi < category.max ? 'bg-blue-50' : ''
                }`}>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium">
                    {category.min === 0 ? t('common:lessThan') + ' ' : ''}
                    {category.min > 0 ? category.min : ''}
                    {category.max !== Infinity ? ` - ${category.max}` : '+'}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-900">
                    {category.category}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 hidden sm:table-cell">
                    {category.description}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                    {category.risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('bmi.limitations')}
              </h3>
              <div className="text-amber-800 text-xs sm:text-sm space-y-1">
                <p>• {t('bmi.limitationsList.muscleVsFat')}</p>
                <p>• {t('bmi.limitationsList.athletes')}</p>
                <p>• {t('bmi.limitationsList.elderly')}</p>
                <p>• {t('bmi.limitationsList.pregnancy')}</p>
                <p>• {t('bmi.limitationsList.consultation')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('bmi.healthTips')}</h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🥗</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('bmi.balancedDiet')}</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              {t('bmi.balancedDietText')}
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('bmi.regularActivity')}</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              {t('bmi.regularActivityText')}
            </p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-teal-50 rounded-lg sm:col-span-2 lg:col-span-1">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😴</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{t('bmi.healthyLifestyle')}</h3>
            <p className="text-gray-600 text-xs sm:text-sm">
              {t('bmi.healthyLifestyleText')}
            </p>
          </div>
        </div>
      </div>

      {/* Medical sources (Apple App Store Guideline 1.4.1 compliance) */}
      <MedicalDisclaimer
        sources={[
          {
            title: 'WHO — A healthy lifestyle: BMI classification',
            url: 'https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations',
            description: 'World Health Organization. Официальные диапазоны ИМТ для классификации недостатка веса, нормы, избыточного веса и ожирения у взрослых.',
          },
          {
            title: 'CDC — About Adult BMI',
            url: 'https://www.cdc.gov/bmi/adult-calculator/index.html',
            description: 'Centers for Disease Control and Prevention. Методология расчёта ИМТ и интерпретация результатов для взрослых старше 20 лет.',
          },
          {
            title: 'NIH/NHLBI — Clinical Guidelines on the Identification, Evaluation, and Treatment of Overweight and Obesity in Adults',
            url: 'https://www.nhlbi.nih.gov/health-topics/managing-overweight-obesity-in-adults',
            description: 'National Heart, Lung, and Blood Institute. Клинические рекомендации, на которых основаны категории риска и пороги ожирения 1–3 степени.',
          },
          {
            title: 'NIH NLM — Body mass index: Considerations for practitioners',
            url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10484485/',
            description: 'Рецензируемая статья о применимости и ограничениях ИМТ как метрики (мышцы vs жир, спортсмены, пожилые, беременные).',
          },
        ]}
      />

      {/* FAQ */}
      <CalculatorExamples calculatorId="bmi" />
      <MethodologySection steps={getMethodology('bmi')} />
      <FAQSection
        items={[
          { question: t('bmi.faq.q1'), answer: t('bmi.faq.a1') },
          { question: t('bmi.faq.q2'), answer: t('bmi.faq.a2') },
          { question: t('bmi.faq.q3'), answer: t('bmi.faq.a3') },
          { question: t('bmi.faq.q4'), answer: t('bmi.faq.a4') },
          { question: t('bmi.faq.q5'), answer: t('bmi.faq.a5') }
        ]}
        sources={[
          { title: 'WHO — BMI Classification', url: 'https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations' },
          { title: 'CDC — About Adult BMI', url: 'https://www.cdc.gov/bmi/adult-calculator/index.html' },
          { title: 'NIH/NHLBI — Obesity Guidelines', url: 'https://www.nhlbi.nih.gov/health-topics/managing-overweight-obesity-in-adults' },
        ]}
      />

      {/* Диаграмма */}
      {results && results.bmi > 0 && results.idealWeight && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: 'Текущий вес', value: parseFloat(weight) || 0 },
              { name: 'Идеальный вес', value: results.idealWeight },
            ]}
            title="Сравнение веса"
          />
        </div>
      )}

      {/* Экспорт результатов */}
      {results && results.bmi > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Индекс массы тела',
              subtitle: results.category,
              sections: [
                {
                  title: 'Параметры',
                  data: [
                    { label: 'Вес', value: `${weight} кг` },
                    { label: 'Рост', value: `${height} см` },
                  ]
                },
                {
                  title: 'Результаты',
                  data: [
                    { label: 'ИМТ', value: results.bmi.toFixed(1) },
                    { label: 'Категория', value: results.category },
                    { label: 'Идеальный вес', value: `${results.idealWeight?.toFixed(1)} кг` },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="bmi-calculation"
          />
        </div>
      )}

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="bmi"
        calculatorTitle="Калькулятор ИМТ"
      />
      <LastUpdated calculatorId="bmi" />
    </div>
  );
}