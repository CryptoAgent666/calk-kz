# Mobile UX Audit - KZ-CALK

Generated: 2026-03-05T16:27:16.970Z
Base URL: http://127.0.0.1:5173
Calculators tested: 57

## Summary
- Passed: 0
- With issues: 57
- Load failures: 0
- JS error pages: 0
- Overflow pages: 0
- Small tap-target pages: 57
- Suspected calculation issues: 3

## Findings
### income-tax
- URL: http://127.0.0.1:5173/calculator/income-tax/
- Title: Калькулятор ИПН 2026 - Расчет подоходного налога для наемных работников в Казахстане
- Issues: Small tap targets: 20
- Inputs: 7, Buttons: 13
- Overflow px: 0
- Small targets: 20
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/income-tax.png

### vehicle-tax
- URL: http://127.0.0.1:5173/calculator/vehicle-tax/
- Title: Калькулятор транспортного налога 2026 - Налог на автомобили в Казахстане | По МРП
- Issues: Small tap targets: 17
- Inputs: 5, Buttons: 12
- Overflow px: 0
- Small targets: 17
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/vehicle-tax.png

### property-tax
- URL: http://127.0.0.1:5173/calculator/property-tax/
- Title: Калькулятор налога на имущество 2026 - Расчет налога на недвижимость физических лиц в Казахстане
- Issues: Small tap targets: 14
- Inputs: 7, Buttons: 11
- Overflow px: 0
- Small targets: 14
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/property-tax.png

### ip-simplified
- URL: http://127.0.0.1:5173/calculator/ip-simplified/
- Title: Калькулятор налогов ИП на упрощенке 2026 - Расчет СНР и соцплатежей для индивидуальных предпринимателей
- Issues: Small tap targets: 21
- Inputs: 7, Buttons: 12
- Overflow px: 0
- Small targets: 21
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/ip-simplified.png

### tax-deductions
- URL: http://127.0.0.1:5173/calculator/tax-deductions/
- Title: Калькулятор налоговых вычетов 2026 - Возврат ИПН через социальные вычеты на образование и лечение
- Issues: Small tap targets: 16
- Inputs: 9, Buttons: 9
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/tax-deductions.png

### vat
- URL: http://127.0.0.1:5173/calculator/vat/
- Title: Калькулятор НДС онлайн - Добавление и выделение НДС 12% | Налог на добавленную стоимость
- Issues: Small tap targets: 18
- Inputs: 6, Buttons: 17
- Overflow px: 0
- Small targets: 18
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/vat.png

### vat-threshold
- URL: http://127.0.0.1:5173/calculator/vat-threshold/
- Title: Калькулятор порога по НДС 2026 - Отслеживание оборота для регистрации плательщиком НДС в Казахстане
- Issues: Small tap targets: 27
- Inputs: 14, Buttons: 18
- Overflow px: 0
- Small targets: 27
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/vat-threshold.png

### luxury-tax
- URL: http://127.0.0.1:5173/calculator/luxury-tax/
- Title: Калькулятор налога на роскошь 2026 - Повышенные налоги на дорогостоящее имущество в Казахстане
- Issues: Small tap targets: 13
- Inputs: 5, Buttons: 10
- Overflow px: 0
- Small targets: 13
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/luxury-tax.png

### casino-winnings-tax
- URL: http://127.0.0.1:5173/calculator/casino-winnings-tax/
- Title: Калькулятор налога на выигрыш в казино 2026 - Расчет налога с выигрышей в игорных заведениях РК
- Issues: Small tap targets: 21
- Inputs: 9, Buttons: 14
- Overflow px: 0
- Small targets: 21
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/casino-winnings-tax.png

### esp-self-employed
- URL: http://127.0.0.1:5173/calculator/esp-self-employed/
- Title: Калькулятор ЕСП 2026 - Единый совокупный платеж для самозанятых в Казахстане
- Issues: Small tap targets: 17
- Inputs: 5, Buttons: 11
- Overflow px: 0
- Small targets: 17
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/esp-self-employed.png

