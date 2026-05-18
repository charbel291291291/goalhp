-- Profile update helpers (SECURITY DEFINER bypasses RLS)
-- Run these in Supabase SQL Editor

-- Hardcoded allowlist prevents privilege escalation via arbitrary column names.
-- The original dynamic EXECUTE approach allowed any caller to set role='admin'.
CREATE OR REPLACE FUNCTION update_profile_field(p_field TEXT, p_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_field NOT IN ('username', 'avatar_url', 'language', 'country', 'region', 'flag_emoji') THEN
    RAISE EXCEPTION 'update_profile_field: column % is not updatable', p_field;
  END IF;

  CASE p_field
    WHEN 'username'   THEN UPDATE profiles SET username   = p_value WHERE id = auth.uid();
    WHEN 'avatar_url' THEN UPDATE profiles SET avatar_url = p_value WHERE id = auth.uid();
    WHEN 'language'   THEN UPDATE profiles SET language   = p_value WHERE id = auth.uid();
    WHEN 'country'    THEN UPDATE profiles SET country    = p_value WHERE id = auth.uid();
    WHEN 'region'     THEN UPDATE profiles SET region     = p_value WHERE id = auth.uid();
    WHEN 'flag_emoji' THEN UPDATE profiles SET flag_emoji = p_value WHERE id = auth.uid();
    ELSE NULL;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION update_profile_field TO authenticated;
