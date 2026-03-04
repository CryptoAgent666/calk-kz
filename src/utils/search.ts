import { CalculatorCategory } from '../types/calculator';

export function searchCalculators(
  categories: CalculatorCategory[], 
  searchTerm: string
): CalculatorCategory[] {
  if (!searchTerm.trim()) {
    return categories;
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  const filteredCategories = categories.map(category => {
    // Проверяем совпадение в названии или описании категории
    const categoryMatches = 
      category.title.toLowerCase().includes(normalizedSearch) ||
      category.description.toLowerCase().includes(normalizedSearch);

    // Фильтруем калькуляторы в категории
    const matchingCalculators = category.calculators.filter(calculator =>
      calculator.title.toLowerCase().includes(normalizedSearch) ||
      calculator.description.toLowerCase().includes(normalizedSearch)
    );

    // Если категория подходит или есть подходящие калькуляторы
    if (categoryMatches || matchingCalculators.length > 0) {
      return {
        ...category,
        calculators: categoryMatches ? category.calculators : matchingCalculators
      };
    }

    return null;
  }).filter(Boolean) as CalculatorCategory[];

  return filteredCategories;
}

function getSearchSuggestions(
  categories: CalculatorCategory[], 
  searchTerm: string,
  maxSuggestions: number = 5
): string[] {
  if (!searchTerm.trim()) {
    return [];
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const suggestions: string[] = [];

  // Собираем все возможные варианты
  const allTerms: string[] = [];
  
  categories.forEach(category => {
    allTerms.push(category.title);
    category.calculators.forEach(calculator => {
      allTerms.push(calculator.title);
      // Добавляем ключевые слова из описания
      const words = calculator.description.split(' ').filter(word => word.length > 3);
      allTerms.push(...words);
    });
  });

  // Находим подходящие термины
  allTerms.forEach(term => {
    if (term.toLowerCase().includes(normalizedSearch) && 
        !suggestions.includes(term) && 
        suggestions.length < maxSuggestions) {
      suggestions.push(term);
    }
  });

  return suggestions;
}