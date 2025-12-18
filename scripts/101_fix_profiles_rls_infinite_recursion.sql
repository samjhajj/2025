-- ============================================================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICY
-- ============================================================================
-- The "Reviewers can view all profiles" policy causes infinite recursion
-- because it queries the profiles table while checking access to profiles.
-- We need to check the role from the JWT token directly instead.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Reviewers can view all profiles" ON profiles;

-- Create a new policy that checks role from JWT instead of querying profiles
CREATE POLICY "Reviewers can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Check role from JWT token to avoid recursive query
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    OR
    -- Or just allow if they're viewing their own profile
    id = auth.uid()
  );

-- Also update similar policies on other tables to be consistent

-- Drop and recreate pilot_profiles reviewer policy
DROP POLICY IF EXISTS "Reviewers can view all pilot profiles" ON pilot_profiles;
CREATE POLICY "Reviewers can view all pilot profiles"
  ON pilot_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
  );

DROP POLICY IF EXISTS "Reviewers can update pilot profile verification" ON pilot_profiles;
CREATE POLICY "Reviewers can update pilot profile verification"
  ON pilot_profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
  );

-- Drop and recreate drones reviewer policy
DROP POLICY IF EXISTS "Reviewers can view all drones" ON drones;
CREATE POLICY "Reviewers can view all drones"
  ON drones FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
  );

-- Drop and recreate flights reviewer policies
DROP POLICY IF EXISTS "Reviewers can view all flights" ON flights;
CREATE POLICY "Reviewers can view all flights"
  ON flights FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
  );

DROP POLICY IF EXISTS "Reviewers can update flight status" ON flights;
CREATE POLICY "Reviewers can update flight status"
  ON flights FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
  );

-- Drop and recreate documents reviewer policy
DROP POLICY IF EXISTS "Reviewers can view all documents" ON documents;
CREATE POLICY "Reviewers can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
  );

-- Drop and recreate audit_logs admin policy
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );
