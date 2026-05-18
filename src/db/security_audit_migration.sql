-- ============================================================
-- Security Audit Migration — run this against your existing DB
-- QuizGoal 2026 — generated 2026-05-18
-- Covers all CRITICAL and HIGH findings from the security audit.
-- ============================================================

-- ============================================================
-- CRITICAL-1: Drop privilege-escalation vector in update_profile_field
-- Replaces the unsafe dynamic EXECUTE (any caller could set role='admin')
-- with a hardcoded column allowlist.
-- ============================================================
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

-- ============================================================
-- CRITICAL-2: Remove anon grants on friends and battle_invites
-- ============================================================
REVOKE SELECT, INSERT, UPDATE ON friends        FROM anon;
REVOKE SELECT, INSERT, UPDATE ON battle_invites FROM anon;

-- ============================================================
-- CRITICAL-3 + HIGH-7: finish_battle — FOR UPDATE lock + score-based winner
-- FOR UPDATE prevents concurrent double-award race condition.
-- Winner is determined by score comparison, not call order.
-- Each player calls finish_battle to receive their own profile points.
-- ============================================================
CREATE OR REPLACE FUNCTION finish_battle(p_battle_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id        UUID;
  v_battle         RECORD;
  v_my_score       INT;
  v_opponent_score INT;
  v_bonus          INT := 0;
  v_perfect        BOOLEAN := false;
  v_winner_id      UUID;
  v_is_winner      BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Battle not found');
  END IF;

  IF v_battle.player_one = v_user_id THEN
    v_my_score       := v_battle.player_one_score;
    v_opponent_score := COALESCE(v_battle.player_two_score, 0);
  ELSIF v_battle.player_two = v_user_id THEN
    v_my_score       := v_battle.player_two_score;
    v_opponent_score := v_battle.player_one_score;
  ELSE
    RETURN jsonb_build_object('error', 'Not a participant in this battle');
  END IF;

  IF v_battle.status NOT IN ('playing', 'finished') THEN
    RETURN jsonb_build_object('error', 'Battle is not active');
  END IF;

  IF v_my_score >= 700 THEN
    v_bonus  := v_bonus + 300;
    v_perfect := true;
  END IF;

  IF v_battle.status = 'playing' THEN
    IF v_my_score > v_opponent_score THEN
      v_bonus     := v_bonus + 150;
      v_is_winner := true;
      v_winner_id := v_user_id;
    ELSIF v_opponent_score > v_my_score THEN
      v_winner_id := CASE
        WHEN v_battle.player_one = v_user_id THEN v_battle.player_two
        ELSE v_battle.player_one
      END;
    END IF;

    UPDATE quiz_battles SET
      status           = 'finished',
      winner_id        = v_winner_id,
      player_one_score = CASE WHEN player_one = v_user_id THEN v_my_score + v_bonus ELSE player_one_score END,
      player_two_score = CASE WHEN player_two = v_user_id THEN v_my_score + v_bonus ELSE player_two_score END,
      ended_at         = NOW()
    WHERE id = p_battle_id;
  ELSE
    v_is_winner := (v_battle.winner_id = v_user_id);
    IF v_is_winner THEN
      v_bonus := v_bonus + 150;
    END IF;
  END IF;

  UPDATE profiles SET
    points = points + v_my_score + v_bonus,
    xp     = xp + v_my_score + v_bonus,
    level  = GREATEST(1, FLOOR(SQRT((xp + v_my_score + v_bonus) / 100.0))::INT + 1)
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'score',   v_my_score + v_bonus,
    'bonus',   v_bonus,
    'perfect', v_perfect,
    'winner',  v_is_winner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CRITICAL-4: Fix report_arena_content — write to arena_reports, not poster_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS arena_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  post_id     UUID REFERENCES arena_posts(id)    ON DELETE SET NULL,
  comment_id  UUID REFERENCES arena_comments(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);
ALTER TABLE arena_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit reports" ON arena_reports;
DROP POLICY IF EXISTS "Admins can read reports"  ON arena_reports;

CREATE POLICY "Users can submit reports" ON arena_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can read reports" ON arena_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION report_arena_content(
  p_reason     TEXT,
  p_post_id    UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_post_id IS NULL AND p_comment_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Must specify post_id or comment_id');
  END IF;
  INSERT INTO arena_reports (reporter_id, post_id, comment_id, reason)
  VALUES (auth.uid(), p_post_id, p_comment_id, p_reason);
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HIGH-1: add_quiz_points — cap at 5000 to limit score inflation
-- ============================================================
CREATE OR REPLACE FUNCTION add_quiz_points(p_points INTEGER) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_capped  INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_points <= 0 THEN
    RETURN jsonb_build_object('error', 'Points must be positive');
  END IF;
  v_capped := LEAST(p_points, 5000);
  UPDATE profiles SET
    points = points + v_capped,
    xp     = xp + v_capped,
    level  = GREATEST(1, FLOOR(SQRT((xp + v_capped) / 100)) + 1)
  WHERE id = v_user_id
  RETURNING * INTO v_profile;
  PERFORM award_city_points(v_user_id, v_capped);
  RETURN jsonb_build_object('success', TRUE, 'points', v_profile.points, 'level', v_profile.level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HIGH-2: apply_points — defined (was missing), uses auth.uid() internally
-- ============================================================
CREATE OR REPLACE FUNCTION apply_points(p_mission_id UUID, p_points INTEGER) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_points <= 0 THEN
    RETURN jsonb_build_object('error', 'Points must be positive');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM user_missions
    WHERE mission_id = p_mission_id AND user_id = v_user_id AND completed = TRUE
  ) THEN
    RETURN jsonb_build_object('error', 'Mission not completed or not found');
  END IF;
  UPDATE profiles SET
    points = points + p_points,
    xp     = xp + p_points,
    level  = GREATEST(1, FLOOR(SQRT((xp + p_points) / 100.0))::INT + 1)
  WHERE id = v_user_id;
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HIGH-6: quiz_questions_public — view without correct_answer_index
-- Authenticated clients should use this view via the REST API;
-- correct answers are only accessible via the submit_quiz_answer RPC.
-- ============================================================
CREATE OR REPLACE VIEW quiz_questions_public AS
  SELECT id, category_id, question_en, question_ar, answers_en, answers_ar,
         difficulty, image_url, active
  FROM quiz_questions
  WHERE active = TRUE;
GRANT SELECT ON quiz_questions_public TO authenticated;

-- ============================================================
-- MEDIUM-1: Replace deprecated auth.role() with auth.uid() IS NOT NULL
-- ============================================================
DROP POLICY IF EXISTS "Authenticated insert"    ON poster_competition_entries;
DROP POLICY IF EXISTS "Users can insert messages" ON room_messages;
DROP POLICY IF EXISTS "System can insert titles"  ON user_titles;
DROP POLICY IF EXISTS "System can update streaks" ON arena_streaks;

CREATE POLICY "Authenticated insert" ON poster_competition_entries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert messages" ON room_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert titles" ON user_titles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update streaks" ON arena_streaks
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- LOW-9: search_users — add auth guard (was reachable by anon via SECURITY DEFINER)
-- ============================================================
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
