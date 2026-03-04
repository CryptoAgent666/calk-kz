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
        title: 'Калькулятор ИПН для наемных работников',
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
        id: 'esp-self-employed',
        title: 'Калькулятор ЕСП для самозанятых',
        description: 'Расчет единого совокупного платежа для физических лиц, оказывающих услуги',
        category: 'tax',
        icon: 'UserCheck',
        component: React.lazy(() => import('../components/calculators/ESPSelfEmployedCalculator'))
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
      }
    ]
  }
];