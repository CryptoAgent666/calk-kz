import { useRef } from 'react';

/**
 * Загружен ли React.lazy-компонент прямо сейчас (синхронно).
 *
 * React.lazy хранит состояние в _payload._status: -1 — не начинали,
 * 0 — грузится, 1 — готов, 2 — ошибка.
 */
export function isLazyReady(component: unknown): boolean {
  return (component as { _payload?: { _status?: number } } | null)?._payload?._status === 1;
}

/**
 * Решает ОДИН РАЗ на каждый ключ, можно ли отрисовать lazy-компонент без
 * обёртки <Suspense>.
 *
 * Зачем: пререндер снимает готовый DOM из браузера, а React при гидратации ждёт
 * вокруг каждой границы Suspense свои SSR-маркеры-комментарии (<!--$-->…<!--/$-->).
 * В снимке их нет, поэтому ЛЮБОЙ <Suspense> в дереве ломает гидратацию всей
 * страницы («Hydration failed…» на фибере Suspense, дальше каскад по соседям).
 * main.tsx прогревает чанк текущего маршрута ДО hydrateRoot — значит на
 * пререндеренной странице обёртка не нужна и её можно не рендерить.
 *
 * Решение фиксируется по ключу (id калькулятора): «готов» уже не станет
 * «не готов», а если на момент монтирования чанк не был загружен, обёртка
 * останется — иначе рендер бросил бы промис без границы.
 */
export function useLazyWithoutSuspense(component: unknown, key: string): boolean {
  const decisions = useRef<Record<string, boolean>>({});
  if (decisions.current[key] === undefined) {
    decisions.current[key] = isLazyReady(component);
  }
  return decisions.current[key];
}
