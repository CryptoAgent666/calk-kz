import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.calk.app',
  appName: 'Calk.kz - Калькуляторы',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // На iOS WebView показывает кастомный домен calk.kz внутри приложения
    hostname: 'calk.kz',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#1e40af',
    // Разрешаем переходы по внешним ссылкам через SafariViewController (важно для Apple)
    limitsNavigationsToAppBoundDomains: false,
    // Pull-to-refresh выключен — у нас SPA, перезагрузка ломает state
    scrollEnabled: true,
    // iOS 17+: используем встроенный WebView оптимизированный для PWA
    preferredContentMode: 'mobile',
  },
  plugins: {
    // OTA-обновление веб-бандла (см. src/liveUpdates.ts). Ручной режим:
    // проверку/загрузку/применение делаем сами из кода (самохостинг на calk.kz).
    CapacitorUpdater: {
      autoUpdate: false,
      // При обновлении самого приложения из стора — сбросить на свежий вшитый бандл.
      resetWhenUpdate: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      launchFadeOutDuration: 300,
      backgroundColor: '#1e40af',
      showSpinner: false,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1e40af',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1e40af',
      sound: 'default',
    },
  },
};

export default config;
