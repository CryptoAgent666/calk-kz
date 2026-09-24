import { useTranslation } from 'react-i18next';
import { CalculatorCategory } from '../types/calculator';
import type { SearchHit } from '../utils/search';
import CategoryCard from './CategoryCard';
import RecentCalculators from './RecentCalculators';
import FavoriteCalculators from './FavoriteCalculators';
import PopularCalculators from './PopularCalculators';
import { useMounted } from '../hooks/useMounted';
import SearchResults from './SearchResults';
import LocalizedLink from './LocalizedLink';
import { Search, Calculator as CalculatorIcon } from 'lucide-react';

interface CategoryListProps {
  categories: CalculatorCategory[];
  searchHits: SearchHit[];
  onCategoryClick: (categoryId: string) => void;
  recentCalculators: string[];
  onRecentCalculatorClick: (calculatorId: string) => void;
  onClearRecent: () => void;
  searchTerm: string;
}

export default function CategoryList({
  categories,
  searchHits,
  onCategoryClick,
  recentCalculators,
  onRecentCalculatorClick,
  onClearRecent,
  searchTerm
}: CategoryListProps) {
  const { t } = useTranslation('common');
  // Личные блоки (избранное, недавние) — из localStorage, их нет в статике
  // пререндера: до маунта не рисуем, иначе у вернувшегося пользователя первый
  // рендер главной не совпадал со статикой (гидратация падала целиком).
  const mounted = useMounted();
  const isSearching = searchTerm.trim().length > 0;
  const hasResults = searchHits.length > 0;
  // Без поиска и при пустой выдаче показываем популярные и все категории
  const showCatalog = !isSearching || !hasResults;

  return (
    <div>
      {/* Main Header */}
      {!isSearching ? (
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('home.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('home.subtitle')}
          </p>
        </div>
      ) : (
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {t('search.searchTitle', { term: searchTerm })}
          </h1>
          <p className="text-lg text-gray-600">
            {t('search.searchResults', { term: searchTerm })}
          </p>
        </div>
      )}

      {/* Search Results */}
      {isSearching && hasResults && (
        <div className="mb-12">
          <SearchResults hits={searchHits} onCalculatorClick={onRecentCalculatorClick} />
        </div>
      )}

      {/* Search Results - No Results Message */}
      {isSearching && !hasResults && (
        <div className="mb-8 text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {t('search.noResults')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('search.noResultsDesc')}
          </p>
          <LocalizedLink
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <CalculatorIcon className="w-4 h-4" />
            <span>{t('search.showAll')}</span>
          </LocalizedLink>
        </div>
      )}

      {showCatalog && <PopularCalculators onCalculatorClick={onRecentCalculatorClick} />}

      {/* Избранное (только если не поиск и что-то отмечено звёздочкой) */}
      {mounted && !isSearching && <FavoriteCalculators onCalculatorClick={onRecentCalculatorClick} />}

      {/* Recent Calculators (только если не поиск и есть недавние) */}
      {mounted && !isSearching && recentCalculators.length > 0 && (
        <div className="mb-12">
          <RecentCalculators
            recentCalculators={recentCalculators}
            onCalculatorClick={onRecentCalculatorClick}
            onClearRecent={onClearRecent}
          />
          
          {/* Визуальный разделитель */}
          <div className="mt-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <div className="px-4 text-sm text-gray-500 bg-gray-50 rounded-full py-1">
              {t('search.allCalculators')}
            </div>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {showCatalog && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-h-[600px]">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onCategoryClick={onCategoryClick}
            />
          ))}
        </div>
      )}

      {/* Features Section (только если не поиск) */}
      {!isSearching && (
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('home.whyChoose')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('home.feature1Title')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('home.feature1Desc')}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('home.feature2Title')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('home.feature2Desc')}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('home.feature3Title')}</h3>
                  <p className="text-gray-600 text-sm">
                    {t('home.feature3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}