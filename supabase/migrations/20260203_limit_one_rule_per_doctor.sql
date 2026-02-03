-- Update availability_rules: 1 rule per doctor limit
-- Run this migration to enforce single active rule per doctor

-- Function: Enforce max 1 active rule per doctor
CREATE OR REPLACE FUNCTION check_availability_rule_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_rule_count INTEGER;
BEGIN
  -- Count active rules for this doctor
  SELECT COUNT(*) INTO active_rule_count
  FROM public.availability_rules
  WHERE host_id = NEW.host_id
    AND is_active = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- If creating/updating to active and already have an active rule, reject
  IF TG_OP = 'INSERT' AND NEW.is_active = true AND active_rule_count >= 1 THEN
    RAISE EXCEPTION 'Doctor can only have 1 active availability rule. Please deactivate existing rule first.';
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.is_active = true AND active_rule_count >= 1 THEN
    RAISE EXCEPTION 'Doctor can only have 1 active availability rule. Please deactivate existing rule first.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_availability_rule_limit ON public.availability_rules;

-- Create trigger
CREATE TRIGGER enforce_availability_rule_limit
  BEFORE INSERT OR UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION check_availability_rule_limit();

-- Note: This allows doctors to have multiple rules but only 1 can be active at a time
-- To switch rules: deactivate old rule first, then activate new one
