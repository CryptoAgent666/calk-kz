/*
  # Fix Security Issues

  1. Remove unused index
    - Drop `exchange_rates_last_fetched_idx` which is not being used

  2. Fix mutable search_path for all functions
    - Add `SET search_path = public, pg_temp` to all functions
    - This prevents search_path injection attacks

  3. Enable RLS on exchange_rates table
    - Enable Row Level Security on `exchange_rates` table
    - Add policies for authenticated users to read exchange rates
    - Add policies for service_role to insert/update exchange rates

  4. Security Notes
    - Exchange rates are public data and should be readable by all authenticated users
    - Only service role can insert/update rates (via Edge Functions)
*/

-- Drop unused index
DROP INDEX IF EXISTS exchange_rates_last_fetched_idx;

-- Recreate all functions with immutable search_path

-- Function: upsert_exchange_rate
CREATE OR REPLACE FUNCTION upsert_exchange_rate(
  p_currency_code text,
  p_rate_to_kzt numeric(10,4),
  p_report_date date,
  p_last_fetched_at timestamptz,
  p_nbrk_form_id bigint DEFAULT NULL,
  p_currency_name_ru text DEFAULT NULL,
  p_currency_name_kz text DEFAULT NULL,
  p_currency_name_en text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    currency_name_en
  ) VALUES (
    p_currency_code,
    p_rate_to_kzt,
    p_report_date,
    p_last_fetched_at,
    p_nbrk_form_id,
    p_currency_name_ru,
    p_currency_name_kz,
    p_currency_name_en
  )
  ON CONFLICT (currency_code, report_date) 
  DO UPDATE SET 
    rate_to_kzt = EXCLUDED.rate_to_kzt,
    last_fetched_at = EXCLUDED.last_fetched_at,
    updated_at = NOW(),
    nbrk_form_id = EXCLUDED.nbrk_form_id,
    currency_name_ru = EXCLUDED.currency_name_ru,
    currency_name_kz = EXCLUDED.currency_name_kz,
    currency_name_en = EXCLUDED.currency_name_en;
END;
$$;

-- Function: upsert_exchange_rate_batch
CREATE OR REPLACE FUNCTION upsert_exchange_rate_batch(
  rates_data jsonb
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rate_record jsonb;
  inserted_count int := 0;
  updated_count int := 0;
  error_count int := 0;
  result json;
BEGIN
  FOR rate_record IN SELECT * FROM jsonb_array_elements(rates_data)
  LOOP
    BEGIN
      PERFORM upsert_exchange_rate(
        (rate_record->>'currency_code')::text,
        (rate_record->>'rate_to_kzt')::numeric(10,4),
        (rate_record->>'report_date')::date,
        (rate_record->>'last_fetched_at')::timestamptz,
        CASE WHEN rate_record->>'nbrk_form_id' = 'null' OR rate_record->>'nbrk_form_id' IS NULL 
             THEN NULL 
             ELSE (rate_record->>'nbrk_form_id')::bigint 
        END,
        rate_record->>'currency_name_ru',
        rate_record->>'currency_name_kz',
        rate_record->>'currency_name_en'
      );
      
      inserted_count := inserted_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Error processing rate for %: %', rate_record->>'currency_code', SQLERRM;
    END;
  END LOOP;

  result := json_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'error_count', error_count,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Function: fetch_and_update_exchange_rates
CREATE OR REPLACE FUNCTION fetch_and_update_exchange_rates()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result json;
BEGIN
  result := json_build_object(
    'success', true,
    'message', 'Exchange rates update function ready',
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- Function: update_exchange_rates_updated_at (trigger function)
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: exec_sql (if this is needed, it should be restricted)
-- For security, we'll drop it if it exists as it's a dangerous function
DROP FUNCTION IF EXISTS exec_sql(text);

-- Enable RLS on exchange_rates table
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read exchange rates
CREATE POLICY "Exchange rates are publicly readable"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service_role to insert exchange rates
CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Allow service_role to update exchange rates
CREATE POLICY "Service role can update exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anon users to read exchange rates (for public access)
CREATE POLICY "Exchange rates are publicly readable by anonymous users"
  ON exchange_rates
  FOR SELECT
  TO anon
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON exchange_rates TO authenticated, anon;
GRANT ALL ON exchange_rates TO service_role;

-- Re-grant execute permissions on functions
GRANT EXECUTE ON FUNCTION upsert_exchange_rate TO service_role;
GRANT EXECUTE ON FUNCTION upsert_exchange_rate_batch TO service_role;
GRANT EXECUTE ON FUNCTION fetch_and_update_exchange_rates TO service_role;
