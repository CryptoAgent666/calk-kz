import React from 'react';
import { Calculator, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'calculator';
}

export default function LoadingSpinner({ 
  message = 'Загрузка калькулятора...', 
  size = 'md',
  variant = 'calculator'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const containerClasses = {
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} min-h-[200px]`}>
      <div className="relative mb-4">
        {variant === 'calculator' ? (
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center animate-pulse">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
          </div>
        ) : (
          <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
        )}
      </div>
      
      <p className="text-gray-600 text-sm text-center animate-pulse">
        {message}
      </p>
      
      <div className="mt-4 flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
}