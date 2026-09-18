import { useTranslation } from 'react-i18next';
import { calculatorCategories } from '../data/calculators';
import { POPULAR_CALCULATOR_IDS } from '../data/popularCalculators';
import { getIcon } from '../utils/iconMap';
import LocalizedLink from './LocalizedLink';

interface PopularCalculatorsProps {
  onCalculatorClick: (calculatorId: string) => void;
}

export default function PopularCalculators({ onCalculatorClick }: PopularCalculatorsProps) {
  const { t } = useTranslation(['common', 'calculators']);
  const allCalculators = calculatorCategories.flatMap(category => category.calculators);
  const popular = POPULAR_CALCULATOR_IDS
    .map(id => allCalculators.find(calculator => calculator.id === id))
    .filter((calculator): calculator is NonNullable<typeof calculator> => Boolean(calculator));

  return (
    <nav aria-labelledby="popular-calculators-title" className="mb-8 sm:mb-12">
      <h2 id="popular-calculators-title" className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        {t('common:home.popularTitle')}
      </h2>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {popular.map(calculator => {
          const IconComponent = getIcon(calculator.icon);
          return (
            <li key={calculator.id}>
              <LocalizedLink
                to={`/calculator/${calculator.id}/`}
                onClick={() => onCalculatorClick(calculator.id)}
                className="group flex h-full min-h-[56px] items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 sm:p-3 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-blue-500 to-indigo-500">
                  <IconComponent className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm font-medium leading-snug text-gray-900 line-clamp-3 sm:line-clamp-2 group-hover:text-blue-700">
                  {t(`calculators:${calculator.id}.title`)}
                </span>
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
