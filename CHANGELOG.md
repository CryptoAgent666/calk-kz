# Changelog — Calk.kz

## [2026-06-11] Командировки — исправлены неверные ссылки на статьи ТК РК

### Контекст

В калькуляторе business-trip тексты ссылались на неверные/упразднённые статьи Трудового кодекса. Проверено по действующей редакции ТК РК (от 23.11.2015 № 414-V, verbatim с kodeksy-kz.com).

### Вердикт

- Гарантии командированным регулирует **ст. 127** «Гарантии и компенсационные выплаты для работников, направляемых в командировки» (п. 1 — сохраняются место работы и заработная плата за рабочие дни командировки; п. 2 — суточные, проезд, наём жилья).
- **ст. 132** = «Порядок и условия выплаты полевого довольствия» (геологи/топографы) — не про командировки.
- **ст. 117** («Профессиональные стандарты и система квалификаций») — **упразднена** Законом РК от 04.07.2023 № 15-VIII; к сохранению заработка во время командировки отношения не имеет.

### Что исправлено (только номера статей, формула не менялась)

1. `calculatorMethodology.ts` business-trip шаг 4: «ст. 132 ТК РК» → «ст. 127 ТК РК».
2. `calculators.json` business-trip `faq.a5` (ru/kk): «(по ТК РК ст. 117)» / «(ҚР ЕК 117-б)» → ст. 127 (действующая статья, гарантирующая сохранение заработной платы за дни командировки).

Проверка показала, что QuickAnswer, calculatorExamples и seoData для business-trip ссылок на ТК не содержат (только Постановление № 1428 по нормам суточных) — правок не требовали. Дата LastUpdated и `/legal/updates/` не трогались (расчёт не изменился).

### Файлы изменены

- `src/data/calculatorMethodology.ts`, `src/i18n/locales/{ru,kk}/calculators.json`, `CHANGELOG.md`

## [2026-06-11] Выходное пособие — исправлены размеры и номер статьи ТК РК

### Контекст

Тексты вокруг калькулятора severance-pay противоречили коду и друг другу по размерам пособия и номеру статьи. Проверено по действующей редакции ТК РК (от 23.11.2015 № 414-V) — verbatim ст. 131, 132, 52 (kodeksy-kz.com, подтверждено adilet.zan.kz, dogovor24.kz).

### Вердикт (ТК РК): код был прав, прозаические тексты — нет

- **ст. 131 «Компенсационные выплаты в связи с потерей работы»** (НЕ ст. 132 — это «полевое довольствие»):
  - **1 средняя зарплата** (п. 1): ликвидация/прекращение деятельности (ст. 52 п. 1 пп. 1), сокращение (пп. 2), увольнение по инициативе **работника** из-за неисполнения работодателем условий ТД (пп. 3).
  - **2 средних зарплаты** (п. 2): снижение объёма производства, повлёкшее ухудшение экономического состояния работодателя (ст. 52 п. 1 пп. 3).
  - Договором/актом работодателя может быть установлен больший размер (п. 3).
- **«Период поиска работы» / доплата за 1-2 месяца трудоустройства в ТК РК отсутствует** — это путаница со старым кодексом 2007 г. либо с пособием по безработице из ГФСС (отдельный калькулятор unemployment, 40% от средней з/п, платит фонд, а не работодатель).
- **«При нарушении работодателем — 2 средних зарплаты» — ошибка**: по ст. 131 п. 1 пп. 3 это 1 месяц. Цифра «2 месяца» относится только к экономическому спаду (п. 2), которого нет среди опций калькулятора.
- **Код калькулятора (1 средняя з/п для reduction/liquidation/employer) уже корректен** → формула не менялась, дата LastUpdated и `/legal/updates/` не трогаются.

### Что исправлено (только прозаические/справочные тексты)

1. `QuickAnswer.tsx` severance-pay (ru/kk): ст. 132 → ст. 131; убрана несуществующая доплата «за период поиска работы»; «нарушение работодателем — 2» → 1 средняя з/п; добавлен реальный 2-месячный случай (эконом. спад) и оговорка про ГФСС.
2. `calculatorMethodology.ts` шаг 3 (ru): «1 + до 2 за период поиска» → корректные 1 мес (сокращение/ликвидация/нарушение работодателем) и 2 мес (эконом. спад) со ссылками на ст. 131 п. 1-3; заголовок «Сумма пособия при сокращении» → «Размер выходного пособия».
3. `calculatorExamples.ts` (ru): «До 750 000 ₸ (1+2)» → «250 000 ₸ (1 среднемес.)»; «900 000 ₸ (1+2)» → «300 000 ₸ (1 среднемес.)»; пособие по безработице вынесено в отдельную строку (ГФСС).
4. `calculators.json` (ru/kk): `warningEmployer` уточнён (компенсация — только за не зависящие от работника основания, ст. 131; за виновные действия пособие не платится); `article131` — заголовок изменён на фактическое название статьи «Компенсационные выплаты в связи с потерей работы».

### Источники

- ТК РК от 23.11.2015 № 414-V: ст. 131 (1 мес — п. 1 пп. 1-3; 2 мес — п. 2; больше по договору — п. 3), ст. 132 (полевое довольствие — не про увольнение), ст. 52 (основания расторжения по инициативе работодателя)

### Файлы изменены

- `src/components/ui/QuickAnswer.tsx`, `src/data/calculatorMethodology.ts`, `src/data/calculatorExamples.ts`
- `src/i18n/locales/{ru,kk}/calculators.json`, `CHANGELOG.md`

## [2026-06-11] Выходное пособие — устранено противоречие методология ↔ код по ОПВ/ВОСМС

### Контекст

Три поверхности противоречили друг другу: код `SeverancePayCalculator` удерживал ОПВ 10% + ВОСМС 2% со всей выплаты, методология (шаг 4) утверждала «ОПВ и ВОСМС — НЕ удерживаются», FAQ a5 — что облагается всё. Проверено по первоисточникам 2026 года.

### Вердикт (2026): код был прав, методология устарела

- **До 2026**: выходное пособие при ликвидации/сокращении освобождалось от ВОСМС/ООСМС отдельным абзацем п. 4 ст. 29 ЗРК «Об ОСМС» (от ИПН и ОПВ не освобождалось — корректировка в ст. 341 НК исключена ещё с 2020).
- **С 01.01.2026** (закон № 215-VIII от 18.07.2025): п. 4 ст. 29 изложен заново — взносы/отчисления ОСМС не удерживаются только с выплат, «которые в целях налогообложения не рассматриваются в качестве дохода физлица» (ст. 365–370 НК РК 2026). Компенсационных выплат при расторжении ТД там нет → **выходное пособие облагается ВОСМС/ООСМС** (разъяснение Минздрава РК от 24.10.2025, pro1c.kz).
- **ОПВ/ОПВР**: правила в ред. ПП РК № 939 от 07.11.2025 — освобождение только для ст. 365 НК и уменьшений по ст. 400, 429–436 НК; выходного пособия и компенсации за отпуск там нет → удерживаются. Аналогично СО (ст. 245 СК РК, разъяснение МТиСЗН от 03.11.2025).
- **Компенсация за неиспользованный отпуск**: в новом НК РК нигде не освобождена → облагается всем, как зарплата (ОПВ, ВОСМС, ИПН; у работодателя — ОПВР, СО, ООСМС, СН).
- Единственное освобождение в НК-2026 — выходное пособие **госслужащим** (пп. 12 ст. 432).
- Обе части выплаты в 2026 облагаются одинаково → раздельный расчёт удержаний по частям не требуется, формула не изменилась.

### Что исправлено

1. `calculatorMethodology.ts` severance-pay шаг 4: «ОПВ и ВОСМС — НЕ удерживаются» → обе части облагаются ОПВ 10% (до 50 МЗП), ВОСМС 2% (до 20 МЗП), ИПН 10/15%; добавлены ссылка на п. 4 ст. 29 Закона об ОСМС, оговорка про госслужащих и формула нетто.
2. FAQ `severance-pay.faq.a5` (ru/kk): добавлены пределы баз (50/20 МЗП), отмена ОСМС-льготы с 01.01.2026 со ссылкой на разъяснение Минздрава от 24.10.2025, льгота госслужащих (ст. 432 НК РК).
3. `SeverancePayCalculator.tsx`: комментарий с правовым обоснованием удержаний (формула не менялась — была корректна для 2026).
4. `LastUpdated.tsx` severance-pay: дата 2026-06-11 сохранена (формула без изменений), комментарий дополнен. `/legal/updates/` не трогаем — цифры расчёта не изменились (см. UPDATES-PAGE-RULES.md).

### Источники

- Новый НК РК от 18.07.2025 № 214-VIII: ст. 365–370 (не доход физлица), ст. 429/432 (уменьшения; пп. 12 ст. 432 — пособие госслужащим), без льгот для обычного выходного пособия и компенсации за отпуск
- Закон № 215-VIII от 18.07.2025 (сопутствующие поправки): новая ред. п. 4 ст. 29 ЗРК «Об ОСМС», ст. 245 СК РК
- Разъяснение Минздрава РК от 24.10.2025 и МТиСЗН РК от 03.11.2025 (pro1c.kz), ПП РК № 939 от 07.11.2025 (правила ОПВ/ОПВР/ОППВ)

### Файлы изменены

- `src/data/calculatorMethodology.ts`, `src/i18n/locales/{ru,kk}/calculators.json`
- `src/components/calculators/SeverancePayCalculator.tsx`, `src/components/ui/LastUpdated.tsx`
- `CHANGELOG.md`

## [2026-06-11] Зарплатные калькуляторы — СН 6%, лимит ООСМС 40 МЗП, ИПН 15%

### Что исправлено

#### 1. `SalaryCalculator.tsx` — расходы работодателя не включали соцналог

Прямой калькулятор считал работодательскую часть как СО + ООСМС + ОПВР, тогда как обратный (`SalaryReverseCalculator`) уже включал СН 6%. Проверено по НК РК 2026 (kgd.gov.kz, uchet.kz, pro1c.kz): для юрлиц на ОУР соцналог = 6%, взаимозачёт с СО отменён, минимальный объект 14 МРП. Добавлены `SN_RATE = 0.06`, `SN_MIN_BASE = 14 МРП`, база = доход − ОПВ − ВОСМС. СН уплачивается и за особые категории (пенсионеров/инвалидов) — у них база = весь доход (нет ОПВ/ВОСМС).

#### 2. `SalaryCalculator.tsx` — ООСМС без предельной базы

