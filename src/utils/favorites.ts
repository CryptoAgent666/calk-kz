/**
 * Избранные калькуляторы — только на устройстве (localStorage), без аккаунта.
 * Порядок: последний добавленный — первым. Событие FAVORITES_CHANGED_EVENT
 * синхронизирует звёздочку на странице, блок на главной и /favorites.
 */

const STORAGE_KEY = 'calk_favorites';
const MAX_FAVORITES = 30;

export const FAVORITES_CHANGED_EVENT = 'calk:favorites-changed';

export function getFavorites(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
  } catch {
    /* приватный режим/квота — избранное не критично */
  }
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

/** Добавить или убрать; возвращает новое состояние (true — в избранном). */
export function toggleFavorite(id: string): boolean {
  const current = getFavorites();
  if (current.includes(id)) {
    write(current.filter((x) => x !== id));
    return false;
  }
  write([id, ...current]);
  return true;
}

export function removeFavorite(id: string): void {
  write(getFavorites().filter((x) => x !== id));
}
