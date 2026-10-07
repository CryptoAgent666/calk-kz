import { useState, useEffect } from 'react';
import { fetchNbrkRates } from '../utils/nbrkRates';

/**
 * Официальные курсы НБРК для конвертера валют — через прокси /api/nbrk-rates.php.
 *
 * До 07.10.2026 курсы читались из таблицы Supabase exchange_rates, но там лежали
 * не курсы НБРК (05.10.2026: USD 456,63 против 447,73 у НБРК), хотя конвертер
 * подписан «Национальный Банк РК». Теперь источник тот же, что у калькулятора посылок.
 */

interface ExchangeRate {
  currency_code: string;
  rate_to_kzt: number;
}

interface CurrencyRatesResult {
  rates: ExchangeRate[];
  /** Дата курса НБРК, YYYY-MM-DD */
  lastUpdated: string | null;
  loading: boolean;
  /** Ключ i18n предупреждения (параметр date — дата запасных курсов) или null */
  error: string | null;
  getRate: (from: string, to: string) => number;
  refreshRates: () => Promise<void>;
}

/** Курсы НБРК на 07.10.2026 (nationalbank.kz/rss) — если прокси или НБРК недоступны. */
export const FALLBACK_RATES_DATE = '2026-10-07';
const FALLBACK_RATES: Record<string, number> = {
  USD: 453.65,
  EUR: 509.99,
  RUB: 5.31,
  CNY: 67.66,
  GBP: 600.86,
  JPY: 2.87,
  CHF: 545.78,
  CAD: 317.82,
  AUD: 316.1,
};

const toList = (rates: Record<string, number>): ExchangeRate[] =>
  Object.entries(rates).map(([currency_code, rate_to_kzt]) => ({ currency_code, rate_to_kzt }));

export function useCurrencyRates(): CurrencyRatesResult {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    const r = await fetchNbrkRates();
    if (r && r.date >= FALLBACK_RATES_DATE && r.rates.USD) {
      setRates(toList(r.rates));
      setLastUpdated(r.date);
      setError(null);
    } else {
      setRates(toList(FALLBACK_RATES));
      setLastUpdated(FALLBACK_RATES_DATE);
      setError('currency-converter.ratesFallback');
    }
    setLoading(false);
  };

  const rateOf = (code: string): number | undefined =>
    code === 'KZT' ? 1 : rates.find((r) => r.currency_code === code)?.rate_to_kzt ?? FALLBACK_RATES[code];

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    const fromRate = rateOf(from);
    const toRate = rateOf(to);
    return fromRate && toRate ? fromRate / toRate : 1;
  };

  useEffect(() => {
    fetchRates();
  }, []);

  return { rates, lastUpdated, loading, error, getRate, refreshRates: fetchRates };
}
