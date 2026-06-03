import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Clipboard } from '@capacitor/clipboard';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

/**
 * Хук с нативными iOS/Android функциями через Capacitor.
 * На web-версии все методы безопасно фоллбэчатся на Web APIs.
 *
 * Используется для:
 * - Соответствия Apple Guideline 4.2 (Minimum Functionality) — нужны native features
 * - Лучшего UX в мобильном приложении
 */
export function useNativeFeatures() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

  const [networkStatus, setNetworkStatus] = useState<{ connected: boolean; connectionType: string }>({
    connected: true,
    connectionType: 'unknown',
  });

  // Slejim za sostoianiem seti (offline indicator dlia Apple)
  useEffect(() => {
    if (!isNative) return;

    let unsubscribe: (() => void) | undefined;

    Network.getStatus().then((status) => {
      setNetworkStatus({ connected: status.connected, connectionType: status.connectionType });
    });

    Network.addListener('networkStatusChange', (status) => {
      setNetworkStatus({ connected: status.connected, connectionType: status.connectionType });
    }).then((handle) => {
      unsubscribe = () => handle.remove();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isNative]);

  // Native iOS Share Sheet
  const share = useCallback(
    async (data: { title?: string; text?: string; url?: string; dialogTitle?: string }) => {
      if (isNative) {
        try {
          await Share.share({
            title: data.title,
            text: data.text,
            url: data.url,
            dialogTitle: data.dialogTitle || 'Поделиться',
          });
          await Haptics.impact({ style: ImpactStyle.Light });
          return true;
        } catch (err: any) {
          // User cancelled — это нормально
          if (err?.message?.includes('cancel')) return false;
          console.error('Share error:', err);
          return false;
        }
      }
      // Web fallback на Web Share API
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: data.title, text: data.text, url: data.url });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },
    [isNative]
  );

  // Native copy to clipboard + haptic feedback
  const copyToClipboard = useCallback(
    async (text: string) => {
      if (isNative) {
        await Clipboard.write({ string: text });
        await Haptics.notification({ type: NotificationType.Success });
        return true;
      }
      // Web fallback
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },
    [isNative]
  );

  // Tactile feedback (vazhno dlia iOS HIG compliance)
  const haptic = useCallback(
    async (intensity: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
      if (!isNative) return;
      try {
        if (intensity === 'light' || intensity === 'medium' || intensity === 'heavy') {
          const style = intensity === 'light' ? ImpactStyle.Light : intensity === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
          await Haptics.impact({ style });
        } else {
          const type = intensity === 'success' ? NotificationType.Success : intensity === 'warning' ? NotificationType.Warning : NotificationType.Error;
          await Haptics.notification({ type });
        }
      } catch {
        // ignore haptics errors
      }
    },
    [isNative]
  );

  // Lokalnye notifikacii dlia naloagovyh dat (FNO 270 — do 15.09, FNO 240 — do 31.03 i t.d.)
  const scheduleTaxReminder = useCallback(
    async (params: { id: number; title: string; body: string; date: Date }) => {
      if (!isNative) return false;
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') return false;
        }
        await LocalNotifications.schedule({
          notifications: [
            {
              id: params.id,
              title: params.title,
              body: params.body,
              schedule: { at: params.date },
              sound: 'default',
            },
          ],
        });
        return true;
      } catch (err) {
        console.error('Notification error:', err);
        return false;
      }
    },
    [isNative]
  );

  // Status bar styling (vazhno dlia iOS HIG)
  const setStatusBarStyle = useCallback(
    async (dark: boolean = false) => {
      if (!isNative || platform !== 'ios') return;
      try {
        await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
      } catch {
        // ignore
      }
    },
    [isNative, platform]
  );

  // Exit app (Android only; iOS doesn't allow programmatic exit per HIG)
  const exitApp = useCallback(async () => {
    if (platform === 'android') {
      App.exitApp();
    }
  }, [platform]);

  return {
    isNative,
    platform,
    isOnline: networkStatus.connected,
    networkType: networkStatus.connectionType,
    share,
    copyToClipboard,
    haptic,
    scheduleTaxReminder,
    setStatusBarStyle,
    exitApp,
  };
}
