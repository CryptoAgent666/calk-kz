import { Capacitor } from '@capacitor/core';

/**
 * Отдача файла пользователю в нативном приложении.
 *
 * В WKWebView (iOS) и Android WebView «скачивание» blob-ссылок и doc.save()
 * не работает — кнопки молча ничего не делают. Поэтому в приложении пишем
 * файл во временную папку (Cache) и открываем системный share sheet:
 * оттуда пользователь сохраняет в «Файлы», шлёт в WhatsApp и т.д.
 *
 * Возвращает false на вебе — вызывающий код делает обычный browser-download.
 */
export async function shareFileNative(fileName: string, base64Data: string): Promise<boolean> {
  // Гейт по модулям в бинаре: в старых сборках после OTA Filesystem отсутствует.
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Filesystem') || !Capacitor.isPluginAvailable('Share')) {
    return false;
  }
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: base64Data,
    directory: Directory.Cache,
  });
  try {
    await Share.share({ title: fileName, url: uri });
  } catch {
    // Пользователь закрыл share sheet — не ошибка.
  }
  return true;
}
