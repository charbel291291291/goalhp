-- Secure RPC Functions

-- Submit quiz answer securely
CREATE OR REPLACE FUNCTION submit_quiz_answer(
  p_battle_id UUID,
  p_question_id UUID,
  p_selected_index INT,
  p_response_time_ms INT
) RETURNS JSONB AS $$
DECLARE
  v_correct_index INT;
  v_is_correct BOOLEAN;
  v_points INT := 0;
  v_user_id UUID;
  v_difficulty TEXT;
  v_speed_bonus INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Validate answer index is in bounds (0-3 for 4-choice questions)
  IF p_selected_index NOT BETWEEN 0 AND 3 THEN
    RETURN jsonb_build_object('error', 'Invalid answer index');
  END IF;

  -- Validate response time is positive
  IF p_response_time_ms < 0 THEN
    RETURN jsonb_build_object('error', 'Invalid response time');
  END IF;

  -- Verify caller is a participant in this battle
  IF NOT EXISTS (
    SELECT 1 FROM quiz_battles
    WHERE id = p_battle_id
      AND status = 'playing'
      AND (player_one = v_user_id OR player_two = v_user_id)
  ) THEN
    RETURN jsonb_build_object('error', 'Battle not found or not a participant');
  END IF;

  -- Get correct answer (answers are intentionally NOT returned here)
  SELECT correct_answer_index, difficulty INTO v_correct_index, v_difficulty
  FROM quiz_questions WHERE id = p_question_id AND active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;

  -- Use p_selected_index (not a separate variable) for comparison
  v_is_correct := (p_selected_index = v_correct_index);

  -- Calculate points
  IF v_is_correct THEN
    v_points := CASE v_difficulty
      WHEN 'easy'   THEN 100
      WHEN 'medium' THEN 150
      WHEN 'hard'   THEN 200
      ELSE 100
    END;
    -- Speed bonus: up to 100 extra points for instant answer
    v_speed_bonus := GREATEST(0, (10000 - p_response_time_ms) / 100);
    v_points := v_points + v_speed_bonus;
  END IF;

  -- Insert answer record
  INSERT INTO quiz_battle_answers (battle_id, user_id, question_id, selected_answer_index, is_correct, response_time_ms, points_awarded)
  VALUES (p_battle_id, v_user_id, p_question_id, p_selected_index, v_is_correct, p_response_time_ms, v_points)
  ON CONFLICT DO NOTHING;

  -- Update battle score for this player
  UPDATE quiz_battles SET
    player_one_score = player_one_score + v_points
  WHERE id = p_battle_id AND player_one = v_user_id AND status = 'playing';

  UPDATE quiz_battles SET
    player_two_score = player_two_score + v_points
  WHERE id = p_battle_id AND player_two = v_user_id AND status = 'playing';

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_index', v_correct_index,
    'points', v_points,
    'speed_bonus', v_speed_bonus,
    'streak_bonus', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Finish battle and award points
CREATE OR REPLACE FUNCTION finish_battle(p_battle_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_battle RECORD;
  v_score INT;
  v_bonus INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Battle not found');
  END IF;

  -- Verify the caller is a participant in the battle
  IF v_battle.player_one != v_user_id AND (v_battle.player_two IS NULL OR v_battle.player_two != v_user_id) THEN
    RETURN jsonb_build_object('error', 'Not a participant in this battle');
  END IF;

  -- Verify battle is in playing state (prevent double-finishing)
  IF v_battle.status != 'playing' THEN
    RETURN jsonb_build_object('error', 'Battle is not in playing state');
  END IF;

  -- Determine this caller's score
  v_score := CASE WHEN v_battle.player_one = v_user_id
    THEN v_battle.player_one_score
    ELSE v_battle.player_two_score
  END;

  -- Calculate bonuses
  IF v_score >= 700 THEN
    v_bonus := v_bonus + 300; -- Perfect battle
  END IF;
  v_bonus := v_bonus + 150; -- Completion bonus

  -- Mark battle finished
  UPDATE quiz_battles SET
    status = 'finished',
    winner_id = v_user_id,
    player_one_score = CASE WHEN player_one = v_user_id THEN player_one_score + v_bonus ELSE player_one_score END,
    player_two_score = CASE WHEN player_two = v_user_id THEN player_two_score + v_bonus ELSE player_two_score END,
    ended_at = NOW()
  WHERE id = p_battle_id;

  -- Award points to the finishing player's profile
  UPDATE profiles SET
    points = points + v_score + v_bonus,
    xp = xp + v_score + v_bonus,
    level = GREATEST(1, FLOOR(SQRT((xp + v_score + v_bonus) / 100.0))::INT + 1)
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'score', v_score + v_bonus,
    'bonus', v_bonus,
    'perfect', v_score >= 700
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit prediction (with FOR UPDATE to prevent race condition at match lock time)
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
  v_match RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Validate prediction_type is not empty
  IF p_prediction_type IS NULL OR trim(p_prediction_type) = '' THEN
    RETURN jsonb_build_object('error', 'Invalid prediction type');
  END IF;

  -- Lock the match row to prevent race condition at lock boundary
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
  )
  VALUES (
    v_user_id, p_match_id, p_prediction_type,
    p_winner_team_id, p_team_a_score, p_team_b_score,
    p_first_goal_team_id, p_total_goals_range
  )
  ON CONFLICT (user_id, match_id, prediction_type)
  DO UPDATE SET
    predicted_winner_team_id = EXCLUDED.predicted_winner_team_id,
    predicted_team_a_score = EXCLUDED.predicted_team_a_score,
    predicted_team_b_score = EXCLUDED.predicted_team_b_score,
    predicted_first_goal_team_id = EXCLUDED.predicted_first_goal_team_id,
    predicted_total_goals_range = EXCLUDED.predicted_total_goals_range,
    locked = FALSE;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve prediction and award points (ADMIN ONLY)
