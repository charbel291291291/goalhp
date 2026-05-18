-- QuizGoal 2026 — Arena Social Features
-- Arena Wall, Match Moments, Daily Hot Takes, Fan Titles, Arena Streak

-- ============================================================
-- 1. ARENA POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS arena_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('text', 'prediction', 'quiz_win', 'poster', 'match_reaction', 'moment', 'hot_take')),
  content TEXT NOT NULL,
  media_url TEXT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  country TEXT,
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_posts_created ON arena_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arena_posts_type ON arena_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_arena_posts_match ON arena_posts(match_id);
CREATE INDEX IF NOT EXISTS idx_arena_posts_team ON arena_posts(team_id);
CREATE INDEX IF NOT EXISTS idx_arena_posts_country ON arena_posts(country);

ALTER TABLE arena_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active posts" ON arena_posts
  FOR SELECT USING (status = 'active' OR (status = 'hidden' AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create posts" ON arena_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON arena_posts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. ARENA COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS arena_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES arena_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES arena_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reactions_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_comments_post ON arena_comments(post_id, created_at);

ALTER TABLE arena_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active comments" ON arena_comments
  FOR SELECT USING (status = 'active' OR (status = 'hidden' AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create comments" ON arena_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. ARENA REACTIONS (One Tap)
-- ============================================================
CREATE TABLE IF NOT EXISTS arena_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES arena_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES arena_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('goal', 'var', 'fire', 'shock', 'laugh', 'heart', 'trophy', 'agree', 'disagree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_reaction_per_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_arena_reactions_unique ON arena_reactions(user_id, COALESCE(post_id, '00000000-0000-0000-0000-000000000000'), COALESCE(comment_id, '00000000-0000-0000-0000-000000000000'), reaction);

ALTER TABLE arena_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions" ON arena_reactions FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own reactions" ON arena_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. MATCH MOMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS match_moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  moment_type TEXT NOT NULL CHECK (moment_type IN ('goal', 'var', 'penalty', 'red_card', 'half_time', 'full_time', 'shock')),
  comment TEXT,
  reactions_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_moments_match ON match_moments(match_id, created_at DESC);

ALTER TABLE match_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read moments" ON match_moments FOR SELECT USING (TRUE);
CREATE POLICY "Users can create moments" ON match_moments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. DAILY HOT TAKES
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_hot_takes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_en TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  choices JSONB NOT NULL,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_votes INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(active_date)
);

ALTER TABLE daily_hot_takes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hot takes" ON daily_hot_takes FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage hot takes" ON daily_hot_takes
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS hot_take_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hot_take_id UUID REFERENCES daily_hot_takes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  choice_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hot_take_id, user_id)
);

ALTER TABLE hot_take_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON hot_take_votes FOR SELECT USING (TRUE);
CREATE POLICY "Users can vote once" ON hot_take_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. FAN TITLES
-- ============================================================
CREATE TABLE IF NOT EXISTS fan_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  icon TEXT NOT NULL,
  min_posts INTEGER DEFAULT 0,
  min_comments INTEGER DEFAULT 0,
  min_reactions INTEGER DEFAULT 0,
  min_streak INTEGER DEFAULT 0,
  min_predictions INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE fan_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fan titles" ON fan_titles FOR SELECT USING (TRUE);

INSERT INTO fan_titles (name_en, name_ar, icon, min_posts, min_comments, min_reactions, min_streak, min_predictions, sort_order) VALUES
  ('New Fan', 'مشجع جديد', '🌱', 0, 0, 0, 0, 0, 1),
  ('Loud Fan', 'مشجع نشيط', '📢', 5, 3, 5, 0, 0, 2),
  ('Arena Star', 'نجم الساحة', '⭐', 20, 10, 20, 3, 0, 3),
  ('Prediction Beast', 'وحش التوقعات', '🔮', 10, 5, 10, 0, 20, 4),
  ('Top Voice', 'صوت مسموع', '🎙️', 30, 20, 50, 5, 0, 5),
  ('Quiz Legend', 'أسطورة التحديات', '🏆', 50, 30, 100, 7, 50, 6)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS user_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title_id UUID REFERENCES fan_titles(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);

ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user titles" ON user_titles FOR SELECT USING (TRUE);
CREATE POLICY "System can insert titles" ON user_titles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 7. ARENA STREAK
-- ============================================================
CREATE TABLE IF NOT EXISTS arena_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE arena_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read streaks" ON arena_streaks FOR SELECT USING (TRUE);
CREATE POLICY "System can update streaks" ON arena_streaks FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================
-- Run this separately in SQL Editor if avatars bucket doesn't exist:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- Then add policy:
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Authenticated can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ============================================================
-- 9. RPCs
-- ============================================================

-- Toggle arena reaction
CREATE OR REPLACE FUNCTION toggle_arena_reaction(p_reaction TEXT, p_post_id UUID DEFAULT NULL, p_comment_id UUID DEFAULT NULL) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_existing RECORD;
  v_target_id UUID;
  v_target_col TEXT;
BEGIN
  v_user_id := auth.uid();
  v_target_id := COALESCE(p_post_id, p_comment_id);
  v_target_col := CASE WHEN p_post_id IS NOT NULL THEN 'post_id' ELSE 'comment_id' END;

  SELECT * INTO v_existing FROM arena_reactions
  WHERE user_id = v_user_id
    AND COALESCE(post_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_post_id, '00000000-0000-0000-0000-000000000000')
    AND COALESCE(comment_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_comment_id, '00000000-0000-0000-0000-000000000000')
    AND reaction = p_reaction;

  IF FOUND THEN
    DELETE FROM arena_reactions WHERE id = v_existing.id;
    IF p_post_id IS NOT NULL THEN UPDATE arena_posts SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = p_post_id; END IF;
    IF p_comment_id IS NOT NULL THEN UPDATE arena_comments SET reactions_count = GREATEST(0, reactions_count - 1) WHERE id = p_comment_id; END IF;
    RETURN jsonb_build_object('action', 'removed', 'success', TRUE);
  ELSE
    INSERT INTO arena_reactions (post_id, comment_id, user_id, reaction)
    VALUES (p_post_id, p_comment_id, v_user_id, p_reaction);
    IF p_post_id IS NOT NULL THEN UPDATE arena_posts SET reactions_count = reactions_count + 1 WHERE id = p_post_id; END IF;
    IF p_comment_id IS NOT NULL THEN UPDATE arena_comments SET reactions_count = reactions_count + 1 WHERE id = p_comment_id; END IF;
    PERFORM update_arena_streak(v_user_id);
    RETURN jsonb_build_object('action', 'added', 'success', TRUE);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create arena post (rate-limited: max 10 posts per minute per user)
CREATE OR REPLACE FUNCTION create_arena_post(p_post_type TEXT, p_content TEXT, p_media_url TEXT DEFAULT NULL, p_match_id UUID DEFAULT NULL, p_team_id UUID DEFAULT NULL, p_country TEXT DEFAULT NULL) RETURNS JSONB AS $$
DECLARE
  v_user_id   UUID;
  v_post_id   UUID;
  v_recent    INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF char_length(p_content) > 2000 THEN
    RETURN jsonb_build_object('error', 'Content too long (max 2000 characters)');
  END IF;
  SELECT COUNT(*) INTO v_recent FROM arena_posts
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '1 minute';
  IF v_recent >= 10 THEN
    RETURN jsonb_build_object('error', 'Rate limit: max 10 posts per minute');
  END IF;
  INSERT INTO arena_posts (user_id, post_type, content, media_url, match_id, team_id, country)
  VALUES (v_user_id, p_post_type, p_content, p_media_url, p_match_id, p_team_id, p_country)
  RETURNING id INTO v_post_id;
  PERFORM update_arena_streak(v_user_id);
  RETURN jsonb_build_object('success', TRUE, 'post_id', v_post_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create arena comment (rate-limited: max 30 comments per minute per user)
CREATE OR REPLACE FUNCTION create_arena_comment(p_post_id UUID, p_content TEXT, p_parent_id UUID DEFAULT NULL) RETURNS JSONB AS $$
DECLARE
  v_user_id    UUID;
  v_comment_id UUID;
  v_recent     INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF char_length(p_content) > 1000 THEN
    RETURN jsonb_build_object('error', 'Comment too long (max 1000 characters)');
  END IF;
  SELECT COUNT(*) INTO v_recent FROM arena_comments
    WHERE user_id = v_user_id AND created_at > NOW() - INTERVAL '1 minute';
  IF v_recent >= 30 THEN
    RETURN jsonb_build_object('error', 'Rate limit: max 30 comments per minute');
  END IF;
  INSERT INTO arena_comments (post_id, user_id, content, parent_id)
  VALUES (p_post_id, v_user_id, p_content, p_parent_id)
  RETURNING id INTO v_comment_id;
  UPDATE arena_posts SET comments_count = comments_count + 1 WHERE id = p_post_id;
  PERFORM update_arena_streak(v_user_id);
  RETURN jsonb_build_object('success', TRUE, 'comment_id', v_comment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create match moment
CREATE OR REPLACE FUNCTION create_match_moment(p_match_id UUID, p_moment_type TEXT, p_comment TEXT DEFAULT NULL) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_moment_id UUID;
BEGIN
  v_user_id := auth.uid();
  INSERT INTO match_moments (match_id, user_id, moment_type, comment)
  VALUES (p_match_id, v_user_id, p_moment_type, p_comment)
  RETURNING id INTO v_moment_id;
  -- Also create arena post
  PERFORM create_arena_post('moment',
    p_comment,
    NULL,
    p_match_id,
    NULL,
    NULL
  );
  PERFORM update_arena_streak(v_user_id);
  RETURN jsonb_build_object('success', TRUE, 'moment_id', v_moment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vote on hot take
CREATE OR REPLACE FUNCTION vote_hot_take(p_hot_take_id UUID, p_choice_index INTEGER) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  INSERT INTO hot_take_votes (hot_take_id, user_id, choice_index)
  VALUES (p_hot_take_id, v_user_id, p_choice_index)
  ON CONFLICT (hot_take_id, user_id) DO UPDATE SET choice_index = EXCLUDED.choice_index;
  UPDATE daily_hot_takes SET total_votes = (SELECT COUNT(*) FROM hot_take_votes WHERE hot_take_id = p_hot_take_id) WHERE id = p_hot_take_id;
  PERFORM update_arena_streak(v_user_id);
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update arena streak
CREATE OR REPLACE FUNCTION update_arena_streak(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := v_today - 1;
  v_streak RECORD;
BEGIN
  SELECT * INTO v_streak FROM arena_streaks WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    INSERT INTO arena_streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (p_user_id, 1, 1, v_today);
  ELSIF v_streak.last_active_date = v_yesterday THEN
    UPDATE arena_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_active_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF v_streak.last_active_date < v_yesterday THEN
    UPDATE arena_streaks SET
      current_streak = 1,
      last_active_date = v_today,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Arena content reports table (separate from poster_reports to avoid FK violations)
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
CREATE POLICY "Users can submit reports" ON arena_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can read reports" ON arena_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Report post/comment (writes to arena_reports, not poster_reports)
CREATE OR REPLACE FUNCTION report_arena_content(p_reason TEXT, p_post_id UUID DEFAULT NULL, p_comment_id UUID DEFAULT NULL) RETURNS JSONB AS $$
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

-- Get user's current fan title
CREATE OR REPLACE FUNCTION get_user_fan_title(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_post_count INTEGER;
  v_comment_count INTEGER;
  v_reaction_count INTEGER;
  v_streak INTEGER;
  v_prediction_count INTEGER;
  v_title RECORD;
BEGIN
  SELECT COUNT(*) INTO v_post_count FROM arena_posts WHERE user_id = p_user_id AND status = 'active';
  SELECT COUNT(*) INTO v_comment_count FROM arena_comments WHERE user_id = p_user_id AND status = 'active';
  SELECT COUNT(*) INTO v_reaction_count FROM arena_reactions WHERE user_id = p_user_id;
  SELECT COALESCE(current_streak, 0) INTO v_streak FROM arena_streaks WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_prediction_count FROM predictions WHERE user_id = p_user_id;

  SELECT * INTO v_title FROM fan_titles
  WHERE min_posts <= v_post_count
    AND min_comments <= v_comment_count
    AND min_reactions <= v_reaction_count
    AND min_streak <= v_streak
    AND min_predictions <= v_prediction_count
  ORDER BY sort_order DESC
  LIMIT 1;

  IF v_title.id IS NULL THEN
    SELECT * INTO v_title FROM fan_titles ORDER BY sort_order LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'title_en', v_title.name_en,
    'title_ar', v_title.name_ar,
    'icon', v_title.icon,
    'posts', v_post_count,
    'comments', v_comment_count,
    'reactions', v_reaction_count,
    'streak', v_streak,
    'predictions', v_prediction_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
