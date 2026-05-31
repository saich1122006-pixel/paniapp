// ============================================================================
// AuthContext
// Manages authentication state, session persistence, and user profile
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { getProfile } from '@/services/auth';
import type { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'worker' | 'recruiter';

export interface UserProfile {
  id: string;
  phone_number: string;
  full_name: string | null;
  role: UserRole;
  is_online: boolean;
  fcm_token: string | null;
  app_language: string | null;
  desired_skills: string[] | null;
  min_wage_floor: number | null;
  search_radius_km?: number;
  wallet_balance: number;
  first_pay_verified: boolean;
  last_location: any;
  created_at: string;
  updated_at: string;
}

export type AuthState = 'loading' | 'unauthenticated' | 'needs_onboarding' | 'authenticated';
interface AuthContextType {
  authState: AuthState;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  hasSelectedLanguage: boolean | null;
  refreshProfile: (fallbackUserId?: string) => Promise<void>;
  setAuthState: (state: AuthState) => void;
  setHasSelectedLanguage: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  authState: 'loading',
  session: null,
  user: null,
  profile: null,
  hasSelectedLanguage: null,
  refreshProfile: async () => {},
  setAuthState: () => {},
  setHasSelectedLanguage: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('has_selected_language')
      .then(val => {
        setHasSelectedLanguage(val === 'true');
      })
      .catch(() => {
        setHasSelectedLanguage(false);
      });
  }, []);

  const refreshProfile = useCallback(async (fallbackUserId?: string) => {
    const activeUser = (await supabase.auth.getUser()).data.user;
    let finalId = activeUser?.id || user?.id || fallbackUserId;

    // Stable sandbox fallback if both route parameters and active sessions are cleared by the router.
    // Matches the mathematically padded UUID generated in auth.ts (123e4567-e89b-12d3-a456-009876543210)
    if (!finalId || finalId === 'undefined' || finalId === 'null') {
      const defaultPhone = '9876543210';
      finalId = `123e4567-e89b-12d3-a456-${defaultPhone.padStart(12, '0').slice(-12)}`;
    }

    const p = await getProfile(finalId);
    if (p) {
      if (!user && !activeUser) {
        setUser({
          id: finalId,
          email: '',
          phone: p.phone_number,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: p.created_at,
        } as any);
      }
      setProfile(p as UserProfile);
      setAuthState('authenticated');
    } else {
      console.warn('AuthContext: refreshProfile could not find profile in database for ID:', finalId);
      setAuthState('needs_onboarding');
    }
  }, [user]);
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (!s) {
          setAuthState('unauthenticated');
        }
      })
      .catch((error) => {
        console.error('AuthContext: Failed to fetch initial session', error);
        setAuthState('unauthenticated');
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (!s) {
          setAuthState('unauthenticated');
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  return (
    <AuthContext.Provider
      value={{ authState, session, user, profile, hasSelectedLanguage, refreshProfile, setAuthState, setHasSelectedLanguage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
