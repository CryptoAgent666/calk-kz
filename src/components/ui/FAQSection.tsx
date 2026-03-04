import React, { Suspense, useState } from 'react';
import { DeferredRender } from './DeferredRender';
import type { FAQSectionProps, MethodologySectionProps } from './FAQSectionImpl';

const LazyFAQSection = React.lazy(() =>
  import('./FAQSectionImpl').then((module) => ({ default: module.FAQSection }))
);
const LazyMethodologySection = React.lazy(() =>
  import('./FAQSectionImpl').then((module) => ({ default: module.MethodologySection }))
);

function FAQPlaceholder() {
  return (
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div className="h-5 w-40 bg-blue-100 rounded mb-6 animate-pulse" />
      <div className="space-y-3">
        <div className="h-12 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
        <div className="h-12 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
        <div className="h-12 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
      </div>
    </div>
  );
}

export function FAQSection(props: FAQSectionProps) {
  return (
    <DeferredRender minHeight={320} className="print:hidden">
      <Suspense fallback={<FAQPlaceholder />}>
        <LazyFAQSection {...props} />
      </Suspense>
    </DeferredRender>
  );
}

export function MethodologySection(props: MethodologySectionProps) {
  return (
    <DeferredRender minHeight={160} className="print:hidden">
      <Suspense fallback={<div className="mt-6" />}>
        <LazyMethodologySection {...props} />
      </Suspense>
    </DeferredRender>
  );
}

// Всплывающая подсказка для терминов
interface TooltipProps {
  term: string;
  explanation: string;
  children?: React.ReactNode;
}

export function TermTooltip({ term, explanation, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="border-b border-dashed border-gray-400 cursor-help"
      >
        {children || term}
      </span>

      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
          <div className="font-semibold mb-1">{term}</div>
          <div className="text-gray-300 text-xs leading-relaxed">{explanation}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  );
}

export default FAQSection;

