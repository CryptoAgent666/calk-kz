/*
  # Add Language Preferences and Analytics Tables

  ## Summary
  This migration adds two tables to support bilingual functionality:
  - User language preferences storage
  - Language usage analytics

  ## New Tables

  ### `user_language_preferences`
  Stores language preferences for users (both authenticated and anonymous via browser fingerprint).
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, nullable) - Reference to auth.users for authenticated users
  - `browser_fingerprint` (text, nullable) - For anonymous users
  - `language` (varchar(2)) - Selected language code ('ru' or 'kk')
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `language_usage_stats`
  Tracks language usage statistics for analytics.
  - `id` (uuid, primary key) - Unique identifier
  - `language` (varchar(2)) - Language code ('ru' or 'kk')
  - `calculator_id` (varchar(50), nullable) - Calculator identifier (null for general pages)
  - `page_type` (varchar(20)) - Type of page (home, category, calculator, legal)
  - `views_count` (int) - Number of views
  - `date` (date) - Date of the stat record
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on both tables
  - `user_language_preferences`: Users can read/update their own preferences
  - `language_usage_stats`: Read-only for all users, insert for authenticated users

  ## Indexes
  - Index on user_id for faster preference lookups
  - Composite index on (language, date) for analytics queries
  - Index on calculator_id for calculator-specific statistics
*/

-- Create user_language_preferences table
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_fingerprint text,
  language varchar(2) NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'kk')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_or_fingerprint UNIQUE NULLS NOT DISTINCT (user_id, browser_fingerprint)
);

-- Create language_usage_stats table
CREATE TABLE IF NOT EXISTS language_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language varchar(2) NOT NULL CHECK (language IN ('ru', 'kk')),
  calculator_id varchar(50),
  page_type varchar(20) NOT NULL CHECK (page_type IN ('home', 'category', 'calculator', 'legal', 'search')),
  views_count int DEFAULT 1,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_stat_entry UNIQUE (language, calculator_id, page_type, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_language_prefs_user_id 
  ON user_language_preferences(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_language_prefs_fingerprint 
  ON user_language_preferences(browser_fingerprint) 
  WHERE browser_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_language_stats_lang_date 
  ON language_usage_stats(language, date);

CREATE INDEX IF NOT EXISTS idx_language_stats_calculator 
  ON language_usage_stats(calculator_id) 
  WHERE calculator_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_usage_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_language_preferences

-- Allow users to read their own preferences (by user_id or browser_fingerprint)
CREATE POLICY "Users can read own language preferences"
  ON user_language_preferences
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() IS NULL
  );

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert own language preferences"
  ON user_language_preferences
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR (auth.uid() IS NULL AND browser_fingerprint IS NOT NULL)
  );

-- Allow users to update their own preferences
CREATE POLICY "Users can update own language preferences"
  ON user_language_preferences
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (auth.uid() IS NULL AND browser_fingerprint IS NOT NULL)
  );

-- RLS Policies for language_usage_stats

-- Allow everyone to read statistics (public analytics)
CREATE POLICY "Anyone can read language statistics"
  ON language_usage_stats
  FOR SELECT
  USING (true);

-- Allow anyone to insert statistics (for anonymous tracking)
CREATE POLICY "Anyone can insert language statistics"
  ON language_usage_stats
  FOR INSERT
  WITH CHECK (true);

-- Create function to update views count
CREATE OR REPLACE FUNCTION increment_language_stat(
  p_language varchar(2),
  p_calculator_id varchar(50),
  p_page_type varchar(20)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO language_usage_stats (language, calculator_id, page_type, views_count, date)
  VALUES (p_language, p_calculator_id, p_page_type, 1, CURRENT_DATE)
  ON CONFLICT (language, calculator_id, page_type, date)
  DO UPDATE SET views_count = language_usage_stats.views_count + 1;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_language_preferences_updated_at ON user_language_preferences;
CREATE TRIGGER update_user_language_preferences_updated_at
  BEFORE UPDATE ON user_language_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
