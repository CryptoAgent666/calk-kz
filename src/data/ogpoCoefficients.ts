/**
 * Коэффициенты ОГПО ВТС — единый справочник для InsuranceCalculator и
 * CarTransferCalculator.
 *
 * Первоисточник: Закон РК от 01.07.2003 № 446-II «Об обязательном страховании
 * гражданско-правовой ответственности владельцев транспортных средств»,
 * статья 19 (adilet.zan.kz/rus/docs/Z030000446_).
 *
 * Годовая премия (ст. 19 п. 1) = базовая премия 1,9 МРП (п. 2), к которой
 * применяются коэффициенты пунктов 3–10. Территориальная часть — ДВА
 * сомножителя, а не один:
 *   п. 3   — коэффициент по территории регистрации ТС (таблица в самом Законе:
 *            от 1,00 по Жамбылской области до 2,96 по Алматы);
 *   п. 3-1 — поправочный коэффициент, который «дополнительно применяется»
 *            к коэффициенту п. 3; рассчитывается по убыточности региона и
 *            ежегодно утверждается АРРФР (пост. Правления № 72 от 13.11.2025,
 *            действует с 01.01.2026; диапазон 0,48–1,85).
 *
 * До 09.2026 калькуляторы умножали базу ТОЛЬКО на поправочный коэффициент —
 * премия занижалась в 1–3 раза, а порядок регионов инвертировался (Алматы
 * 0,71 выглядел самым дешёвым регионом вместо одного из самых дорогих).
 * Дефект зафиксирован Tier-2 23.08.2026 в реестре (ogpo_territory_coeff).
 * Сверка эффективных значений с рынком: страховщик «Халык» называет для
 * Алматы 2,31 (≈2,96 × поправочный своего года), finratings.kz считает
 * пример «Алматы, класс 3, опытный водитель» ≈ 35 200 ₸ — это порядок
 * величины двухфакторной модели, а не однофакторной (≈12 200 ₸).
 */

export interface OgpoRegion {
  id: string;
  /** Ключ i18n в неймспейсе calculators, общий для всех калькуляторов ОГПО. */
  labelKey: string;
  /** Коэффициент по территории регистрации — ст. 19 п. 3 Закона № 446-II. */
  registrationCoeff: number;
  /** Поправочный коэффициент — ст. 19 п. 3-1; пост. Правления АРРФР № 72 от 13.11.2025. */
  correctionCoeff: number;
  /**
   * Столица / город республиканского значения: для них коэффициент
   * корректировки п. 4 (0,8 для иных населённых пунктов области) неприменим.
   */
  isCity?: boolean;
}

/** Базовая страховая премия — ст. 19 п. 2 Закона № 446-II. */
export const OGPO_BASE_PREMIUM_MRP = 1.9;

/**
 * Коэффициент корректировки для иных городов и населённых пунктов области —
 * ст. 19 п. 4. Таблица п. 3 задана «для столицы, городов республиканского и
 * областного значения»; для остальных населённых пунктов области премия
 * дополнительно умножается на 0,8.
 */
export const OGPO_OTHER_SETTLEMENT_COEFF = 0.8;

/** Коэффициент по сроку эксплуатации свыше 7 лет — ст. 19 п. 9. */
export const OGPO_EXPLOITATION_OVER_7Y_COEFF = 1.1;

/** Порог срока эксплуатации: «до 7 лет включительно» — коэффициент 1,00. */
export const OGPO_EXPLOITATION_THRESHOLD_YEARS = 7;

/** Коэффициент возраста/стажа для юридических лиц — ст. 19 п. 8. */
export const OGPO_LEGAL_ENTITY_COEFF = 1.2;

/**
 * Регионы с обоими территориальными коэффициентами.
 * Порядок — по убыванию произведения (от самого дорогого региона к дешёвому).
 */
