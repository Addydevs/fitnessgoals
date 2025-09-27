-- Harden payments table policies: disallow client-side UPDATEs

-- Ensure table exists
-- (This script assumes sql/create_payments.sql already created the table.)

-- Drop permissive update policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Users can update their own payments.'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their own payments." ON payments';
  END IF;
END $$;

-- Create a blocking update policy (users cannot update rows directly)
DROP POLICY IF EXISTS "Users cannot update payments" ON payments;
CREATE POLICY "Users cannot update payments" ON payments
  FOR UPDATE USING (false);

-- Keep SELECT/INSERT policies as defined in the original migration.

