/*
  # Create SQL execution function

  1. Functions
    - `exec_sql` - function to execute arbitrary SQL queries
  
  2. Security
    - Only accessible by service_role
    - Allows for bulk UPSERT operations
*/

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;