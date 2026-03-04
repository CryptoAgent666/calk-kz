import fs from 'fs';
import path from 'path';

const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');

const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));

// FARM-LAND-TAX
const farmLandTaxRu = {
  title: "Калькулятор земельного налога",
  description: "Расчет налога на сельскохозяйственные земли",
  subtitle: "Расчет земельного налога для фермеров",
  
  inputSection: {
    title: "Параметры участка",
    area: { label: "Площадь участка", placeholder: "Введите площадь в гектарах", hint: "Укажите общую площадь земельного участка" },
    landType: { label: "Тип земель", placeholder: "Выберите тип" },
    bonityScore: { label: "Балл бонитета", placeholder: "Введите балл", hint: "Показатель качества почвы" },
    farmType: { label: "Тип хозяйства", placeholder: "Выберите тип" },
    region: { label: "Регион", placeholder: "Выберите регион" }
  },
  
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    baseTax: "Базовый налог",
    coefficient: "Коэффициент",
    finalTax: "Итоговый налог",
    perHectare: "за гектар",
    total: "Всего"
  },
  
  landTypes: {
    arable: "Пашня",
    pasture: "Пастбище",
    hayfield: "Сенокос",
    perennial: "Многолетние насаждения"
  },
  
  farmTypes: {
    peasant: "Крестьянское хозяйство",
    llp: "ТОО",
    individual: "ИП"
  },
  
  bonityScale: {
    title: "Шкала бонитета",
    excellent: { title: "Отличный", description: "Высокоплодородные почвы", coefficient: "1.0" },
    good: { title: "Хороший", description: "Плодородные почвы", coefficient: "0.8" },
    average: { title: "Средний", description: "Среднеплодородные почвы", coefficient: "0.6" },
    belowAverage: { title: "Ниже среднего", description: "Малоплодородные почвы", coefficient: "0.4" },
    low: { title: "Низкий", description: "Низкоплодородные почвы", coefficient: "0.2" },
    noteTitle: "Примечание",
    noteDescription: "Балл бонитета указан в документах на землю"
  },
  
  benefits: {
    title: "Преимущества",
    fairness: { title: "Справедливость", description: "Налог зависит от качества земли" },
    farmerBenefits: { title: "Льготы фермерам", description: "Сниженные ставки для КХ" },
    simplifiedReporting: { title: "Упрощенная отчетность", description: "Простой расчет" }
  },
  
  examples: {
    title: "Примеры расчета",
    calculationLabel: "Расчет",
    coefficientsLabel: "Коэффициенты",
    example1: {
      title: "Пример 1: Крестьянское хозяйство",
      area: "Площадь",
      landType: "Тип земли",
      landTypeCoeff: "Коэфф. типа",
      bonity: "Бонитет",
      qualityCoeff: "Коэфф. качества",
      farmType: "Тип хозяйства",
      farmTypeCoeff: "Коэфф. хозяйства",
      baseRate: "Базовая ставка",
      withCoeff: "С коэффициентами",
      benefits: "Льготы",
      total: "Итого",
      savings: "Экономия"
    },
    example2: {
      title: "Пример 2: ТОО агрофирма",
      area: "Площадь",
      landType: "Тип земли",
      bonity: "Бонитет",
      farmType: "Тип хозяйства",
      baseRate: "Базовая ставка",
      total: "Итого"
    }
  },
  
  regions: {
    almaty: "Алматинская область",
    astana: "Акмолинская область",
    aktobe: "Актюбинская область",
    atyrau: "Атырауская область",
    eastKazakhstan: "ВКО",
    zhambyl: "Жамбылская область",
    westKazakhstan: "ЗКО",
    karaganda: "Карагандинская область",
    kostanay: "Костанайская область",
    kyzylorda: "Кызылординская область",
    mangystau: "Мангистауская область",
    pavlodar: "Павлодарская область",
    northKazakhstan: "СКО",
    turkestan: "Туркестанская область"
  },
  
  faq: {
    q1: "Как рассчитывается земельный налог?",
    a1: "Площадь × базовая ставка × коэффициент бонитета × коэффициент типа хозяйства.",
    q2: "Какие льготы есть?",
    a2: "КХ платят 0.1% от кадастровой стоимости, ТОО — 0.5%.",
    q3: "Когда платить?",
    a3: "До 1 ноября текущего года.",
    q4: "Что такое бонитет?",
    a4: "Оценка качества почвы по 100-балльной шкале.",
    q5: "Где узнать кадастровую стоимость?",
    a5: "В кадастровой палате или на eGov.kz."
  }
};

