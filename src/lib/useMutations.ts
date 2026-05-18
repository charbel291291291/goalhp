import { useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../store/useAuth';
import toast from 'react-hot-toast';
import type { QuizQuestion, Team, Match, Sponsor, Reward, Profile } from '../types';

type MutationState = { loading: boolean; error: string | null; success: boolean };

function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  successMsg?: string
) {
  const [state, setState] = useState<MutationState>({ loading: false, error: null, success: false });

  const mutate = async (...args: TArgs): Promise<TResult | null> => {
    setState({ loading: true, error: null, success: false });
    try {
      const result = await fn(...args);
      setState({ loading: false, error: null, success: true });
      if (successMsg) toast.success(successMsg);
      return result;
    } catch (e: unknown) {
      // Supabase throws plain PostgrestError objects (not Error instances) — extract .message from either
      const msg =
        e instanceof Error ? e.message :
        (e !== null && typeof e === 'object' && 'message' in e) ? String((e as { message: unknown }).message) :
        'Operation failed';
      setState({ loading: false, error: msg, success: false });
      toast.error(msg);
      return null;
    }
  };

  return { mutate, ...state, reset: () => setState({ loading: false, error: null, success: false }) };
}

// Admin CRUD: Questions
export function useCreateQuestion() {
  return useMutation(async (q: {
    category_id: string; question_en: string; question_ar: string;
    answers_en: string[]; answers_ar: string[]; correct_answer_index: number;
    difficulty: 'easy' | 'medium' | 'hard'; explanation_en?: string; explanation_ar?: string;
  }) => {
    if (!q.question_en?.trim()) throw new Error('Question text is required');
    if (q.answers_en?.length !== 4) throw new Error('Exactly 4 answers are required');
    if (q.correct_answer_index < 0 || q.correct_answer_index > 3) throw new Error('Invalid correct answer index');
    const { error } = await supabase.from('quiz_questions').insert(q);
    if (error) throw error;
  }, 'Question created');
}

export function useUpdateQuestion() {
  return useMutation(async (id: string, updates: Partial<Omit<QuizQuestion, 'id'>>) => {
    const { error } = await supabase.from('quiz_questions').update(updates).eq('id', id);
    if (error) throw error;
  }, 'Question updated');
}

export function useDeleteQuestion() {
  return useMutation(async (id: string) => {
    const { error } = await supabase.from('quiz_questions').update({ active: false }).eq('id', id);
    if (error) throw error;
  }, 'Question deleted');
}

// Admin CRUD: Teams
export function useUpdateTeam() {
  return useMutation(async (id: string, updates: Partial<Omit<Team, 'id'>>) => {
    const { error } = await supabase.from('teams').update(updates).eq('id', id);
    if (error) throw error;
  }, 'Team updated');
}

// Admin CRUD: Matches
export function useCreateMatch() {
  return useMutation(async (m: Omit<Match, 'id' | 'team_a' | 'team_b'>) => {
    const { error } = await supabase.from('matches').insert(m);
    if (error) throw error;
  }, 'Match created');
}

export function useUpdateMatch() {
  return useMutation(async (id: string, updates: Partial<Omit<Match, 'id' | 'team_a' | 'team_b'>>) => {
    const { error } = await supabase.from('matches').update(updates).eq('id', id);
    if (error) throw error;
  }, 'Match updated');
}

export function useDeleteMatch() {
  return useMutation(async (id: string) => {
    const { error } = await supabase.from('matches').update({ status: 'finished' }).eq('id', id);
    if (error) throw error;
  }, 'Match closed');
}

// Admin CRUD: Sponsors
export function useCreateSponsor() {
  return useMutation(async (s: Omit<Sponsor, 'id'>) => {
    const { error } = await supabase.from('sponsors').insert(s);
    if (error) throw error;
  }, 'Sponsor created');
}

export function useUpdateSponsor() {
  return useMutation(async (id: string, updates: Partial<Omit<Sponsor, 'id'>>) => {
    const { error } = await supabase.from('sponsors').update(updates).eq('id', id);
    if (error) throw error;
  }, 'Sponsor updated');
}

export function useDeleteSponsor() {
  return useMutation(async (id: string) => {
    const { error } = await supabase.from('sponsors').update({ active: false }).eq('id', id);
    if (error) throw error;
  }, 'Sponsor deleted');
}

