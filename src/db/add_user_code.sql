-- =====================================================================
-- Add user_code: unique 6-digit player ID for friend searches
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- 1. Add the column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_code TEXT;

-- 2. Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_code_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_code_unique UNIQUE (user_code);
  END IF;
END $$;

-- 3. Backfill existing profiles with unique 6-digit codes
DO $$
DECLARE
  r      RECORD;
  v_code TEXT;
  v_used BOOLEAN;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE user_code IS NULL LOOP
    LOOP
      v_code := LPAD((floor(random() * 900000) + 100000)::int::text, 6, '0');
      SELECT EXISTS(SELECT 1 FROM profiles WHERE user_code = v_code) INTO v_used;
      EXIT WHEN NOT v_used;
    END LOOP;
    UPDATE profiles SET user_code = v_code WHERE id = r.id;
  END LOOP;
END $$;

-- 4. Trigger: auto-assign a code to new profiles
CREATE OR REPLACE FUNCTION assign_user_code()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
  v_used BOOLEAN;
BEGIN
  IF NEW.user_code IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    v_code := LPAD((floor(random() * 900000) + 100000)::int::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM profiles WHERE user_code = v_code) INTO v_used;
    EXIT WHEN NOT v_used;
  END LOOP;
  NEW.user_code := v_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_user_code ON profiles;
CREATE TRIGGER trg_assign_user_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_user_code();

-- 5. Update search_users: exact match on user_code
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
    FROM profiles p
    WHERE p.id != v_user
      AND p.user_code = trim(p_query)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update send_friend_request: accept user_code instead of username
DROP FUNCTION IF EXISTS send_friend_request(text);
CREATE OR REPLACE FUNCTION send_friend_request(p_user_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_target UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  SELECT id INTO v_target FROM profiles WHERE user_code = trim(p_user_code);
  IF v_target IS NULL THEN RETURN jsonb_build_object('error', 'Player not found'); END IF;
  IF v_target = v_user  THEN RETURN jsonb_build_object('error', 'Cannot add yourself'); END IF;
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (v_user, v_target, 'pending')
  ON CONFLICT ON CONSTRAINT friendships_unique DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- DONE. Every profile now has a unique 6-digit user_code.
-- =====================================================================
