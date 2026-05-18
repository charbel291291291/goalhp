-- =====================================================================
-- BATTLE FIXES  (idempotent — safe to re-run)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Fixes:
--   (1) Race condition in finish_battle: add FOR UPDATE lock so two
--       simultaneous callers can't both award the win bonus.
--   (2) Duplicate answer prevention in submit_quiz_answer: add a
--       UNIQUE constraint + ON CONFLICT DO NOTHING so a retried RPC
--       call (network retry, double-tap, etc.) doesn't award points twice.
-- =====================================================================

-- ── 1. Unique constraint on quiz_battle_answers ───────────────────────
-- Required for ON CONFLICT DO NOTHING in submit_quiz_answer below.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_battle_answers_battle_user_question_unique'
  ) THEN
    ALTER TABLE quiz_battle_answers
    ADD CONSTRAINT quiz_battle_answers_battle_user_question_unique
    UNIQUE (battle_id, user_id, question_id);
  END IF;
END $$;

-- ── 2. submit_quiz_answer — add ON CONFLICT DO NOTHING ────────────────
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
  v_inserted BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Validate answer index
  IF p_selected_index < 0 OR p_selected_index > 3 THEN
    RETURN jsonb_build_object('error', 'Invalid answer index');
  END IF;

  -- Validate response time (cap at 15 s to prevent inflated speed bonuses)
  IF p_response_time_ms < 0 OR p_response_time_ms > 15000 THEN
    RETURN jsonb_build_object('error', 'Invalid response time');
  END IF;

  -- Get correct answer
  SELECT correct_answer_index INTO v_correct_index
  FROM quiz_questions WHERE id = p_question_id AND active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;

  v_is_correct := (p_selected_index = v_correct_index);

  -- Calculate points
  IF v_is_correct THEN
    v_points := 100;
    v_speed_bonus := GREATEST(0, (10000 - p_response_time_ms) / 100);
    v_points := v_points + v_speed_bonus;
  END IF;

  -- Get battle info
  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Battle not found');
  END IF;
  IF v_battle.status <> 'playing' THEN
    RETURN jsonb_build_object('error', 'Battle not in progress');
  END IF;
  IF v_battle.player_one <> v_user_id AND COALESCE(v_battle.player_two, '') <> v_user_id::text THEN
    RETURN jsonb_build_object('error', 'Not a participant in this battle');
  END IF;

  -- Insert answer — ON CONFLICT DO NOTHING prevents double-award on retries
  INSERT INTO quiz_battle_answers (
    battle_id, user_id, question_id,
    selected_answer_index, is_correct, response_time_ms, points_awarded
  )
  VALUES (
    p_battle_id, v_user_id, p_question_id,
    p_selected_index, v_is_correct, p_response_time_ms, v_points
  )
  ON CONFLICT (battle_id, user_id, question_id) DO NOTHING;

  -- Only update score if the row was freshly inserted
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted > 0 THEN
    IF v_battle.player_one = v_user_id THEN
      UPDATE quiz_battles SET
        player_one_score = player_one_score + v_points
      WHERE id = p_battle_id AND status = 'playing';
    ELSIF v_battle.player_two = v_user_id THEN
      UPDATE quiz_battles SET
        player_two_score = player_two_score + v_points
      WHERE id = p_battle_id AND status = 'playing';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_correct', v_is_correct,
    'points', v_points,
    'speed_bonus', v_speed_bonus,
    'streak_bonus', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. finish_battle — add FOR UPDATE to prevent double-award race ─────
CREATE OR REPLACE FUNCTION finish_battle(p_battle_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_battle RECORD;
  v_my_score INT;
  v_opponent_score INT;
  v_bonus INT := 0;
  v_perfect BOOLEAN := false;
  v_winner_id UUID;
  v_is_winner BOOLEAN := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- FOR UPDATE prevents two simultaneous callers from both awarding
  -- the win bonus (race condition when both players finish at the same time).
  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Battle not found');
  END IF;

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

  -- Perfect game bonus
  IF v_my_score >= 700 THEN
    v_bonus := v_bonus + 300;
    v_perfect := true;
  END IF;

  -- Win bonus
  IF v_my_score > v_opponent_score THEN
    v_bonus := v_bonus + 150;
    v_is_winner := true;
  END IF;

  -- Determine winner ID
  IF v_my_score > v_opponent_score THEN
    v_winner_id := v_user_id;
  ELSIF v_opponent_score > v_my_score THEN
    v_winner_id := CASE
      WHEN v_battle.player_one = v_user_id THEN v_battle.player_two
      ELSE v_battle.player_one
    END;
  END IF;

  -- Mark battle finished
  UPDATE quiz_battles SET
    status = 'finished',
    winner_id = COALESCE(v_winner_id, winner_id),
    player_one_score = CASE
      WHEN v_battle.player_one = v_user_id THEN v_my_score + v_bonus
      ELSE player_one_score
    END,
    player_two_score = CASE
      WHEN v_battle.player_two = v_user_id THEN v_my_score + v_bonus
      ELSE player_two_score
    END,
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

-- =====================================================================
-- DONE.
-- =====================================================================