// Admin CRUD: Rewards
export function useCreateReward() {
  return useMutation(async (r: Omit<Reward, 'id' | 'sponsor'>) => {
    const { error } = await supabase.from('rewards').insert(r);
    if (error) throw error;
  }, 'Reward created');
}

export function useUpdateReward() {
  return useMutation(async (id: string, updates: Partial<Omit<Reward, 'id' | 'sponsor'>>) => {
    const { error } = await supabase.from('rewards').update(updates).eq('id', id);
    if (error) throw error;
  }, 'Reward updated');
}

export function useDeleteReward() {
  return useMutation(async (id: string) => {
    const { error } = await supabase.from('rewards').update({ active: false }).eq('id', id);
    if (error) throw error;
  }, 'Reward deleted');
}

// Game actions
export function useSubmitPrediction() {
  return useMutation(async (p: {
    match_id: string; prediction_type: string; predicted_winner_team_id?: string;
    predicted_team_a_score?: number; predicted_team_b_score?: number;
    predicted_first_goal_team_id?: string; predicted_total_goals_range?: string;
  }) => {
    const { data, error } = await supabase.rpc('submit_prediction', p);
    if (error) throw error;
    return data;
  }, 'Prediction submitted!');
}

export function useVotePoster() {
  return useMutation(async (posterId: string) => {
    const { data, error } = await supabase.rpc('vote_poster', { p_poster_id: posterId });
    if (error) throw error;
    return data;
  }, 'Vote recorded! +10 points');
}

export function useRedeemReward() {
  return useMutation(async (rewardId: string) => {
    const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId });
    if (error) throw error;
    return data;
  }, 'Reward redeemed!');
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|heic|heif|avif|bmp|tiff|svg)$/i;

function isValidImageFile(file: File): boolean {
  // Accept any image/* MIME type (covers jpeg, png, webp, heic, heif, avif…)
  if (file.type.startsWith('image/')) return true;
  // Some mobile browsers report empty or generic MIME — fall back to extension
  if (file.type === '' || file.type === 'application/octet-stream') {
    return IMAGE_EXTENSIONS.test(file.name);
  }
  return false;
}

export function useUploadAvatar() {
  return useMutation(async (file: File, userId: string) => {
    if (!isValidImageFile(file)) {
      throw new Error('Only image files are allowed');
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new Error('Image must be smaller than 5 MB');
    }

    // Verify the user is authenticated and matches userId — Storage RLS checks auth.uid()
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error('Not signed in. Please log in again.');
    if (user.id !== userId) throw new Error('Cannot upload avatar for another user');

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Place the file inside a per-user folder so storage RLS using foldername[1] = auth.uid() works
    const fileName = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (uploadError) {
      console.error('[avatar upload] storage error:', uploadError);
      const msg = (uploadError.message || '').toLowerCase();
      if (msg.includes('bucket') && msg.includes('not found')) {
        throw new Error('Avatar storage missing. Run AVATAR_STORAGE_SETUP.sql in Supabase SQL editor.');
      }
      if (msg.includes('row-level security') || msg.includes('unauthorized') || msg.includes('permission')) {
        throw new Error('Storage permission denied. Run AVATAR_STORAGE_SETUP.sql to create policies.');
      }
      throw new Error(uploadError.message || 'Upload failed');
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    // Cache-bust so the new image shows immediately
    const finalUrl = `${publicUrl}?t=${Date.now()}`;

    // Use .select() so we can verify the row was actually updated (RLS would otherwise fail silently)
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: finalUrl })
      .eq('id', userId)
      .select('id')
      .single();

    if (updateError) {
      console.error('[avatar upload] profile update error:', updateError);
      throw new Error(updateError.message);
    }
    if (!updated) {
      throw new Error('Profile update was blocked by RLS. Check the "Users can update own profile" policy.');
    }
    return finalUrl;
  }, 'Avatar updated!');
}

export function useReportPoster() {
  return useMutation(async (posterId: string, reason: string) => {
    const { data, error } = await supabase.rpc('report_poster', {
      p_poster_id: posterId,
      p_reason: reason,
    });
    if (error) throw error;
    return data;
  }, 'Poster reported. Admin will review.');
}

