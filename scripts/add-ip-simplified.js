import fs from 'fs';
import path from 'path';

const translations = {
  "subtitle": "Расчет налогов для ИП на упрощенке",
  "declaredIncome": "Заявленный доход",
  "declaredIncomeImpact": "Влияние на социальные отчисления",
  "declaredIncomeInfo": "От заявленного дохода зависят социальные отчисления",
  "declaredIncomeLabel": "Заявленный доход (1-5 МЗП)",
  "effectiveMonthlyBurden": "Эффективная месячная нагрузка",
  "faq": {
    "q1": "Что такое упрощенная декларация для ИП?",
    "a1": "Упрощенная декларация — специальный налоговый режим для ИП с доходом до 24 038 МРП в полугодие (примерно 92,5 млн тенге в 2025). Ставка налога — 3% от дохода.",
    "q2": "Какие налоги платит ИП на упрощенке?",
    "a2": "ИП платит 3% от дохода, который делится: 1.5% ИПН и 1.5% социальный налог. Также обязательны: ОПВ (10%), СО (3.5%), ВОСМС (5%) от заявленного дохода.",
    "q3": "Что такое заявленный доход и как его выбрать?",
    "a3": "Заявленный доход — база для расчета социальных отчислений. Минимум 1 МЗП, максимум 5 МЗП. Чем выше заявленный доход, тем больше отчисления, но и больше пенсионные накопления.",
    "q4": "Как часто нужно сдавать отчетность?",
    "a4": "Декларация по упрощенке (форма 910.00) сдается раз в полугодие: за 1 полугодие — до 15 августа, за 2 полугодие — до 15 февраля следующего года.",
    "q5": "Может ли ИП на упрощенке иметь сотрудников?",
    "a5": "Да, ИП на упрощенке может нанимать до 30 сотрудников. За сотрудников платятся те же отчисления: ОПВ, ИПН, СН, СО, ОПВР, ВОСМС."
  },
  "fiveMZP": "5 МЗП",
  "hasEmployees": "Есть сотрудники",
  "higherIncomeNow": "Больше дохода сейчас",
  "higherIncomeNowDescription": "Меньше отчислений, но меньше пенсия",
  "importantInfo": "Важная информация",
  "incomeAndEmployees": "Доход и сотрудники",
  "incomeTaxes": "Налоги с дохода",
  "incomeTaxesInfo": "3% от дохода: 1.5% ИПН + 1.5% соц. налог",
  "incomeTaxesLabel": "Налоги с дохода (3%)",
  "ipnTax": "ИПН (1.5%)",
  "lowerIncomeNow": "Больше на пенсию",
  "lowerIncomeNowDescription": "Больше отчислений, выше пенсия в будущем",
  "max": "макс.",
  "min": "мин.",
  "numberOfEmployees": "Количество сотрудников",
  "numberOfEmployeesPlaceholder": "Введите количество",
  "oneMZP": "1 МЗП",
  "opv": "ОПВ (10%)",
  "opvr": "ОПВР (1.5%)",
  "paidSocialContributions": "Социальные отчисления за себя",
  "paidSocialContributionsPlaceholder": "Авто-расчет",
  "semiannualIncome": "Доход за полугодие",
  "semiannualIncomePlaceholder": "Введите сумму в тенге",
  "semiannualPayment": "Платеж за полугодие",
  "so": "СО (3.5%)",
  "socialContributionsInfo": "От заявленного дохода: ОПВ, СО, ВОСМС",
  "socialContributionsLabel": "Социальные отчисления",
  "socialContributionsPlanning": "Планирование соц. отчислений",
  "socialContributionsSelf": "Соц. отчисления за себя",
  "socialTax": "Соц. налог (1.5%)",
  "taxRateInfo": "Единая ставка 3% от дохода",
  "taxRateLabel": "Ставка налога",
  "threeMZP": "3 МЗП",
  "totalEmployeeSalaries": "Общий ФОТ сотрудников",
  "totalEmployeeSalariesPlaceholder": "Введите сумму в тенге",
  "totalMonthly": "Итого в месяц",
  "totalTax": "Общий налог",
  "totalYearlyBurden": "Общая годовая нагрузка",
  "vosms": "ВОСМС (5%)",
  "yearlyContributions": "Годовые отчисления",
  "yearlyPensionContributions": "Годовые пенсионные отчисления",
  "yearlyTotals": "Годовые итоги"
};

