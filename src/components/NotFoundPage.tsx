import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, Search, Calculator, ArrowLeft, Sparkles } from 'lucide-react';
import LocalizedLink from './LocalizedLink';
import { useSEO } from '../hooks/useSEO';
import { pluralize } from '../utils/pluralize';
import { calculatorCategories } from '../data/calculators';
import { getIcon } from '../utils/iconMap';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

export default function NotFoundPage({ onNavigateHome: _onNavigateHome }: NotFoundPageProps) {
  const { t, i18n } = useTranslation(['common', 'categories']);
  const [isVisible, setIsVisible] = useState(false);

  useSEO({
    title: t('common:notFound.seoTitle'),
    description: t('common:notFound.seoDescription'),
    url: 'https://calk.kz/404'
  });

  useEffect(() => {
    const metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (metaRobots) {
      metaRobots.content = 'noindex, nofollow';
    }
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    return () => {
      if (metaRobots) {
        metaRobots.content = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
      }
    };
  }, []);

  return (
    <div className={`min-h-[70vh] flex flex-col items-center justify-center px-4 py-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        {/* Animated 404 Badge */}
        <div className="relative inline-block mb-8">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur-2xl opacity-20 scale-110 animate-pulse" />

          {/* Main 404 container */}
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 sm:p-10 shadow-2xl">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Calculator className="w-6 h-6 text-blue-200" />
              <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
            </div>
            <span className="text-7xl sm:text-8xl font-black text-white tracking-tight drop-shadow-lg">
              404
            </span>
            <div className="mt-3 text-blue-200 text-sm font-medium tracking-widest uppercase">
              {t('common:notFound.title', 'Страница не найдена')}
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-lg sm:text-xl text-gray-600 mb-2 leading-relaxed">
          {t('common:notFound.message', 'К сожалению, запрашиваемая страница не существует или была перемещена.')}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Проверьте адрес или воспользуйтесь навигацией ниже
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <LocalizedLink
            to="/"
            className="group inline-flex items-center justify-center space-x-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{t('common:notFound.backToHome', 'На главную')}</span>
          </LocalizedLink>

          <button
            onClick={() => window.history.back()}
            className="group inline-flex items-center justify-center space-x-2 px-7 py-3.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Назад</span>
          </button>
        </div>
      </div>

      {/* Popular Categories */}
      <div className={`w-full max-w-3xl mx-auto transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>{t('common:notFound.popularSections', 'Популярные разделы')}</span>
          </h2>
          <p className="text-sm text-gray-500 mb-5">Выберите нужный раздел калькуляторов</p>

          <div className="grid sm:grid-cols-2 gap-3">
            {calculatorCategories.slice(0, 6).map((category) => {
              const IconComponent = getIcon(category.icon);
              return (
                <LocalizedLink
                  key={category.id}
                  to={`/category/${category.id}/`}
                  className="group flex items-center space-x-3 p-3.5 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 hover:from-blue-50 hover:to-indigo-50 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md shadow-blue-500/20">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors truncate">
                      {t(`categories:${category.id}.title`)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.calculators.length} {pluralize(i18n.language, category.calculators.length, t('common:footer.calculators'), t('common:footer.calculatorsFew'), t('common:footer.calculatorsPlural'))}
                    </div>
                  </div>
                </LocalizedLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
