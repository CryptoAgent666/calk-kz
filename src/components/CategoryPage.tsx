import { useParams } from 'react-router-dom';
import { calculatorCategories } from '../data/calculators';
import { useLocalizedNavigate } from '../hooks/useLocalizedNavigate';
import CalculatorList from './CalculatorList';
import NotFoundPage from './NotFoundPage';

interface CategoryPageProps {
  onCalculatorClick: (calculatorId: string) => void;
  onBackClick: () => void;
}

export default function CategoryPage({ onCalculatorClick, onBackClick }: CategoryPageProps) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useLocalizedNavigate();

  const categoryExists = categoryId && calculatorCategories.some(cat => cat.id === categoryId);

  if (!categoryId || !categoryExists) {
    return <NotFoundPage onNavigateHome={() => navigate('/')} />;
  }

  return (
    <CalculatorList
      categoryId={categoryId}
      onCalculatorClick={onCalculatorClick}
      onBackClick={onBackClick}
    />
  );
}