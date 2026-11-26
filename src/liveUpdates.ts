import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { emitOta } from './telemetry';

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

/** Диагностика в консоль: Android — adb logcat -s Capacitor/Console:*,
 *  iOS — Safari → Разработка → устройство. Без следа «OTA не едет», «манифест
 *  не прочитался» и «бандл откатился» неотличимы (см. историю в шапке). */
function log(what: string, detail?: unknown): void {
  const tail = detail === undefined ? '' : `: ${detail instanceof Error ? detail.message : JSON.stringify(detail)}`;
  console.info(`[ota] ${what} (${Capacitor.getPlatform()})${tail}`);
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

type Updater = typeof import('@capgo/capacitor-updater').CapacitorUpdater;

/** Версии наших бандлов — timestamp YYYYMMDDHHmmss; у вшитого плагин пишет «builtin»/версию стора. */
const isBundleVersion = (v: string) => /^\d{14}$/.test(v);

/**
 * Удаляет лишние копии и, если среди скачанных есть бандл новее текущего, применяет его
 * (set() перезагружает webview — код после него не выполняется). true — применение запущено.
 */
async function applyDownloaded(updater: Updater, currentVersion: string): Promise<boolean> {
  // raw: реестр плагина, а не папки на диске. У идущей или оборванной загрузки папки ещё нет,
  // и обычный list() её не показывает.
  const [{ bundles }, { bundle: active }] = await Promise.all([updater.list({ raw: true }), updater.current()]);
  const ready = bundles
    .filter((b) => b.id !== active.id && (b.status === 'pending' || b.status === 'success')
      && isBundleVersion(b.version) && b.version > currentVersion)
    .sort((a, b) => (a.version < b.version ? 1 : -1))[0];

  // Незавершённые загрузки тоже удаляем. Код идёт один раз на процесс (webview перезагружает
  // только set(), а он не вызывается, пока что-то качается), так что запись `downloading` здесь —
  // от убитого процесса, и она не доедет: на Android конец загрузки ловит наблюдатель активити,
  // и zip, докачанный уже без него, так и лежит нераспакованным в files/. delete() заодно
  // отменяет задачу загрузки (WorkManager, по тегу версии) — до нового download() той же версии.
  let removed = 0;
  let abandoned = 0;
  for (const b of bundles) {
    if (b.id === active.id || b.id === ready?.id) continue;
    try {
      await updater.delete({ id: b.id });
    } catch {
      /* запись без файлов на диске плагин удаляет, но отвечает ошибкой */
    }
    removed++;
    if (b.status === 'downloading') abandoned++;
  }
  if (removed) log('удалены лишние копии', removed);
  // Загрузка, которую оборвал конец сессии. Если такие идут у одних и тех же установок
  // запуск за запуском — им zip не докачать никогда, и нужно продолжать загрузку, а не удалять.
  if (abandoned) emitOta('ota_download_abandoned', { platform: Capacitor.getPlatform(), code: String(abandoned) });

  if (!ready) return false;
  log('применяю скачанный ранее', ready.version);
  try {
    await updater.set(ready);
    return true;
  } catch (e) {
    // Битый бандл не должен ломать обновление на каждом запуске — удаляем и качаем заново.
    log('set не прошёл, удаляю бандл', e);
    try {
      await updater.delete({ id: ready.id });
    } catch {
      /* ignore */
    }
    return false;
  }
}

const LAST_BUNDLE_KEY = 'calk_ota_last_bundle';

/** Бандл сменился с прошлого запуска — OTA применён (или пришёл новый бинарь из стора,
 *  или плагин откатил бандл: тогда target старше code). Считаем уже в новом бандле,
 *  а не перед set(): перезагрузка webview может оборвать отправку. */
function noteBundleChange(currentVersion: string): void {
  try {
    const prev = localStorage.getItem(LAST_BUNDLE_KEY);
    if (prev === currentVersion) return;
    localStorage.setItem(LAST_BUNDLE_KEY, currentVersion);
    if (prev) emitOta('ota_applied', { platform: Capacitor.getPlatform(), target: currentVersion, code: prev });
  } catch {
    /* хранилище недоступно — без события */
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
    // Версия зашита в сам JS активного бандла (vite define из того же build-version.json).
    // До 23.11.2026 её читали относительным fetch('build-version.json'): если приложение
    // стартовало не на «/», путь превращался в /calculator/…/build-version.json, локальный
    // сервер отдавал index.html, разбор падал → версия «0» → манифест «новее» → тот же
    // бандл на 11,8 МБ качался и применялся заново (у одной установки 5 раз за 17 минут).
    const currentVersion = __BUILD_VERSION__;
    if (!isBundleVersion(currentVersion)) {
      log('версия бандла не распознана, обновление пропущено', currentVersion);
      return;
    }
    noteBundleChange(currentVersion);

    // Скачанный в прошлый раз, но не применённый бандл — применяем сразу, на старте,
    // до сетевого запроса (без сети он ждёт до 10 с, а перезагрузка посреди работы хуже).
    // Применение ждёт `resume`, а между визитами система выгружает процесс: каждый
    // запуск холодный, `resume` не наступает, и бандл качался заново. Так до 27.10.2026
    // 63% событий Android и 37% iOS шли со вшитого бандла 1.6, а на диске копилось
    // по 65 МБ за каждый запуск (плагин чистит копии только при обновлении из стора).
    if (await applyDownloaded(CapacitorUpdater, currentVersion)) return;

    const manifest = await fetchRemoteJson(MANIFEST_URL);
    const nextVersion = manifest?.version ? String(manifest.version) : '';
    const nextUrl = manifest?.url ? String(manifest.url) : '';
    log('бандл', { current: currentVersion, latest: nextVersion || null });
    if (!nextVersion || !nextUrl) return;

    // Версии — сортируемые timestamp одинаковой длины → лексикографическое сравнение корректно.
    if (nextVersion <= currentVersion) return;

    const platform = Capacitor.getPlatform();
    emitOta('ota_download_started', { platform, target: nextVersion });
    const started = Date.now();
    let bundle: Awaited<ReturnType<Updater['download']>>;
    try {
      bundle = await CapacitorUpdater.download({ url: nextUrl, version: nextVersion });
    } catch (e) {
      emitOta('ota_download_failed', {
        platform, target: nextVersion, ms: Date.now() - started,
        code: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
    emitOta('ota_downloaded', { platform, target: nextVersion, ms: Date.now() - started });
    log('скачан', { version: nextVersion, id: bundle.id });

    // Скачанный бандл применяет applyDownloaded() на следующем холодном старте.
    //
    // На Android — только так. `resume` там — это onResume активити: он приходит и когда
    // закрывают полноэкранную рекламу или окно оплаты Google Play, и set() перезагружал
    // webview посреди работы — пропадали введённый расчёт и предложение «Убрать рекламу»,
    // которое показывается как раз после рекламы. По телеметрии 25.09–23.11.2026 так было
    // после 31–34% закрытых интерстишелов (на iOS — 0 из 207).
    if (platform === 'android') return;

    // На iOS `resume` приходит только при настоящем возврате из фона (willEnterForeground),
    // а процесс живёт долго и без этого остался бы на старом бандле: применяем при
    // возврате (set() перезагружает webview в новый бандл).
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
