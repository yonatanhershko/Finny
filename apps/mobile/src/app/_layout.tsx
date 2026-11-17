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
import { LogBox } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { SplashScreenArt } from '@/components/nature/SplashScreenArt';
import { initI18n } from '@/i18n';
import {
  loadLanguagePreference,
  loadThemePreference,
  type ThemePreference,
} from '@/lib/preferences';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Comes from a library touching RN's old ImageBackground export; we do not use it.
LogBox.ignoreLogs(['ImageBackground is deprecated']);

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Rubik_400Regular, Rubik_500Medium, Rubik_700Bold });
  const [themePreference, setThemePreference] = useState<ThemePreference | null>(null);
  const [minElapsed, setMinElapsed] = useState(false);

  // Hand over from the still native splash to the moving one right away, and
  // keep the moving one up long enough to be seen.
  useEffect(() => {
    void SplashScreen.hideAsync();
    const timer = setTimeout(() => setMinElapsed(true), 1400);
    return () => clearTimeout(timer);
  }, []);

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
  if (!ready || !minElapsed) return <SplashScreenArt />;

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
 *   signed in, no terms   -> accept-terms (first Google sign-in)
 *   signed in, no access  -> locked   (pending / rejected / expired)
 *   signed in, access     -> (app)
 * The root index screen redirects to the right one. The database enforces the
 * same rule with RLS; this only decides what is shown.
 */
function GuardedStack() {
  const { theme, colors } = useTheme();
  const { loading, session, access, termsAccepted } = useAuth();

  if (loading) return <SplashScreenArt />;

  const signedIn = session !== null;
  // A first Google sign-in must accept the terms before anything else.
  const ready = signedIn && termsAccepted;

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth-callback" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !termsAccepted}>
          <Stack.Screen name="accept-terms" />
        </Stack.Protected>
        <Stack.Protected guard={ready && !access}>
          <Stack.Screen name="locked" />
        </Stack.Protected>
        <Stack.Protected guard={ready && access}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
