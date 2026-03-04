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
    appliedDeductions: "Применённые вычеты",
    noRefund: "Нет суммы к возврату — введите расходы",
    ofTotalDeductions: "от общих вычетов",
    excessWarning: {
      title: "Превышение лимита",
      overLimit: "Сумма превышает лимит вычета"
    },
    taxCalculation: {
      title: "Расчет налога",
      annualIncome: "Годовой доход",
      taxWithoutDeductions: "Налог без вычетов",
      taxWithDeductions: "Налог с вычетами",
      baseReduction: "Уменьшение базы",
      refundAmount: "Сумма к возврату"
    }
  },
  
  limits: {
    title: "Лимиты вычетов",
    perType: "По каждому типу",
    totalLimit: "Общий лимит",
    refund: "Возврат",
    refundAmount: "10% от суммы вычетов",
    mrp2025: "3 932 ₸"
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
      treatmentCosts: "Расходы на лечение",
      tax: "Налог",
      beforeDeductions: "До вычетов",
      afterDeductions: "После вычетов",
      toRefund: "К возврату",
      savings: "Экономия"
    }
  },
  
  procedure: {
    title: "Порядок получения вычета",
    documents: {
      title: "Необходимые документы",
      declaration: "Декларация по форме 240.00",
      incomeStatement: "Справка о доходах",
      expenseProof: "Подтверждение расходов",
      paymentCertificates: "Платежные документы",
      bankStatement: "Выписка из банка"
    },
    steps: {
      title: "Этапы оформления",
      step1: "Собрать все документы",
      step2: "Заполнить декларацию",
      step3: "Подать в налоговую",
      step4: "Дождаться проверки",
      step5: "Получить возврат"
    }
  },
  
  practicalAdvice: {
    title: "Практические советы",
    tip1: "Сохраняйте все чеки и квитанции",
    tip2: "Подавайте заявление до 31 марта",
    tip3: "Используйте eGov для подачи онлайн",
    tip4: "Консультируйтесь с налоговым специалистом"
  },
  
  legalBasis: {
    title: "Правовая основа",
    taxCode: {
      title: "Налоговый кодекс РК",
      article156: "Статья 156 — Вычеты для физических лиц",
      subparagraph1: "пп.1 — Расходы на образование",
      subparagraph2: "пп.2 — Расходы на лечение",
      subparagraph3: "пп.3 — Проценты по ипотеке",
      subparagraph4: "пп.4 — Пенсионные взносы",
      subparagraph5: "пп.5 — Благотворительность"
    },
    conditions: {
      title: "Условия применения",
      condition1: "Наличие подтверждающих документов",
      condition2: "Расходы произведены в отчетном периоде",
      condition3: "Оплата произведена безналичным путем",
      condition4: "Получатель — резидент РК",
      condition5: "Услуги оказаны лицензированными организациями"
    },
    restrictions: {
      title: "Ограничения",
      restriction1: "Не более 118 МРП на каждый тип",
      restriction2: "Общий лимит — 400 МРП",
      restriction3: "Не более суммы уплаченного ИПН",
      restriction4: "Только документально подтвержденные расходы"
    }
  },
  
  planningStrategies: {
    title: "Стратегии налогового планирования",
    strategy1: { title: "Планируйте расходы", description: "Распределяйте крупные расходы по годам" },
    strategy2: { title: "Семейное планирование", description: "Оформляйте вычеты на члена семьи с большим доходом" },
    strategy3: { title: "Документируйте всё", description: "Храните документы минимум 5 лет" }
  },
  
  importantInfo: {
    title: "Важная информация",
    description1: "Максимальный возврат не может превышать сумму уплаченного ИПН",
    description2: "Вычеты применяются только к доходам, облагаемым по ставке 10%"
  },
  
  faq: {
    q1: "Какие расходы можно вычесть?",
    a1: "Образование, лечение, ипотечные проценты, пенсионные взносы, благотворительность.",
    q2: "Какой максимальный вычет?",
    a2: "До 400 МРП (около 1.5 млн тенге) в год по всем категориям.",
    q3: "Как получить вычет?",
    a3: "Подать заявление в налоговую с подтверждающими документами.",
    q4: "Какие документы нужны?",
    a4: "Чеки, договоры, справки об оплате, декларация.",
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
    appliedDeductions: "Қолданылған шегерімдер",
    noRefund: "Қайтаруға сома жоқ — шығындарды енгізіңіз",
    ofTotalDeductions: "жалпы шегерімдерден",
    excessWarning: {
      title: "Лимиттен асу",
      overLimit: "Сома шегерім лимитінен асып кетті"
    },
    taxCalculation: {
      title: "Салықты есептеу",
      annualIncome: "Жылдық табыс",
      taxWithoutDeductions: "Шегерімсіз салық",
      taxWithDeductions: "Шегеріммен салық",
      baseReduction: "Базаны азайту",
      refundAmount: "Қайтаруға сома"
    }
  },
  
  limits: {
    title: "Шегерім лимиттері",
    perType: "Әр түрі бойынша",
    totalLimit: "Жалпы лимит",
    refund: "Қайтару",
    refundAmount: "Шегерім сомасының 10%",
    mrp2025: "3 932 ₸"
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
      treatmentCosts: "Емдеу шығындары",
      tax: "Салық",
      beforeDeductions: "Шегерімдерге дейін",
      afterDeductions: "Шегерімдерден кейін",
      toRefund: "Қайтаруға",
      savings: "Үнемдеу"
    }
  },
  
  procedure: {
    title: "Шегерімді алу тәртібі",
    documents: {
      title: "Қажетті құжаттар",
      declaration: "240.00 нысаны бойынша декларация",
      incomeStatement: "Табыс туралы анықтама",
      expenseProof: "Шығындарды растау",
      paymentCertificates: "Төлем құжаттары",
      bankStatement: "Банк үзіндісі"
    },
    steps: {
      title: "Рәсімдеу кезеңдері",
      step1: "Барлық құжаттарды жинау",
      step2: "Декларацияны толтыру",
      step3: "Салық органына тапсыру",
      step4: "Тексеруді күту",
      step5: "Қайтаруды алу"
    }
  },
  
  practicalAdvice: {
    title: "Практикалық кеңестер",
    tip1: "Барлық чектер мен квитанцияларды сақтаңыз",
    tip2: "Өтінішті 31 наурызға дейін беріңіз",
    tip3: "Онлайн беру үшін eGov қолданыңыз",
    tip4: "Салық маманымен кеңесіңіз"
  },
  
  legalBasis: {
    title: "Құқықтық негіз",
    taxCode: {
      title: "ҚР Салық кодексі",
      article156: "156-бап — Жеке тұлғаларға арналған шегерімдер",
      subparagraph1: "1-тт. — Білім шығындары",
      subparagraph2: "2-тт. — Емдеу шығындары",
      subparagraph3: "3-тт. — Ипотека пайыздары",
      subparagraph4: "4-тт. — Зейнетақы жарналары",
      subparagraph5: "5-тт. — Қайырымдылық"
    },
    conditions: {
      title: "Қолдану шарттары",
      condition1: "Растайтын құжаттардың болуы",
      condition2: "Шығындар есепті кезеңде жасалған",
      condition3: "Төлем қолма-қол емес жолмен жүргізілген",
      condition4: "Алушы — ҚР резиденті",
      condition5: "Қызметтер лицензияланған ұйымдармен көрсетілген"
    },
    restrictions: {
      title: "Шектеулер",
      restriction1: "Әр түрге 118 АЕК-тен аспайды",
      restriction2: "Жалпы лимит — 400 АЕК",
      restriction3: "Төленген ЖТС сомасынан аспайды",
      restriction4: "Тек құжатпен расталған шығындар"
    }
  },
  
  planningStrategies: {
    title: "Салықтық жоспарлау стратегиялары",
    strategy1: { title: "Шығындарды жоспарлаңыз", description: "Үлкен шығындарды жылдар бойынша бөліңіз" },
    strategy2: { title: "Отбасылық жоспарлау", description: "Шегерімдерді табысы жоғары отбасы мүшесіне рәсімдеңіз" },
    strategy3: { title: "Барлығын құжаттаңыз", description: "Құжаттарды кемінде 5 жыл сақтаңыз" }
  },
  
  importantInfo: {
    title: "Маңызды ақпарат",
    description1: "Максималды қайтару төленген ЖТС сомасынан аспайды",
    description2: "Шегерімдер тек 10% ставкасымен салық салынатын табыстарға қолданылады"
  },
  
  faq: {
    q1: "Қандай шығындарды шегеруге болады?",
    a1: "Білім, емдеу, ипотека пайыздары, зейнетақы жарналары, қайырымдылық.",
    q2: "Максималды шегерім қанша?",
    a2: "Барлық санаттар бойынша жылына 400 АЕК-ке дейін (шамамен 1.5 млн теңге).",
    q3: "Шегерімді қалай алуға болады?",
    a3: "Салық органына растайтын құжаттармен өтініш беру керек.",
    q4: "Қандай құжаттар қажет?",
    a4: "Чектер, шарттар, төлем туралы анықтамалар, декларация.",
    q5: "Қайтаруды қашан алуға болады?",
    a5: "Өтініш берілгеннен кейін 30 күн ішінде."
  }
};

ruJson['tax-deductions'] = taxDeductionsRu;
kkJson['tax-deductions'] = taxDeductionsKk;

fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');

console.log('✅ Complete tax-deductions translations added (all 173 keys)!');


