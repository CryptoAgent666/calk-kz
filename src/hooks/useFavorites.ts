import { useEffect, useState } from 'react';
import { FAVORITES_CHANGED_EVENT, getFavorites } from '../utils/favorites';

/**
 * Список избранного. До маунта (и в пререндере) — пустой: статика и первый
 * клиентский рендер обязаны совпасть (правила гидратации), поэтому
 * localStorage читаем только в эффекте. `ready` = список уже прочитан.
 */
export function useFavorites(): { favorites: string[]; ready: boolean } {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__) return;
    const sync = () => setFavorites(getFavorites());
    sync();
    setReady(true);
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
  }, []);

  return { favorites, ready };
}
