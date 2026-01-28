-- Make timeslot_id required (NOT NULL) in appointments table
-- This ensures every appointment must have a timeslot

-- Step 1: Delete any existing appointments without timeslot_id (data cleanup)
DELETE FROM public.appointments
WHERE timeslot_id IS NULL;

-- Step 2: Alter the column to be NOT NULL
ALTER TABLE public.appointments
ALTER COLUMN timeslot_id SET NOT NULL;

-- Step 3: Update the foreign key constraint (optional but cleaner)
-- Drop old constraint and add new one with ON DELETE RESTRICT
ALTER TABLE public.appointments
DROP CONSTRAINT appointments_timeslot_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_timeslot_id_fkey
FOREIGN KEY (timeslot_id) REFERENCES public.timeslots(id) ON DELETE RESTRICT;
