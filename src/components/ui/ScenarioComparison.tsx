import React, { Suspense } from 'react';
import { DeferredRender } from './DeferredRender';
import type { ScenarioComparisonProps } from './ScenarioComparisonImpl';

const LazyScenarioComparison = React.lazy(() =>
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
  return (
    <DeferredRender minHeight={420} className="print:hidden">
      <Suspense fallback={<ScenarioPlaceholder />}>
        <LazyScenarioComparison {...props} />
      </Suspense>
    </DeferredRender>
  );
}

export default ScenarioComparison;


