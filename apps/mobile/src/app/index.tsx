import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';

/** Entry point and fallback: sends each user to the one area they may see. */
export default function Index() {
  const { session, access } = useAuth();
  if (!session) return <Redirect href="/welcome" />;
  if (!access) return <Redirect href="/locked" />;
  return <Redirect href="/home" />;
}
