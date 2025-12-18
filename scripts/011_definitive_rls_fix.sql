-- Definitive RLS Fix - Removes ALL recursive policies
-- This script completely eliminates infinite recursion by avoiding any policy that queries the profiles table

-- Step 1: Drop the problematic helper function if it exists
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Step 2: Drop ALL policies on ALL tables to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
    
    -- Drop all policies on pilot_profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'pilot_profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.pilot_profiles';
    END LOOP;
    
    -- Drop all policies on flights
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'flights' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.flights';
    END LOOP;
    
    -- Drop all policies on drones
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'drones' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.drones';
    END LOOP;
    
    -- Drop all policies on documents
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'documents' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.documents';
    END LOOP;
    
    -- Drop all policies on payments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'payments' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.payments';
    END LOOP;
    
    -- Drop all policies on notifications
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.notifications';
    END LOOP;
    
    -- Drop all policies on audit_logs
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.audit_logs';
    END LOOP;
END $$;

-- Step 3: Create ONLY simple, non-recursive policies

-- Profiles table - ONLY allow users to see their own profile
-- NO admin policy that would cause recursion
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow profile creation"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Pilot profiles table - Allow pilots to manage their own, and make it readable by authenticated users
-- This avoids the need to check roles, which would cause recursion
CREATE POLICY "Pilots can view their own pilot profile"
  ON public.pilot_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Pilots can insert their own pilot profile"
  ON public.pilot_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pilots can update their own pilot profile"
  ON public.pilot_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow all authenticated users to view pilot profiles (reviewers need this)
-- We'll handle authorization in the application layer instead of RLS
CREATE POLICY "Authenticated users can view pilot profiles"
  ON public.pilot_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pilot profiles"
  ON public.pilot_profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Flights table - Simple policies without role checks
CREATE POLICY "Pilots can view their own flights"
  ON public.flights FOR SELECT
  USING (auth.uid() = pilot_id);

CREATE POLICY "Pilots can create flights"
  ON public.flights FOR INSERT
  WITH CHECK (auth.uid() = pilot_id);

CREATE POLICY "Pilots can update their own flights"
  ON public.flights FOR UPDATE
  USING (auth.uid() = pilot_id);

-- Allow all authenticated users to view flights (reviewers need this)
CREATE POLICY "Authenticated users can view flights"
  ON public.flights FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update flights"
  ON public.flights FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Drones table
CREATE POLICY "Pilots can manage their own drones"
  ON public.drones FOR ALL
  USING (auth.uid() = pilot_id)
  WITH CHECK (auth.uid() = pilot_id);

CREATE POLICY "Authenticated users can view drones"
  ON public.drones FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Documents table
CREATE POLICY "Users can manage their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view documents"
  ON public.documents FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Payments table
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view payments"
  ON public.payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Notifications table
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Audit logs table
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);
