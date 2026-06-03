/**
 * Реестр официальных источников по calculatorId.
 *
 * Используется в FAQSection через `getSources(calculatorId)`:
 *   <FAQSection items={[...]} sources={getSources('income-tax')} />
 *
 * Принципы:
 * - Только авторитетные источники (нормативные акты РК, госорганы, международные стандарты)
 * - Для финансовых/налоговых — НК РК (online.zakon.kz / adilet.zan.kz), eGov, КГД, НБРК, ЕНПФ
 * - Для юридических — ГК РК, СК, Кодекс о браке (adilet.zan.kz)
 * - Для социальных — ТК РК, Закон о пенсиях, ГФСС
 * - Для медицинских — WHO, NIH, CDC, NHLBI, ACOG, NICHD, USDA, EFSA, IOM
 * - Для строительных — СНиП РК, ГОСТ
 * - Для крипто — НК РК + МФЦА
 * - Для авто — Закон о транспорте, ТК ЕАЭС, КГД
 */

export interface CalculatorSource {
  title: string;
  url: string;
}

// ============ Часто используемые источники (экспорт для переиспользования) ============
const NK_RK = { title: 'Налоговый кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=1013016' };
const ADILET_NK = { title: 'НК РК (adilet.zan.kz)', url: 'https://adilet.zan.kz/rus/docs/K2500000214' };
const TK_RK = { title: 'Трудовой кодекс РК', url: 'https://online.zakon.kz/document/?doc_id=38910832' };
const GK_RK = { title: 'Гражданский кодекс РК', url: 'https://adilet.zan.kz/rus/docs/K940001000_' };
const FAMILY_CODE = { title: 'Кодекс о браке и семье РК', url: 'https://adilet.zan.kz/rus/docs/K1100000518' };
const EGOV = { title: 'eGov.kz', url: 'https://egov.kz/' };
const KGD = { title: 'КГД МФ РК', url: 'https://kgd.gov.kz/' };
const ENPF = { title: 'ЕНПФ', url: 'https://www.enpf.kz/' };
const NBK = { title: 'Национальный Банк РК', url: 'https://www.nationalbank.kz/' };
const STAT = { title: 'Бюро статистики РК', url: 'https://stat.gov.kz/' };
const GFSS = { title: 'ГФСС РК', url: 'https://www.gfss.kz/' };
const MFCA = { title: 'МФЦА (AIFC)', url: 'https://aifc.kz/' };

