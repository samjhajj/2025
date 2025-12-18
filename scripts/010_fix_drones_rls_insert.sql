-- Fix RLS policies for drones table
-- The issue is that "ALL" policies need both USING and WITH CHECK clauses
-- For INSERT operations specifically, WITH CHECK is what matters

-- Drop the existing generic ALL policy
DROP POLICY IF EXISTS "Pilots can manage their own drones" ON drones;

-- Create separate, specific policies for each operation
-- This is more explicit and easier to debug

-- Allow pilots to view their own drones
CREATE POLICY "Pilots can view own drones"
  ON drones
  FOR SELECT
  USING (pilot_id = auth.uid());

-- Allow pilots to insert drones (WITH CHECK is used for INSERT)
CREATE POLICY "Pilots can insert own drones"
  ON drones
  FOR INSERT
  WITH CHECK (pilot_id = auth.uid());

-- Allow pilots to update their own drones
CREATE POLICY "Pilots can update own drones"
  ON drones
  FOR UPDATE
  USING (pilot_id = auth.uid())
  WITH CHECK (pilot_id = auth.uid());

-- Allow pilots to delete their own drones
CREATE POLICY "Pilots can delete own drones"
  ON drones
  FOR DELETE
  USING (pilot_id = auth.uid());

-- Allow reviewers to view all drones
CREATE POLICY "Reviewers can view all drones"
  ON drones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account')
    )
  );
