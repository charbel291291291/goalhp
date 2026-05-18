-- QuizGoal 2026 — Features Migration
-- Poster Battles, Reactions, Match Rooms, Arab Fan Cup, City League, Café Zones

-- ============================================================
-- 1. POSTER REPORTS (proper table)
-- ============================================================
CREATE TABLE IF NOT EXISTS poster_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID REFERENCES fan_posters(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'action_taken')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poster_id, reporter_id)
);

ALTER TABLE poster_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON poster_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON poster_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- 2. POSTER COMPETITIONS (daily / weekly battles)
-- ============================================================
CREATE TABLE IF NOT EXISTS poster_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  competition_type TEXT NOT NULL CHECK (competition_type IN ('daily', 'weekly', 'monthly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'voting', 'finished')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  winner_poster_id UUID REFERENCES fan_posters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE poster_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read competitions" ON poster_competitions FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage competitions" ON poster_competitions
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS poster_competition_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID REFERENCES poster_competitions(id) ON DELETE CASCADE,
  poster_id UUID REFERENCES fan_posters(id) ON DELETE CASCADE,
  votes_count INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, poster_id)
);

ALTER TABLE poster_competition_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read entries" ON poster_competition_entries FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated insert" ON poster_competition_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. REACTIONS (emoji on posters)
-- ============================================================
CREATE TABLE IF NOT EXISTS poster_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID REFERENCES fan_posters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poster_id, user_id, reaction)
);

ALTER TABLE poster_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reactions" ON poster_reactions FOR SELECT USING (TRUE);
CREATE POLICY "Users manage own reactions" ON poster_reactions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. MATCH ROOMS (live chat per match)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  is_live BOOLEAN DEFAULT FALSE,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE match_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read match rooms" ON match_rooms FOR SELECT USING (TRUE);

CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES match_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read room messages" ON room_messages FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert messages" ON room_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 5. COUNTRIES (Arab Fan Cup)
-- ============================================================
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  flag_emoji TEXT,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  active BOOLEAN DEFAULT TRUE
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read countries" ON countries FOR SELECT USING (TRUE);

INSERT INTO countries (name_en, name_ar, flag_emoji) VALUES
  ('Lebanon', 'لبنان', '🇱🇧'),
  ('Saudi Arabia', 'السعودية', '🇸🇦'),
  ('Egypt', 'مصر', '🇪🇬'),
  ('Morocco', 'المغرب', '🇲🇦'),
  ('Algeria', 'الجزائر', '🇩🇿'),
  ('Tunisia', 'تونس', '🇹🇳'),
  ('Iraq', 'العراق', '🇮🇶'),
  ('Jordan', 'الأردن', '🇯🇴'),
  ('Syria', 'سوريا', '🇸🇾'),
  ('Palestine', 'فلسطين', '🇵🇸'),
  ('Qatar', 'قطر', '🇶🇦'),
  ('UAE', 'الإمارات', '🇦🇪'),
  ('Kuwait', 'الكويت', '🇰🇼'),
  ('Oman', 'عُمان', '🇴🇲'),
  ('Bahrain', 'البحرين', '🇧🇭'),
  ('Yemen', 'اليمن', '🇾🇪'),
  ('Libya', 'ليبيا', '🇱🇾'),
  ('Sudan', 'السودان', '🇸🇩'),
  ('Mauritania', 'موريتانيا', '🇲🇷'),
  ('Somalia', 'الصومال', '🇸🇴'),
  ('Comoros', 'جزر القمر', '🇰🇲'),
  ('Djibouti', 'جيبوتي', '🇩🇯')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. CITY LEAGUE (Lebanon + Syria cities)
-- ============================================================
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  country TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  active BOOLEAN DEFAULT TRUE
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cities" ON cities FOR SELECT USING (TRUE);

INSERT INTO cities (name_en, name_ar, country) VALUES
  -- Lebanon
  ('Beirut', 'بيروت', 'Lebanon'),
  ('Tripoli', 'طرابلس', 'Lebanon'),
  ('Saida', 'صيدا', 'Lebanon'),
  ('Tyre', 'صور', 'Lebanon'),
  ('Zahle', 'زحلة', 'Lebanon'),
  ('Nabatieh', 'النبطية', 'Lebanon'),
  ('Jounieh', 'جونيه', 'Lebanon'),
  ('Byblos', 'جبيل', 'Lebanon'),
  ('Baalbek', 'بعلبك', 'Lebanon'),
  ('Akkar', 'عكار', 'Lebanon'),
  ('Chouf', 'الشوف', 'Lebanon'),
  ('Aley', 'عاليه', 'Lebanon'),
  ('Metn', 'المتن', 'Lebanon'),
  ('Keserwan', 'كسروان', 'Lebanon'),
  ('Zgharta', 'زغرتا', 'Lebanon'),
  ('Batroun', 'البترون', 'Lebanon'),
  -- Syria
  ('Damascus', 'دمشق', 'Syria'),
  ('Aleppo', 'حلب', 'Syria'),
  ('Homs', 'حمص', 'Syria'),
  ('Latakia', 'اللاذقية', 'Syria'),
  ('Hama', 'حماة', 'Syria'),
  ('Deir ez-Zor', 'دير الزور', 'Syria'),
  ('Raqqa', 'الرقة', 'Syria'),
  ('Idlib', 'إدلب', 'Syria'),
  ('Daraa', 'درعا', 'Syria'),
  ('Tartus', 'طرطوس', 'Syria'),
  ('Al-Hasakah', 'الحسكة', 'Syria'),
  ('Qamishli', 'القامشلي', 'Syria')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. CAFÉ FAN ZONES
