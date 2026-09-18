import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  className?: string;
}

// Запрос уходит в URL после паузы в наборе, а не на каждую букву:
// раньше каждая буква = переход в истории браузера и page_view в GA4
// (17.09.2026 — ~10 тыс. из 54 тыс. просмотров были буквами поиска).
const COMMIT_DELAY_MS = 350;

export default function SearchBar({
  searchTerm,
  onSearchChange,
  placeholder,
  className = ""
}: SearchBarProps) {
  const { t } = useTranslation('common');
  const [value, setValue] = useState(searchTerm);
  const lastCommitted = useRef(searchTerm);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Запрос сменился снаружи (другая строка поиска, «назад», переход на главную)
  useEffect(() => {
    if (searchTerm !== lastCommitted.current) {
      lastCommitted.current = searchTerm;
      setValue(searchTerm);
    }
  }, [searchTerm]);

  // Ушли по ссылке, пока запрос ещё не отправлен, — он не должен утащить обратно в поиск
  const location = useLocation();
  useEffect(() => {
    if (!new URLSearchParams(location.search).get('q')) clearTimeout(timer.current);
  }, [location.pathname, location.search]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (term: string) => {
    clearTimeout(timer.current);
    // Пустой или из одних пробелов запрос в URL не попадает (App уводит на главную)
    lastCommitted.current = term.trim() ? term : '';
    onSearchChange(term);
  };

  const handleChange = (term: string) => {
    setValue(term);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(term), COMMIT_DELAY_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit(value);
      e.currentTarget.blur();
    }
  };

  const clearSearch = () => {
    setValue('');
    commit('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('search.placeholder')}
        aria-label={placeholder || t('search.placeholder')}
        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            onClick={clearSearch}
            aria-label={t('search.clear')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