### customs-clearance
- URL: http://127.0.0.1:5173/calculator/customs-clearance/
- Title: Калькулятор таможенной очистки авто 2026 - Растаможка автомобилей в Казахстане | Пошлины и сборы
- Issues: Small tap targets: 13
- Inputs: 7, Buttons: 8
- Overflow px: 0
- Small targets: 13
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/customs-clearance.png

### recycling-fee
- URL: http://127.0.0.1:5173/calculator/recycling-fee/
- Title: Калькулятор утилизационного сбора 2026 - Расчет утильсбора при регистрации автомобиля в Казахстане
- Issues: Small tap targets: 14
- Inputs: 5, Buttons: 9
- Overflow px: 0
- Small targets: 14
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/recycling-fee.png

### registration-fee
- URL: http://127.0.0.1:5173/calculator/registration-fee/
- Title: Калькулятор госпошлины за регистрацию авто 2026 - Постановка автомобиля на учет в Казахстане
- Issues: Small tap targets: 16
- Inputs: 4, Buttons: 13
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/registration-fee.png

### insurance-premium
- URL: http://127.0.0.1:5173/calculator/insurance-premium/
- Title: Калькулятор ОГПО ВТС 2026 - Обязательное страхование автогражданской ответственности в Казахстане
- Issues: Small tap targets: 15; Result did not update after input/submit (suspected calculation issue)
- Inputs: 2, Buttons: 27
- Overflow px: 0
- Small targets: 15
- Console errors: 0, Page errors: 0
- Calc smoke: result=false, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/insurance-premium.png

### parcel-customs
- URL: http://127.0.0.1:5173/calculator/parcel-customs/
- Title: Калькулятор таможенной пошлины на посылки 2026 - Расчет пошлины при покупках из-за рубежа
- Issues: Small tap targets: 19
- Inputs: 7, Buttons: 15
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/parcel-customs.png

### credit
- URL: http://127.0.0.1:5173/calculator/credit/
- Title: Кредитный калькулятор 2026 - Расчет ежемесячных платежей и переплаты по кредиту в тенге
- Issues: Small tap targets: 22
- Inputs: 8, Buttons: 13
- Overflow px: 0
- Small targets: 22
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/credit.png

### deposit
- URL: http://127.0.0.1:5173/calculator/deposit/
- Title: Калькулятор банковских вкладов - Доходность депозитов с капитализацией | Проценты
- Issues: Small tap targets: 16
- Inputs: 10, Buttons: 11
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/deposit.png

### mortgage-specialized
- URL: http://127.0.0.1:5173/calculator/mortgage-specialized/
- Title: Ипотечный калькулятор 2026 - Сравнение программ ипотеки в Казахстане | ГЭСВ
- Issues: Small tap targets: 15
- Inputs: 8, Buttons: 6
- Overflow px: 0
- Small targets: 15
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/mortgage-specialized.png

### rent-vs-buy
- URL: http://127.0.0.1:5173/calculator/rent-vs-buy/
- Title: Калькулятор аренда или покупка жилья - Сравнение долгосрочных затрат на недвижимость в Казахстане
- Issues: Small tap targets: 13
- Inputs: 15, Buttons: 6
- Overflow px: 0
- Small targets: 13
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/rent-vs-buy.png

### compound-interest
- URL: http://127.0.0.1:5173/calculator/compound-interest/
- Title: Калькулятор сложного процента - Расчет доходности инвестиций с капитализацией процентов
- Issues: Small tap targets: 19
- Inputs: 6, Buttons: 21
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/compound-interest.png

### refinancing
- URL: http://127.0.0.1:5173/calculator/refinancing/
- Title: Калькулятор рефинансирования кредита - Calk.kz
- Issues: Small tap targets: 15
- Inputs: 8, Buttons: 12
- Overflow px: 0
- Small targets: 15
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/refinancing.png

### microloan
- URL: http://127.0.0.1:5173/calculator/microloan/
- Title: Калькулятор микрокредита - Calk.kz
- Issues: Small tap targets: 16
- Inputs: 7, Buttons: 15
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/microloan.png

