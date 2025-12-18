-- ============================================================================
-- COMPLETE SYSTEM REBUILD V1
-- ============================================================================
-- This script completely rebuilds the database from scratch
-- Run this to fix all column mismatches and permission issues

-- ============================================================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS flights CASCADE;
DROP TABLE IF EXISTS drones CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS pilot_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS flight_status CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================================================
-- STEP 2: CREATE ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'pilot',
  'air_defense',
  'logistics',
  'intelligent_account',
  'admin'
);

CREATE TYPE verification_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'under_review'
);

CREATE TYPE flight_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'approve',
  'reject'
);

CREATE TYPE notification_type AS ENUM (
  'info',
  'warning',
  'success',
  'error'
);

-- ============================================================================
-- STEP 3: CREATE TABLES
-- ============================================================================

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'pilot',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pilot profiles (additional info for pilots only)
CREATE TABLE pilot_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  license_number TEXT,
  license_expiry DATE,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drones table
CREATE TABLE drones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilot_profiles(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  registration_number TEXT,
  weight_kg NUMERIC,
  max_altitude_m INTEGER,
  verification_status verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(serial_number)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flight_id UUID,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flights table
CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES pilot_profiles(id) ON DELETE CASCADE,
  drone_id UUID NOT NULL REFERENCES drones(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  purpose TEXT NOT NULL,
  max_altitude_m INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status flight_status DEFAULT 'pending',
  reviewer_id UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  payment_provider TEXT,
  payment_intent_id TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones table (no-fly zones, restricted areas, etc.)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  zone_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  radius_m INTEGER NOT NULL,
  min_altitude_m INTEGER DEFAULT 0,
  max_altitude_m INTEGER,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_pilot_profiles_user_id ON pilot_profiles(user_id);
CREATE INDEX idx_pilot_profiles_verification ON pilot_profiles(verification_status);
CREATE INDEX idx_drones_pilot_id ON drones(pilot_id);
CREATE INDEX idx_drones_verification ON drones(verification_status);
CREATE INDEX idx_flights_pilot_id ON flights(pilot_id);
CREATE INDEX idx_flights_status ON flights(status);
CREATE INDEX idx_flights_start_time ON flights(start_time);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- STEP 5: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'pilot')::user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pilot_profiles_updated_at
  BEFORE UPDATE ON pilot_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_drones_updated_at
  BEFORE UPDATE ON drones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_flights_updated_at
  BEFORE UPDATE ON flights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Reviewers can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

-- Pilot profiles policies
CREATE POLICY "Pilots can view their own pilot profile"
  ON pilot_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Pilots can insert their own pilot profile"
  ON pilot_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pilots can update their own pilot profile"
  ON pilot_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Reviewers can view all pilot profiles"
  ON pilot_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

CREATE POLICY "Reviewers can update pilot profile verification"
  ON pilot_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

-- Drones policies
CREATE POLICY "Pilots can view their own drones"
  ON drones FOR SELECT
  TO authenticated
  USING (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pilots can insert their own drones"
  ON drones FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pilots can update their own drones"
  ON drones FOR UPDATE
  TO authenticated
  USING (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pilots can delete their own drones"
  ON drones FOR DELETE
  TO authenticated
  USING (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can view all drones"
  ON drones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

-- Flights policies
CREATE POLICY "Pilots can view their own flights"
  ON flights FOR SELECT
  TO authenticated
  USING (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pilots can insert their own flights"
  ON flights FOR INSERT
  TO authenticated
  WITH CHECK (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pilots can update their own flights"
  ON flights FOR UPDATE
  TO authenticated
  USING (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    pilot_id IN (
      SELECT id FROM pilot_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Reviewers can view all flights"
  ON flights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

CREATE POLICY "Reviewers can update flight status"
  ON flights FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Reviewers can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('air_defense', 'logistics', 'intelligent_account', 'admin')
    )
  );

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Zones policies
CREATE POLICY "Anyone can view active zones"
  ON zones FOR SELECT
  TO authenticated
  USING (status = 'active');

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
