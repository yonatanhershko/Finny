import { hasAccess, type Profile } from '@finny/shared';
import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, use, useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

/** Error codes the screens translate. Anything unknown becomes `generic`. */
export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'weakPassword'
  | 'confirmEmail'
  | 'network'
  | 'generic';

type AuthContextValue = {
  /** True until the stored session (and its profile) has been read once. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** The profile could not be loaded (for example, no network). */
  profileError: boolean;
  /** May use the app. The database enforces this too; this only drives navigation. */
  access: boolean;
  signIn: (email: string, password: string) => Promise<AuthErrorCode | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthErrorCode | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toErrorCode(error: { code?: string; status?: number; message?: string }): AuthErrorCode {
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalidCredentials';
    case 'user_already_exists':
    case 'email_exists':
      return 'emailTaken';
    case 'weak_password':
      return 'weakPassword';
    case 'email_not_confirmed':
      return 'confirmEmail';
    default:
      // fetch failures surface with no status
      return error.status === undefined || error.status === 0 ? 'network' : 'generic';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    // Keep this callback synchronous: calling Supabase inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const applyProfile = useCallback((id: string, data: Profile | null, failed: boolean) => {
    setProfile(failed ? null : data);
    setProfileError(failed || !data);
    setProfileLoadedFor(id);
  }, []);

  const loadProfile = useCallback(
    async (id: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      applyProfile(id, data, !!error);
    },
    [applyProfile],
  );

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (alive) applyProfile(userId, data, !!error);
      });
    return () => {
      alive = false;
    };
  }, [userId, applyProfile]);

  // An admin may approve while the app is in the background: re-check on return.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadProfile(userId);
    });
    return () => sub.remove();
  }, [userId, loadProfile]);

  const signedInProfile = userId && profileLoadedFor === userId ? profile : null;

  const value: AuthContextValue = {
    loading: !sessionLoaded || (userId !== null && profileLoadedFor !== userId),
    session,
    profile: signedInProfile,
    profileError: userId !== null && profileLoadedFor === userId && profileError,
    access: signedInProfile ? hasAccess(signedInProfile) : false,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? toErrorCode(error) : null;
    },
    signUp: async (fullName, email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) return toErrorCode(error);
      // No session means the project still asks for email confirmation.
      return data.session ? null : 'confirmEmail';
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (userId) await loadProfile(userId);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
