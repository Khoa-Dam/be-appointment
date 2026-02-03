-- =====================================================
-- COMPLETE SCHEMA RESET & MIGRATION
-- Drop old tables and recreate with new structure
-- =====================================================

-- =====================================================
-- 1. DROP ALL TABLES (CASCADE)
-- =====================================================
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.timeslots CASCADE;
DROP TABLE IF EXISTS public.availability_rules CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.specialties CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS check_patient_limit() CASCADE;
DROP FUNCTION IF EXISTS populate_appointment_denormalized_fields() CASCADE;

-- =====================================================
-- 2. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CREATE SPECIALTIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_specialties_name ON public.specialties(name);

-- RLS
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view specialties"
  ON public.specialties FOR SELECT
  USING (true);

-- Seed Data
INSERT INTO public.specialties (name, icon) VALUES
  ('Nội khoa', 'favorite'),
  ('Ngoại khoa', 'healing'),
  ('Nhi khoa', 'child_care'),
  ('Sản khoa', 'pregnant_woman'),
  ('Tim mạch', 'monitor_heart'),
  ('Da liễu', 'face'),
  ('Mắt', 'visibility'),
  ('Tai mũi họng', 'hearing'),
  ('Răng hàm mặt', 'dentistry'),
  ('Thần kinh', 'psychology')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. CREATE USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'HOST', 'GUEST')),
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  
  -- Doctor-specific fields
  title TEXT,
  specialty TEXT,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  description TEXT,
  address TEXT,
  price NUMERIC(10, 2),
  avatar TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_specialty ON public.users(specialty_id);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active users"
  ON public.users FOR SELECT
  USING (is_active = true OR auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE PATIENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_owner ON public.patients(owner_id);

-- RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own patients"
  ON public.patients FOR ALL
  USING (auth.uid() = owner_id);

-- Trigger for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Enforce max 5 patients per user
CREATE OR REPLACE FUNCTION check_patient_limit()
RETURNS TRIGGER AS $$
DECLARE
  patient_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO patient_count
  FROM public.patients
  WHERE owner_id = NEW.owner_id;
  
  IF TG_OP = 'INSERT' AND patient_count >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 patient profiles per user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_patient_limit
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION check_patient_limit();

-- =====================================================
-- 6. CREATE AVAILABILITY RULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('WEEKLY', 'DATE_RANGE', 'SPECIFIC_DATE')),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour INTEGER CHECK (end_hour >= 0 AND end_hour <= 23),
  days_of_week TEXT,
  specific_date DATE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_rules_host ON public.availability_rules(host_id);

-- RLS
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their own rules"
  ON public.availability_rules FOR ALL
  USING (auth.uid() = host_id);

CREATE POLICY "Anyone can view active rules"
  ON public.availability_rules FOR SELECT
  USING (is_active = true);

-- Trigger
CREATE TRIGGER update_availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. CREATE TIMESLOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.timeslots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.availability_rules(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeslots_host ON public.timeslots(host_id);
CREATE INDEX IF NOT EXISTS idx_timeslots_date ON public.timeslots(date);
CREATE INDEX IF NOT EXISTS idx_timeslots_available ON public.timeslots(is_available);

-- RLS
ALTER TABLE public.timeslots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their own timeslots"
  ON public.timeslots FOR ALL
  USING (auth.uid() = host_id);

CREATE POLICY "Anyone can view available timeslots"
  ON public.timeslots FOR SELECT
  USING (true);

-- Trigger
CREATE TRIGGER update_timeslots_updated_at
  BEFORE UPDATE ON public.timeslots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. CREATE APPOINTMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timeslot_id UUID REFERENCES public.timeslots(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  
  -- Denormalized fields (auto-populated by trigger)
  patient_name TEXT,
  doctor_name TEXT,
  phone TEXT,
  
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED')),
  cancel_reason TEXT,
  
  -- Payment fields
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  payment_method TEXT,
  payment_amount NUMERIC(10, 2),
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_host ON public.appointments(host_id);
CREATE INDEX IF NOT EXISTS idx_appointments_guest ON public.appointments(guest_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-populate denormalized fields
CREATE OR REPLACE FUNCTION populate_appointment_denormalized_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_patient_phone TEXT;
  v_doctor_name TEXT;
BEGIN
  -- Get patient info
  IF NEW.patient_id IS NOT NULL THEN
    SELECT name, phone INTO v_patient_name, v_patient_phone
    FROM public.patients
    WHERE id = NEW.patient_id;
    
    NEW.patient_name := v_patient_name;
    NEW.phone := v_patient_phone;
  END IF;
  
  -- Get doctor name
  SELECT name INTO v_doctor_name
  FROM public.users
  WHERE id = NEW.host_id;
  
  NEW.doctor_name := v_doctor_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_populate_appointment_fields
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION populate_appointment_denormalized_fields();

-- =====================================================
-- 9. CREATE NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- DONE! Schema is ready 🚀
-- =====================================================
