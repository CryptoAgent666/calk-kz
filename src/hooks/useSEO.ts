import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  structuredData?: string;
}

export function useSEO(seoData: SEOData) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const normalizeCanonicalUrl = (url: string, lang: string) => {
      const parsed = new URL(url, window.location.origin);
      if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) {
        parsed.pathname = `${parsed.pathname}/`;
      }

      if (lang === 'kk') {
        parsed.searchParams.set('lang', 'kk');
      } else {
        parsed.searchParams.delete('lang');
      }

      const normalizedSearch = parsed.searchParams.toString();
      parsed.search = normalizedSearch ? `?${normalizedSearch}` : '';
      return parsed.toString();
    };

    // Обновляем title
    document.title = seoData.title;

    // Обновляем или создаем meta title
    let titleMeta = document.querySelector('meta[name="title"]') as HTMLMetaElement;
    if (!titleMeta) {
      titleMeta = document.createElement('meta');
      titleMeta.name = 'title';
      document.head.appendChild(titleMeta);
    }
    titleMeta.content = seoData.title;

    // Обновляем или создаем meta description
    let descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.content = seoData.description;

    // Обновляем или создаем meta keywords (если предоставлены)
    if (seoData.keywords) {
      let keywordsMeta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.name = 'keywords';
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.content = seoData.keywords;
    }

    // Canonical URL - always use provided URL or clean URL without search params
    let canonicalUrl = seoData.url;
    if (!canonicalUrl) {
      const url = new URL(window.location.href);
      url.search = '';
      canonicalUrl = url.toString();
    }
    canonicalUrl = normalizeCanonicalUrl(canonicalUrl, i18n.language);
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    // Open Graph теги для социальных сетей
    const updateOrCreateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.content = content;
    };

    updateOrCreateOGTag('og:title', seoData.title);
    updateOrCreateOGTag('og:description', seoData.description);
    updateOrCreateOGTag('og:type', 'website');
    updateOrCreateOGTag('og:site_name', 'Calk.kz - Калькуляторы для Казахстана');
    updateOrCreateOGTag('og:url', canonicalUrl);

    if (seoData.image) {
      updateOrCreateOGTag('og:image', seoData.image);
      updateOrCreateOGTag('og:image:width', '1200');
      updateOrCreateOGTag('og:image:height', '630');
      updateOrCreateOGTag('og:image:alt', seoData.title);
    }

    const ogLocale = i18n.language === 'kk' ? 'kk_KZ' : 'ru_RU';
    updateOrCreateOGTag('og:locale', ogLocale);
    updateOrCreateOGTag('og:locale:alternate', i18n.language === 'kk' ? 'ru_RU' : 'kk_KZ');

    // Twitter Card теги
    const updateOrCreateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.name = name;
        document.head.appendChild(twitterTag);
      }
      twitterTag.content = content;
    };

    updateOrCreateTwitterTag('twitter:card', 'summary_large_image');
    updateOrCreateTwitterTag('twitter:title', seoData.title);
    updateOrCreateTwitterTag('twitter:description', seoData.description);
    updateOrCreateTwitterTag('twitter:url', canonicalUrl);

    if (seoData.image) {
      updateOrCreateTwitterTag('twitter:image', seoData.image);
      updateOrCreateTwitterTag('twitter:image:alt', seoData.title);
    }

    // hreflang tags for bilingual support
    const updateOrCreateHreflangTag = (hreflang: string, href: string) => {
      let hreflangTag = document.querySelector(`link[hreflang="${hreflang}"]`) as HTMLLinkElement;
      if (!hreflangTag) {
        hreflangTag = document.createElement('link');
        hreflangTag.rel = 'alternate';
        hreflangTag.hreflang = hreflang;
        document.head.appendChild(hreflangTag);
      }
      hreflangTag.href = href;
    };

    const baseUrl = canonicalUrl.split('?')[0];
    updateOrCreateHreflangTag('ru', baseUrl);
    updateOrCreateHreflangTag('ru-kz', baseUrl);
    updateOrCreateHreflangTag('kk', `${baseUrl}?lang=kk`);
    updateOrCreateHreflangTag('kk-kz', `${baseUrl}?lang=kk`);
    updateOrCreateHreflangTag('x-default', baseUrl);

    // Update html lang + language meta
    const isKazakh = i18n.language === 'kk';
    const htmlLang = isKazakh ? 'kk' : 'ru';
    const contentLanguage = isKazakh ? 'kk-KZ' : 'ru-RU';
    const languageLabel = isKazakh ? 'Kazakh' : 'Russian';

    document.documentElement.lang = htmlLang;

    let languageMeta = document.querySelector('meta[name="language"]') as HTMLMetaElement;
    if (!languageMeta) {
      languageMeta = document.createElement('meta');
      languageMeta.name = 'language';
      document.head.appendChild(languageMeta);
    }
    languageMeta.content = languageLabel;

    let contentLanguageMeta = document.querySelector('meta[http-equiv="content-language"]') as HTMLMetaElement;
    if (!contentLanguageMeta) {
      contentLanguageMeta = document.createElement('meta');
      contentLanguageMeta.setAttribute('http-equiv', 'content-language');
      document.head.appendChild(contentLanguageMeta);
    }
    contentLanguageMeta.content = contentLanguage;

    // JSON-LD Structured Data
    if (seoData.structuredData) {
      const existingStructuredData = document.querySelectorAll('script[type="application/ld+json"]');
      existingStructuredData.forEach(script => script.remove());

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = seoData.structuredData;
      document.head.appendChild(script);
    }

  }, [seoData.title, seoData.description, seoData.keywords, seoData.image, seoData.url, seoData.structuredData, i18n.language]);
}