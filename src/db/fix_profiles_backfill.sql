-- =====================================================================
-- Fix: Backfill profiles missing username or created_at
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- 1. Add DEFAULT NOW() to created_at so future rows always get a date
ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT NOW();

-- 2. Backfill created_at for rows that are NULL (use auth.users.created_at as source of truth)
UPDATE public.profiles p
SET created_at = COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE p.id = au.id
  AND p.created_at IS NULL;

-- 3. Backfill username for rows where it is NULL.
--    Uses the email prefix + first 4 chars of user id for uniqueness.
UPDATE public.profiles p
SET username = split_part(au.email, '@', 1) || '_' || substr(p.id::text, 1, 4)
FROM auth.users au
WHERE p.id = au.id
  AND (p.username IS NULL OR trim(p.username) = '');

-- =====================================================================
-- DONE. Existing profiles now have a username and join date.
-- =====================================================================
