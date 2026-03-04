import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, ChevronRight } from 'lucide-react';
import { calculatorCategories } from '../data/calculators';
import { getIcon } from '../utils/iconMap';

interface RelatedCalculatorsProps {
  currentCalculatorId?: string;
  currentCategoryId?: string;
  onCalculatorClick: (calculatorId: string) => void;
}

export default function RelatedCalculators({
  currentCalculatorId,
  currentCategoryId,
  onCalculatorClick
}: RelatedCalculatorsProps) {
  const { t } = useTranslation(['common', 'categories', 'calculators']);
  // Функция для получения связанных калькуляторов
  const getRelatedCalculators = () => {
    const allCalculators = calculatorCategories.flatMap(category =>
      category.calculators.map(calc => ({ ...calc, categoryId: category.id }))
    );

    // Исключаем текущий калькулятор
    const availableCalculators = allCalculators.filter(calc => calc.id !== currentCalculatorId);

    let relatedCalculators = [];

    if (currentCategoryId) {
      // Если мы на странице категории, показываем калькуляторы из этой категории
      const categoryCalculators = availableCalculators.filter(calc => calc.category === currentCategoryId);
      relatedCalculators = categoryCalculators.slice(0, 4);
      
      // Если в категории мало калькуляторов, добавляем из других категорий
      if (relatedCalculators.length < 4) {
        const otherCalculators = availableCalculators
          .filter(calc => calc.category !== currentCategoryId)
          .slice(0, 4 - relatedCalculators.length);
        relatedCalculators = [...relatedCalculators, ...otherCalculators];
      }
    } else if (currentCalculatorId) {
      // Если мы на странице калькулятора, находим его категорию
      const currentCalculator = allCalculators.find(calc => calc.id === currentCalculatorId);
      const currentCategory = currentCalculator?.category;

      if (currentCategory) {
        // Сначала берем калькуляторы из той же категории
        const sameCategoryCalculators = availableCalculators
          .filter(calc => calc.category === currentCategory)
          .slice(0, 3);
        
        relatedCalculators = [...sameCategoryCalculators];
        
        // Если недостаточно, добавляем из других категорий
        if (relatedCalculators.length < 4) {
          const otherCalculators = availableCalculators
            .filter(calc => calc.category !== currentCategory)
            .slice(0, 4 - relatedCalculators.length);
          relatedCalculators = [...relatedCalculators, ...otherCalculators];
        }
      }
    } else {
      // Если нет контекста, показываем популярные калькуляторы
      const popularCalculatorIds = ['income-tax', 'salary', 'credit', 'currency-converter', 'bmi', 'percentage'];
      relatedCalculators = popularCalculatorIds
        .map(id => availableCalculators.find(calc => calc.id === id))
        .filter(Boolean)
        .slice(0, 4) as typeof availableCalculators;
    }

    return relatedCalculators.slice(0, 4);
  };

  const relatedCalculators = getRelatedCalculators();

  if (relatedCalculators.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{t('common:related.title')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedCalculators.map((calculator) => {
          const IconComponent = getIcon(calculator.icon);
          
          return (
            <button
              key={calculator.id}
              onClick={() => onCalculatorClick(calculator.id)}
              className="group p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {t(`calculators:${calculator.id}.title`)}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {t(`categories:${calculator.categoryId}.title`)}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <span>{t('common:related.goTo')}</span>
                    <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}