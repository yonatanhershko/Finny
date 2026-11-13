import type { ExpoConfig } from 'expo/config';

/**
 * Two fully separate app variants so dev and prod can sit on one phone:
 *   development -> "Finny Dev", finny-dev://, com.finny.app.dev
 *   production  -> "Finny",     finny://,     com.finny.app
 * APP_VARIANT is set per build profile in eas.json. Local `expo start` is development.
 */
const variant = process.env.APP_VARIANT === 'production' ? 'production' : 'development';
const isProd = variant === 'production';

const bundleId = isProd ? 'com.finny.app' : 'com.finny.app.dev';

const config: ExpoConfig = {
  name: isProd ? 'Finny' : 'Finny Dev',
  slug: 'finny',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: isProd ? 'finny' : 'finny-dev',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: bundleId,
    supportsTablet: false,
  },
  android: {
    package: bundleId,
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
    ['expo-localization', { supportedLocales: { ios: ['he', 'en'], android: ['he', 'en'] } }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F1E8',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
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
  },
};

export default config;
