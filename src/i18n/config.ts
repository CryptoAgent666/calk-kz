import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common', 'categories', 'calculators', 'legal', 'seo'],

    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
