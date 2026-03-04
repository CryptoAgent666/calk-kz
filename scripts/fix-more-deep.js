import fs from 'fs';
import path from 'path';

const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');

const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));

// LUXURY-TAX
const luxuryTaxRu = {
  ...ruJson['luxury-tax'],
  inputSection: {
    title: "Данные об имуществе",
    propertyType: { label: "Тип имущества", placeholder: "Выберите тип" },
    value: { label: "Стоимость", placeholder: "Введите стоимость" },
    year: { label: "Год выпуска", placeholder: "Введите год" }
  },
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    taxAmount: "Сумма налога",
    rate: "Ставка",
    category: "Категория"
  },
  propertyTypes: {
    car: { name: "Автомобиль", threshold: "от 35 000 000 ₸" },
    property: { name: "Недвижимость", threshold: "от 300 000 000 ₸" },
    aircraft: { name: "Воздушное судно", threshold: "любое" },
    yacht: { name: "Яхта", threshold: "от 100 000 000 ₸" }
  },
  rates: {
    title: "Ставки налога",
    car: "0.5% - 1%",
    property: "0.1% - 0.2%",
    other: "1%"
  }
};

const luxuryTaxKk = {
  ...kkJson['luxury-tax'],
  inputSection: {
    title: "Мүлік туралы деректер",
    propertyType: { label: "Мүлік түрі", placeholder: "Түрін таңдаңыз" },
    value: { label: "Құны", placeholder: "Құнын енгізіңіз" },
    year: { label: "Шығарылған жылы", placeholder: "Жылды енгізіңіз" }
  },
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    taxAmount: "Салық сомасы",
    rate: "Ставка",
    category: "Санат"
  },
  propertyTypes: {
    car: { name: "Автомобиль", threshold: "35 000 000 ₸-ден" },
    property: { name: "Жылжымайтын мүлік", threshold: "300 000 000 ₸-ден" },
    aircraft: { name: "Әуе кемесі", threshold: "кез келген" },
    yacht: { name: "Яхта", threshold: "100 000 000 ₸-ден" }
  },
  rates: {
    title: "Салық ставкалары",
    car: "0.5% - 1%",
    property: "0.1% - 0.2%",
    other: "1%"
  }
};

// PENSION-ANNUITY
const pensionAnnuityRu = {
  ...ruJson['pension-annuity'],
  inputSection: {
    title: "Параметры аннуитета",
    accumulatedAmount: { label: "Накопленная сумма", placeholder: "Введите сумму" },
    age: { label: "Возраст", placeholder: "Введите возраст" },
    gender: { label: "Пол", placeholder: "Выберите пол" },
    paymentType: { label: "Тип выплат", placeholder: "Выберите тип" }
  },
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    monthlyPayment: "Ежемесячная выплата",
    totalPayments: "Всего выплат",
    duration: "Срок выплат"
  },
  paymentTypes: {
    lifetime: { name: "Пожизненный", description: "Выплаты до конца жизни" },
    fixed: { name: "Срочный", description: "Выплаты за определенный период" }
  },
  genders: {
    male: "Мужской",
    female: "Женский"
  },
  companies: {
    title: "Страховые компании",
    halyk: { name: "Халык-Life", minAmount: "от 3 000 000 ₸" },
    nomad: { name: "Nomad Life", minAmount: "от 2 000 000 ₸" }
  }
};

const pensionAnnuityKk = {
  ...kkJson['pension-annuity'],
  inputSection: {
    title: "Аннуитет параметрлері",
    accumulatedAmount: { label: "Жинақталған сома", placeholder: "Соманы енгізіңіз" },
    age: { label: "Жас", placeholder: "Жасты енгізіңіз" },
    gender: { label: "Жыныс", placeholder: "Жынысты таңдаңыз" },
    paymentType: { label: "Төлем түрі", placeholder: "Түрін таңдаңыз" }
  },
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    monthlyPayment: "Айлық төлем",
    totalPayments: "Барлық төлемдер",
    duration: "Төлем мерзімі"
  },
  paymentTypes: {
    lifetime: { name: "Өмірлік", description: "Өмірдің соңына дейін төлемдер" },
    fixed: { name: "Мерзімдік", description: "Белгілі бір кезеңге төлемдер" }
  },
  genders: {
    male: "Ер",
    female: "Әйел"
  },
  companies: {
    title: "Сақтандыру компаниялары",
    halyk: { name: "Халык-Life", minAmount: "3 000 000 ₸-ден" },
    nomad: { name: "Nomad Life", minAmount: "2 000 000 ₸-ден" }
  }
};