Было `gross × 3%` без лимита; с 01.01.2026 предельная база ООСМС = 40 МЗП (3,4 млн ₸/мес, максимум 102 000 ₸). Добавлен `OOSMS_MAX_BASE = 40 × МЗП` (в обратном уже был). Заодно: за особые категории ООСМС обнулён (работодатели освобождены — за пенсионеров/инвалидов взносы платит государство, ст. 26–27 Закона об ОСМС).

#### 3. `SeverancePayCalculator.tsx` — плоский ИПН 10% без ставки 15%

Разовая выплата при увольнении может превышать 8500 МРП (36,76 млн ₸) при достижимых вводах (большой стаж × неиспользованный отпуск × высокий оклад). Добавлена двухступенчатая шкала 10%/15% (порог годовой, прочие доходы года не моделируются — оценка снизу), лейбл «ИПН (10%)» стал динамическим «(10-15%)».

#### 4. `SecondJobCalculator.tsx` — плоский ИПН 10% оставлен, задокументирован

Вводы ограничены слайдерами (3 млн / 2 млн ₸/мес): облагаемая база каждой работы не достигает 8500 МРП/год у одного агента → для внешнего совместительства 10% точны на всём диапазоне. Для внутреннего порог по суммарному доходу достижим только у верхних границ обоих слайдеров — зафиксировано комментарием.

#### 5. Стейл-тексты (i18n + контент)

- `salary-reverse.sn`: «Социальный налог (11%)» → «(6%)» (ru/kk) — код считал 6%, лейбл показывал 11%
- `salary-reverse.faq.a2`: СН 11% → 6%, СО 3.5% → 5%, ОПВР 1.5% → 3.5%, итог ~9-11% → ~16% (ru/kk)
- `salary.employerRates`: добавлен СН 6% (ru/kk); kk `salary.rates`: ЖСС 10% → 10-15%
- QuickAnswer `salary`: нагрузка на ФОТ ~28% → ~33%, добавлен СН; `salary-reverse`: брутто для 200к net 232 600 → 236 100 ₸
- `calculatorMethodology` salary: шаг 5 + СН, множитель 1.115 → 1.163; шаг 4 + ставка 15%; severance-pay: + ставка 15%
- `calculatorExamples` salary «1 МЗП»: 94 775 → 98 838 ₸ (с СН 4 488 и корректной базой СО 76 500)
- `/legal/updates/`: запись от 11.06.2026 (ru/kk); `LastUpdated`: salary, salary-reverse, severance-pay → 2026-06-11
- `regulatory-constants.canonical.json`: used_by + SalaryCalculator для sn_social_tax_rate / sn_min_base_mrp / osms_employer_max_base_mzp; формулировка закона для СН обновлена (взаимозачёт отменён)

### Файлы изменены

- `src/components/calculators/SalaryCalculator.tsx`
- `src/components/calculators/SalaryReverseCalculator.tsx`
- `src/components/calculators/SeverancePayCalculator.tsx`
- `src/components/calculators/SecondJobCalculator.tsx`
- `src/i18n/locales/{ru,kk}/calculators.json`, `src/i18n/locales/{ru,kk}/legal.json`
- `src/components/ui/QuickAnswer.tsx`, `src/components/ui/LastUpdated.tsx`
- `src/data/calculatorMethodology.ts`, `src/data/calculatorExamples.ts`, `src/data/regulatory-constants.canonical.json`
- `CHANGELOG.md`

## [2026-05-26] Browser-тесты #14-16 — фиксы плюрализации (8 калькуляторов)

### Что исправлено

#### 1. `src/utils/pluralize.ts` — баг с дробными числами

Старая логика брала `Math.floor(n)` и применяла обычные правила, что давало «19.2 **лет**» (должно «19.2 года»). Русская плюрализация для дробных всегда использует форму «**few**». Добавлена проверка `if (absN % 1 !== 0) return few` в начале функции.

#### 2. Восемь калькуляторов — replace hardcoded «лет/года» на `pluralize()`

| Калькулятор | Где был баг |
|---|---|
| **FIRECalculator** | «19.2 лет» → «19.2 года» (deploy ранее) |
| **BusinessROICalculator** | «4 месяцев» → «4 месяца» (deploy ранее) |
| **PensionAnnuityCalculator** | «Пенсионный возраст: 63 лет» → «63 года», «61 лет» → «61 год» |
| **PetAgeCalculator** | Export PDF/Excel: возраст питомца |
| **InsulationCalculator** | Срок окупаемости утепления |
| **IslamicMortgageCalculator** | Слайдер срока 3-25 лет |
| **CaloriesCalculator** | Возраст пользователя в export |
| **RentOrBuyCalculator** | Период анализа в export |
| **PasswordGeneratorCalculator** | Время взлома: «5 сек», «3 мин», «1 ч», «2 дней», «1 лет» → корректные формы для всех единиц |

#### 3. `public/llms.txt` — устаревшее число калькуляторов

«**57+ калькуляторами**» → «**118+ калькуляторами**» с расширенным описанием категорий. Для AI-индексаторов (ChatGPT, Perplexity, Google AI Overviews).

### Файлы изменены

- `src/utils/pluralize.ts`
- `src/components/calculators/PensionAnnuityCalculator.tsx`
- `src/components/calculators/PetAgeCalculator.tsx`
- `src/components/calculators/InsulationCalculator.tsx`
- `src/components/calculators/IslamicMortgageCalculator.tsx`
- `src/components/calculators/CaloriesCalculator.tsx`
- `src/components/calculators/RentOrBuyCalculator.tsx`
- `src/components/calculators/PasswordGeneratorCalculator.tsx`
- `public/llms.txt`

### К ленте обновлений (`/legal/updates/`)

Не добавляется — исправление UI/грамматических багов, не новый функционал.

---

## [2026-05-26] Browser-тесты #7-11 — массовое расширение SEO titles + редиректы

### Что сделано (по итогам 5 батчей визуального тестирования)

#### 1. SEO titles + descriptions — добавлено для **35 калькуляторов**

Расширил `seoTitles` и `seoDescriptions` в `src/utils/seoData.ts`:

| Батч | Добавлено | Калькуляторы |
|---|---|---|
| #7 | 9 | vehicle-tco, fire, qr-code-generator, timezone, wallpaper, auto-leasing, business-roi, insulation, franchise-payback |
| #7 fix | 10 | age, body-fat, roman-numerals, brick, pet-age, unit-converter, concrete-volume, flooring, property-division, unified-payment |
| #8 | 5 | corporate-income-tax, moral-damage, fancy-plates, islamic-mortgage, salary-reverse |
| #9 | 6 | ent-score, cash-flow-gap, cost-of-living, divorce, otbasy-bank, universal-declaration |
| #10 | 4 | apartment-valuation, fair-rental-price, average-earnings, sleep |

Все по паттерну `"Калькулятор X 2026 — короткое описание | Calk.kz"` (50-70 символов).

#### 2. Ещё 2 пары редиректов в `public/.htaccess`

- `/calculator/gas-bill/` → `/calculator/gas/`
- `/calculator/water-bill/` → `/calculator/water/`
- KK и embed варианты тоже.

#### 3. Фикс `build:prerender` — race condition

Изменил `package.json` скрипт сборки: вместо `sleep 5` теперь `until curl -sf http://localhost:4173/ > /dev/null; do sleep 1; done`. На медленных машинах vite preview не успевал за 5 секунд → пререндер первых 10-20 страниц падал с `ERR_CONNECTION_REFUSED`. Теперь дожидаемся фактической готовности.

### К ленте обновлений (`/legal/updates/`)

Не добавляется — SEO meta-теги исключены правилами (см. UPDATES-PAGE-RULES.md). Глобальная сводка работы за день: 56+ SEO titles, 12 редиректов, 2 фикса пенсионной/трудовой логики, 1 фикс опечатки.

---

## [2026-05-26] Browser-тест #6 — плюрализация FIRE/ROI + 9 SEO titles

### Найденные баги

#### 1. Неправильная плюрализация в FIRE и Business-ROI

**FIRECalculator:** показывало «Вы достигнете FIRE: 19.2 **лет**» — для дробных значений нужна форма «года». Также «{age} лет» в RangeSlider и сценариях накопления.

**BusinessROICalculator:** показывало «Срок окупаемости: 4 **месяцев**» — нужно «4 месяца» (числа 2-4 → genitive singular).

**Исправлено:** заменил хардкоженные `t('fire.years')` / `t('business-roi.months')` на `pluralize(i18n.language, n, 'месяц', 'месяца', 'месяцев')` из уже существующего `src/utils/pluralize.ts`.

#### 2. Ещё 9 коротких SEO titles

`vehicle-tco`, `fire`, `qr-code-generator`, `timezone`, `wallpaper`, `auto-leasing`, `business-roi`, `insulation`, `franchise-payback` — добавлены полные SEO titles + descriptions.

### Файлы изменены

- `src/utils/seoData.ts` (+9 titles, +9 descriptions)
- `src/components/calculators/FIRECalculator.tsx` (импорт `pluralize`, замены в 4 местах + ExportButtons)
- `src/components/calculators/BusinessROICalculator.tsx` (импорт `pluralize`, замены в `formatPayback`)

### К ленте обновлений (`/legal/updates/`)

Не добавляется — плюрализация это исправление UI-багов (не новый функционал, не обновление формулы из-за закона).

---

## [2026-05-26] Browser-тест #5 — ещё 11 SEO titles

### Найденные баги (через визуальный тест 20 страниц)

#### 1. Ещё 11 коротких page titles

Аналогично batch #4 — 11 калькуляторов не были в `seoTitles` map в `src/utils/seoData.ts` и падали на дефолт `${title} - Calk.kz` (короче 35 символов):

`debt-burden`, `water-intake`, `hajj`, `kasko`, `fuel-cost`, `inheritance`, `rental-income-tax`, `password-generator`, `tire-size`, `second-job`, `business-trip`.

**Исправлено:** добавлены полные SEO titles + descriptions по паттерну `"Калькулятор X 2026 — короткое описание | Calk.kz"` (55-70 символов).

#### 2. ExciseTaxCalculator — dead code

`src/components/calculators/ExciseTaxCalculator.tsx` — компонент акцизов на алкоголь и табак (НК РК 2026 ст. 748) **существует в коде, но недоступен пользователям**:
- Не зарегистрирован в `src/data/calculators.ts`
- 0 строк i18n в RU/KK
- URL `/calculator/excise-tax/` возвращает home page

**Решение:** оставлен как код-задел; не правится в этой сессии (требует написания переводов + методологии).

