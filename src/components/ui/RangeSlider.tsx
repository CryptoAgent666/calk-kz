import React, { useCallback, useMemo } from 'react';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  showMinMax?: boolean;
  showValue?: boolean;
  color?: string;
  disabled?: boolean;
}

export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatValue = (v) => v.toString(),
  showMinMax = true,
  showValue = true,
  color = '#0ea5e9',
  disabled = false
}: RangeSliderProps) {
  const safeValue = useMemo(() => {
    const numericValue = Number.isFinite(value) ? value : min;
    return Math.min(Math.max(numericValue, min), max);
  }, [value, min, max]);

  const percentage = useMemo(() => {
    const range = max - min;
    if (range <= 0) {
      return 0;
    }
    return ((safeValue - min) / range) * 100;
  }, [safeValue, min, max]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label className="text-sm font-medium text-gray-700">{label}</label>
          )}
          {showValue && (
            <span 
              className="text-sm font-semibold px-2 py-1 rounded-md"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {formatValue(safeValue)}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={safeValue}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-offset-2
                     disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            accentColor: color
          }}
        />
      </div>
      
      {showMinMax && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{formatValue(min)}</span>
          <span className="text-xs text-gray-500">{formatValue(max)}</span>
        </div>
      )}
    </div>
  );
}

// Двойной слайдер для диапазона
interface DualRangeSliderProps {
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  color?: string;
}

export function DualRangeSlider({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  min,
  max,
  step = 1,
  label,
  formatValue = (v) => v.toString(),
  color = '#0ea5e9'
}: DualRangeSliderProps) {
  const minPercentage = ((minValue - min) / (max - min)) * 100;
  const maxPercentage = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span 
            className="text-sm font-semibold px-2 py-1 rounded-md"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {formatValue(minValue)} — {formatValue(maxValue)}
          </span>
        </div>
      )}
      
      <div className="relative h-2">
        {/* Track background */}
        <div className="absolute w-full h-2 bg-gray-200 rounded-lg" />
        
        {/* Selected range */}
        <div 
          className="absolute h-2 rounded-lg"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
            backgroundColor: color
          }}
        />
        
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            if (newValue <= maxValue) {
              onMinChange(newValue);
            }
          }}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:cursor-pointer"
          style={{
            // @ts-ignore
            '--tw-border-opacity': 1,
            borderColor: color
          }}
        />
        
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            if (newValue >= minValue) {
              onMaxChange(newValue);
            }
          }}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer pointer-events-none
                     [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
      
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">{formatValue(min)}</span>
        <span className="text-xs text-gray-500">{formatValue(max)}</span>
      </div>
    </div>
  );
}

export default RangeSlider;



