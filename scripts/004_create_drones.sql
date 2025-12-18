-- Create drones table
CREATE TABLE IF NOT EXISTS public.drones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Drone details
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  weight_kg DECIMAL(10, 2) NOT NULL,
  max_altitude_m INTEGER NOT NULL,
  max_speed_kmh INTEGER NOT NULL,
  
  -- Camera/sensor capabilities
  has_camera BOOLEAN DEFAULT false,
  camera_resolution TEXT,
  has_thermal_imaging BOOLEAN DEFAULT false,
  
  -- Registration status
  is_registered BOOLEAN DEFAULT false,
  registration_date TIMESTAMPTZ,
  registration_expiry TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drones
CREATE POLICY "Pilots can view their own drones"
  ON public.drones FOR SELECT
  USING (pilot_id = auth.uid());

CREATE POLICY "Pilots can insert their own drones"
  ON public.drones FOR INSERT
  WITH CHECK (pilot_id = auth.uid());

CREATE POLICY "Pilots can update their own drones"
  ON public.drones FOR UPDATE
  USING (pilot_id = auth.uid());

CREATE POLICY "Pilots can delete their own drones"
  ON public.drones FOR DELETE
  USING (pilot_id = auth.uid());

CREATE POLICY "Department reviewers can view all drones"
  ON public.drones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('air_defense', 'logistics', 'intelligence', 'admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.drones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_drones_pilot_id ON public.drones(pilot_id);
CREATE INDEX idx_drones_registration ON public.drones(registration_number);