#### 3. DTI tooltip — не баг

Изначально я подумал, что в подсказке DebtBurden калькулятора инвертирована формулировка («50% для безработных или 70% для работающих»). При проверке кода — текст корректный: «50% для **беззалоговых**, 70% для **залоговых**» (правило НБРК от 01.07.2024). Ошибка чтения скриншота, не код-баг.

### Файлы изменены

- `src/utils/seoData.ts` (+11 titles, +11 descriptions)

### К ленте обновлений (`/legal/updates/`)

Не добавляется — все изменения касаются SEO мета-тегов (раздел «SEO» исключён правилами).

---

## [2026-05-26] Browser-тест #4 — фиксы опечаток, редиректов и SEO titles

### Найденные баги (через визуальный тест 20 страниц)

#### 1. Опечатка «Кэшбек» → «Кэшбэк»

В обоих локалях `cashback.title`, `cashback.heading`, `cashback.totalCashback`, `cashback.monthlyCashback` были написаны через «е» вместо «э». Внутри того же файла дальше уже использовалось правильное «Кэшбэк» — то есть **внутри одного объекта переводов было два варианта написания**.

**Исправлено:** все 4 строки в `src/i18n/locales/ru/calculators.json` и `src/i18n/locales/kk/calculators.json`.

#### 2. Маршруты `/calculator/mortgage/` и `/calculator/notary-services/` отдавали главную

Slug-и в данных: `mortgage-specialized` и `notary`. Старые URL (внешние ссылки, индекс Google) не находили калькулятор и попадали на `NotFoundPage`, который стилизован как главная страница — пользователи видели «Calk.kz — Калькуляторы для Казахстана» вместо ожидаемого калькулятора.

**Исправлено:** добавлены 301-редиректы в `public/.htaccess`:
- `/calculator/mortgage/` → `/calculator/mortgage-specialized/`
- `/calculator/notary-services/` → `/calculator/notary/`
- KK и embed-варианты тоже.

#### 3. Слишком короткие page titles (≤35 символов — плохо для SEO)

12 калькуляторов не были в `seoTitles` map и падали на дефолт `${title} - Calk.kz`:
`overtime`, `gpa`, `margin-markup`, `inflation`, `cashback`, `break-even`, `bankruptcy`, `statute-limitations`, `crypto-tax`, `property-sale-tax`, `teacher-salary`, `tax-regime-comparison`.

**Исправлено:** добавлены полные SEO titles + descriptions в `src/utils/seoData.ts` по паттерну `"Калькулятор X 2026 — короткое описание | Calk.kz"` (50-70 символов).

#### 4. «Подробнее»-чипы на калькуляторах (AdSense Auto Ads)

На страницах сверху и снизу видны странные чипы вида «Подробнее → Калькулятор / Калькуляторов / Денежные единицы и обмен валют». Поиск по коду показал — **этих строк нет в проекте**. Это **Google AdSense Auto Ads → Related Search**, генерируются автоматически на стороне Google.

**Не исправляется в коде** — управляется в AdSense Console (можно отключить формат Related Search, если нежелателен). Задокументировано как не-баг.

### Файлы изменены

- `src/i18n/locales/ru/calculators.json` (4 строки)
- `src/i18n/locales/kk/calculators.json` (4 строки)
- `public/.htaccess` (+6 строк 301-редиректов)
- `src/utils/seoData.ts` (+12 titles, +12 descriptions)

### К ленте обновлений (`/legal/updates/`)

Не добавляется — все 3 кодовых изменения являются исправлениями багов (опечатка, неработающие старые URL, отсутствующие SEO теги). Не новый функционал, не обновление формул из-за нового закона.

---

## [2026-05-26] Browser-тест #3 — фиксы пенсионного возраста и ВОСМС

### Найденные баги (через визуальный тест)

#### 1. `PensionAnnuityCalculator.tsx` — неправильный пенсионный возраст

**Проблема:** На карточках выбора пола показывалось «Пенсия с 67 лет» для **обоих** мужчин и женщин. Формула `getRetirementAge()` использовала поэтапное повышение `+0.5 года/год` с потолком 68 м / 63 ж — это не соответствует актуальному законодательству РК.

**Корректные значения 2026:**
- Мужчины: 63 года (фиксировано с 2023)
- Женщины: 61 год (переходный период до 2028 → 63)

**Исправлено:**
- Функция `getRetirementAge()` упрощена до `63` (м) / `61` (ж).
- Карточки выбора пола: фиксированные значения `63` / `61` вместо `results.retirementAge` (раньше обе карточки показывали возраст одного пола после расчёта).
- Блок «Контекст продолжительности жизни»: `63-68 лет` → `63`, `58-63 лет` → `61`.

#### 2. `SeverancePayCalculator.tsx` — устаревший лимит ВОСМС

**Проблема:** `vosmsBase = Math.min(grossTotal, 10 * MZP)`. Лимит 10 МЗП — старый, на 2026 действует 20 МЗП (как уже исправлено в `VacationPayCalculator`).

**Исправлено:** `10 * MZP` → `20 * MZP`.

### Файлы изменены

- `src/components/calculators/PensionAnnuityCalculator.tsx`
- `src/components/calculators/SeverancePayCalculator.tsx`

### К ленте обновлений (`/legal/updates/`)

Не добавляется — оба изменения являются исправлениями багов (формула пенсионного возраста была неверной с момента создания, лимит ВОСМС просто не был обновлён до глобального изменения 2026). Глобальное обновление кодекса 2026 уже отражено в записи от 1 января.

---

## [2026-05-25] Расширение реестров консистентности — фаза 2

### Что сделано

После предыдущей работы по выравниванию консистентности (этапы 1-7), охват блоков на калькуляторах был неравномерным:
- **CalculatorExamples** — 0% (компонент только что создан)
- **MethodologySection** — 23%
- **QuickAnswer** — 36%

Расширил все три реестра с конкретным контентом по бизнес-логике и налоговому/финансовому/правовому контексту РК на 2026 г.

#### 1. Реестр `src/data/calculatorExamples.ts` — 19 → **53 калькулятора** (+34)

Каждый калькулятор — 3 примера (лёгкий / средний / особый случай) с конкретными цифрами по правилам РК 2026. Структура `{ title, scenario, result, details[] }`. Контент готов для AI-цитирования (ChatGPT, Perplexity, Google AI Overviews).

Добавлены примеры для: corporate-income-tax, deposit, auto-leasing, kasko, maternity-benefits, court-fee, microloan, pension-annuity, refinancing, vacation-pay, penalty, unified-payment, discount, percentage, currency-converter, fuel-cost, calories, water-intake, body-fat, concrete-volume, zakat, islamic-mortgage, pregnancy, early-repayment, age, gpa, hajj, ramadan-sadaqah, kurban, water-bill, electricity, wallpaper, flooring, cashback.

#### 2. Реестр `src/data/calculatorMethodology.ts` — 28 → **52 калькулятора** (+24)

Каждый — пошаговая методология расчёта (3-5 шагов) с формулами. Заодно убрал 4 дубликата (vehicle-tax, customs-clearance, inheritance, vat — оставлены более подробные версии).

Добавлены методологии: maternity-benefits, court-fee, microloan, pension-annuity, refinancing, vacation-pay, penalty, unified-payment, discount, percentage, currency-converter, fuel-cost, water-intake, body-fat, pregnancy, zakat, islamic-mortgage, early-repayment, age, gpa, hajj, ramadan-sadaqah, islamic-inheritance, cashback.

#### 3. Реестр `src/components/ui/QuickAnswer.tsx` — 43 → **56 калькуляторов** (+13)

Каждый — короткий TL;DR ответ (1-3 предложения) для топа поисковой выдачи и AI Overviews. На русском И на казахском.

Добавлены ответы для: corporate-income-tax, calories, water-intake, body-fat, hajj, islamic-mortgage, ramadan-sadaqah, islamic-inheritance, kurban (плюс несколько обновлённых записей).

#### 4. Компонент `src/components/ui/CalculatorExamples.tsx`

Новый блок «Примеры расчёта» (purple gradient styling) с сеткой карточек. Каждая карточка: заголовок + сценарий + результат + детали. Адаптируется на mobile/desktop.

#### 5. Массовая интеграция в калькуляторы

Через скрипт `scripts/inject_consistency.py`:
- **CalculatorExamples** инжектится перед `<MethodologySection>` или `<FAQSection>` — 53 файла
- **MethodologySection** инжектится перед `<FAQSection>` — 52 файла
- **QuickAnswer** инжектится в начало JSX-возврата — 51 файл

### Итоговое покрытие (на 118 калькуляторов)

| Блок | До | После | Прирост |
|---|---|---|---|
| **CalculatorExamples** | 0/118 (0%) | **53/118 (45%)** | +53 |
| **MethodologySection** | 27/118 (23%) | **52/118 (44%)** | +25 |
| **QuickAnswer** | 42/118 (36%) | **51/118 (43%)** | +9 |

Все 3 ключевых блока консистентности теперь >40% покрытия. Контент полностью оптимизирован для AI-цитирования (структурированные ответы с цифрами и формулами) и улучшает E-E-A-T для поискового ранжирования.

### Файлы

| Файл | Изменение |
|---|---|
| `src/data/calculatorExamples.ts` | +34 entries (332 → 760 строк) |
| `src/data/calculatorMethodology.ts` | +24 entries, -4 дубля (428 → 540 строк) |
| `src/components/ui/QuickAnswer.tsx` | +13 entries (244 → 332 строк) |
| `src/components/ui/CalculatorExamples.tsx` | новый файл (51 строка) |
| `src/components/calculators/` | 53 файла с инжекциями |
| `scripts/inject_consistency.py` | скрипт массовой инжекции |

TypeScript-проверка: чисто (0 ошибок). Готово к build + deploy.

---

## [2026-05-22] Инструкция UPDATES-PAGE-RULES.md

### Что сделано

Создан подробный документ **`UPDATES-PAGE-RULES.md`** в корне проекта — полная инструкция работы со страницей `/legal/updates/`:

1. **Главное правило** — страница для пользователей, не для разработчиков
2. **3 разрешённых типа** изменений (новый калькулятор, обновление формул, новый функционал)
3. **Чёрный список** того, что писать НЕЛЬЗЯ (с разбиением по категориям: SEO/perf/security/реклама/i18n/refactor)
4. **Эвристика** принятия решения («Пользователь увидит новую возможность или заметную пользу?»)
5. **Шаблон записи** с форматами даты для RU и KK (таблица казахских месяцев)
6. **Workflow** пошагово
7. **Примеры из реальной истории** — хорошие записи и плохие записи (что мы откатили)
8. **Граница** между «обновление формулы» (✅ пишем) и «исправление бага в формуле» (❌ не пишем)
9. **FAQ** с типичными вопросами

