import fs from 'fs';
import path from 'path';

const translations = {
  "subtitle": "Расчет стоимости страховой премии ОГПО",
  "addDriver": "Добавить водителя",
  "ageExperienceCoeff1": "До 25 лет, стаж до 2 лет — 1.3",
  "ageExperienceCoeff2": "До 25 лет, стаж от 2 лет — 1.15",
  "ageExperienceCoeff3": "От 25 лет, стаж до 2 лет — 1.15",
  "ageExperienceCoeff4": "От 25 лет, стаж от 2 лет — 1.0",
  "ageExperienceCoefficient": "Коэффициент возраста и стажа",
  "ageExperienceCoefficientsTitle": "Коэффициенты возраста и стажа",
  "ageLabel": "Возраст водителя",
  "agePlaceholder": "Введите возраст",
  "back": "Назад",
  "basePremium": "Базовая премия",
  "bonusMalus": "Бонус-малус",
  "bonusMalusCoefficient": "Коэффициент бонус-малус",
  "bonusMalusDescription": "Класс страхования зависит от истории ДТП",
  "bonusMalusInfoText": "Коэффициент зависит от вашего класса страхования (история без ДТП снижает стоимость)",
  "bonusMalusInfoTitle": "Система бонус-малус",
  "bonusMalusTitle": "Класс бонус-малус",
  "calculationDetails": "Детали расчета",
  "classLabel": "Класс",
  "coefficient": "Коэффициент",
  "coefficientCalculatedBy": "Коэффициент рассчитывается по",
  "driverLabel": "Водитель",
  "driversDescription": "Добавьте всех водителей, которые будут управлять ТС",
  "driversTitle": "Данные водителей",
  "experienceLabel": "Стаж вождения (лет)",
  "experiencePlaceholder": "Введите стаж",
  "exploitationCoefficient": "Коэффициент эксплуатации",
  "faq": {
    "q1": "Что такое ОГПО и зачем оно нужно?",
    "a1": "ОГПО — обязательное страхование гражданско-правовой ответственности владельцев транспортных средств. Страховка покрывает ущерб третьим лицам при ДТП.",
    "q2": "От чего зависит стоимость страховки ОГПО?",
    "a2": "Стоимость зависит от: базовой премии, региона, типа ТС, возраста и стажа водителей, класса бонус-малус, года выпуска авто.",
    "q3": "Что такое класс бонус-малус?",
    "a3": "Система скидок/надбавок за безаварийную езду. Начальный класс — 3 (коэф. 1.0). За год без ДТП класс повышается, премия снижается до 50%.",
    "q4": "Можно ли вписать нескольких водителей?",
    "a4": "Да, можно вписать до 5 водителей. Расчет ведется по худшему коэффициенту (самый молодой/неопытный водитель).",
    "q5": "Как оформить ОГПО онлайн?",
    "a5": "Через сайты страховых компаний, приложения Kaspi, Halyk или агрегаторы страховок. Полис сразу отправляется в базу МВД."
  },
  "formula": "Премия = База × Территория × Возраст/Стаж × Бонус-малус × Тип ТС",
  "formulaNote": "Расчет ведется по наихудшему коэффициенту среди водителей",
  "formulaTitle": "Формула расчета",
  "manufactureYearHint": "Влияет на коэффициент эксплуатации",
  "manufactureYearLabel": "Год выпуска авто",
  "manufactureYearPlaceholder": "Введите год",
  "newCalculation": "Новый расчет",
  "next": "Далее",
  "premiumCost": "Стоимость премии",
  "regions": "Регионы",
  "removeDriver": "Удалить водителя",
  "resultsTitle": "Результаты расчета",
  "stepIndicator": "Шаг",
  "steps": "Шаги",
  "territoryCoefficient": "Территориальный коэффициент",
  "territoryDescription": "Коэффициент зависит от региона регистрации ТС",
  "territoryTitle": "Территория",
  "vehicleAgeInfo": "Возраст ТС влияет на коэффициент эксплуатации",
  "vehicleTitle": "Данные транспортного средства",
  "vehicleTypeCoefficient": "Коэффициент типа ТС",
  "vehicleTypeLabel": "Тип транспортного средства",
  "vehicleTypes": "Типы ТС",
  "worstDriverInfo": "Расчет ведется по водителю с худшим коэффициентом"
};

