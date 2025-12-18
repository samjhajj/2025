-- Add department-specific approval tracking to drones table
-- This allows each department to independently review and approve drones

-- Add department status columns
ALTER TABLE drones ADD COLUMN IF NOT EXISTS air_defense_status text DEFAULT 'pending';
ALTER TABLE drones ADD COLUMN IF NOT EXISTS logistics_status text DEFAULT 'pending';
ALTER TABLE drones ADD COLUMN IF NOT EXISTS intelligent_account_status text DEFAULT 'pending';

-- Add reviewer tracking columns
ALTER TABLE drones ADD COLUMN IF NOT EXISTS air_defense_reviewed_by uuid REFERENCES profiles(id);
ALTER TABLE drones ADD COLUMN IF NOT EXISTS logistics_reviewed_by uuid REFERENCES profiles(id);
ALTER TABLE drones ADD COLUMN IF NOT EXISTS intelligent_account_reviewed_by uuid REFERENCES profiles(id);

-- Add review timestamp columns
ALTER TABLE drones ADD COLUMN IF NOT EXISTS air_defense_reviewed_at timestamp with time zone;
ALTER TABLE drones ADD COLUMN IF NOT EXISTS logistics_reviewed_at timestamp with time zone;
ALTER TABLE drones ADD COLUMN IF NOT EXISTS intelligent_account_reviewed_at timestamp with time zone;

-- Add notes columns for each department
ALTER TABLE drones ADD COLUMN IF NOT EXISTS air_defense_notes text;
ALTER TABLE drones ADD COLUMN IF NOT EXISTS logistics_notes text;
ALTER TABLE drones ADD COLUMN IF NOT EXISTS intelligent_account_notes text;

-- Create or replace function to update overall verification_status based on department approvals
CREATE OR REPLACE FUNCTION update_drone_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If any department rejects, overall status is rejected
  IF NEW.air_defense_status = 'rejected' OR NEW.logistics_status = 'rejected' OR NEW.intelligent_account_status = 'rejected' THEN
    NEW.verification_status := 'rejected';
  -- If all departments approve, overall status is approved
  ELSIF NEW.air_defense_status = 'approved' AND NEW.logistics_status = 'approved' AND NEW.intelligent_account_status = 'approved' THEN
    NEW.verification_status := 'approved';
  -- Otherwise, status remains pending
  ELSE
    NEW.verification_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update verification_status
DROP TRIGGER IF EXISTS drone_verification_status_trigger ON drones;
CREATE TRIGGER drone_verification_status_trigger
  BEFORE UPDATE ON drones
  FOR EACH ROW
  WHEN (
    OLD.air_defense_status IS DISTINCT FROM NEW.air_defense_status OR
    OLD.logistics_status IS DISTINCT FROM NEW.logistics_status OR
    OLD.intelligent_account_status IS DISTINCT FROM NEW.intelligent_account_status
  )
  EXECUTE FUNCTION update_drone_verification_status();

-- Update existing drones to have pending status for all departments
UPDATE drones 
SET 
  air_defense_status = 'pending',
  logistics_status = 'pending',
  intelligent_account_status = 'pending'
WHERE 
  air_defense_status IS NULL OR
  logistics_status IS NULL OR
  intelligent_account_status IS NULL;
