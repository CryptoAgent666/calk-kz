import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonRu from './locales/ru/common.json';
import categoriesRu from './locales/ru/categories.json';
import calculatorsRu from './locales/ru/calculators.json';
import legalRu from './locales/ru/legal.json';
import seoRu from './locales/ru/seo.json';

import commonKk from './locales/kk/common.json';
import categoriesKk from './locales/kk/categories.json';
import calculatorsKk from './locales/kk/calculators.json';
import legalKk from './locales/kk/legal.json';
import seoKk from './locales/kk/seo.json';

const resources = {
  ru: {
    common: commonRu,
    categories: categoriesRu,
    calculators: calculatorsRu,
    legal: legalRu,
    seo: seoRu,
  },
  kk: {
    common: commonKk,
    categories: categoriesKk,
    calculators: calculatorsKk,
    legal: legalKk,
    seo: seoKk,
  },
};

// Определяем начальный язык СТРОГО из URL (path /__kk/ или ?lang=kk).
// Это критично для гидратации: SSR-пререндер (puppeteer) и клиент должны
// получать ОДИНАКОВЫЙ initial lang. navigator.language + localStorage
// (старый LanguageDetector) давали разные значения для разных пользователей
// → React hydration errors #418/423/425 (по ~20 на странице).
function detectInitialLang(): 'ru' | 'kk' {
  if (typeof window === 'undefined') return 'ru';
  const path = window.location.pathname;
  const search = window.location.search;
  if (path === '/__kk' || path.startsWith('/__kk/')) return 'kk';
  if (new URLSearchParams(search).get('lang') === 'kk') return 'kk';
  return 'ru';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLang(),
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common', 'categories', 'calculators', 'legal', 'seo'],

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
