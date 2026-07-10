import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Бейдж актуальности данных под хлебными крошками каждого калькулятора
 * (паттерн Отбасы: «актуально на дату»). E-E-A-T-сигнал: контраст с
 * гос-калькуляторами, живущими на МРП прошлых лет.
 *
 * ⚠️ Rollover: при смене года/МРП/МЗП обновить константы ниже разом с
 * калькуляторами (см. скилл calk-constants-check). Значения дублируют
 * реестр regulatory-constants.canonical.json (mrp_value, mzp_value).
 */
const DATA_YEAR = 2026;
const MRP_2026 = 4325;
const MZP_2026 = 85000;

/** Категории, где МРП/МЗП — основа расчётов; остальным только «актуально на год». */
const MRP_CATEGORIES = new Set(['tax', 'auto', 'social', 'legal', 'agriculture']);

interface DataFreshnessBadgeProps {
  categoryId?: string;
}

export function DataFreshnessBadge({ categoryId }: DataFreshnessBadgeProps) {
  const { i18n } = useTranslation();
  const kk = i18n.language === 'kk';
  const showConstants = categoryId ? MRP_CATEGORIES.has(categoryId) : false;
  const fmt = (n: number) => n.toLocaleString('ru-KZ');

  return (
    <div className="mb-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0" />
        {kk ? `Деректер ${DATA_YEAR} жылға өзекті` : `Данные актуальны на ${DATA_YEAR} год`}
      </span>
      {showConstants && (
        <>
          <span className="text-emerald-300" aria-hidden="true">•</span>
          <span>{kk ? 'АЕК' : 'МРП'} {fmt(MRP_2026)} ₸</span>
          <span className="text-emerald-300" aria-hidden="true">•</span>
          <span>{kk ? 'ЕТЖ' : 'МЗП'} {fmt(MZP_2026)} ₸</span>
        </>
      )}
    </div>
  );
}
