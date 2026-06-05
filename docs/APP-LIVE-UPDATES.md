# OTA live-updates приложения (гибрид)

Нативное приложение (Capacitor) грузит **вшитый** веб-бандл (офлайн-фоллбэк) и
при запуске проверяет calk.kz на более свежий бандл — обновляя формулы/контент
**без релиза в стор**. Самохостинг на статике calk.kz, без платных сервисов.

## Как это устроено

| Кусок | Что делает |
|---|---|
| `scripts/generate-build-version.mjs` | при сборке пишет `public/build-version.json` = версия бандла (`YYYYMMDDHHmmss`). Несёт каждый бандл (вшитый и OTA). |
| `src/liveUpdates.ts` | на старте приложения (native-only): `notifyAppReady()` → читает свой `build-version.json` и серверный `…/app-updates/latest.json` → если сервер новее, качает zip и применяет при следующем резюме. На вебе — no-op (плагин даже не грузится). |
| `scripts/publish-app-bundle.mjs` (`npm run publish:app`) | зипует `dist/`, пишет `latest.json`, заливает `bundle-<version>.zip` + `latest.json` в `calk.kz/app-updates/` по FTP (`.env.deploy`). |
| `capacitor.config.ts` → `CapacitorUpdater` | `autoUpdate: false` (управляем из кода), `resetWhenUpdate: true` (релиз из стора сбрасывает на свежий вшитый бандл). |
| `@capgo/capacitor-updater` | нативная механика download/set/rollback. |

Версии — сортируемые timestamp одинаковой длины → лексикографическое сравнение = хронологическое.
Если `notifyAppReady()` не вызвать (бандл «кирпич») — плагин сам откатится на предыдущий.

## Разовая настройка (ОДИН релиз в стор)

Чтобы OTA заработал, плагин должен попасть в нативный билд — это единственный релиз вручную:

```bash
npm run build:prerender         # свежий dist + build-version.json
npx cap sync ios                # копирует dist в приложение + регистрирует плагин (+ pod install)
# (для Android: npx cap add android && npx cap sync android)
npx cap open ios                # собрать в Xcode, поднять версию, залить в App Store
```

После этого релиза дальнейшие обновления формул — **только OTA**, без стора.

## Обычный цикл обновления (без стора)

После любых правок на сайте:

```bash
npm run build:prerender         # собрать свежий веб-бандл
./deploy.sh                     # (как обычно) выкатить сайт
npm run publish:app             # опубликовать тот же бандл как OTA для приложений
```

Приложения подхватят новый бандл при следующем запуске/возврате из фона.

## Проверка

- Сайт: `https://calk.kz/build-version.json` → текущая версия.
- OTA-манифест: `https://calk.kz/app-updates/latest.json` → `{ version, url }`.
- Бандл: `https://calk.kz/app-updates/bundle-<version>.zip`.

Версия в манифесте должна быть **≥** версии вшитого бандла, иначе приложение OTA не применит (это нормально — защита от отката назад).

## Важно

- **Меняешь нативную часть** (плагины Capacitor, иконки, spl-screen, минимальную iOS/Android версию) — нужен новый релиз в стор; OTA обновляет только веб-часть (HTML/JS/CSS/формулы).
- OTA-бандл должен быть собран **той же мажорной версией** веб-приложения, что и нативная обёртка (не меняй radикально структуру между релизами стора).
- `.env.deploy` нужен и для `publish:app` (те же FTP-креды).
