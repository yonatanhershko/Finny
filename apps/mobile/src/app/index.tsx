import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';

/** Entry point and fallback: sends each user to the one area they may see. */
export default function Index() {
  const { session, access, termsAccepted } = useAuth();
  if (!session) return <Redirect href="/sign-in" />;
  if (!termsAccepted) return <Redirect href="/accept-terms" />;
  if (!access) return <Redirect href="/locked" />;
  return <Redirect href="/today" />;
}
