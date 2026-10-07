import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * Официальные курсы НБРК через прокси на calk.kz (public/api/nbrk-rates.php):
 * сам RSS nationalbank.kz не отдаёт CORS-заголовков.
 *
 * Адрес абсолютный: в приложении webview живёт на hostname calk.kz, и fetch()
 * на свой же домен перехватывается локальным сервером бандла. Поэтому в нативе —
 * CapacitorHttp (мимо перехвата и CORS, как манифест OTA в liveUpdates.ts).
 */
const ENDPOINT = 'https://calk.kz/api/nbrk-rates.php';

export interface NbrkRates {
  /** Дата курса, YYYY-MM-DD */
  date: string;
  /** Тенге за 1 единицу валюты */
  rates: Record<string, number>;
}

function parse(data: unknown): NbrkRates | null {
  const d = (typeof data === 'string' ? JSON.parse(data) : data) as Partial<NbrkRates> | null;
  if (!d || typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !d.rates) return null;
  const rates: Record<string, number> = {};
  for (const [code, rate] of Object.entries(d.rates)) {
    if (typeof rate === 'number' && rate > 0) rates[code] = rate;
  }
  return { date: d.date, rates };
}

/** null — если прокси или НБРК недоступны; вызывающий оставляет свои курсы по умолчанию. */
export async function fetchNbrkRates(): Promise<NbrkRates | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.get({ url: ENDPOINT, responseType: 'json', connectTimeout: 8_000, readTimeout: 8_000 });
      return res.status >= 200 && res.status < 300 ? parse(res.data) : null;
    }
    const res = await fetch(ENDPOINT);
    return res.ok ? parse(await res.json()) : null;
  } catch {
    return null;
  }
}
