import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { calculatorCategories } from '../data/calculators';
import { ArrowLeft } from 'lucide-react';
import RelatedCalculators from './RelatedCalculators';
import Breadcrumbs from './Breadcrumbs';
import { DeferredRender } from './ui/DeferredRender';

interface CalculatorViewProps {
  calculatorId: string;
  onBackClick: () => void;
  onCalculatorClick: (calculatorId: string) => void;
}

export default function CalculatorView({ calculatorId, onBackClick, onCalculatorClick }: CalculatorViewProps) {
  const { t } = useTranslation(['common', 'categories', 'calculators']);

  // Найти калькулятор по ID
  let calculator = null;
  let category = null;
  for (const cat of calculatorCategories) {
    const found = cat.calculators.find(calc => calc.id === calculatorId);
    if (found) {
      calculator = found;
      category = cat;
      break;
    }
  }

  if (!calculator) {
    return <div>{t('common:calculator.notFound')}</div>;
  }

  const CalculatorComponent = calculator.component;
  const CalculatorSkeleton = () => (
    <div className="min-h-[1100px]">
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-56 bg-gray-200 rounded" />
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="h-64 bg-white rounded-xl border border-gray-100 shadow-sm" />
          <div className="h-64 bg-white rounded-xl border border-gray-100 shadow-sm" />
          <div className="h-64 bg-white rounded-xl border border-gray-100 shadow-sm hidden lg:block" />
        </div>
        <div className="h-72 bg-white rounded-xl border border-gray-100 shadow-sm" />
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBackClick}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common:calculator.back')}</span>
        </button>

        {category && (
          <Breadcrumbs
            items={[
              { label: t(`categories:${category.id}.title`), path: `/category/${category.id}/` },
              { label: t(`calculators:${calculator.id}.title`) }
            ]}
          />
        )}

      </div>

      <Suspense fallback={<CalculatorSkeleton />}>
        <CalculatorComponent />
      </Suspense>

      <DeferredRender minHeight={240}>
        <RelatedCalculators
          currentCalculatorId={calculatorId}
          onCalculatorClick={onCalculatorClick}
        />
      </DeferredRender>
    </div>
  );
}