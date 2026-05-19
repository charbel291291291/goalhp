-- =====================================================================
-- Friends + Battle Invites: Tables + RPC Functions
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Tables

CREATE TABLE IF NOT EXISTS friendships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT friendships_unique UNIQUE (requester_id, addressee_id),
  CONSTRAINT friendships_status CHECK (status IN ('pending', 'accepted', 'rejected')),
  CONSTRAINT friendships_no_self CHECK (requester_id != addressee_id)
);

CREATE TABLE IF NOT EXISTS battles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mode       TEXT NOT NULL DEFAULT 'pvp',
  status     TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battle_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  battle_id    UUID REFERENCES battles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT battle_invites_status CHECK (status IN ('pending', 'accepted', 'declined'))
);

-- RLS

ALTER TABLE friendships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships_all"    ON friendships;
DROP POLICY IF EXISTS "battles_all"        ON battles;
DROP POLICY IF EXISTS "battle_invites_all" ON battle_invites;

CREATE POLICY "friendships_all" ON friendships
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "battles_all" ON battles
  FOR ALL USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "battle_invites_all" ON battle_invites
  FOR ALL USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- =====================================================================
-- RPC: get_friends
-- =====================================================================
CREATE OR REPLACE FUNCTION get_friends()
RETURNS TABLE(id UUID, username TEXT, avatar_url TEXT, status TEXT) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT
      CASE WHEN f.requester_id = v_user THEN f.addressee_id ELSE f.requester_id END,
      p.username,
      p.avatar_url,
      f.status
    FROM friendships f
    JOIN profiles p ON p.id = CASE WHEN f.requester_id = v_user THEN f.addressee_id ELSE f.requester_id END
    WHERE (f.requester_id = v_user OR f.addressee_id = v_user)
      AND f.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: get_pending_requests
-- =====================================================================
CREATE OR REPLACE FUNCTION get_pending_requests()
RETURNS TABLE(request_id UUID, requester_id UUID, username TEXT, avatar_url TEXT, created_at TIMESTAMPTZ) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT f.id, f.requester_id, p.username, p.avatar_url, f.created_at
    FROM friendships f
    JOIN profiles p ON p.id = f.requester_id
    WHERE f.addressee_id = v_user AND f.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: get_pending_invites
-- =====================================================================
CREATE OR REPLACE FUNCTION get_pending_invites()
RETURNS TABLE(invite_id UUID, from_user_id UUID, from_username TEXT, from_avatar TEXT, battle_id UUID, created_at TIMESTAMPTZ) AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT bi.id, bi.from_user_id, p.username, p.avatar_url, bi.battle_id, bi.created_at
    FROM battle_invites bi
    JOIN profiles p ON p.id = bi.from_user_id
    WHERE bi.to_user_id = v_user AND bi.status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: search_users
-- =====================================================================
CREATE OR REPLACE FUNCTION search_users(p_query TEXT)
RETURNS TABLE(id UUID, username TEXT, avatar_url TEXT, status TEXT) AS $$
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
      )
    FROM profiles p
    WHERE p.id != v_user
      AND p.username ILIKE '%' || p_query || '%'
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: send_friend_request
-- =====================================================================
CREATE OR REPLACE FUNCTION send_friend_request(p_username TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_target UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  SELECT id INTO v_target FROM profiles WHERE username = p_username;
  IF v_target IS NULL THEN RETURN jsonb_build_object('error', 'User not found'); END IF;
  IF v_target = v_user  THEN RETURN jsonb_build_object('error', 'Cannot add yourself'); END IF;
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (v_user, v_target, 'pending')
  ON CONFLICT ON CONSTRAINT friendships_unique DO NOTHING;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: respond_friend_request
-- =====================================================================
CREATE OR REPLACE FUNCTION respond_friend_request(p_request_id UUID, p_accept BOOLEAN)
RETURNS JSONB AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  UPDATE friendships
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END
  WHERE id = p_request_id AND addressee_id = v_user AND status = 'pending';
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: send_battle_invite
-- =====================================================================
CREATE OR REPLACE FUNCTION send_battle_invite(p_to_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user      UUID := auth.uid();
  v_battle_id UUID;
  v_invite_id UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  INSERT INTO battles (player1_id, player2_id, mode, status)
  VALUES (v_user, p_to_user_id, 'pvp', 'waiting')
  RETURNING id INTO v_battle_id;
  INSERT INTO battle_invites (from_user_id, to_user_id, battle_id, status)
  VALUES (v_user, p_to_user_id, v_battle_id, 'pending')
  RETURNING id INTO v_invite_id;
  RETURN jsonb_build_object('battle_id', v_battle_id, 'invite_id', v_invite_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: accept_battle_invite
-- =====================================================================
CREATE OR REPLACE FUNCTION accept_battle_invite(p_invite_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user      UUID := auth.uid();
  v_battle_id UUID;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  UPDATE battle_invites
  SET status = 'accepted'
  WHERE id = p_invite_id AND to_user_id = v_user AND status = 'pending'
  RETURNING battle_id INTO v_battle_id;
  IF v_battle_id IS NULL THEN RETURN jsonb_build_object('error', 'Invite not found'); END IF;
  UPDATE battles SET status = 'active' WHERE id = v_battle_id;
  RETURN jsonb_build_object('battle_id', v_battle_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- RPC: decline_battle_invite
-- =====================================================================
CREATE OR REPLACE FUNCTION decline_battle_invite(p_invite_id UUID)
RETURNS JSONB AS $$
DECLARE v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  UPDATE battle_invites
  SET status = 'declined'
  WHERE id = p_invite_id AND to_user_id = v_user;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- DONE. Friends + Battle Invite system is ready.
-- =====================================================================
