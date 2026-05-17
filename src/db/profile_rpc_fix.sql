-- Profile update helpers (SECURITY DEFINER bypasses RLS)
-- Run these in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_profile_field(p_field TEXT, p_value TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format('UPDATE profiles SET %I = $1 WHERE id = $2', p_field)
  USING p_value, auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION update_profile_field TO authenticated;
