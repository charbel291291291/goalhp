-- Friends System + Battle Invites for QuizGoal 2026

-- 1. Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- 2. Battle invites table
CREATE TABLE IF NOT EXISTS battle_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  battle_id UUID REFERENCES quiz_battles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_invites ENABLE ROW LEVEL SECURITY;

-- RLS: friends
CREATE POLICY "Users can read their own friend connections"
  ON friends FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON friends FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can respond to friend requests"
  ON friends FOR UPDATE
  USING (addressee_id = auth.uid());

-- RLS: battle_invites
CREATE POLICY "Users can read their own invites"
  ON battle_invites FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send invites"
  ON battle_invites FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can respond to invites"
  ON battle_invites FOR UPDATE
  USING (to_user_id = auth.uid());

-- RLS policies already enforce auth.uid() checks; no anon grants needed.
-- Granting to 'anon' was removed to reduce attack surface.


-- RPC: Search users by username
CREATE OR REPLACE FUNCTION search_users(p_query TEXT)
RETURNS TABLE(id UUID, username TEXT, avatar_url TEXT, is_friend TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    CASE
      WHEN f.id IS NOT NULL THEN f.status
      ELSE 'none'
    END::TEXT as is_friend
  FROM profiles p
  LEFT JOIN friends f ON
    (f.requester_id = auth.uid() AND f.addressee_id = p.id) OR
    (f.addressee_id = auth.uid() AND f.requester_id = p.id)
  WHERE
    p.id != auth.uid()
    AND p.username ILIKE '%' || p_query || '%'
  LIMIT 20;
END;
$$;

-- RPC: Send friend request
CREATE OR REPLACE FUNCTION send_friend_request(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
  existing_id UUID;
BEGIN
  SELECT id INTO target_id FROM profiles WHERE username = p_username;
  IF target_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  IF target_id = auth.uid() THEN
    RETURN jsonb_build_object('error', 'Cannot add yourself');
  END IF;
  SELECT id INTO existing_id FROM friends
    WHERE (requester_id = auth.uid() AND addressee_id = target_id)
       OR (addressee_id = auth.uid() AND requester_id = target_id);
  IF existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Already sent or friends');
  END IF;
  INSERT INTO friends (requester_id, addressee_id, status)
    VALUES (auth.uid(), target_id, 'pending');
  RETURN jsonb_build_object('success', true, 'friend_id', target_id);
END;
$$;

-- RPC: Respond to friend request
CREATE OR REPLACE FUNCTION respond_friend_request(p_request_id UUID, p_accept BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE friends
    SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END,
        updated_at = now()
    WHERE id = p_request_id AND addressee_id = auth.uid();
  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Get friends list
CREATE OR REPLACE FUNCTION get_friends()
RETURNS TABLE(friend_id UUID, username TEXT, avatar_url TEXT, status TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN f.requester_id = auth.uid() THEN f.addressee_id ELSE f.requester_id END,
    p.username,
    p.avatar_url,
    f.status
  FROM friends f
  JOIN profiles p ON
    (f.requester_id = auth.uid() AND p.id = f.addressee_id) OR
    (f.addressee_id = auth.uid() AND p.id = f.requester_id)
  WHERE f.status IN ('pending', 'accepted');
END;
$$;

-- RPC: Get pending friend requests (sent to me)
CREATE OR REPLACE FUNCTION get_pending_requests()
RETURNS TABLE(request_id UUID, requester_id UUID, username TEXT, avatar_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.requester_id, p.username, p.avatar_url, f.created_at
  FROM friends f
  JOIN profiles p ON p.id = f.requester_id
  WHERE f.addressee_id = auth.uid() AND f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;

-- RPC: Send battle invite (creates battle + invite)
CREATE OR REPLACE FUNCTION send_battle_invite(p_to_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  battle_id UUID;
  invite_id UUID;
BEGIN
  INSERT INTO quiz_battles (player_one, player_two, mode, status)
    VALUES (auth.uid(), p_to_user_id, 'friend', 'waiting')
    RETURNING id INTO battle_id;
  INSERT INTO battle_invites (from_user_id, to_user_id, battle_id, status)
    VALUES (auth.uid(), p_to_user_id, battle_id, 'pending')
    RETURNING id INTO invite_id;
  RETURN jsonb_build_object('success', true, 'battle_id', battle_id, 'invite_id', invite_id);
END;
$$;

-- RPC: Accept battle invite
CREATE OR REPLACE FUNCTION accept_battle_invite(p_invite_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_battle_id UUID;
BEGIN
  SELECT battle_id INTO v_battle_id FROM battle_invites WHERE id = p_invite_id AND to_user_id = auth.uid();
  IF v_battle_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invite not found');
  END IF;
  UPDATE battle_invites SET status = 'accepted' WHERE id = p_invite_id;
  UPDATE quiz_battles SET status = 'playing' WHERE id = v_battle_id;
  RETURN jsonb_build_object('success', true, 'battle_id', v_battle_id);
END;
$$;

-- RPC: Decline battle invite
CREATE OR REPLACE FUNCTION decline_battle_invite(p_invite_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE battle_invites SET status = 'declined' WHERE id = p_invite_id AND to_user_id = auth.uid();
  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Get pending battle invites (for current user)
CREATE OR REPLACE FUNCTION get_pending_invites()
RETURNS TABLE(invite_id UUID, from_user_id UUID, from_username TEXT, from_avatar TEXT, battle_id UUID, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT bi.id, bi.from_user_id, p.username, p.avatar_url, bi.battle_id, bi.created_at
  FROM battle_invites bi
  JOIN profiles p ON p.id = bi.from_user_id
  WHERE bi.to_user_id = auth.uid() AND bi.status = 'pending'
  ORDER BY bi.created_at DESC
  LIMIT 10;
END;
$$;
