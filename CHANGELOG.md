# Changelog — Calk.kz

## [2026-03-05] UX-аудит калькуляторов

### Исправлены критические баги (4 калькулятора)

- **CourtFeeCalculator** — добавлен отсутствующий `import { TaxPieChart }`, исправлены битые ссылки на свойства (`result.totalFee` → `results.feeAmount`, `caseType` → `claimType`)
- **AlimonyCalculator** — исправлены имена свойств в диаграмме и экспорте (`results.monthlyAlimony` → `results.alimonyAmount`, `results.income` → `results.netIncome`)
- **PensionCalculator** — исправлены битые ссылки (`results.totalPension` → `results.totalMonthlyPension`, `results.basicPension` → `results.basePension`), убрана несуществующая переменная `gender`
- **VATThresholdCalculator** — исправлены имена свойств (`results.totalTurnover` → `results.currentTotal`, `results.remaining` → `results.remainingToThreshold`)

### Добавлены дефолтные значения (~45 калькуляторов)

Все калькуляторы теперь показывают рассчитанный результат сразу при загрузке страницы (без необходимости заполнять форму вручную). Значения реалистичны для Казахстана:

| Категория | Примеры значений |
|-----------|-----------------|
| Зарплата / соц. выплаты | 300 000 ₸ |
| Ипотека | 25 000 000 ₸ |
| Депозит | 1 000 000 ₸, 14%, 1 год |
| Коммунальные | 150 кВт·ч, 5 м³ воды, 30 м³ газа |
| Здоровье | 175 см, 75 кг, 30 лет |
| Валюта | 1 000 USD |
| Транспортный налог | 2 000 см³, 5 лет |

### Косметические правки

- **Убраны лишние двоеточия** из заголовков h3/h4 в 14 файлах (53 исправления)
- **Исправлены unicode-escape** (`\u20B8` → `₸`, `\u20AC` → `€`) в ESPSelfEmployedCalculator
- **Порог отображения текста** в CompoundInterestCalculator увеличен с 15% до 25% для предотвращения переполнения

### i18n

- Добавлены ключи таблицы МФО (сумма, срок) в `ru/calculators.json` и `kk/calculators.json`

### Затронутые файлы

56 файлов: 54 калькулятора + 2 файла локализации (ru, kk)
