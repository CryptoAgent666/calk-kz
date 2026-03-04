import fs from 'fs';
import path from 'path';

const translations = {
  "subtitle": "Расчет сбора за регистрацию транспортного средства",
  "additionalFees": "Дополнительные сборы",
  "basicRates2025": "Базовые ставки на 2025 год",
  "bus": "Автобус",
  "calculationResults": "Результаты расчета",
  "category": "Категория",
  "electricCar": "Электромобиль",
  "enterManufactureYear": "Введите год выпуска",
  "faq": {
    "q1": "Что такое первичная регистрация транспортного средства?",
    "a1": "Первичная регистрация — постановка на учет нового или ввезенного транспортного средства. Включает уплату регистрационного сбора, получение госномеров и свидетельства о регистрации.",
    "q2": "От чего зависит размер регистрационного сбора?",
    "a2": "Размер зависит от типа транспорта (легковой, грузовой, автобус) и года выпуска. Новые автомобили (до 2 лет) имеют минимальные ставки, старые (от 3 лет) — повышенные.",
    "q3": "Какие дополнительные платежи нужны при регистрации?",
    "a3": "Дополнительно оплачиваются: госномера (примерно 4 000 тг), свидетельство о регистрации (около 1 200 тг), техосмотр для б/у авто.",
    "q4": "Есть ли льготы для электромобилей?",
    "a4": "Да, для электромобилей действует льготная ставка регистрационного сбора — значительно ниже, чем для обычных автомобилей с ДВС.",
    "q5": "Где можно зарегистрировать автомобиль?",
    "a5": "Регистрация проводится в СпецЦОНах (специализированных центрах обслуживания населения) по месту регистрации владельца."
  },
  "from2To3Years": "От 2 до 3 лет",
  "important": "Важно",
  "importantInfo": "Важная информация",
  "importantNote": "Обратите внимание",
  "licensePlates": "Государственные номера",
  "manufactureYear": "Год выпуска",
  "mrp": "МРП",
  "over3Years": "Более 3 лет",
  "passengerCar": "Легковой автомобиль",
  "preferentialRate": "Льготная ставка",
  "preferentialRateDescription": "Для электромобилей и автомобилей до 2 лет",
  "rateFrom2To3Years": "Ставка для авто 2-3 лет",
  "rateOver3Years": "Ставка для авто старше 3 лет",
  "rateUpTo2Years": "Ставка для авто до 2 лет",
  "ratesTable2025": "Таблица ставок на 2025 год",
  "registrationCertificate": "Свидетельство о регистрации",
  "registrationFee": "Регистрационный сбор",
  "registrationFeesByAge": "Сборы по возрасту ТС",
  "totalAdditional": "Итого дополнительно",
  "totalAdditionalDescription": "Номера + свидетельство",
  "totalCost": "Общая стоимость",
  "truckCar": "Грузовой автомобиль",
  "upTo2Years": "До 2 лет",
  "vehicleParameters": "Параметры транспортного средства",
  "vehicleType": "Тип транспортного средства",
  "warning2Years": "Минимальная ставка для новых авто",
  "warning3Years": "Повышенная ставка",
  "warningOver3Years": "Максимальная ставка для старых авто",
  "year": "год",
  "years2to4": "года",
  "years5plus": "лет"
};

const kkTranslations = {
  "subtitle": "Көлік құралын тіркеу алымын есептеу",
  "additionalFees": "Қосымша алымдар",
  "basicRates2025": "2025 жылғы базалық ставкалар",
  "bus": "Автобус",
  "calculationResults": "Есептеу нәтижелері",
  "category": "Санат",
  "electricCar": "Электромобиль",
  "enterManufactureYear": "Шығарылған жылын енгізіңіз",
  "faq": {
    "q1": "Көлік құралын бастапқы тіркеу дегеніміз не?",
    "a1": "Бастапқы тіркеу — жаңа немесе әкелінген көлік құралын есепке қою. Тіркеу алымын төлеу, мемлекеттік нөмірлер және тіркеу куәлігін алуды қамтиды.",
    "q2": "Тіркеу алымының мөлшері неге байланысты?",
    "a2": "Мөлшері көлік түріне (жеңіл, жүк, автобус) және шығарылған жылына байланысты. Жаңа автомобильдер (2 жылға дейін) ең төменгі ставкаларға ие, ескілер (3 жылдан) — жоғарылатылған.",
    "q3": "Тіркеу кезінде қандай қосымша төлемдер қажет?",
    "a3": "Қосымша төленеді: мемлекеттік нөмірлер (шамамен 4 000 тг), тіркеу куәлігі (шамамен 1 200 тг), б/у авто үшін техникалық қарау.",
    "q4": "Электромобильдер үшін жеңілдіктер бар ма?",
    "a4": "Иә, электромобильдер үшін жеңілдікті тіркеу алымы ставкасы қолданылады — ІЖҚ бар кәдімгі автомобильдерге қарағанда едәуір төмен.",
    "q5": "Автомобильді қайда тіркеуге болады?",
    "a5": "Тіркеу иесі тіркелген жердегі АрнайыХҚО-да (халыққа қызмет көрсетудің арнайы орталықтарында) жүргізіледі."
  },
  "from2To3Years": "2-ден 3 жылға дейін",
  "important": "Маңызды",
  "importantInfo": "Маңызды ақпарат",
  "importantNote": "Назар аударыңыз",
  "licensePlates": "Мемлекеттік нөмірлер",
  "manufactureYear": "Шығарылған жылы",
  "mrp": "АЕК",
  "over3Years": "3 жылдан асқан",
  "passengerCar": "Жеңіл автомобиль",
  "preferentialRate": "Жеңілдікті ставка",
  "preferentialRateDescription": "Электромобильдер және 2 жылға дейінгі автомобильдер үшін",
  "rateFrom2To3Years": "2-3 жылдық авто үшін ставка",
  "rateOver3Years": "3 жылдан асқан авто үшін ставка",
  "rateUpTo2Years": "2 жылға дейінгі авто үшін ставка",
  "ratesTable2025": "2025 жылғы ставкалар кестесі",
  "registrationCertificate": "Тіркеу куәлігі",
  "registrationFee": "Тіркеу алымы",
  "registrationFeesByAge": "КҚ жасы бойынша алымдар",
  "totalAdditional": "Қосымша барлығы",
  "totalAdditionalDescription": "Нөмірлер + куәлік",
  "totalCost": "Жалпы құны",
  "truckCar": "Жүк автомобилі",
  "upTo2Years": "2 жылға дейін",
  "vehicleParameters": "Көлік құралының параметрлері",
  "vehicleType": "Көлік құралының түрі",
  "warning2Years": "Жаңа авто үшін ең төменгі ставка",
  "warning3Years": "Жоғарылатылған ставка",
  "warningOver3Years": "Ескі авто үшін ең жоғары ставка",
  "year": "жыл",
  "years2to4": "жыл",
  "years5plus": "жыл"
};

// Update Russian
const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
if (ruJson['registration-fee']) {
  Object.assign(ruJson['registration-fee'], translations);
}
fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
console.log('✅ Updated ru/calculators.json');

// Update Kazakh
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));
if (kkJson['registration-fee']) {
  Object.assign(kkJson['registration-fee'], kkTranslations);
} else {
  kkJson['registration-fee'] = {
    "title": "Көлік тіркеу алымы калькуляторы",
    "description": "Көлік құралын тіркеу алымын есептеу",
    ...kkTranslations
  };
}
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');
console.log('✅ Updated kk/calculators.json');

console.log('🎉 Registration-fee translations added!');


