import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initLiveUpdates } from './liveUpdates';
import { initAds } from './ads';

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

// Нативная реклама AdMob (только в приложении; на сайте — no-op, AdSense отдельно).
void initAds();
