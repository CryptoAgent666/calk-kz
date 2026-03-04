import { calculatorCategories } from '../data/calculators';
import i18n from '../i18n/config';

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
  const appendLangQuery = (url: string) =>
    currentLang === 'kk' ? `${url}${url.includes('?') ? '&' : '?'}lang=kk` : url;
  const buildUrl = (path: string) => appendLangQuery(addTrailingSlash(`${baseUrl}${path}`));
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

  if (options.type === 'organization') {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Calk.kz',
      url: baseUrlWithSlash,
      logo: `${baseUrl}/calculator-favicon.svg`,
      description: siteDescription,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        availableLanguage: ['Russian', 'Kazakh']
      },
      sameAs: []
    });
  }

  if (options.type === 'website') {
    const websiteUrl = options.url ? addTrailingSlash(options.url) : buildUrl('/');
    const searchUrl = currentLang === 'kk'
      ? `${baseUrl}/?lang=kk&q={search_term_string}`
      : `${baseUrl}/?q={search_term_string}`;
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: websiteUrl,
      description: options.description || siteDescription,
      inLanguage: language,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: searchUrl
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Calk.kz',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/calculator-favicon.svg`,
          width: 512,
          height: 512
        }
      }
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

    const currentDate = new Date().toISOString();

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

    const webApplication: any = {
      '@type': 'WebApplication',
      name: calculatorTitle,
      description: calculatorDescription,
      url: calculatorUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      softwareVersion: '1.0',
      datePublished: '2026-01-01',
      dateModified: currentDate,
      inLanguage: language,
      author: {
        '@type': 'Organization',
        name: 'Calk.kz',
        url: baseUrlWithSlash
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KZT',
        availability: 'https://schema.org/InStock'
      }
    };

    const breadcrumbId = `${calculatorUrl}#breadcrumb`;
    const webPage = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: calculatorTitle,
      description: calculatorDescription,
      url: calculatorUrl,
      inLanguage: language,
      datePublished: '2026-01-01',
      dateModified: currentDate,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630
      },
      mainEntity: webApplication,
      isPartOf: {
        '@type': 'WebSite',
        name: siteName,
        url: baseUrlWithSlash
      },
      breadcrumb: {
        '@id': breadcrumbId
      }
    };

    // Add breadcrumb
    const breadcrumbList = {
      '@context': 'https://schema.org',
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
          name: calculatorTitle,
          item: calculatorUrl
        }
      ]
    };

    const items: any[] = [webPage, breadcrumbList];
    if (faqItems.length > 0) {
      items.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: language,
        url: calculatorUrl,
        mainEntity: faqItems
      });
    }

    return JSON.stringify(items);
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
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: categoryTitle,
      description: categoryDescription,
      url: categoryUrl,
      inLanguage: language,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Calk.kz',
        url: baseUrlWithSlash
      },
      about: {
        '@type': 'Thing',
        name: categoryTitle,
        description: categoryDescription
      }
    };

    const breadcrumbList = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
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
          item: categoryUrl
        }
      ]
    };

    return JSON.stringify([structuredData, breadcrumbList]);
  }

  return '';
}

export function addStructuredDataToHead(structuredData: string): void {
  if (!structuredData) return;

  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = structuredData;
  document.head.appendChild(script);
}
