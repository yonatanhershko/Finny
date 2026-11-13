import { reloadAppAsync } from 'expo';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { useSyncExternalStore } from 'react';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import { type Language, saveLanguagePreference } from '@/lib/preferences';

import en from './en.json';
import he from './he.json';

const i18n = createInstance();

export const languages: Language[] = ['he', 'en'];
const rtlLanguages: Language[] = ['he'];

export const isRtl = (language: Language) => rtlLanguages.includes(language);

/** Phone language if it is one we support, otherwise Hebrew. */
export function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  // Older Android reports Hebrew as "iw".
  if (code === 'he' || code === 'iw') return 'he';
  if (code === 'en') return 'en';
  return 'he';
}

/**
 * Point the layout the right way for the language.
 * Native needs a reload when direction flips; returns true when one was triggered.
 */
async function applyDirection(language: Language): Promise<boolean> {
  const rtl = isRtl(language);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
    return false;
  }
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
    await reloadAppAsync();
    return true;
  }
  return false;
}

/** Call once at startup. `saved` is the user's earlier choice, if any. */
export async function initI18n(saved: Language | null): Promise<void> {
  const language = saved ?? deviceLanguage();
  await i18n.use(initReactI18next).init({
    resources: { he: { translation: he }, en: { translation: en } },
    lng: language,
    fallbackLng: 'he',
    interpolation: { escapeValue: false },
  });
  await applyDirection(language);
}

/** User picked a language in settings. May reload the app to flip direction. */
export async function changeLanguage(language: Language): Promise<void> {
  await saveLanguagePreference(language);
  await i18n.changeLanguage(language);
  await applyDirection(language);
}

export const currentLanguage = (): Language => (i18n.language === 'en' ? 'en' : 'he');

function subscribeToLanguage(onChange: () => void) {
  i18n.on('languageChanged', onChange);
  return () => i18n.off('languageChanged', onChange);
}

/** Active language as React state. Use this in components, not currentLanguage(). */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribeToLanguage, currentLanguage, currentLanguage);
}

export default i18n;
