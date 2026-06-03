import { Link, type LinkProps } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localizePath } from '../utils/localizedRouting';

type LocalizedLinkProps = Omit<LinkProps, 'to'> & { to: string };

/**
 * Drop-in замена react-router <Link>, который автоматически добавляет
 * языковой префикс (/__kk/...) к внутренним путям в зависимости от текущего языка.
 *
 * Рендерится как обычный <a href>, поэтому ссылки краулятся поисковиками
 * и связывают как ru-, так и kk-дерево страниц (устраняет orphan pages).
 */
export default function LocalizedLink({ to, ...rest }: LocalizedLinkProps) {
  const { i18n } = useTranslation();
  return <Link to={localizePath(to, i18n.language)} {...rest} />;
}
