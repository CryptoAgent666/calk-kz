import { useTranslation } from 'react-i18next';
import { getIcon } from '../utils/iconMap';
import type { SearchHit } from '../utils/search';
import LocalizedLink from './LocalizedLink';

interface SearchResultsProps {
  hits: SearchHit[];
  onCalculatorClick: (calculatorId: string) => void;
}

/** Выдача поиска — сразу калькуляторы, без промежуточной карточки категории */
export default function SearchResults({ hits, onCalculatorClick }: SearchResultsProps) {
  const { t } = useTranslation(['common', 'categories', 'calculators']);

  return (
    <>
      <p className="mb-4 sm:mb-6 text-gray-600">{t('common:search.resultsCount', { count: hits.length })}</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {hits.map(({ calculator, category }) => {
          const IconComponent = getIcon(calculator.icon);
          return (
            <li key={calculator.id}>
              <LocalizedLink
                to={`/calculator/${calculator.id}/`}
                onClick={() => onCalculatorClick(calculator.id)}
                className="group flex h-full items-start gap-3 sm:gap-4 rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 block text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                    {t(`calculators:${calculator.id}.title`)}
                  </span>
                  <span className="mb-1.5 text-xs sm:text-sm leading-relaxed text-gray-600 line-clamp-2">
                    {t(`calculators:${calculator.id}.description`)}
                  </span>
                  <span className="block text-xs text-gray-500">{t(`categories:${category.id}.title`)}</span>
                </span>
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </>
  );
}
