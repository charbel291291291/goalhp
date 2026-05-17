import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

const INIT_TIMEOUT = 8000;

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

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  init: async () => {
    // Safety timeout: force loading=false after INIT_TIMEOUT ms
    const timer = setTimeout(() => {
      set({ loading: false, initialized: true });
    }, INIT_TIMEOUT);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ user, initialized: true });

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        set({ profile: data as Profile | null });
      }
    } catch {
      // noop — network error, continue without user
    } finally {
      clearTimeout(timer);
      set({ loading: false });
    }

    // Listen for auth changes (don't block init)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      set({ user });
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
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
      .select('*')
      .eq('id', profile.id)
      .single();
    if (data) set({ profile: data as Profile });
  },
}));