В `AGENTS.md`:
- Короткая сводка правила со ссылкой на `UPDATES-PAGE-RULES.md`
- Документ добавлен в раздел «Важные файлы»

В `MEMORY.md` (agent memory):
- Сводка правила со ссылкой на `UPDATES-PAGE-RULES.md`
- Указание читать документ перед любым деплоем

### Файлы

| Файл | Что |
|---|---|
| `UPDATES-PAGE-RULES.md` | NEW — полная инструкция (1 файл, ~280 строк) |
| `AGENTS.md` | Сокращённая сводка со ссылкой, файл в «Важные файлы» |
| `~/.claude/projects/.../memory/MEMORY.md` | Сводка для агентских сессий + ссылка на инструкцию |

---

## [2026-05-22] Правило страницы «Обновления» — строгая фильтрация

### Что сделано

**1. Удалены 22 записи** за 22 мая 2026 из `src/i18n/locales/{ru,kk}/legal.json` → `updates.groups[0].items`. Эти записи были про исправление багов (NaN в нотариусе, ВОСМС у teacher-salary, KK 404, /search/, опечатки/дубли в UI, AdSense, переводы) — но это НЕ функциональные изменения для пользователя. Страница «Обновления» откатилась до 18 записей (как было до моего вмешательства).

**2. Ужесточено правило** в `MEMORY.md` и `AGENTS.md`:

Страница `/legal/updates/` обновляется **СТРОГО ТОЛЬКО** при изменениях одного из 3-х типов:
1. ✅ Добавление нового калькулятора
2. ✅ Обновление формул (новые ставки НК РК, новые тарифы НБРК, обновление курсов, новые коэффициенты)
3. ✅ Улучшение функционала сайта (новая фича: экспорт PDF, тёмная тема, сохранение)

**НЕ пишется на страницу** (это всё уходит в CHANGELOG.md): мелкие правки, технические фиксы, оптимизация (SEO/security/performance/schema), реклама, переводы, маршрутизация, build/deploy/CI/refactoring.

Эвристика: «Увидит ли пользователь после обновления новую возможность или заметную пользу?». Если нет — на эту страницу не пишем.

### Файлы

- `src/i18n/locales/ru/legal.json` — откатили 22 записи (18 записей в `updates.groups[0].items`)
- `src/i18n/locales/kk/legal.json` — откатили 22 записи (18 записей)
- `~/.claude/projects/.../memory/MEMORY.md` — ужесточённое правило
- `AGENTS.md` — ужесточённое правило с таблицей примеров

---

## [2026-05-22] CalkCheck skill + 7 свежих фиксов через static analyzer

### Контекст

Создан skill `~/.claude/skills/calkcheck/` для аудита всех 10 сайтов сети калькуляторов (calk.kz, calk.kg, calk-au.com, calks.uk, calk.ru, calk.uz, calk.by, calk-tr.com, calk-az.com, calks-us.com). Skill адаптирует 115+ критериев под локаль домена автоматически.

### Новый инструмент: `audit_code.py` — статический анализ JSX↔i18n

Первый же прогон на calk.kz нашёл **7 новых багов**, которые регex-only детекторы пропускали:

| # | Калькулятор | Что | Файл |
|---|---|---|---|
| 35 | **password-gen** | "Заглавные буквы (A-Z) (A-Z)" — i18n содержит "(A-Z)", JSX добавляет ещё | i18n RU+KK |
| 36 | **password-gen** | "Строчные буквы (a-z) (a-z)" | i18n RU+KK |
| 37 | **password-gen** | "Цифры (0-9) (0-9)" | i18n RU+KK |
| 38 | **password-gen** | "Спецсимволы (!@#$) (!@#...)" | i18n RU+KK |
| 39 | **alimony** | `exportAlimonyRate` "Ставка алиментов::" — двойное двоеточие | i18n RU+KK |
| 40 | **alimony** | `exportAlimonySum` "Сумма алиментов::" | i18n RU+KK |
| 41 | **alimony** | `exportRemainsToParent` "Остается родителю::" + `exportEffectiveRate` "Эффективная ставка от валового дохода::" | i18n RU+KK |

### Структура skill

```
~/.claude/skills/calkcheck/
├── SKILL.md (12 KB)
├── scripts/
│   ├── audit_sitewide.sh — S1-S5 (robots/sitemap/llms/SSL)
│   ├── audit_page.py — 115+ per-page критериев (HTTP/Sec/SEO/OG/Schema/A11y/CWV/PWA + 12 BUG + 6 AI + 6 CALC)
│   ├── browser_check.js — chrome-devtools-mcp content bug detector
│   ├── check_sources_coverage.py — coverage блока Sources во всех калькуляторах
│   └── audit_code.py — **NEW** статический анализатор JSX↔i18n (BUG-13/14/15/16)
└── references/
    ├── criteria.md — полный список 115+ критериев
    ├── locales.md — 10 доменов сети с конфигурацией
    └── content_bugs.md — типовые баги и фиксы
```

### Накопительно

- **41 фикс готов к деплою** (3 в production + 38 локально)
- Skill зарегистрирован, готов к работе на остальных 9 сайтах сети

---

## [2026-05-22] Tech+SEO+Content аудит batch #15 — 20 страниц по 96 критериям

### Контекст

Применили адаптированный набор из 96 критериев (Calks.uk шаблон → Calk.kz: ru locale, KZT, KZ gov sources, "| Calk.kz" suffix). Проверки покрывают: Site-Wide (robots/sitemap/llms/SSL), HTTP/Network, Security Headers, Indexability, HTML Structure, SEO Meta, OpenGraph, Twitter, Schema.org, Content Quality, E-E-A-T, Calculator Features, Links, Accessibility, Image, CWV, PWA, Mobile UX.

### Site-Wide (S1-S5) — все 5 прошли ✅

- robots.txt с GPTBot allow ✅
- sitemap.xml (274 URLs) ✅
- llms.txt 6963 байт ✅
- TLS 1.3 ✅
- Сертификат до Jul 26 2026 (>30 days) ✅

### Per-page 20 страниц — ~82/96 критериев пройдены (85%)

**Прошло:** HTTP/Network 6/7, Indexability 3/3, HTML 6/6, SEO 7/8, OG 7/7, Twitter 4/4, Content 6/7, Links 5/5, A11y 8/8, Image 5/5, CWV 6/7, PWA 4/5.

### 🔴 КРИТИЧЕСКИЕ находки (нужны nginx/code изменения)

**1. Security Headers — все 6 ОТСУТСТВУЮТ на всех 20 страницах:**
- HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Уязвимости: clickjacking, XSS, MITM
- Fix: добавить `add_header` в nginx config

**2. Schema.org — отсутствуют WebApplication + Person**
- Сейчас @graph с WebPage + BreadcrumbList + FAQPage (3 типа)
- Нужно добавить WebApplication (с offers price 0 KZT) + Person (Арнур Ержанбаев)
- Снижает шансы AI-citations (ChatGPT, Perplexity, Google AI Overviews)

**3. KZ gov sources отсутствуют на 6/20 калькуляторах:**
- kasko, inheritance, divorce, bmi, zakat, concrete-volume
- TODO: добавить ссылки на adilet.zan.kz / kgd.gov.kz / ДУМК / СНиП

### Прочее (TODO)

- font preload отсутствует
- Cache-Control: нет s-maxage / stale-while-revalidate
- Brotli compression не включён (только gzip)
- Service Worker не зарегистрирован
- salary только 671 слов (<800)

### Результат

- 20 страниц по 96 критериям
- Site-Wide 5/5 ✅
- Per-page ~82/96 = 85%
- Отчёт: `AUDIT-20o.md`
- **Накопительно: 34 фикса локально + новый TODO список по техническим улучшениям**

---

## [2026-05-22] UX-аудит batch #14 — 30 страниц (KK + embed + legal + повторы)

### Что сделано (3 фикса)

| # | Калькулятор | Что | Файл |
|---|---|---|---|
| 32 | **sick-leave** | Дополнение к fix #21: i18n значения `opv` и `ipn` уже содержат "(10%)", а JSX добавляет ещё → дубль. Убрал проценты из i18n | `i18n RU+KK` |
| 33 | **gons** | Отсутствующий ключ `mrpFor2026` (был только `mrpFor2025`). На странице показывался raw `gons.mrpFor2026` | `i18n RU+KK` |
| 34 | **inheritance** | "Супружеская доля (50%) (50%)" — дубль. Убрал "(50%)" из i18n (JSX добавляет) | `i18n RU+KK` |

### Проверено

- 3 KK-страницы
- 10 embed-страниц
- 6 legal-страниц
- 19 калькуляторов (включая повторы для подтверждения старых фиксов)

### Результат

- 37 страниц, ✅ OK 27, 🔧 fix 3, 🟡 production старая версия (фиксы ждут деплоя) ~5
- Отчёт: `AUDIT-20n.md`
- **Накопительно: 34 фикса** (3 в production + 31 локально)

---

## [2026-05-22] UX-аудит batch #13 — 32 страницы (расширенные параметры) + системная проверка sources

### Контекст

Расширенный UX-аудит с 12 параметрами детектора на каждой странице (raw keys, ::, дубли скобок, NaN, undefined, [object Object], 2×₸, год, источники, FAQ, экспорт). Проверка 32 страниц + системный grep всех 121 калькуляторов на наличие блока "Источники".

### 6 новых фиксов (накопительно 31)

| # | Калькулятор | Что | Тип |
|---|---|---|---|
| 26 | **teacher-salary** | 5× дублей `(X) (X)`: "Сельская школа (+25%) (+25%)", "Малокомплектная школа (+20%) (+20%)", "ОПВ (10%) (10%)", **"ВОСМС (2.6%) (2%)" — конфликт ставок** (в коде 2%, в i18n 2.6%), "ИПН (10%, с вычетом 30 МРП) (10%)". Также опечатка `isSmallSchool` "+25%" → "+20%" | 🔴 **CRITICAL — конфликт ставок** |
| 27 | ramadan-sadaqah | 6× `::` (Фитр-садака::/Фидия-садака::) | i18n RU+KK |
| 28 | car-transfer | 3 отсутствующих ключа `regionAlmaty/Astana/Other` (показывались как raw `transfer.regionAlmaty`) | i18n RU+KK |
| **29** | **rent-vs-buy** | **"Дополнительные расходы: NaN"** — `formatNumber(sum) * parseInt(years)` (строка × число = NaN). Перенёс `* years` ВНУТРЬ `formatNumber()` | 🔴 **CRITICAL — поломанный результат** |
| 30 | rent-vs-buy | `marketContext.regions` "По регионам::" → "По регионам" | i18n RU+KK |
| 31 | rent-vs-buy | `marketContext.perYear` "% годовых" → "годовых" (JSX уже добавляет %, 5× дублей "% %") | i18n RU+KK |

