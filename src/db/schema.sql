-- QuizGoal 2026 Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
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

-- Teams
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

-- Quiz Categories
CREATE TABLE quiz_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- Quiz Questions
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

-- Quiz Battles
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

-- Quiz Battle Answers
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

-- Matches
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

-- Predictions
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

-- Fan Posters
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

-- Poster Votes
CREATE TABLE poster_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID REFERENCES fan_posters(id),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poster_id, user_id)
);

-- Regions
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Sponsors
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

-- Rewards
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

-- Reward Redemptions
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

-- Missions
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

-- User Missions
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

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID REFERENCES profiles(id),
  invited_id UUID REFERENCES profiles(id) UNIQUE,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES — critical for query performance on FK/filter columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_favorite_team ON profiles(favorite_team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_battles_player_one ON quiz_battles(player_one);
CREATE INDEX IF NOT EXISTS idx_quiz_battles_player_two ON quiz_battles(player_two);
CREATE INDEX IF NOT EXISTS idx_quiz_battles_status ON quiz_battles(status);

CREATE INDEX IF NOT EXISTS idx_quiz_battle_answers_battle_id ON quiz_battle_answers(battle_id);
CREATE INDEX IF NOT EXISTS idx_quiz_battle_answers_user_id ON quiz_battle_answers(user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(active);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_resolved ON predictions(resolved);

CREATE INDEX IF NOT EXISTS idx_fan_posters_user_id ON fan_posters(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_posters_status ON fan_posters(status);
CREATE INDEX IF NOT EXISTS idx_fan_posters_votes ON fan_posters(votes_count DESC);

CREATE INDEX IF NOT EXISTS idx_poster_votes_poster_id ON poster_votes(poster_id);
CREATE INDEX IF NOT EXISTS idx_poster_votes_user_id ON poster_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poster_votes_created_at ON poster_votes(created_at);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invited_id ON referrals(invited_id);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);

CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_at);
