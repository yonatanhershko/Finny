import type { ExpoConfig } from 'expo/config';

/**
 * Two fully separate app variants so dev and prod can sit on one phone:
 *   development -> "Finny Dev", finny-dev://, com.finny.app.dev
 *   production  -> "Finny",     finny://,     com.finny.app
 * APP_VARIANT is set per build profile in eas.json. Local `expo start` is development.
 */
const variant = process.env.APP_VARIANT === 'production' ? 'production' : 'development';
const isProd = variant === 'production';

// The EAS project (@yonatan88/finny), shared by dev and prod. Needed for builds and push tokens.
// Not a secret. Written here and not only in .env, because the EAS CLI does not read .env files.
const easProjectId = process.env.EAS_PROJECT_ID || '16416794-d403-4825-be8e-6f2745e153e4';

// Firebase config for Android push (delivery only): path to google-services.json, set once
// the owner has downloaded it (GOOGLE_SERVICES_JSON=./google-services.json). See docs/notifications-setup.md.
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || undefined;

const bundleId = isProd ? 'com.finny.app' : 'com.finny.app.dev';

// Google sign-in client IDs (Google Cloud project finny-f9dba). Not secrets: they ship inside the app.
// Web client = the one Supabase uses, shared by dev and prod. iOS client: one per bundle ID.
// Android clients need no ID here (Google matches package + SHA-1). See docs/google-sign-in.md.
const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '542359804466-g6fep91ls990ksosp6r886gqp3ll7v7f.apps.googleusercontent.com';
const googleIosClientId = isProd
  ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_PROD
  : process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_DEV ||
    '542359804466-c6gf7j8jmtkcvflmnac3nr644r6ppsaj.apps.googleusercontent.com';
// iOS needs the reversed client ID as a URL scheme so Google can hand back to the app.
const googleIosUrlScheme = googleIosClientId
  ? `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}`
  : undefined;

const config: ExpoConfig = {
  name: isProd ? 'Finny' : 'Finny Dev',
  slug: 'finny',
  owner: 'yonatan88',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: isProd ? 'finny' : 'finny-dev',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: bundleId,
    // Optional: signing team for local device builds, set per machine (APPLE_TEAM_ID=...). Not stored in git.
    appleTeamId: process.env.APPLE_TEAM_ID,
    supportsTablet: false,
    // No custom encryption (HTTPS only), so App Store Connect skips the export-compliance question.
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: bundleId,
    googleServicesFile,
    adaptiveIcon: {
      backgroundColor: '#F5F1E8',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    // Push + local notifications. The small Android status-bar icon is the default one for now.
    'expo-notifications',
    // Native Google sign-in. Android needs no plugin options; iOS only once its client ID is set.
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, object]]
      : []),
    ['expo-localization', { supportedLocales: { ios: ['he', 'en'], android: ['he', 'en'] } }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F1E8',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        // The native splash can only follow the phone's setting; the moving one after it follows the app's.
        dark: { backgroundColor: '#16211C', image: './assets/images/splash-icon.png' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    appVariant: variant,
    supportsRTL: true,
    googleClientIds: { web: googleWebClientId, ios: googleIosClientId },
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
};

export default config;
