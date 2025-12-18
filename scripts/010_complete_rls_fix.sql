-- Complete RLS Policy Fix - Eliminates all recursive queries
-- This script drops all existing policies and recreates them without recursion

-- First, create a helper function that bypasses RLS to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Allow profile creation on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Drop all existing policies on pilot_profiles table
DROP POLICY IF EXISTS "Pilots can view their own profile" ON public.pilot_profiles;
DROP POLICY IF EXISTS "Pilots can update their own profile" ON public.pilot_profiles;
DROP POLICY IF EXISTS "Department reviewers can view pilot profiles" ON public.pilot_profiles;
DROP POLICY IF EXISTS "Department reviewers can update pilot profiles" ON public.pilot_profiles;
DROP POLICY IF EXISTS "Admins can manage all pilot profiles" ON public.pilot_profiles;

-- Create simple, non-recursive policies for pilot_profiles
CREATE POLICY "Pilots can view their own profile"
  ON public.pilot_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Pilots can insert their own profile"
  ON public.pilot_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pilots can update their own profile"
  ON public.pilot_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can view pilot profiles"
  ON public.pilot_profiles FOR SELECT
  USING (get_user_role(auth.uid()) IN ('air_defense', 'logistics', 'intelligence', 'admin'));

CREATE POLICY "Reviewers can update pilot profiles"
  ON public.pilot_profiles FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('air_defense', 'logistics', 'intelligence', 'admin'));

-- Drop all existing policies on flights table
DROP POLICY IF EXISTS "Pilots can view their own flights" ON public.flights;
DROP POLICY IF EXISTS "Pilots can create flights" ON public.flights;
DROP POLICY IF EXISTS "Pilots can update their own flights" ON public.flights;
DROP POLICY IF EXISTS "Department reviewers can view flights" ON public.flights;
DROP POLICY IF EXISTS "Department reviewers can update flights" ON public.flights;
DROP POLICY IF EXISTS "Admins can manage all flights" ON public.flights;

-- Create simple, non-recursive policies for flights
CREATE POLICY "Pilots can view their own flights"
  ON public.flights FOR SELECT
  USING (auth.uid() = pilot_id);

CREATE POLICY "Pilots can create flights"
  ON public.flights FOR INSERT
  WITH CHECK (auth.uid() = pilot_id);

CREATE POLICY "Pilots can update their own flights"
  ON public.flights FOR UPDATE
  USING (auth.uid() = pilot_id AND status = 'draft');

CREATE POLICY "Reviewers can view all flights"
  ON public.flights FOR SELECT
  USING (get_user_role(auth.uid()) IN ('air_defense', 'logistics', 'intelligence', 'admin'));

CREATE POLICY "Reviewers can update flights"
  ON public.flights FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('air_defense', 'logistics', 'intelligence', 'admin'));

-- Drop all existing policies on drones table
DROP POLICY IF EXISTS "Pilots can view their own drones" ON public.drones;
DROP POLICY IF EXISTS "Pilots can create drones" ON public.drones;
DROP POLICY IF EXISTS "Pilots can update their own drones" ON public.drones;
DROP POLICY IF EXISTS "Pilots can delete their own drones" ON public.drones;
DROP POLICY IF EXISTS "Reviewers can view all drones" ON public.drones;
DROP POLICY IF EXISTS "Admins can manage all drones" ON public.drones;

-- Create simple, non-recursive policies for drones
CREATE POLICY "Pilots can manage their own drones"
  ON public.drones FOR ALL
  USING (auth.uid() = pilot_id)
  WITH CHECK (auth.uid() = pilot_id);

CREATE POLICY "Reviewers can view all drones"
  ON public.drones FOR SELECT
  USING (get_user_role(auth.uid()) IN ('air_defense', 'logistics', 'intelligence', 'admin'));

-- Drop all existing policies on documents table
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Reviewers can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;

-- Create simple, non-recursive policies for documents
CREATE POLICY "Users can manage their own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviewers can view all documents"
  ON public.documents FOR SELECT
  USING (get_user_role(auth.uid()) IN ('air_defense', 'logistics', 'intelligence', 'admin'));

-- Drop all existing policies on payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- Create simple, non-recursive policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Drop all existing policies on notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create simple, non-recursive policies for notifications
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop all existing policies on audit_logs table
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

-- Create simple, non-recursive policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);
