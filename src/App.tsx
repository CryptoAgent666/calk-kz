import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
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
  const navigate = useNavigate();
  const [recentCalculators, setRecentCalculators] = useLocalStorage<string[]>('recent-calculators', []);

  const normalizePathname = (path: string) => (path === '/' ? '/' : path.replace(/\/+$/, ''));

  // Генерируем SEO-данные в зависимости от текущего маршрута
  const getCurrentSEO = () => {
    const pathname = normalizePathname(location.pathname);
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

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}/`);
  };

  const handleCalculatorClick = (calculatorId: string) => {
    navigate(`/calculator/${calculatorId}/`);
    
    // Добавляем в недавние
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