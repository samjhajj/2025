-- Fix the flight status trigger to use correct enum values
-- The trigger was using "under_review" which doesn't exist in the flight_status enum

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS update_flight_status_trigger ON flights;
DROP FUNCTION IF EXISTS update_flight_overall_status();

-- Recreate the function with correct enum values
CREATE OR REPLACE FUNCTION update_flight_overall_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Use correct flight_status enum values: pending, approved, rejected, active, completed, cancelled
  -- NOT using "under_review" which doesn't exist in the enum
  
  -- If any department rejects, the overall status is rejected
  IF NEW.air_defense_status = 'rejected' 
     OR NEW.logistics_status = 'rejected' 
     OR NEW.intelligent_account_status = 'rejected' THEN
    NEW.status := 'rejected'::flight_status;
    
  -- If all three departments approve, the overall status is approved
  ELSIF NEW.air_defense_status = 'approved' 
        AND NEW.logistics_status = 'approved' 
        AND NEW.intelligent_account_status = 'approved' THEN
    NEW.status := 'approved'::flight_status;
    
  -- Otherwise, keep it as pending (at least one department hasn't reviewed)
  ELSE
    NEW.status := 'pending'::flight_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_flight_status_trigger
  BEFORE INSERT OR UPDATE OF air_defense_status, logistics_status, intelligent_account_status
  ON flights
  FOR EACH ROW
  EXECUTE FUNCTION update_flight_overall_status();

-- Update existing records to ensure consistency
UPDATE flights
SET status = CASE
  WHEN air_defense_status = 'rejected' 
       OR logistics_status = 'rejected' 
       OR intelligent_account_status = 'rejected' THEN 'rejected'::flight_status
  WHEN air_defense_status = 'approved' 
       AND logistics_status = 'approved' 
       AND intelligent_account_status = 'approved' THEN 'approved'::flight_status
  ELSE 'pending'::flight_status
END
WHERE air_defense_status IS NOT NULL 
   OR logistics_status IS NOT NULL 
   OR intelligent_account_status IS NOT NULL;
