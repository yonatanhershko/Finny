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

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider initialPreference={themePreference}>
      <ThemedStack />
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { theme, colors } = useTheme();
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      />
    </>
  );
}
