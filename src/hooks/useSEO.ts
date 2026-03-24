import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { localizeUrl } from '../utils/localizedRouting';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  structuredData?: string;
  robots?: string;
}

export function useSEO(seoData: SEOData) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const normalizeCanonicalUrl = (url: string, lang: string) => {
      const parsed = new URL(url, window.location.origin);
      if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) {
        parsed.pathname = `${parsed.pathname}/`;
      }

      return localizeUrl(parsed.toString(), lang, window.location.origin);
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

    const ruAlternateUrl = normalizeCanonicalUrl(canonicalUrl, 'ru');
    const kkAlternateUrl = normalizeCanonicalUrl(canonicalUrl, 'kk');
    updateOrCreateHreflangTag('ru', ruAlternateUrl);
    updateOrCreateHreflangTag('kk', kkAlternateUrl);
    updateOrCreateHreflangTag('x-default', ruAlternateUrl);

    // Clean up legacy ru-kz/kk-kz hreflang tags if they exist
    document.querySelectorAll('link[hreflang="ru-kz"], link[hreflang="kk-kz"]').forEach(el => el.remove());

    // Update html lang attribute
    const isKazakh = i18n.language === 'kk';
    const htmlLang = isKazakh ? 'kk' : 'ru';
    document.documentElement.lang = htmlLang;

    // Clean up deprecated meta language tags if they exist
    document.querySelector('meta[name="language"]')?.remove();
    document.querySelector('meta[http-equiv="content-language"]')?.remove();

    // JSON-LD Structured Data
    if (seoData.structuredData) {
      const existingStructuredData = document.querySelectorAll('script[type="application/ld+json"]');
      existingStructuredData.forEach(script => script.remove());

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = seoData.structuredData;
      document.head.appendChild(script);
    }

    // Robots meta — for noindex pages (search results, etc.)
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = seoData.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  }, [seoData.title, seoData.description, seoData.keywords, seoData.image, seoData.url, seoData.structuredData, seoData.robots, i18n.language]);
}