import '@/global.css';

import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
  useFonts,
} from '@expo-google-fonts/rubik';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { initI18n } from '@/i18n';
import {
  loadLanguagePreference,
  loadThemePreference,
  type ThemePreference,
} from '@/lib/preferences';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Rubik_400Regular, Rubik_500Medium, Rubik_700Bold });
  const [themePreference, setThemePreference] = useState<ThemePreference | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [theme, language] = await Promise.all([loadThemePreference(), loadLanguagePreference()]);
      await initI18n(language);
      if (alive) setThemePreference(theme);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // A font that fails to load must not lock the app on the splash screen.
  const ready = (fontsLoaded || !!fontError) && themePreference !== null;
  if (!ready) return null;

  return (
    <ThemeProvider initialPreference={themePreference}>
      <AuthProvider>
        <GuardedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * The global navigation guard. Exactly one group is reachable at a time:
 *   signed out            -> (auth)
 *   signed in, no access  -> locked   (pending / rejected / expired)
 *   signed in, access     -> (app)
 * The root index screen redirects to the right one. The database enforces the
 * same rule with RLS; this only decides what is shown.
 */
function GuardedStack() {
  const { theme, colors } = useTheme();
  const { loading, session, access } = useAuth();

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  const signedIn = session !== null;

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !access}>
          <Stack.Screen name="locked" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && access}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
