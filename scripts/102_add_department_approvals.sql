-- Add department-specific approval columns to pilot_profiles
ALTER TABLE pilot_profiles
ADD COLUMN IF NOT EXISTS air_defense_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS logistics_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS intelligent_account_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS air_defense_reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS logistics_reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS intelligent_account_reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS air_defense_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS logistics_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS intelligent_account_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS air_defense_notes text,
ADD COLUMN IF NOT EXISTS logistics_notes text,
ADD COLUMN IF NOT EXISTS intelligent_account_notes text;

-- Add check constraints to ensure status values are valid
ALTER TABLE pilot_profiles
ADD CONSTRAINT air_defense_status_check CHECK (air_defense_status IN ('pending', 'approved', 'rejected')),
ADD CONSTRAINT logistics_status_check CHECK (logistics_status IN ('pending', 'approved', 'rejected')),
ADD CONSTRAINT intelligent_account_status_check CHECK (intelligent_account_status IN ('pending', 'approved', 'rejected'));

-- Create a function to automatically update verification_status based on department approvals
CREATE OR REPLACE FUNCTION update_pilot_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If any department rejects, overall status is rejected
  IF NEW.air_defense_status = 'rejected' 
     OR NEW.logistics_status = 'rejected' 
     OR NEW.intelligent_account_status = 'rejected' THEN
    NEW.verification_status := 'rejected';
  -- If all departments approve, overall status is approved
  ELSIF NEW.air_defense_status = 'approved' 
     AND NEW.logistics_status = 'approved' 
     AND NEW.intelligent_account_status = 'approved' THEN
    NEW.verification_status := 'approved';
  -- Otherwise, status remains pending
  ELSE
    NEW.verification_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update verification_status
DROP TRIGGER IF EXISTS update_pilot_verification_status_trigger ON pilot_profiles;
CREATE TRIGGER update_pilot_verification_status_trigger
  BEFORE UPDATE ON pilot_profiles
  FOR EACH ROW
  WHEN (
    OLD.air_defense_status IS DISTINCT FROM NEW.air_defense_status
    OR OLD.logistics_status IS DISTINCT FROM NEW.logistics_status
    OR OLD.intelligent_account_status IS DISTINCT FROM NEW.intelligent_account_status
  )
  EXECUTE FUNCTION update_pilot_verification_status();

-- Add the same columns to flights table for flight approvals
ALTER TABLE flights
ADD COLUMN IF NOT EXISTS air_defense_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS logistics_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS intelligent_account_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS air_defense_reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS logistics_reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS intelligent_account_reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS air_defense_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS logistics_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS intelligent_account_reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS air_defense_notes text,
ADD COLUMN IF NOT EXISTS logistics_notes text,
ADD COLUMN IF NOT EXISTS intelligent_account_notes text;

-- Add check constraints for flights
ALTER TABLE flights
ADD CONSTRAINT flights_air_defense_status_check CHECK (air_defense_status IN ('pending', 'approved', 'rejected')),
ADD CONSTRAINT flights_logistics_status_check CHECK (logistics_status IN ('pending', 'approved', 'rejected')),
ADD CONSTRAINT flights_intelligent_account_status_check CHECK (intelligent_account_status IN ('pending', 'approved', 'rejected'));

-- Create function to update flight status based on department approvals
CREATE OR REPLACE FUNCTION update_flight_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If any department rejects, overall status is rejected
  IF NEW.air_defense_status = 'rejected' 
     OR NEW.logistics_status = 'rejected' 
     OR NEW.intelligent_account_status = 'rejected' THEN
    NEW.status := 'rejected';
  -- If all departments approve, overall status is approved
  ELSIF NEW.air_defense_status = 'approved' 
     AND NEW.logistics_status = 'approved' 
     AND NEW.intelligent_account_status = 'approved' THEN
    NEW.status := 'approved';
  -- Otherwise, status remains pending
  ELSE
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for flights
DROP TRIGGER IF EXISTS update_flight_status_trigger ON flights;
CREATE TRIGGER update_flight_status_trigger
  BEFORE UPDATE ON flights
  FOR EACH ROW
  WHEN (
    OLD.air_defense_status IS DISTINCT FROM NEW.air_defense_status
    OR OLD.logistics_status IS DISTINCT FROM NEW.logistics_status
    OR OLD.intelligent_account_status IS DISTINCT FROM NEW.intelligent_account_status
  )
  EXECUTE FUNCTION update_flight_status();

-- Comment explaining the approval logic
COMMENT ON COLUMN pilot_profiles.verification_status IS 'Overall verification status: approved only when ALL departments approve, rejected if ANY department rejects, pending otherwise';
COMMENT ON COLUMN flights.status IS 'Overall flight status: approved only when ALL departments approve, rejected if ANY department rejects, pending otherwise';
