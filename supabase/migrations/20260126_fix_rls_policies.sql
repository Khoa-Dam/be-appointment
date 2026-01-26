-- Fix infinite recursion in RLS policies
-- Run this AFTER the initial migration

-- Drop problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Recreate with simpler logic - allow authenticated users to view all users
-- (Later we'll add proper role checking in application layer)
CREATE POLICY "Authenticated users can view users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Alternative: If you want to keep admin-only access,
-- you need to store role in JWT metadata, not query users table
-- For now, we'll allow all authenticated users to view users
-- and handle role-based access in application code
