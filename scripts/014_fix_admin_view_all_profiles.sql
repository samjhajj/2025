-- Fix admin access to view all profiles
-- This adds a policy that allows admins to view all profiles without causing recursion
-- by checking the JWT claims directly instead of querying the profiles table

-- Add policy for admins to view all profiles
-- We check the 'role' claim in the JWT which is set during login
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (
      -- Allow users to see their own profile
      auth.uid() = id
      OR
      -- Allow admins to see all profiles by checking JWT claim
      (auth.jwt() ->> 'role')::text = 'admin'
    )
  );

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Also allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND (
      -- Allow users to update their own profile
      auth.uid() = id
      OR
      -- Allow admins to update any profile
      (auth.jwt() ->> 'role')::text = 'admin'
    )
  );

-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
