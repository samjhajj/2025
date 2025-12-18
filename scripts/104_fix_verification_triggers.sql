-- Fix the pilot_profiles verification trigger to properly cast enum values
DROP TRIGGER IF EXISTS update_pilot_verification_status_trigger ON pilot_profiles;
DROP FUNCTION IF EXISTS update_pilot_verification_status();

CREATE OR REPLACE FUNCTION update_pilot_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If any department rejects, overall status is rejected
  IF NEW.air_defense_status = 'rejected' 
     OR NEW.logistics_status = 'rejected' 
     OR NEW.intelligent_account_status = 'rejected' THEN
    NEW.verification_status := 'rejected'::verification_status;
  -- If all departments approve, overall status is approved
  ELSIF NEW.air_defense_status = 'approved' 
     AND NEW.logistics_status = 'approved' 
     AND NEW.intelligent_account_status = 'approved' THEN
    NEW.verification_status := 'approved'::verification_status;
  -- Otherwise, status remains pending
  ELSE
    NEW.verification_status := 'pending'::verification_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pilot_verification_status_trigger
  BEFORE UPDATE ON pilot_profiles
  FOR EACH ROW
  WHEN (
    OLD.air_defense_status IS DISTINCT FROM NEW.air_defense_status
    OR OLD.logistics_status IS DISTINCT FROM NEW.logistics_status
    OR OLD.intelligent_account_status IS DISTINCT FROM NEW.intelligent_account_status
  )
  EXECUTE FUNCTION update_pilot_verification_status();

-- Fix the flights status trigger to properly cast enum values
DROP TRIGGER IF EXISTS update_flight_status_trigger ON flights;
DROP FUNCTION IF EXISTS update_flight_status();

CREATE OR REPLACE FUNCTION update_flight_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If any department rejects, overall status is rejected
  IF NEW.air_defense_status = 'rejected' 
     OR NEW.logistics_status = 'rejected' 
     OR NEW.intelligent_account_status = 'rejected' THEN
    NEW.status := 'rejected'::flight_status;
  -- If all departments approve, overall status is approved (only if currently pending or under_review)
  ELSIF NEW.air_defense_status = 'approved' 
     AND NEW.logistics_status = 'approved' 
     AND NEW.intelligent_account_status = 'approved'
     AND NEW.status IN ('pending', 'under_review', 'submitted') THEN
    NEW.status := 'approved'::flight_status;
  -- If any department is still pending and none have rejected, mark as under_review
  ELSIF (NEW.air_defense_status = 'pending' OR NEW.logistics_status = 'pending' OR NEW.intelligent_account_status = 'pending')
     AND NEW.air_defense_status != 'rejected'
     AND NEW.logistics_status != 'rejected'
     AND NEW.intelligent_account_status != 'rejected'
     AND NEW.status NOT IN ('active', 'completed', 'cancelled') THEN
    NEW.status := 'under_review'::flight_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_flight_status_trigger
  BEFORE UPDATE ON flights
  FOR EACH ROW
  WHEN (
    OLD.air_defense_status IS DISTINCT FROM NEW.air_defense_status
    OR OLD.logistics_status IS DISTINCT FROM NEW.logistics_status
    OR OLD.intelligent_account_status IS DISTINCT FROM NEW.intelligent_account_status
  )
  EXECUTE FUNCTION update_flight_status();

-- Manually trigger the update for existing records to sync their statuses
UPDATE pilot_profiles
SET updated_at = NOW()
WHERE air_defense_status IS NOT NULL 
   OR logistics_status IS NOT NULL 
   OR intelligent_account_status IS NOT NULL;

UPDATE flights
SET updated_at = NOW()
WHERE air_defense_status IS NOT NULL 
   OR logistics_status IS NOT NULL 
   OR intelligent_account_status IS NOT NULL;