export function useCompleteMission() {
  return useMutation(async (missionId: string) => {
    const { profile } = useAuth.getState();
    if (!profile) throw new Error('Not logged in');
    const { data: existing } = await supabase.from('user_missions')
      .select('*').eq('user_id', profile.id).eq('mission_id', missionId).single();
    if (existing?.completed) throw new Error('Already completed');
    if (existing) {
      const newProgress = existing.progress + 1;
      const mission = await supabase.from('missions').select('*').eq('id', missionId).single();
      const completed = newProgress >= (mission.data?.target_count || 1);
      await supabase.from('user_missions').update({
        progress: newProgress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq('id', existing.id);
      if (completed) {
        await supabase.rpc('apply_points', { p_mission_id: missionId, p_points: mission.data?.points_reward || 0 });
      }
    } else {
      await supabase.from('user_missions').insert({
        user_id: profile.id, mission_id: missionId, progress: 1
      });
    }
  }, 'Mission progress updated!');
}

// Whitelisted profile fields — only these may be updated by users
const ALLOWED_PROFILE_FIELDS: ReadonlySet<string> = new Set<keyof Profile>([
  'username', 'full_name', 'avatar_url', 'country', 'region',
  'language', 'favorite_team_id',
]);

export function useUpdateProfile() {
  return useMutation(async (updates: Partial<Profile>) => {
    const { profile, refreshProfile } = useAuth.getState();
    if (!profile) throw new Error('Not logged in');

    // Verify auth session is still alive before attempting the update (RLS depends on it)
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error('Session expired. Please log in again.');

    // Only update whitelisted fields — drop everything else silently
    const safeUpdate: Record<string, unknown> = {};
    for (const k of Object.keys(updates)) {
      if (ALLOWED_PROFILE_FIELDS.has(k)) {
        safeUpdate[k] = updates[k as keyof Profile];
      }
    }
    if (Object.keys(safeUpdate).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Trim username if present and reject empty strings
    if (typeof safeUpdate.username === 'string') {
      const trimmed = safeUpdate.username.trim();
      if (!trimmed) throw new Error('Username cannot be empty');
      if (trimmed.length < 2) throw new Error('Username must be at least 2 characters');
      if (trimmed.length > 30) throw new Error('Username too long (max 30 characters)');
      safeUpdate.username = trimmed;
    }

    // .select().single() lets us detect when RLS silently blocks the update (0 rows affected)
    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdate)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('[update profile] error:', error);
      // Surface clearer message for the common duplicate-username case
      if (error.code === '23505' || /duplicate|unique/i.test(error.message || '')) {
        throw new Error('That username is already taken');
      }
      throw error;
    }
    if (!data) {
      throw new Error('Update blocked by RLS. Check the "Users can update own profile" policy on the profiles table.');
    }
    await refreshProfile();
  }, 'Profile updated');
}

// Battle actions
export function useSubmitQuizAnswer() {
  return useMutation(async (p: { battle_id: string; question_id: string; selected_index: number; response_time_ms: number }) => {
    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_battle_id: p.battle_id,
      p_question_id: p.question_id,
      p_selected_index: p.selected_index,
      p_response_time_ms: p.response_time_ms,
    });
    if (error) throw error;
    return data;
  });
}

export function useFinishBattle() {
  return useMutation(async (battleId: string) => {
    const { data, error } = await supabase.rpc('finish_battle', { p_battle_id: battleId });
    if (error) throw error;
    return data;
  }, 'Battle complete!');
}

export function useJoinBattleQueue() {
  return useMutation(async (mode: string = '1v1') => {
    const { data, error } = await supabase.rpc('join_battle_queue', { p_mode: mode });
    if (error) throw error;
    return data;
  });
}

export function useLeaveBattleQueue() {
  return useMutation(async () => {
    const { data, error } = await supabase.rpc('leave_battle_queue');
    if (error) throw error;
    return data;
  });
}

// Push subscription mutations
export function useSavePushSubscription() {
  return useMutation(async (p: { endpoint: string; p256dh: string; auth: string }) => {
    const { data, error } = await supabase.rpc('save_push_subscription', {
      p_endpoint: p.endpoint,
      p_p256dh: p.p256dh,
      p_auth: p.auth,
    });
    if (error) throw error;
    return data;
  }, 'Notifications enabled');
}

export function useRemovePushSubscription() {
  return useMutation(async () => {
    const { data, error } = await supabase.rpc('remove_push_subscription');
    if (error) throw error;
    return data;
  }, 'Notifications disabled');
}
