import { useEffect, useState } from 'react';

/**
 * Хук "после монтирования". Возвращает false на сервере/первом рендере,
 * true — после useEffect. Нужен для recharts: ResponsiveContainer измеряет
 * ширину контейнера, которая отличается в puppeteer (718px) и в реальном
 * браузере (1087px+). Это вызывало React hydration errors #418/423/425.
 *
 * КРИТИЧНО: в пререндере (scripts/prerender.mjs) эффекты успевают отработать
 * ДО снятия HTML, поэтому в статику попадал уже отрендеренный SVG чарта, а
 * клиент на ПЕРВОМ рендере рисует плейсхолдер → structural mismatch и падение
 * всей гидратации (#423, «server HTML was replaced with client content»).
 * Флаг window.__PRERENDER__ держит чарт незамонтированным на время снимка,
 * чтобы статика и первый клиентский рендер совпадали байт в байт.
 *
 * То же для текста от текущего времени (часы timezone, «около HH:MM» в
 * alcohol-blood): до маунта — плейсхолдер и в статике, и в первом рендере.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if ((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__) return;
    setMounted(true);
  }, []);
  return mounted;
}
