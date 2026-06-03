const KAZAKH_PREFIX = '/__kk';

const ensureLeadingSlash = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export function stripLocalePrefix(path: string): string {
  const normalizedPath = ensureLeadingSlash(path || '/');

  if (normalizedPath === KAZAKH_PREFIX) {
    return '/';
  }

  if (normalizedPath.startsWith(`${KAZAKH_PREFIX}/`)) {
    return normalizedPath.slice(KAZAKH_PREFIX.length) || '/';
  }

  return normalizedPath;
}

export function getPathLanguage(path: string): 'ru' | 'kk' {
  const normalizedPath = ensureLeadingSlash(path || '/');
  return normalizedPath === KAZAKH_PREFIX || normalizedPath.startsWith(`${KAZAKH_PREFIX}/`) ? 'kk' : 'ru';
}

export function localizePath(path: string, lang: string): string {
  const strippedPath = stripLocalePrefix(path);
  const normalizedPath = strippedPath === '/' ? '/' : (strippedPath.endsWith('/') ? strippedPath : `${strippedPath}/`);

  if (lang === 'kk') {
    return normalizedPath === '/' ? `${KAZAKH_PREFIX}/` : `${KAZAKH_PREFIX}${normalizedPath}`;
  }

  return normalizedPath;
}

export function localizeUrl(url: string, lang: string, origin?: string): string {
  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://calk.kz');
  const parsed = new URL(url, baseOrigin);

  parsed.pathname = localizePath(parsed.pathname, lang);
  parsed.searchParams.delete('lang');

  const normalizedSearch = parsed.searchParams.toString();
  parsed.search = normalizedSearch ? `?${normalizedSearch}` : '';

  return parsed.toString();
}
