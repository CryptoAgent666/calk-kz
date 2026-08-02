#!/bin/bash
# Быстрый деплой calk.kz: один zip по FTP + распаковка PHP-скриптом на сервере.
#
# Зачем: хост — Plesk без SSH (порт 22 закрыт), RTT 366 мс. Классический
# lftp mirror = 774 файла × ~5 RTT ≈ 25-35 минут. Здесь: zip (~13 МБ) одним
# потоком + серверная распаковка ≈ 2-3 минуты. Семантика удаления сохранена
# (экстрактор удаляет файлы, которых нет в пакете), app-updates/ неприкосновенен.
#
# Фолбэк: ./deploy.sh (классический mirror) — если PHP-путь сломался.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"
source .env.deploy

DIST=dist
[ -f "$DIST/index.html" ] || { echo "ОШИБКА: нет dist/index.html — сначала npm run build:prerender"; exit 1; }
[ -f "$DIST/prerender-errors.json" ] && { echo "ОШИБКА: dist/prerender-errors.json существует — пререндер битый, деплой запрещён"; exit 1; }
HTML_COUNT=$(find "$DIST" -name index.html | wc -l | tr -d ' ')
[ "$HTML_COUNT" -ge 570 ] || { echo "ОШИБКА: в dist только $HTML_COUNT index.html (гейт 570)"; exit 1; }

RAND=$(openssl rand -hex 6)
TOKEN=$(openssl rand -hex 24)
TOKEN_HASH=$(printf '%s' "$TOKEN" | shasum -a 256 | cut -d' ' -f1)
ZIP_NAME="deploy-package-$RAND.zip"
EXTRACT_NAME="deploy-extract-$RAND.php"
ZIP_LOCAL="/tmp/$ZIP_NAME"
EXTRACT_LOCAL="/tmp/$EXTRACT_NAME"

cleanup() {
  rm -f "$ZIP_LOCAL" "$EXTRACT_LOCAL"
  # подчистить артефакты на сервере (экстрактор самоудаляется, но не при обрыве)
  lftp -e "set ftp:ssl-allow yes; set ssl:verify-certificate no; set net:timeout 20; set net:max-retries 1; \
    open -u $FTP_USER,$FTP_PASS $FTP_HOST; \
    rm -f $FTP_REMOTE_DIR/$ZIP_NAME; rm -f $FTP_REMOTE_DIR/$EXTRACT_NAME; quit" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[1/4] Пакую dist ($HTML_COUNT страниц)..."
( cd "$DIST" && zip -qr "$ZIP_LOCAL" . -x "app-updates/*" )
echo "      $(du -h "$ZIP_LOCAL" | cut -f1) → $ZIP_NAME"

sed -e "s/__TOKEN_HASH__/$TOKEN_HASH/" -e "s/__ZIP_NAME__/$ZIP_NAME/" \
  scripts/deploy-extract.php.tpl > "$EXTRACT_LOCAL"

echo "[2/4] Заливаю пакет и экстрактор (FTP, один поток)..."
lftp -e "set ftp:ssl-allow yes; set ssl:verify-certificate no; set net:timeout 60; set net:max-retries 3; \
  open -u $FTP_USER,$FTP_PASS $FTP_HOST; \
  put \"$ZIP_LOCAL\" -o $FTP_REMOTE_DIR/$ZIP_NAME; \
  put \"$EXTRACT_LOCAL\" -o $FTP_REMOTE_DIR/$EXTRACT_NAME; quit"

echo "[3/4] Распаковка на сервере..."
RESP=$(curl -sS -m 300 -X POST --data-urlencode "token=$TOKEN" "https://calk.kz/$EXTRACT_NAME")
echo "      ответ: $RESP"
echo "$RESP" | grep -q '"ok":true' || { echo "ОШИБКА распаковки — прод НЕ обновлён консистентно, прогоните ./deploy.sh"; exit 1; }

echo "[4/4] Публикую OTA-бандл..."
if npm run --silent publish:app; then
  echo "OTA bundle published."
else
  echo "WARNING: OTA publish failed — сайт задеплоен, приложения обновятся после успешного publish:app."
fi

echo "DEPLOY-FAST OK"
