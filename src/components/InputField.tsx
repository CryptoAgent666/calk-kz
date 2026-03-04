import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'tel';
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  validation?: (value: string) => string | null;
}

export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  suffix,
  prefix,
  min,
  max,
  step,
  required = false,
  error,
  success,
  hint,
  className = '',
  disabled = false,
  validation
}: InputFieldProps) {
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Валидация при изменении значения
  React.useEffect(() => {
    if (validation && value) {
      const validationResult = validation(value);
      setValidationError(validationResult);
    } else {
      setValidationError(null);
    }
  }, [value, validation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const hasError = error || validationError;
  const hasSuccess = success && !hasError;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{prefix}</span>
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-full px-4 py-3 ${prefix ? 'pl-12' : ''} ${suffix || hasError || hasSuccess ? 'pr-12' : ''} border rounded-lg transition-colors focus:ring-2 focus:border-transparent ${
            hasError
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : hasSuccess
              ? 'border-green-300 focus:ring-green-500 bg-green-50'
              : 'border-gray-300 focus:ring-blue-500'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />

        {suffix && !hasError && !hasSuccess && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{suffix}</span>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
        )}

        {hasSuccess && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Сообщения об ошибках, успехе или подсказки */}
      {hasError && (
        <div className="mt-2 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{hasError}</p>
        </div>
      )}

      {hasSuccess && (
        <div className="mt-2 flex items-start space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {hint && !hasError && !hasSuccess && (
        <div className="mt-2 flex items-start space-x-2">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500">{hint}</p>
        </div>
      )}
    </div>
  );
}