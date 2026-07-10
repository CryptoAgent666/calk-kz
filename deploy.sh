#!/bin/bash
# Deploy dist/ to calk.kz via FTP (lftp mirror)
# Usage: ./deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.deploy not found"
  exit 1
fi

source "$ENV_FILE"

DIST_DIR="$SCRIPT_DIR/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: dist/ folder not found. Run 'npm run build:prerender' first."
  exit 1
fi

echo "Deploying dist/ to $FTP_HOST:$FTP_REMOTE_DIR ..."
echo "User: $FTP_USER"

lftp <<LFTP_EOF
set ftp:ssl-allow yes
set ftp:ssl-force no
set ssl:verify-certificate no
set net:timeout 30
set net:max-retries 3
open -u $FTP_USER,$FTP_PASS $FTP_HOST
mirror --reverse --delete --verbose --parallel=4 \
  --exclude .DS_Store \
  --exclude .git/ \
  --exclude app-updates/ \
  $DIST_DIR $FTP_REMOTE_DIR
quit
LFTP_EOF

echo ""
echo "Deploy complete!"

# --- OTA: опубликовать тот же бандл для нативных приложений (iOS/Android) ---
# ВАЖНО: /app-updates/ исключён из mirror --delete выше, иначе деплой сайта
# затирал бы OTA-манифест (грабль «--delete сносит /ota/»). publish:app льёт
# в подпапку /app-updates/ и не входит в зеркало сайта.
echo ""
echo "Publishing OTA bundle for mobile apps ..."
if npm run --silent publish:app; then
  echo "OTA bundle published."
else
  echo "WARNING: OTA publish failed — site is deployed, but mobile apps will NOT get this update until publish:app succeeds."
fi
