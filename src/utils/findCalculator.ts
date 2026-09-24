import { calculatorCategories } from '../data/calculators';

/** Калькулятор и его категория по id (null — такого нет, напр. удалён после обновления). */
export function findCalculator(calculatorId: string) {
  for (const category of calculatorCategories) {
    const calculator = category.calculators.find((calc) => calc.id === calculatorId);
    if (calculator) return { calculator, category };
  }
  return null;
}
