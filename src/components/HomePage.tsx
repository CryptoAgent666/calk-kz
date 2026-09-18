import { useMemo } from 'react';
import { searchCalculators } from '../utils/search';
import { calculatorCategories } from '../data/calculators';
import CategoryList from './CategoryList';

interface HomePageProps {
  onCategoryClick: (categoryId: string) => void;
  recentCalculators: string[];
  onRecentCalculatorClick: (calculatorId: string) => void;
  onClearRecent: () => void;
  searchTerm: string;
}

export default function HomePage({ 
  onCategoryClick,
  recentCalculators,
  onRecentCalculatorClick,
  onClearRecent,
  searchTerm 
}: HomePageProps) {
  const searchHits = useMemo(() => searchCalculators(searchTerm), [searchTerm]);

  return (
    <CategoryList
      categories={calculatorCategories}
      searchHits={searchHits}
      onCategoryClick={onCategoryClick}
      recentCalculators={recentCalculators}
      onRecentCalculatorClick={onRecentCalculatorClick}
      onClearRecent={onClearRecent}
      searchTerm={searchTerm}
    />
  );
}