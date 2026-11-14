import { leafPalette } from '@finny/tokens';
import { StyleSheet, View } from 'react-native';

import { isRtl, useLanguage } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { Leaf } from './Leaf';
import { LeafCluster } from './LeafCluster';
import { Sway } from './Sway';

/**
 * Leaf decoration behind a screen's content. Kept sparse on purpose.
 * Never takes touches and is hidden from screen readers.
 *   low    - one small bottom corner cluster (dense screens: lists, forms)
 *   medium - two small bottom corner clusters (home, stats, goals)
 *   high   - the two clusters + two drifting 3D leaves (auth, locked, empty states)
 */
export type LeafDensity = 'low' | 'medium' | 'high';

const drifting: { left: `${number}%`; top: `${number}%`; size: number; rotate: number; color: number; duration: number; delay: number }[] = [
  { left: '84%', top: '10%', size: 24, rotate: -40, color: 5, duration: 3300, delay: 0 },
  { left: '6%', top: '58%', size: 20, rotate: 60, color: 4, duration: 3000, delay: 600 },
];

export function LeafBackground({ density = 'medium' }: { density?: LeafDensity }) {
  const { theme } = useTheme();
  const opacity = theme === 'dark' ? 0.5 : 0.85;
  // Positions use start/end, so in RTL the art lands on the other side and must mirror too.
  const flip = isRtl(useLanguage()) ? -1 : 1;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.layer, { opacity }]}>
      <View style={[styles.bottomStart, { transform: [{ scaleX: flip }] }]}>
        <LeafCluster size={density === 'low' ? 84 : 104} />
      </View>
      {density !== 'low' && (
        <View style={[styles.bottomEnd, { transform: [{ scaleX: -flip }] }]}>
          <LeafCluster size={88} />
        </View>
      )}
      {density === 'high' &&
        drifting.map((leaf) => (
          <Sway
            key={`${leaf.left}-${leaf.top}`}
            rotateY={50}
            rotateX={24}
            tilt={12}
            baseRotate={leaf.rotate}
            bob={7}
            duration={leaf.duration}
            delay={leaf.delay}
            style={{ position: 'absolute', left: leaf.left, top: leaf.top }}>
            <Leaf size={leaf.size} color={leafPalette[leaf.color]} />
          </Sway>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { overflow: 'hidden' },
  bottomStart: { position: 'absolute', start: -22, bottom: -14 },
  bottomEnd: { position: 'absolute', end: -22, bottom: -14 },
});
