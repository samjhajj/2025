-- Add radius_m column to flights table
ALTER TABLE flights ADD COLUMN IF NOT EXISTS radius_m integer;

-- Add comment to explain the column
COMMENT ON COLUMN flights.radius_m IS 'Flight operation radius in meters (1-1000)';
