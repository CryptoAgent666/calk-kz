#!/bin/bash
# IndexNow submission script for calk.kz
# Run after deploy to notify Bing, Yandex, Naver about updated URLs
#
# Usage: ./scripts/indexnow-submit.sh [url1] [url2] ...
# Without args: submits all main pages from sitemap

KEY="b315441a143949e98310379494d22332"
HOST="calk.kz"
KEY_LOCATION="https://${HOST}/${KEY}.txt"

# If specific URLs are passed as arguments, use them
if [ $# -gt 0 ]; then
  URLS=("$@")
else
  # Default: submit key pages
  URLS=(
    "https://calk.kz/"
    "https://calk.kz/__kk/"
    "https://calk.kz/category/tax/"
    "https://calk.kz/category/finance/"
    "https://calk.kz/category/social/"
    "https://calk.kz/category/auto/"
    "https://calk.kz/category/utilities/"
    "https://calk.kz/category/converters/"
    "https://calk.kz/category/agriculture/"
    "https://calk.kz/category/legal/"
    "https://calk.kz/category/religious/"
    "https://calk.kz/category/math/"
    "https://calk.kz/category/health/"
  )
fi

# Build JSON payload
URL_LIST=""
for url in "${URLS[@]}"; do
  if [ -n "$URL_LIST" ]; then
    URL_LIST="${URL_LIST},"
  fi
  URL_LIST="${URL_LIST}\"${url}\""
done

PAYLOAD="{\"host\":\"${HOST}\",\"key\":\"${KEY}\",\"keyLocation\":\"${KEY_LOCATION}\",\"urlList\":[${URL_LIST}]}"

echo "Submitting ${#URLS[@]} URLs to IndexNow..."
echo ""

# Submit to all IndexNow endpoints
for ENGINE in "api.indexnow.org" "www.bing.com" "yandex.com"; do
  echo -n "→ ${ENGINE}: "
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "https://${ENGINE}/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "${PAYLOAD}")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
    echo "✅ OK (${HTTP_CODE})"
  else
    echo "⚠️ HTTP ${HTTP_CODE}"
  fi
done

echo ""
echo "Done! ${#URLS[@]} URLs submitted."
