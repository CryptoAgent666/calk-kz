import React, { Suspense } from 'react';
import { DeferredRender } from './DeferredRender';
import type { BarChartProps, LineChartProps, PieChartProps } from './ChartComponentsImpl';

// Цветовая палитра
const COLORS = [
  '#0ea5e9', // sky-500
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
];

const LazyTaxPieChart = React.lazy(() =>
  import('./ChartComponentsImpl').then((module) => ({ default: module.TaxPieChart }))
);
const LazyComparisonBarChart = React.lazy(() =>
  import('./ChartComponentsImpl').then((module) => ({ default: module.ComparisonBarChart }))
);
const LazyTrendLineChart = React.lazy(() =>
  import('./ChartComponentsImpl').then((module) => ({ default: module.TrendLineChart }))
);

interface ChartPlaceholderProps {
  minHeight: number;
}

function ChartPlaceholder({ minHeight }: ChartPlaceholderProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100" style={{ minHeight }}>
      <div className="h-4 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="h-40 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export function TaxPieChart(props: PieChartProps) {
  const reservedHeight = (props.height ?? 300) + 80;
  return (
    <DeferredRender minHeight={reservedHeight}>
      <Suspense fallback={<ChartPlaceholder minHeight={reservedHeight} />}>
        <LazyTaxPieChart {...props} />
      </Suspense>
    </DeferredRender>
  );
}

export function ComparisonBarChart(props: BarChartProps) {
  const reservedHeight = (props.height ?? 300) + 80;
  return (
    <DeferredRender minHeight={reservedHeight}>
      <Suspense fallback={<ChartPlaceholder minHeight={reservedHeight} />}>
        <LazyComparisonBarChart {...props} />
      </Suspense>
    </DeferredRender>
  );
}

export function TrendLineChart(props: LineChartProps) {
  const reservedHeight = (props.height ?? 300) + 80;
  return (
    <DeferredRender minHeight={reservedHeight}>
      <Suspense fallback={<ChartPlaceholder minHeight={reservedHeight} />}>
        <LazyTrendLineChart {...props} />
      </Suspense>
    </DeferredRender>
  );
}

// Простой Progress Bar для визуализации процентов
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  color = '#0ea5e9',
  showPercentage = true 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-800">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export { COLORS };



