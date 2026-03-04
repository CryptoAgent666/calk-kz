import React from 'react';
import { CalculatorCategory } from '../types/calculator';
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
  // Фильтруем категории по поисковому запросу
  const filteredCategories = searchCalculators(calculatorCategories, searchTerm);

  return (
    <CategoryList 
      categories={filteredCategories}
      onCategoryClick={onCategoryClick}
      recentCalculators={recentCalculators}
      onRecentCalculatorClick={onRecentCalculatorClick}
      onClearRecent={onClearRecent}
      searchTerm={searchTerm}
    />
  );
}