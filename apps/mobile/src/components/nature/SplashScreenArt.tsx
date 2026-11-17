import { colors as tokenColors } from '@finny/tokens';
import { useColorScheme, View } from 'react-native';

import { Backdrop } from './Backdrop';
import { WalletLoader } from './WalletLoader';

/**
 * Loading screen: the logo wallet popping its cards on the app background. Shown
 * after the native splash (which cannot animate) hands over. No words on purpose:
 * it shows before the saved language is read, so text would flash in the wrong
 * language. Works before the theme provider exists, so it reads the phone's
 * light/dark setting directly.
 */
export function SplashScreenArt() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
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
      <WalletLoader width={160} burstColor={tokenColors[scheme].accent} />
    </View>
  );
}
