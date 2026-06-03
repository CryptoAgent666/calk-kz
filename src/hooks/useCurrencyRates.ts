import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface ExchangeRate {
  id: string;
  currency_code: string;
  rate_to_kzt: number;
  report_date: string;
  last_fetched_at: string;
  currency_name_ru?: string;
  currency_name_kz?: string;
  currency_name_en?: string;
}

interface CurrencyRatesResult {
  rates: ExchangeRate[];
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
  getRate: (from: string, to: string, date?: string) => number;
  refreshRates: () => Promise<void>;
}

export function useCurrencyRates(): CurrencyRatesResult {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Резервные курсы на случай недоступности API (от НБРК на 19.04.2026)
  const fallbackRates: Record<string, number> = {
    USD: 469.52,
    EUR: 553.75,
    RUB: 6.15,
    CNY: 68.82,
    GBP: 683.68,
    JPY: 3.23,
    CHF: 637.90,
    CAD: 367.66,
    AUD: 340.59
  };

  const fetchRates = async (date?: string) => {
    try {
      setLoading(true);
      setError(null);

      const targetDate = date || new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('exchange_rates')
        .select('*')
        .eq('report_date', targetDate)
        .order('currency_code');

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching exchange rates:', fetchError);
        setError('Ошибка загрузки курсов валют');
        return;
      }

      if (data && data.length > 0) {
        setRates(data);
        setLastUpdated(data[0]?.last_fetched_at || null);
        console.log('Exchange rates loaded from database:', data.length);
      } else {
        // Если нет данных в базе для указанной даты, используем резервные курсы
        console.log('No rates found in database, using fallback rates');
        const fallbackData: ExchangeRate[] = Object.entries(fallbackRates).map(([code, rate]) => ({
          id: `fallback-${code}`,
          currency_code: code,
          rate_to_kzt: rate,
          report_date: targetDate,
          last_fetched_at: new Date().toISOString(),
          currency_name_ru: code,
          currency_name_kz: code,
          currency_name_en: code
        }));
        
        setRates(fallbackData);
        setLastUpdated(new Date().toISOString());
        setError('Используются резервные курсы НБРК от 19.04.2026. Обновите данные для получения актуальных курсов.');
      }

    } catch (err) {
      console.error('Unexpected error fetching rates:', err);
      setError('Неожиданная ошибка при загрузке курсов');
    } finally {
      setLoading(false);
    }
  };

  const getRate = (from: string, to: string, date?: string): number => {
    if (from === to) return 1;

    // Если одна из валют - тенге
    if (from === 'KZT') {
      const toRate = rates.find(r => r.currency_code === to);
      return toRate ? 1 / toRate.rate_to_kzt : (fallbackRates[to] ? 1 / fallbackRates[to] : 1);
    }

    if (to === 'KZT') {
      const fromRate = rates.find(r => r.currency_code === from);
      return fromRate ? fromRate.rate_to_kzt : (fallbackRates[from] || 1);
    }

    // Конвертация через тенге
    const fromRate = rates.find(r => r.currency_code === from);
    const toRate = rates.find(r => r.currency_code === to);

    if (fromRate && toRate) {
      return fromRate.rate_to_kzt / toRate.rate_to_kzt;
    }

    // Резервный расчет через fallback rates
    const fromFallback = fallbackRates[from];
    const toFallback = fallbackRates[to];
    
    if (fromFallback && toFallback) {
      return fromFallback / toFallback;
    }

    return 1;
  };

  const refreshRates = async () => {
    try {
      // Принудительно обновляем курсы через основную Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-nbrk-rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'manual_refresh',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Manual refresh completed:', result);
        // После успешного обновления перезагружаем данные
        await fetchRates();
      } else {
        const errorData = await response.json();
        setError(`Ошибка обновления: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (err) {
      console.error('Error refreshing rates:', err);
      setError('Ошибка при обновлении курсов');
    }
  };

  useEffect(() => {
    // Проверяем время последнего обновления
    const checkLastUpdate = () => {
      const lastCheck = localStorage.getItem('last_rates_check');
      const now = new Date().getTime();
      const twoHours = 2 * 60 * 60 * 1000; // 2 часа в миллисекундах
      
      if (!lastCheck || (now - parseInt(lastCheck)) > twoHours) {
        localStorage.setItem('last_rates_check', now.toString());
        // Попробуем автоматически обновить курсы если прошло более 2 часов
        refreshRates().catch(console.error);
      }
    };
    
    fetchRates();
    checkLastUpdate();
  }, []);

  return {
    rates,
    lastUpdated,
    loading,
    error,
    getRate,
    refreshRates
  };
}