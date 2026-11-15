import { colors as tokenColors } from '@finny/tokens';
import { useColorScheme, View } from 'react-native';

import i18n, { currentLanguage, deviceLanguage } from '@/i18n';
import en from '@/i18n/en.json';
import he from '@/i18n/he.json';

import { Backdrop } from './Backdrop';
import { JumpingText } from './JumpingText';
import { Sway } from './Sway';
import { Wallet } from './Wallet';

/**
 * Loading screen: the wallet turning on the app background. Shown after the
 * native splash (which cannot animate) hands over. Works before the theme
 * provider exists, so it reads the phone's light/dark setting directly.
 */
export function SplashScreenArt() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  // Shown before i18n is ready, so read the strings straight from the files.
  const language = i18n.isInitialized ? currentLanguage() : deviceLanguage();
  const label = (language === 'he' ? he : en).splash.loading;
  return (
    <View
      accessibilityLabel="Finny"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokenColors[scheme].background,
      }}>
      <Backdrop theme={scheme} />
      <Sway flat rotateY={26} rotateX={7} tilt={2} bob={6} duration={1400}>
        <Wallet size={160} />
      </Sway>
      <View style={{ marginTop: 28 }}>
        <JumpingText text={label} color={tokenColors[scheme].text} rtl={language === 'he'} />
      </View>
    </View>
  );
}
