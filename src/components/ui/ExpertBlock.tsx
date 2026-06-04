import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { calculatorCategories } from '../../data/calculators';
import { stripLocalePrefix } from '../../utils/localizedRouting';

// Категории, где финансово-кредитная экспертиза действительно релевантна.
// На медицинских/образовательных/бытовых калькуляторах финансовый эксперт
// подрывает доверие (E-E-A-T), поэтому блок там не показывается.
const RELEVANT_CATEGORIES = new Set(['finance', 'tax', 'social', 'real-estate', 'legal']);

export function ExpertBlock() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();

  const match = stripLocalePrefix(pathname).match(/\/(?:calculator|embed)\/([^/]+)/);
  const calcId = match?.[1];
  const category = calcId
    ? calculatorCategories.find(c => c.calculators.some(cc => cc.id === calcId))
    : undefined;

  if (!category || !RELEVANT_CATEGORIES.has(category.id)) {
    return null;
  }

  const isKazakh = i18n.language === 'kk';

  const title = isKazakh ? 'Сарапшы қатысуы' : 'Экспертное участие';
  const text = isKazakh
    ? 'Калькуляторларды жасауға қатысқан'
    : 'В создании калькуляторов принимал участие';
  const name = 'Арнур Еркенбаев';
  const role = isKazakh
    ? 'қаржы және несиелеу сарапшысы, портал'
    : 'эксперт по финансам и кредитованию портала';
  const portal = 'Zanimaem.kz';
  const note = isKazakh
    ? 'Оның тәжірибесінің арқасында барлық есептеу формулалары мен ұсыныстар Қазақстан банк секторының нақты тәжірибесіне сәйкес келеді.'
    : 'Благодаря его экспертизе все формулы расчетов и рекомендации соответствуют реальной практике банковского сектора Казахстана.';

  return (
    <div className="mt-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start space-x-4">
        <picture>
          <source
            type="image/avif"
            srcSet="/img/experts/arnur-erkenbaev-96.avif 2x, /img/experts/arnur-erkenbaev-144.avif 3x"
          />
          <source
            type="image/webp"
            srcSet="/img/experts/arnur-erkenbaev-96.webp 2x, /img/experts/arnur-erkenbaev-144.webp 3x"
          />
          <img
            src="/img/experts/arnur-erkenbaev-96.jpg"
            alt={name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {text} <strong>{name}</strong> — {role} <strong>{portal}</strong>. {note}
          </p>
        </div>
      </div>
    </div>
  );
}
