# Гайд по заливке v1.1 (OTA + AdMob) — Play + App Store

appId `kz.calk.app`. Релиз впервые добавляет **AdMob-рекламу** (баннер + интерстишал)
и **OTA-обновления** (`@capgo/capacitor-updater`). Из-за рекламы обязательно
заполнить privacy-формы в обоих сторах, иначе ревью отклонит.

AdMob ID (боевые, pub-4859241862365215):
- Android: App `~1247260374`, banner `/3241878642`, interstitial `/2108760371`
- iOS:     App `~9297974937`, banner `/3230270353`, interstitial `/1375252885`

---

## 1. Google Play (Android)

### Сборка подписанного AAB
1. **versionCode** в `android/app/build.gradle` — поставь строго **больше** текущего
   в Play Console (Release → Production → текущий release). Сейчас 6; почти наверняка
   надо выше. Подними versionName при желании (напр. 1.1).
2. **Подпись.** AAB должен быть подписан **upload-ключом** (твой исходный keystore).
   - На этой машине keystore НЕ найден. Найди его (та машина, где публиковал раньше),
     либо, если включён **Play App Signing**, запроси сброс upload-ключа в
     Play Console → Setup → App signing → Request upload key reset.
   - Положи рядом `android/keystore.properties` (он в .gitignore):
     ```
     storeFile=/abs/path/calk-kz.keystore
     storePassword=…
     keyAlias=…
     keyPassword=…
     ```
   - Собери: `cd android && ./gradlew :app:bundleRelease`
     → `app/build/outputs/bundle/release/app-release.aab` (уже подписанный).

### Заливка
3. Play Console → приложение → **Testing → Internal testing** (сначала прогон) или
   **Production** → **Create new release** → загрузи AAB.
4. **Release notes** — вставь текст из `RELEASE-NOTES-1.1.md` (RU + KK; EN не обязателен).
5. **App content → Ads** → «Yes, my app contains ads» (обязательно, раз AdMob).
6. **App content → Data safety** — заполни по таблице ниже.
7. Review → **Roll out**.

### Data safety форма (Google Play) — для AdMob
Источник: официальный гайд Google «AdMob & Data safety». Минимум для баннер+интерстишал
без медиации:

| Data type | Collected | Shared | Назначение | Обязательно |
|---|---|---|---|---|
| **Device or other IDs** (Advertising ID) | ✅ | ✅ | Advertising/marketing, Analytics, Fraud prevention | Required |
| **Location → Approximate location** | ✅ | ✅ | Advertising/marketing, Fraud prevention | Required |
| **App activity → App interactions** | ✅ | ✅ | Advertising/marketing, Analytics | Required |
| App info & performance → Crash logs, Diagnostics | ⬜ опц. | ⬜ | Analytics | — |

Общие ответы формы:
- **Is all user data encrypted in transit?** → **Yes** (HTTPS/SDK).
- **Do you provide a way for users to request data deletion?** → Yes
  (есть политика конфиденциальности calk.kz; для рекламного ID — сброс в настройках Android).
- **Personal info / Financial / Messages / Photos / Contacts / Files** → **No collection**
  (калькуляторы считают локально, ничего из введённого не отправляется).

> Примечание: «Shared» = данные уходят Google как третьей стороне для показа рекламы.

---

## 2. App Store (iOS)

### Архив и загрузка
1. **Build number** — в Xcode проверь, что CURRENT_PROJECT_VERSION (сейчас 6) уникален
   и ≥ последнего загруженного для версии 1.1 в App Store Connect.
2. Открой `ios/App/App.xcodeproj` в Xcode. Target App → **Signing & Capabilities** →
   выбери свою **Team**, Automatically manage signing (нужен Apple Developer аккаунт).
3. Верх: схема **App**, девайс **Any iOS Device (arm64)**.
4. **Product → Archive** → Organizer → **Distribute App → App Store Connect → Upload**.

### Оформление версии
5. App Store Connect → приложение → **(+) Version or Platform → 1.1**.
6. **What's New** — вставь из `RELEASE-NOTES-1.1.md` (RU + KK + **EN обязателен**).
7. Прикрепи загруженный build (появится через ~10–30 мин после Upload).
8. Скриншоты/описание менять не нужно.
9. **App Review Information** → в Notes можно написать: «App shows AdMob banner +
   interstitial ads. No login required.»
10. **Submit for Review**.

### App Privacy (Apple) — для AdMob
App Store Connect → приложение → **App Privacy → Edit**. Источник: офиц. гайд
Google «AdMob iOS App privacy».

| Категория | Тип данных | Назначение | Linked | Tracking |
|---|---|---|---|---|
| **Identifiers** | Device ID (IDFA) | Third-Party Advertising, Analytics, Developer Ads | Yes | **Yes** |
| **Usage Data** | Advertising Data, Product Interaction | Third-Party Advertising, Analytics | Yes | **Yes** |
| **Location** | Coarse Location | Third-Party Advertising, Analytics | Yes | Yes |
| Diagnostics | Crash Data, Performance Data | Analytics | No | No |

- **Does this app collect data?** → **Yes**.
- **Data Used to Track You** → отметь Device ID, Usage Data, Coarse Location
  (это включает ATT-промпт — он уже реализован в коде, текст в `NSUserTrackingUsageDescription`).
- **Does this app use the Advertising Identifier (IDFA)?** → **Yes** → причины:
  «Serve advertisements within the app». ATT уже спрашивается.
- Encryption (Export Compliance) → `ITSAppUsesNonExemptEncryption=false` уже в Info.plist
  → ответ «No».

---

## 3. После релиза — OTA-обновления (без сторов)
Правки формул/контента теперь доходят в приложение через capgo-updater:
`npm run publish:app` (собирает бандл + заливает `latest.json` на calk.kz/app-updates/).
Стор нужен только для нативных изменений (новые плагины, иконки, права).
⚠️ Через OTA нельзя добавлять новые фичи в обход ревью (правило Apple 2.5.2 / Google) —
только багфиксы и контент уже одобренной функциональности.

---

## Чек-лист перед отправкой
- [ ] Android versionCode > текущего в Play Console
- [ ] Найден/сброшен upload keystore → подписанный AAB
- [ ] Play: Ads = Yes, Data safety заполнена
- [ ] iOS: Archive подписан, build прикреплён
- [ ] iOS: App Privacy + IDFA = Yes заполнены
- [ ] Release notes вставлены (RU/KK/EN)
- [ ] IS_TESTING=false (уже в сборке) — боевая реклама
