-- Fix the request number trigger to handle both NULL and empty string values
-- This migration fixes the issue where the trigger only checked for NULL
-- but applications were sending empty strings, causing constraint violations

CREATE OR REPLACE FUNCTION public.set_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for both NULL and empty string values
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := public.generate_request_number();
  END IF;
  RETURN NEW;
END;
$$;

-- No need to recreate the trigger, just updating the function
-- The existing trigger will use the updated function automatically