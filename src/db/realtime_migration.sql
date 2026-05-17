-- Battle Queue for matchmaking
CREATE TABLE IF NOT EXISTS battle_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  mode TEXT NOT NULL DEFAULT '1v1',
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscription storage
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for battle_queue
ALTER TABLE battle_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own queue entries"
  ON battle_queue FOR ALL USING (user_id = auth.uid());

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- Updated submit_quiz_answer that handles both players
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
  v_battle RECORD;
  v_speed_bonus INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Get correct answer
  SELECT correct_answer_index INTO v_correct_index
  FROM quiz_questions WHERE id = p_question_id AND active = TRUE;

  v_is_correct := (p_selected_index = v_correct_index);

  -- Calculate points
  IF v_is_correct THEN
    v_points := 100;
    v_speed_bonus := GREATEST(0, (10000 - p_response_time_ms) / 100);
    v_points := v_points + v_speed_bonus;
  END IF;

  -- Get battle info
  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id;

  -- Insert answer
  INSERT INTO quiz_battle_answers (battle_id, user_id, question_id, selected_answer_index, is_correct, response_time_ms, points_awarded)
  VALUES (p_battle_id, v_user_id, p_question_id, p_selected_index, v_is_correct, p_response_time_ms, v_points);

  -- Update correct player's score
  IF v_battle.player_one = v_user_id THEN
    UPDATE quiz_battles SET
      player_one_score = player_one_score + v_points
    WHERE id = p_battle_id AND status = 'playing';
  ELSIF v_battle.player_two = v_user_id THEN
    UPDATE quiz_battles SET
      player_two_score = player_two_score + v_points
    WHERE id = p_battle_id AND status = 'playing';
  END IF;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points', v_points,
    'speed_bonus', v_speed_bonus,
    'streak_bonus', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated finish_battle that works for both players
CREATE OR REPLACE FUNCTION finish_battle(p_battle_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_battle RECORD;
  v_my_score INT;
  v_opponent_score INT;
  v_bonus INT := 0;
  v_perfect BOOLEAN := false;
  v_winner_id UUID;
  v_is_winner BOOLEAN;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id;

  -- Determine player scores based on who is calling
  IF v_battle.player_one = v_user_id THEN
    v_my_score := v_battle.player_one_score;
    v_opponent_score := v_battle.player_two_score;
  ELSIF v_battle.player_two = v_user_id THEN
    v_my_score := v_battle.player_two_score;
    v_opponent_score := v_battle.player_one_score;
  ELSE
    RETURN jsonb_build_object('error', 'Not part of this battle');
  END IF;

  IF v_my_score >= 700 THEN
    v_bonus := v_bonus + 300;
    v_perfect := true;
  END IF;

  IF v_my_score > v_opponent_score THEN
    v_bonus := v_bonus + 150;
    v_is_winner := true;
  END IF;

  -- Mark battle finished and set winner
  IF v_my_score > v_opponent_score THEN
    v_winner_id := v_user_id;
  ELSIF v_opponent_score > v_my_score THEN
    v_winner_id := CASE WHEN v_battle.player_one = v_user_id THEN v_battle.player_two ELSE v_battle.player_one END;
  END IF;

  UPDATE quiz_battles SET
    status = 'finished',
    winner_id = COALESCE(v_winner_id, winner_id),
    player_one_score = CASE WHEN v_battle.player_one = v_user_id THEN v_my_score + v_bonus ELSE player_one_score END,
    player_two_score = CASE WHEN v_battle.player_two = v_user_id THEN v_my_score + v_bonus ELSE player_two_score END,
    ended_at = NOW()
  WHERE id = p_battle_id;

  -- Award points to profile
  UPDATE profiles SET
    points = points + v_my_score + v_bonus,
    xp = xp + v_my_score + v_bonus,
    level = GREATEST(1, FLOOR(SQRT((xp + v_my_score + v_bonus) / 100)) + 1)
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'score', v_my_score + v_bonus,
    'bonus', v_bonus,
    'perfect', v_perfect,
    'winner', v_is_winner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join battle queue
CREATE OR REPLACE FUNCTION join_battle_queue(p_mode TEXT DEFAULT '1v1') RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_matched_id UUID;
  v_battle_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Remove any existing queue entry for this user
  DELETE FROM battle_queue WHERE user_id = v_user_id;

  -- Try to find a waiting opponent
  SELECT id INTO v_matched_id FROM battle_queue
  WHERE mode = p_mode AND status = 'waiting' AND user_id != v_user_id
  ORDER BY created_at ASC LIMIT 1;

  IF v_matched_id IS NOT NULL THEN
    -- Match found! Create battle
    INSERT INTO quiz_battles (mode, player_one, player_two, status, started_at)
    VALUES (p_mode, (SELECT user_id FROM battle_queue WHERE id = v_matched_id), v_user_id, 'playing', NOW())
    RETURNING id INTO v_battle_id;

    -- Mark queue entries as matched
    UPDATE battle_queue SET status = 'matched' WHERE id = v_matched_id;

    RETURN jsonb_build_object(
      'status', 'matched',
      'battle_id', v_battle_id,
      'player_one', (SELECT user_id FROM battle_queue WHERE id = v_matched_id),
      'player_two', v_user_id
    );
  ELSE
    -- No opponent, join queue
    INSERT INTO battle_queue (user_id, mode) VALUES (v_user_id, p_mode);
    RETURN jsonb_build_object('status', 'waiting');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leave battle queue
CREATE OR REPLACE FUNCTION leave_battle_queue() RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  DELETE FROM battle_queue WHERE user_id = v_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save push subscription
CREATE OR REPLACE FUNCTION save_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (v_user_id, p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (user_id) DO UPDATE SET
    endpoint = EXCLUDED.endpoint,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    updated_at = NOW();
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove push subscription
CREATE OR REPLACE FUNCTION remove_push_subscription() RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  DELETE FROM push_subscriptions WHERE user_id = v_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
