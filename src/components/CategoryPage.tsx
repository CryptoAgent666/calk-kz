import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CalculatorList from './CalculatorList';

interface CategoryPageProps {
  onCalculatorClick: (calculatorId: string) => void;
  onBackClick: () => void;
}

export default function CategoryPage({ onCalculatorClick, onBackClick }: CategoryPageProps) {
  const { t } = useTranslation('common');
  const { categoryId } = useParams<{ categoryId: string }>();

  if (!categoryId) {
    return <div>{t('notFound.title')}</div>;
  }

  return (
    <CalculatorList
      categoryId={categoryId}
      onCalculatorClick={onCalculatorClick}
      onBackClick={onBackClick}
    />
  );
}