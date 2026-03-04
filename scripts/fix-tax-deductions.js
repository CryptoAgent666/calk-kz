import fs from 'fs';
import path from 'path';

const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');

const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));

const taxDeductionsRu = {
  title: "Калькулятор налоговых вычетов",
  description: "Расчет возврата подоходного налога",
  subtitle: "Расчет налоговых вычетов по ИПН",
  mrp: "МРП",
  perYear: "в год",
  
  inputSection: {
    title: "Исходные данные",
    annualIncome: { label: "Годовой доход", placeholder: "Введите годовой доход", hint: "Укажите общий годовой доход до вычетов" },
    educationExpenses: { label: "Расходы на образование", placeholder: "Введите сумму", hint: "Оплата обучения (своего или детей)" },
    medicalExpenses: { label: "Медицинские расходы", placeholder: "Введите сумму", hint: "Лечение, лекарства, анализы" },
    mortgageInterest: { label: "Проценты по ипотеке", placeholder: "Введите сумму", hint: "Уплаченные проценты по ипотечному кредиту" },
    pensionContributions: { label: "Пенсионные взносы", placeholder: "Введите сумму", hint: "Добровольные пенсионные взносы" },
    charityDonations: { label: "Благотворительность", placeholder: "Введите сумму", hint: "Пожертвования в благотворительные организации" }
  },
  
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    totalDeductions: "Общая сумма вычетов",
    taxRefund: "Сумма к возврату",
    effectiveSavings: "Эффективная экономия",
    taxableIncome: "Налогооблагаемый доход",
    taxBeforeDeductions: "Налог до вычетов",
    taxAfterDeductions: "Налог после вычетов"
  },
  
  deductionTypes: {
    education: { name: "Образование", shortName: "Образование", description: "Вычет на обучение", examples: "Обучение в вузе, колледже, курсы" },
    medical: { name: "Медицина", shortName: "Медицина", description: "Вычет на лечение", examples: "Лечение, лекарства, анализы" },
    mortgage: { name: "Ипотека", shortName: "Ипотека", description: "Вычет по ипотеке", examples: "Проценты по ипотечному кредиту" },
    pension: { name: "Пенсия", shortName: "Пенсия", description: "Пенсионные вычеты", examples: "Добровольные пенсионные взносы" },
    charity: { name: "Благотворительность", shortName: "Благотв.", description: "Благотворительные вычеты", examples: "Пожертвования в НКО" }
  },
  
  reference: {
    title: "Справочная информация",
    upTo: "до",
    examples: "Примеры",
    generalRules: {
      title: "Общие правила",
      rule1: "Максимальный вычет — 400 МРП в год",
      rule2: "Вычет не может превышать сумму уплаченного налога",
      rule3: "Требуются подтверждающие документы",
      rule4: "Заявление подается в налоговую",
      rule5: "Срок рассмотрения — до 30 дней"
    }
  },
  
  examples: {
    title: "Примеры расчета",
    example1: {
      title: "Пример 1: Стандартный вычет",
      sourceData: "Исходные данные",
      annualIncome: "Годовой доход",
      education: "Образование",
      childEducation: "Обучение ребенка",
      medicine: "Медицина",
      treatment: "Лечение",
      totalDeductions: "Итого вычетов",
      limits: "Ограничения",
      tax: "Налог",
      beforeDeductions: "До вычетов",
      afterDeductions: "После вычетов",
      toRefund: "К возврату",
      savings: "Экономия",
      percentOfDeductions: "% от вычетов"
    },
    example2: {
      title: "Пример 2: Максимальный вычет",
      sourceData: "Исходные данные",
      annualIncome: "Годовой доход",
      deductions: "Вычеты",
      allTypesMax: "Все типы по максимуму",
      totalLimit: "Общий лимит",
      perType: "По типу",
      calculation: "Расчет",
      tax: "Налог",
      beforeDeductions: "До вычетов",
      afterDeductions: "После вычетов",
      toRefund: "К возврату",
      maxRefund: "Максимальный возврат",
      savings: "Экономия"
    },
    example3: {
      title: "Пример 3: Ограничение по доходу",
      sourceData: "Исходные данные",
      annualIncome: "Годовой доход",
      incomeLimit: "Лимит по доходу",
      restrictions: "Ограничения",
      limitedByIncome: "Ограничено доходом",
      medicineLimit: "Лимит медицины",
      tax: "Налог",
      beforeDeductions: "До вычетов",
      afterDeductions: "После вычетов",
      savings: "Экономия"
    }
  },
  
  faq: {
    q1: "Какие расходы можно вычесть?",
    a1: "Образование, лечение, ипотечные проценты, пенсионные взносы, благотворительность.",
    q2: "Какой максимальный вычет?",
    a2: "До 400 МРП (около 1.5 млн тенге) в год по всем категориям.",
    q3: "Как получить вычет?",
    a3: "Подать заявление в налоговую с подтверждающими документами.",
    q4: "Какие документы нужны?",
    a4: "Чеки, договоры, справки об оплате, декларация 3-НДФЛ.",
    q5: "Когда можно получить возврат?",
    a5: "В течение 30 дней после подачи заявления."
  }
};

