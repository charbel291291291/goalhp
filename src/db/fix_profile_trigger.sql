-- =====================================================================
-- Fix: Auto-create profile row on user signup
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- 1. Function that creates a profile whenever a new auth.users row appears
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, language)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Trigger: fires after every INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: create profiles for any existing auth users who don't have one yet
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- DONE. Future signups automatically get a profile row.
-- Existing users without a profile have been backfilled.
-- =====================================================================
