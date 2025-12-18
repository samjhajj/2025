-- Drop the existing generic "ALL" policy
DROP POLICY IF EXISTS "Pilots can manage their own drones" ON public.drones;

-- Create specific policies for each operation
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

-- Allow department reviewers to view all drones
CREATE POLICY "Department reviewers can view all drones"
  ON public.drones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );
