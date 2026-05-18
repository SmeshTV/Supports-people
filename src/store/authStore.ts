import { create } from 'zustand';
import { supabaseAdmin, type UserProfile } from '../lib/supabase';
import { firebaseAuth, type AuthResult } from '../lib/firebaseAuth';

const DEV_EMAIL = 'smeshtrend@gmail.com';

type AuthStore = {
  user: UserProfile | null;
  firebaseUser: import('firebase/auth').User | null;
  isDevMode: boolean;
  authModal: 'login' | 'register' | null;
  loading: boolean;
  authLoading: boolean;
  error: string | null;
  
  setUser: (user: UserProfile | null) => void;
  setFirebaseUser: (user: import('firebase/auth').User | null) => void;
  toggleDevMode: () => void;
  openAuthModal: (type: 'login' | 'register') => void;
  closeAuthModal: () => void;
  clearError: () => void;
  
  register: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  syncUserFromFirebaseUid: (firebaseUid: string, email: string, displayName?: string) => Promise<void>;
  initAuthListener: () => () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  firebaseUser: null,
  isDevMode: false,
  authModal: null,
  loading: false,
  authLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  clearError: () => set({ error: null }),

  toggleDevMode: () => {
    const { user, isDevMode } = get();
    if (!user || user.email !== DEV_EMAIL) return;
    set({ isDevMode: !isDevMode });
  },

  openAuthModal: (type) => {
    set({ authModal: type, error: null });
  },
  
  closeAuthModal: () => {
    set({ authModal: null, error: null });
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ authLoading: true, error: null });
    const result = await firebaseAuth.register(email, password, displayName);
    
    if (result.user) {
      const firebaseUid = result.user.uid;
      await get().syncUserFromFirebaseUid(firebaseUid, email, displayName);
    } else {
      set({ error: result.error });
    }
    
    set({ authLoading: false });
    return result;
  },

  login: async (email: string, password: string) => {
    set({ authLoading: true, error: null });
    const result = await firebaseAuth.login(email, password);
    
    if (result.user) {
      const firebaseUid = result.user.uid;
      await get().syncUserFromFirebaseUid(firebaseUid, email, result.user.displayName || undefined);
    } else {
      set({ error: result.error });
    }
    
    set({ authLoading: false });
    return result;
  },

  logout: async () => {
    await firebaseAuth.logout();
    set({ user: null, firebaseUser: null, isDevMode: false });
  },

  syncUserFromFirebaseUid: async (firebaseUid: string, email: string, displayName = '') => {
    set({ loading: true });
    
    try {
      const { data: existing } = await supabaseAdmin.from('users').select('*').eq('firebase_uid', firebaseUid).maybeSingle();

      if (existing) {
        await supabaseAdmin.from('users').update({ last_seen: new Date().toISOString() }).eq('firebase_uid', firebaseUid);
        set({ user: existing as UserProfile, loading: false });
        return;
      }

      const role = email === DEV_EMAIL ? 'admin' : 'student';
      const { data: created, error: createError } = await supabaseAdmin.from('users').insert({ 
        firebase_uid: firebaseUid, 
        email, 
        display_name: displayName || email.split('@')[0], 
        role 
      }).select('*').maybeSingle();

      if (createError) {
        // 409 = user already exists (race condition), just fetch it
        if (createError.code === '23505' || createError.message?.includes('duplicate')) {
          const { data: retry } = await supabaseAdmin.from('users').select('*').eq('firebase_uid', firebaseUid).maybeSingle();
          if (retry) { set({ user: retry as UserProfile, loading: false }); return; }
        }
        console.error('Create user error:', createError);
      }
      
      if (created) {
        set({ user: created as UserProfile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Error syncing user:', err);
      set({ loading: false });
    }
  },

  initAuthListener: () => {
    return firebaseAuth.onAuthChange(async (firebaseUser) => {
      set({ firebaseUser });
      
      if (firebaseUser) {
        await get().syncUserFromFirebaseUid(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName || undefined
        );
      } else {
        set({ user: null });
      }
    });
  },
}));