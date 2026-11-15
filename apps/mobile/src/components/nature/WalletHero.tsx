import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

import { Sway } from './Sway';
import { Wallet } from './Wallet';

/** Organic blob shape, centered on 0,0 and about 178 units wide. */
const BLOB_PATH =
  'M63,-60.1C79.5,-46.5,89.2,-23.3,88.5,-0.7C87.7,21.8,76.6,43.6,60.1,57.6C43.6,71.6,21.8,77.7,1.7,76.1C-18.5,74.4,-37,64.9,-53,51C-69,37,-82.5,18.5,-84.4,-1.9C-86.3,-22.3,-76.6,-44.6,-60.6,-58.2C-44.6,-71.8,-22.3,-76.7,0.5,-77.2C23.3,-77.7,46.5,-73.7,63,-60.1Z';

/**
 * Hero art for login and every register step: the wallet alone on a soft
 * blob. The blob stays still; only the wallet turns. The turn is flat
 * (no real depth), so the wallet never dips behind the blob.
 */
export function WalletHero({ size = 280 }: { size?: number }) {
  const { colors } = useTheme();
  const height = size * 0.86;

  return (
    <View
      style={{ width: size, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg
        width={size}
        height={height}
        viewBox="10 10 180 180"
        preserveAspectRatio="none"
        style={{ position: 'absolute' }}>
        <Path
          d={BLOB_PATH}
          transform="translate(100 100)"
          fill={colors.leafLight}
          opacity={0.55}
        />
      </Svg>
      <Sway
        flat
        rotateY={22}
        rotateX={7}
        tilt={2}
        bob={5}
        duration={3200}
        style={{ position: 'absolute', left: size * 0.2, top: height * 0.14 }}>
        <Wallet size={size * 0.6} />
      </Sway>
    </View>
  );
}
