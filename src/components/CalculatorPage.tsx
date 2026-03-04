import React from 'react';
import { useParams } from 'react-router-dom';
import CalculatorView from './CalculatorView';

interface CalculatorPageProps {
  onBackClick: () => void;
  onCalculatorClick: (calculatorId: string) => void;
}

export default function CalculatorPage({ onBackClick, onCalculatorClick }: CalculatorPageProps) {
  const { calculatorId } = useParams<{ calculatorId: string }>();

  if (!calculatorId) {
    return <div>Калькулятор не найден</div>;
  }

  return (
    <CalculatorView
      calculatorId={calculatorId}
      onBackClick={onBackClick}
      onCalculatorClick={onCalculatorClick}
    />
  );
}