// INSURANCE-PREMIUM
const insuranceRu = {
  ...ruJson['insurance-premium'],
  inputSection: {
    title: "Параметры страхования",
    insuranceType: { label: "Тип страхования", placeholder: "Выберите тип" },
    coverageAmount: { label: "Сумма покрытия", placeholder: "Введите сумму" },
    term: { label: "Срок", placeholder: "Выберите срок" },
    age: { label: "Возраст", placeholder: "Введите возраст" }
  },
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    monthlyPremium: "Ежемесячная премия",
    annualPremium: "Годовая премия",
    coverage: "Покрытие"
  },
  insuranceTypes: {
    life: { name: "Жизнь", description: "Страхование жизни" },
    health: { name: "Здоровье", description: "Медицинское страхование" },
    property: { name: "Имущество", description: "Страхование имущества" },
    auto: { name: "ОГПО", description: "Обязательное страхование авто" }
  },
  factors: {
    title: "Факторы расчета",
    age: "Возраст",
    health: "Состояние здоровья",
    coverage: "Сумма покрытия",
    term: "Срок страхования"
  }
};

const insuranceKk = {
  ...kkJson['insurance-premium'],
  inputSection: {
    title: "Сақтандыру параметрлері",
    insuranceType: { label: "Сақтандыру түрі", placeholder: "Түрін таңдаңыз" },
    coverageAmount: { label: "Жабу сомасы", placeholder: "Соманы енгізіңіз" },
    term: { label: "Мерзім", placeholder: "Мерзімді таңдаңыз" },
    age: { label: "Жас", placeholder: "Жасты енгізіңіз" }
  },
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    monthlyPremium: "Айлық сыйлықақы",
    annualPremium: "Жылдық сыйлықақы",
    coverage: "Жабу"
  },
  insuranceTypes: {
    life: { name: "Өмір", description: "Өмірді сақтандыру" },
    health: { name: "Денсаулық", description: "Медициналық сақтандыру" },
    property: { name: "Мүлік", description: "Мүлікті сақтандыру" },
    auto: { name: "МАЖС", description: "Міндетті автосақтандыру" }
  },
  factors: {
    title: "Есептеу факторлары",
    age: "Жас",
    health: "Денсаулық жағдайы",
    coverage: "Жабу сомасы",
    term: "Сақтандыру мерзімі"
  }
};

// CALORIES
const caloriesRu = {
  ...ruJson['calories'],
  inputSection: {
    title: "Ваши данные",
    age: { label: "Возраст", placeholder: "Введите возраст" },
    weight: { label: "Вес", placeholder: "Введите вес в кг" },
    height: { label: "Рост", placeholder: "Введите рост в см" },
    gender: { label: "Пол", placeholder: "Выберите пол" },
    activity: { label: "Активность", placeholder: "Выберите уровень" }
  },
  results: {
    title: "Результаты",
    enterData: "Введите данные для расчета",
    bmr: "Базовый метаболизм",
    tdee: "Суточная норма",
    forLoss: "Для похудения",
    forGain: "Для набора массы"
  },
  activityLevels: {
    sedentary: { name: "Сидячий", description: "Минимум активности", multiplier: "1.2" },
    light: { name: "Легкая", description: "1-3 тренировки в неделю", multiplier: "1.375" },
    moderate: { name: "Умеренная", description: "3-5 тренировок в неделю", multiplier: "1.55" },
    active: { name: "Активная", description: "6-7 тренировок в неделю", multiplier: "1.725" },
    veryActive: { name: "Очень активная", description: "2 тренировки в день", multiplier: "1.9" }
  },
  formulas: {
    title: "Формулы расчета",
    mifflin: "Формула Миффлина-Сан Жеора",
    harris: "Формула Харриса-Бенедикта"
  }
};

