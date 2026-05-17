import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../store/useAuth';
import type {
  ArenaComment,
  ArenaPost,
  ArenaReactionType,
  ArenaStreak,
  DailyHotTake,
  FanTitleInfo,
  MatchMoment,
} from '../types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type QueryResult<T> = { data: T; loading: boolean; error: string | null; refetch: () => void };

function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[], initialData: T): QueryResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
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

    async function start() {
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

    void start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run };
}

type ReactionRow = { post_id: string | null; comment_id: string | null; reaction: string };
type ChoiceVoteRow = { choice_index: number };

// ====== ARENA POSTS ======
export function useArenaPosts(filterType?: string, teamId?: string, country?: string) {
  return useQuery<ArenaPost[]>(
    async () => {
      const { profile } = useAuth.getState();
      let q = supabase
        .from('arena_posts')
        .select('*, user:user_id(id, username, avatar_url), match:match_id(*), team:team_id(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterType && filterType !== 'all') q = q.eq('post_type', filterType);
      if (teamId) q = q.eq('team_id', teamId);
      if (country) q = q.eq('country', country);

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      const posts = (data ?? []) as unknown as ArenaPost[];

      if (profile) {
        const { data: myReactions, error: reactionsError } = await supabase
          .from('arena_reactions')
          .select('post_id, comment_id, reaction')
          .eq('user_id', profile.id)
          .not('post_id', 'is', null);
        if (reactionsError) throw new Error(reactionsError.message);

        const map: Record<string, string[]> = {};
        for (const r of (myReactions ?? []) as unknown as ReactionRow[]) {
          if (!r.post_id) continue;
          if (!map[r.post_id]) map[r.post_id] = [];
          map[r.post_id].push(r.reaction);
        }

        for (const p of posts) p.my_reactions = map[p.id] ?? [];
      }

      return posts;
    },
    [filterType, teamId, country],
    []
  );
}

// ====== ARENA COMMENTS ======
export function useArenaComments(postId: string) {
  return useQuery<ArenaComment[]>(
    async () => {
      const { profile } = useAuth.getState();

      const { data, error } = await supabase
        .from('arena_comments')
        .select('*, user:user_id(id, username, avatar_url)')
        .eq('post_id', postId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);

      const comments = (data ?? []) as unknown as ArenaComment[];

      if (profile) {
        const { data: myReactions, error: reactionsError } = await supabase
          .from('arena_reactions')
          .select('post_id, comment_id, reaction')
          .eq('user_id', profile.id)
          .not('comment_id', 'is', null);
        if (reactionsError) throw new Error(reactionsError.message);

        const map: Record<string, string[]> = {};
        for (const r of (myReactions ?? []) as unknown as ReactionRow[]) {
          if (!r.comment_id) continue;
          if (!map[r.comment_id]) map[r.comment_id] = [];
          map[r.comment_id].push(r.reaction);
        }

        for (const c of comments) c.my_reactions = map[c.id] ?? [];
      }

      return comments;
    },
    [postId],
    []
  );
}

// ====== MATCH MOMENTS ======
export function useMatchMoments(matchId: string) {
  return useQuery<MatchMoment[]>(
    async () => {
      const { data, error } = await supabase
        .from('match_moments')
        .select('*, user:user_id(id, username, avatar_url)')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);

      return (data ?? []) as unknown as MatchMoment[];
    },
    [matchId],
    []
  );
}

// ====== DAILY HOT TAKE ======
export function useDailyHotTake() {
  return useQuery<{ take: DailyHotTake | null; myVote: number | null }>(
    async () => {
      const { profile } = useAuth.getState();
      const today = new Date().toISOString().split('T')[0];

      const { data: takes, error } = await supabase
        .from('daily_hot_takes')
        .select('*')
        .eq('active_date', today)
        .eq('active', true)
        .limit(1);
      if (error) throw new Error(error.message);

      const take = (takes?.[0] ?? null) as unknown as DailyHotTake | null;
      let myVote: number | null = null;

      if (take && profile) {
        const { data: vote, error: voteError } = await supabase
          .from('hot_take_votes')
          .select('choice_index')
          .eq('hot_take_id', take.id)
          .eq('user_id', profile.id)
          .maybeSingle();
        if (voteError) throw new Error(voteError.message);
        if (vote) myVote = (vote as unknown as ChoiceVoteRow).choice_index;
      }

      return { take, myVote };
    },
    [],
    { take: null, myVote: null }
  );
}

// ====== FAN TITLE ======
export function useFanTitle() {
  const { profile } = useAuth();

  return useQuery<FanTitleInfo | null>(
    async () => {
      if (!profile) return null;
      const { data, error } = await supabase.rpc('get_user_fan_title', { p_user_id: profile.id });
      if (error) throw new Error(error.message);
      return data as unknown as FanTitleInfo;
    },
    [profile?.id],
    null
  );
}

// ====== ARENA STREAK ======
export function useArenaStreak() {
  const { profile } = useAuth();

  return useQuery<ArenaStreak | null>(
    async () => {
      if (!profile) return null;
      const { data, error } = await supabase.from('arena_streaks').select('*').eq('user_id', profile.id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as unknown as ArenaStreak;
    },
    [profile?.id],
    null
  );
}

// ====== MUTATIONS ======
type RpcResult = { success?: boolean } & Record<string, unknown>;

export async function createArenaPost(
  postType: string,
  content: string,
  mediaUrl?: string,
  matchId?: string,
  teamId?: string,
  country?: string
) {
  const { data, error } = await supabase.rpc('create_arena_post', {
    p_post_type: postType,
    p_content: content,
    p_media_url: mediaUrl ?? null,
    p_match_id: matchId ?? null,
    p_team_id: teamId ?? null,
    p_country: country ?? null,
  });
  if (error) throw new Error(error.message);
  return data as unknown as RpcResult;
}

export async function createArenaComment(postId: string, content: string, parentId?: string) {
  const { data, error } = await supabase.rpc('create_arena_comment', {
    p_post_id: postId,
    p_content: content,
    p_parent_id: parentId ?? null,
  });
  if (error) throw new Error(error.message);
  return data as unknown as RpcResult;
}

export async function toggleArenaReaction(reaction: ArenaReactionType, postId?: string, commentId?: string) {
  const { data, error } = await supabase.rpc('toggle_arena_reaction', {
    p_post_id: postId ?? null,
    p_comment_id: commentId ?? null,
    p_reaction: reaction,
  });
  if (error) throw new Error(error.message);
  return data as unknown as RpcResult;
}

export async function createMatchMoment(matchId: string, momentType: string, comment?: string) {
  const { data, error } = await supabase.rpc('create_match_moment', {
    p_match_id: matchId,
    p_moment_type: momentType,
    p_comment: comment ?? null,
  });
  if (error) throw new Error(error.message);
  return data as unknown as RpcResult;
}

export async function voteHotTake(hotTakeId: string, choiceIndex: number) {
  const { data, error } = await supabase.rpc('vote_hot_take', {
    p_hot_take_id: hotTakeId,
    p_choice_index: choiceIndex,
  });
  if (error) throw new Error(error.message);
  return data as unknown as RpcResult;
}

export async function reportArenaContent(reason: string, postId?: string, commentId?: string) {
  const { data, error } = await supabase.rpc('report_arena_content', {
    p_post_id: postId ?? null,
    p_comment_id: commentId ?? null,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return data as unknown as RpcResult;
}
