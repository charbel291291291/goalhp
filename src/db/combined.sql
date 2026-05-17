-- ============================================================
-- QuizGoal 2026 — Full Database Setup
-- Run this entire script once in Supabase SQL Editor
-- Order: Schema → RLS → RPC Functions → Seed Data
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  favorite_team_id UUID,
  country TEXT,
  region TEXT,
  language TEXT DEFAULT 'en',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  points INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  group_name TEXT,
  fifa_code TEXT,
  flag_emoji TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#FFFFFF',
  total_points INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES quiz_categories(id),
  question_en TEXT NOT NULL,
  question_ar TEXT NOT NULL,
  answers_en JSONB NOT NULL,
  answers_ar JSONB NOT NULL,
  correct_answer_index INTEGER NOT NULL,
  explanation_en TEXT,
  explanation_ar TEXT,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode TEXT NOT NULL DEFAULT 'solo' CHECK (mode IN ('solo', '1v1', 'friend', 'daily', 'teamwar', 'bot')),
  player_one UUID REFERENCES profiles(id),
  player_two UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  player_one_score INTEGER DEFAULT 0,
  player_two_score INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_battle_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID REFERENCES quiz_battles(id),
  user_id UUID REFERENCES profiles(id),
  question_id UUID REFERENCES quiz_questions(id),
  selected_answer_index INTEGER,
  is_correct BOOLEAN,
  response_time_ms INTEGER,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_number INTEGER,
  stage TEXT NOT NULL DEFAULT 'group',
  group_name TEXT,
  team_a_id UUID REFERENCES teams(id),
  team_b_id UUID REFERENCES teams(id),
  kickoff_at TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  team_a_score INTEGER,
  team_b_score INTEGER,
  winner_team_id UUID REFERENCES teams(id),
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  match_id UUID REFERENCES matches(id),
  prediction_type TEXT NOT NULL,
  predicted_winner_team_id UUID REFERENCES teams(id),
  predicted_team_a_score INTEGER,
  predicted_team_b_score INTEGER,
  predicted_first_goal_team_id UUID REFERENCES teams(id),
  predicted_total_goals_range TEXT,
  points_awarded INTEGER DEFAULT 0,
  locked BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id, prediction_type)
);

CREATE TABLE fan_posters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),
  style TEXT,
  slogan TEXT,
  source_image_url TEXT,
  poster_url TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poster_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID REFERENCES fan_posters(id),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poster_id, user_id)
);

CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  whatsapp TEXT,
  instagram TEXT,
  location TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID REFERENCES sponsors(id),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  points_required INTEGER NOT NULL,
  quantity INTEGER DEFAULT 0,
  expiry_date DATE,
  terms_en TEXT,
  terms_ar TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id UUID REFERENCES rewards(id),
  user_id UUID REFERENCES profiles(id),
  code TEXT UNIQUE NOT NULL,
  qr_payload TEXT,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'redeemed', 'cancelled')),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  points_reward INTEGER NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  mission_id UUID REFERENCES missions(id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID REFERENCES profiles(id),
  invited_id UUID REFERENCES profiles(id) UNIQUE,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 2: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read teams" ON teams FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage teams" ON teams FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON quiz_categories FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins can manage categories" ON quiz_categories FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions (without answers)" ON quiz_questions FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins can manage questions" ON quiz_questions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE quiz_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own battles" ON quiz_battles FOR SELECT USING (player_one = auth.uid() OR player_two = auth.uid());
CREATE POLICY "Users can create battles" ON quiz_battles FOR INSERT WITH CHECK (player_one = auth.uid());
CREATE POLICY "Users can update own battles" ON quiz_battles FOR UPDATE USING (player_one = auth.uid() OR player_two = auth.uid());

ALTER TABLE quiz_battle_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own answers" ON quiz_battle_answers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own answers" ON quiz_battle_answers FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage matches" ON matches FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own predictions" ON predictions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own predictions" ON predictions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own predictions (before lock)" ON predictions FOR UPDATE USING (user_id = auth.uid() AND locked = FALSE);
CREATE POLICY "Admins can read all predictions" ON predictions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update predictions" ON predictions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE fan_posters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active posters" ON fan_posters FOR SELECT USING (status = 'active');
CREATE POLICY "Users can read own posters" ON fan_posters FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own posters" ON fan_posters FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own posters" ON fan_posters FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all posters" ON fan_posters FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE poster_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON poster_votes FOR SELECT USING (TRUE);
CREATE POLICY "Users can vote" ON poster_votes FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read regions" ON regions FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage regions" ON regions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sponsors" ON sponsors FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins can manage sponsors" ON sponsors FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active rewards" ON rewards FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins can manage rewards" ON rewards FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own redemptions" ON reward_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own redemptions" ON reward_redemptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can read all redemptions" ON reward_redemptions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update redemptions" ON reward_redemptions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read missions" ON missions FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins can manage missions" ON missions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own missions" ON user_missions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own missions" ON user_missions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own missions" ON user_missions FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own referrals" ON referrals FOR SELECT USING (inviter_id = auth.uid() OR invited_id = auth.uid());
CREATE POLICY "Users can create referrals" ON referrals FOR INSERT WITH CHECK (inviter_id = auth.uid());

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON app_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage settings" ON app_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PART 3: RPC FUNCTIONS
-- ============================================================

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
  SELECT correct_answer_index, difficulty INTO v_correct_index, v_difficulty
  FROM quiz_questions WHERE id = p_question_id AND active = TRUE;
  v_is_correct := (p_selected_index = v_correct_index);
  IF v_is_correct THEN
    v_points := 100;
    v_speed_bonus := GREATEST(0, (10000 - p_response_time_ms) / 100);
    v_points := v_points + v_speed_bonus;
  END IF;
  INSERT INTO quiz_battle_answers (battle_id, user_id, question_id, selected_answer_index, is_correct, response_time_ms, points_awarded)
  VALUES (p_battle_id, v_user_id, p_question_id, p_selected_index, v_is_correct, p_response_time_ms, v_points);
  UPDATE quiz_battles SET
    player_one_score = player_one_score + v_points
  WHERE id = p_battle_id AND player_one = v_user_id AND status = 'playing';
  RETURN jsonb_build_object('is_correct', v_is_correct, 'points', v_points, 'speed_bonus', v_speed_bonus, 'streak_bonus', 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION finish_battle(p_battle_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_battle RECORD;
  v_bonus INT := 0;
BEGIN
  v_user_id := auth.uid();
  SELECT * INTO v_battle FROM quiz_battles WHERE id = p_battle_id;
  IF v_battle.player_one_score >= 700 THEN
    v_bonus := v_bonus + 300;
  END IF;
  v_bonus := v_bonus + 150;
  UPDATE quiz_battles SET
    status = 'finished', winner_id = v_user_id,
    player_one_score = v_battle.player_one_score + v_bonus, ended_at = NOW()
  WHERE id = p_battle_id;
  UPDATE profiles SET
    points = points + v_battle.player_one_score + v_bonus,
    xp = xp + v_battle.player_one_score + v_bonus,
    level = GREATEST(1, FLOOR(SQRT((xp + v_battle.player_one_score + v_bonus) / 100)) + 1)
  WHERE id = v_user_id;
  RETURN jsonb_build_object('score', v_battle.player_one_score + v_bonus, 'bonus', v_bonus, 'perfect', v_battle.player_one_score >= 700);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_prediction(
  p_match_id UUID, p_prediction_type TEXT,
  p_winner_team_id UUID DEFAULT NULL, p_team_a_score INT DEFAULT NULL,
  p_team_b_score INT DEFAULT NULL, p_first_goal_team_id UUID DEFAULT NULL,
  p_total_goals_range TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_match RECORD;
BEGIN
  v_user_id := auth.uid();
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  IF v_match.locked OR v_match.kickoff_at <= NOW() THEN
    RETURN jsonb_build_object('error', 'Match is locked');
  END IF;
  INSERT INTO predictions (user_id, match_id, prediction_type, predicted_winner_team_id, predicted_team_a_score, predicted_team_b_score, predicted_first_goal_team_id, predicted_total_goals_range)
  VALUES (v_user_id, p_match_id, p_prediction_type, p_winner_team_id, p_team_a_score, p_team_b_score, p_first_goal_team_id, p_total_goals_range)
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

CREATE OR REPLACE FUNCTION resolve_prediction(p_prediction_id UUID, p_points INT) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  UPDATE predictions SET points_awarded = p_points, resolved = TRUE WHERE id = p_prediction_id;
  SELECT user_id INTO v_user_id FROM predictions WHERE id = p_prediction_id;
  UPDATE profiles SET points = points + p_points, xp = xp + p_points WHERE id = v_user_id;
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION vote_poster(p_poster_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  INSERT INTO poster_votes (poster_id, user_id) VALUES (p_poster_id, v_user_id);
  UPDATE fan_posters SET votes_count = votes_count + 1 WHERE id = p_poster_id;
  UPDATE profiles SET points = points + 10, xp = xp + 10 WHERE id = v_user_id;
  RETURN jsonb_build_object('success', TRUE);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'Already voted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION redeem_reward(p_reward_id UUID) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_reward RECORD;
  v_points INT;
  v_code TEXT;
  v_qr TEXT;
BEGIN
  v_user_id := auth.uid();
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND active = TRUE;
  IF v_reward.quantity <= 0 THEN
    RETURN jsonb_build_object('error', 'Out of stock');
  END IF;
  SELECT points INTO v_points FROM profiles WHERE id = v_user_id;
  IF v_points < v_reward.points_required THEN
    RETURN jsonb_build_object('error', 'Not enough points');
  END IF;
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  v_qr := 'quizgoal://redeem/' || v_code;
  UPDATE profiles SET points = points - v_reward.points_required WHERE id = v_user_id;
  UPDATE rewards SET quantity = quantity - 1 WHERE id = p_reward_id;
  INSERT INTO reward_redemptions (reward_id, user_id, code, qr_payload)
  VALUES (p_reward_id, v_user_id, v_code, v_qr);
  RETURN jsonb_build_object('success', TRUE, 'code', v_code, 'qr', v_qr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_team_points() RETURNS TRIGGER AS $$
BEGIN
  UPDATE teams SET total_points = (
    SELECT COALESCE(SUM(points), 0) FROM profiles WHERE favorite_team_id = NEW.favorite_team_id
  ) WHERE id = NEW.favorite_team_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_region_points() RETURNS TRIGGER AS $$
BEGIN
  UPDATE regions SET total_points = (
    SELECT COALESCE(SUM(points), 0) FROM profiles WHERE region = NEW.region
  ) WHERE name_en = NEW.region;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_referral_reward(p_invited_id UUID) RETURNS JSONB AS $$
DECLARE
  v_inviter_id UUID;
BEGIN
  SELECT inviter_id INTO v_inviter_id FROM referrals WHERE invited_id = p_invited_id;
  IF v_inviter_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No referral found');
  END IF;
  UPDATE profiles SET points = points + 200, xp = xp + 200 WHERE id = v_inviter_id;
  UPDATE profiles SET points = points + 100, xp = xp + 100 WHERE id = p_invited_id;
  UPDATE referrals SET reward_given = TRUE WHERE invited_id = p_invited_id;
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 4: SEED DATA
-- ============================================================

-- Groups & Teams
INSERT INTO teams (name_en, name_ar, group_name, fifa_code, flag_emoji, primary_color, secondary_color) VALUES
('Mexico', 'المكسيك', 'A', 'MEX', '🇲🇽', '#006847', '#CE1126'),
('South Africa', 'جنوب أفريقيا', 'A', 'RSA', '🇿🇦', '#007A4D', '#FFB612'),
('Korea Republic', 'كوريا الجنوبية', 'A', 'KOR', '🇰🇷', '#C60C30', '#003478'),
('Czechia', 'التشيك', 'A', 'CZE', '🇨🇿', '#11457E', '#D7141A'),
('Canada', 'كندا', 'B', 'CAN', '🇨🇦', '#FF0000', '#FFFFFF'),
('Bosnia and Herzegovina', 'البوسنة والهرسك', 'B', 'BIH', '🇧🇦', '#001B3D', '#FFD100'),
('Qatar', 'قطر', 'B', 'QAT', '🇶🇦', '#8C1B40', '#FFFFFF'),
('Switzerland', 'سويسرا', 'B', 'SUI', '🇨🇭', '#FF0000', '#FFFFFF'),
('Brazil', 'البرازيل', 'C', 'BRA', '🇧🇷', '#009739', '#FFDF00'),
('Morocco', 'المغرب', 'C', 'MAR', '🇲🇦', '#C1272D', '#006233'),
('Haiti', 'هايتي', 'C', 'HAI', '🇭🇹', '#00209F', '#D21034'),
('Scotland', 'اسكتلندا', 'C', 'SCO', '🏴\''\''\''\''', '#003876', '#FFFFFF'),
('USA', 'الولايات المتحدة', 'D', 'USA', '🇺🇸', '#3C3B6E', '#B22234'),
('Paraguay', 'باراغواي', 'D', 'PAR', '🇵🇾', '#D52B1E', '#0038A8'),
('Australia', 'أستراليا', 'D', 'AUS', '🇦🇺', '#00843D', '#FFCD00'),
('Türkiye', 'تركيا', 'D', 'TUR', '🇹🇷', '#E30A17', '#FFFFFF'),
('Germany', 'ألمانيا', 'E', 'GER', '🇩🇪', '#000000', '#DD0000'),
('Curaçao', 'كوراساو', 'E', 'CUW', '🇨🇼', '#003893', '#FED141'),
('Côte d''Ivoire', 'ساحل العاج', 'E', 'CIV', '🇨🇮', '#F77F00', '#009E60'),
('Ecuador', 'الإكوادور', 'E', 'ECU', '🇪🇨', '#FFD100', '#003893'),
('Netherlands', 'هولندا', 'F', 'NED', '🇳🇱', '#FF6600', '#FFFFFF'),
('Japan', 'اليابان', 'F', 'JPN', '🇯🇵', '#BC002D', '#FFFFFF'),
('Tunisia', 'تونس', 'F', 'TUN', '🇹🇳', '#E70013', '#FFFFFF'),
('Sweden', 'السويد', 'F', 'SWE', '🇸🇪', '#005B9F', '#FECC00'),
('Belgium', 'بلجيكا', 'G', 'BEL', '🇧🇪', '#FFD700', '#000000'),
('Egypt', 'مصر', 'G', 'EGY', '🇪🇬', '#C1272D', '#000000'),
('IR Iran', 'إيران', 'G', 'IRN', '🇮🇷', '#239F40', '#DA0000'),
('New Zealand', 'نيوزيلندا', 'G', 'NZL', '🇳🇿', '#000000', '#FFFFFF'),
('Spain', 'إسبانيا', 'H', 'ESP', '🇪🇸', '#C60B1E', '#FFC400'),
('Cabo Verde', 'الرأس الأخضر', 'H', 'CPV', '🇨🇻', '#003893', '#CF2027'),
('Saudi Arabia', 'السعودية', 'H', 'KSA', '🇸🇦', '#006C35', '#FFFFFF'),
('Uruguay', 'الأوروغواي', 'H', 'URU', '🇺🇾', '#0038A8', '#FFFFFF'),
('France', 'فرنسا', 'I', 'FRA', '🇫🇷', '#002395', '#FFFFFF'),
('Senegal', 'السنغال', 'I', 'SEN', '🇸🇳', '#00853F', '#FDEF42'),
('Iraq', 'العراق', 'I', 'IRQ', '🇮🇶', '#007A3D', '#CE1126'),
('Norway', 'النرويج', 'I', 'NOR', '🇳🇴', '#BA0C2F', '#FFFFFF'),
('Argentina', 'الأرجنتين', 'J', 'ARG', '🇦🇷', '#75AADB', '#FFFFFF'),
('Algeria', 'الجزائر', 'J', 'ALG', '🇩🇿', '#006633', '#FFFFFF'),
('Austria', 'النمسا', 'J', 'AUT', '🇦🇹', '#ED2939', '#FFFFFF'),
('Jordan', 'الأردن', 'J', 'JOR', '🇯🇴', '#CE1126', '#000000'),
('Portugal', 'البرتغال', 'K', 'POR', '🇵🇹', '#006600', '#FF0000'),
('Colombia', 'كولومبيا', 'K', 'COL', '🇨🇴', '#FCD116', '#003893'),
('Uzbekistan', 'أوزبكستان', 'K', 'UZB', '🇺🇿', '#1EB53A', '#0099B5'),
('Congo DR', 'الكونغو الديمقراطية', 'K', 'COD', '🇨🇩', '#007FFF', '#CE1126'),
('England', 'إنجلترا', 'L', 'ENG', '🏴\''\''\''\''', '#CF142B', '#FFFFFF'),
('Croatia', 'كرواتيا', 'L', 'CRO', '🇭🇷', '#FF0000', '#FFFFFF'),
('Ghana', 'غانا', 'L', 'GHA', '🇬🇭', '#006B3F', '#FCD20A'),
('Panama', 'بنما', 'L', 'PAN', '🇵🇦', '#00529F', '#CE1126');

-- Regions
INSERT INTO regions (name_en, name_ar) VALUES
('Beirut', 'بيروت'), ('Mount Lebanon', 'جبل لبنان'), ('Tripoli', 'طرابلس'),
('Saida', 'صيدا'), ('Tyre', 'صور'), ('Zahle', 'زحلة'),
('Nabatieh', 'النبطية'), ('Jounieh', 'جونيه'), ('Byblos', 'جبيل'),
('Baalbek', 'بعلبك'), ('Akkar', 'عكار'), ('Chouf', 'الشوف'),
('Aley', 'عاليه'), ('Metn', 'المتن'), ('Keserwan', 'كسروان'),
('Zgharta', 'زغرتا'), ('Batroun', 'البترون');

-- Quiz Categories
INSERT INTO quiz_categories (name_en, name_ar, slug, icon, sort_order) VALUES
('World Cup 2026 Teams', 'منتخبات كأس العالم 2026', 'wc2026-teams', '🏆', 1),
('World Cup History', 'تاريخ كأس العالم', 'wc-history', '📜', 2),
('Guess the Flag', 'خمن العلم', 'guess-flag', '🇺🇳', 3),
('Guess the Player', 'خمن اللاعب', 'guess-player', '⚽', 4),
('Stadiums', 'الملاعب', 'stadiums', '🏟️', 5),
('Arab Teams', 'المنتخبات العربية', 'arab-teams', '🌍', 6),
('African Teams', 'المنتخبات الأفريقية', 'african-teams', '🌍', 7),
('European Teams', 'المنتخبات الأوروبية', 'european-teams', '🌍', 8),
('South American Teams', 'منتخبات أمريكا الجنوبية', 'south-american-teams', '🌍', 9),
('Asian Teams', 'المنتخبات الآسيوية', 'asian-teams', '🌍', 10),
('Football Rules', 'قوانين كرة القدم', 'football-rules', '📋', 11),
('Famous Goals', 'أهداف شهيرة', 'famous-goals', '⚡', 12),
('Finals History', 'تاريخ النهائيات', 'finals-history', '👑', 13),
('Penalty Drama', 'دراما ركلات الجزاء', 'penalty-drama', '😱', 14),
('Captains and Legends', 'قادة وأساطير', 'captains-legends', '🌟', 15),
('Lebanese Fan Culture', 'ثقافة التشجيع اللبنانية', 'lebanese-fan-culture', '🇱🇧', 16);

-- Daily Missions
INSERT INTO missions (title_en, title_ar, mission_type, target_count, points_reward) VALUES
('Play 3 quiz battles', 'العب 3 تحديات', 'play_battles', 3, 100),
('Win 1 battle', 'اربح تحدياً واحداً', 'win_battle', 1, 150),
('Make 2 predictions', 'توقّع مباراتين', 'make_predictions', 2, 80),
('Create 1 fan poster', 'اصنع بوستراً واحداً', 'create_poster', 1, 120),
('Vote on 5 posters', 'صوّت على 5 بوسترات', 'vote_posters', 5, 60),
('Share 1 result', 'شارك نتيجة', 'share_result', 1, 50),
('Invite 1 friend', 'ادع صديقاً', 'invite_friend', 1, 200);

-- Sponsors
INSERT INTO sponsors (name, description, whatsapp, instagram, location) VALUES
('Café de Beyrouth', 'Premium Lebanese coffee experience', '+96111223344', '@cafedebeyrouth', 'Beirut'),
('Grill House', 'Best grilled meat in town', '+96122334455', '@grillhouse', 'Hamra'),
('Tech Zone', 'Mobile & accessories store', '+96133445566', '@techzone', 'Downtown'),
('Fashion Hub', 'Trendy clothing store', '+96144556677', '@fashionhub', 'Beirut');

-- Rewards
INSERT INTO rewards (sponsor_id, title_en, title_ar, description_en, description_ar, points_required, quantity, terms_en, terms_ar)
SELECT id, 'Free Lebanese Coffee', 'قهوة لبنانية مجانية', 'Get one free Lebanese coffee at Café de Beyrouth', 'احصل على قهوة لبنانية مجانية في Café de Beyrouth', 500, 50, 'Valid for one drink. Cannot be combined with other offers.', 'صالحة لمشروب واحد. لا يمكن دمجها مع عروض أخرى.'
FROM sponsors WHERE name = 'Café de Beyrouth';

INSERT INTO rewards (sponsor_id, title_en, title_ar, description_en, description_ar, points_required, quantity, terms_en, terms_ar)
SELECT id, '20% Off Mixed Grill', 'خصم 20% على المشاوي', 'Get 20% off on mixed grill platter at Grill House', 'احصل على خصم 20% على طبق المشاوي المختلطة في Grill House', 800, 30, 'Valid for dine-in only.', 'صالحة للطلب في المطعم فقط.'
FROM sponsors WHERE name = 'Grill House';

INSERT INTO rewards (sponsor_id, title_en, title_ar, description_en, description_ar, points_required, quantity, terms_en, terms_ar)
SELECT id, 'VIP Shopping Pass', 'بطاقة تسوق VIP', 'Get 30% off on all items at Fashion Hub', 'احصل على خصم 30% على جميع المنتجات في Fashion Hub', 1500, 20, 'Valid for one purchase. Minimum spend 100,000 LBP.', 'صالحة لعملية شراء واحدة. الحد الأدنى للشراء 100,000 ل.ل.'
FROM sponsors WHERE name = 'Fashion Hub';

INSERT INTO rewards (sponsor_id, title_en, title_ar, description_en, description_ar, points_required, quantity, terms_en, terms_ar)
SELECT id, 'Phone Accessories Pack', 'حقيبة إكسسوارات جوال', 'Get a premium phone accessories pack at Tech Zone', 'احصل على حقيبة إكسسوارات جوال بريميوم في Tech Zone', 2000, 15, 'Includes case, screen protector, and charger.', 'تشمل غطاء وواقي شاشة وشاحن.'
FROM sponsors WHERE name = 'Tech Zone';

-- App Settings
INSERT INTO app_settings (key, value) VALUES
('app_name', '"QuizGoal 2026"'),
('app_version', '"1.0.0"'),
('predictions_enabled', 'true'),
('team_war_enabled', 'true'),
('street_league_enabled', 'true'),
('maintenance_mode', 'false');
