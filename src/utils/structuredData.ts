import { calculatorCategories } from '../data/calculators';
import i18n from '../i18n/config';
import { localizeUrl } from './localizedRouting';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataOptions {
  type: 'website' | 'calculator' | 'category' | 'organization';
  title?: string;
  description?: string;
  url?: string;
  language?: string;
  calculatorId?: string;
  categoryId?: string;
  breadcrumbs?: BreadcrumbItem[];
}

// Фиксированная дата последнего обновления контента (обновлять при деплое)
const LAST_CONTENT_UPDATE = '2026-03-24';

export function generateStructuredData(options: StructuredDataOptions): string {
  const baseUrl = 'https://calk.kz';
  const baseUrlWithSlash = `${baseUrl}/`;
  const currentLang = options.language || i18n.language || 'ru';
  const language = currentLang === 'kk' ? 'kk-KZ' : 'ru-RU';
  const addTrailingSlash = (url: string) => {
    const [base, query] = url.split('?');
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return query ? `${normalizedBase}?${query}` : normalizedBase;
  };
  const buildUrl = (path: string) => localizeUrl(addTrailingSlash(`${baseUrl}${path}`), currentLang, baseUrl);
  const homeUrl = buildUrl('/');
  const homeLabel = currentLang === 'kk' ? 'Басты бет' : 'Главная';
  const siteName = currentLang === 'kk'
    ? 'Calk.kz — Қазақстан үшін калькуляторлар'
    : 'Calk.kz - Калькуляторы для Казахстана';
  const siteDescription = i18n.t('home.description', {
    ns: 'seo',
    lng: currentLang,
    defaultValue: 'Удобные онлайн-калькуляторы для жителей Казахстана'
  });

  // Organization + Person (site-wide entity data)
  const organizationEntity = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Calk.kz',
    url: baseUrlWithSlash,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/calculator-favicon.svg`,
      width: 512,
      height: 512
    },
    description: siteDescription,
    foundingDate: '2024-01-01',
    founder: { '@id': `${baseUrl}/#konstantin-yakovlev` },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'info@calk.kz',
      availableLanguage: ['Russian', 'Kazakh']
    },
    sameAs: [
      'https://play.google.com/store/apps/details?id=calk.kz',
      'https://zanimaem.kz',
      'https://profinance.kz'
    ]
  };

  const personEntity = {
    '@type': 'Person',
    '@id': `${baseUrl}/#konstantin-yakovlev`,
    name: 'Константин Яковлев',
    jobTitle: 'Основатель',
    description: 'Основатель Calk.kz, Zanimaem.kz и Profinance.kz. Более 14 лет в маркетинге, свыше 8 лет в финансовой аналитике.',
    image: 'https://profinance.kz/img/team/konstantin.jpg',
    url: `${baseUrl}/legal/about/`,
    worksFor: { '@id': `${baseUrl}/#organization` },
    sameAs: [
      'https://zanimaem.kz',
      'https://profinance.kz'
    ],
    knowsAbout: ['Finance', 'Taxation in Kazakhstan', 'Banking', 'Fintech']
  };

  if (options.type === 'organization') {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [organizationEntity, personEntity]
    });
  }

  if (options.type === 'website') {
    const websiteUrl = options.url ? addTrailingSlash(options.url) : buildUrl('/');
    const searchUrl = currentLang === 'kk'
      ? `${baseUrl}/__kk/?q={search_term_string}`
      : `${baseUrl}/?q={search_term_string}`;

    // Homepage: WebSite + Organization + Person + ItemList
    const websiteEntity = {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      name: siteName,
      url: websiteUrl,
      description: options.description || siteDescription,
      inLanguage: language,
      publisher: { '@id': `${baseUrl}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: searchUrl
        },
        'query-input': 'required name=search_term_string'
      }
    };

    // ItemList of all categories for homepage
    const categoryItems = calculatorCategories.map((cat, index) => {
      const catTitle = i18n.t(`${cat.id}.title`, {
        ns: 'categories',
        lng: currentLang,
        defaultValue: cat.title
      });
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: catTitle,
        url: buildUrl(`/category/${cat.id}`)
      };
    });

    const itemListEntity = {
      '@type': 'ItemList',
      name: currentLang === 'kk' ? 'Калькулятор санаттары' : 'Категории калькуляторов',
      numberOfItems: calculatorCategories.length,
      itemListElement: categoryItems
    };

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [websiteEntity, organizationEntity, personEntity, itemListEntity]
    });
  }

  if (options.type === 'calculator' && options.calculatorId) {
    let calculator = null;
    let category = null;

    for (const cat of calculatorCategories) {
      const found = cat.calculators.find(calc => calc.id === options.calculatorId);
      if (found) {
        calculator = found;
        category = cat;
        break;
      }
    }

    if (!calculator || !category) {
      return '';
    }

    const calculatorUrl = options.url
      ? addTrailingSlash(options.url)
      : buildUrl(`/calculator/${options.calculatorId}`);
    const calculatorTitle = i18n.t(`${calculator.id}.title`, {
      ns: 'calculators',
      lng: currentLang,
      defaultValue: calculator.title
    });
    const calculatorDescription = i18n.t(`${calculator.id}.description`, {
      ns: 'calculators',
      lng: currentLang,
      defaultValue: calculator.description
    });
    const categoryTitle = i18n.t(`${category.id}.title`, {
      ns: 'categories',
      lng: currentLang,
      defaultValue: category.title
    });

    const calculatorTranslationEntriesRaw = i18n.t(calculator.id, {
      ns: 'calculators',
      lng: currentLang,
      returnObjects: true,
      defaultValue: {}
    });
    const calculatorTranslationEntries =
      typeof calculatorTranslationEntriesRaw === 'object' && calculatorTranslationEntriesRaw && !Array.isArray(calculatorTranslationEntriesRaw)
        ? (calculatorTranslationEntriesRaw as Record<string, any>)
        : {};
    const faqEntries =
      typeof calculatorTranslationEntries.faq === 'object' && calculatorTranslationEntries.faq && !Array.isArray(calculatorTranslationEntries.faq)
        ? (calculatorTranslationEntries.faq as Record<string, string>)
        : {};
    const faqItemsFromObject = Object.keys(faqEntries)
      .map((key) => {
        const match = key.match(/^q(\d+)$/);
        if (!match) {
          return null;
        }
        const index = Number(match[1]);
        const question = faqEntries[key];
        const answer = faqEntries[`a${match[1]}`];
        if (!question || !answer) {
          return null;
        }
        return { index, question, answer };
      })
      .filter((item): item is { index: number; question: string; answer: string } => Boolean(item))
      .sort((a, b) => a.index - b.index)
      .map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }));

    const faqItemsFromLegacy = Object.keys(calculatorTranslationEntries)
      .map((key) => {
        const match = key.match(/^faqQ(\d+)$/);
        if (!match) {
          return null;
        }
        const index = Number(match[1]);
        const question = calculatorTranslationEntries[key];
        const answerBase = calculatorTranslationEntries[`faqA${match[1]}`];
        if (!question || !answerBase) {
          return null;
        }

        const answerParts: string[] = [answerBase];

        if (calculator.id === 'casino-winnings-tax' && match[1] === '1') {
          const taxFreeThreshold = 12 * 4325;
          const formattedThreshold = new Intl.NumberFormat(currentLang === 'kk' ? 'kk-KZ' : 'ru-KZ')
            .format(taxFreeThreshold);
          answerParts.push(formattedThreshold);
        }

        const suffixKeys = Object.keys(calculatorTranslationEntries)
          .filter((entryKey) => entryKey.startsWith(`faqA${match[1]}`) && entryKey !== `faqA${match[1]}`)
          .sort();
        suffixKeys.forEach((entryKey) => {
          const value = calculatorTranslationEntries[entryKey];
          if (value) {
            answerParts.push(value);
          }
        });

        const answer = answerParts.filter(Boolean).join(' ').trim();
        return { index, question, answer };
      })
      .filter((item): item is { index: number; question: string; answer: string } => Boolean(item))
      .sort((a, b) => a.index - b.index)
      .map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }));

    const faqItems = faqItemsFromObject.length > 0 ? faqItemsFromObject : faqItemsFromLegacy;

    const webApplication = {
      '@type': 'WebApplication',
      name: calculatorTitle,
      description: calculatorDescription,
      url: calculatorUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '1.0',
      datePublished: '2026-01-01',
      dateModified: LAST_CONTENT_UPDATE,
      inLanguage: language,
      author: { '@id': `${baseUrl}/#konstantin-yakovlev` },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KZT',
        availability: 'https://schema.org/InStock'
      }
    };

    const breadcrumbId = `${calculatorUrl}#breadcrumb`;
    const webPage = {
      '@type': 'WebPage',
      name: calculatorTitle,
      description: calculatorDescription,
      url: calculatorUrl,
      inLanguage: language,
      datePublished: '2026-01-01',
      dateModified: LAST_CONTENT_UPDATE,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630
      },
      mainEntity: webApplication,
      isPartOf: { '@id': `${baseUrl}/#website` },
      breadcrumb: { '@id': breadcrumbId }
    };

    const breadcrumbList = {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: homeLabel,
          item: homeUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryTitle,
          item: buildUrl(`/category/${category.id}`)
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: calculatorTitle
        }
      ]
    };

    const graphItems: any[] = [webPage, breadcrumbList];
    if (faqItems.length > 0) {
      graphItems.push({
        '@type': 'FAQPage',
        inLanguage: language,
        url: calculatorUrl,
        mainEntity: faqItems
      });
    }

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graphItems
    });
  }

  if (options.type === 'category' && options.categoryId) {
    const category = calculatorCategories.find(cat => cat.id === options.categoryId);

    if (!category) {
      return '';
    }

    const categoryUrl = options.url
      ? addTrailingSlash(options.url)
      : buildUrl(`/category/${options.categoryId}`);
    const categoryTitle = i18n.t(`${category.id}.title`, {
      ns: 'categories',
      lng: currentLang,
      defaultValue: category.title
    });
    const categoryDescription = i18n.t(`${category.id}.description`, {
      ns: 'categories',
      lng: currentLang,
      defaultValue: category.description
    });

    // hasPart: list child calculators
    const hasPart = category.calculators.map(calc => {
      const calcTitle = i18n.t(`${calc.id}.title`, {
        ns: 'calculators',
        lng: currentLang,
        defaultValue: calc.title
      });
      return {
        '@type': 'WebApplication',
        name: calcTitle,
        url: buildUrl(`/calculator/${calc.id}`)
      };
    });

    const collectionPage = {
      '@type': 'CollectionPage',
      name: categoryTitle,
      description: categoryDescription,
      url: categoryUrl,
      inLanguage: language,
      dateModified: LAST_CONTENT_UPDATE,
      numberOfItems: category.calculators.length,
      hasPart,
      isPartOf: { '@id': `${baseUrl}/#website` },
      about: {
        '@type': 'Thing',
        name: categoryTitle,
        description: categoryDescription
      }
    };

    const breadcrumbId = `${categoryUrl}#breadcrumb`;
    const breadcrumbList = {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: homeLabel,
          item: homeUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryTitle
        }
      ]
    };

    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [collectionPage, breadcrumbList]
    });
  }

  return '';
}
