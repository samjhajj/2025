-- Create functions to update flight status bypassing RLS
CREATE OR REPLACE FUNCTION start_flight(flight_id uuid, pilot_profile_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Update flight status to active
  UPDATE flights
  SET 
    status = 'active',
    start_time = NOW(),
    updated_at = NOW()
  WHERE id = flight_id
    AND pilot_id = pilot_profile_id
    AND status = 'approved';
  
  -- Return the updated flight
  SELECT row_to_json(f.*) INTO result
  FROM flights f
  WHERE f.id = flight_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION end_flight(flight_id uuid, pilot_profile_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  -- Update flight status to completed
  UPDATE flights
  SET 
    status = 'completed',
    end_time = NOW(),
    updated_at = NOW()
  WHERE id = flight_id
    AND pilot_id = pilot_profile_id
    AND status = 'active';
  
  -- Return the updated flight
  SELECT row_to_json(f.*) INTO result
  FROM flights f
  WHERE f.id = flight_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
