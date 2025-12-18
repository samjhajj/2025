-- Add county column to pilot_profiles table
ALTER TABLE pilot_profiles
ADD COLUMN IF NOT EXISTS county TEXT;

-- Add comment to the column
COMMENT ON COLUMN pilot_profiles.county IS 'County/region where the pilot resides';