const farmLandTaxKk = {
  title: "Жер салығы калькуляторы",
  description: "Ауыл шаруашылық жерлеріне салықты есептеу",
  subtitle: "Фермерлер үшін жер салығын есептеу",
  
  inputSection: {
    title: "Учаске параметрлері",
    area: { label: "Учаске ауданы", placeholder: "Гектармен ауданды енгізіңіз", hint: "Жер учаскесінің жалпы ауданын көрсетіңіз" },
    landType: { label: "Жер түрі", placeholder: "Түрін таңдаңыз" },
    bonityScore: { label: "Бонитет балы", placeholder: "Балды енгізіңіз", hint: "Топырақ сапасының көрсеткіші" },
    farmType: { label: "Шаруашылық түрі", placeholder: "Түрін таңдаңыз" },
    region: { label: "Аймақ", placeholder: "Аймақты таңдаңыз" }
  },
  
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    baseTax: "Базалық салық",
    coefficient: "Коэффициент",
    finalTax: "Соңғы салық",
    perHectare: "гектар үшін",
    total: "Барлығы"
  },
  
  landTypes: {
    arable: "Егістік",
    pasture: "Жайылым",
    hayfield: "Шабындық",
    perennial: "Көпжылдық екпелер"
  },
  
  farmTypes: {
    peasant: "Шаруа қожалығы",
    llp: "ЖШС",
    individual: "ЖК"
  },
  
  bonityScale: {
    title: "Бонитет шкаласы",
    excellent: { title: "Өте жақсы", description: "Жоғары құнарлы топырақ", coefficient: "1.0" },
    good: { title: "Жақсы", description: "Құнарлы топырақ", coefficient: "0.8" },
    average: { title: "Орташа", description: "Орташа құнарлы топырақ", coefficient: "0.6" },
    belowAverage: { title: "Орташадан төмен", description: "Аз құнарлы топырақ", coefficient: "0.4" },
    low: { title: "Төмен", description: "Төмен құнарлы топырақ", coefficient: "0.2" },
    noteTitle: "Ескерту",
    noteDescription: "Бонитет балы жер құжаттарында көрсетілген"
  },
  
  benefits: {
    title: "Артықшылықтар",
    fairness: { title: "Әділдік", description: "Салық жер сапасына байланысты" },
    farmerBenefits: { title: "Фермерлерге жеңілдіктер", description: "ШҚ үшін төмендетілген ставкалар" },
    simplifiedReporting: { title: "Жеңілдетілген есептілік", description: "Қарапайым есептеу" }
  },
  
  examples: {
    title: "Есептеу мысалдары",
    calculationLabel: "Есептеу",
    coefficientsLabel: "Коэффициенттер",
    example1: {
      title: "1-мысал: Шаруа қожалығы",
      area: "Аудан",
      landType: "Жер түрі",
      landTypeCoeff: "Түр коэфф.",
      bonity: "Бонитет",
      qualityCoeff: "Сапа коэфф.",
      farmType: "Шаруашылық түрі",
      farmTypeCoeff: "Шаруашылық коэфф.",
      baseRate: "Базалық ставка",
      withCoeff: "Коэффициенттермен",
      benefits: "Жеңілдіктер",
      total: "Барлығы",
      savings: "Үнемдеу"
    },
    example2: {
      title: "2-мысал: ЖШС агрофирма",
      area: "Аудан",
      landType: "Жер түрі",
      bonity: "Бонитет",
      farmType: "Шаруашылық түрі",
      baseRate: "Базалық ставка",
      total: "Барлығы"
    }
  },
  
  regions: {
    almaty: "Алматы облысы",
    astana: "Ақмола облысы",
    aktobe: "Ақтөбе облысы",
    atyrau: "Атырау облысы",
    eastKazakhstan: "ШҚО",
    zhambyl: "Жамбыл облысы",
    westKazakhstan: "БҚО",
    karaganda: "Қарағанды облысы",
    kostanay: "Қостанай облысы",
    kyzylorda: "Қызылорда облысы",
    mangystau: "Маңғыстау облысы",
    pavlodar: "Павлодар облысы",
    northKazakhstan: "СҚО",
    turkestan: "Түркістан облысы"
  },
  
  faq: {
    q1: "Жер салығы қалай есептеледі?",
    a1: "Аудан × базалық ставка × бонитет коэффициенті × шаруашылық түрі коэффициенті.",
    q2: "Қандай жеңілдіктер бар?",
    a2: "ШҚ кадастрлық құнның 0.1%-ын төлейді, ЖШС — 0.5%.",
    q3: "Қашан төлеу керек?",
    a3: "Ағымдағы жылдың 1 қарашасына дейін.",
    q4: "Бонитет дегеніміз не?",
    a4: "100 балдық шкала бойынша топырақ сапасын бағалау.",
    q5: "Кадастрлық құнды қайдан білуге болады?",
    a5: "Кадастрлық палатада немесе eGov.kz сайтында."
  }
};