### early-repayment
- URL: http://127.0.0.1:5173/calculator/early-repayment/
- Title: Калькулятор досрочного погашения кредита - Экономия на процентах при сокращении срока или платежа
- Issues: Small tap targets: 17
- Inputs: 6, Buttons: 11
- Overflow px: 0
- Small targets: 17
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/early-repayment.png

### farm-land-tax
- URL: http://127.0.0.1:5173/calculator/farm-land-tax/
- Title: Калькулятор единого земельного налога 2026 - ЕЗН для крестьянских и фермерских хозяйств Казахстана
- Issues: Small tap targets: 20
- Inputs: 10, Buttons: 13
- Overflow px: 0
- Small targets: 20
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/farm-land-tax.png

### salary
- URL: http://127.0.0.1:5173/calculator/salary/
- Title: Зарплатный калькулятор 2026 - Расчет зарплаты "на руки" в Казахстане | Социальные взносы
- Issues: Small tap targets: 19
- Inputs: 7, Buttons: 12
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/salary.png

### sick-leave
- URL: http://127.0.0.1:5173/calculator/sick-leave/
- Title: Калькулятор больничного листа 2026 - Расчет пособия по временной нетрудоспособности в Казахстане
- Issues: Small tap targets: 17
- Inputs: 6, Buttons: 14
- Overflow px: 0
- Small targets: 17
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/sick-leave.png

### maternity-benefits
- URL: http://127.0.0.1:5173/calculator/maternity-benefits/
- Title: Калькулятор декретных выплат 2026 - Пособия по беременности и родам в Казахстане
- Issues: Small tap targets: 16
- Inputs: 5, Buttons: 11
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/maternity-benefits.png

### pension
- URL: http://127.0.0.1:5173/calculator/pension/
- Title: Пенсионный калькулятор - Расчет пенсии по возрасту в Казахстане | ЕНПФ
- Issues: Small tap targets: 17; Result did not update after input/submit (suspected calculation issue)
- Inputs: 9, Buttons: 12
- Overflow px: 0
- Small targets: 17
- Console errors: 0, Page errors: 0
- Calc smoke: result=false, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/pension.png

### pension-annuity
- URL: http://127.0.0.1:5173/calculator/pension-annuity/
- Title: Калькулятор пенсионного аннуитета 2026 - Пожизненные выплаты из ЕНПФ через страховую компанию
- Issues: Small tap targets: 13
- Inputs: 6, Buttons: 8
- Overflow px: 0
- Small targets: 13
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/pension-annuity.png

### unemployment
- URL: http://127.0.0.1:5173/calculator/unemployment/
- Title: Калькулятор пособия по безработице 2026 - Расчет выплат при потере работы в Казахстане
- Issues: Small tap targets: 16
- Inputs: 5, Buttons: 9
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/unemployment.png

### social-assistance
- URL: http://127.0.0.1:5173/calculator/social-assistance/
- Title: Калькулятор АСП 2026 - Адресная социальная помощь малообеспеченным семьям в Казахстане
- Issues: Small tap targets: 16
- Inputs: 7, Buttons: 9
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/social-assistance.png

### gons
- URL: http://127.0.0.1:5173/calculator/gons/
- Title: Калькулятор ГОНС - Образовательный накопительный вклад с государственной поддержкой в Казахстане
- Issues: Small tap targets: 16
- Inputs: 7, Buttons: 11
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/gons.png

### alimony
- URL: http://127.0.0.1:5173/calculator/alimony/
- Title: Калькулятор алиментов 2026 - Расчет алиментов на детей по закону Казахстана
- Issues: Small tap targets: 19
- Inputs: 7, Buttons: 16
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/alimony.png

### vacation-pay
- URL: http://127.0.0.1:5173/calculator/vacation-pay/
- Title: Калькулятор отпускных 2026 - Расчет суммы отпускных выплат с удержаниями по ТК Казахстана
- Issues: Small tap targets: 19
- Inputs: 8, Buttons: 9
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/vacation-pay.png