CREATE OR REPLACE FUNCTION resolve_prediction(
  p_prediction_id UUID,
  p_points INT
) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_user_id UUID;
BEGIN
  v_caller_id := auth.uid();

  -- Only admins may resolve predictions
  IF (SELECT role FROM profiles WHERE id = v_caller_id) != 'admin' THEN
    RETURN jsonb_build_object('error', 'Unauthorized: admin only');
  END IF;

  -- Validate points are non-negative
  IF p_points < 0 THEN
    RETURN jsonb_build_object('error', 'Points cannot be negative');
  END IF;

  UPDATE predictions SET
    points_awarded = p_points,
    resolved = TRUE
  WHERE id = p_prediction_id AND resolved = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Prediction not found or already resolved');
  END IF;

  SELECT user_id INTO v_user_id FROM predictions WHERE id = p_prediction_id;

  IF p_points > 0 THEN
    UPDATE profiles SET
      points = points + p_points,
      xp = xp + p_points
    WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vote on poster (unique constraint prevents double votes; daily limit prevents farming)
CREATE OR REPLACE FUNCTION vote_poster(p_poster_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_votes_today INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Enforce daily vote limit (max 20 votes per day per user)
  SELECT COUNT(*) INTO v_votes_today
  FROM poster_votes
  WHERE user_id = v_user_id
    AND created_at > NOW() - INTERVAL '1 day';

  IF v_votes_today >= 20 THEN
    RETURN jsonb_build_object('error', 'Daily vote limit reached (20 votes/day)');
  END IF;

  INSERT INTO poster_votes (poster_id, user_id) VALUES (p_poster_id, v_user_id);

  UPDATE fan_posters SET votes_count = votes_count + 1 WHERE id = p_poster_id;

  -- Award 10 points for voting
  UPDATE profiles SET points = points + 10, xp = xp + 10 WHERE id = v_user_id;

  RETURN jsonb_build_object('success', TRUE);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Already voted on this poster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redeem reward
CREATE OR REPLACE FUNCTION redeem_reward(p_reward_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_reward RECORD;
  v_points INT;
  v_code TEXT;
  v_qr TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Lock reward row to prevent over-redemption race condition
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND active = TRUE FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Reward not found or inactive');
  END IF;

  IF v_reward.quantity <= 0 THEN
    RETURN jsonb_build_object('error', 'Out of stock');
  END IF;

  SELECT points INTO v_points FROM profiles WHERE id = v_user_id;

  IF v_points < v_reward.points_required THEN
    RETURN jsonb_build_object('error', 'Not enough points');
  END IF;

  -- Check expiry
  IF v_reward.expiry_date IS NOT NULL AND v_reward.expiry_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'Reward has expired');
  END IF;

  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || v_user_id::TEXT) FROM 1 FOR 8));
  v_qr := 'quizgoal://redeem/' || v_code;

  UPDATE profiles SET points = points - v_reward.points_required WHERE id = v_user_id;
  UPDATE rewards SET quantity = quantity - 1 WHERE id = p_reward_id;

  INSERT INTO reward_redemptions (reward_id, user_id, code, qr_payload)
  VALUES (p_reward_id, v_user_id, v_code, v_qr);

  RETURN jsonb_build_object('success', TRUE, 'code', v_code, 'qr', v_qr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update team points trigger
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

-- Update region points trigger
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

-- Generate referral reward (caller must be the invited user; prevents circular referrals)
CREATE OR REPLACE FUNCTION generate_referral_reward(p_invited_id UUID) RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_inviter_id UUID;
  v_caller_role TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Only the invited user themselves (or an admin) may trigger this
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;
  IF v_caller_id != p_invited_id AND v_caller_role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT inviter_id INTO v_inviter_id FROM referrals
  WHERE invited_id = p_invited_id AND reward_given = FALSE;

  IF v_inviter_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No pending referral found');
  END IF;

  -- Prevent circular referral (A invited B, B cannot then invite A)
  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE invited_id = v_inviter_id AND inviter_id = p_invited_id
  ) THEN
    RETURN jsonb_build_object('error', 'Circular referral detected');
  END IF;

  -- Award inviter 200 points
  UPDATE profiles SET points = points + 200, xp = xp + 200 WHERE id = v_inviter_id;

  -- Award invited user 100 points
  UPDATE profiles SET points = points + 100, xp = xp + 100 WHERE id = p_invited_id;

  UPDATE referrals SET reward_given = TRUE WHERE invited_id = p_invited_id;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Shared level computation (single source of truth)
CREATE OR REPLACE FUNCTION compute_level(p_xp INT) RETURNS INT AS $$
BEGIN
  RETURN GREATEST(1, FLOOR(SQRT(p_xp / 100.0))::INT + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