// MICROLOAN
const microloanRu = {
  ...ruJson['microloan'],
  inputSection: {
    title: "Параметры займа",
    amount: { label: "Сумма займа", placeholder: "Введите сумму", hint: "От 5 000 до 200 000 тенге" },
    term: { label: "Срок", placeholder: "Выберите срок", hint: "От 5 до 30 дней" },
    rate: { label: "Ставка", placeholder: "Введите ставку", hint: "Дневная процентная ставка" }
  },
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    totalPayment: "Общая сумма к возврату",
    overpayment: "Переплата",
    dailyRate: "Дневная ставка",
    gesv: "ГЭСВ"
  },
  loanTypes: {
    standard: { name: "Стандартный", description: "Обычный микрозайм", rate: "0.99%" },
    express: { name: "Экспресс", description: "Быстрое одобрение", rate: "1.5%" },
    first: { name: "Первый", description: "Для новых клиентов", rate: "0%" }
  },
  warnings: {
    highRate: "Высокая ставка — проверьте условия",
    shortTerm: "Короткий срок — будьте готовы погасить вовремя",
    checkGesv: "Обратите внимание на ГЭСВ"
  },
  popularMFO: {
    title: "Популярные МФО",
    list: ["4Finance", "Solva", "Kredit7"]
  }
};

const microloanKk = {
  ...kkJson['microloan'],
  inputSection: {
    title: "Несие параметрлері",
    amount: { label: "Несие сомасы", placeholder: "Соманы енгізіңіз", hint: "5 000-нан 200 000 теңгеге дейін" },
    term: { label: "Мерзім", placeholder: "Мерзімді таңдаңыз", hint: "5-тен 30 күнге дейін" },
    rate: { label: "Ставка", placeholder: "Ставканы енгізіңіз", hint: "Күндік пайыздық ставка" }
  },
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    totalPayment: "Қайтаруға жалпы сома",
    overpayment: "Артық төлем",
    dailyRate: "Күндік ставка",
    gesv: "ЖТСС"
  },
  loanTypes: {
    standard: { name: "Стандартты", description: "Кәдімгі микронесие", rate: "0.99%" },
    express: { name: "Экспресс", description: "Жылдам мақұлдау", rate: "1.5%" },
    first: { name: "Бірінші", description: "Жаңа клиенттер үшін", rate: "0%" }
  },
  warnings: {
    highRate: "Жоғары ставка — шарттарды тексеріңіз",
    shortTerm: "Қысқа мерзім — уақытылы өтеуге дайын болыңыз",
    checkGesv: "ЖТСС-қа назар аударыңыз"
  },
  popularMFO: {
    title: "Танымал МҚҰ",
    list: ["4Finance", "Solva", "Kredit7"]
  }
};

