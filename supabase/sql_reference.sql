-- Quick Reference SQL for common operations

-- =====================================================
-- VIEW SCHEMA
-- =====================================================

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- View table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all hosts
SELECT * FROM users WHERE role = 'HOST' AND is_active = true;

-- Get available timeslots for a host
SELECT * FROM timeslots 
WHERE host_id = 'host-uuid-here' 
  AND is_available = true 
  AND start_time > NOW()
ORDER BY start_time;

-- Get appointments for a user
SELECT 
  a.*,
  h.name as host_name,
  g.name as guest_name,
  t.start_time,
  t.end_time
FROM appointments a
JOIN users h ON a.host_id = h.id
JOIN users g ON a.guest_id = g.id
LEFT JOIN timeslots t ON a.timeslot_id = t.id
WHERE a.guest_id = 'user-uuid-here' OR a.host_id = 'user-uuid-here'
ORDER BY t.start_time DESC;

-- =====================================================
-- TEST DATA
-- =====================================================

-- Create test host
INSERT INTO users (email, name, role, specialty, description)
VALUES (
  'dr.smith@hospital.com',
  'Dr. John Smith',
  'HOST',
  'Cardiology',
  '15 years experience in cardiology'
);

-- Create availability rule for host
INSERT INTO availability_rules (host_id, rule_type, start_hour, end_hour, days_of_week)
VALUES (
  'host-uuid-here',
  'WEEKLY',
  9,
  17,
  'MON,TUE,WED,THU,FRI'
);

-- =====================================================
-- CLEANUP (USE WITH CAUTION!)
-- =====================================================

-- Delete all data (keep schema)
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE timeslots CASCADE;
TRUNCATE TABLE availability_rules CASCADE;
-- TRUNCATE TABLE users CASCADE; -- Be careful!

-- Drop all tables (remove schema)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS appointments CASCADE;
-- DROP TABLE IF EXISTS timeslots CASCADE;
-- DROP TABLE IF EXISTS availability_rules CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
