-- Create enum for action types
CREATE TYPE action_type AS ENUM (
  'user_registered',
  'user_login',
  'profile_updated',
  'payment_made',
  'document_uploaded',
  'document_deleted',
  'drone_registered',
  'drone_updated',
  'flight_created',
  'flight_updated',
  'flight_submitted',
  'flight_approved',
  'flight_rejected',
  'flight_started',
  'flight_completed',
  'flight_cancelled',
  'approval_reviewed',
  'system_action'
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action action_type NOT NULL,
  entity_type TEXT, -- 'flight', 'drone', 'profile', etc.
  entity_id UUID,
  
  -- Details
  description TEXT NOT NULL,
  metadata JSONB,
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Function to log actions
CREATE OR REPLACE FUNCTION log_action(
  p_user_id UUID,
  p_action action_type,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, description, metadata)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_description, p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
