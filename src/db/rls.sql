-- QuizGoal 2026 RLS Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read teams"
  ON teams FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Quiz Categories
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON quiz_categories FOR SELECT USING (active = TRUE);

CREATE POLICY "Admins can manage categories"
  ON quiz_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Quiz Questions
-- correct_answer_index is excluded from the public view below.
-- Authenticated users should read through quiz_questions_public.
-- Admins (and server-side RPCs with SECURITY DEFINER) access the base table directly.
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read questions"
  ON quiz_questions FOR SELECT TO authenticated USING (active = TRUE);

-- Public view strips the answer column so it cannot be scraped via the REST API.
CREATE OR REPLACE VIEW quiz_questions_public AS
  SELECT id, category_id, question_en, question_ar, answers_en, answers_ar,
         difficulty, image_url, active
  FROM quiz_questions
  WHERE active = TRUE;
GRANT SELECT ON quiz_questions_public TO authenticated;

CREATE POLICY "Admins can manage questions"
  ON quiz_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Quiz Battles
ALTER TABLE quiz_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own battles"
  ON quiz_battles FOR SELECT USING (
    player_one = auth.uid() OR player_two = auth.uid()
  );

CREATE POLICY "Users can create battles"
  ON quiz_battles FOR INSERT WITH CHECK (player_one = auth.uid());

CREATE POLICY "Users can update own battles"
  ON quiz_battles FOR UPDATE USING (
    player_one = auth.uid() OR player_two = auth.uid()
  );

-- Quiz Battle Answers
ALTER TABLE quiz_battle_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own answers"
  ON quiz_battle_answers FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own answers"
  ON quiz_battle_answers FOR INSERT WITH CHECK (user_id = auth.uid());

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matches"
  ON matches FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Predictions
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own predictions"
  ON predictions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own predictions"
  ON predictions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own predictions (before lock)"
  ON predictions FOR UPDATE USING (
    user_id = auth.uid() AND locked = FALSE
  );

CREATE POLICY "Admins can read all predictions"
  ON predictions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update predictions"
  ON predictions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fan Posters
ALTER TABLE fan_posters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active posters"
  ON fan_posters FOR SELECT USING (status = 'active');

CREATE POLICY "Users can read own posters"
  ON fan_posters FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own posters"
  ON fan_posters FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posters"
  ON fan_posters FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all posters"
  ON fan_posters FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Poster Votes
ALTER TABLE poster_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes"
  ON poster_votes FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can vote"
  ON poster_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Regions
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read regions"
  ON regions FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage regions"
  ON regions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Sponsors
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sponsors"
  ON sponsors FOR SELECT USING (active = TRUE);

CREATE POLICY "Admins can manage sponsors"
  ON sponsors FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active rewards"
  ON rewards FOR SELECT USING (active = TRUE);

CREATE POLICY "Admins can manage rewards"
  ON rewards FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reward Redemptions
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions"
  ON reward_redemptions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own redemptions"
  ON reward_redemptions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all redemptions"
  ON reward_redemptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update redemptions"
  ON reward_redemptions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Missions
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read missions"
  ON missions FOR SELECT USING (active = TRUE);

CREATE POLICY "Admins can manage missions"
  ON missions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User Missions
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own missions"
  ON user_missions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own missions"
  ON user_missions FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own missions"
  ON user_missions FOR INSERT WITH CHECK (user_id = auth.uid());

-- Referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals"
  ON referrals FOR SELECT USING (inviter_id = auth.uid() OR invited_id = auth.uid());

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT WITH CHECK (inviter_id = auth.uid());

-- App Settings
-- Only authenticated users can read settings; private_ prefix keys are admin-only.
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read public settings"
  ON app_settings FOR SELECT TO authenticated USING (key NOT LIKE 'private_%');

CREATE POLICY "Admins can read all settings"
  ON app_settings FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage settings"
  ON app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
