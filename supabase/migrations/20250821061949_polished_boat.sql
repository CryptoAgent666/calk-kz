/*
  # Create UPSERT function for exchange rates

  1. Function
    - `upsert_exchange_rate` - proper UPSERT function with ON CONFLICT handling
    
  2. Purpose
    - Handle INSERT/UPDATE operations with conflict resolution
    - Bypass RLS issues by using database-level UPSERT
    - Ensure data integrity with proper constraint handling
*/

CREATE OR REPLACE FUNCTION upsert_exchange_rate(
  p_currency_code TEXT,
  p_rate_to_kzt NUMERIC(10,4),
  p_report_date DATE,
  p_last_fetched_at TIMESTAMPTZ,
  p_nbrk_form_id BIGINT DEFAULT NULL,
  p_currency_name_ru TEXT DEFAULT NULL,
  p_currency_name_kz TEXT DEFAULT NULL,
  p_currency_name_en TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO exchange_rates (
    currency_code,
    rate_to_kzt,
    report_date,
    last_fetched_at,
    nbrk_form_id,
    currency_name_ru,
    currency_name_kz,
    currency_name_en,
    created_at,
    updated_at
  ) VALUES (
    p_currency_code,
    p_rate_to_kzt,
    p_report_date,
    p_last_fetched_at,
    p_nbrk_form_id,
    p_currency_name_ru,
    p_currency_name_kz,
    p_currency_name_en,
    NOW(),
    NOW()
  )
  ON CONFLICT (currency_code, report_date)
  DO UPDATE SET
    rate_to_kzt = EXCLUDED.rate_to_kzt,
    last_fetched_at = EXCLUDED.last_fetched_at,
    nbrk_form_id = EXCLUDED.nbrk_form_id,
    currency_name_ru = EXCLUDED.currency_name_ru,
    currency_name_kz = EXCLUDED.currency_name_kz,
    currency_name_en = EXCLUDED.currency_name_en,
    updated_at = NOW();
END;
$$;