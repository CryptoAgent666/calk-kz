/**
 * Режим сторовых скриншотов (?screenshots=1): глушит AdMob/ATT (main.tsx)
 * и промо-UI покупки (плашка/тосты) — в кадры не попадают тестовые баннеры
 * и цена чужого сторфронта. В проде параметр никем не используется;
 * см. скрипт скриншотов в docs/app-store/.
 */
export function isScreenshotMode(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('screenshots');
  } catch {
    return false;
  }
}