// REFINANCING
const refinancingRu = {
  ...ruJson['refinancing'],
  inputSection: {
    title: "Текущий кредит",
    currentBalance: { label: "Остаток долга", placeholder: "Введите остаток" },
    currentRate: { label: "Текущая ставка", placeholder: "Введите ставку" },
    currentTerm: { label: "Оставшийся срок", placeholder: "Введите срок" },
    newRate: { label: "Новая ставка", placeholder: "Введите ставку" },
    newTerm: { label: "Новый срок", placeholder: "Введите срок" }
  },
  results: {
    title: "Результаты расчета",
    enterData: "Введите данные для расчета",
    currentPayment: "Текущий платеж",
    newPayment: "Новый платеж",
    monthlySavings: "Экономия в месяц",
    totalSavings: "Общая экономия",
    breakeven: "Точка безубыточности"
  },
  comparison: {
    title: "Сравнение",
    current: "Текущий",
    new: "Новый",
    difference: "Разница"
  },
  banks: {
    title: "Банки для рефинансирования",
    halyk: { name: "Halyk Bank", rate: "от 16%" },
    kaspi: { name: "Kaspi Bank", rate: "от 18%" },
    forte: { name: "Forte Bank", rate: "от 17%" }
  }
};

const refinancingKk = {
  ...kkJson['refinancing'],
  inputSection: {
    title: "Ағымдағы несие",
    currentBalance: { label: "Қарыз қалдығы", placeholder: "Қалдықты енгізіңіз" },
    currentRate: { label: "Ағымдағы ставка", placeholder: "Ставканы енгізіңіз" },
    currentTerm: { label: "Қалған мерзім", placeholder: "Мерзімді енгізіңіз" },
    newRate: { label: "Жаңа ставка", placeholder: "Ставканы енгізіңіз" },
    newTerm: { label: "Жаңа мерзім", placeholder: "Мерзімді енгізіңіз" }
  },
  results: {
    title: "Есептеу нәтижелері",
    enterData: "Есептеу үшін деректерді енгізіңіз",
    currentPayment: "Ағымдағы төлем",
    newPayment: "Жаңа төлем",
    monthlySavings: "Айлық үнемдеу",
    totalSavings: "Жалпы үнемдеу",
    breakeven: "Өзін-өзі ақтау нүктесі"
  },
  comparison: {
    title: "Салыстыру",
    current: "Ағымдағы",
    new: "Жаңа",
    difference: "Айырмашылық"
  },
  banks: {
    title: "Қайта қаржыландыру банктері",
    halyk: { name: "Halyk Bank", rate: "16%-дан" },
    kaspi: { name: "Kaspi Bank", rate: "18%-дан" },
    forte: { name: "Forte Bank", rate: "17%-дан" }
  }
};

// Apply all
ruJson['farm-land-tax'] = { ...ruJson['farm-land-tax'], ...farmLandTaxRu };
kkJson['farm-land-tax'] = { ...kkJson['farm-land-tax'], ...farmLandTaxKk };
ruJson['microloan'] = { ...ruJson['microloan'], ...microloanRu };
kkJson['microloan'] = { ...kkJson['microloan'], ...microloanKk };
ruJson['refinancing'] = { ...ruJson['refinancing'], ...refinancingRu };
kkJson['refinancing'] = { ...kkJson['refinancing'], ...refinancingKk };

fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');

console.log('✅ Deep nested translations added for farm-land-tax, microloan, refinancing!');


