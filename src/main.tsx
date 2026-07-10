import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';
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

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
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
