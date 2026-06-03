import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localizePath } from '../utils/localizedRouting';

/**
 * Обёртка над useNavigate, которая локализует путь (добавляет /__kk/ при kk-языке).
 * Поддерживает query-строку (`/?q=...`) и числовую навигацию (navigate(-1)).
 */
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      navigate(to);
      return;
    }
    const [pathPart, queryPart] = to.split('?');
    const localized = localizePath(pathPart || '/', i18n.language);
    navigate(queryPart ? `${localized}?${queryPart}` : localized, options);
  };
}