const kkTranslations = {
  "subtitle": "Жеңілдетілген ЖК үшін салықтарды есептеу",
  "declaredIncome": "Мәлімделген табыс",
  "declaredIncomeImpact": "Әлеуметтік аударымдарға әсері",
  "declaredIncomeInfo": "Мәлімделген табыстан әлеуметтік аударымдар тәуелді",
  "declaredIncomeLabel": "Мәлімделген табыс (1-5 ЕТЖ)",
  "effectiveMonthlyBurden": "Тиімді айлық жүктеме",
  "faq": {
    "q1": "ЖК үшін жеңілдетілген декларация дегеніміз не?",
    "a1": "Жеңілдетілген декларация — жарты жылда 24 038 АЕК-ке дейін табысы бар ЖК үшін арнайы салық режимі (2025 жылы шамамен 92,5 млн теңге). Салық ставкасы — табыстың 3%.",
    "q2": "Жеңілдетілгендегі ЖК қандай салықтар төлейді?",
    "a2": "ЖК табыстың 3%-ын төлейді: 1.5% ЖТС және 1.5% әлеуметтік салық. Сондай-ақ міндетті: МЗЖА (10%), ӘА (3.5%), ТЖМС (5%) мәлімделген табыстан.",
    "q3": "Мәлімделген табыс дегеніміз не және оны қалай таңдау керек?",
    "a3": "Мәлімделген табыс — әлеуметтік аударымдарды есептеу базасы. Минимум 1 ЕТЖ, максимум 5 ЕТЖ. Мәлімделген табыс қаншалықты жоғары болса, аударымдар да соншалықты көп, бірақ зейнетақы жинақтары да көбірек.",
    "q4": "Есептілікті қаншалықты жиі тапсыру керек?",
    "a4": "Жеңілдетілген декларация (910.00 нысаны) жарты жылда бір рет тапсырылады: 1 жарты жыл үшін — 15 тамызға дейін, 2 жарты жыл үшін — келесі жылдың 15 ақпанына дейін.",
    "q5": "Жеңілдетілгендегі ЖК қызметкерлері бола ала ма?",
    "a5": "Иә, жеңілдетілгендегі ЖК 30-ға дейін қызметкер жалдай алады. Қызметкерлер үшін сол аударымдар төленеді: МЗЖА, ЖТС, ӘС, ӘА, МЗЖАА, ТЖМС."
  },
  "fiveMZP": "5 ЕТЖ",
  "hasEmployees": "Қызметкерлер бар",
  "higherIncomeNow": "Қазір көбірек табыс",
  "higherIncomeNowDescription": "Аударымдар азырақ, бірақ зейнетақы азырақ",
  "importantInfo": "Маңызды ақпарат",
  "incomeAndEmployees": "Табыс және қызметкерлер",
  "incomeTaxes": "Табыстан салықтар",
  "incomeTaxesInfo": "Табыстың 3%: 1.5% ЖТС + 1.5% әлеу. салық",
  "incomeTaxesLabel": "Табыстан салықтар (3%)",
  "ipnTax": "ЖТС (1.5%)",
  "lowerIncomeNow": "Зейнетақыға көбірек",
  "lowerIncomeNowDescription": "Аударымдар көбірек, болашақта зейнетақы жоғары",
  "max": "макс.",
  "min": "мин.",
  "numberOfEmployees": "Қызметкерлер саны",
  "numberOfEmployeesPlaceholder": "Санын енгізіңіз",
  "oneMZP": "1 ЕТЖ",
  "opv": "МЗЖА (10%)",
  "opvr": "МЗЖАА (1.5%)",
  "paidSocialContributions": "Өзі үшін әлеуметтік аударымдар",
  "paidSocialContributionsPlaceholder": "Авто-есептеу",
  "semiannualIncome": "Жарты жылдық табыс",
  "semiannualIncomePlaceholder": "Теңгемен соманы енгізіңіз",
  "semiannualPayment": "Жарты жылдық төлем",
  "so": "ӘА (3.5%)",
  "socialContributionsInfo": "Мәлімделген табыстан: МЗЖА, ӘА, ТЖМС",
  "socialContributionsLabel": "Әлеуметтік аударымдар",
  "socialContributionsPlanning": "Әлеу. аударымдарды жоспарлау",
  "socialContributionsSelf": "Өзі үшін әлеу. аударымдар",
  "socialTax": "Әлеу. салық (1.5%)",
  "taxRateInfo": "Табыстың 3% бірыңғай ставкасы",
  "taxRateLabel": "Салық ставкасы",
  "threeMZP": "3 ЕТЖ",
  "totalEmployeeSalaries": "Қызметкерлердің жалпы ЖҚ",
  "totalEmployeeSalariesPlaceholder": "Теңгемен соманы енгізіңіз",
  "totalMonthly": "Айына барлығы",
  "totalTax": "Жалпы салық",
  "totalYearlyBurden": "Жалпы жылдық жүктеме",
  "vosms": "ТЖМС (5%)",
  "yearlyContributions": "Жылдық аударымдар",
  "yearlyPensionContributions": "Жылдық зейнетақы аударымдары",
  "yearlyTotals": "Жылдық қорытындылар"
};

// Update Russian
const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
if (ruJson['ip-simplified']) {
  Object.assign(ruJson['ip-simplified'], translations);
}
fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
console.log('✅ Updated ru/calculators.json');

// Update Kazakh
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));
if (kkJson['ip-simplified']) {
  Object.assign(kkJson['ip-simplified'], kkTranslations);
} else {
  kkJson['ip-simplified'] = {
    "title": "ЖК жеңілдетілген калькуляторы",
    "description": "Жеңілдетілген ЖК үшін салықтарды есептеу",
    ...kkTranslations
  };
}
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');
console.log('✅ Updated kk/calculators.json');

console.log('🎉 IP-simplified translations added!');


