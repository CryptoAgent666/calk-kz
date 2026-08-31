# Mobile UX аудит калькуляторов KZ-CALK

Дата: 05.03.2026  
Режим: smartphone viewport `390x844` (touch, mobile user-agent)  
Охват: все калькуляторы из `src/data/calculators.ts` (57 шт.)

## Что проверялось
- Загрузка каждой страницы калькулятора на мобильном.
- Наличие ошибок в консоли/рантайме.
- Наличие горизонтального переполнения (horizontal scroll).
- Размер tap-target элементов (порог 44x44px).
- Smoke-проверка расчётов: заполнение полей -> действие расчёта -> изменение результата.
- Дополнительная ручная валидация 3 спорных калькуляторов (`insurance-premium`, `pension`, `heating`).

## Итог по проекту
- Проверено: **57/57** калькуляторов.
- Страницы не загрузились: **0**.
- Горизонтальное переполнение: **0**.
- Страницы с tap-target <44px: **57/57** (системная UX-проблема).
- Страницы с runtime warning/error: **5**.
- Подтверждённый расчётный дефект: **1** (`rent-vs-buy`, NaN warning в графике).

## Критичные и важные находки

### P1: NaN в визуализации «Аренда vs Покупка»
- Калькулятор: `rent-vs-buy`
- Файл: `src/components/calculators/RentOrBuyCalculator.tsx`
- Участок: строки `238-248`
- Причина: ширина bar рассчитывается через деление на `maxValue`; при `maxValue = 0` получается `NaN`, React логирует warning и ломает корректность UI-графика.
- Фикс:
  - добавить guard: `const safeMax = Math.max(maxValue, 1);`
  - использовать `safeMax` в расчёте ширин.

### P2: Нестабильные ключи в истории конвертеров (React warning)
Симптом: warning `Encountered two children with the same key`.

Проблемные места:
- `src/components/calculators/CurrencyConverter.tsx:79` (`id: Date.now().toString()`)
- `src/components/calculators/TimeConverter.tsx:343`
- `src/components/calculators/NumberToWordsCalculator.tsx:420`
- `src/components/calculators/TimeToWordsCalculator.tsx:340`

Использование ключа:
- `CurrencyConverter.tsx:378`
- `TimeConverter.tsx:783`
- `NumberToWordsCalculator.tsx:818`
- `TimeToWordsCalculator.tsx:775`

Почему это проблема: при быстрых обновлениях в одном ms появляются одинаковые `Date.now()` id, из-за чего ключи в списке конфликтуют.

Фикс:
- заменить `Date.now().toString()` на `crypto.randomUUID()` (с fallback).

### P2: Touch targets меньше 44x44 почти на всех экранах
Симптом: в среднем ~23 мелких интерактивных элемента на экран калькулятора.

Примеры источников:
- Кнопка мобильного меню: `src/components/Layout.tsx:87-93` (`p-2`, иконка `w-5 h-5`).
- Кнопка закрытия мобильного меню: `src/components/Layout.tsx:131-137`.
- Кнопки шеринга/скачивания: `src/components/SharePrintButtons.tsx:80-127` (`py-2`, иконки `w-4 h-4`, подписи скрыты на mobile).

Рекомендация:
- ввести единый utility-класс для мобильных действий: `min-h-[44px] min-w-[44px]`.
- не скрывать текст на mobile у ключевых CTA (или увеличить внутренние отступы).

## Проверка корректности расчётов
- Автосценарий smoke: 57/57 страниц прошли загрузку и обработку ввода.
- Первично помечены 3 калькулятора как «result not updated»:
  - `insurance-premium`
  - `pension`
  - `heating`
- Дополнительная точечная проверка подтвердила, что результаты меняются при изменении входов (ложноположительный флаг авто-эвристики).

Итог по вычислениям:
- Явно подтверждённый дефект вычислений/визуализации: **только `rent-vs-buy` (NaN warning)**.
- Для остальных калькуляторов критических сбоев расчёта в smoke-аудите не выявлено.

## Артефакты
- Raw лог: `docs/audits/mobile-ux-audit-2026-03-05-log.json`
- Raw автоген отчёт: `docs/audits/mobile-ux-audit-2026-03-05-raw.md`
- Скриншоты проблем: `/tmp/kz-calk-mobile-audit-shots/`
