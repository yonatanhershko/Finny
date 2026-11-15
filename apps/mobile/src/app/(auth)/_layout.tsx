import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Swipe sideways to go back.
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
