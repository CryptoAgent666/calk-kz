import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';
import { calculatorCategories } from './data/calculators';
import { stripLocalePrefix } from './utils/localizedRouting';
import { initLiveUpdates } from './liveUpdates';
import { initPurchases } from './purchases';
import { initAds } from './ads';
import { isScreenshotMode } from './utils/screenshotMode';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container is missing');
}

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/**
 * Догружает React.lazy-компонент ДО первого рендера.
 *
 * React.lazy не «раскрывается» синхронно даже если модуль уже в кэше: статус
 * payload переходит в Resolved только в микротаске. Поэтому мало сделать
 * import() — надо дёрнуть сам payload (он бросит thenable) и дождаться его.
 */
function primeLazy(component: unknown): Promise<void> {
  const lazy = component as {
    _payload?: unknown;
    _init?: (payload: unknown) => unknown;
  };
  if (!lazy || !lazy._payload || typeof lazy._init !== 'function') {
    return Promise.resolve();
  }
  try {
    lazy._init(lazy._payload); // уже загружен — ок
    return Promise.resolve();
  } catch (thenable) {
    const promise = thenable as Promise<unknown> | undefined;
    return typeof promise?.then === 'function'
      ? promise.then(() => undefined, () => undefined)
      : Promise.resolve();
  }
}

/**
 * Пререндер сохраняет страницу калькулятора с уже отрендеренным компонентом,
 * а сам компонент — React.lazy. При hydrateRoot чанк ещё не загружен, Suspense
 * отдаёт скелет — структура не совпадает, React бросает «Hydration failed» и
 * перерисовывает весь root на клиенте (#418/#423). Поэтому для маршрутов
 * /calculator/:id и /embed/:id сначала догружаем чанк, потом гидратируем.
 * Задержки в сети это не добавляет: пререндер оставляет в <head> вставленный
 * Vite <link rel="modulepreload"> на тот же чанк, он грузится параллельно.
 */
async function primeRouteChunk(): Promise<void> {
  const pathname = stripLocalePrefix(window.location.pathname).replace(/\/+$/, '');
  const match = pathname.match(/^\/(?:calculator|embed)\/([^/]+)$/);
  if (!match) return;
  const calculatorId = match[1];
  // Общие lazy-чанки страниц калькуляторов (сценарии) прогреваем всегда:
  // Suspense-обёртки должны исчезнуть из первого рендера.
  const { LazyScenarioComparison } = await import('./components/ui/ScenarioComparison');
  await primeLazy(LazyScenarioComparison);
  for (const category of calculatorCategories) {
    const found = category.calculators.find(calc => calc.id === calculatorId);
    if (found) {
      await primeLazy(found.component);
      return;
    }
  }
}

if (container.hasChildNodes()) {
  void primeRouteChunk().then(() => hydrateRoot(container, app));
} else {
  createRoot(container).render(app);
}

// OTA-обновление веб-бандла в нативном приложении (no-op на сайте).
void initLiveUpdates();

// Покупки RevenueCat (entitlement ad_free). Инициализируем ДО рекламы, чтобы
// у купивших баннер не мелькал (isAdFree() читает кэш синхронно).
void initPurchases();

// Нативная реклама AdMob (только в приложении; на сайте — no-op, AdSense отдельно).
// В режиме сторовых скриншотов не инициализируем (ни рекламы, ни ATT-диалога).
if (!isScreenshotMode()) {
  void initAds();
}
