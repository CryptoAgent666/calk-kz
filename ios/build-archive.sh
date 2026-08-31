#!/bin/bash
# Полностью автоматизированная сборка iOS Archive + upload в App Store Connect
#
# Использование:
#   1. Открыть Xcode → выбрать Team в Signing & Capabilities (хотя бы один раз)
#   2. ./ios/build-archive.sh
#
# Скрипт:
#   - npm run build (фронтенд)
#   - npx cap sync ios
#   - xcodebuild archive (iOS-сборка)
#   - xcodebuild -exportArchive (отправка в App Store Connect)
#
# После завершения — в App Store Connect появится новый build, можно отправлять в Review.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHIVE_PATH="$ROOT/ios/build/App.xcarchive"
EXPORT_PATH="$ROOT/ios/build/export"
EXPORT_OPTIONS="$ROOT/ios/ExportOptions.plist"

cd "$ROOT"

echo "═══════════════════════════════════════"
echo "  Calk.kz iOS — Archive & Upload"
echo "═══════════════════════════════════════"

echo ""
echo "▶ 1/4  Сборка web (vite build)"
npx vite build

echo ""
echo "▶ 2/4  Sync с iOS (capacitor)"
npx cap sync ios

echo ""
echo "▶ 3/4  Создание архива (xcodebuild archive)"
rm -rf "$ARCHIVE_PATH"
xcodebuild \
  -project "$ROOT/ios/App/App.xcodeproj" \
  -scheme App \
  -configuration Release \
  -sdk iphoneos \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  archive

echo ""
echo "▶ 4/4  Экспорт + upload в App Store Connect"
rm -rf "$EXPORT_PATH"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH"

echo ""
echo "═══════════════════════════════════════"
echo "✅ Готово! Build загружен в App Store Connect."
echo ""
echo "Дальше:"
echo "1. Откройте https://appstoreconnect.apple.com/"
echo "2. Через 5-15 минут билд появится в TestFlight"
echo "3. Заполните метаданные (см. ios/APP-STORE-METADATA.md)"
echo "4. Submit for Review"
echo "═══════════════════════════════════════"
