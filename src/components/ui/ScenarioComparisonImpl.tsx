import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ScenarioData {
  id: string;
  name: string;
  params: Record<string, number | string>;
  results: Record<string, number>;
}

export interface ScenarioComparisonProps {
  maxScenarios?: number;
  paramFields: {
    key: string;
    label: string;
    type: 'number' | 'select';
    options?: { value: string | number; label: string }[];
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  }[];
  resultFields: {
    key: string;
    label: string;
    format?: (value: number) => string;
    highlight?: boolean;
    higherIsBetter?: boolean;
  }[];
  calculateResults: (params: Record<string, number | string>) => Record<string, number>;
  title?: string;
  defaultParams?: Record<string, number | string>;
}

export function ScenarioComparison({
  maxScenarios = 3,
  paramFields,
  resultFields,
  calculateResults,
  title,
  defaultParams = {}
}: ScenarioComparisonProps) {
  const { t } = useTranslation('common');
  const displayTitle = title || t('scenarios.title');

  const [scenarios, setScenarios] = useState<ScenarioData[]>([
    {
      id: '1',
      name: `${t('scenarios.scenario')} 1`,
      params: { ...defaultParams },
      results: calculateResults(defaultParams)
    }
  ]);

  const addScenario = () => {
    if (scenarios.length >= maxScenarios) return;

    const newId = String(Date.now());
    const newScenario: ScenarioData = {
      id: newId,
      name: `${t('scenarios.scenario')} ${scenarios.length + 1}`,
      params: { ...defaultParams },
      results: calculateResults(defaultParams)
    };
    setScenarios([...scenarios, newScenario]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const updateScenarioParam = (id: string, key: string, value: number | string) => {
    setScenarios(scenarios.map(s => {
      if (s.id !== id) return s;
      const newParams = { ...s.params, [key]: value };
      return {
        ...s,
        params: newParams,
        results: calculateResults(newParams)
      };
    }));
  };

  const updateScenarioName = (id: string, name: string) => {
    setScenarios(scenarios.map(s =>
      s.id === id ? { ...s, name } : s
    ));
  };

  const formatValue = (field: typeof resultFields[0], value: number) => {
    if (field.format) return field.format(value);
    return value.toLocaleString('ru-KZ');
  };

  const getDifference = (field: typeof resultFields[0], value: number, baseValue: number) => {
    const diff = value - baseValue;
    if (Math.abs(diff) < 0.01) return null;

    const percentage = baseValue !== 0 ? ((diff / baseValue) * 100).toFixed(1) : '∞';
    const isPositive = diff > 0;
    const isBetter = field.higherIsBetter ? isPositive : !isPositive;

    return { diff, percentage, isPositive, isBetter };
  };

  return (
    <div className="mt-8 print:hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            {displayTitle}
          </h3>

          {scenarios.length < maxScenarios && (
            <button
              onClick={addScenario}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg 
                       hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t('scenarios.addScenario')}</span>
            </button>
          )}
        </div>

        {/* Сценарии */}
        <div className={`grid gap-4 ${scenarios.length === 1 ? 'grid-cols-1' : scenarios.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {scenarios.map((scenario, index) => (
            <div
              key={scenario.id}
              className={`bg-white rounded-xl p-5 border-2 transition-all ${
                index === 0 ? 'border-purple-300 shadow-md' : 'border-gray-200'
              }`}
            >
              {/* Заголовок сценария */}
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(e) => updateScenarioName(scenario.id, e.target.value)}
                  className="font-semibold text-gray-800 bg-transparent border-b border-transparent 
                           hover:border-gray-300 focus:border-purple-500 focus:outline-none px-1"
                />
                {scenarios.length > 1 && (
                  <button
                    onClick={() => removeScenario(scenario.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Параметры */}
              <div className="space-y-3 mb-4">
                {paramFields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                    {field.type === 'number' ? (
                      <div className="relative">
                        <input
                          type="number"
                          value={scenario.params[field.key] || ''}
                          onChange={(e) => updateScenarioParam(scenario.id, field.key, Number(e.target.value))}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 
                                   focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                        {field.suffix && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            {field.suffix}
                          </span>
                        )}
                      </div>
                    ) : (
                      <select
                        value={scenario.params[field.key] || ''}
                        onChange={(e) => updateScenarioParam(scenario.id, field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 
                                 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        {field.options?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              {/* Результаты */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                {resultFields.map(field => {
                  const value = scenario.results[field.key] || 0;
                  const baseValue = scenarios[0]?.results[field.key] || 0;
                  const diff = index > 0 ? getDifference(field, value, baseValue) : null;

                  return (
                    <div
                      key={field.key}
                      className={`flex justify-between items-center p-2 rounded-lg ${
                        field.highlight ? 'bg-purple-50' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">{field.label}</span>
                      <div className="text-right">
                        <span className={`font-semibold ${field.highlight ? 'text-purple-700' : 'text-gray-800'}`}>
                          {formatValue(field, value)}
                        </span>
                        {diff && (
                          <div className={`text-xs flex items-center justify-end gap-1 ${
                            diff.isBetter ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {diff.isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{diff.isPositive ? '+' : ''}{diff.percentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {scenarios.length > 1 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <ArrowRight className="w-4 h-4 inline mr-1" />
            Сравнение относительно первого сценария
          </div>
        )}
      </div>
    </div>
  );
}

export default ScenarioComparison;
