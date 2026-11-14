import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

import { Sway } from './Sway';
import { Wallet } from './Wallet';

/**
 * Hero art for login and every register step: the wallet alone on a soft
 * blob, turning slowly in 3D. No leaves on the wallet (owner's call).
 */
export function WalletHero({ size = 280 }: { size?: number }) {
  const { colors } = useTheme();
  const height = size * 0.86;

  return (
    <View
      style={{ width: size, height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={height} style={{ position: 'absolute' }}>
        <Ellipse cx={size * 0.5} cy={height * 0.56} rx={size * 0.48} ry={height * 0.36} fill={colors.leafLight} opacity={0.55} />
      </Svg>

      <Sway rotateY={16} rotateX={6} tilt={1.5} bob={5} duration={3200} style={{ position: 'absolute', left: size * 0.2, top: height * 0.14 }}>
        <Wallet size={size * 0.6} />
      </Sway>

    </View>
  );
}
