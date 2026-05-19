import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const INIT_TIMEOUT = 8000;

const PROFILE_COLUMNS =
  'id, username, user_code, full_name, avatar_url, favorite_team_id, country, region, language, role, points, xp, level, streak, created_at, updated_at';

let _initStarted = false;

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Build the upsert payload for a user. Always ensures the profile row exists.
// If the user has a username in their auth metadata (set during signUp), it is
// written to the profile — this eliminates the race where onAuthStateChange
// fetches the profile before signup.tsx can write the username separately.
function buildProfileUpsert(user: User): { payload: Record<string, unknown>; ignoreDuplicates: boolean } {
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const metaUsername = (meta.username ?? '').trim() || undefined;

  const payload: Record<string, unknown> = { id: user.id };
  // Only set created_at if it's a new row — ignoreDuplicates handles that
  payload.created_at = new Date().toISOString();
  if (metaUsername) payload.username = metaUsername;

  // ignoreDuplicates:false when we have a username → always write it on conflict
  // ignoreDuplicates:true when no username in meta → don't overwrite existing data
  return { payload, ignoreDuplicates: !metaUsername };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  init: async () => {
    if (_initStarted) return;
    _initStarted = true;

    const timer = setTimeout(() => {
      set({ loading: false, initialized: true });
    }, INIT_TIMEOUT);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ user, initialized: true });

      if (user) {
        const { payload, ignoreDuplicates } = buildProfileUpsert(user);
        await supabase.from('profiles').upsert(payload, { onConflict: 'id', ignoreDuplicates });
        const { data } = await supabase
          .from('profiles')
          .select(PROFILE_COLUMNS)
          .eq('id', user.id)
          .single();
        set({ profile: data as Profile | null });
      }
    } catch {
      // network error — continue without user
    } finally {
      clearTimeout(timer);
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      set({ user });
      if (user) {
        const { payload, ignoreDuplicates } = buildProfileUpsert(user);
        await supabase.from('profiles').upsert(payload, { onConflict: 'id', ignoreDuplicates });
        const { data } = await supabase
          .from('profiles')
          .select(PROFILE_COLUMNS)
          .eq('id', user.id)
          .single();
        set({ profile: data as Profile | null });
      } else {
        set({ profile: null });
      }
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
  refreshProfile: async () => {
    const { profile } = get();
    if (!profile) return;
    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', profile.id)
      .single();
    if (data) set({ profile: data as Profile });
  },
}));
