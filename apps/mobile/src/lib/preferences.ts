import AsyncStorage from '@react-native-async-storage/async-storage';

/** Small device-local preferences. Not sensitive, so plain storage is fine. */
export type ThemePreference = 'system' | 'light' | 'dark';
export type Language = 'he' | 'en';

const THEME_KEY = 'finny.theme';
const LANGUAGE_KEY = 'finny.language';

export async function loadThemePreference(): Promise<ThemePreference> {
  const value = await AsyncStorage.getItem(THEME_KEY).catch(() => null);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export async function saveThemePreference(value: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, value);
}

/** null means the user never chose, so the phone language decides. */
export async function loadLanguagePreference(): Promise<Language | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY).catch(() => null);
  return value === 'he' || value === 'en' ? value : null;
}

export async function saveLanguagePreference(value: Language): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, value);
}
