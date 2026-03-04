/*
  # Fix Exchange Rates RLS Policies

  This migration fixes the Row Level Security policies for the exchange_rates table
  to allow the Edge Function to properly insert and update exchange rate data.

  ## Changes Made
  
  1. **Remove existing service_role policy**: Drop the existing "Service role can manage exchange rates" policy
  2. **Create separate INSERT policy**: Allow service_role to insert new exchange rate records
  3. **Create separate UPDATE policy**: Allow service_role to update existing exchange rate records
  
  ## Security
  
  - Maintains public read access for the frontend
  - Provides explicit INSERT and UPDATE permissions for service_role
  - Uses true expressions to allow all operations for service_role
*/

-- Drop the existing service_role policy that may be causing conflicts
DROP POLICY IF EXISTS "Service role can manage exchange rates" ON public.exchange_rates;

-- Create explicit INSERT policy for service_role
CREATE POLICY "Service role can insert exchange rates"
  ON public.exchange_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create explicit UPDATE policy for service_role  
CREATE POLICY "Service role can update exchange rates"
  ON public.exchange_rates
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure the table has RLS enabled (should already be enabled)
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;