import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getExamples, hasExamples } from '../../data/calculatorExamples';

interface CalculatorExamplesProps {
  calculatorId: string;
}

/**
 * Блок «Примеры расчёта» с конкретными цифрами.
 * Помогает пользователям понять как работает калькулятор + повышает доверие.
 * Структурированные примеры — отличный контент для AI-цитирования.
 */
export function CalculatorExamples({ calculatorId }: CalculatorExamplesProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'kk' ? 'kk' : 'ru';
  if (!hasExamples(calculatorId)) return null;
  const examples = getExamples(calculatorId, lang);
  if (!examples || examples.length === 0) return null;

  const label = lang === 'kk' ? 'Есептеу мысалдары' : 'Примеры расчёта';

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-purple-100 rounded-xl">
          <Lightbulb className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">{label}</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map((ex, i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="font-semibold text-gray-900 mb-2">{ex.title}</div>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">{ex.scenario}</p>
            <div className="text-base font-bold text-purple-700 mb-2">{ex.result}</div>
            {ex.details && ex.details.length > 0 && (
              <ul className="text-xs text-gray-500 space-y-0.5 mt-2 pt-2 border-t border-gray-100">
                {ex.details.map((d, j) => (
                  <li key={j}>• {d}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
