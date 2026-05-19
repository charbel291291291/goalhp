export interface Profile {
  id: string;
  username: string;
  user_code?: string;
  full_name?: string;
  avatar_url?: string;
  favorite_team_id?: string;
  flag_emoji?: string;
  country?: string;
  region?: string;
  language: string;
  role: 'user' | 'admin';
  points: number;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name_en: string;
  name_ar: string;
  group_name: string;
  fifa_code: string;
  flag_emoji: string;
  primary_color: string;
  secondary_color: string;
  total_points: number;
  active: boolean;
}

export interface Group {
  name: string;
  teams: Team[];
}

export interface QuizCategory {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  icon: string;
  active: boolean;
  sort_order: number;
}

export interface QuizQuestion {
  id: string;
  category_id: string;
  question_en: string;
  question_ar: string;
  answers_en: string[];
  answers_ar: string[];
  correct_answer_index: number;
  explanation_en: string;
  explanation_ar: string;
  difficulty: 'easy' | 'medium' | 'hard';
  image_slug?: string;
  image_url?: string;
  question_type?: 'text' | 'guess_player' | 'guess_logo' | 'guess_brand' | 'guess_tech_brand' | 'guess_world_brand' | 'guess_stadium' | 'guess_kit' | 'guess_flag';
  hint?: string;
  brand_category?: string;
  active: boolean;
}

export interface QuizBattle {
  id: string;
  mode: 'solo' | '1v1' | 'friend' | 'daily' | 'teamwar' | 'bot';
  player_one: string;
  player_two?: string;
  winner_id?: string;
  status: 'waiting' | 'playing' | 'finished';
  player_one_score: number;
  player_two_score: number;
  started_at?: string;
  ended_at?: string;
}

export interface QuizBattleAnswer {
  id: string;
  battle_id: string;
  user_id: string;
  question_id: string;
  selected_answer_index: number;
  is_correct: boolean;
  response_time_ms: number;
  points_awarded: number;
}

export interface Match {
  id: string;
  match_number: number;
  stage: string;
  group_name: string;
  team_a_id: string;
  team_b_id: string;
  kickoff_at: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished';
  team_a_score?: number;
  team_b_score?: number;
  winner_team_id?: string;
  locked: boolean;
  team_a?: Team;
  team_b?: Team;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  prediction_type: string;
  predicted_winner_team_id?: string;
  predicted_team_a_score?: number;
  predicted_team_b_score?: number;
  predicted_first_goal_team_id?: string;
  predicted_total_goals_range?: string;
  points_awarded: number;
  locked: boolean;
  resolved: boolean;
}

export interface FanPoster {
  id: string;
  user_id: string;
  team_id: string;
  style: string;
  slogan: string;
  source_image_url?: string;
  poster_url: string;
  votes_count: number;
  shares_count: number;
  status: 'active' | 'hidden' | 'flagged';
  user?: Profile;
  team?: Team;
}

export interface PosterVote {
  id: string;
  poster_id: string;
  user_id: string;
}

export interface Region {
  id: string;
  name_en: string;
  name_ar: string;
  total_points: number;
  active: boolean;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url?: string;
  description: string;
  whatsapp?: string;
  instagram?: string;
  location?: string;
  active: boolean;
}

export interface Reward {
  id: string;
  sponsor_id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  image_url?: string;
  points_required: number;
  quantity: number;
  expiry_date: string;
  terms_en: string;
  terms_ar: string;
  active: boolean;
  sponsor?: Sponsor;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  user_id: string;
  code: string;
  qr_payload: string;
  status: 'issued' | 'redeemed';
  redeemed_at?: string;
  reward?: Reward;
}

export interface Mission {
  id: string;
  title_en: string;
  title_ar: string;
  mission_type: string;
  target_count: number;
  points_reward: number;
  active: boolean;
}

export interface UserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  mission?: Mission;
}

