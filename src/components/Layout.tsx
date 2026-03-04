import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Calculator, Menu, X, Home, Search, ChevronRight, FileText, Phone, Shield, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchBar from './SearchBar';
import LanguageSwitcher from './LanguageSwitcher';
import { calculatorCategories } from '../data/calculators';
import { getIcon } from '../utils/iconMap';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
  onCategoryClick: (categoryId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function Layout({
  children,
  onNavigate,
  onCategoryClick,
  searchTerm,
  onSearchChange
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation(['common', 'categories']);
  
  // Определяем текущую страницу на основе URL
  const getCurrentPage = () => {
    const pathname = location.pathname;
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/category/')) return 'category';
    if (pathname.startsWith('/calculator/')) return 'calculator';
    if (pathname.startsWith('/legal/')) return 'legal';
    return 'home';
  };

  const currentPage = getCurrentPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0"
              aria-label={`${t('common:navigation.home')} ${t('common:siteName')}`}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-gray-900">{t('common:siteName')}</div>
                <p className="text-xs text-gray-500">{t('common:siteTagline')}</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 flex-shrink-0">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'home'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('common:navigation.home')}</span>
              </Link>
              <LanguageSwitcher />
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0"
             aria-label={isMobileMenuOpen ? t('common:navigation.close') : t('common:navigation.open')}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Search Bar - Mobile (under header) */}
          <div className="md:hidden px-4 pb-4">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
            />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Background Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Slide-out Panel */}
          <div className={`fixed top-0 left-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{t('common:siteName')}</h2>
                    <p className="text-xs text-gray-500">{t('common:siteTagline')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                 aria-label={t('common:navigation.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Switcher in Mobile Menu - TOP */}
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Язык / Тіл
                </h3>
                <LanguageSwitcher />
              </div>

              {/* Search in Mobile Menu */}
              <div className="p-4 border-b border-gray-100">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={onSearchChange}
                />
                {searchTerm && (
                  <div className="mt-2 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded">
                    <Search className="w-3 h-3 inline mr-1" />
                    {t('common:search.button')}: "{searchTerm}"
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Main Navigation */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {t('common:navigation.mainNavigation')}
                  </h3>

                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPage === 'home'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span className="font-medium">{t('common:navigation.homePage')}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                </div>

                {/* Categories */}
                <div className="border-t border-gray-100">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t('common:navigation.calculatorCategories')}
                    </h3>
                    <div className="space-y-1">
                      {calculatorCategories.map((category) => {
                        const IconComponent = getIcon(category.icon);
                        return (
                          <Link
                            key={category.id}
                            to={`/category/${category.id}/`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-sm">{t(`categories:${category.id}.title`)}</div>
                              <div className="text-xs text-gray-500">
                                {category.calculators.length} {category.calculators.length === 1 ? t('common:footer.calculators') : t('common:footer.calculatorsPlural')}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Legal Pages */}
                <div className="border-t border-gray-100">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t('common:navigation.information')}
                    </h3>
                    <div className="space-y-1">
                      <Link
                        to="/legal/about/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Info className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{t('common:navigation.about')}</span>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Link>

                      <Link
                        to="/legal/contact/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Phone className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{t('common:navigation.contact')}</span>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Link>

                      <Link
                        to="/legal/privacy/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">{t('common:navigation.privacy')}</span>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Link>

                      <Link
                        to="/legal/terms/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium">{t('common:navigation.userAgreement')}</span>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer in Mobile Menu */}
              <div className="border-t border-gray-100 p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    {t('common:footer.copyright', { year: new Date().getFullYear() })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('common:footer.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* About Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('common:siteName')}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {t('common:footer.tagline')}
              </p>

              {/* Google Play Store Link */}
              <div className="mb-4">
                <a
                  href="https://play.google.com/store/apps/details?id=calk.kz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-300">{t('common:footer.availableIn')}</div>
                    <div className="text-sm font-medium">{t('common:footer.googlePlay')}</div>
                  </div>
                </a>
              </div>

              {/* Partner Section - Zanimaem.kz */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <a
                  href="https://zanimaem.kz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <picture>
                    <source srcSet="/zanimaem-partner.avif" type="image/avif" />
                    <source srcSet="/zanimaem-partner.webp" type="image/webp" />
                    <img
                      src="/zanimaem-partner.png"
                      alt="Zanimaem.kz"
                      className="w-12 h-12 object-contain flex-shrink-0"
                      loading="lazy"
                      decoding="async"
                      width="48"
                      height="48"
                    />
                  </picture>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {t('common:footer.partnerText')} <span className="font-semibold text-blue-600">Zanimaem.kz</span>
                    </p>
                  </div>
                </a>
              </div>

              <p className="text-gray-500 text-xs mt-4">
                {t('common:footer.copyright', { year: new Date().getFullYear() })}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">{t('common:navigation.quickLinks')}</h4>
              <nav className="space-y-2">
                <Link
                  to="/"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('common:navigation.homePage')}
                </Link>
                <Link
                  to="/legal/about/"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('common:navigation.about')}
                </Link>
                <Link
                  to="/legal/contact/"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('common:navigation.contact')}
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">{t('common:navigation.legalInfo')}</h4>
              <nav className="space-y-2">
                <Link
                  to="/legal/privacy/"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('common:navigation.privacy')}
                </Link>
                <Link
                  to="/legal/terms/"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('common:navigation.userAgreement')}
                </Link>
                <Link
                  to="/legal/disclaimer/"
                  className="block text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {t('common:navigation.disclaimer')}
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-100 mt-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <p className="text-xs text-gray-500">
                {t('common:footer.disclaimer')}
              </p>
              <p className="text-xs text-gray-500">
                {t('common:footer.updated')}: {new Date().toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}