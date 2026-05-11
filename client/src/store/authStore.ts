import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error || !data.session) throw new Error(error?.message ?? 'Login failed');

          // Fetch full profile from our backend
          const { data: profile } = await api.get<User>('/auth/me');
          set({ user: profile });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        disconnectSocket();
        set({ user: null });
        window.location.href = '/login';
      },

      fetchMe: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { set({ user: null }); return; }
          const { data: profile } = await api.get<User>('/auth/me');
          set({ user: profile });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: 'sms-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
