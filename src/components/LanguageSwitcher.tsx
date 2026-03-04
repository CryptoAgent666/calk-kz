import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

// Флаги стран как SVG компоненты
const RussiaFlag = () => (
  <svg viewBox="0 0 36 24" className="w-6 h-4 rounded-sm shadow-sm">
    <rect width="36" height="8" y="0" fill="#fff"/>
    <rect width="36" height="8" y="8" fill="#0039A6"/>
    <rect width="36" height="8" y="16" fill="#D52B1E"/>
  </svg>
);

const KazakhstanFlag = () => (
  <svg viewBox="0 0 36 24" className="w-6 h-4 rounded-sm shadow-sm">
    <rect width="36" height="24" fill="#00AFCA"/>
    <circle cx="18" cy="12" r="5" fill="#FFD700"/>
    <path d="M18 7 L19.5 11 L18 10 L16.5 11 Z" fill="#FFD700"/>
    {/* Солнечные лучи */}
    {[...Array(32)].map((_, i) => (
      <line 
        key={i}
        x1="18" y1="12" 
        x2={18 + 8 * Math.cos(i * Math.PI / 16)} 
        y2={12 + 8 * Math.sin(i * Math.PI / 16)} 
        stroke="#FFD700" 
        strokeWidth="0.3"
      />
    ))}
  </svg>
);

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const withTrailingSlash = (path: string) => (path === '/' ? '/' : path.endsWith('/') ? path : `${path}/`);

  const languages = [
    { code: 'ru', name: 'RU', fullName: 'Русский', Flag: RussiaFlag },
    { code: 'kk', name: 'KK', fullName: 'Қазақша', Flag: KazakhstanFlag },
  ];

  const changeLanguage = (langCode: string) => {
    if (i18n.language === langCode) return;
    
    i18n.changeLanguage(langCode);

    const searchParams = new URLSearchParams(location.search);
    searchParams.set('lang', langCode);

    navigate({
      pathname: withTrailingSlash(location.pathname),
      search: searchParams.toString()
    }, { replace: true });
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md transition-all ${
            i18n.language === lang.code
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={`${t('language.switch')} ${lang.fullName}`}
          title={lang.fullName}
        >
          <lang.Flag />
          <span className="text-xs font-medium hidden sm:inline">
            {lang.name}
          </span>
        </button>
      ))}
    </div>
  );
}
