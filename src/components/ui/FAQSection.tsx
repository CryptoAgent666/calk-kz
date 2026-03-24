import React, { useState } from 'react';
import {
  FAQSection as FAQSectionImpl,
  MethodologySection as MethodologySectionImpl
} from './FAQSectionImpl';
import type { FAQSectionProps, MethodologySectionProps } from './FAQSectionImpl';

// FAQ и Methodology рендерятся сразу (без DeferredRender) —
// AI-краулеры (GPTBot, ClaudeBot, PerplexityBot) не скроллят страницу,
// и IntersectionObserver скрывал бы от них самый цитируемый контент.
export function FAQSection(props: FAQSectionProps) {
  return <FAQSectionImpl {...props} />;
}

export function MethodologySection(props: MethodologySectionProps) {
  return <MethodologySectionImpl {...props} />;
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