### severance-pay
- URL: http://127.0.0.1:5173/calculator/severance-pay/
- Title: Калькулятор компенсации при увольнении 2026 - Расчет выплат и выходного пособия в Казахстане
- Issues: Small tap targets: 18
- Inputs: 8, Buttons: 14
- Overflow px: 0
- Small targets: 18
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/severance-pay.png

### court-fee
- URL: http://127.0.0.1:5173/calculator/court-fee/
- Title: Калькулятор госпошлины в суд - Судебные расходы и пошлины в Казахстане | МРП
- Issues: Small tap targets: 16
- Inputs: 4, Buttons: 13
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/court-fee.png

### penalty
- URL: http://127.0.0.1:5173/calculator/penalty/
- Title: Калькулятор пени онлайн - Расчет пени за просрочку платежей по различным обязательствам в Казахстане
- Issues: Small tap targets: 19
- Inputs: 12, Buttons: 6
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/penalty.png

### notary
- URL: http://127.0.0.1:5173/calculator/notary/
- Title: Калькулятор нотариальных услуг 2026 - Госпошлина и тарифы нотариусов в Казахстане
- Issues: Small tap targets: 16
- Inputs: 7, Buttons: 8
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/notary.png

### electricity
- URL: http://127.0.0.1:5173/calculator/electricity/
- Title: Калькулятор за электричество - Счет за электроэнергию по тарифам городов Казахстана
- Issues: Small tap targets: 16
- Inputs: 5, Buttons: 11
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/electricity.png

### water
- URL: http://127.0.0.1:5173/calculator/water/
- Title: Калькулятор за воду - Водоснабжение и канализация | Дифференцированные тарифы РК
- Issues: Small tap targets: 16
- Inputs: 6, Buttons: 9
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/water.png

### heating
- URL: http://127.0.0.1:5173/calculator/heating/
- Title: Калькулятор отопления - Центральное отопление по нормативам и приборам учета
- Issues: Small tap targets: 17; Result did not update after input/submit (suspected calculation issue)
- Inputs: 7, Buttons: 9
- Overflow px: 0
- Small targets: 17
- Console errors: 0, Page errors: 0
- Calc smoke: result=false, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/heating.png

### gas
- URL: http://127.0.0.1:5173/calculator/gas/
- Title: Калькулятор за газ - Природный газ | Тарифы по городам Казахстана 2026
- Issues: Small tap targets: 16
- Inputs: 5, Buttons: 11
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/gas.png

### currency-converter
- URL: http://127.0.0.1:5173/calculator/currency-converter/
- Title: Конвертер валют онлайн - Курсы валют НБРК на сегодня | USD, EUR, RUB к тенге
- Issues: Small tap targets: 27
- Inputs: 6, Buttons: 24
- Overflow px: 0
- Small targets: 27
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/currency-converter.png

### time-converter
- URL: http://127.0.0.1:5173/calculator/time-converter/
- Title: Конвертер единиц времени онлайн - Преобразование дней, недель, месяцев, лет и других единиц
- Issues: Small tap targets: 32
- Inputs: 7, Buttons: 27
- Overflow px: 0
- Small targets: 32
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/time-converter.png

### number-to-words
- URL: http://127.0.0.1:5173/calculator/number-to-words/
- Title: Калькулятор чисел прописью - Преобразование цифр в текст на русском, казахском и английском
- Issues: Small tap targets: 30
- Inputs: 3, Buttons: 29
- Overflow px: 0
- Small targets: 30
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/number-to-words.png

### time-to-words
- URL: http://127.0.0.1:5173/calculator/time-to-words/
- Title: Калькулятор времени прописью - Преобразование времени в текстовое представление на разных языках
- Issues: Small tap targets: 32
- Inputs: 7, Buttons: 27
- Overflow px: 0
- Small targets: 32
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/time-to-words.png

### zakat
- URL: http://127.0.0.1:5173/calculator/zakat/
- Title: Калькулятор закята онлайн - Расчет обязательного исламского налога в пользу нуждающихся
- Issues: Small tap targets: 14
- Inputs: 11, Buttons: 6
- Overflow px: 0
- Small targets: 14
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/zakat.png

