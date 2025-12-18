-- Fix RLS policies for profiles table to allow trigger inserts

-- Add INSERT policy for profiles (needed for the trigger to work)
CREATE POLICY "Allow trigger to insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Update the trigger function to include phone and use proper security settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'pilot')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
