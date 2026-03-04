import { ComponentType, LazyExoticComponent } from 'react';

interface Calculator {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  component: LazyExoticComponent<ComponentType<any>>;
}

export interface CalculatorCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  calculators: Calculator[];
}