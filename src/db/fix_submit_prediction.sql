-- =====================================================================
-- Fix: submit_prediction with correct parameter names
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

CREATE OR REPLACE FUNCTION submit_prediction(
  match_id               UUID,
  prediction_type        TEXT,
  predicted_winner_team_id       UUID    DEFAULT NULL,
  predicted_team_a_score         INT     DEFAULT NULL,
  predicted_team_b_score         INT     DEFAULT NULL,
  predicted_first_goal_team_id   UUID    DEFAULT NULL,
  predicted_total_goals_range    TEXT    DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_match   RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF prediction_type IS NULL OR trim(prediction_type) = '' THEN
    RETURN jsonb_build_object('error', 'Invalid prediction type');
  END IF;

  SELECT * INTO v_match FROM matches WHERE id = match_id FOR UPDATE;

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
    v_user_id, submit_prediction.match_id, submit_prediction.prediction_type,
    submit_prediction.predicted_winner_team_id,
    submit_prediction.predicted_team_a_score,
    submit_prediction.predicted_team_b_score,
    submit_prediction.predicted_first_goal_team_id,
    submit_prediction.predicted_total_goals_range
  )
  ON CONFLICT (user_id, match_id, prediction_type)
  DO UPDATE SET
    predicted_winner_team_id      = EXCLUDED.predicted_winner_team_id,
    predicted_team_a_score        = EXCLUDED.predicted_team_a_score,
    predicted_team_b_score        = EXCLUDED.predicted_team_b_score,
    predicted_first_goal_team_id  = EXCLUDED.predicted_first_goal_team_id,
    predicted_total_goals_range   = EXCLUDED.predicted_total_goals_range,
    locked = FALSE;

  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- DONE. Predictions will now save correctly.
-- =====================================================================