### Этап B — системная проверка sources

`grep` по всем 118 файлам калькуляторов на наличие блока "Источники" / `sources={[...]}` / внешних ссылок на нормативные акты:
- **53 калькулятора (45%) БЕЗ блока источников**
- Из них **27 ключевых** (налоги/юридические/финансовые/трудовые) — требуют добавления источников для E-E-A-T (см. список в AUDIT-20m.md)
- 26 утилитарных (конвертеры, генераторы, утилиты) — источники не обязательны

### Результат

- 32 страницы проверено, ✅ OK 11, 🟡 minor 17, 🔴 critical 2
- 6 новых фиксов (накопительно 31)
- Отчёт: `AUDIT-20m.md`
- TODO: добавить sources к 27 ключевым калькуляторам (отдельная задача)

---

## [2026-05-22] UX-аудит batch #12 — 37 страниц вручную + 3 системных фикса

### Контекст

После скриншота пользователя с raw keys (`corporate-income-tax.description`, `rental-income-tax.description`) на /category/tax/ запустил ручную проверку ещё 37 страниц через chrome-devtools (390×844). Проверены все 13 категорий + 24 раритетных калькулятора, которые не попадали в предыдущие батчи.

### Что сделано (3 фикса)

| # | Что | Файл |
|---|---|---|
| 23 | **19 KK descriptions переведены** на казахский (были идентичны русским заглушкам): auto-leasing, body-fat, car-market-value, car-transfer, corporate-income-tax, crypto-tax, fancy-plates, fuel-cost, password-generator, property-sale-tax, qr-code-generator, rental-income-tax, sleep, tax-regime-comparison, traffic-fines, unified-payment, universal-declaration, vehicle-tco, water-intake | `i18n KK` |
| 24 | `apartment-valuation.roomsOpt.4+` — JSX генерирует ключ `4+`, в i18n были `4` и `5`. На странице показывалось raw `valuation.roomsOpt.4+`. Заменил ключи на `studio, 1, 2, 3, 4+` | `i18n RU+KK` |
| 25 | `insulation.regions.{central,west}` — JSX использует `north/south/central/west` (из объекта `REGION_R`), i18n имел `north/center/south`. На странице raw `insulation.regions.central` и `insulation.regions.west`. Добавил `central` и `west` | `i18n RU+KK` |

### Также подтверждено

- **20 raw description keys** в категориях `tax (7)`, `auto (7)`, `construction (1)`, `converters (2)`, `health (3)` — все уже исправлены через накопительный fix #7 (20× description keys), просто ждут деплоя.
- `fair-rental-price` "Площадь (м²) (м²)" в production — fix #10 уже сделан локально (убрано "(м²)" из i18n).

### Результат

- 37 страниц проверено, 33 OK (89%)
- 3 новых фикса (накопительно 25)
- Отчёт: `AUDIT-20l.md`
- Билд+деплой не сделан — пользователь сам выкатывает

---

## [2026-05-22] UX-аудит batch #11 — фиксы 7 калькуляторов (1 CRITICAL)

### Контекст

Подробный мобильный UX-аудит ещё 20+ страниц на calk.kz (Viewport 390×844, iPhone 14). Найдено 7 проблемных страниц. Из них одна **критическая (notary)** — поломан расчёт стоимости услуг, отображается "не число ₸".

### Что сделано (7 фиксов, 22 правки)

| # | Калькулятор | Что | Файл |
|---|---|---|---|
| 16 | `vat` | `zeroAppliesTo: "к:"` → `"к"` (убрано двойное "к::") | `i18n RU+KK` |
| 17 | `luxury-tax` | `importantFeatures.{declaration,valuation,concealment,thresholds}.title` — убраны ":" (4× двойных "::") | `i18n RU+KK` |
| 18 | `rental-income-tax` | Добавлены отсутствующие `regimeDesc.{individual,patent,simplified}` (3 raw keys) | `i18n RU+KK` |
| 19 | `car-market-value` | Добавлены отсутствующие `afterDepreciation`, `kMileage`, `kCondition`, `kRegion`, `kBody`, `kDamaged`, `kDocs` (7 raw keys) | `i18n RU+KK` |
| 20 | `farm-land-tax` | `examples.{parametersLabel,savingsLabel}` — убраны ":" (6× двойных "::" в 3 примерах) | `i18n RU+KK` |
| 21 | `sick-leave` | "ВОСМС (2%) (2%)" — убран дублирующий `(2%)` из JSX | `SickLeaveCalculator.tsx` |
| **22** | **`notary` 🔴** | **"не число ₸"** в результатах — добавил маппинг UI-значений `partyTypes` (`both-individuals/mixed/both-legal`) в data-ключи `partyKey` (`individuals/mixed/legal`) | **`NotaryServicesCalculator.tsx`** |

### CRITICAL bug в notary

`NotaryServicesCalculator.tsx`: `partyTypes` использовался напрямую как ключ в `service.stateFee[partyTypes]`, но UI выставлял значения `both-individuals/mixed/both-legal`, тогда как объект имеет ключи `individuals/mixed/legal`. Результат: `undefined * MRP_2026 = NaN` → форматировался как "не число ₸". Все три блока (Госпошлина / Технические услуги / Общая стоимость) выводили `"не число ₸"`. Добавил локальную переменную `partyKey` с правильным маппингом перед обращением к данным.

### Результат

- ✅ OK: **24 из 31** страниц (78%)
- 🔧 FIX: **7 калькуляторов, 22 правки**
- 🔴 CRITICAL: **1** (notary)
- Отчёт: `AUDIT-20k.md`
- Накопительно: **22 фикса локально** (3 deployed + 19 ждут билд+деплой)

---

## [2026-05-22] Фаза 8 — финальная чистка: удалён BMR, подключены PasswordGenerator и QRCode (offline)

### Контекст

Финальная чистка после подключения 120 калькуляторов в Фазах 1–7. Удалён функциональный
дубль `BMRCalculator` (та же формула Mifflin-St Jeor что и в `CaloriesCalculator`),
подключены два утилитарных калькулятора в категорию `converters`, заменена внешняя
зависимость от `api.qrserver.com` на локальную JS-библиотеку `qrcode` ради реального
оффлайна и совместимости с App Store Guideline 4.2.

| Действие | Файл / Калькулятор | URL | Подробности |
|---|---|---|---|
| Удалён | `BMRCalculator.tsx` | — | Полный функциональный дубль `CaloriesCalculator` (формула Mifflin-St Jeor, TDEE, макросы) |
| Подключён | `PasswordGeneratorCalculator` | `/calculator/password-generator/` | Категория `converters`, иконка `Key`. Локальная генерация через `crypto.getRandomValues()`, оценка надёжности и времени взлома, мульти-генерация до 20 паролей |
| Переработан + подключён | `QRCodeGeneratorCalculator` | `/calculator/qr-code-generator/` | Категория `converters`, иконка `QrCode`. Заменили `fetch('https://api.qrserver.com/...')` на библиотеку `qrcode` (`QRCode.toDataURL`) — генерация полностью офлайн, без сетевых запросов |

### Что сделано

- **Удалён `src/components/calculators/BMRCalculator.tsx`** — нигде не импортировался,
  безопасно. Чанк `BMRCalculator-*.js` пропал из `dist/assets/`.
- **Установлены пакеты:** `qrcode@^1.5.4` + `@types/qrcode@^1.5.6` (один из самых
  популярных JS-генераторов QR, ~30 KB gzip).
- **`QRCodeGeneratorCalculator.tsx` переработан:** убран `useMemo(() => api.qrserver...)`,
  добавлен `useEffect` с `QRCode.toDataURL(qrData, { width, margin: 2, errorCorrectionLevel: 'M', color: { dark, light } })`
  → результат записывается в state `qrDataUrl`. Сохранены все 6 типов QR (`url`/`text`/`phone`/`email`/`wifi`/`vcard`),
  настройки размера и цветов. Кнопка «Скачать PNG» теперь генерирует data-URL и эмулирует клик
  по `<a download>`. Добавлена кнопка «Скопировать» (PNG в clipboard через `ClipboardItem`).
- **i18n RU + KK:** добавлены секции `password-gen.*` (≈30 ключей: title, subtitle, length, upper/lower/digits/symbols,
  excludeSimilar, multiple, copied, crackTime, privacy, strength.{weak,medium,strong,veryStrong}, faq.{q1-q5,a1-a5})
  и `qr-code.*` (≈30 ключей: title, subtitle, type, types.{url,text,phone,email,wifi,vcard}, url, text,
  phone, subject, ssid, password, encryption, nopass, name, appearance, size, color, bgcolor, result,
  download, copyImage, copied, offlineNote, faq.{q1-q5,a1-a5}) — `src/i18n/locales/{ru,kk}/calculators.json`.
- **Регистрация в реестре:** `src/data/calculators.ts` — `converters.calculators` дополнен двумя
  записями (id `password-generator` и `qr-code-generator`).
- **`src/utils/iconMap.ts`:** добавлена иконка `QrCode` из `lucide-react` (`Key` уже была).

### Проверки

- `python3 -c "import json; json.load(...)"` — `RU OK`, `KK OK`.
- `grep -rn "api.qrserver\|qrserver.com" src dist` — ничего (источник чист, сборка чиста).
- `grep -r "BMRCalculator" src` — пусто.
- `npx vite build` — `✓ built in 3.95s`, в `dist/assets/` есть `PasswordGeneratorCalculator-ktL9lA2K.js`,
  `QRCodeGeneratorCalculator-Tpp9d_cm.js` (33 KB / 11.76 KB gzip — включает встроенную `qrcode`).
- Чанк `BMRCalculator-*.js` отсутствует в `dist/` — компонент действительно удалён.

### Итог Фазы 8

**121 калькулятор** в реестре (120 после Фазы 7 − 1 BMR + 2 утилиты).
Сайт полностью оффлайн-совместим — больше нет зависимостей от сторонних API
для рендеринга калькуляторов. Это снимает риск отклонения по Apple Guideline 4.2
(Minimum Functionality) и устраняет лишний внешний сетевой запрос.