// ============ Источники по calculatorId ============
export const CALCULATOR_SOURCES: Record<string, CalculatorSource[]> = {
  // === НАЛОГИ ===
  'income-tax': [NK_RK, EGOV, KGD],
  'vat': [NK_RK, KGD],
  'vat-threshold': [NK_RK, KGD],
  'vehicle-tax': [
    { title: 'Налоговый кодекс РК, глава 54', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
    EGOV,
  ],
  'property-tax': [
    { title: 'НК РК — налог на имущество ст. 62', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
    EGOV,
  ],
  'property-sale-tax': [NK_RK, KGD],
  'luxury-tax': [NK_RK, KGD],
  'casino-winnings-tax': [NK_RK, KGD],
  'corporate-income-tax': [NK_RK, KGD],
  'crypto-tax': [NK_RK, MFCA, KGD],
  'rental-income-tax': [NK_RK, KGD],
  'unified-payment': [NK_RK, KGD],
  'esp-self-employed': [
    NK_RK,
    { title: 'eGov.kz — самозанятые', url: 'https://egov.kz/cms/ru/articles/employment/edinyi-sovokupnyi-platezh-esp' },
  ],
  'tax-deductions': [NK_RK, KGD],
  'tax-regime-comparison': [NK_RK, KGD, EGOV],
  'universal-declaration': [NK_RK, KGD, EGOV],
  'ip-simplified': [NK_RK, KGD],
  'excise-tax': [NK_RK, KGD],

  // === АВТО ===
  'customs-clearance': [
    { title: 'Таможенный кодекс ЕАЭС', url: 'https://online.zakon.kz/document/?doc_id=37777699' },
    KGD,
  ],
  'recycling-fee': [
    { title: 'Закон об утилизационном сборе', url: 'https://adilet.zan.kz/rus/docs/Z1600000505' },
    { title: 'Оператор РОП', url: 'https://recycle.kz/' },
  ],
  'registration-fee': [NK_RK, EGOV],
  'insurance-premium': [
    { title: 'Закон об ОГПО ВТС', url: 'https://adilet.zan.kz/rus/docs/Z030000446_' },
    NBK,
  ],
  'kasko': [
    { title: 'Закон о страховой деятельности', url: 'https://adilet.zan.kz/rus/docs/Z000000126_' },
    NBK,
  ],
  'parcel-customs': [
    { title: 'Таможенный кодекс ЕАЭС', url: 'https://online.zakon.kz/document/?doc_id=37777699' },
    { title: 'ЕЭК — пороги беспошлинного ввоза', url: 'https://eec.eaeunion.org/' },
    KGD,
  ],
  'vehicle-tco': [
    { title: 'НК РК — налог на ТС', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
    { title: 'Закон об ОГПО ВТС', url: 'https://adilet.zan.kz/rus/docs/Z030000446_' },
  ],
  'auto-leasing': [NBK, { title: 'Закон о финансовом лизинге', url: 'https://adilet.zan.kz/rus/docs/Z000000078_' }],
  'car-market-value': [
    { title: 'Kolesa.kz — рынок авто', url: 'https://kolesa.kz/' },
  ],
  'car-transfer': [NK_RK, EGOV],
  'fuel-cost': [
    { title: 'КазМунайГаз — цены на топливо', url: 'https://www.kmg.kz/' },
  ],
  'traffic-fines': [
    { title: 'КоАП РК', url: 'https://adilet.zan.kz/rus/docs/K1400000235' },
  ],
  'fancy-plates': [
    { title: 'НК РК ст. 605 — сбор за номера', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
    EGOV,
  ],
  'tire-size': [
    { title: 'ГОСТ 4754-97 Шины пневматические', url: 'https://online.zakon.kz/document/?doc_id=30099054' },
  ],

  // === ФИНАНСЫ ===
  'credit': [
    { title: 'Закон о банках и банковской деятельности', url: 'https://adilet.zan.kz/rus/docs/Z950002444_' },
    NBK,
  ],
  'deposit': [
    { title: 'Казахстанский фонд гарантирования депозитов', url: 'https://www.kdif.kz/' },
    NBK,
  ],
  'mortgage-specialized': [
    { title: 'Отбасы банк (Жилстройсбербанк)', url: 'https://hcsbk.kz/' },
    NBK,
  ],
  'rent-vs-buy': [NBK, STAT],
  'compound-interest': [NBK],
  'refinancing': [NBK],
  'microloan': [
    { title: 'Закон о МФО', url: 'https://adilet.zan.kz/rus/docs/Z1200000056' },
    NBK,
  ],
  'early-repayment': [
    { title: 'Закон о банках', url: 'https://adilet.zan.kz/rus/docs/Z950002444_' },
    NBK,
  ],
  'otbasy-bank': [
    { title: 'Отбасы банк', url: 'https://hcsbk.kz/' },
    NBK,
  ],
  'fire': [
    { title: 'Trinity Study (Bengen 4% Rule)', url: 'https://www.bogleheads.org/wiki/Trinity_study' },
  ],
  'business-roi': [
    { title: 'Гражданский кодекс РК — предпринимательство', url: 'https://adilet.zan.kz/rus/docs/K940001000_' },
  ],
  'break-even': [],
  'margin-markup': [],
  'cashback': [NBK],
  'debt-burden': [
    { title: 'Постановление НБРК о ДКН', url: 'https://www.nationalbank.kz/' },
    NBK,
  ],
  'inflation': [STAT, NBK],
  'cash-flow-gap': [],
  'franchise-payback': [],

  // === СОЦИАЛЬНЫЕ / ТРУДОВЫЕ ===
  'salary': [TK_RK, NK_RK, ENPF],
  'sick-leave': [TK_RK, GFSS],
  'maternity-benefits': [
    TK_RK,
    GFSS,
    { title: 'Постановление о пособиях по рождению', url: 'https://adilet.zan.kz/rus/docs/P1500001076' },
  ],
  'pension': [
    ENPF,
    { title: 'Закон о пенсионном обеспечении', url: 'https://adilet.zan.kz/rus/docs/Z1300000105' },
  ],
  'pension-annuity': [
    ENPF,
    { title: 'Halyk Life — пенсионные аннуитеты', url: 'https://www.halyklife.kz/' },
  ],
  'unemployment': [GFSS, TK_RK],
  'social-assistance': [
    { title: 'Закон о государственной адресной соц. помощи', url: 'https://adilet.zan.kz/rus/docs/Z010000246_' },
    EGOV,
  ],
  'gons': [
    { title: 'Закон об образовательных накоплениях', url: 'https://adilet.zan.kz/rus/docs/Z1300000099' },
    { title: 'Отбасы банк — ГОНС', url: 'https://hcsbk.kz/' },
  ],
  'alimony': [
    FAMILY_CODE,
    { title: 'Судебная практика по алиментам', url: 'https://sud.gov.kz/' },
  ],
  'vacation-pay': [TK_RK],
  'severance-pay': [TK_RK],
  'salary-reverse': [TK_RK, NK_RK],
  'business-trip': [TK_RK],
  'average-earnings': [TK_RK, GFSS],
  'overtime': [TK_RK],
  'second-job': [TK_RK, NK_RK],
  'teacher-salary': [
    { title: 'Указ Президента о БДО педагогов', url: 'https://adilet.zan.kz/rus/docs/U2300000404' },
    TK_RK,
  ],

  // === ЮРИДИЧЕСКИЕ ===
  'court-fee': [
    { title: 'НК РК, глава 78 — госпошлина', url: 'https://online.zakon.kz/document/?doc_id=36148637' },
    { title: 'Судебная система РК', url: 'https://sud.gov.kz/' },
  ],
  'penalty': [NK_RK, GK_RK],
  'notary': [
    { title: 'Нотариальная палата РК', url: 'https://notariat.kz/' },
    { title: 'Закон о нотариате', url: 'https://adilet.zan.kz/rus/docs/Z970000155_' },
  ],
  'inheritance': [
    { title: 'ГК РК — наследственное право (раздел 6)', url: 'https://adilet.zan.kz/rus/docs/K990000409_' },
  ],
  'divorce': [
    FAMILY_CODE,
    { title: 'eGov — расторжение брака', url: 'https://egov.kz/cms/ru/services/pass012_mki' },
  ],
  'property-division': [FAMILY_CODE, GK_RK],
  'statute-limitations': [GK_RK],
  'bankruptcy': [
    { title: 'Закон о банкротстве физлиц', url: 'https://adilet.zan.kz/rus/docs/Z2300000208' },
    EGOV,
  ],
  'moral-damage': [
    { title: 'ГК РК, ст. 951-952', url: 'https://adilet.zan.kz/rus/docs/K990000409_' },
  ],

  // === СТРОИТЕЛЬСТВО ===
  'concrete-volume': [
    { title: 'СНиП РК 5.03-37-2005 Бетонные конструкции', url: 'https://online.zakon.kz/document/?doc_id=30013030' },
  ],
  'brick': [
    { title: 'СНиП РК 5.02-02-2010 Каменные конструкции', url: 'https://online.zakon.kz/document/?doc_id=30013030' },
  ],
  'wallpaper': [],
  'flooring': [],
  'insulation': [
    { title: 'СНиП РК 2.04-21-2004 Тепловая защита зданий', url: 'https://online.zakon.kz/document/?doc_id=30041517' },
  ],

  // === КОММУНАЛЬНЫЕ ===
  'electricity': [
    { title: 'Алматы Су', url: 'https://www.almatysu.kz/' },
    { title: 'Астана Су Арнасы', url: 'https://astanasuarnasy.kz/' },
  ],
  'water': [
    { title: 'Алматы Су', url: 'https://www.almatysu.kz/' },
    { title: 'Астана Су Арнасы', url: 'https://astanasuarnasy.kz/' },
  ],
  'heating': [
    { title: 'Комитет по регулированию ЕРР', url: 'https://kremzk.gov.kz/' },
  ],
  'gas': [
    { title: 'QazaqGaz', url: 'https://qazaqgaz.kz/' },
  ],

  // === КОНВЕРТЕРЫ ===
  'currency-converter': [NBK, { title: 'KASE — Казахстанская фондовая биржа', url: 'https://kase.kz/' }],
  'time-converter': [],
  'number-to-words': [],
  'time-to-words': [],
  'age': [],
  'pet-age': [
    { title: 'AVMA — Pet Age', url: 'https://www.avma.org/' },
  ],
  'roman-numerals': [],
  'unit-converter': [],
  'timezone': [],
  'password-generator': [],
  'qr-code-generator': [],

  // === РЕЛИГИОЗНЫЕ ===
  'zakat': [
    { title: 'Духовное управление мусульман Казахстана', url: 'https://www.muftyat.kz/' },
  ],
  'kurban-sacrifice': [
    { title: 'Духовное управление мусульман Казахстана', url: 'https://www.muftyat.kz/' },
  ],
  'ramadan-sadaqah': [
    { title: 'ДУМК', url: 'https://www.muftyat.kz/' },
  ],
  'islamic-inheritance': [
    { title: 'ДУМК — наследство по шариату', url: 'https://www.muftyat.kz/' },
    FAMILY_CODE,
  ],
  'hajj': [
    { title: 'Хадж-комитет ДУМК', url: 'https://hajj.muftyat.kz/' },
  ],
  'islamic-mortgage': [
    { title: 'Al Hilal Islamic Bank', url: 'https://www.alhilalbank.kz/' },
    { title: 'Zaman Bank', url: 'https://zamanbank.kz/' },
  ],

  // === МАТЕМАТИКА ===
  'discount': [],
  'percentage': [],
  'leap-year': [
    { title: 'Григорианский календарь — правила', url: 'https://www.timeanddate.com/calendar/leap-year.html' },
  ],
  'date-calculator': [
    { title: 'Производственный календарь РК', url: 'https://egov.kz/cms/ru/services/calendar' },
    TK_RK,
  ],

  // === ЗДОРОВЬЕ === (WHO, NIH, CDC и др. уже встроены в код через FAQSection.sources, оставляем как fallback)
  'bmi': [
    { title: 'WHO — Healthy Lifestyle', url: 'https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations' },
    { title: 'CDC — Adult BMI Calculator', url: 'https://www.cdc.gov/bmi/adult-calculator/index.html' },
    { title: 'NHLBI — Managing Overweight/Obesity', url: 'https://www.nhlbi.nih.gov/health-topics/managing-overweight-obesity-in-adults' },
  ],
  'calories': [
    { title: 'PubMed — Mifflin-St Jeor (1990)', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
    { title: 'USDA Dietary Guidelines 2020-2025', url: 'https://www.dietaryguidelines.gov/sites/default/files/2021-03/Dietary_Guidelines_for_Americans-2020-2025.pdf' },
    { title: 'WHO — Healthy Diet', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' },
  ],
  'pregnancy': [
    { title: 'ACOG — Methods for Estimating Due Date', url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date' },
    { title: 'WHO — Antenatal Care Guidelines', url: 'https://www.who.int/publications/i/item/9789241549912' },
    { title: 'NICHD — Pregnancy', url: 'https://www.nichd.nih.gov/health/topics/pregnancy' },
  ],
  'body-fat': [
    { title: 'U.S. Navy Body Composition (DTIC ADA143890)', url: 'https://apps.dtic.mil/sti/citations/ADA143890' },
    { title: 'NCBI StatPearls — Body Composition', url: 'https://www.ncbi.nlm.nih.gov/books/NBK547708/' },
    { title: 'ACE Fitness — Percent Body Fat', url: 'https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/' },
  ],
  'sleep': [
    { title: 'NSF Hirshkowitz 2015 — Sleep Time Duration', url: 'https://pubmed.ncbi.nlm.nih.gov/29073412/' },
    { title: 'CDC — Sleep', url: 'https://www.cdc.gov/sleep/about/index.html' },
    { title: 'NHLBI — Sleep Health', url: 'https://www.nhlbi.nih.gov/health/sleep' },
  ],
  'water-intake': [
    { title: 'WHO — Drinking Water', url: 'https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/water-safety-and-quality/drinking-water' },
    { title: 'EFSA — Scientific Opinion on Water', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459' },
    { title: 'IOM — Dietary Reference Intakes for Water', url: 'https://nap.nationalacademies.org/catalog/10925/dietary-reference-intakes-for-water-potassium-sodium-chloride-and-sulfate' },
  ],

  // === ОБРАЗОВАНИЕ ===
  'ent-score': [
    { title: 'Национальный центр тестирования', url: 'https://www.testcenter.kz/' },
    { title: 'МНВО РК', url: 'https://www.gov.kz/memleket/entities/sci' },
  ],
  'gpa': [
    { title: 'GPA Scale Conversion (US Education)', url: 'https://en.wikipedia.org/wiki/Grading_in_education' },
  ],

  // === СЕЛЬСКОЕ ХОЗЯЙСТВО ===
  'farm-land-tax': [
    NK_RK,
    { title: 'Земельный кодекс РК', url: 'https://adilet.zan.kz/rus/docs/K030000442_' },
  ],

  // === НЕДВИЖИМОСТЬ ===
  'fair-rental-price': [
    { title: 'Krisha.kz — рынок недвижимости', url: 'https://krisha.kz/' },
  ],
  'apartment-valuation': [
    { title: 'Krisha.kz — оценка квартир', url: 'https://krisha.kz/' },
  ],
  'cost-of-living': [STAT, NBK],
};

/**
 * Получить источники для калькулятора по его ID.
 * Возвращает пустой массив если калькулятор не зарегистрирован — UI блок не отобразится.
 */
export function getSources(calculatorId: string): CalculatorSource[] {
  return CALCULATOR_SOURCES[calculatorId] ?? [];
}
