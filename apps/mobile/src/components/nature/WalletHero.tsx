import { leafPalette } from '@finny/tokens';
import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

import { Leaf } from './Leaf';
import { LeafBranch } from './LeafBranch';
import { Sway } from './Sway';
import { Wallet } from './Wallet';

/**
 * Hero art for login and every register step: the wallet, branches behind it,
 * and leaves that turn in 3D around it. Positions are fractions of `size`
 * so the whole thing scales.
 */
const floatingLeaves: {
  x: number;
  y: number;
  size: number;
  rotate: number;
  color: number;
  duration: number;
  delay: number;
}[] = [
  { x: 0.04, y: 0.5, size: 0.17, rotate: -35, color: 3, duration: 2600, delay: 0 },
  { x: 0.13, y: 0.18, size: 0.13, rotate: 20, color: 5, duration: 3200, delay: 300 },
  { x: 0.3, y: 0.02, size: 0.11, rotate: -15, color: 6, duration: 2900, delay: 700 },
  { x: 0.62, y: 0.0, size: 0.12, rotate: 30, color: 4, duration: 3400, delay: 150 },
  { x: 0.8, y: 0.14, size: 0.15, rotate: 55, color: 2, duration: 2700, delay: 500 },
  { x: 0.87, y: 0.46, size: 0.18, rotate: 40, color: 1, duration: 3100, delay: 900 },
  { x: 0.78, y: 0.72, size: 0.12, rotate: 110, color: 5, duration: 3600, delay: 200 },
  { x: 0.1, y: 0.74, size: 0.12, rotate: -110, color: 6, duration: 3300, delay: 600 },
  { x: 0.46, y: -0.04, size: 0.1, rotate: 5, color: 3, duration: 3000, delay: 450 },
  { x: 0.93, y: 0.28, size: 0.1, rotate: 80, color: 6, duration: 2800, delay: 1000 },
  { x: -0.03, y: 0.3, size: 0.11, rotate: -70, color: 4, duration: 3500, delay: 350 },
  { x: 0.55, y: 0.84, size: 0.1, rotate: 150, color: 3, duration: 3200, delay: 800 },
  { x: 0.3, y: 0.84, size: 0.09, rotate: -150, color: 2, duration: 2900, delay: 100 },
];

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

      <Sway rotateY={14} rotateX={4} tilt={3} baseRotate={-18} bob={2} duration={3400} style={{ position: 'absolute', left: size * 0.02, top: height * 0.1 }}>
        <LeafBranch size={height * 0.8} />
      </Sway>
      <Sway rotateY={14} rotateX={4} tilt={3} baseRotate={24} bob={2} duration={3000} delay={400} style={{ position: 'absolute', right: size * 0.0, top: height * 0.14 }}>
        <LeafBranch size={height * 0.74} />
      </Sway>

      <Sway rotateY={9} rotateX={5} tilt={1.5} bob={5} duration={3200} style={{ position: 'absolute', left: size * 0.2, top: height * 0.14 }}>
        <Wallet size={size * 0.6} />
      </Sway>

      {floatingLeaves.map((leaf) => (
        <Sway
          key={`${leaf.x}-${leaf.y}`}
          rotateY={48}
          rotateX={22}
          tilt={10}
          baseRotate={leaf.rotate}
          bob={6}
          duration={leaf.duration}
          delay={leaf.delay}
          style={{ position: 'absolute', left: size * leaf.x, top: height * leaf.y }}>
          <Leaf size={size * leaf.size} color={leafPalette[leaf.color]} />
        </Sway>
      ))}
    </View>
  );
}
