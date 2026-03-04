/*
  # Fix Service Role Access to Exchange Rates

  1. Security Changes
    - Drop existing conflicting policies  
    - Create single comprehensive policy for service_role
    - Ensure UPSERT operations work properly

  2. Policy Details
    - Single policy covering all operations for service_role
    - Uses true for both USING and WITH CHECK
    - Explicitly named to avoid conflicts
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Service role can insert exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Service role can update exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Service role insert exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Service role update exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "INSERT" ON public.exchange_rates;
DROP POLICY IF EXISTS "UPDATE" ON public.exchange_rates;

-- Create a single comprehensive policy for service_role
CREATE POLICY "service_role_full_access"
  ON public.exchange_rates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;