### kurban-sacrifice
- URL: http://127.0.0.1:5173/calculator/kurban-sacrifice/
- Title: Калькулятор Курбан-айт - Планирование бюджета на жертвенное животное в праздник жертвоприношения
- Issues: Small tap targets: 16
- Inputs: 8, Buttons: 10
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/kurban-sacrifice.png

### ramadan-sadaqah
- URL: http://127.0.0.1:5173/calculator/ramadan-sadaqah/
- Title: Калькулятор Фитр-садака и Фидия-садака - Религиозные пожертвования в месяц Рамадан
- Issues: Small tap targets: 16
- Inputs: 7, Buttons: 9
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/ramadan-sadaqah.png

### islamic-inheritance
- URL: http://127.0.0.1:5173/calculator/islamic-inheritance/
- Title: Калькулятор исламского наследства (Фараиз) - Расчет долей наследников по шариату
- Issues: Small tap targets: 22
- Inputs: 11, Buttons: 10
- Overflow px: 0
- Small targets: 22
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/islamic-inheritance.png

### discount
- URL: http://127.0.0.1:5173/calculator/discount/
- Title: Калькулятор скидок онлайн - Расчет скидок, каскадных предложений и сравнение экономии
- Issues: Small tap targets: 16
- Inputs: 5, Buttons: 16
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=true, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/discount.png

### percentage
- URL: http://127.0.0.1:5173/calculator/percentage/
- Title: Процентный калькулятор онлайн - Все виды процентных расчетов | Проценты от числа
- Issues: Small tap targets: 16
- Inputs: 4, Buttons: 17
- Overflow px: 0
- Small targets: 16
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/percentage.png

### leap-year
- URL: http://127.0.0.1:5173/calculator/leap-year/
- Title: Калькулятор високосного года - Определение високосных лет и анализ временных диапазонов
- Issues: Small tap targets: 31
- Inputs: 4, Buttons: 24
- Overflow px: 0
- Small targets: 31
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/leap-year.png

### date-calculator
- URL: http://127.0.0.1:5173/calculator/date-calculator/
- Title: Калькулятор дат онлайн - Добавление и вычитание периодов времени с точным расчетом
- Issues: Small tap targets: 28; Network request failures: 2
- Inputs: 6, Buttons: 23
- Overflow px: 0
- Small targets: 28
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/date-calculator.png

### bmi
- URL: http://127.0.0.1:5173/calculator/bmi/
- Title: Калькулятор ИМТ онлайн - Индекс массы тела с рекомендациями ВОЗ | Норма веса
- Issues: Small tap targets: 19
- Inputs: 7, Buttons: 16
- Overflow px: 0
- Small targets: 19
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/bmi.png

### calories
- URL: http://127.0.0.1:5173/calculator/calories/
- Title: Калькулятор калорий онлайн - Суточная норма калорий и макронутриентов для похудения и набора массы
- Issues: Small tap targets: 22
- Inputs: 12, Buttons: 18
- Overflow px: 0
- Small targets: 22
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/calories.png

### pregnancy
- URL: http://127.0.0.1:5173/calculator/pregnancy/
- Title: Калькулятор беременности - Расчет срока беременности и предполагаемой даты родов
- Issues: Small tap targets: 12
- Inputs: 3, Buttons: 6
- Overflow px: 0
- Small targets: 12
- Console errors: 0, Page errors: 0
- Calc smoke: result=true, changedAfterInput=false, hasNaN=false, hasInfinity=false
- Screenshot: /tmp/kz-calk-mobile-audit-shots-after-fixes/pregnancy.png

## Method
- Mobile viewport: 390x844 (smartphone profile).
- Per calculator: load page, fill visible fields with valid demo values, trigger calculate action, verify result smoke criteria.
- Smoke correctness criteria: result changes after input change, no NaN/Infinity, no runtime errors.
- This is functional smoke validation, not a full legal/financial formula certification.
