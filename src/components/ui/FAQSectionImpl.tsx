import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export interface FAQSectionProps {
  title?: string;
  items: FAQItem[];
  defaultOpen?: number;
  sources?: { title: string; url: string }[];
}

export function FAQSection({
  title,
  items,
  defaultOpen,
  sources
}: FAQSectionProps) {
  const { t } = useTranslation('common');
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen ?? null);
  const displayTitle = title || t('faq.title');

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-8 print:hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">{displayTitle}</h3>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800 pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 
                    ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out
                  ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="p-4 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sources && sources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-500 mb-2 font-medium">{t('faq.officialSources')}</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 
                           hover:underline bg-white px-3 py-1 rounded-full border border-blue-200"
                >
                  {source.title}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент для пошагового объяснения методологии
interface MethodologyStep {
  step: number;
  title: string;
  description: string;
  formula?: string;
}

export interface MethodologySectionProps {
  title?: string;
  steps: MethodologyStep[];
}

export function MethodologySection({
  title,
  steps
}: MethodologySectionProps) {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);
  const displayTitle = title || t('faq.howCalculated');

  return (
    <div className="mt-6 print:hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <span>{displayTitle}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{step.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                  {step.formula && (
                    <code className="block mt-2 bg-white px-3 py-2 rounded-lg text-sm font-mono text-blue-800 border border-gray-200">
                      {step.formula}
                    </code>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
