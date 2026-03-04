import React, { Suspense } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { calculatorCategories } from '../data/calculators';

const parseBooleanParam = (value: string | null, fallback: boolean) => {
  if (value === null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return fallback;
};

const resolveCalculatorId = (pathname: string, paramId?: string) => {
  if (paramId) return paramId;
  const cleanedPath = pathname.replace(/\/+$/, '');
  const [, id] = cleanedPath.split('/embed/');
  return id || '';
};

export default function EmbedPage() {
  const params = useParams<{ calculatorId: string }>();
  const location = useLocation();
  const calculatorId = resolveCalculatorId(location.pathname, params.calculatorId);
  const { t } = useTranslation(['common', 'calculators']);
  const searchParams = new URLSearchParams(location.search);
  const theme = searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const showHeader = parseBooleanParam(searchParams.get('header'), true);

  if (!calculatorId) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        {t('common:calculator.notFound')}
      </div>
    );
  }

  let calculator = null;
  for (const category of calculatorCategories) {
    const found = category.calculators.find(calc => calc.id === calculatorId);
    if (found) {
      calculator = found;
      break;
    }
  }

  if (!calculator) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        {t('common:calculator.notFound')}
      </div>
    );
  }

  const calculatorTitle = t(`calculators:${calculatorId}.title`, calculator.title);
  const CalculatorComponent = calculator.component;
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}`}>
      {showHeader && (
        <header className={isDark ? 'border-b border-slate-800 bg-slate-900/95' : 'border-b border-gray-200 bg-white'}>
          <div className="px-4 py-3">
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {t('common:siteName')}
            </div>
            <div className="text-base font-semibold">{calculatorTitle}</div>
          </div>
        </header>
      )}

      <main className="px-4 py-4 sm:py-6">
        <Suspense
          fallback={
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-56 bg-white rounded-xl border border-gray-100 shadow-sm" />
              <div className="h-56 bg-white rounded-xl border border-gray-100 shadow-sm" />
            </div>
          }
        >
          <CalculatorComponent />
        </Suspense>
      </main>
    </div>
  );
}
