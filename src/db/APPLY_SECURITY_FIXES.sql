-- ============================================================
-- SECURITY FIXES MIGRATION — Run this against your existing DB
-- QuizGoal 2026 — generated 2026-05-15
-- ============================================================

-- ============================================================
-- 1. INDEXES — performance on FK and filter columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_team  ON profiles(favorite_team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_region         ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_points         ON profiles(points DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_battles_player_one ON quiz_battles(player_one);
CREATE INDEX IF NOT EXISTS idx_quiz_battles_player_two ON quiz_battles(player_two);
CREATE INDEX IF NOT EXISTS idx_quiz_battles_status     ON quiz_battles(status);

CREATE INDEX IF NOT EXISTS idx_quiz_battle_answers_battle_id ON quiz_battle_answers(battle_id);
CREATE INDEX IF NOT EXISTS idx_quiz_battle_answers_user_id   ON quiz_battle_answers(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active   ON quiz_questions(active);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id  ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_resolved ON predictions(resolved);

CREATE INDEX IF NOT EXISTS idx_fan_posters_user_id ON fan_posters(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_posters_status  ON fan_posters(status);
CREATE INDEX IF NOT EXISTS idx_fan_posters_votes   ON fan_posters(votes_count DESC);

CREATE INDEX IF NOT EXISTS idx_poster_votes_poster_id  ON poster_votes(poster_id);
CREATE INDEX IF NOT EXISTS idx_poster_votes_user_id    ON poster_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poster_votes_created_at ON poster_votes(created_at);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id    ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invited_id ON referrals(invited_id);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id   ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);

CREATE INDEX IF NOT EXISTS idx_matches_status  ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);

-- ============================================================
-- 2. RLS — fix app_settings (restrict anon access)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read settings"     ON app_settings;
DROP POLICY IF EXISTS "Admins can manage settings"   ON app_settings;

CREATE POLICY "Authenticated users can read public settings"
  ON app_settings FOR SELECT TO authenticated
  USING (key NOT LIKE 'private_%');

CREATE POLICY "Admins can read all settings"
  ON app_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage settings"
  ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 3. RLS — quiz_questions: require authentication to read
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read questions (without answers)" ON quiz_questions;
DROP POLICY IF EXISTS "Authenticated users can read questions"      ON quiz_questions;

CREATE POLICY "Authenticated users can read questions"
  ON quiz_questions FOR SELECT TO authenticated
  USING (active = TRUE);

-- ============================================================
-- 4. RLS — poster_votes: require authentication to vote
-- ============================================================
DROP POLICY IF EXISTS "Users can vote" ON poster_votes;

CREATE POLICY "Authenticated users can vote"
  ON poster_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. RPC — submit_quiz_answer (fix variable bug + add guards)
-- ============================================================
CREATE OR REPLACE FUNCTION submit_quiz_answer(
  p_battle_id UUID,
  p_question_id UUID,
  p_selected_index INT,
  p_response_time_ms INT
) RETURNS JSONB AS $$
DECLARE
  v_correct_index INT;
  v_is_correct    BOOLEAN;
  v_points        INT := 0;
  v_user_id       UUID;
  v_difficulty    TEXT;
  v_speed_bonus   INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF p_selected_index NOT BETWEEN 0 AND 3 THEN
    RETURN jsonb_build_object('error', 'Invalid answer index');
  END IF;

  IF p_response_time_ms < 0 THEN
    RETURN jsonb_build_object('error', 'Invalid response time');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM quiz_battles
    WHERE id = p_battle_id AND status = 'playing'
      AND (player_one = v_user_id OR player_two = v_user_id)
  ) THEN
    RETURN jsonb_build_object('error', 'Battle not found or not a participant');
  END IF;

  SELECT correct_answer_index, difficulty
    INTO v_correct_index, v_difficulty
    FROM quiz_questions WHERE id = p_question_id AND active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;

  v_is_correct := (p_selected_index = v_correct_index);  -- was v_selected_index (bug)

  IF v_is_correct THEN
    v_points := CASE v_difficulty
      WHEN 'easy'   THEN 100
      WHEN 'medium' THEN 150
      WHEN 'hard'   THEN 200
      ELSE 100
    END;
    v_speed_bonus := GREATEST(0, (10000 - p_response_time_ms) / 100);
    v_points := v_points + v_speed_bonus;
  END IF;

  INSERT INTO quiz_battle_answers (battle_id, user_id, question_id, selected_answer_index, is_correct, response_time_ms, points_awarded)
  VALUES (p_battle_id, v_user_id, p_question_id, p_selected_index, v_is_correct, p_response_time_ms, v_points)
  ON CONFLICT DO NOTHING;

  UPDATE quiz_battles SET player_one_score = player_one_score + v_points
    WHERE id = p_battle_id AND player_one = v_user_id AND status = 'playing';

  UPDATE quiz_battles SET player_two_score = player_two_score + v_points
    WHERE id = p_battle_id AND player_two = v_user_id AND status = 'playing';

  RETURN jsonb_build_object(
    'is_correct',   v_is_correct,
    'correct_index', v_correct_index,
    'points',       v_points,
    'speed_bonus',  v_speed_bonus,
    'streak_bonus', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. RPC — finish_battle (FOR UPDATE lock + score-based winner)
-- ============================================================
-- FOR UPDATE prevents concurrent double-award race condition.
-- Winner is determined by score, not by who calls first.
-- Each player must call finish_battle to receive their own profile points.
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

  -- Lock the row to prevent two concurrent callers from both seeing 'playing'
  -- and double-awarding points. The second caller proceeds after the first commits.
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
    -- First caller: determine winner by score, mark battle finished.
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
    -- Second caller: battle already finished by the other player.
    -- Still award this player's profile points; check the stored winner.
    v_is_winner := (v_battle.winner_id = v_user_id);
    IF v_is_winner THEN
      v_bonus := v_bonus + 150;
    END IF;
  END IF;

  -- Each player awards their own profile points independently.
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
-- 7. RPC — submit_prediction (FOR UPDATE prevents race condition)
-- ============================================================
CREATE OR REPLACE FUNCTION submit_prediction(
  p_match_id UUID,
  p_prediction_type TEXT,
  p_winner_team_id UUID DEFAULT NULL,
  p_team_a_score INT DEFAULT NULL,
  p_team_b_score INT DEFAULT NULL,
  p_first_goal_team_id UUID DEFAULT NULL,
  p_total_goals_range TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_match   RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF p_prediction_type IS NULL OR trim(p_prediction_type) = '' THEN
    RETURN jsonb_build_object('error', 'Invalid prediction type');
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = p_match_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF v_match.locked OR v_match.kickoff_at <= NOW() THEN
    RETURN jsonb_build_object('error', 'Match is locked for predictions');
  END IF;

  INSERT INTO predictions (
    user_id, match_id, prediction_type,
    predicted_winner_team_id, predicted_team_a_score, predicted_team_b_score,
    predicted_first_goal_team_id, predicted_total_goals_range
  ) VALUES (
    v_user_id, p_match_id, p_prediction_type,
    p_winner_team_id, p_team_a_score, p_team_b_score,
    p_first_goal_team_id, p_total_goals_range
  )
  ON CONFLICT (user_id, match_id, prediction_type) DO UPDATE SET
    predicted_winner_team_id     = EXCLUDED.predicted_winner_team_id,
    predicted_team_a_score       = EXCLUDED.predicted_team_a_score,
    predicted_team_b_score       = EXCLUDED.predicted_team_b_score,
    predicted_first_goal_team_id = EXCLUDED.predicted_first_goal_team_id,
    predicted_total_goals_range  = EXCLUDED.predicted_total_goals_range,
    locked = FALSE;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. RPC — resolve_prediction (admin only)
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_prediction(
  p_prediction_id UUID,
  p_points INT
) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_user_id   UUID;
BEGIN
  v_caller_id := auth.uid();

  IF (SELECT role FROM profiles WHERE id = v_caller_id) != 'admin' THEN
    RETURN jsonb_build_object('error', 'Unauthorized: admin only');
  END IF;

  IF p_points < 0 THEN
    RETURN jsonb_build_object('error', 'Points cannot be negative');
  END IF;

  UPDATE predictions SET points_awarded = p_points, resolved = TRUE
    WHERE id = p_prediction_id AND resolved = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Prediction not found or already resolved');
  END IF;

  SELECT user_id INTO v_user_id FROM predictions WHERE id = p_prediction_id;

  IF p_points > 0 THEN
    UPDATE profiles SET points = points + p_points, xp = xp + p_points WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. RPC — vote_poster (daily limit 20 votes/day)
-- ============================================================
CREATE OR REPLACE FUNCTION vote_poster(p_poster_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id    UUID;
  v_votes_today INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT COUNT(*) INTO v_votes_today
    FROM poster_votes
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '1 day';

  IF v_votes_today >= 20 THEN
    RETURN jsonb_build_object('error', 'Daily vote limit reached (20 votes/day)');
  END IF;

  INSERT INTO poster_votes (poster_id, user_id) VALUES (p_poster_id, v_user_id);
  UPDATE fan_posters SET votes_count = votes_count + 1 WHERE id = p_poster_id;
  UPDATE profiles SET points = points + 10, xp = xp + 10 WHERE id = v_user_id;

  RETURN jsonb_build_object('success', TRUE);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Already voted on this poster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. RPC — redeem_reward (FOR UPDATE prevents over-redemption)
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_reward(p_reward_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_reward  RECORD;
  v_points  INT;
  v_code    TEXT;
  v_qr      TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND active = TRUE FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Reward not found or inactive');
  END IF;

  IF v_reward.quantity <= 0 THEN
    RETURN jsonb_build_object('error', 'Out of stock');
  END IF;

  IF v_reward.expiry_date IS NOT NULL AND v_reward.expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'Reward has expired');
  END IF;

  SELECT points INTO v_points FROM profiles WHERE id = v_user_id;

  IF v_points < v_reward.points_required THEN
    RETURN jsonb_build_object('error', 'Not enough points');
  END IF;

  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || v_user_id::TEXT) FROM 1 FOR 8));
  v_qr   := 'quizgoal://redeem/' || v_code;

  UPDATE profiles SET points = points - v_reward.points_required WHERE id = v_user_id;
  UPDATE rewards  SET quantity = quantity - 1                        WHERE id = p_reward_id;

  INSERT INTO reward_redemptions (reward_id, user_id, code, qr_payload)
  VALUES (p_reward_id, v_user_id, v_code, v_qr);

  RETURN jsonb_build_object('success', TRUE, 'code', v_code, 'qr', v_qr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. RPC — generate_referral_reward (auth check + loop prevention)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_referral_reward(p_invited_id UUID) RETURNS JSONB AS $$
DECLARE
  v_caller_id   UUID;
  v_caller_role TEXT;
  v_inviter_id  UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_id != p_invited_id AND v_caller_role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT inviter_id INTO v_inviter_id
    FROM referrals WHERE invited_id = p_invited_id AND reward_given = FALSE;

  IF v_inviter_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No pending referral found');
  END IF;

  -- Prevent circular referral (A invited B, B then tries to claim A invited them)
  IF EXISTS (SELECT 1 FROM referrals WHERE invited_id = v_inviter_id AND inviter_id = p_invited_id) THEN
    RETURN jsonb_build_object('error', 'Circular referral detected');
  END IF;

  UPDATE profiles SET points = points + 200, xp = xp + 200 WHERE id = v_inviter_id;
  UPDATE profiles SET points = points + 100, xp = xp + 100 WHERE id = p_invited_id;
  UPDATE referrals SET reward_given = TRUE WHERE invited_id = p_invited_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. RPC — update_team_points / update_region_points (null guard)
-- ============================================================
CREATE OR REPLACE FUNCTION update_team_points() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.favorite_team_id IS NOT NULL THEN
    UPDATE teams SET total_points = (
      SELECT COALESCE(SUM(points), 0) FROM profiles WHERE favorite_team_id = NEW.favorite_team_id
    ) WHERE id = NEW.favorite_team_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_region_points() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.region IS NOT NULL THEN
    UPDATE regions SET total_points = (
      SELECT COALESCE(SUM(points), 0) FROM profiles WHERE region = NEW.region
    ) WHERE name_en = NEW.region;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 13. Shared level formula (single source of truth)
-- ============================================================
CREATE OR REPLACE FUNCTION compute_level(p_xp INT) RETURNS INT AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(p_xp / 100.0))::INT + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 14. Payment methods — store in DB, not source code
--     UPDATE the values below with your real details, then run.
--     After running, manage them directly in the Supabase table editor.
-- ============================================================
INSERT INTO app_settings (key, value, updated_at) VALUES (
  'payment_methods',
  '{
    "whish": {"label": "Whish",      "details": "REPLACE_WITH_WHISH_NUMBER", "icon": "📱"},
    "omt":   {"label": "OMT",        "details": "REPLACE_WITH_OMT_NAME",     "icon": "🏦"},
    "usdt":  {"label": "USDT (TRC20)","details": "REPLACE_WITH_USDT_WALLET", "icon": "₿"}
  }'::jsonb,
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
