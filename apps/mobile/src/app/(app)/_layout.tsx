import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/** Everything in here needs an active subscription (guard in the root layout). */
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    />
  );
}
