import React, { Suspense } from 'react';
import type { ScenarioComparisonProps } from './ScenarioComparisonImpl';
import { useLazyWithoutSuspense } from '../../utils/lazyReady';

// Экспортируется для прогрева в main.tsx (см. primeRouteChunk): на
// пререндеренной странице обёртка <Suspense> не должна попадать в дерево.
export const LazyScenarioComparison = React.lazy(() =>
  import('./ScenarioComparisonImpl').then((module) => ({ default: module.ScenarioComparison }))
);

function ScenarioPlaceholder() {
  return (
    <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
      <div className="h-5 w-44 bg-purple-100 rounded mb-6 animate-pulse" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="h-48 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
        <div className="h-48 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
      </div>
    </div>
  );
}

export function ScenarioComparison(props: ScenarioComparisonProps) {
  // Как в CalculatorView: если чанк уже прогрет (main.tsx делает это до
  // hydrateRoot), рендерим без Suspense — граница ломает гидратацию статики.
  const skipSuspense = useLazyWithoutSuspense(LazyScenarioComparison, 'scenario-comparison');
  return (
    <div className="print:hidden">
      {skipSuspense ? (
        <LazyScenarioComparison {...props} />
      ) : (
        <Suspense fallback={<ScenarioPlaceholder />}>
          <LazyScenarioComparison {...props} />
        </Suspense>
      )}
    </div>
  );
}

export default ScenarioComparison;