export const OGPO_REGIONS: OgpoRegion[] = [
  { id: 'astana-city', labelKey: 'insurance-premium.regions.astanaCity', registrationCoeff: 2.20, correctionCoeff: 1.44, isCity: true },
  { id: 'almaty-region', labelKey: 'insurance-premium.regions.almatyRegion', registrationCoeff: 1.78, correctionCoeff: 1.44 },
  { id: 'zhetysu-region', labelKey: 'insurance-premium.regions.zhetysuRegion', registrationCoeff: 1.78, correctionCoeff: 1.20 },
  { id: 'kostanay-region', labelKey: 'insurance-premium.regions.kostanayRegion', registrationCoeff: 1.95, correctionCoeff: 1.11 },
  { id: 'almaty-city', labelKey: 'insurance-premium.regions.almatyCity', registrationCoeff: 2.96, correctionCoeff: 0.71, isCity: true },
  { id: 'kyzylorda-region', labelKey: 'insurance-premium.regions.kyzylordaRegion', registrationCoeff: 1.09, correctionCoeff: 1.85 },
  { id: 'zhambyl-region', labelKey: 'insurance-premium.regions.zhambylRegion', registrationCoeff: 1.00, correctionCoeff: 1.74 },
  { id: 'turkestan-region', labelKey: 'insurance-premium.regions.turkestanRegion', registrationCoeff: 1.01, correctionCoeff: 1.69 },
  { id: 'karaganda-region', labelKey: 'insurance-premium.regions.karagandaRegion', registrationCoeff: 1.39, correctionCoeff: 1.18 },
  { id: 'shymkent-city', labelKey: 'insurance-premium.regions.shymkentCity', registrationCoeff: 1.01, correctionCoeff: 1.61, isCity: true },
  { id: 'abay-region', labelKey: 'insurance-premium.regions.abayRegion', registrationCoeff: 1.96, correctionCoeff: 0.80 },
  { id: 'akmola-region', labelKey: 'insurance-premium.regions.akmolaRegion', registrationCoeff: 1.32, correctionCoeff: 1.08 },
  { id: 'east-kazakhstan', labelKey: 'insurance-premium.regions.eastKazakhstan', registrationCoeff: 1.96, correctionCoeff: 0.72 },
  { id: 'west-kazakhstan', labelKey: 'insurance-premium.regions.westKazakhstan', registrationCoeff: 1.17, correctionCoeff: 1.19 },
  { id: 'ulytau-region', labelKey: 'insurance-premium.regions.ulytauRegion', registrationCoeff: 1.39, correctionCoeff: 0.99 },
  { id: 'aktobe-region', labelKey: 'insurance-premium.regions.aktobeRegion', registrationCoeff: 1.35, correctionCoeff: 1.02 },
  { id: 'pavlodar-region', labelKey: 'insurance-premium.regions.pavlodarRegion', registrationCoeff: 1.63, correctionCoeff: 0.82 },
  { id: 'atyrau-region', labelKey: 'insurance-premium.regions.atyrauRegion', registrationCoeff: 2.69, correctionCoeff: 0.48 },
  { id: 'mangystau-region', labelKey: 'insurance-premium.regions.mangystauRegion', registrationCoeff: 1.15, correctionCoeff: 0.79 },
  { id: 'north-kazakhstan', labelKey: 'insurance-premium.regions.northKazakhstan', registrationCoeff: 1.33, correctionCoeff: 0.67 },
];

/** Округление до 4 знаков: 2,96 × 0,71 в double даёт хвост, а он лезет в разметку. */
const round4 = (value: number) => Math.round(value * 10000) / 10000;

/** Итоговый территориальный множитель: п. 3 × п. 3-1. */
export const ogpoTerritoryCoeff = (region: OgpoRegion) =>
  round4(region.registrationCoeff * region.correctionCoeff);

export const findOgpoRegion = (id: string) => OGPO_REGIONS.find((r) => r.id === id);

export interface OgpoVehicleType {
  id: string;
  labelKey: string;
  coefficient: number;
}

/**
 * Коэффициенты по типу ТС — ст. 19 п. 6 Закона № 446-II (не акт АРРФР:
 * в пост. Правления № 72 их нет, там только 20 строк поправочных
 * коэффициентов). Градация задана Законом:
 *  — «В» — полная масса ≤ 3500 кг и ≤ 8 сидячих мест помимо водителя → 2,09;
 *  — автобусы до 16 пассажирских мест включительно → 3,26, свыше 16 → 3,45;
 *  — «С» — грузовые полной массой СВЫШЕ 3500 кг → 3,98;
 *  — троллейбусы, трамваи → 2,33; мототранспорт «А» → 1,00; прицепы «Е» → 1,00.
 * Отдельной строки «такси» в Законе нет: легковое такси идёт по 2,09, а п. 1
 * ч. 2 ст. 19 прямо запрещает надбавки по не предусмотренным Законом основаниям.
 */
export const OGPO_VEHICLE_TYPES: OgpoVehicleType[] = [
  { id: 'passenger-car', labelKey: 'insurance-premium.vehicleTypes.passengerCar', coefficient: 2.09 },
  { id: 'taxi', labelKey: 'insurance-premium.vehicleTypes.taxi', coefficient: 2.09 },
  { id: 'light-truck', labelKey: 'insurance-premium.vehicleTypes.lightTruckUpTo35t', coefficient: 2.09 },
  { id: 'truck', labelKey: 'insurance-premium.vehicleTypes.truckOver35t', coefficient: 3.98 },
  { id: 'bus-up-to-16', labelKey: 'insurance-premium.vehicleTypes.busUpTo16', coefficient: 3.26 },
  { id: 'bus-over-16', labelKey: 'insurance-premium.vehicleTypes.busOver16', coefficient: 3.45 },
  { id: 'trolleybus-tram', labelKey: 'insurance-premium.vehicleTypes.trolleybusTram', coefficient: 2.33 },
  { id: 'motorcycle', labelKey: 'insurance-premium.vehicleTypes.motorcycle', coefficient: 1.0 },
  { id: 'trailer', labelKey: 'insurance-premium.vehicleTypes.trailer', coefficient: 1.0 },
];

/**
 * Комбинированный коэффициент возраста и стажа — ст. 19 п. 7. В Законе это
 * ОДНА таблица из четырёх строк, а не два независимых множителя.
 */
export const ogpoAgeExperienceCoeff = (age: number, experience: number) => {
  if (age < 25) return experience < 2 ? 1.1 : 1.05;
  return experience < 2 ? 1.05 : 1.0;
};
