import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalculatorCategory } from '../types/calculator';
import { ChevronRight } from 'lucide-react';
import { getIcon } from '../utils/iconMap';
import { pluralize } from '../utils/pluralize';
import LocalizedLink from './LocalizedLink';

interface CategoryCardProps {
  category: CalculatorCategory;
  onCategoryClick: (categoryId: string) => void;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { t, i18n } = useTranslation(['common', 'categories']);
  const IconComponent = getIcon(category.icon);

  return (
    <LocalizedLink
      to={`/category/${category.id}/`}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group transform hover:scale-[1.02] min-h-[140px] flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-h-[80px] flex flex-col justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
              {t(`categories:${category.id}.title`)}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3">
              {t(`categories:${category.id}.description`)}
            </p>
            <div className="text-xs text-gray-500">
              {category.calculators.length} {pluralize(i18n.language, category.calculators.length, t('common:footer.calculators'), t('common:footer.calculatorsFew'), t('common:footer.calculatorsPlural'))}
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </LocalizedLink>
  );
}