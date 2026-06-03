import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLocalizedNavigate } from './hooks/useLocalizedNavigate';
import { stripLocalePrefix } from './utils/localizedRouting';
import { useSEO } from './hooks/useSEO';
import { getHomeSEO, getCategorySEO, getCalculatorSEO, getLegalPageSEO, getSearchSEO } from './utils/seoData';
import Layout from './components/Layout';
import EmbedPage from './components/EmbedPage';
import HomePage from './components/HomePage';
import CategoryPage from './components/CategoryPage';
import CalculatorPage from './components/CalculatorPage';
import LegalPage from './components/LegalPage';
import NotFoundPage from './components/NotFoundPage';

function App() {
  const location = useLocation();
  const navigate = useLocalizedNavigate();
  const [recentCalculators, setRecentCalculators] = useLocalStorage<string[]>('recent-calculators', []);

  const normalizePathname = (path: string) => (path === '/' ? '/' : path.replace(/\/+$/, ''));

  // Генерируем SEO-данные в зависимости от текущего маршрута
  const getCurrentSEO = () => {
    // Снимаем языковой префикс (/__kk/...), чтобы маршрут матчился независимо от языка.
    // Язык для SEO берётся из i18n.language внутри seoData.
    const pathname = stripLocalePrefix(normalizePathname(location.pathname));
    const searchParams = new URLSearchParams(location.search);
    const searchTerm = searchParams.get('q') || '';
    
    if (searchTerm.trim()) {
      return getSearchSEO(searchTerm);
    }
    
    if (pathname.startsWith('/embed/')) {
      const calculatorId = pathname.split('/embed/')[1];
      return getCalculatorSEO(calculatorId);
    } else if (pathname === '/') {
      return getHomeSEO();
    } else if (pathname.startsWith('/category/')) {
      const categoryId = pathname.split('/category/')[1];
      return getCategorySEO(categoryId);
    } else if (pathname.startsWith('/calculator/')) {
      const calculatorId = pathname.split('/calculator/')[1];
      return getCalculatorSEO(calculatorId);
    } else if (pathname.startsWith('/legal/')) {
      const pageId = pathname.split('/legal/')[1];
      return getLegalPageSEO(pageId);
    } else {
      return getHomeSEO();
    }
  };

  // Применяем SEO-теги
  useSEO(getCurrentSEO());

  // Прокрутка вверх при смене маршрута
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Автоматическое переключение языка по URL (/__kk/ ИЛИ ?lang=kk → KK, иначе RU)
  // Query-param поддержка нужна для:
  // 1) пререндера (puppeteer заходит по /calculator/X/?lang=kk)
  // 2) LanguageSwitcher (он переключает через ?lang=kk вместо редиректа на /__kk/)
  const { i18n } = useTranslation();
  useEffect(() => {
    const isKKByPath = location.pathname === '/__kk' || location.pathname.startsWith('/__kk/');
    const isKKByQuery = new URLSearchParams(location.search).get('lang') === 'kk';
    const isKK = isKKByPath || isKKByQuery;
    const targetLang = isKK ? 'kk' : 'ru';
    if (i18n.language !== targetLang) {
      i18n.changeLanguage(targetLang);
    }
    // Также обновим <html lang="..."> для корректного SEO/screen readers
    document.documentElement.lang = targetLang;
  }, [location.pathname, location.search, i18n]);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}/`);
  };

  const handleCalculatorClick = (calculatorId: string) => {
    // Навигация выполняется через <LocalizedLink>; здесь только трекаем «недавние»
    setRecentCalculators(prev => {
      const filtered = prev.filter(id => id !== calculatorId);
      return [calculatorId, ...filtered].slice(0, 8); // Максимум 8 недавних
    });
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      navigate('/');
    } else if (['about', 'contact', 'privacy', 'terms', 'disclaimer'].includes(page)) {
      navigate(`/legal/${page}/`);
    }
  };

  const handleSearchChange = (term: string) => {
    if (term.trim()) {
      navigate(`/?q=${encodeURIComponent(term)}`);
    } else {
      navigate('/');
    }
  };

  const handleClearRecent = () => {
    setRecentCalculators([]);
  };

  // Получаем поисковый запрос из URL
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('q') || '';

  if (location.pathname.startsWith('/embed/')) {
    return <EmbedPage />;
  }

  return (
    <Layout 
      onNavigate={handleNavigate}
      onCategoryClick={handleCategoryClick}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
    >
      <Routes>
        {/* /search/?q=... — редирект на главную с сохранением query (поиск работает inline на home) */}
        <Route path="/search" element={<Navigate to={`/?${location.search.slice(1) || ''}`} replace />} />
        <Route path="/search/" element={<Navigate to={`/?${location.search.slice(1) || ''}`} replace />} />
        <Route path="/__kk/search" element={<Navigate to={`/__kk/?${location.search.slice(1) || ''}`} replace />} />
        <Route path="/__kk/search/" element={<Navigate to={`/__kk/?${location.search.slice(1) || ''}`} replace />} />

        {/* RU routes (default) */}
        <Route
          path="/"
          element={
            <HomePage
              onCategoryClick={handleCategoryClick}
              recentCalculators={recentCalculators}
              onRecentCalculatorClick={handleCalculatorClick}
              onClearRecent={handleClearRecent}
              searchTerm={searchTerm}
            />
          }
        />
        <Route
          path="/category/:categoryId"
          element={
            <CategoryPage
              onCalculatorClick={handleCalculatorClick}
              onBackClick={() => navigate('/')}
            />
          }
        />
        <Route
          path="/calculator/:calculatorId"
          element={
            <CalculatorPage
              onBackClick={() => navigate(-1)}
              onCalculatorClick={handleCalculatorClick}
            />
          }
        />
        <Route
          path="/legal/:pageId"
          element={
            <LegalPage
              onBackClick={() => navigate('/')}
            />
          }
        />
        {/* KK routes (Kazakh) — same components, locale handled by useSEO/localizedRouting */}
        <Route
          path="/__kk"
          element={
            <HomePage
              onCategoryClick={handleCategoryClick}
              recentCalculators={recentCalculators}
              onRecentCalculatorClick={handleCalculatorClick}
              onClearRecent={handleClearRecent}
              searchTerm={searchTerm}
            />
          }
        />
        <Route
          path="/__kk/"
          element={
            <HomePage
              onCategoryClick={handleCategoryClick}
              recentCalculators={recentCalculators}
              onRecentCalculatorClick={handleCalculatorClick}
              onClearRecent={handleClearRecent}
              searchTerm={searchTerm}
            />
          }
        />
        <Route
          path="/__kk/category/:categoryId"
          element={
            <CategoryPage
              onCalculatorClick={handleCalculatorClick}
              onBackClick={() => navigate('/__kk/')}
            />
          }
        />
        <Route
          path="/__kk/calculator/:calculatorId"
          element={
            <CalculatorPage
              onBackClick={() => navigate(-1)}
              onCalculatorClick={handleCalculatorClick}
            />
          }
        />
        <Route
          path="/__kk/legal/:pageId"
          element={
            <LegalPage
              onBackClick={() => navigate('/__kk/')}
            />
          }
        />
        {/* Catch-all route for 404 */}
        <Route
          path="*"
          element={
            <NotFoundPage onNavigateHome={() => navigate('/')} />
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;