import { Capacitor, CapacitorHttp } from '@capacitor/core';

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
 * ⚠️ МАНИФЕСТ ЧИТАЕТСЯ НАТИВНЫМ HTTP (CapacitorHttp), А НЕ fetch() ИЗ WEBVIEW.
 * В capacitor.config.ts стоит `server.hostname: 'calk.kz'` — приложение выдаёт
 * себя за https://calk.kz, и запрос из webview на этот же хост до сети НЕ
 * доходит: на Android его перехватывает локальный сервер Capacitor
 * (WebViewLocalServer.isLocalFile → host == bridge.getHost) и отдаёт из
 * вшитого бандла, где app-updates/ нет; на iOS запрос уходит cross-origin и
 * режется CORS — сайт не отдаёт Access-Control-Allow-Origin. Оба пути давали
 * `manifest = null` и тихий return. Так с релиза 1.4 (16.08.2026) ни один
 * клиент не применил ни одного OTA: в телеметрии 0 из 691 событий несли
 * `platform`, хотя его шлёт каждый бандл от 17.08 (найдено 13.09.2026).
 * CapacitorHttp идёт через URLSession/OkHttp — мимо перехвата и мимо CORS.
 * Скачивание zip у плагина и так нативное, там проблемы не было.
 *
 * На вебе (обычный сайт) — полный no-op, нативный плагин даже не загружается
 * (динамический import + проверка платформы).
 */

const MANIFEST_URL = 'https://calk.kz/app-updates/latest.json';
// Относительный URL — читается из АКТИВНОГО бандла (вшитого или уже применённого OTA).
const LOCAL_VERSION_URL = 'build-version.json';

/** Диагностика в консоль: Android — adb logcat -s Capacitor/Console:*,
 *  iOS — Safari → Разработка → устройство. Без следа «OTA не едет», «манифест
 *  не прочитался» и «бандл откатился» неотличимы (см. историю в шапке). */
function log(what: string, detail?: unknown): void {
  const tail = detail === undefined ? '' : `: ${detail instanceof Error ? detail.message : JSON.stringify(detail)}`;
  console.info(`[ota] ${what} (${Capacitor.getPlatform()})${tail}`);
}

/** Локальный файл активного бандла — тут перехват локальным сервером и нужен. */
async function fetchLocalJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Сетевой JSON нативным клиентом: не перехватывается webview и не подчиняется CORS. */
async function fetchRemoteJson(url: string): Promise<any | null> {
  try {
    const res = await CapacitorHttp.get({
      url,
      responseType: 'json',
      connectTimeout: 10_000,
      readTimeout: 10_000,
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.status < 200 || res.status >= 300) {
      log('манифест: HTTP-статус не 2xx', res.status);
      return null;
    }
    // На части платформ data приходит строкой даже при responseType: 'json'.
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  } catch (e) {
    log('манифест не прочитан', e);
    return null;
  }
}

export async function initLiveUpdates(): Promise<void> {
  // Только в нативном приложении; на сайте ничего не делаем и плагин не грузим.
  if (!Capacitor.isNativePlatform()) return;
  // Бинарь без нативного модуля (старая сборка получила этот JS по OTA) — молча выходим.
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) return;

  let CapacitorUpdater: typeof import('@capgo/capacitor-updater').CapacitorUpdater;
  try {
    ({ CapacitorUpdater } = await import('@capgo/capacitor-updater'));
  } catch (e) {
    log('плагин не загрузился', e);
    return;
  }

  // ОБЯЗАТЕЛЬНО и КАК МОЖНО РАНЬШЕ: подтвердить, что текущий бандл загрузился
  // корректно, иначе плагин через appReadyTimeout (10 с) откатит его на
  // предыдущий (защита от «кирпича»). Поэтому initLiveUpdates() вызывается в
  // main.tsx ДО старта гидратации, а не после неё.
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    /* ignore */
  }

  try {
    const [local, manifest] = await Promise.all([
      fetchLocalJson(LOCAL_VERSION_URL),
      fetchRemoteJson(MANIFEST_URL),
    ]);

    const currentVersion = String(local?.version ?? '0');
    const nextVersion = manifest?.version ? String(manifest.version) : '';
    const nextUrl = manifest?.url ? String(manifest.url) : '';
    log('бандл', { current: currentVersion, latest: nextVersion || null });
    if (!nextVersion || !nextUrl) return;

    // Версии — сортируемые timestamp одинаковой длины → лексикографическое сравнение корректно.
    if (nextVersion <= currentVersion) return;

    const bundle = await CapacitorUpdater.download({ url: nextUrl, version: nextVersion });
    log('скачан', { version: nextVersion, id: bundle.id });

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
        log('применяю при резюме', nextVersion);
        await CapacitorUpdater.set(bundle);
      } catch (e) {
        log('set не прошёл, остаёмся на текущем', e);
      }
    });
  } catch (e) {
    // офлайн / любая ошибка → продолжаем работать на текущем (вшитом/последнем OTA) бандле
    log('обновление не удалось', e);
  }
}
