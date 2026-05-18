-- =====================================================================
-- MISSING RPC FUNCTIONS
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Paste the entire file and click "Run"
-- =====================================================================

-- ── 1. add_quiz_points ───────────────────────────────────────────────
-- Called by daily challenge and solo battle to credit points to the
-- current user's profile.
CREATE OR REPLACE FUNCTION add_quiz_points(p_points INT)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_new_xp  INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;
  IF p_points <= 0 THEN RETURN; END IF;

  UPDATE profiles SET
    points = points + p_points,
    xp     = xp     + p_points,
    level  = GREATEST(1, FLOOR(SQRT((xp + p_points)::NUMERIC / 100)) + 1)
  WHERE id = v_user_id
  RETURNING xp INTO v_new_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 2. record_daily_visit ────────────────────────────────────────────
-- Called once per day by the profile page to maintain login streaks.
-- Safe to call multiple times — only the first call per calendar day
-- has any effect.
CREATE OR REPLACE FUNCTION record_daily_visit()
RETURNS JSONB AS $$
DECLARE
  v_user_id      UUID;
  v_last_visit   DATE;
  v_today        DATE := CURRENT_DATE;
  v_streak       INT;
  v_points_bonus INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT streak, updated_at::DATE
  INTO v_streak, v_last_visit
  FROM profiles
  WHERE id = v_user_id;

  -- Already recorded today — do nothing
  IF v_last_visit = v_today THEN
    RETURN jsonb_build_object('streak', v_streak, 'bonus', 0, 'already_recorded', true);
  END IF;

  -- Consecutive day → extend streak; else reset to 1
  IF v_last_visit = v_today - INTERVAL '1 day' THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;

  -- Milestone streak bonuses
  IF v_streak % 7 = 0 THEN
    v_points_bonus := 500;   -- weekly milestone
  ELSIF v_streak % 3 = 0 THEN
    v_points_bonus := 100;   -- 3-day milestone
  END IF;

  UPDATE profiles SET
    streak     = v_streak,
    points     = points + v_points_bonus,
    xp         = xp     + v_points_bonus,
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'streak',  v_streak,
    'bonus',   v_points_bonus
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. vote_fan_poster ───────────────────────────────────────────────
-- Increments the vote count on a poster and awards the voter 10 pts.
-- One vote per user per poster (enforced by unique constraint below).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'poster_votes_poster_user_unique'
  ) THEN
    -- Create the votes table if it doesn't exist
    CREATE TABLE IF NOT EXISTS poster_votes (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      poster_id  UUID NOT NULL REFERENCES fan_posters(id) ON DELETE CASCADE,
      user_id    UUID NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE poster_votes
      ADD CONSTRAINT poster_votes_poster_user_unique UNIQUE (poster_id, user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION vote_fan_poster(p_poster_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Insert vote — silently skip if already voted
  INSERT INTO poster_votes (poster_id, user_id)
  VALUES (p_poster_id, v_user_id)
  ON CONFLICT (poster_id, user_id) DO NOTHING;

  IF FOUND THEN
    -- Increment poster vote count
    UPDATE fan_posters SET votes_count = votes_count + 1
    WHERE id = p_poster_id;

    -- Award 10 points to voter
    UPDATE profiles SET
      points = points + 10,
      xp     = xp     + 10
    WHERE id = v_user_id;

    RETURN jsonb_build_object('voted', true);
  END IF;

  RETURN jsonb_build_object('voted', false, 'reason', 'already_voted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 4. toggle_poster_reaction ────────────────────────────────────────
-- Adds or removes an emoji reaction on a poster.
-- Creates the poster_reactions table if it doesn't exist yet.
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

  -- Try to remove first
  DELETE FROM poster_reactions
  WHERE poster_id = p_poster_id
    AND user_id   = v_user_id
    AND reaction  = p_reaction;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted > 0 THEN
    RETURN jsonb_build_object('action', 'removed');
  END IF;

  -- Not found — insert
  INSERT INTO poster_reactions (poster_id, user_id, reaction)
  VALUES (p_poster_id, v_user_id, p_reaction)
  ON CONFLICT (poster_id, user_id, reaction) DO NOTHING;

  RETURN jsonb_build_object('action', 'added');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 5. report_poster ─────────────────────────────────────────────────
-- Saves a user report on a poster. Creates the table if needed.
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

  -- Auto-flag the poster if it gets 3+ reports
  UPDATE fan_posters SET status = 'flagged'
  WHERE id = p_poster_id
    AND (SELECT COUNT(*) FROM poster_reports WHERE poster_id = p_poster_id) >= 3;

  RETURN jsonb_build_object('reported', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- DONE. All 5 functions created.
-- =====================================================================
