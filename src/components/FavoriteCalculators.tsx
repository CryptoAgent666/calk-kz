import { useTranslation } from 'react-i18next';
import { Star, ChevronRight } from 'lucide-react';
import { getIcon } from '../utils/iconMap';
import { findCalculator } from '../utils/findCalculator';
import { useFavorites } from '../hooks/useFavorites';
import LocalizedLink from './LocalizedLink';

const HOME_LIMIT = 6;

/**
 * Блок «Избранное» на главной. Появляется только после маунта и только если
 * что-то отмечено звёздочкой (статика пререндера его не содержит).
 */
export default function FavoriteCalculators({ onCalculatorClick }: { onCalculatorClick: (id: string) => void }) {
  const { t } = useTranslation(['common', 'categories', 'calculators']);
  const { favorites } = useFavorites();

  const items = favorites
    .map((id) => findCalculator(id))
    .filter((x): x is NonNullable<ReturnType<typeof findCalculator>> => x !== null);
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{t('common:favorites.title')}</h2>
        </div>
        {items.length > HOME_LIMIT && (
          <LocalizedLink to="/favorites/" className="text-sm text-blue-600 hover:text-blue-800">
            {t('common:favorites.showAll', { count: items.length })}
          </LocalizedLink>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.slice(0, HOME_LIMIT).map(({ calculator, category }) => {
          const IconComponent = getIcon(calculator.icon);
          return (
            <LocalizedLink
              key={calculator.id}
              to={`/calculator/${calculator.id}/`}
              onClick={() => onCalculatorClick(calculator.id)}
              className="group block p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-sm transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                    {t(`calculators:${calculator.id}.title`)}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{t(`categories:${category.id}.title`)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-all flex-shrink-0" />
              </div>
            </LocalizedLink>
          );
        })}
      </div>
    </div>
  );
}
