# 📱 Гайд по сборке и подаче Calk.kz в App Store

## ✅ Что уже сделано в коде

| Компонент | Файл | Статус |
|---|---|---|
| Capacitor + 10 плагинов | `package.json` | ✅ Установлены |
| Capacitor конфиг | `capacitor.config.ts` | ✅ `kz.calk.app`, splash, статус-бар |
| iOS платформа | `ios/` | ✅ Создана |
| Info.plist | `ios/App/App/Info.plist` | ✅ Локализация ru/kk/en, ATS, ITSAppUsesNonExemptEncryption |
| Privacy Manifest | `ios/App/App/PrivacyInfo.xcprivacy` | ✅ Required Reason APIs описаны |
| Локализация | `ru.lproj/`, `kk.lproj/`, `en.lproj/` | ✅ InfoPlist.strings созданы |
| Иконки | `Assets.xcassets/AppIcon.appiconset/` | ✅ Сгенерированы (но низкое разрешение — рекомендую заменить) |
| Splash screen | `Assets.xcassets/Splash.imageset/` | ✅ 3 размера @1x/@2x/@3x |
| React-хук native features | `src/hooks/useNativeFeatures.ts` | ✅ Share, Haptics, Notifications, Network |
| Условное скрытие AdSense на iOS | `src/utils/platform.ts` | ✅ `shouldShowAdSense()` |

## 🛠 Команды для разработки

```bash
# 1. Сделать веб-билд (после правок React)
npm run build

# 2. Скопировать билд в iOS
npx cap sync ios

# 3. Открыть в Xcode
npx cap open ios
```

## 📋 Чек-лист перед подачей в App Store

### 1. Apple Developer Account
- [ ] Аккаунт активирован (есть)
- [ ] Создан **App ID** `kz.calk.app` в [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list)
- [ ] Создан **App** в [App Store Connect](https://appstoreconnect.apple.com/)
- [ ] Bundle ID совпадает: `kz.calk.app`

### 2. Подписи в Xcode
- [ ] Project → Signing & Capabilities → **Team** выбран
- [ ] Provisioning Profile: Automatic
- [ ] Signing Certificate: Apple Development → Apple Distribution для архива

### 3. Иконка
- [ ] Заменить `resources/icon-only.png` на **квадратную 1024×1024** иконку Calk.kz (текущая взята из og-image и не идеальна)
- [ ] Перегенерировать: `npx @capacitor/assets generate --ios`

### 4. Билд
```bash
# В Xcode: Product → Archive (cmd+B сначала)
# Затем: Distribute App → App Store Connect → Upload
```

### 5. App Store Connect — заполнить
- [ ] **Описание (ru)**: «120+ бесплатных калькуляторов для Казахстана: налоги, кредиты, зарплата, пенсия, ОГПО, утильсбор. Все расчёты по НК РК 2026. Работает офлайн.»
- [ ] **Описание (kk)**: переведённая версия
- [ ] **Ключевые слова**: калькулятор, налоги, ИПН, кредит, зарплата, ОГПО
- [ ] **Категория**: Finance (primary), Utilities (secondary)
- [ ] **Возрастной рейтинг**: 4+
- [ ] **Скриншоты**:
  - iPhone 6.9" (iPhone 16 Pro Max) — обязательно
  - iPhone 6.5" (iPhone XS Max / 11 Pro Max) — обязательно
  - iPad Pro 13" — если планируем поддержку iPad
- [ ] **Privacy Policy URL**: `https://calk.kz/legal/privacy/`
- [ ] **Support URL**: `https://calk.kz/legal/contact/`
- [ ] **Marketing URL**: `https://calk.kz/`

### 6. Privacy Nutrition Labels (App Privacy)
В App Store Connect → App Privacy:
- **Data Not Collected** ✅ (если без AdSense на iOS)
- Если оставить AdSense: указать
  - Crash Data (для аналитики, не связано с пользователем)
  - Performance Data (не связано с пользователем)

### 7. Главное чтобы Apple одобрил (Guideline 4.2)
Apple отвергает приложения которые «просто WebView сайта». У нас есть:
- ✅ Share через native iOS Share Sheet
- ✅ Haptic feedback на кнопках
- ✅ Local Notifications для напоминаний о налоговых датах
- ✅ Offline support (расчёты работают без интернета)
- ✅ Network awareness (показывает статус)
- ✅ Multi-language ru/kk

**Совет:** В описании приложения **подчеркните**:
- «Расчёты работают офлайн без интернета»
- «Push-уведомления о датах налоговой отчётности»
- «Native iOS Share Sheet для отправки результатов»

### 8. Если Apple откажет
Самые частые причины и решения:
- **4.2 (Minimum Functionality)** → добавить ещё native-функций (мы уже добавили)
- **4.3 (Spam — too similar to existing app)** → подчеркнуть уникальность KZ-законодательства
- **5.1.1 (Privacy)** → проверить что PrivacyInfo.xcprivacy на месте
- **2.5.1 (Software Requirements)** → убедиться что нет JS-eval, hot-reload в проде

## 🚀 Submission Workflow

```
Xcode → Archive → Validate → Distribute → Upload to App Store
                                              ↓
                                    App Store Connect
                                              ↓
                                    Заполнить метаданные
                                              ↓
                                    Submit for Review
                                              ↓
                                    Apple Review (24-48ч обычно)
                                              ↓
                                    Approved ✅ → Release
```

## ⚠️ Важные команды

```bash
# Очистить и пересобрать
rm -rf ios/App/Pods ios/App/build
npm run build && npx cap sync ios

# Обновить плагины
npx cap update ios

# Проверить версию
grep CFBundleShortVersionString ios/App/App.xcodeproj/project.pbxproj
```

## 🔧 Если что-то сломалось

| Проблема | Решение |
|---|---|
| Capacitor not found | `npx cap sync ios` |
| Old web code | `npm run build && npx cap copy ios` |
| Icon не обновляется | Удалить `Assets.xcassets/AppIcon.appiconset/*.png` и `npx @capacitor/assets generate --ios` |
| Pods missing | Capacitor 8 использует Swift Package Manager — Pods не нужны |
| Signing error | В Xcode выбрать Team в Signing & Capabilities |