## [2026-05-22] Фаза 7 — подключены 15 разнородных калькуляторов + категории education, real-estate

### Контекст

Финальная фаза подключения готовых компонентов. После Фаз 1–6 в реестре было
**105 калькуляторов в 12 категориях**; Фаза 7 добавляет **15 калькуляторов** и
создаёт **2 новые категории** (`education`, `real-estate`), доводя итог до
**120 калькуляторов в 14 категориях**.

| Калькулятор | URL | Категория | Иконка | Что считает |
|---|---|---|---|---|
| ENTScoreCalculator | `/calculator/ent-score/` | `education` | `GraduationCap` | Баллы ЕНТ (макс 140) + шансы на грант 5 ВУЗов (КазНУ 95-115, NU 130+, KIMEP 85-110, ЕНУ, Сатпаева) |
| GPACalculator | `/calculator/gpa/` | `education` | `Award` | GPA: 100-балльная КЗ → 4.0 США / ECTS / 5-балл РФ / UK с учётом кредитов |
| FairRentalPriceCalculator | `/calculator/fair-rental-price/` | `real-estate` | `Key` | Справедливая цена аренды 7 городов РК (Алматы 1-комн 250-400К, Астана 200-350К) с окупаемостью |
| ApartmentValuationCalculator | `/calculator/apartment-valuation/` | `real-estate` | `Home` | Оценка квартиры по 7 городам × материал × год × ремонт (Алматы 600-1200К ₸/м²) |
| CostOfLivingCalculator | `/calculator/cost-of-living/` | `real-estate` | `MapPin` | Стоимость жизни 10 городов РК (Алматы 350К/мес, Семей 180К) |
| HajjCalculator | `/calculator/hajj/` | `religious` | `MapPin` | Хадж/Умра: 3 пакета USD-цены (Хадж 5500-15000, Умра 1200-4000), курс, виза, страховка |
| IslamicMortgageCalculator | `/calculator/islamic-mortgage/` | `religious` | `Home` | Исламская ипотека: мурабаха vs иджара (Al Hilal, Заман Банк, Сауле Капитал), ставки 8-12% |
| TireSizeCalculator | `/calculator/tire-size/` | `auto` | `CircleDot` | Замена шин: диаметр/окружность/RPM/клиренс + ошибка спидометра |
| CashFlowGapCalculator | `/calculator/cash-flow-gap/` | `finance` | `TrendingDown` | Кассовый разрыв: DSO/DPO/DIO циклы (CCC = DSO+DIO−DPO) + альтернативы (овердрафт, факторинг) |
| FranchisePaybackCalculator | `/calculator/franchise-payback/` | `finance` | `Store` | Окупаемость франшизы: паушал + роялти + маркетинг + налоги (18-24 мес = норма) |
| AgeCalculator | `/calculator/age/` | `converters` | `Cake` | Точный возраст: годы/мес/дни/часы/секунды + дни до пенсии РК (63 муж, 60-63 жен в 2026-2028) |
| PetAgeCalculator | `/calculator/pet-age/` | `converters` | `Heart` | Возраст кошки/собаки в человеческих годах (4 размера: small/medium/large/giant) |
| RomanNumeralsCalculator | `/calculator/roman-numerals/` | `converters` | `Hash` | Арабские ↔ римские (1-3999) с copy-to-clipboard и историей |
| UnitConverterCalculator | `/calculator/unit-converter/` | `converters` | `ArrowLeftRight` | Универсальный конвертер: 6 категорий (длина/вес/объём/темп/площадь/скорость) × 30+ единиц |
| TimezoneCalculator | `/calculator/timezone/` | `converters` | `Globe` | Сравнение времени 18 городов мира с Казахстаном (UTC+5: Алматы=Астана=Атырау с 2024) |

### Что сделано

1. **Регистрация в реестре** (`src/data/calculators.ts`)
   - +2 новые категории: `education` (GraduationCap) и `real-estate` (Building2)
   - +2 entry в `education`: ent-score, gpa
   - +3 entry в `real-estate`: fair-rental-price, apartment-valuation, cost-of-living
   - +2 entry в `religious`: hajj, islamic-mortgage
   - +1 entry в `auto`: tire-size
   - +2 entry в `finance`: cash-flow-gap, franchise-payback
   - +5 entry в `converters`: age, pet-age, roman-numerals, unit-converter, timezone

2. **iconMap** (`src/utils/iconMap.ts`)
   - Добавлены недостающие иконки: ArrowLeftRight, Award, BarChart3, Bitcoin, Building2,
     Cake, CircleDot, Fuel, Globe, Hash, Key, MapPin, Plane, Store, Target, TrendingDown
   - (некоторые использовались и раньше в калькуляторах из ранних фаз, но не были экспортированы)

3. **i18n переводы калькуляторов** (`src/i18n/locales/{ru,kk}/calculators.json`)
   - 15 новых top-level ключей + дублирующий `cost-living` (компонент использует префикс `cost-living.*`)
   - 105 → 121 ключ в каждом файле (RU + KK)
   - Полные FAQ из 5 Q&A на калькулятор с конкретикой РК (банки, ставки, цены 2026, нормативные акты)

4. **i18n категории** (`src/i18n/locales/{ru,kk}/categories.json`)
   - +2 ключа: `education` (Образование/Білім беру) и `real-estate` (Недвижимость/Жылжымайтын мүлік)

5. **Сборка**
   - `npx vite build` — успешно за 4.04с
   - 15 chunks в `dist/assets/`: ENTScoreCalculator, GPACalculator, FairRentalPriceCalculator,
     ApartmentValuationCalculator, CostOfLivingCalculator, HajjCalculator, IslamicMortgageCalculator,
     TireSizeCalculator, CashFlowGapCalculator, FranchisePaybackCalculator, AgeCalculator,
     PetAgeCalculator, RomanNumeralsCalculator, UnitConverterCalculator, TimezoneCalculator

### Итог программы подключения (Фазы 1-7)

- **120 калькуляторов** в **14 категориях**: tax (17), auto (15), finance (18), agriculture (1),
  social (17), legal (9), construction (5), utilities (4), converters (9), religious (6),
  math (4), health (6), education (2), real-estate (3)
- 100% i18n покрытие RU + KK с конкретикой РК (МРП, банки, проходные баллы, цены 2026)
- Полные SEO-данные (sitemap + structuredData + llms.txt) генерируются автоматически из реестра

## [2026-05-22] Фаза 6 — подключены 7 трудовых калькуляторов

### Контекст

Фаза 6 общей программы подключения готовых компонентов. После Фаз 1–5 в реестре
было 98 калькуляторов в 12 категориях; эта фаза добавляет **7 трудовых/зарплатных**
калькуляторов (1 в `tax`, 6 в `social`), доводя общее число до **105 калькуляторов**
в тех же 12 категориях.

| Калькулятор | URL | Категория | Иконка | Что считает |
|---|---|---|---|---|
| TaxRegimeComparisonCalculator | `/calculator/tax-regime-comparison/` | `tax` | `BarChart3` | Сравнение режимов ИП: упрощёнка 4% / ОУР 10%+15% / ЕСП 1 МРП / розничный 4% — оптимальный режим по НК РК 2026 |
| SalaryReverseCalculator | `/calculator/salary-reverse/` | `social` | `RefreshCw` | Обратный расчёт net → gross + полная стоимость работодателю (СН 11%, СО 3.5%, ОСМС 3%, ОПВР 1.5%) |
| BusinessTripCalculator | `/calculator/business-trip/` | `social` | `Plane` | Командировочные: РК 4-6 МРП/день (НК РК ст. 244), зарубеж 75-150 USD по регионам, налогообложение сверхнорм |
| AverageEarningsCalculator | `/calculator/average-earnings/` | `social` | `TrendingUp` | Средний заработок: для отпуска (12 мес ÷ 29.3), больничного (12 мес ÷ рабочие дни), декрета (24 мес), увольнения, командировок |
| OvertimeCalculator | `/calculator/overtime/` | `social` | `Clock` | Сверхурочные ×1.5/×2 (ТК РК ст. 108), выходные ×2 (ст. 109), ночные +0.5 (22:00-06:00) + удержания и опция отгула |
| SecondJobCalculator | `/calculator/second-job/` | `social` | `Briefcase` | Совместительство: основная (с вычетом 30 МРП) + внешняя (без вычета), max 4 ч/день по ТК РК ст. 196 |
| TeacherSalaryCalculator | `/calculator/teacher-salary/` | `social` | `GraduationCap` | Зарплата учителя 2026: БДО 23 578 ₸ × коэффициент категории (модератор/эксперт/исследователь/мастер) × стаж + сельские/малокомплектные надбавки |

### Что сделано

1. **Регистрация в реестре** (`src/data/calculators.ts`)
   - +1 entry в категорию `tax` (TaxRegimeComparison после `esp-self-employed`)
   - +6 entry в категорию `social` (после `severance-pay`)
   - Иконки `BarChart3`, `RefreshCw`, `Plane`, `TrendingUp`, `Clock`, `Briefcase`, `GraduationCap` уже есть в `iconMap`

2. **i18n переводы калькуляторов** (`src/i18n/locales/{ru,kk}/calculators.json`)
   - 7 новых top-level ключей × 2 языка (98 → 105 ключей в каждом файле)
   - Конкретика РК 2026: МРП 3 932 ₸, МЗП 85 000 ₸, БДО педагогов 23 578 ₸,
     ставки ИПН 10%, ОПВ 10%, ВОСМС 2.6%, ОСМС 5%, СО 3.5%, ОПВР 1.5%, СН 11%
   - Динамические подключи:
     - `tax-regime.regimes.{simplified|general|esp|retail}`
     - `business-trip.city.{capital|regional|other}`,
       `business-trip.regions.{cis|china|eu|uae}`
     - `average-earnings.purposes.{vacation|sickLeave|businessTrip|dismissal|maternity}`
       и `*Hint` для каждой
     - `overtime.types.{weekend|holiday|night|overtime12|overtime3plus}`
       и `overtime.typesHint.*`
     - `teacher-salary.categories.{none|moderator|expert|researcher|master}`,
       `teacher-salary.bonus.{classTeacher|notebookCheck|cabinetHead|methodist}`
   - 5 FAQ Q&A на каждый калькулятор × 2 языка (35 QA пар × 2 = 70 ответов)
   - Все суммы и нормы со ссылками на статьи ТК РК (ст. 102, 108, 109, 110, 117, 133, 196) и НК РК (ст. 244)