const taxDeductionsKk = {
  title: "Салық шегерімдерінің калькуляторы",
  description: "Табыс салығын қайтаруды есептеу",
  subtitle: "ЖТС бойынша салық шегерімдерін есептеу",
  mrp: "АЕК",
  perYear: "жылына",
  
  inputSection: {
    title: "Бастапқы деректер",
    annualIncome: { label: "Жылдық табыс", placeholder: "Жылдық табысты енгізіңіз", hint: "Шегерімдерге дейінгі жалпы жылдық табысты көрсетіңіз" },
    educationExpenses: { label: "Білім шығындары", placeholder: "Соманы енгізіңіз", hint: "Оқыту төлемі (өзіңіз немесе балаларыңыз)" },
    medicalExpenses: { label: "Медициналық шығындар", placeholder: "Соманы енгізіңіз", hint: "Емдеу, дәрі-дәрмектер, талдаулар" },
    mortgageInterest: { label: "Ипотека пайыздары", placeholder: "Соманы енгізіңіз", hint: "Ипотекалық несие бойынша төленген пайыздар" },
    pensionContributions: { label: "Зейнетақы жарналары", placeholder: "Соманы енгізіңіз", hint: "Ерікті зейнетақы жарналары" },
    charityDonations: { label: "Қайырымдылық", placeholder: "Соманы енгізіңіз", hint: "Қайырымдылық ұйымдарына қайырмалдықтар" }
  },
  
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    totalDeductions: "Жалпы шегерім сомасы",
    taxRefund: "Қайтаруға сома",
    effectiveSavings: "Тиімді үнемдеу",
    taxableIncome: "Салық салынатын табыс",
    taxBeforeDeductions: "Шегерімдерге дейінгі салық",
    taxAfterDeductions: "Шегерімдерден кейінгі салық"
  },
  
  deductionTypes: {
    education: { name: "Білім", shortName: "Білім", description: "Оқыту шегерімі", examples: "Жоғары оқу орнында, колледжде оқыту, курстар" },
    medical: { name: "Медицина", shortName: "Медицина", description: "Емдеу шегерімі", examples: "Емдеу, дәрі-дәрмектер, талдаулар" },
    mortgage: { name: "Ипотека", shortName: "Ипотека", description: "Ипотека бойынша шегерім", examples: "Ипотекалық несие бойынша пайыздар" },
    pension: { name: "Зейнетақы", shortName: "Зейнетақы", description: "Зейнетақы шегерімдері", examples: "Ерікті зейнетақы жарналары" },
    charity: { name: "Қайырымдылық", shortName: "Қайырым.", description: "Қайырымдылық шегерімдері", examples: "КЕҰ-ға қайырмалдықтар" }
  },
  
  reference: {
    title: "Анықтамалық ақпарат",
    upTo: "дейін",
    examples: "Мысалдар",
    generalRules: {
      title: "Жалпы ережелер",
      rule1: "Максималды шегерім — жылына 400 АЕК",
      rule2: "Шегерім төленген салық сомасынан аспауы керек",
      rule3: "Растайтын құжаттар қажет",
      rule4: "Өтініш салық органына беріледі",
      rule5: "Қарау мерзімі — 30 күнге дейін"
    }
  },
  
  examples: {
    title: "Есептеу мысалдары",
    example1: {
      title: "1-мысал: Стандартты шегерім",
      sourceData: "Бастапқы деректер",
      annualIncome: "Жылдық табыс",
      education: "Білім",
      childEducation: "Баланы оқыту",
      medicine: "Медицина",
      treatment: "Емдеу",
      totalDeductions: "Барлық шегерімдер",
      limits: "Шектеулер",
      tax: "Салық",
      beforeDeductions: "Шегерімдерге дейін",
      afterDeductions: "Шегерімдерден кейін",
      toRefund: "Қайтаруға",
      savings: "Үнемдеу",
      percentOfDeductions: "Шегерімдердің %"
    },
    example2: {
      title: "2-мысал: Максималды шегерім",
      sourceData: "Бастапқы деректер",
      annualIncome: "Жылдық табыс",
      deductions: "Шегерімдер",
      allTypesMax: "Барлық түрлері максимумда",
      totalLimit: "Жалпы лимит",
      perType: "Түрі бойынша",
      calculation: "Есептеу",
      tax: "Салық",
      beforeDeductions: "Шегерімдерге дейін",
      afterDeductions: "Шегерімдерден кейін",
      toRefund: "Қайтаруға",
      maxRefund: "Максималды қайтару",
      savings: "Үнемдеу"
    },
    example3: {
      title: "3-мысал: Табыс бойынша шектеу",
      sourceData: "Бастапқы деректер",
      annualIncome: "Жылдық табыс",
      incomeLimit: "Табыс бойынша лимит",
      restrictions: "Шектеулер",
      limitedByIncome: "Табыспен шектелген",
      medicineLimit: "Медицина лимиті",
      tax: "Салық",
      beforeDeductions: "Шегерімдерге дейін",
      afterDeductions: "Шегерімдерден кейін",
      savings: "Үнемдеу"
    }
  },
  
  faq: {
    q1: "Қандай шығындарды шегеруге болады?",
    a1: "Білім, емдеу, ипотека пайыздары, зейнетақы жарналары, қайырымдылық.",
    q2: "Максималды шегерім қанша?",
    a2: "Барлық санаттар бойынша жылына 400 АЕК-ке дейін (шамамен 1.5 млн теңге).",
    q3: "Шегерімді қалай алуға болады?",
    a3: "Салық органына растайтын құжаттармен өтініш беру керек.",
    q4: "Қандай құжаттар қажет?",
    a4: "Чектер, шарттар, төлем туралы анықтамалар, 3-НДФЛ декларациясы.",
    q5: "Қайтаруды қашан алуға болады?",
    a5: "Өтініш берілгеннен кейін 30 күн ішінде."
  }
};

ruJson['tax-deductions'] = { ...ruJson['tax-deductions'], ...taxDeductionsRu };
kkJson['tax-deductions'] = { ...kkJson['tax-deductions'], ...taxDeductionsKk };

fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');

console.log('✅ tax-deductions translations added!');


