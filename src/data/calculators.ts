import { CalculatorCategory } from '../types/calculator';
import React from 'react';

export const calculatorCategories: CalculatorCategory[] = [
  {
    id: 'tax',
    title: 'Налоговые калькуляторы',
    description: 'Расчет налогов, социальных платежей и сборов для физических лиц и ИП',
    icon: 'FileText',
    calculators: [
      {
        id: 'income-tax',
        title: 'Калькулятор ИПН для наёмных работников',
        description: 'Расчет индивидуального подоходного налога и социальных взносов',
        category: 'tax',
        icon: 'Calculator',
        component: React.lazy(() => import('../components/calculators/IncomeTaxCalculator'))
      },
      {
        id: 'vehicle-tax',
        title: 'Налог на транспортные средства',
        description: 'Расчет налога на автомобили и другие транспортные средства',
        category: 'tax',
        icon: 'Car',
        component: React.lazy(() => import('../components/calculators/VehicleTaxCalculator'))
      },
      {
        id: 'property-tax',
        title: 'Налог на имущество физических лиц',
        description: 'Расчет налога на недвижимость и другое имущество',
        category: 'tax',
        icon: 'Home',
        component: React.lazy(() => import('../components/calculators/PropertyTaxCalculator'))
      },
      {
        id: 'ip-simplified',
        title: 'Налоги ИП на упрощенке',
        description: 'Расчет налогов и соцплатежей для индивидуальных предпринимателей',
        category: 'tax',
        icon: 'Briefcase',
        component: React.lazy(() => import('../components/calculators/IPSimplifiedCalculator'))
      },
      {
        id: 'tax-deductions',
        title: 'Калькулятор социальных налоговых вычетов по ИПН',
        description: 'Расчет возврата подоходного налога через социальные вычеты на образование, лечение и др.',
        category: 'tax',
        icon: 'Receipt',
        component: React.lazy(() => import('../components/calculators/TaxDeductionsCalculator'))
      }
      ,
      {
        id: 'vat',
        title: 'Калькулятор НДС',
        description: 'Добавление, выделение НДС и массовые расчеты для товаров и услуг',
        category: 'tax',
        icon: 'Receipt',
        component: React.lazy(() => import('../components/calculators/VATCalculator'))
      },
      {
        id: 'vat-threshold',
        title: 'Калькулятор порога по НДС',
        description: 'Отслеживание оборота для определения обязанности регистрации по НДС',
        category: 'tax',
        icon: 'Receipt',
        component: React.lazy(() => import('../components/calculators/VATThresholdCalculator'))
      },
      {
        id: 'luxury-tax',
        title: 'Калькулятор налога на роскошь',
        description: 'Расчет повышенных налогов на дорогостоящее имущество физических лиц',
        category: 'tax',
        icon: 'Crown',
        component: React.lazy(() => import('../components/calculators/LuxuryTaxCalculator'))
      },
      {
        id: 'casino-winnings-tax',
        title: 'Калькулятор налогов на выигрыш в казино',
        description: 'Расчет налога на выигрыши в казино и игорных заведениях с учетом всех вычетов',
        category: 'tax',
        icon: 'DollarSign',
        component: React.lazy(() => import('../components/calculators/CasinoWinningsTaxCalculator'))
      },
      {
        id: 'corporate-income-tax',
        title: 'КПН для ТОО',
        description: 'Корпоративный подоходный налог 20% / 10% / 6% по НК РК 2026',
        category: 'tax',
        icon: 'Briefcase',
        component: React.lazy(() => import('../components/calculators/CorporateIncomeTaxCalculator'))
      },
      {
        id: 'crypto-tax',
        title: 'Налог на криптовалюту',
        description: 'ИПН/КПН с операций crypto в Казахстане',
        category: 'tax',
        icon: 'Bitcoin',
        component: React.lazy(() => import('../components/calculators/CryptoTaxCalculator'))
      },
      {
        id: 'property-sale-tax',
        title: 'Налог при продаже имущества',
        description: 'ИПН 10% с прироста стоимости при продаже недвижимости и авто',
        category: 'tax',
        icon: 'Home',
        component: React.lazy(() => import('../components/calculators/PropertySaleTaxCalculator'))
      },
      {
        id: 'rental-income-tax',
        title: 'Налог с аренды',
        description: 'Сравнение режимов налогообложения для арендодателя',
        category: 'tax',
        icon: 'Key',
        component: React.lazy(() => import('../components/calculators/RentalIncomeTaxCalculator'))
      },
      {
        id: 'universal-declaration',
        title: 'Всеобщее декларирование (ФНО 250/270)',
        description: 'Когда и какую декларацию подавать гражданам РК',
        category: 'tax',
        icon: 'FileText',
        component: React.lazy(() => import('../components/calculators/UniversalDeclarationCalculator'))
      },
      {
        id: 'unified-payment',
        title: 'Единый платёж с ФОТ',
        description: 'ЕП 24.8% — упрощённый налог с фонда оплаты труда',
        category: 'tax',
        icon: 'Users',
        component: React.lazy(() => import('../components/calculators/UnifiedPaymentCalculator'))
      },
      {
        id: 'tax-regime-comparison',
        title: 'Сравнение налоговых режимов ИП',
        description: 'Упрощёнка / ОУР / Розничный — какой режим выгоднее по НК РК 2026',
        category: 'tax',
        icon: 'BarChart3',
        component: React.lazy(() => import('../components/calculators/TaxRegimeComparisonCalculator'))
      }
    ]
  },
  {
    id: 'auto',
    title: 'Автомобильные калькуляторы',
    description: 'Расчеты, связанные с покупкой, регистрацией и страхованием автомобилей',
    icon: 'Car',
    calculators: [
      {
        id: 'customs-clearance',
        title: 'Таможенная очистка автомобилей',
        description: 'Расчет стоимости растаможки ввозимых автомобилей',
        category: 'auto',
        icon: 'Truck',
        component: React.lazy(() => import('../components/calculators/CustomsClearanceCalculator'))
      },
      {
        id: 'recycling-fee',
        title: 'Утилизационный сбор',
        description: 'Расчет утилизационного сбора при регистрации автомобиля',
        category: 'auto',
        icon: 'Recycle',
        component: React.lazy(() => import('../components/calculators/RecyclingFeeCalculator'))
      },
      {
        id: 'registration-fee',
        title: 'Сбор за первичную регистрацию',
        description: 'Расчет госпошлины за постановку автомобиля на учет',
        category: 'auto',
        icon: 'FileCheck',
        component: React.lazy(() => import('../components/calculators/RegistrationFeeCalculator'))
      },
      {
        id: 'insurance-premium',
        title: 'ОГПО ВТС (страховка)',
        description: 'Расчет стоимости обязательного страхования автогражданской ответственности',
        category: 'auto',
        icon: 'Shield',
        component: React.lazy(() => import('../components/calculators/InsuranceCalculator'))
      }
      ,
      {
        id: 'vehicle-tax',
        title: 'Налог на транспортные средства',
        description: 'Расчет налога на автомобили и другие транспортные средства',
        category: 'auto',
        icon: 'Car',
        component: React.lazy(() => import('../components/calculators/VehicleTaxCalculator'))
      },
      {
        id: 'parcel-customs',
        title: 'Таможенная пошлина на посылки',
        description: 'Расчет пошлины на международные посылки и покупки из-за рубежа',
        category: 'auto',
        icon: 'Package',
        component: React.lazy(() => import('../components/calculators/ParcelCustomsCalculator'))
      },
      {
        id: 'kasko',
        title: 'Калькулятор КАСКО',
        description: 'Стоимость добровольного автострахования: ставка 4% × коэффициенты водителя, региона и франшизы',
        category: 'auto',
        icon: 'Shield',
        component: React.lazy(() => import('../components/calculators/KaskoCalculator'))
      },
      {
        id: 'vehicle-tco',
        title: 'Полная стоимость владения авто (TCO)',
        description: 'Все расходы на автомобиль за 1/3/5/10 лет — топливо, страховка, налоги, ТО, амортизация',
        category: 'auto',
        icon: 'DollarSign',
        component: React.lazy(() => import('../components/calculators/VehicleTCOCalculator'))
      },
      {
        id: 'auto-leasing',
        title: 'Калькулятор автолизинга',
        description: 'Сравнение лизинга с автокредитом: первоначальный взнос, остаточная стоимость, ГЭСВ',
        category: 'auto',
        icon: 'Wallet',
        component: React.lazy(() => import('../components/calculators/AutoLeasingCalculator'))
      },
      {
        id: 'car-market-value',
        title: 'Рыночная стоимость б/у авто',
        description: 'Оценка стоимости подержанного авто с учётом года, пробега, региона и состояния',
        category: 'auto',
        icon: 'TrendingUp',
        component: React.lazy(() => import('../components/calculators/CarMarketValueCalculator'))
      },
      {
        id: 'car-transfer',
        title: 'Стоимость переоформления авто',
        description: 'Полная стоимость перерегистрации: госпошлины, нотариус, страховка, ИПН с продажи',
        category: 'auto',
        icon: 'RefreshCw',
        component: React.lazy(() => import('../components/calculators/CarTransferCalculator'))
      },
      {
        id: 'fuel-cost',
        title: 'Калькулятор расхода топлива',
        description: 'Стоимость поездки и месячный расход для маршрутов Алматы — Астана, Алматы — Шымкент и др.',
        category: 'auto',
        icon: 'Fuel',
        component: React.lazy(() => import('../components/calculators/FuelCostCalculator'))
      },
      {
        id: 'traffic-fines',
        title: 'Калькулятор штрафов ПДД',
        description: 'Размер штрафов ПДД РК со скидкой 50% за оплату в течение 7 дней',
        category: 'auto',
        icon: 'AlertTriangle',
        component: React.lazy(() => import('../components/calculators/TrafficFinesCalculator'))
      },
      {
        id: 'fancy-plates',
        title: 'Стоимость красивых госномеров',
        description: 'Сбор за выбор регистрационного номера авто в МРП — статья 605 НК РК',
        category: 'auto',
        icon: 'Hash',
        component: React.lazy(() => import('../components/calculators/FancyPlatesCalculator'))
      },
      {
        id: 'tire-size',
        title: 'Калькулятор размеров шин',
        description: 'Сравнение шин: диаметр, окружность, обороты на км, ошибка спидометра',
        category: 'auto',
        icon: 'CircleDot',
        component: React.lazy(() => import('../components/calculators/TireSizeCalculator'))
      }
    ]
  },
  {
    id: 'finance',
    title: 'Финансовые калькуляторы',
    description: 'Кредиты, депозиты, ипотека и другие банковские продукты',
    icon: 'CreditCard',
    calculators: [
      {
        id: 'credit',
        title: 'Универсальный кредитный калькулятор',
        description: 'Расчет платежей, переплаты и графика погашения кредита',
        category: 'finance',
        icon: 'CreditCard',
        component: React.lazy(() => import('../components/calculators/CreditCalculator'))
      },
      {
        id: 'deposit',
        title: 'Калькулятор банковских вкладов',
        description: 'Расчет доходности депозитов с разными условиями',
        category: 'finance',
        icon: 'PiggyBank',
        component: React.lazy(() => import('../components/calculators/DepositCalculator'))
      },
      {
        id: 'mortgage-specialized',
        title: 'Специализированный ипотечный калькулятор',
        description: 'Сравнение ипотечных программ Казахстана с расчетом ГЭСВ',
        category: 'finance',
        icon: 'Home',
        component: React.lazy(() => import('../components/calculators/MortgageCalculator'))
      },
      {
        id: 'rent-vs-buy',
        title: 'Аренда или покупка жилья',
        description: 'Сравнение долгосрочных финансовых последствий аренды и покупки недвижимости',
        category: 'finance',
        icon: 'Building',
        component: React.lazy(() => import('../components/calculators/RentOrBuyCalculator'))
      }
      ,
      {
        id: 'compound-interest',
        title: 'Калькулятор сложного процента',
        description: 'Расчет доходности инвестиций и депозитов с капитализацией процентов',
        category: 'finance',
        icon: 'TrendingUp',
        component: React.lazy(() => import('../components/calculators/CompoundInterestCalculator'))
      },
      {
        id: 'refinancing',
        title: 'Калькулятор рефинансирования кредита',
        description: 'Расчет выгоды от перекредитования под более низкую процентную ставку',
        category: 'finance',
        icon: 'RefreshCw',
        component: React.lazy(() => import('../components/calculators/RefinancingCalculator'))
      },
      {
        id: 'microloan',
        title: 'Калькулятор микрокредита',
        description: 'Расчет платежей и переплаты по микрозаймам от МФО Казахстана',
        category: 'finance',
        icon: 'Banknote',
        component: React.lazy(() => import('../components/calculators/MicroloanCalculator'))
      },
      {
        id: 'early-repayment',
        title: 'Калькулятор досрочного погашения кредита',
        description: 'Расчет экономии при досрочном погашении: сокращение срока или уменьшение платежа',
        category: 'finance',
        icon: 'TimerOff',
        component: React.lazy(() => import('../components/calculators/EarlyRepaymentCalculator'))
      },
      {
        id: 'otbasy-bank',
        title: 'Программы Отбасы Банк',
        description: 'Баспана Хит, 7-20-25, Отау, Баспана Жас — ставки и платежи',
        category: 'finance',
        icon: 'Home',
        component: React.lazy(() => import('../components/calculators/OtbasyBankCalculator'))
      },
      {
        id: 'fire',
        title: 'Калькулятор FIRE',
        description: 'Финансовая независимость и ранний выход на пенсию — расчёт целевого капитала',
        category: 'finance',
        icon: 'TrendingUp',
        component: React.lazy(() => import('../components/calculators/FIRECalculator'))
      },
      {
        id: 'business-roi',
        title: 'ROI бизнеса и NPV',
        description: 'Окупаемость, ROI и NPV для бизнес-проектов с учётом налогов',
        category: 'finance',
        icon: 'BarChart3',
        component: React.lazy(() => import('../components/calculators/BusinessROICalculator'))
      },
      {
        id: 'break-even',
        title: 'Точка безубыточности',
        description: 'BEP, маржинальная прибыль и запас прочности для бизнеса',
        category: 'finance',
        icon: 'Target',
        component: React.lazy(() => import('../components/calculators/BreakEvenCalculator'))
      },
      {
        id: 'margin-markup',
        title: 'Маржа и наценка',
        description: 'Расчёт маржинальности, наценки и обратный расчёт цены товара',
        category: 'finance',
        icon: 'Percent',
        component: React.lazy(() => import('../components/calculators/MarginMarkupCalculator'))
      },
      {
        id: 'cashback',
        title: 'Калькулятор кэшбэка',
        description: 'Сравнение кэшбэка по картам Kaspi, Halyk, Jusan, Forte, БЦК',
        category: 'finance',
        icon: 'CreditCard',
        component: React.lazy(() => import('../components/calculators/CashbackCalculator'))
      },
      {
        id: 'debt-burden',
        title: 'Долговая нагрузка (DTI)',
        description: 'Коэффициент долговой нагрузки и проверка порога НБРК 50%',
        category: 'finance',
        icon: 'AlertTriangle',
        component: React.lazy(() => import('../components/calculators/DebtBurdenCalculator'))
      },
      {
        id: 'inflation',
        title: 'Калькулятор инфляции РК',
        description: 'Обесценивание тенге с 2015 по 2026 по официальным данным КС РК',
        category: 'finance',
        icon: 'TrendingDown',
        component: React.lazy(() => import('../components/calculators/InflationCalculator'))
      },
      {
        id: 'cash-flow-gap',
        title: 'Калькулятор кассового разрыва',
        description: 'Прогноз кассового разрыва бизнеса на основе DSO/DPO/DIO циклов и роста выручки',
        category: 'finance',
        icon: 'TrendingDown',
        component: React.lazy(() => import('../components/calculators/CashFlowGapCalculator'))
      },
      {
        id: 'franchise-payback',
        title: 'Калькулятор окупаемости франшизы',
        description: 'Расчёт окупаемости франшизы: паушальный взнос, роялти, расходы и срок возврата инвестиций',
        category: 'finance',
        icon: 'Store',
        component: React.lazy(() => import('../components/calculators/FranchisePaybackCalculator'))
      }
    ]
  },
  {
    id: 'agriculture',
    title: 'Сельское хозяйство',
    description: 'Налоги, льготы и расчеты для фермерских и крестьянских хозяйств',
    icon: 'Wheat',
    calculators: [
      {
        id: 'farm-land-tax',
        title: 'Калькулятор единого земельного налога',
        description: 'Расчет упрощенного налогообложения для крестьянских и фермерских хозяйств',
        category: 'agriculture',
        icon: 'Wheat',
        component: React.lazy(() => import('../components/calculators/FarmLandTaxCalculator'))
      }
    ]
  },
  {
    id: 'social',
    title: 'Социальные выплаты и трудовые отношения',
    description: 'Пособия, пенсии, зарплаты и другие социальные выплаты',
    icon: 'Users',
    calculators: [
      {
        id: 'salary',
        title: 'Зарплатный калькулятор',
        description: 'Полная структура удержаний и расчет суммы "на руки"',
        category: 'social',
        icon: 'Wallet',
        component: React.lazy(() => import('../components/calculators/SalaryCalculator'))
      },
      {
        id: 'sick-leave',
        title: 'Калькулятор больничного листа',
        description: 'Расчет пособия по временной нетрудоспособности с учетом всех удержаний',
        category: 'social',
        icon: 'HeartPulse',
        component: React.lazy(() => import('../components/calculators/SickLeaveCalculator'))
      },
      {
        id: 'maternity-benefits',
        title: 'Пособия по беременности и родам',
        description: 'Расчет социальных выплат для работающих и неработающих родителей',
        category: 'social',
        icon: 'Baby',
        component: React.lazy(() => import('../components/calculators/MaternityBenefitsCalculator'))
      },
      {
        id: 'pension',
        title: 'Пенсионные выплаты',
        description: 'Оценка размера пенсии по возрасту',
        category: 'social',
        icon: 'Clock',
        component: React.lazy(() => import('../components/calculators/PensionCalculator'))
      },
      {
        id: 'pension-annuity',
        title: 'Калькулятор пенсионного аннуитета',
        description: 'Расчет пожизненных выплат при переводе накоплений из ЕНПФ в страховую компанию',
        category: 'social',
        icon: 'Shield',
        component: React.lazy(() => import('../components/calculators/PensionAnnuityCalculator'))
      },
      {
        id: 'unemployment',
        title: 'Пособие по безработице',
        description: 'Расчет пособия по потере работы',
        category: 'social',
        icon: 'AlertCircle',
        component: React.lazy(() => import('../components/calculators/UnemploymentBenefitCalculator'))
      },
      {
        id: 'social-assistance',
        title: 'Калькулятор адресной социальной помощи (АСП)',
        description: 'Определение права на государственную поддержку семей с низким доходом',
        category: 'social',
        icon: 'HandHeart',
        component: React.lazy(() => import('../components/calculators/SocialAssistanceCalculator'))
      },
      {
        id: 'gons',
        title: 'Калькулятор образовательного накопительного вклада (ГОНС)',
        description: 'Прогнозирование накоплений на образование детей с государственной поддержкой',
        category: 'social',
        icon: 'GraduationCap',
        component: React.lazy(() => import('../components/calculators/GONSCalculator'))
      },
      {
        id: 'alimony',
        title: 'Калькулятор алиментов',
        description: 'Расчет ежемесячных выплат на содержание несовершеннолетних детей',
        category: 'social',
        icon: 'Heart',
        component: React.lazy(() => import('../components/calculators/AlimonyCalculator'))
      },
      {
        id: 'vacation-pay',
        title: 'Калькулятор отпускных',
        description: 'Расчет суммы отпускных выплат с учетом всех удержаний по ТК РК',
        category: 'social',
        icon: 'Palmtree',
        component: React.lazy(() => import('../components/calculators/VacationPayCalculator'))
      },
      {
        id: 'severance-pay',
        title: 'Компенсация при увольнении',
        description: 'Расчет выплат при увольнении: компенсация отпуска и выходное пособие',
        category: 'social',
        icon: 'UserMinus',
        component: React.lazy(() => import('../components/calculators/SeverancePayCalculator'))
      },
      {
        id: 'salary-reverse',
        title: 'Обратный расчёт зарплаты: net → gross',
        description: 'Расчёт gross-зарплаты из суммы на руки + полная стоимость работодателю',
        category: 'social',
        icon: 'RefreshCw',
        component: React.lazy(() => import('../components/calculators/SalaryReverseCalculator'))
      },
      {
        id: 'business-trip',
        title: 'Калькулятор командировочных',
        description: 'Суточные по РК (4-6 МРП) и зарубеж (75-150 USD) + налогообложение сверхнорм',
        category: 'social',
        icon: 'Plane',
        component: React.lazy(() => import('../components/calculators/BusinessTripCalculator'))
      },
      {
        id: 'average-earnings',
        title: 'Калькулятор среднего заработка',
        description: 'Расчёт среднего заработка для отпуска, больничного, декрета и командировок по ТК РК',
        category: 'social',
        icon: 'TrendingUp',
        component: React.lazy(() => import('../components/calculators/AverageEarningsCalculator'))
      },
      {
        id: 'overtime',
        title: 'Калькулятор сверхурочных и ночных',
        description: 'Сверхурочные ×1.5/×2, выходные ×2, ночные +0.5 (ТК РК ст. 108-109)',
        category: 'social',
        icon: 'Clock',
        component: React.lazy(() => import('../components/calculators/OvertimeCalculator'))
      },
      {
        id: 'second-job',
        title: 'Калькулятор совместительства',
        description: 'Зарплата на двух работах: основная + внешняя без вычета 30 МРП (ТК РК ст. 196)',
        category: 'social',
        icon: 'Briefcase',
        component: React.lazy(() => import('../components/calculators/SecondJobCalculator'))
      },
      {
        id: 'teacher-salary',
        title: 'Калькулятор зарплаты учителя 2026',
        description: 'БДО × категория × стаж + доплаты за классное руководство, сельские школы, тетради',
        category: 'social',
        icon: 'GraduationCap',
        component: React.lazy(() => import('../components/calculators/TeacherSalaryCalculator'))
      }
    ]
  },
  {
    id: 'legal',
    title: 'Юридические услуги',
    description: 'Расчет госпошлин, судебных расходов и нотариальных услуг',
    icon: 'Scale',
    calculators: [
      {
        id: 'court-fee',
        title: 'Государственная пошлина в суд',
        description: 'Расчет госпошлины для различных видов судебных дел',
        category: 'legal',
        icon: 'Scale',
        component: React.lazy(() => import('../components/calculators/CourtFeeCalculator'))
      },
      {
        id: 'penalty',
        title: 'Калькулятор пени',
        description: 'Расчет пени за просрочку платежей по различным обязательствам',
        category: 'legal',
        icon: 'AlertTriangle',
        component: React.lazy(() => import('../components/calculators/PenaltyCalculator'))
      },
      {
        id: 'notary',
        title: 'Стоимость нотариальных услуг',
        description: 'Расчет госпошлины и услуг правового и технического характера',
        category: 'legal',
        icon: 'FileSignature',
        component: React.lazy(() => import('../components/calculators/NotaryServicesCalculator'))
      },
      {
        id: 'inheritance',
        title: 'Калькулятор наследства РК',
        description: 'Расчёт долей наследников по закону, обязательная доля, расходы на нотариуса',
        category: 'legal',
        icon: 'Users',
        component: React.lazy(() => import('../components/calculators/InheritanceCalculator'))
      },
      {
        id: 'divorce',
        title: 'Калькулятор стоимости развода РК',
        description: 'Госпошлины, юр. услуги и сроки расторжения брака через ЗАГС или суд',
        category: 'legal',
        icon: 'Heart',
        component: React.lazy(() => import('../components/calculators/DivorceCalculator'))
      },
      {
        id: 'property-division',
        title: 'Раздел имущества при разводе',
        description: 'Совместное и личное имущество, долги, доли супругов и судебные расходы',
        category: 'legal',
        icon: 'Scale',
        component: React.lazy(() => import('../components/calculators/PropertyDivisionCalculator'))
      },
      {
        id: 'statute-limitations',
        title: 'Сроки исковой давности РК',
        description: '12 категорий гражданских, налоговых и трудовых споров с расчётом дат',
        category: 'legal',
        icon: 'Clock',
        component: React.lazy(() => import('../components/calculators/StatuteLimitationsCalculator'))
      },
      {
        id: 'bankruptcy',
        title: 'Банкротство физлиц РК',
        description: 'Выбор процедуры: внесудебная, судебная или восстановление платёжеспособности',
        category: 'legal',
        icon: 'AlertTriangle',
        component: React.lazy(() => import('../components/calculators/BankruptcyCalculator'))
      },
      {
        id: 'moral-damage',
        title: 'Компенсация морального вреда РК',
        description: '9 категорий по ст. 951-952 ГК РК с ориентирами судебной практики',
        category: 'legal',
        icon: 'HandHeart',
        component: React.lazy(() => import('../components/calculators/MoralDamageCalculator'))
      }
    ]
  },
  {
    id: 'construction',
    title: 'Строительные калькуляторы',
    description: 'Расчёты материалов для строительства и ремонта: бетон, кирпич, обои, ламинат, утепление',
    icon: 'HardHat',
    calculators: [
      {
        id: 'concrete-volume',
        title: 'Калькулятор объёма бетона',
        description: 'Расчёт количества бетона и материалов (цемент, песок, щебень, вода) для плиты, фундамента, колонны или лестницы',
        category: 'construction',
        icon: 'Box',
        component: React.lazy(() => import('../components/calculators/ConcreteVolumeCalculator'))
      },
      {
        id: 'brick',
        title: 'Калькулятор кирпича',
        description: 'Расчёт количества кирпича, газоблока, раствора и стоимости стены с учётом проёмов и толщины кладки',
        category: 'construction',
        icon: 'Layers',
        component: React.lazy(() => import('../components/calculators/BrickCalculator'))
      },
      {
        id: 'wallpaper',
        title: 'Калькулятор обоев',
        description: 'Расчёт количества рулонов обоев с учётом периметра комнаты, высоты потолка, рапорта и проёмов',
        category: 'construction',
        icon: 'Square',
        component: React.lazy(() => import('../components/calculators/WallpaperCalculator'))
      },
      {
        id: 'flooring',
        title: 'Калькулятор напольного покрытия',
        description: 'Расчёт ламината, паркета, плитки, линолеума и винила с подложкой, плинтусом и запасом на укладку',
        category: 'construction',
        icon: 'Grid3x3',
        component: React.lazy(() => import('../components/calculators/FlooringCalculator'))
      },
      {
        id: 'insulation',
        title: 'Калькулятор утепления дома',
        description: 'Расчёт толщины утеплителя, материала и экономии на отоплении: минвата, пеноплекс, PIR — для всех регионов Казахстана',
        category: 'construction',
        icon: 'Thermometer',
        component: React.lazy(() => import('../components/calculators/InsulationCalculator'))
      }
    ]
  },
  {
    id: 'utilities',
    title: 'Коммунальные услуги',
    description: 'Расчет счетов за электричество, воду, газ и отопление',
    icon: 'Zap',
    calculators: [
      {
        id: 'electricity',
        title: 'Счет за электроэнергию',
        description: 'Расчет платы за потребленную электроэнергию',
        category: 'utilities',
        icon: 'Zap',
        component: React.lazy(() => import('../components/calculators/ElectricityBillCalculator'))
      },
      {
        id: 'water',
        title: 'Водоснабжение и канализация',
        description: 'Расчет платы за холодную воду и канализацию по дифференцированным тарифам',
        category: 'utilities',
        icon: 'Droplets',
        component: React.lazy(() => import('../components/calculators/WaterBillCalculator'))
      },
      {
        id: 'heating',
        title: 'Центральное отопление',
        description: 'Расчет платы за центральное отопление',
        category: 'utilities',
        icon: 'Thermometer',
        component: React.lazy(() => import('../components/calculators/HeatingBillCalculator'))
      },
      {
        id: 'gas',
        title: 'Природный газ',
        description: 'Расчет платы за потребление природного газа',
        category: 'utilities',
        icon: 'Flame',
        component: React.lazy(() => import('../components/calculators/GasBillCalculator'))
      }
    ]
  },
  {
    id: 'converters',
    title: 'Конвертеры и преобразователи',
    description: 'Конвертация валют, времени и преобразование чисел в текст',
    icon: 'RefreshCw',
    calculators: [
      {
        id: 'currency-converter',
        title: 'Универсальный конвертер валют',
        description: 'Конвертация валют с актуальными и историческими курсами',
        category: 'converters',
        icon: 'DollarSign',
        component: React.lazy(() => import('../components/calculators/CurrencyConverter'))
      },
      {
        id: 'time-converter',
        title: 'Конвертация единиц времени',
        description: 'Преобразование между днями, неделями, месяцами, годами и другими единицами времени',
        category: 'converters',
        icon: 'Clock',
        component: React.lazy(() => import('../components/calculators/TimeConverter'))
      },
      {
        id: 'number-to-words',
        title: 'Калькулятор записи чисел прописью',
        description: 'Преобразование цифр в текстовое представление на русском, казахском и английском языках',
        category: 'converters',
        icon: 'Type',
        component: React.lazy(() => import('../components/calculators/NumberToWordsCalculator'))
      },
      {
        id: 'time-to-words',
        title: 'Калькулятор преобразования времени прописью',
        description: 'Преобразование времени в текстовое представление на разных языках',
        category: 'converters',
        icon: 'Clock',
        component: React.lazy(() => import('../components/calculators/TimeToWordsCalculator'))
      },
      {
        id: 'age',
        title: 'Калькулятор точного возраста',
        description: 'Точный возраст в годах, месяцах, днях, часах + дни до пенсии РК',
        category: 'converters',
        icon: 'Cake',
        component: React.lazy(() => import('../components/calculators/AgeCalculator'))
      },
      {
        id: 'pet-age',
        title: 'Возраст кошки или собаки',
        description: 'Перевод возраста питомца в человеческие годы с учётом размера породы',
        category: 'converters',
        icon: 'Heart',
        component: React.lazy(() => import('../components/calculators/PetAgeCalculator'))
      },
      {
        id: 'roman-numerals',
        title: 'Конвертер арабских и римских чисел',
        description: 'Преобразование арабских чисел в римские и обратно (от 1 до 3999)',
        category: 'converters',
        icon: 'Hash',
        component: React.lazy(() => import('../components/calculators/RomanNumeralsCalculator'))
      },
      {
        id: 'unit-converter',
        title: 'Универсальный конвертер единиц',
        description: 'Конвертер длины, веса, объёма, температуры, площади и скорости',
        category: 'converters',
        icon: 'ArrowLeftRight',
        component: React.lazy(() => import('../components/calculators/UnitConverterCalculator'))
      },
      {
        id: 'timezone',
        title: 'Калькулятор часовых поясов',
        description: 'Сравнение времени в 18 городах мира с Казахстаном (UTC+5)',
        category: 'converters',
        icon: 'Globe',
        component: React.lazy(() => import('../components/calculators/TimezoneCalculator'))
      },
      {
        id: 'password-generator',
        title: 'Генератор паролей',
        description: 'Создание надёжных паролей с настройкой длины и категорий символов',
        category: 'converters',
        icon: 'Key',
        component: React.lazy(() => import('../components/calculators/PasswordGeneratorCalculator'))
      },
      {
        id: 'qr-code-generator',
        title: 'Генератор QR-кодов',
        description: 'Создание QR-кодов офлайн в браузере: ссылки, телефоны, Wi-Fi, vCard',
        category: 'converters',
        icon: 'QrCode',
        component: React.lazy(() => import('../components/calculators/QRCodeGeneratorCalculator'))
      }
    ]
  },
  {
    id: 'religious',
    title: 'Религиозные калькуляторы',
    description: 'Расчеты в соответствии с религиозными требованиями и традициями',
    icon: 'Heart',
    calculators: [
      {
        id: 'zakat',
        title: 'Калькулятор закята',
        description: 'Расчет обязательного исламского налога в пользу нуждающихся',
        category: 'religious',
        icon: 'Heart',
        component: React.lazy(() => import('../components/calculators/ZakatCalculator'))
      },
      {
        id: 'kurban-sacrifice',
        title: 'Калькулятор стоимости жертвоприношения (Курбан-айт)',
        description: 'Планирование бюджета на жертвенное животное в праздник Курбан-айт',
        category: 'religious',
        icon: 'Crown',
        component: React.lazy(() => import('../components/calculators/KurbanCalculator'))
      }
      ,
      {
        id: 'ramadan-sadaqah',
        title: 'Калькулятор Фитр-садака и Фидия-садака',
        description: 'Расчет религиозных пожертвований в священный месяц Рамадан',
        category: 'religious',
        icon: 'Moon',
        component: React.lazy(() => import('../components/calculators/RamadanSadaqahCalculator'))
      },
      {
        id: 'islamic-inheritance',
        title: 'Калькулятор исламского наследства (Фараиз)',
        description: 'Предварительный расчет долей наследников согласно исламскому праву',
        category: 'religious',
        icon: 'Scale',
        component: React.lazy(() => import('../components/calculators/IslamicInheritanceCalculator'))
      },
      {
        id: 'hajj',
        title: 'Калькулятор стоимости Хаджа и Умры',
        description: 'Расчёт расходов: 3 пакета (эконом / стандарт / люкс), визы, страховка, курбан в Мекке',
        category: 'religious',
        icon: 'MapPin',
        component: React.lazy(() => import('../components/calculators/HajjCalculator'))
      },
      {
        id: 'islamic-mortgage',
        title: 'Калькулятор исламской ипотеки',
        description: 'Мурабаха и иджара: халяльные программы Al Hilal Bank, Заман Банк, Сауле Капитал',
        category: 'religious',
        icon: 'Home',
        component: React.lazy(() => import('../components/calculators/IslamicMortgageCalculator'))
      }
    ]
  },
  {
    id: 'math',
    title: 'Математические калькуляторы',
    description: 'Универсальные инструменты для математических и процентных расчетов',
    icon: 'Calculator',
    calculators: [
      {
        id: 'discount',
        title: 'Калькулятор скидок',
        description: 'Расчет скидок, каскадных предложений и сравнение вариантов экономии',
        category: 'math',
        icon: 'ShoppingBag',
        component: React.lazy(() => import('../components/calculators/DiscountCalculator'))
      },
      {
        id: 'percentage',
        title: 'Процентный калькулятор',
        description: 'Все виды процентных расчетов: процент от числа, изменение, обратный расчет',
        category: 'math',
        icon: 'Percent',
        component: React.lazy(() => import('../components/calculators/PercentageCalculator'))
      },
      {
        id: 'leap-year',
        title: 'Калькулятор високосного года',
        description: 'Определение високосных лет, анализ диапазонов и историческая информация',
        category: 'math',
        icon: 'Calendar',
        component: React.lazy(() => import('../components/calculators/LeapYearCalculator'))
      },
      {
        id: 'date-calculator',
        title: 'Калькулятор добавления/вычитания дат',
        description: 'Точный расчет дат с добавлением/вычитанием периодов времени',
        category: 'math',
        icon: 'CalendarDays',
        component: React.lazy(() => import('../components/calculators/DateCalculator'))
      }
    ]
  },
  {
    id: 'health',
    title: 'Здоровье и медицина',
    description: 'Калькуляторы для расчета показателей здоровья и медицинских параметров',
    icon: 'Heart',
    calculators: [
      {
        id: 'bmi',
        title: 'Индекс массы тела (ИМТ)',
        description: 'Расчет индекса массы тела и рекомендации',
        category: 'health',
        icon: 'Activity',
        component: React.lazy(() => import('../components/calculators/BMICalculator'))
      },
      {
        id: 'calories',
        title: 'Суточная норма калорий',
        description: 'Расчет дневной нормы калорий и макронутриентов',
        category: 'health',
        icon: 'Apple',
        component: React.lazy(() => import('../components/calculators/CaloriesCalculator'))
      },
      {
        id: 'pregnancy',
        title: 'Калькулятор беременности',
        description: 'Расчет срока беременности и предполагаемой даты родов',
        category: 'health',
        icon: 'Baby',
        component: React.lazy(() => import('../components/calculators/PregnancyCalculator'))
      },
      {
        id: 'body-fat',
        title: 'Калькулятор процента жира',
        description: 'Расчет процента жира в организме по формуле U.S. Navy',
        category: 'health',
        icon: 'Activity',
        component: React.lazy(() => import('../components/calculators/BodyFatCalculator'))
      },
      {
        id: 'sleep',
        title: 'Калькулятор сна',
        description: 'Циклы сна и оптимальное время отхода ко сну и пробуждения',
        category: 'health',
        icon: 'Moon',
        component: React.lazy(() => import('../components/calculators/SleepCalculator'))
      },
      {
        id: 'water-intake',
        title: 'Калькулятор нормы воды',
        description: 'Суточная норма потребления воды с учётом активности и климата',
        category: 'health',
        icon: 'Droplets',
        component: React.lazy(() => import('../components/calculators/WaterIntakeCalculator'))
      }
    ]
  },
  {
    id: 'education',
    title: 'Образование',
    description: 'Калькуляторы для абитуриентов и студентов',
    icon: 'GraduationCap',
    calculators: [
      {
        id: 'ent-score',
        title: 'Калькулятор баллов ЕНТ',
        description: 'Расчёт суммарного балла ЕНТ и шансы на грант в КазНУ, NU, Сатпаева, ЕНУ, KIMEP',
        category: 'education',
        icon: 'GraduationCap',
        component: React.lazy(() => import('../components/calculators/ENTScoreCalculator'))
      },
      {
        id: 'gpa',
        title: 'Калькулятор GPA',
        description: 'Конвертация казахстанской 100-балльной шкалы в GPA США 4.0 / ECTS / РФ / UK',
        category: 'education',
        icon: 'Award',
        component: React.lazy(() => import('../components/calculators/GPACalculator'))
      }
    ]
  },
  {
    id: 'real-estate',
    title: 'Недвижимость',
    description: 'Оценка квартир, аренды и стоимости жизни',
    icon: 'Building2',
    calculators: [
      {
        id: 'fair-rental-price',
        title: 'Справедливая цена аренды квартиры',
        description: 'Рассчёт справедливой месячной и посуточной аренды для 7 городов РК',
        category: 'real-estate',
        icon: 'Key',
        component: React.lazy(() => import('../components/calculators/FairRentalPriceCalculator'))
      },
      {
        id: 'apartment-valuation',
        title: 'Оценка стоимости квартиры',
        description: 'Оценка квартиры по 7 городам РК с учётом материала, года и ремонта',
        category: 'real-estate',
        icon: 'Home',
        component: React.lazy(() => import('../components/calculators/ApartmentValuationCalculator'))
      },
      {
        id: 'cost-of-living',
        title: 'Калькулятор стоимости жизни',
        description: 'Сравнение стоимости жизни в 10 городах Казахстана',
        category: 'real-estate',
        icon: 'MapPin',
        component: React.lazy(() => import('../components/calculators/CostOfLivingCalculator'))
      }
    ]
  }
];