3. **Сборка** (`npx vite build`)
   - 7 новых чанков в `dist/assets/`: TaxRegimeComparisonCalculator, SalaryReverseCalculator,
     BusinessTripCalculator, AverageEarningsCalculator, OvertimeCalculator, SecondJobCalculator,
     TeacherSalaryCalculator
   - Без ошибок TypeScript и Rollup

### Итого в реестре

- **Категории**: 12 (без изменений)
- **Калькуляторы**: 98 → **105** (+7)
- **Категория `tax`**: 16 → 17 калькуляторов
- **Категория `social`**: 11 → 17 калькуляторов

---

## [2026-05-22] Фаза 5 — подключены 5 строительных калькуляторов + новая категория construction

### Контекст

Фаза 5 общей программы подключения готовых, но незарегистрированных компонентов
из `src/components/calculators/`. После Фаз 1–4 в реестре было 93 калькулятора в
11 категориях; эта фаза вводит **новую категорию `construction`** и добавляет
5 новых entry, доводя общее число до 98 калькуляторов в 12 категориях.

| Калькулятор | URL | Иконка | Что считает |
|---|---|---|---|
| ConcreteVolumeCalculator | `/calculator/concrete-volume/` | `Box` | Объём бетона М200 (B15): плита/фундамент/колонна/лестница → цемент 320 кг/м³, песок, щебень, вода + стоимость материалов |
| BrickCalculator | `/calculator/brick/` | `Layers` | Кирпич/блоки: 5 типов (одинарный 51 шт/м², полуторный 39, двойной 26, керамзитоблок, газоблок 600×300×200) × 4 толщины кладки, раствор, цемент, песок |
| WallpaperCalculator | `/calculator/wallpaper/` | `Square` | Обои: периметр × высота, 4 типа рулонов (0.53×10, 0.53×15, 1.06×10, 1.06×25), рапорт 0–100 см, проёмы, клей |
| FlooringCalculator | `/calculator/flooring/` | `Grid3x3` | Ламинат/паркет/плитка/линолеум/винил SPC: цена ₸/м², прямая (5%) vs диагональная (15%) укладка, подложка 600 ₸/м², плинтус 1200 ₸/шт |
| InsulationCalculator | `/calculator/insulation/` | `Thermometer` | Утепление: 5 материалов (минвата, ПСБ-25, XPS, PIR, эковата) × 4 региона КЗ (R 3.0–4.7), расчёт толщины, экономия отопления, окупаемость |

### Что сделано

1. **Новая категория `construction`** (`src/data/calculators.ts`)
   - Добавлен 12-й объект категории между `legal` и `utilities`
   - Иконка `HardHat` (новая в `iconMap.ts`)
   - 5 калькуляторов с React.lazy импортами

2. **i18n переводы категории** (`src/i18n/locales/{ru,kk}/categories.json`)
   - **RU**: 11 → 12 категорий (добавлено: «Строительные калькуляторы»)
   - **KK**: 11 → 12 категорий (добавлено: «Құрылыс калькуляторлары»)

3. **i18n переводы калькуляторов** (`src/i18n/locales/{ru,kk}/calculators.json`)
   - 5 новых top-level ключей (`concrete`, `brick`, `wallpaper`, `flooring`, `insulation`) × 2 языка
   - Конкретика по строительству 2026: марки бетона М100–М400, цены ₸/кг и ₸/м³,
     теплопроводность λ, требуемое R по СНиП РК для 4 регионов
   - Динамические подключи: `concrete.shapes.{slab|foundation|column|stairs}`,
     `brick.types.{single|oneAndHalf|double|block|gasBlock}`,
     `brick.thicknessLabels.{half|one|oneAndHalf|two}`,
     `flooring.materials.{laminate|parquet|tile|linoleum|vinyl}`,
     `insulation.materials.{mineralWool|foam|xps|pir|ecowool}`,
     `insulation.regions.{north|south|central|west}`
   - 5 FAQ Q&A на калькулятор × 5 = **25 FAQ-блоков** в каждом языке
   - **RU**: 93 → 98 top-level ключей
   - **KK**: 93 → 98 top-level ключей

4. **Расширение `iconMap.ts`**
   - Добавлены lucide-иконки: `HardHat`, `Box`, `Layers`, `Square`, `Grid3x3`
   - Все импорты в одном файле для tree-shaking без 1500+ иконок

5. **Проверка сборки**
   - `npx vite build` — успешно за 3.84s
   - 5 новых чанков в `dist/assets/`:
     `ConcreteVolumeCalculator-*.js`, `BrickCalculator-*.js`, `WallpaperCalculator-*.js`,
     `FlooringCalculator-*.js`, `InsulationCalculator-*.js`

### Строительные данные (актуально на 2026 год, Казахстан)

- **Бетон М200 (B15)**: цемент 320 кг, песок 640 кг, щебень 1200 кг, вода 170 л / 1 м³
- **Цена готового бетона М200 с миксером**: 22 000–28 000 ₸/м³ (Алматы/Астана)
- **Кирпич одинарный M150**: 80–120 ₸/шт; газоблок D500: 18 000–22 000 ₸/м³
- **Расход раствора**: 0.25 м³ на 1 м³ кирпичной кладки
- **Обои**: стандарт 0.53×10 м = 5.3 м², метровые 1.06×10 м = 10.6 м²
- **Ламинат 32 класс**: 5 000–8 000 ₸/м²; винил SPC: 5 000–12 000 ₸/м²
- **Утеплитель по СНиП РК**: R = 4.7 (Север), 4.0 (Центр), 3.5 (Запад), 3.0 (Юг)
- **Минвата λ=0.04, 35 000 ₸/м³**; пеноплекс XPS λ=0.032, 55 000 ₸/м³

---

## [2026-05-22] Фаза 4 — подключены 6 юридических калькуляторов (Legal category)

### Контекст

Фаза 4 общей программы подключения готовых, но незарегистрированных компонентов
из `src/components/calculators/`. После Фаз 1–3 в реестре было 87 калькуляторов;
эта фаза добавляет 6 новых entry в категорию `legal`, доводя общее число до 93.

| Калькулятор | URL | Иконка | Что считает |
|---|---|---|---|
| InheritanceCalculator | `/calculator/inheritance/` | `Users` | Наследство РК: очереди 1/2/3, супружеская доля 50%, обязательная доля 1/2 от законной, нотариус (ГК ст. 1061–1069) |
| DivorceCalculator | `/calculator/divorce/` | `Heart` | Стоимость развода: ЗАГС (2 МРП) vs суд (3 МРП), госпошлины НК РК, сроки 1–6 мес. |
| PropertyDivisionCalculator | `/calculator/property-division/` | `Scale` | Раздел имущества при разводе: совместное 50/50, личное, долги, отступление 55/45 в интересах детей (КоБС ст. 33–38) |
| StatuteLimitationsCalculator | `/calculator/statute-limitations/` | `Clock` | Сроки исковой давности: 12 категорий (общая 3 г., налог. 5 л., трудовой 3 мес., виндикация 10 л.) |
| BankruptcyCalculator | `/calculator/bankruptcy/` | `AlertTriangle` | Банкротство физлиц РК (Закон №178-VII): 3 процедуры — внесудебная (≤1600 МРП), судебная, восстановление |
| MoralDamageCalculator | `/calculator/moral-damage/` | `HandHeart` | Моральный вред: 9 категорий в МРП × severity × модификаторы (доказательства/свидетели/долгоср.) ст. 951–952 ГК РК |

### Что сделано

1. **i18n переводы** (`src/i18n/locales/{ru,kk}/calculators.json`)
   - 6 новых top-level ключей × 2 языка
   - Юридическая конкретика: ссылки на статьи (ГК РК, КоБС, ТК РК, НК РК, КоАП РК),
     актуальные тарифы МРП 2026 = 4 325 ₸, пороги в МРП, сроки в днях
   - 5 FAQ Q&A на калькулятор × 6 = **30 FAQ-блоков** в каждом языке
   - **RU**: 87 → 93 top-level ключа
   - **KK**: 87 → 93 top-level ключа

2. **Реестр** (`src/data/calculators.ts`)
   - 6 entry добавлены в категорию `legal` после существующих `court-fee`, `penalty`, `notary`
   - Иконки: `Users`, `Heart`, `Scale`, `Clock`, `AlertTriangle`, `HandHeart` (все из `iconMap.ts`)

3. **Проверка сборки**
   - `npx vite build` — успешно за 4.54s
   - 6 новых чанков в `dist/assets/`:
     `InheritanceCalculator-*.js`, `DivorceCalculator-*.js`, `PropertyDivisionCalculator-*.js`,
     `StatuteLimitationsCalculator-*.js`, `BankruptcyCalculator-*.js`, `MoralDamageCalculator-*.js`

### Юридическая база (актуально на 2026 год)

- **МРП 2026** = 4 325 ₸; **МЗП** = 85 000 ₸
- **Развод**: ЗАГС 2 МРП (8 650 ₸), суд 3 МРП (12 975 ₸), раздел 1% от иска, мин. 0.5 МРП
- **Наследство**: 1 МРП за свидетельство, срок 6 мес. (ст. 1072 ГК РК), обязательная доля 1/2 (ст. 1069)
- **Банкротство**: порог внесудебной процедуры 1 600 МРП = 6 920 000 ₸, реестр 5 лет
- **Исковая давность**: общая 3 года (ст. 178), налоговая 5 лет (ст. 48 НК), виндикация 10 лет (ст. 240)
- **Моральный вред**: ст. 951–952 ГК РК, ориентиры 10–5 000 МРП по категориям

---

## [2026-05-22] Фаза 3 — подключены 8 автомобильных калькуляторов (Auto category)

### Контекст

Фаза 3 общей программы подключения готовых, но незарегистрированных компонентов
из `src/components/calculators/`. После Фаз 1–2 в реестре уже находились 79 калькуляторов;
эта фаза добавляет 8 новых entry в категорию `auto`, доводя общее число до 87.

