-- Fix infinite recursion in RLS policies by removing recursive checks

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Department reviewers can view pilot profiles" ON public.pilot_profiles;
DROP POLICY IF EXISTS "Department reviewers can update pilot profiles" ON public.pilot_profiles;

-- Recreate profiles policies without recursion
-- Allow users to view their own profile (no recursion)
-- For admin access, we'll handle it at the application level or use a function

-- Add a simple policy for service role to manage everything
CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Recreate pilot_profiles policies without recursion
-- Use a helper function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Now use the function in policies (this won't cause recursion because it's SECURITY DEFINER)
CREATE POLICY "Department reviewers can view pilot profiles"
  ON public.pilot_profiles FOR SELECT
  USING (
    public.get_user_role() IN ('air_defense', 'logistics', 'intelligence', 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Department reviewers can update pilot profiles"
  ON public.pilot_profiles FOR UPDATE
  USING (
    public.get_user_role() IN ('air_defense', 'logistics', 'intelligence', 'admin')
  );

-- Add policy for admins to view all profiles
CREATE POLICY "Admins and reviewers can view profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR public.get_user_role() IN ('admin', 'air_defense', 'logistics', 'intelligence')
  );
