-- No changes needed - the is_available flag already handles visibility correctly:
-- - When appointment is created: is_available = false (slot is booked)
-- - When appointment is canceled: is_available = true (slot becomes available again)
-- 
-- The RLS policy "Anyone can view available timeslots" already prevents
-- guests from seeing booked slots, which is the correct behavior.