| Калькулятор | URL | Иконка | Что считает |
|---|---|---|---|
| KaskoCalculator | `/calculator/kasko/` | `Shield` | Премия КАСКО (4% база × коэффициенты возраст/стаж/регион/возраст авто/франшиза) |
| VehicleTCOCalculator | `/calculator/vehicle-tco/` | `DollarSign` | Полная стоимость владения за 1/3/5/10 лет: топливо + страховка + налог ТС + ТО |
| AutoLeasingCalculator | `/calculator/auto-leasing/` | `Wallet` | Лизинг vs кредит: первонач. взнос, остаточная стоимость, ГЭСВ |
| CarMarketValueCalculator | `/calculator/car-market-value/` | `TrendingUp` | Оценка б/у авто: пробег, износ, регион, кузов, состояние |
| CarTransferCalculator | `/calculator/car-transfer/` | `RefreshCw` | Стоимость переоформления авто: госпошлины, нотариус, ОГПО, ИПН с продажи |
| FuelCostCalculator | `/calculator/fuel-cost/` | `Fuel` | Расход и стоимость топлива на маршруте (Алматы–Астана, Алматы–Шымкент) |
| TrafficFinesCalculator | `/calculator/traffic-fines/` | `AlertTriangle` | Штрафы ПДД РК (КоАП РК) со скидкой 50% за 7 дней |
| FancyPlatesCalculator | `/calculator/fancy-plates/` | `Hash` | Сбор за красивые госномера в МРП (ст. 605 НК РК) |

### Что сделано

1. **i18n переводы** (`src/i18n/locales/{ru,kk}/calculators.json`)
   - 8 новых top-level ключей × 2 языка = **16 наборов переводов**
   - **408 leaf-ключей** на каждый язык (UI, параметры, результаты, рекомендации,
     5 FAQ Q&A на калькулятор, экспортные секции, breakdown по коэффициентам)
   - **RU**: 79 → 87 top-level ключей
   - **KK**: 79 → 87 top-level ключей

2. **Регистрация в реестре** (`src/data/calculators.ts`)
   - 8 entry в категорию `auto` после `parcel-customs`
   - React.lazy import для каждого компонента
   - Иконки из `lucide-react` (все уже используются в других калькуляторах)

3. **Конкретика по РК в i18n-ключах**
   - МРП 2026 = 4 325 ₸ (актуальное значение)
   - Цены на топливо: АИ-92 ~237 ₸/л, АИ-95 ~250 ₸/л, АИ-98 ~340 ₸/л, ДТ ~295 ₸/л, газ ~100 ₸/л
   - Маршруты: Алматы–Астана 1 200 км, Алматы–Шымкент 700 км, Астана–Караганда 220 км
   - КАСКО: ставка 4%, коэффициенты возраст/стаж/регион/возраст авто
   - Штрафы по КоАП РК: ст. 592, 593, 596, 597, 600, 608, 611 (превышение, ремень, пьяное вождение и т.д.)
   - Скидка 50% за оплату штрафа в 7 дней (ст. 893 КоАП РК)
   - Красивые номера: ст. 605 НК РК — от 2 МРП (стандартный) до 170 МРП (001 ААА, 007 ААА)
   - Лизинг: ставки БРК/Halyk/Forte 18–22%, остаточная стоимость 20–30%

### Сборка

- `npx vite build` → ✓ built in 4.29s
- 8 новых .js-файлов в `dist/assets/` (от 8 до 16 КБ каждый)
- Все существующие 79 калькуляторов остались работоспособными

### Веб

После деплоя следующие URL начнут показывать калькуляторы:
- `https://calk.kz/calculator/kasko/`
- `https://calk.kz/calculator/vehicle-tco/`
- `https://calk.kz/calculator/auto-leasing/`
- `https://calk.kz/calculator/car-market-value/`
- `https://calk.kz/calculator/car-transfer/`
- `https://calk.kz/calculator/fuel-cost/`
- `https://calk.kz/calculator/traffic-fines/`
- `https://calk.kz/calculator/fancy-plates/`

---

## [2026-05-22] iOS Build #3 — подключены 3 health-калькулятора (Body Fat / Sleep / Water Intake)

### Контекст

Аудит показал, что в `src/components/calculators/` лежат 4 готовых health-компонента,
которые **не были зарегистрированы** в реестре `src/data/calculators.ts` — соответственно,
не имели URL, не попадали в sitemap, не виделись пользователями и Apple-ревьюером.

| Файл | Решение | Причина |
|---|---|---|
| `BMRCalculator.tsx` | ❌ Не подключаем | Функциональный дубль `CaloriesCalculator` (та же Mifflin-St Jeor + TDEE + макросы) — каннибализация SEO |
| `BodyFatCalculator.tsx` | ✅ Подключён | Уникальная U.S. Navy формула (Hodgdon & Beckett 1984), нет дубликата |
| `SleepCalculator.tsx` | ✅ Подключён | Уникальный — циклы сна по National Sleep Foundation |
| `WaterIntakeCalculator.tsx` | ✅ Подключён | Уникальный — IOM DRI 2005 с поправками на климат/беременность |

### Что сделано

1. **Регистрация в реестре** (`src/data/calculators.ts`)
   - Добавлены 3 новых entry в категорию `health`:
     - `/calculator/body-fat/` — иконка `Activity`
     - `/calculator/sleep/` — иконка `Moon`
     - `/calculator/water-intake/` — иконка `Droplets`

2. **i18n переводы** (`src/i18n/locales/{ru,kk}/calculators.json`)
   - 3 новых ключа верхнего уровня × 2 языка = **6 наборов переводов**
   - Каждый набор: ~30-40 ключей (UI, активность, климат, beadcrumb, 5 FAQ Q&A)
   - **RU**: 62 → 65 top-level ключей
   - **KK**: 62 → 65 top-level ключей

3. **MedicalDisclaimer с источниками** (Apple Guideline 1.4.1)
   - **Body Fat**: Hodgdon & Beckett 1984 (Naval Health Research Center) • ACE Body Fat Norms • NIH StatPearls Body Composition
   - **Sleep**: Hirshkowitz et al. 2015 (National Sleep Foundation, PubMed) • AASM Sleep Education • CDC Sleep • NIH NHLBI Sleep
   - **Water Intake**: IOM DRI for Water 2005 (NAS) • EFSA DRV 2010 • WHO Drinking Water • NASEM Pregnancy/Lactation

4. **FAQ.sources** также расширен для всех трёх (3-4 ссылки)

### iOS Build #3

- `CURRENT_PROJECT_VERSION = 2 → 3`
- Полный цикл: vite build → cap sync ios → xcodebuild archive → exportArchive upload
- Этот билд добавит 3 новые страницы которые Apple увидит при следующем review

### Веб

- После деплоя на calk.kz следующие URL перестанут отдавать главную и начнут показывать калькуляторы:
  - `https://calk.kz/calculator/body-fat/`
  - `https://calk.kz/calculator/sleep/`
  - `https://calk.kz/calculator/water-intake/`
- Sitemap.xml автоматически обновится при build

---

## [2026-05-21] iOS Submission #2 — Apple Guideline 1.4.1 compliance

### Контекст

Apple App Review отклонил iOS Build 1.0(1) с замечанием по **Guideline 1.4.1 — Safety: Physical Harm**:
медицинские/health-калькуляторы должны содержать **citations of sources** (ссылки на источники
формул и рекомендаций), легко находимые пользователем.

### Что добавлено

**Новый компонент:** `src/components/ui/MedicalDisclaimer.tsx`

- Заметный, **не сворачиваемый** prominent-блок с заголовком «Источники медицинской информации»
- Каждый источник: нумерованный пункт, ссылка на оригинал, описание (организация/год/что подтверждает)
- В конце — disclaimer о том, что калькулятор не заменяет консультацию врача
- i18n: ключи `medicalDisclaimer.title` и `medicalDisclaimer.notice` для RU и KK

**Калькуляторы, которые получили блок источников:**

| Калькулятор | Источники |
|---|---|
| **ИМТ / BMI** | WHO BMI Classification • CDC About Adult BMI • NIH/NHLBI Obesity Guidelines • NIH NLM peer-reviewed considerations paper |
| **Калории / BMR** | Mifflin-St Jeor (1990) — оригинальная публикация PubMed • Academy of Nutrition and Dietetics position paper • USDA Dietary Guidelines 2020-2025 • WHO Healthy Diet fact sheet • Institute of Medicine DRI Macronutrients |
| **Беременность** | ACOG Committee Opinion No. 700 (правило Негеле) • WHO Antenatal Care • NIH NICHD Pregnancy • Mayo Clinic Fetal Development • РЦРЗ МЗ РК клинические протоколы |

**Дополнительно:** массив `sources` в `FAQSection` каждого из этих калькуляторов также расширен
с 1-2 общих ссылок до 3-4 авторитетных источников (дублирование намеренное — чтобы источники
встречались и в свернутом FAQ-блоке, и в основном prominent-блоке).

### iOS Build

- `CURRENT_PROJECT_VERSION = 1 → 2` в `ios/App/App.xcodeproj/project.pbxproj`
- `CFBundleShortVersionString` остался `1.0` (минорный фикс контента, не новая версия)
- Новый билд **1.0 (2)** загружен в App Store Connect для повторного review

### Ответ Apple

Подготовлен в App Store Connect Messages: краткое описание добавленных citations с указанием
конкретных страниц/калькуляторов, где появились новые prominent-блоки источников.

---

## [2026-05-19] iOS App Store submission — первая подача

### Native iOS-приложение (Capacitor 8)

- **Bundle ID:** `kz.calk.app`
- **Version:** 1.0 (build 1)
- **Team:** Konstantin Iakovlev (`SRKYS78RMQ`)
- **Code signing:** Manual, Apple Distribution, profile `Calk kz App Store`
- **Privacy Manifest:** `PrivacyInfo.xcprivacy` с заявленными Required Reason APIs
- **Localizations:** ru, kk, en (`CFBundleLocalizations`)
- **iTunes encryption:** `ITSAppUsesNonExemptEncryption = false`
- **AdSense:** отключён на iOS (Apple Guideline 4.3) — проверка `Capacitor.getPlatform() === 'ios'`

### Native features (Capacitor plugins)

- iOS Share Sheet для результатов расчётов
- Haptic feedback на кнопках
- Local Notifications для дедлайнов ФНО 240/270
- Network status awareness с offline-индикатором
- Clipboard через native API

### Метаданные App Store

- Создан `ios/APP-STORE-METADATA.md` со всеми требуемыми текстами (RU + KK)
- Создан `ios/app-store-description-clean.txt` — версия описания без `═══` / `→` / `❤️`
  (App Store Connect режет эти символы как "invalid characters")
- Сгенерированы 18 скриншотов в 3 размерах: 1320×2868, 1242×2688, 2064×2752
  через `scripts/generate-app-store-screenshots.mjs` (Puppeteer)
- App Privacy: Data Not Linked to You — Crash Data + Performance Data (Diagnostics)
- Privacy Policy URL: `https://calk.kz/legal/privacy/`

---

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
