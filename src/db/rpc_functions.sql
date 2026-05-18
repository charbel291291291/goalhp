-- =====================================================================
-- MISSING RPC FUNCTIONS  (rpc.sql already has the others)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Paste this entire file and click Run
-- =====================================================================

-- ── 1. add_quiz_points ───────────────────────────────────────────────
-- Called by daily challenge and solo battle to credit points.
CREATE OR REPLACE FUNCTION add_quiz_points(p_points INT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;
  IF p_points <= 0 THEN RETURN; END IF;

  UPDATE profiles SET
    points = points + p_points,
    xp     = xp     + p_points,
    level  = GREATEST(1, FLOOR(SQRT((xp + p_points)::NUMERIC / 100)) + 1)
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. record_daily_visit ────────────────────────────────────────────
-- Called once per day by the profile page for streak tracking.
-- Safe to call multiple times — only the first call per day has effect.
CREATE OR REPLACE FUNCTION record_daily_visit()
RETURNS JSONB AS $$
DECLARE
  v_user_id    UUID;
  v_last_visit DATE;
  v_today      DATE := CURRENT_DATE;
  v_streak     INT;
  v_bonus      INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT streak, updated_at::DATE
  INTO v_streak, v_last_visit
  FROM profiles WHERE id = v_user_id;

  IF v_last_visit = v_today THEN
    RETURN jsonb_build_object('streak', v_streak, 'bonus', 0, 'already_recorded', true);
  END IF;

  IF v_last_visit = v_today - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;

  IF v_streak % 7 = 0 THEN v_bonus := 500;
  ELSIF v_streak % 3 = 0 THEN v_bonus := 100;
  END IF;

  UPDATE profiles SET
    streak     = v_streak,
    points     = points + v_bonus,
    xp         = xp     + v_bonus,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('streak', v_streak, 'bonus', v_bonus);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. toggle_poster_reaction ────────────────────────────────────────
-- Adds or removes an emoji reaction. Creates table if needed.
CREATE TABLE IF NOT EXISTS poster_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id  UUID NOT NULL REFERENCES fan_posters(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  reaction   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT poster_reactions_unique UNIQUE (poster_id, user_id, reaction)
);

CREATE OR REPLACE FUNCTION toggle_poster_reaction(
  p_poster_id UUID,
  p_reaction  TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_deleted INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  DELETE FROM poster_reactions
  WHERE poster_id = p_poster_id
    AND user_id   = v_user_id
    AND reaction  = p_reaction;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    RETURN jsonb_build_object('action', 'removed');
  END IF;

  INSERT INTO poster_reactions (poster_id, user_id, reaction)
  VALUES (p_poster_id, v_user_id, p_reaction)
  ON CONFLICT (poster_id, user_id, reaction) DO NOTHING;

  RETURN jsonb_build_object('action', 'added');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 4. report_poster ─────────────────────────────────────────────────
-- Saves a user report. Auto-flags the poster after 3 reports.
CREATE TABLE IF NOT EXISTS poster_reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id  UUID NOT NULL REFERENCES fan_posters(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION report_poster(
  p_poster_id UUID,
  p_reason    TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('error', 'Reason required');
  END IF;

  INSERT INTO poster_reports (poster_id, user_id, reason)
  VALUES (p_poster_id, v_user_id, trim(p_reason));

  UPDATE fan_posters SET status = 'flagged'
  WHERE id = p_poster_id
    AND (SELECT COUNT(*) FROM poster_reports WHERE poster_id = p_poster_id) >= 3;

  RETURN jsonb_build_object('reported', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- DONE. 4 functions + 2 tables created.
-- =====================================================================
