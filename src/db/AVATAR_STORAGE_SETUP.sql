-- =====================================================================
-- AVATAR STORAGE + PROFILE UPDATE SETUP (idempotent — safe to re-run)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This fixes:
--   (1) "can't upload profile picture"   → creates the avatars bucket + policies
--   (2) "can't edit username/name"        → ensures the profiles UPDATE RLS policy exists
-- =====================================================================

-- 1) Create the public 'avatars' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 2) Drop any old conflicting policies so we can recreate cleanly
DROP POLICY IF EXISTS "Avatar images are publicly accessible"   ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"       ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"       ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"       ON storage.objects;

-- 3) Anyone (anon + authenticated) can READ avatar files (bucket is public)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 4) Authenticated users can upload to their own folder: avatars/{auth.uid()}/...
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5) Authenticated users can overwrite their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6) Authenticated users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =====================================================================
-- PROFILES TABLE — ensure users can update their own row
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================================
-- DONE. Reload the app and try editing your name / uploading a photo.
-- =====================================================================
