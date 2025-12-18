-- Create enum for flight status
CREATE TYPE flight_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'active', 'completed', 'cancelled');

-- Create flights table
CREATE TABLE IF NOT EXISTS public.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  drone_id UUID NOT NULL REFERENCES public.drones(id) ON DELETE CASCADE,
  
  -- Flight details
  flight_number TEXT UNIQUE,
  purpose TEXT NOT NULL,
  description TEXT,
  
  -- Location details
  departure_location TEXT NOT NULL,
  departure_lat DECIMAL(10, 8) NOT NULL,
  departure_lng DECIMAL(11, 8) NOT NULL,
  
  destination_location TEXT,
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  
  -- Flight area (polygon for restricted zones)
  flight_area JSONB, -- GeoJSON polygon
  
  -- Time details
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Flight parameters
  max_altitude_m INTEGER NOT NULL,
  estimated_duration_minutes INTEGER NOT NULL,
  
  -- Status tracking
  status flight_status NOT NULL DEFAULT 'draft',
  
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
  
  -- Overall approval status
  overall_status approval_status NOT NULL DEFAULT 'pending',
  final_approved_at TIMESTAMPTZ,
  
  -- GPS tracking
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  current_altitude_m DECIMAL(10, 2),
  last_gps_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flights
CREATE POLICY "Pilots can view their own flights"
  ON public.flights FOR SELECT
  USING (pilot_id = auth.uid());

CREATE POLICY "Pilots can insert their own flights"
  ON public.flights FOR INSERT
  WITH CHECK (pilot_id = auth.uid());

CREATE POLICY "Pilots can update their own flights"
  ON public.flights FOR UPDATE
  USING (pilot_id = auth.uid());

CREATE POLICY "Department reviewers can view all flights"
  ON public.flights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('air_defense', 'logistics', 'intelligence', 'admin')
    )
  );

CREATE POLICY "Department reviewers can update flights"
  ON public.flights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('air_defense', 'logistics', 'intelligence', 'admin')
    )
  );

CREATE POLICY "Public can view active flights"
  ON public.flights FOR SELECT
  USING (status = 'active');

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.flights
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for faster queries
CREATE INDEX idx_flights_pilot_id ON public.flights(pilot_id);
CREATE INDEX idx_flights_drone_id ON public.flights(drone_id);
CREATE INDEX idx_flights_status ON public.flights(status);
CREATE INDEX idx_flights_scheduled_start ON public.flights(scheduled_start);
CREATE INDEX idx_flights_overall_status ON public.flights(overall_status);

-- Function to generate unique flight number
CREATE OR REPLACE FUNCTION generate_flight_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_number := 'FL' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.flights WHERE flight_number = new_number);
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique flight number';
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate flight number
CREATE OR REPLACE FUNCTION set_flight_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.flight_number IS NULL THEN
    NEW.flight_number := generate_flight_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_flight_number_trigger
  BEFORE INSERT ON public.flights
  FOR EACH ROW EXECUTE FUNCTION set_flight_number();
