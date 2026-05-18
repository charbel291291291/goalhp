import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../store/useAuth';
import { allTeams } from './teams';
import { allMatches } from './matchSchedule';
import { sampleQuestions } from './sampleQuestions';
import type { Profile, Team, Match, QuizQuestion, FanPoster, Reward, RewardRedemption, Sponsor, Mission, UserMission, Prediction, Region } from '../types';

type QueryResult<T> = { data: T | null; loading: boolean; error: string | null; refetch: () => void };

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function stableHashNumber(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Generic query hook
export function useLocalQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (!cancelled) setData(result);
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
}

// Teams
export function useTeams() {
  return useLocalQuery<Team[]>(async () => {
    const { data, error } = await supabase.from('teams').select('*').eq('active', true);
    if (error || !data) {
      return allTeams.map((t) => ({
        id: `team-${t.fifa_code}`,
        name_en: t.name_en,
        name_ar: t.name_ar,
        group_name: t.group_name,
        fifa_code: t.fifa_code,
        flag_emoji: t.flag_emoji,
        primary_color: t.primary_color,
        secondary_color: t.secondary_color,
        total_points: 0,
        active: true,
      }));
    }
    return data as Team[];
  });
}

// Matches
export function useMatches(stage?: string) {
  return useLocalQuery<Match[]>(async () => {
    const { data, error } = await supabase.from('matches').select('*, team_a:team_a_id(*), team_b:team_b_id(*)');
    if (error || !data) {
      let matches = allMatches;
      if (stage && stage !== 'all') {
        if (stage === 'today') matches = matches.filter(m => new Date(m.kickoff_at).toDateString() === new Date().toDateString());
        else if (stage === 'upcoming') matches = matches.filter(m => new Date(m.kickoff_at) > new Date());
        else matches = matches.filter(m => m.stage === stage);
      }
      return matches;
    }
    return data as unknown as Match[];
  }, [stage]);
}

// Single match
export function useMatch(matchId: string) {
  return useLocalQuery<Match | null>(async () => {
    const { data, error } = await supabase.from('matches').select('*, team_a:team_a_id(*), team_b:team_b_id(*)').eq('id', matchId).single();
    if (error || !data) return allMatches.find(m => m.id === matchId) || null;
    return data as unknown as Match;
  }, [matchId]);
}

// Questions
export function useQuestions(categoryId?: string) {
  return useLocalQuery<QuizQuestion[]>(async () => {
    const { data, error } = await supabase.from('quiz_questions').select('*').eq('active', true);
    if (error || !data) {
      let qs = sampleQuestions;
      if (categoryId) qs = qs.filter(q => q.category_id === categoryId);
      return qs;
    }
    return data as QuizQuestion[];
  }, [categoryId]);
}

// Predictions for a user
export function useUserPredictions() {
  const { profile } = useAuth();
  return useLocalQuery<Prediction[]>(async () => {
    if (!profile) return [];
    const { data, error } = await supabase.from('predictions').select('*').eq('user_id', profile.id);
    if (error || !data) return [];
    return data as Prediction[];
  }, [profile?.id]);
}

// Posters
export function usePosters(teamId?: string) {
  return useLocalQuery<FanPoster[]>(async () => {
    let query = supabase.from('fan_posters').select('*, user:user_id(*), team:team_id(*)').eq('status', 'active').order('votes_count', { ascending: false });
    if (teamId) query = query.eq('team_id', teamId);
    const { data, error } = await query;
    if (error || !data) return [];
    return data as unknown as FanPoster[];
  }, [teamId]);
}

// Rewards
export function useRewards() {
  return useLocalQuery<Reward[]>(async () => {
    const { data, error } = await supabase.from('rewards').select('*, sponsor:sponsor_id(*)').eq('active', true);
    if (error || !data) return [];
    return data as unknown as Reward[];
  }, []);
}

// Sponsor
export function useSponsors() {
  return useLocalQuery<Sponsor[]>(async () => {
    const { data, error } = await supabase.from('sponsors').select('*').eq('active', true);
    if (error || !data) return [];
    return data as Sponsor[];
  }, []);
}

// Redemptions
export function useUserRedemptions() {
  const { profile } = useAuth();
  return useLocalQuery<RewardRedemption[]>(async () => {
    if (!profile) return [];
    const { data, error } = await supabase.from('reward_redemptions').select('*, reward:reward_id(*)').eq('user_id', profile.id);
    if (error || !data) return [];
    return data as unknown as RewardRedemption[];
  }, [profile?.id]);
}

// Missions
export function useMissions() {
  return useLocalQuery<Mission[]>(async () => {
    const { data, error } = await supabase.from('missions').select('*').eq('active', true);
    if (error || !data) return [];
    return data as Mission[];
  }, []);
}

// User missions
export function useUserMissions() {
  const { profile } = useAuth();
  return useLocalQuery<UserMission[]>(async () => {
    if (!profile) return [];
    const { data, error } = await supabase.from('user_missions').select('*, mission:mission_id(*)').eq('user_id', profile.id);
    if (error || !data) return [];
    return data as unknown as UserMission[];
  }, [profile?.id]);
}

// Regions
export function useRegions() {
  return useLocalQuery<Region[]>(async () => {
    const { data, error } = await supabase.from('regions').select('*').eq('active', true);
    if (error || !data) return [];
    return data as Region[];
  }, []);
}

// Leaderboard — select only the fields needed for display; omit 'role' and other sensitive columns.
export function useLeaderboard(limit = 50) {
  return useLocalQuery<Profile[]>(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, points, level, xp, streak, flag_emoji, favorite_team_id')
      .order('points', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as unknown as Profile[];
  }, [limit]);
}

// Team leaderboard
export function useTeamLeaderboard() {
  return useLocalQuery<Team[]>(async () => {
    const { data, error } = await supabase.from('teams').select('*').order('total_points', { ascending: false });
    if (error || !data) {
      const fallback = allTeams.map((t) => ({
        id: `team-${t.fifa_code}`,
        name_en: t.name_en,
        name_ar: t.name_ar,
        group_name: t.group_name,
        fifa_code: t.fifa_code,
        flag_emoji: t.flag_emoji,
        primary_color: t.primary_color,
        secondary_color: t.secondary_color,
        total_points: (stableHashNumber(t.fifa_code) % 50000) + 5000,
        active: true,
      }));
      return fallback.sort((a, b) => b.total_points - a.total_points);
    }
    return data as unknown as Team[];
  }, []);
}

// Profile
export function useProfile(userId?: string) {
  return useLocalQuery<Profile | null>(async () => {
    if (!userId) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return data as Profile;
  }, [userId]);
}

// Daily challenge questions
export function useDailyQuestions() {
  return useLocalQuery<QuizQuestion[]>(async () => {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const shuffled = [...sampleQuestions].sort((a, b) => ((seed + a.id.charCodeAt(0)) % 10) - ((seed + b.id.charCodeAt(0)) % 10));
    return shuffled.slice(0, 7);
  }, []);
}
