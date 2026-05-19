import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const INIT_TIMEOUT = 8000;

const PROFILE_COLUMNS =
  'id, username, user_code, full_name, avatar_url, favorite_team_id, country, region, language, role, points, xp, level, streak, created_at, updated_at';

// Fallback without user_code for databases that haven't run the migration yet.
// PostgREST returns an error (not null) when a requested column doesn't exist,
// so the full-column SELECT silently fails and profile stays null forever.
// This fallback ensures the profile always loads regardless of DB state.
const PROFILE_COLUMNS_FALLBACK =
  'id, username, full_name, avatar_url, favorite_team_id, country, region, language, role, points, xp, level, streak, created_at, updated_at';

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

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();
  if (!error) return data as Profile | null;
  // Column missing or other schema mismatch — retry without optional columns
  const { data: fallback } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS_FALLBACK)
    .eq('id', userId)
    .single();
  return fallback as Profile | null;
}

function buildProfileUpsert(user: User): { payload: Record<string, unknown>; ignoreDuplicates: boolean } {
  const meta = (user.user_metadata ?? {}) as Record<string, string>;
  const metaUsername = (meta.username ?? '').trim() || undefined;

  const payload: Record<string, unknown> = { id: user.id };
  payload.created_at = new Date().toISOString();
  if (metaUsername) payload.username = metaUsername;

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
        const profile = await fetchProfile(user.id);
        set({ profile });
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
        const profile = await fetchProfile(user.id);
        set({ profile });
      } else {
        set({ profile: null });
      }
    });
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // API failure — clear local state anyway so the user is never stuck
    }
    set({ user: null, profile: null });
  },
  refreshProfile: async () => {
    const { profile } = get();
    if (!profile) return;
    const updated = await fetchProfile(profile.id);
    if (updated) set({ profile: updated });
  },
}));