export interface Referral {
  id: string;
  inviter_id: string;
  invited_id: string;
  reward_given: boolean;
}

export interface AppSettings {
  key: string;
  value: unknown;
}

// ====== NEW FEATURE TYPES ======

export interface PosterReport {
  id: string;
  poster_id: string;
  reporter_id: string;
  reason: string;
  status: 'open' | 'dismissed' | 'action_taken';
  created_at: string;
}

export interface PosterCompetition {
  id: string;
  title_en: string;
  title_ar: string;
  competition_type: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'voting' | 'finished';
  starts_at: string;
  ends_at: string;
  winner_poster_id?: string;
}

export interface PosterCompetitionEntry {
  id: string;
  competition_id: string;
  poster_id: string;
  votes_count: number;
  rank?: number;
  poster?: FanPoster;
}

export interface PosterReaction {
  id: string;
  poster_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface MatchRoom {
  id: string;
  match_id: string;
  is_live: boolean;
  message_count: number;
  match?: Match;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: Profile;
}

export interface Country {
  id: string;
  name_en: string;
  name_ar: string;
  flag_emoji?: string;
  total_points: number;
  rank?: number;
}

export interface City {
  id: string;
  name_en: string;
  name_ar: string;
  country: string;
  total_points: number;
  rank?: number;
}

export interface CafeZone {
  id: string;
  name_en: string;
  name_ar: string;
  owner_id?: string;
  location?: string;
  city?: string;
  code: string;
  member_count: number;
  points: number;
  active: boolean;
  owner?: Profile;
}

export interface CafeMember {
  id: string;
  cafe_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: Profile;
}

// ====== ARENA TYPES ======

export type ArenaPostType = 'text' | 'prediction' | 'quiz_win' | 'poster' | 'match_reaction' | 'moment' | 'hot_take';

export type ArenaReactionType = 'goal' | 'var' | 'fire' | 'shock' | 'laugh' | 'heart' | 'trophy' | 'agree' | 'disagree';

export type MomentType = 'goal' | 'var' | 'penalty' | 'red_card' | 'half_time' | 'full_time' | 'shock';

export interface ArenaPost {
  id: string;
  user_id: string;
  post_type: ArenaPostType;
  content: string;
  media_url?: string;
  match_id?: string;
  team_id?: string;
  country?: string;
  reactions_count: number;
  comments_count: number;
  shares_count: number;
  status: string;
  created_at: string;
  user?: Profile;
  match?: Match;
  team?: Team;
  my_reactions?: string[];
}

export interface ArenaComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  reactions_count: number;
  status: string;
  created_at: string;
  user?: Profile;
  my_reactions?: string[];
  replies?: ArenaComment[];
}

export interface ArenaReaction {
  id: string;
  post_id?: string;
  comment_id?: string;
  user_id: string;
  reaction: ArenaReactionType;
  created_at: string;
}

export interface MatchMoment {
  id: string;
  match_id: string;
  user_id: string;
  moment_type: MomentType;
  comment?: string;
  reactions_count: number;
  comments_count: number;
  created_at: string;
  user?: Profile;
}

export interface DailyHotTake {
  id: string;
  question_en: string;
  question_ar: string;
  choices: string[];
  active_date: string;
  total_votes: number;
  active: boolean;
}

export interface HotTakeVote {
  id: string;
  hot_take_id: string;
  user_id: string;
  choice_index: number;
}

export interface FanTitle {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  min_posts: number;
  min_comments: number;
  min_reactions: number;
  min_streak: number;
  min_predictions: number;
  sort_order: number;
}

export interface UserTitle {
  id: string;
  user_id: string;
  title_id: string;
  earned_at: string;
  title?: FanTitle;
}

export interface ArenaStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export interface FanTitleInfo {
  title_en: string;
  title_ar: string;
  icon: string;
  posts: number;
  comments: number;
  reactions: number;
  streak: number;
  predictions: number;
}
