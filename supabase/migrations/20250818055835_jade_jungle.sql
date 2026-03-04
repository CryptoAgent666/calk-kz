/*
  # Создание таблицы курсов валют

  1. Новые таблицы
    - `exchange_rates`
      - `id` (uuid, primary key)
      - `currency_code` (text, код валюты, например 'USD')
      - `rate_to_kzt` (numeric, курс к тенге)
      - `report_date` (date, дата курса)
      - `last_fetched_at` (timestamptz, время последнего обновления)
      - `nbrk_form_id` (bigint, ID формы в НБРК)
      - `currency_name_ru` (text, название валюты на русском)
      - `currency_name_kz` (text, название валюты на казахском)
      - `currency_name_en` (text, название валюты на английском)

  2. Безопасность
    - Включить RLS для таблицы `exchange_rates`
    - Добавить политики для чтения данных
    - Добавить уникальный индекс для предотвращения дубликатов

  3. Индексы
    - Уникальный индекс по currency_code и report_date
    - Индекс по report_date для быстрых запросов по датам
*/

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code text NOT NULL,
  rate_to_kzt numeric(10,4) NOT NULL,
  report_date date NOT NULL,
  last_fetched_at timestamptz DEFAULT now(),
  nbrk_form_id bigint,
  currency_name_ru text,
  currency_name_kz text,
  currency_name_en text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создаем уникальный индекс для предотвращения дубликатов
CREATE UNIQUE INDEX IF NOT EXISTS exchange_rates_currency_date_idx 
  ON exchange_rates (currency_code, report_date);

-- Создаем индекс для быстрых запросов по дате
CREATE INDEX IF NOT EXISTS exchange_rates_report_date_idx 
  ON exchange_rates (report_date DESC);

-- Создаем индекс для быстрых запросов по последнему обновлению
CREATE INDEX IF NOT EXISTS exchange_rates_last_fetched_idx 
  ON exchange_rates (last_fetched_at DESC);

-- Включаем RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Политика для чтения данных (все пользователи могут читать курсы валют)
CREATE POLICY "Public read access for exchange rates"
  ON exchange_rates
  FOR SELECT
  TO public
  USING (true);

-- Политика для вставки/обновления данных (только для service role)
CREATE POLICY "Service role can manage exchange rates"
  ON exchange_rates
  FOR ALL
  TO service_role
  USING (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER exchange_rates_updated_at_trigger
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_exchange_rates_updated_at();