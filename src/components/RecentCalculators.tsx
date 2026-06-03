import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { calculatorCategories } from '../data/calculators';
import { getIcon } from '../utils/iconMap';
import LocalizedLink from './LocalizedLink';

interface RecentCalculatorsProps {
  recentCalculators: string[];
  onCalculatorClick: (calculatorId: string) => void;
  onClearRecent: () => void;
}

export default function RecentCalculators({
  recentCalculators,
  onCalculatorClick,
  onClearRecent
}: RecentCalculatorsProps) {
  const { t } = useTranslation(['common', 'categories', 'calculators']);
  if (recentCalculators.length === 0) {
    return null;
  }

  // Найти данные калькуляторов по ID
  const getCalculatorData = (calculatorId: string) => {
    for (const category of calculatorCategories) {
      const calculator = category.calculators.find(calc => calc.id === calculatorId);
      if (calculator) {
        return { calculator, category };
      }
    }
    return null;
  };

  const recentCalculatorData = recentCalculators
    .map(id => getCalculatorData(id))
    .filter(Boolean)
    .slice(0, 6); // Показываем максимум 6 недавних

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 min-h-[200px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{t('common:recent.title')}</h2>
        </div>
        <button
          onClick={onClearRecent}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {t('common:recent.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[120px]">
        {recentCalculatorData.map((data) => {
          if (!data) return null;
          
          const { calculator, category } = data;
          const IconComponent = getIcon(calculator.icon);
          
          return (
            <LocalizedLink
              key={calculator.id}
              to={`/calculator/${calculator.id}/`}
              onClick={() => onCalculatorClick(calculator.id)}
              className="group block p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                    {t(`calculators:${calculator.id}.title`)}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1 line-clamp-2">
                    {t(`categories:${category.id}.title`)}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{t('common:recent.recentlyUsed')}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </LocalizedLink>
          );
        })}
      </div>
    </div>
  );
}