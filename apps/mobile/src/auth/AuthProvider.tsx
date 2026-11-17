import { hasAccess, type Profile } from '@finny/shared';
import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, use, useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';
import { clearNotificationsOnSignOut } from '@/notifications';

import { signInWithGoogle, signOutGoogle } from './google';
import { TERMS_VERSION } from './terms';

/** Error codes the screens translate. Anything unknown becomes `generic`. */
export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'emailInvalid'
  | 'codeInvalid'
  | 'tooManyRequests'
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
  /**
   * The signed-in user accepted the terms. Email sign-up accepts them on the way in;
   * a first Google sign-in is sent to accept them before anything else.
   */
  termsAccepted: boolean;
  signIn: (email: string, password: string) => Promise<AuthErrorCode | null>;
  /** Sign in or sign up with Google. `cancelled` = the user closed the Google page. */
  signInWithGoogle: () => Promise<AuthErrorCode | 'cancelled' | null>;
  /** Saves the current terms version and time on the signed-in user. */
  acceptTerms: () => Promise<AuthErrorCode | null>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthErrorCode | null>;
  /** Sends a 6-digit reset code to the email. Same answer for unknown emails. */
  requestPasswordReset: (email: string) => Promise<AuthErrorCode | null>;
  /** Checks the code, then sets the new password. Signs the user in on success. */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthErrorCode | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toErrorCode(error: { code?: string; status?: number; message?: string }): AuthErrorCode {
  // Dev only: show why Supabase refused, so a vague message in the UI is never a mystery.
  // Never logs the password or the email.
  if (__DEV__) {
    console.warn('[auth] error', { code: error.code, status: error.status, message: error.message });
  }
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalidCredentials';
    case 'user_already_exists':
    case 'email_exists':
      return 'emailTaken';
    case 'otp_expired':
      return 'codeInvalid';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'tooManyRequests';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'emailInvalid';
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
    termsAccepted: typeof session?.user.user_metadata?.terms_version === 'string',
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? toErrorCode(error) : null;
    },
    signInWithGoogle: async () => {
      const result = await signInWithGoogle();
      if (result === 'cancelled') return 'cancelled';
      return result === 'ok' ? null : 'generic';
    },
    acceptTerms: async () => {
      // Updates the session too (USER_UPDATED), so the guard moves on by itself.
      const { error } = await supabase.auth.updateUser({
        data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() },
      });
      return error ? toErrorCode(error) : null;
    },
    signUp: async (fullName, email, password) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            terms_version: TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });
      if (error) return toErrorCode(error);
      // No session means the project still asks for email confirmation.
      return data.session ? null : 'confirmEmail';
    },
    requestPasswordReset: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      return error ? toErrorCode(error) : null;
    },
    resetPassword: async (email, code, newPassword) => {
      const verified = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });
      if (verified.error) {
        const mapped = toErrorCode(verified.error);
        return mapped === 'generic' ? 'codeInvalid' : mapped;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return error ? toErrorCode(error) : null;
    },
    signOut: async () => {
      // While still signed in: this device stops getting the user's reminders.
      await clearNotificationsOnSignOut();
      await supabase.auth.signOut();
      await signOutGoogle();
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
