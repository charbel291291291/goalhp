-- =====================================================================
-- FINAL_FIX.sql  —  Run this ONE file in Supabase SQL Editor
-- Fixes EVERYTHING: profile loading, username, user_code, avatar,
--                   username edit, friends search, join date
-- Safe to re-run (fully idempotent)
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE — ensure all columns exist with correct defaults
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.profiles
  ALTER COLUMN language SET DEFAULT 'en';

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE public.profiles
  ALTER COLUMN points SET DEFAULT 0;

ALTER TABLE public.profiles
  ALTER COLUMN xp SET DEFAULT 0;

ALTER TABLE public.profiles
  ALTER COLUMN level SET DEFAULT 1;

ALTER TABLE public.profiles
  ALTER COLUMN streak SET DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_code TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_code_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_code_unique UNIQUE (user_code);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 2. PROFILES RLS — drop every old policy variant and recreate clean
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop every possible old name
DROP POLICY IF EXISTS "Users can read all profiles"          ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone"    ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"         ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_select"                      ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"                      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"                      ON public.profiles;
DROP POLICY IF EXISTS "Allow public read"                    ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own"                     ON public.profiles;
DROP POLICY IF EXISTS "Allow update own"                     ON public.profiles;

-- Recreate clean
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────
-- 3. DB TRIGGER — create profile row on new signup
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_language TEXT;
BEGIN
  v_username := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
  v_language := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'language'), ''), 'en');

  IF v_username IS NULL THEN
    v_username := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, username, language, created_at)
  VALUES (NEW.id, v_username, v_language, NOW())
  ON CONFLICT (id) DO UPDATE
    SET username   = COALESCE(NULLIF(trim(EXCLUDED.username), ''), profiles.username),
        language   = COALESCE(NULLIF(trim(EXCLUDED.language), ''), profiles.language),
        created_at = COALESCE(profiles.created_at, NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────
-- 4. USER_CODE TRIGGER — auto-assign unique 6-digit code
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.assign_user_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_used BOOLEAN;
BEGIN
  IF NEW.user_code IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    v_code := LPAD((floor(random() * 900000) + 100000)::int::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = v_code) INTO v_used;
    EXIT WHEN NOT v_used;
  END LOOP;
  NEW.user_code := v_code;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_user_code ON public.profiles;
CREATE TRIGGER trg_assign_user_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_code();


-- ─────────────────────────────────────────────────────────────────────
-- 5. BACKFILL — fix existing rows
-- ─────────────────────────────────────────────────────────────────────

-- Fix null created_at
UPDATE public.profiles p
SET created_at = COALESCE(au.created_at, NOW())
FROM auth.users au
WHERE p.id = au.id AND p.created_at IS NULL;

-- Fix null/empty username
UPDATE public.profiles p
SET username = split_part(au.email, '@', 1) || '_' || substr(p.id::text, 1, 4)
FROM auth.users au
WHERE p.id = au.id
  AND (p.username IS NULL OR trim(p.username) = '');

-- Assign user_code to profiles that don't have one
DO $$
DECLARE
  r      RECORD;
  v_code TEXT;
  v_used BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE user_code IS NULL LOOP
    LOOP
      v_code := LPAD((floor(random() * 900000) + 100000)::int::text, 6, '0');
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_code = v_code) INTO v_used;
      EXIT WHEN NOT v_used;
    END LOOP;
    UPDATE public.profiles SET user_code = v_code WHERE id = r.id;
  END LOOP;
END $$;

-- Create profile rows for auth users that have none
INSERT INTO public.profiles (id, username, language, created_at)
SELECT
  au.id,
  COALESCE(NULLIF(trim(au.raw_user_meta_data->>'username'), ''), split_part(au.email, '@', 1)),
  COALESCE(NULLIF(trim(au.raw_user_meta_data->>'language'), ''), 'en'),
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- 6. AVATAR STORAGE
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"     ON storage.objects;
DROP POLICY IF EXISTS "avatars_select"                        ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert"                        ON storage.objects;
DROP POLICY IF EXISTS "avatars_update"                        ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete"                        ON storage.objects;

CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING      (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ─────────────────────────────────────────────────────────────────────
-- 7. FRIENDS FUNCTIONS (search by user_code + send request)
-- ─────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS search_users(text);
CREATE OR REPLACE FUNCTION search_users(p_query TEXT)
RETURNS TABLE(id UUID, username TEXT, avatar_url TEXT, status TEXT, user_code TEXT) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT
      p.id,
      p.username,
      p.avatar_url,
      COALESCE(
        (SELECT f.status FROM friendships f
         WHERE (f.requester_id = v_user AND f.addressee_id = p.id)
            OR (f.requester_id = p.id AND f.addressee_id = v_user)
         LIMIT 1),
        'none'
      ),
      p.user_code
    FROM public.profiles p
    WHERE p.id != v_user
      AND p.user_code = trim(p_query)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS send_friend_request(text);
CREATE OR REPLACE FUNCTION send_friend_request(p_user_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_target UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  SELECT id INTO v_target FROM public.profiles WHERE user_code = trim(p_user_code);
  IF v_target IS NULL THEN RETURN jsonb_build_object('error', 'Player not found'); END IF;
  IF v_target = v_user  THEN RETURN jsonb_build_object('error', 'Cannot add yourself'); END IF;
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (v_user, v_target, 'pending')
  ON CONFLICT ON CONSTRAINT friendships_unique DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- DONE.
-- =====================================================================
