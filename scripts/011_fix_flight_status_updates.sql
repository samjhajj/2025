-- Drop old functions if they exist
DROP FUNCTION IF EXISTS start_flight(uuid, uuid);
DROP FUNCTION IF EXISTS end_flight(uuid, uuid);
DROP FUNCTION IF EXISTS exec_sql(text);

-- Function to start a flight
-- Uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION start_flight(
  flight_uuid uuid,
  pilot_profile_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  flight_record jsonb;
BEGIN
  -- Update flight status to active
  UPDATE flights
  SET 
    status = 'active',
    start_time = NOW(),
    updated_at = NOW()
  WHERE id = flight_uuid
    AND pilot_id = pilot_profile_uuid
    AND status = 'approved'
  RETURNING to_jsonb(flights.*) INTO flight_record;

  -- Check if update was successful
  IF flight_record IS NULL THEN
    RAISE EXCEPTION 'Flight not found, not owned by pilot, or not in approved status';
  END IF;

  RETURN flight_record;
END;
$$;

-- Function to end a flight
-- Uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION end_flight(
  flight_uuid uuid,
  pilot_profile_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  flight_record jsonb;
BEGIN
  -- Update flight status to completed
  UPDATE flights
  SET 
    status = 'completed',
    end_time = NOW(),
    updated_at = NOW()
  WHERE id = flight_uuid
    AND pilot_id = pilot_profile_uuid
    AND status = 'active'
  RETURNING to_jsonb(flights.*) INTO flight_record;

  -- Check if update was successful
  IF flight_record IS NULL THEN
    RAISE EXCEPTION 'Flight not found, not owned by pilot, or not in active status';
  END IF;

  RETURN flight_record;
END;
$$;
