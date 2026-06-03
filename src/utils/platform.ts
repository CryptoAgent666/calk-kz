import { Capacitor } from '@capacitor/core';

/**
 * Платформенные утилиты.
 *
 * Apple не любит сайты с встроенной рекламой в iOS-приложениях (правило 4.3 App Store Review).
 * Используем эти утилиты для условного отключения AdSense на нативных платформах.
 */
export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const isIOS = (): boolean => {
  try {
    return Capacitor.getPlatform() === 'ios';
  } catch {
    return false;
  }
};

export const isAndroid = (): boolean => {
  try {
    return Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
};

export const isWeb = (): boolean => {
  try {
    return Capacitor.getPlatform() === 'web';
  } catch {
    return true;
  }
};

/**
 * AdSense должен быть отключён на iOS (правило Apple 4.3).
 * На Android можно показывать (Google разрешает свою же рекламу).
 * На вебе работает как обычно.
 */
export const shouldShowAdSense = (): boolean => {
  return !isIOS();
};
