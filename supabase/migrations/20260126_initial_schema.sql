-- =====================================================
-- Initial Schema for Appointment & Schedule System
-- Created: 2026-01-26
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'HOST', 'GUEST')),
  is_active BOOLEAN DEFAULT true,
  phone TEXT,
  specialty TEXT, -- For HOST only
  description TEXT, -- For HOST only
  address TEXT, -- For HOST only
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- =====================================================
-- 2. AVAILABILITY RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('WEEKLY', 'DAILY', 'CUSTOM')),
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour INTEGER NOT NULL CHECK (end_hour >= 0 AND end_hour <= 23),
  days_of_week TEXT, -- Format: 'MON,TUE,WED,THU,FRI'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_availability_rules_host ON public.availability_rules(host_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_active ON public.availability_rules(is_active);

-- Enable RLS
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Hosts can manage their own rules"
  ON public.availability_rules FOR ALL
  USING (auth.uid() = host_id);

CREATE POLICY "Anyone can view active rules"
  ON public.availability_rules FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 3. TIMESLOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.timeslots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.availability_rules(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeslots_host ON public.timeslots(host_id);
CREATE INDEX IF NOT EXISTS idx_timeslots_available ON public.timeslots(is_available);
CREATE INDEX IF NOT EXISTS idx_timeslots_start_time ON public.timeslots(start_time);
CREATE INDEX IF NOT EXISTS idx_timeslots_host_available ON public.timeslots(host_id, is_available);

-- Enable RLS
ALTER TABLE public.timeslots ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Hosts can manage their timeslots"
  ON public.timeslots FOR ALL
  USING (auth.uid() = host_id);

CREATE POLICY "Anyone can view available timeslots"
  ON public.timeslots FOR SELECT
  USING (is_available = true);

-- =====================================================
-- 4. APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timeslot_id UUID REFERENCES public.timeslots(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELED')),
  reason TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Business constraints
  CONSTRAINT different_users CHECK (host_id != guest_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_host ON public.appointments(host_id);
CREATE INDEX IF NOT EXISTS idx_appointments_guest ON public.appointments(guest_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_timeslot ON public.appointments(timeslot_id);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Guests can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts can update their appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Users can cancel their appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- =====================================================
-- 5. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'READ')),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON public.notifications(appointment_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'GUEST')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create user in public.users when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Auto-create notification when appointment status changes
CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify guest when status changes
  IF OLD.status != NEW.status THEN
    INSERT INTO public.notifications (recipient_id, type, appointment_id)
    VALUES (
      NEW.guest_id,
      CASE NEW.status
        WHEN 'CONFIRMED' THEN 'APPOINTMENT_CONFIRMED'
        WHEN 'CANCELED' THEN 'APPOINTMENT_CANCELED'
        ELSE 'APPOINTMENT_UPDATED'
      END,
      NEW.id
    );
    
    -- Also notify host
    INSERT INTO public.notifications (recipient_id, type, appointment_id)
    VALUES (
      NEW.host_id,
      CASE NEW.status
        WHEN 'CONFIRMED' THEN 'APPOINTMENT_CONFIRMED'
        WHEN 'CANCELED' THEN 'APPOINTMENT_CANCELED'
        ELSE 'APPOINTMENT_UPDATED'
      END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-notify on appointment update
CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_change();

-- =====================================================
-- 7. SEED DATA (Optional - for testing)
-- =====================================================

-- Comment out if you don't want seed data
/*
-- Create admin user (id must match auth.users)
INSERT INTO public.users (id, email, name, role)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'admin@appointment.com',
  'Admin User',
  'ADMIN'
) ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