const caloriesKk = {
  ...kkJson['calories'],
  inputSection: {
    title: "Сіздің деректеріңіз",
    age: { label: "Жас", placeholder: "Жасты енгізіңіз" },
    weight: { label: "Салмақ", placeholder: "Салмақты кг-мен енгізіңіз" },
    height: { label: "Бой", placeholder: "Бойды см-мен енгізіңіз" },
    gender: { label: "Жыныс", placeholder: "Жынысты таңдаңыз" },
    activity: { label: "Белсенділік", placeholder: "Деңгейді таңдаңыз" }
  },
  results: {
    title: "Нәтижелер",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    bmr: "Базалық метаболизм",
    tdee: "Тәуліктік норма",
    forLoss: "Арықтау үшін",
    forGain: "Салмақ қосу үшін"
  },
  activityLevels: {
    sedentary: { name: "Отырмалы", description: "Минималды белсенділік", multiplier: "1.2" },
    light: { name: "Жеңіл", description: "Аптасына 1-3 жаттығу", multiplier: "1.375" },
    moderate: { name: "Орташа", description: "Аптасына 3-5 жаттығу", multiplier: "1.55" },
    active: { name: "Белсенді", description: "Аптасына 6-7 жаттығу", multiplier: "1.725" },
    veryActive: { name: "Өте белсенді", description: "Күніне 2 жаттығу", multiplier: "1.9" }
  },
  formulas: {
    title: "Есептеу формулалары",
    mifflin: "Миффлин-Сан Жеор формуласы",
    harris: "Харрис-Бенедикт формуласы"
  }
};

// CREDIT
const creditRu = {
  ...ruJson['credit'],
  inputSection: {
    title: "Параметры кредита",
    amount: { label: "Сумма кредита", placeholder: "Введите сумму" },
    rate: { label: "Процентная ставка", placeholder: "Введите ставку" },
    term: { label: "Срок кредита", placeholder: "Введите срок" },
    paymentType: { label: "Тип платежа", placeholder: "Выберите тип" }
  },
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    monthlyPayment: "Ежемесячный платеж",
    totalPayment: "Общая сумма выплат",
    overpayment: "Переплата",
    effectiveRate: "Эффективная ставка"
  },
  paymentTypes: {
    annuity: { name: "Аннуитетный", description: "Равные платежи" },
    differentiated: { name: "Дифференцированный", description: "Убывающие платежи" }
  },
  schedule: {
    title: "График платежей",
    month: "Месяц",
    payment: "Платеж",
    principal: "Основной долг",
    interest: "Проценты",
    balance: "Остаток"
  }
};

const creditKk = {
  ...kkJson['credit'],
  inputSection: {
    title: "Несие параметрлері",
    amount: { label: "Несие сомасы", placeholder: "Соманы енгізіңіз" },
    rate: { label: "Пайыздық ставка", placeholder: "Ставканы енгізіңіз" },
    term: { label: "Несие мерзімі", placeholder: "Мерзімді енгізіңіз" },
    paymentType: { label: "Төлем түрі", placeholder: "Түрін таңдаңыз" }
  },
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    monthlyPayment: "Айлық төлем",
    totalPayment: "Жалпы төлем сомасы",
    overpayment: "Артық төлем",
    effectiveRate: "Тиімді ставка"
  },
  paymentTypes: {
    annuity: { name: "Аннуитетті", description: "Тең төлемдер" },
    differentiated: { name: "Дифференциалды", description: "Кемитін төлемдер" }
  },
  schedule: {
    title: "Төлем кестесі",
    month: "Ай",
    payment: "Төлем",
    principal: "Негізгі қарыз",
    interest: "Пайыздар",
    balance: "Қалдық"
  }
};

// Apply all
ruJson['luxury-tax'] = { ...ruJson['luxury-tax'], ...luxuryTaxRu };
kkJson['luxury-tax'] = { ...kkJson['luxury-tax'], ...luxuryTaxKk };
ruJson['pension-annuity'] = { ...ruJson['pension-annuity'], ...pensionAnnuityRu };
kkJson['pension-annuity'] = { ...kkJson['pension-annuity'], ...pensionAnnuityKk };
ruJson['insurance-premium'] = { ...ruJson['insurance-premium'], ...insuranceRu };
kkJson['insurance-premium'] = { ...kkJson['insurance-premium'], ...insuranceKk };
ruJson['calories'] = { ...ruJson['calories'], ...caloriesRu };
kkJson['calories'] = { ...kkJson['calories'], ...caloriesKk };
ruJson['credit'] = { ...ruJson['credit'], ...creditRu };
kkJson['credit'] = { ...kkJson['credit'], ...creditKk };

fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');

console.log('✅ More deep translations added (luxury-tax, pension-annuity, insurance, calories, credit)!');


