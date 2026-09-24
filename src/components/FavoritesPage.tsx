import { useTranslation } from 'react-i18next';
import { Star, ArrowLeft, X, ChevronRight } from 'lucide-react';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import { useFavorites } from '../hooks/useFavorites';
import { removeFavorite } from '../utils/favorites';
import { findCalculator } from '../utils/findCalculator';
import { getIcon } from '../utils/iconMap';
import LocalizedLink from './LocalizedLink';

/**
 * /favorites — все отмеченные звёздочкой калькуляторы (клиентская страница,
 * без пререндера, как /history). Хранится только на устройстве.
 */
export default function FavoritesPage() {
  const { t } = useTranslation(['common', 'categories', 'calculators']);
  const navigate = useLocalizedNavigate();
  const { favorites, ready } = useFavorites();

  const items = favorites
    .map((id) => findCalculator(id))
    .filter((x): x is NonNullable<ReturnType<typeof findCalculator>> => x !== null);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common:calculator.back')}</span>
      </button>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common:favorites.title')}</h1>
          <p className="text-sm text-gray-500">{t('common:favorites.subtitle')}</p>
        </div>
      </div>

      {ready && items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          <Star className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-700">{t('common:favorites.emptyTitle')}</p>
          <p className="mt-1 text-sm">{t('common:favorites.emptyText')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ calculator, category }) => {
            const IconComponent = getIcon(calculator.icon);
            return (
              <div key={calculator.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <LocalizedLink
                  to={`/calculator/${calculator.id}/`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-gray-900 group-hover:text-blue-700">
                      {t(`calculators:${calculator.id}.title`)}
                    </div>
                    <div className="truncate text-xs text-gray-500">{t(`categories:${category.id}.title`)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                </LocalizedLink>
                <button
                  onClick={() => removeFavorite(calculator.id)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={t('common:favorites.remove')}
                  title={t('common:favorites.remove')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">{t('common:favorites.privacyNote')}</p>
    </div>
  );
}
