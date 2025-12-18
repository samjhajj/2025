-- Drop types if they exist to avoid "already exists" errors
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('pilot', 'air_defense', 'logistics', 'intelligence', 'admin', 'public');

-- Create enum for approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'under_review');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create enum for document type
CREATE TYPE document_type AS ENUM ('national_id', 'insurance', 'drone_registration', 'flight_plan', 'other');

-- Extend the auth.users table with a profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'pilot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pilot_profiles table for additional pilot information
CREATE TABLE IF NOT EXISTS public.pilot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT,
  
  -- Approval tracking for each department
  air_defense_status approval_status NOT NULL DEFAULT 'pending',
  air_defense_reviewed_by UUID REFERENCES public.profiles(id),
  air_defense_reviewed_at TIMESTAMPTZ,
  air_defense_notes TEXT,
  
  logistics_status approval_status NOT NULL DEFAULT 'pending',
  logistics_reviewed_by UUID REFERENCES public.profiles(id),
  logistics_reviewed_at TIMESTAMPTZ,
  logistics_notes TEXT,
  
  intelligence_status approval_status NOT NULL DEFAULT 'pending',
  intelligence_reviewed_by UUID REFERENCES public.profiles(id),
  intelligence_reviewed_at TIMESTAMPTZ,
  intelligence_notes TEXT,
  
  -- Overall approval status (approved only when all three departments approve)
  overall_status approval_status NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for pilot_profiles
CREATE POLICY "Pilots can view their own pilot profile"
  ON public.pilot_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Pilots can insert their own pilot profile"
  ON public.pilot_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pilots can update their own pilot profile"
  ON public.pilot_profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Department reviewers can view pilot profiles"
  ON public.pilot_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('air_defense', 'logistics', 'intelligence', 'admin')
    )
  );

CREATE POLICY "Department reviewers can update pilot profiles"
  ON public.pilot_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('air_defense', 'logistics', 'intelligence', 'admin')
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'pilot')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.pilot_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
