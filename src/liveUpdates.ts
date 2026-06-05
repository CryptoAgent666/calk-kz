import { Capacitor } from '@capacitor/core';

/**
 * Over-the-air (OTA) обновление веб-части нативного (Capacitor) приложения.
 *
 * Архитектура «гибрид»: вшитый в приложение бандл — офлайн-фоллбэк; при старте
 * приложение проверяет calk.kz на более свежий веб-бандл и применяет его БЕЗ
 * релиза в App Store / Google Play. Так формулы/контент в приложении
 * подтягиваются с сайта автоматически.
 *
 * Самохостинг на статике calk.kz:
 *   - каждый бандл несёт `/build-version.json` со своей версией (сортируемый
 *     timestamp YYYYMMDDHHmmss) — генерируется при сборке;
 *   - на сервере лежит `/app-updates/latest.json` = { version, url } и
 *     `/app-updates/bundle-<version>.zip` — публикуются `scripts/publish-app-bundle.mjs`.
 *
 * На вебе (обычный сайт) — полный no-op, нативный плагин даже не загружается
 * (динамический import + проверка платформы).
 */

const MANIFEST_URL = 'https://calk.kz/app-updates/latest.json';
// Относительный URL — читается из АКТИВНОГО бандла (вшитого или уже применённого OTA).
const LOCAL_VERSION_URL = 'build-version.json';

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function initLiveUpdates(): Promise<void> {
  // Только в нативном приложении; на сайте ничего не делаем и плагин не грузим.
  if (!Capacitor.isNativePlatform()) return;

  let CapacitorUpdater: typeof import('@capgo/capacitor-updater').CapacitorUpdater;
  try {
    ({ CapacitorUpdater } = await import('@capgo/capacitor-updater'));
  } catch {
    return;
  }

  // ОБЯЗАТЕЛЬНО: подтвердить, что текущий бандл загрузился корректно,
  // иначе плагин откатит его на предыдущий (защита от «кирпича»).
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* ignore */
  }

  try {
    const [local, manifest] = await Promise.all([
      fetchJson(LOCAL_VERSION_URL),
      fetchJson(MANIFEST_URL),
    ]);

    const currentVersion = String(local?.version ?? '0');
    const nextVersion = manifest?.version ? String(manifest.version) : '';
    const nextUrl = manifest?.url ? String(manifest.url) : '';
    if (!nextVersion || !nextUrl) return;

    // Версии — сортируемые timestamp одинаковой длины → лексикографическое сравнение корректно.
    if (nextVersion <= currentVersion) return;

    const bundle = await CapacitorUpdater.download({ url: nextUrl, version: nextVersion });

    // Применяем НЕ во время активного использования, а при следующем возврате
    // приложения из фона (set() перезагружает webview в новый бандл).
    const { App } = await import('@capacitor/app');
    const handle = await App.addListener('resume', async () => {
      try {
        await handle.remove();
      } catch {
        /* ignore */
      }
      try {
        await CapacitorUpdater.set(bundle);
      } catch {
        /* при ошибке остаёмся на текущем бандле */
      }
    });
  } catch {
    // офлайн / любая ошибка → продолжаем работать на текущем (вшитом/последнем OTA) бандле
  }
}