-- ============================================================
CREATE TABLE IF NOT EXISTS cafe_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location TEXT,
  city TEXT,
  code TEXT UNIQUE NOT NULL,
  member_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cafe_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cafes" ON cafe_zones FOR SELECT USING (TRUE);
CREATE POLICY "Owners can manage cafe" ON cafe_zones
  FOR ALL USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS cafe_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES cafe_zones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cafe_id, user_id)
);

ALTER TABLE cafe_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cafe members" ON cafe_members FOR SELECT USING (TRUE);
CREATE POLICY "Users can join cafes" ON cafe_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. RPCs
-- ============================================================

-- Report a poster
CREATE OR REPLACE FUNCTION report_poster(p_poster_id UUID, p_reason TEXT) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_existing INTEGER;
BEGIN
  v_user_id := auth.uid();
  SELECT COUNT(*) INTO v_existing FROM poster_reports WHERE poster_id = p_poster_id AND reporter_id = v_user_id;
  IF v_existing > 0 THEN
    RETURN jsonb_build_object('error', 'Already reported');
  END IF;
  INSERT INTO poster_reports (poster_id, reporter_id, reason) VALUES (p_poster_id, v_user_id, p_reason);
  UPDATE fan_posters SET status = 'flagged' WHERE id = p_poster_id;
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add reaction to poster
CREATE OR REPLACE FUNCTION toggle_poster_reaction(p_poster_id UUID, p_reaction TEXT) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_existing RECORD;
BEGIN
  v_user_id := auth.uid();
  SELECT * INTO v_existing FROM poster_reactions WHERE poster_id = p_poster_id AND user_id = v_user_id AND reaction = p_reaction;
  IF FOUND THEN
    DELETE FROM poster_reactions WHERE id = v_existing.id;
    RETURN jsonb_build_object('action', 'removed', 'success', TRUE);
  ELSE
    INSERT INTO poster_reactions (poster_id, user_id, reaction) VALUES (p_poster_id, v_user_id, p_reaction)
    ON CONFLICT (poster_id, user_id, reaction) DO NOTHING;
    RETURN jsonb_build_object('action', 'added', 'success', TRUE);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Send room message
CREATE OR REPLACE FUNCTION send_room_message(p_room_id UUID, p_message TEXT) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  INSERT INTO room_messages (room_id, user_id, message) VALUES (p_room_id, v_user_id, p_message);
  UPDATE match_rooms SET message_count = message_count + 1 WHERE id = p_room_id;
  RETURN jsonb_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Join café zone
CREATE OR REPLACE FUNCTION join_cafe(p_code TEXT) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_cafe_id UUID;
BEGIN
  v_user_id := auth.uid();
  SELECT id INTO v_cafe_id FROM cafe_zones WHERE code = p_code AND active = TRUE;
  IF v_cafe_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid café code');
  END IF;
  INSERT INTO cafe_members (cafe_id, user_id) VALUES (v_cafe_id, v_user_id)
  ON CONFLICT (cafe_id, user_id) DO NOTHING;
  UPDATE cafe_zones SET member_count = (SELECT COUNT(*) FROM cafe_members WHERE cafe_id = v_cafe_id) WHERE id = v_cafe_id;
  RETURN jsonb_build_object('success', TRUE, 'cafe_id', v_cafe_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award city points (called when user earns points)
CREATE OR REPLACE FUNCTION award_city_points(p_user_id UUID, p_points INTEGER) RETURNS VOID AS $$
DECLARE
  v_city TEXT;
  v_country TEXT;
BEGIN
  SELECT region, country INTO v_city, v_country FROM profiles WHERE id = p_user_id;
  IF v_city IS NOT NULL THEN
    UPDATE cities SET total_points = total_points + p_points WHERE name_en = v_city;
  END IF;
  IF v_country IS NOT NULL THEN
    UPDATE countries SET total_points = total_points + p_points WHERE name_en = v_country;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. Realtime Publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE poster_reactions;

-- ============================================================
-- 10. Update existing RPC to add city/country points
-- ============================================================
-- add_quiz_points: used by solo/daily client flows.
-- Cap at 5000 per call (well above any legitimate single-session score)
-- to limit the blast radius of a client sending an inflated value.
CREATE OR REPLACE FUNCTION add_quiz_points(p_points INTEGER) RETURNS JSONB AS $$
DECLARE
  v_user_id  UUID;
  v_profile  RECORD;
  v_capped   INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;
  IF p_points <= 0 THEN
    RETURN jsonb_build_object('error', 'Points must be positive');
  END IF;
  -- Cap prevents a client from awarding unlimited points in one call.
  v_capped := LEAST(p_points, 5000);
  UPDATE profiles SET
    points = points + v_capped,
    xp     = xp + v_capped,
    level  = GREATEST(1, FLOOR(SQRT((xp + v_capped) / 100)) + 1)
  WHERE id = v_user_id
  RETURNING * INTO v_profile;
  PERFORM award_city_points(v_user_id, v_capped);
  RETURN jsonb_build_object('success', TRUE, 'points', v_profile.points, 'level', v_profile.level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
