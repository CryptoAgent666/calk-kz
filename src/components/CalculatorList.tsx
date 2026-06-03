import React from 'react';
import { useTranslation } from 'react-i18next';
import { calculatorCategories } from '../data/calculators';
import { CalculatorCategory } from '../types/calculator';
import { ArrowLeft } from 'lucide-react';
import { getIcon } from '../utils/iconMap';
import LocalizedLink from './LocalizedLink';

interface CalculatorListProps {
  categoryId: string;
  onCalculatorClick: (calculatorId: string) => void;
  onBackClick: () => void;
}

export default function CalculatorList({ categoryId, onCalculatorClick, onBackClick }: CalculatorListProps) {
  const { t } = useTranslation(['common', 'categories', 'calculators']);
  const category = calculatorCategories.find(cat => cat.id === categoryId);

  if (!category) {
    return <div>{t('common:notFound.title')}</div>;
  }

  const IconComponent = getIcon(category.icon);

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBackClick}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common:navigation.backToCategories')}</span>
        </button>

        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t(`categories:${category.id}.title`)}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t(`categories:${category.id}.description`)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {category.calculators.map((calculator) => {
          const CalcIconComponent = getIcon(calculator.icon);
          
          return (
            <LocalizedLink
              key={calculator.id}
              to={`/calculator/${calculator.id}/`}
              onClick={() => onCalculatorClick(calculator.id)}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group transform hover:scale-[1.02]"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <CalcIconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-700 transition-colors">
                    {t(`calculators:${calculator.id}.title`)}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {t(`calculators:${calculator.id}.description`)}
                  </p>
                </div>
              </div>
            </LocalizedLink>
          );
        })}
      </div>
    </div>
  );
}