const kkTranslations = {
  "subtitle": "АІКЖА сақтандыру сыйлықақысын есептеу",
  "addDriver": "Жүргізушіні қосу",
  "ageExperienceCoeff1": "25 жасқа дейін, тәжірибесі 2 жылға дейін — 1.3",
  "ageExperienceCoeff2": "25 жасқа дейін, тәжірибесі 2 жылдан — 1.15",
  "ageExperienceCoeff3": "25 жастан, тәжірибесі 2 жылға дейін — 1.15",
  "ageExperienceCoeff4": "25 жастан, тәжірибесі 2 жылдан — 1.0",
  "ageExperienceCoefficient": "Жас пен тәжірибе коэффициенті",
  "ageExperienceCoefficientsTitle": "Жас пен тәжірибе коэффициенттері",
  "ageLabel": "Жүргізуші жасы",
  "agePlaceholder": "Жасын енгізіңіз",
  "back": "Артқа",
  "basePremium": "Базалық сыйлықақы",
  "bonusMalus": "Бонус-малус",
  "bonusMalusCoefficient": "Бонус-малус коэффициенті",
  "bonusMalusDescription": "Сақтандыру сыныбы ЖКО тарихына байланысты",
  "bonusMalusInfoText": "Коэффициент сақтандыру сыныбыңызға байланысты (ЖКО-сыз тарих құнды төмендетеді)",
  "bonusMalusInfoTitle": "Бонус-малус жүйесі",
  "bonusMalusTitle": "Бонус-малус сыныбы",
  "calculationDetails": "Есептеу мәліметтері",
  "classLabel": "Сынып",
  "coefficient": "Коэффициент",
  "coefficientCalculatedBy": "Коэффициент бойынша есептеледі",
  "driverLabel": "Жүргізуші",
  "driversDescription": "КҚ басқаратын барлық жүргізушілерді қосыңыз",
  "driversTitle": "Жүргізушілер деректері",
  "experienceLabel": "Жүргізу тәжірибесі (жыл)",
  "experiencePlaceholder": "Тәжірибені енгізіңіз",
  "exploitationCoefficient": "Пайдалану коэффициенті",
  "faq": {
    "q1": "АІКЖА дегеніміз не және ол не үшін қажет?",
    "a1": "АІКЖА — көлік құралдары иелерінің азаматтық-құқықтық жауапкершілігін міндетті сақтандыру. Сақтандыру ЖКО кезінде үшінші тұлғаларға келтірілген залалды жабады.",
    "q2": "АІКЖА сақтандыру құны неге байланысты?",
    "a2": "Құны байланысты: базалық сыйлықақы, аймақ, КҚ түрі, жүргізушілердің жасы мен тәжірибесі, бонус-малус сыныбы, авто шығарылған жылы.",
    "q3": "Бонус-малус сыныбы дегеніміз не?",
    "a3": "Апатсыз жүргізу үшін жеңілдіктер/үстемелер жүйесі. Бастапқы сынып — 3 (коэф. 1.0). ЖКО-сыз жыл үшін сынып жоғарылайды, сыйлықақы 50%-ға дейін төмендейді.",
    "q4": "Бірнеше жүргізушіні жазуға бола ма?",
    "a4": "Иә, 5 жүргізушіге дейін жазуға болады. Есептеу ең нашар коэффициент бойынша жүргізіледі (ең жас/тәжірибесіз жүргізуші).",
    "q5": "АІКЖА-ны онлайн қалай рәсімдеуге болады?",
    "a5": "Сақтандыру компанияларының сайттары, Kaspi, Halyk қосымшалары немесе сақтандыру агрегаторлары арқылы. Полис бірден ІІМ базасына жіберіледі."
  },
  "formula": "Сыйлықақы = База × Аумақ × Жас/Тәжірибе × Бонус-малус × КҚ түрі",
  "formulaNote": "Есептеу жүргізушілер арасындағы ең нашар коэффициент бойынша жүргізіледі",
  "formulaTitle": "Есептеу формуласы",
  "manufactureYearHint": "Пайдалану коэффициентіне әсер етеді",
  "manufactureYearLabel": "Авто шығарылған жылы",
  "manufactureYearPlaceholder": "Жылды енгізіңіз",
  "newCalculation": "Жаңа есептеу",
  "next": "Әрі қарай",
  "premiumCost": "Сыйлықақы құны",
  "regions": "Аймақтар",
  "removeDriver": "Жүргізушіні жою",
  "resultsTitle": "Есептеу нәтижелері",
  "stepIndicator": "Қадам",
  "steps": "Қадамдар",
  "territoryCoefficient": "Аумақтық коэффициент",
  "territoryDescription": "Коэффициент КҚ тіркелген аймаққа байланысты",
  "territoryTitle": "Аумақ",
  "vehicleAgeInfo": "КҚ жасы пайдалану коэффициентіне әсер етеді",
  "vehicleTitle": "Көлік құралы деректері",
  "vehicleTypeCoefficient": "КҚ түрі коэффициенті",
  "vehicleTypeLabel": "Көлік құралының түрі",
  "vehicleTypes": "КҚ түрлері",
  "worstDriverInfo": "Есептеу ең нашар коэффициенті бар жүргізуші бойынша жүргізіледі"
};

const ruPath = path.join(process.cwd(), 'src/i18n/locales/ru/calculators.json');
const kkPath = path.join(process.cwd(), 'src/i18n/locales/kk/calculators.json');

const ruJson = JSON.parse(fs.readFileSync(ruPath, 'utf-8'));
const kkJson = JSON.parse(fs.readFileSync(kkPath, 'utf-8'));

if (ruJson['insurance-premium']) Object.assign(ruJson['insurance-premium'], translations);
if (kkJson['insurance-premium']) Object.assign(kkJson['insurance-premium'], kkTranslations);
else kkJson['insurance-premium'] = { title: "АІКЖА калькуляторы", description: "Сақтандыру сыйлықақысын есептеу", ...kkTranslations };

fs.writeFileSync(ruPath, JSON.stringify(ruJson, null, 2), 'utf-8');
fs.writeFileSync(kkPath, JSON.stringify(kkJson, null, 2), 'utf-8');
console.log('✅ insurance-premium translations added!');


