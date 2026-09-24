import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../../hooks/useFavorites';
import { toggleFavorite } from '../../utils/favorites';

/**
 * «☆ В избранное» на странице калькулятора (сайт и приложение).
 * В статике пререндера и в первом рендере — всегда «не в избранном»,
 * настоящее состояние подставляется после маунта (см. useFavorites).
 */
export function FavoriteButton({ calculatorId }: { calculatorId: string }) {
  const { t } = useTranslation('common');
  const { favorites } = useFavorites();
  const active = favorites.includes(calculatorId);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(calculatorId)}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Star className={`h-4 w-4 ${active ? 'fill-amber-400 text-amber-500' : 'text-gray-400'}`} />
      <span>{active ? t('favorites.saved') : t('favorites.add')}</span>
    </button>
  );
}
