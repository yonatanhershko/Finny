import { leafPalette } from '@finny/tokens';
import { StyleSheet, View } from 'react-native';

import { isRtl, useLanguage } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

import { Leaf } from './Leaf';
import { LeafBranch } from './LeafBranch';
import { LeafCluster } from './LeafCluster';
import { Sway } from './Sway';

/**
 * Leaf decoration behind a screen's content. Never takes touches and is
 * hidden from screen readers.
 *   low    - corner clusters only (dense screens: lists, forms)
 *   medium - clusters + side branches (home, stats, goals)
 *   high   - all of it + drifting 3D leaves (auth, locked, empty states)
 */
export type LeafDensity = 'low' | 'medium' | 'high';

type Drifting = { left: `${number}%`; top: `${number}%`; size: number; rotate: number; color: number; duration: number; delay: number };

/** Shown from `medium` up. */
const driftingFew: Drifting[] = [
  { left: '86%', top: '24%', size: 24, rotate: -50, color: 5, duration: 3300, delay: 0 },
  { left: '5%', top: '62%', size: 22, rotate: 60, color: 4, duration: 3000, delay: 600 },
  { left: '64%', top: '88%', size: 20, rotate: -25, color: 6, duration: 3500, delay: 300 },
];

/** Added on `high`. */
const driftingMany: Drifting[] = [
  { left: '10%', top: '8%', size: 30, rotate: 35, color: 5, duration: 3300, delay: 0 },
  { left: '74%', top: '5%', size: 26, rotate: -40, color: 6, duration: 2900, delay: 500 },
  { left: '91%', top: '40%', size: 22, rotate: -70, color: 4, duration: 3600, delay: 250 },
  { left: '2%', top: '40%', size: 24, rotate: 75, color: 3, duration: 3100, delay: 800 },
  { left: '72%', top: '72%', size: 20, rotate: -20, color: 6, duration: 3400, delay: 400 },
  { left: '28%', top: '92%', size: 24, rotate: 20, color: 2, duration: 3000, delay: 700 },
  { left: '46%', top: '3%', size: 18, rotate: -10, color: 4, duration: 3700, delay: 150 },
  { left: '18%', top: '78%', size: 18, rotate: 100, color: 5, duration: 2800, delay: 950 },
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
        <LeafCluster size={density === 'low' ? 120 : density === 'medium' ? 170 : 200} />
      </View>
      <View style={[styles.bottomEnd, { transform: [{ scaleX: -flip }] }]}>
        <LeafCluster size={density === 'low' ? 104 : density === 'medium' ? 150 : 180} />
      </View>

      {density !== 'low' && (
        <>
          <View style={[styles.topEnd, { transform: [{ scaleX: -flip }, { scaleY: -1 }] }]}>
            <LeafCluster size={density === 'medium' ? 96 : 120} />
          </View>
          <View style={[styles.startBranch, { transform: [{ scaleX: flip }] }]}>
            <Sway rotateY={12} rotateX={3} tilt={2.5} baseRotate={12} bob={2} duration={3600}>
              <LeafBranch size={170} />
            </Sway>
          </View>
        </>
      )}

      {density === 'high' && (
        <>
          <View style={[styles.topStart, { transform: [{ scaleX: flip }, { scaleY: -1 }] }]}>
            <LeafCluster size={108} />
          </View>
          <View style={[styles.endBranch, { transform: [{ scaleX: -flip }] }]}>
            <Sway rotateY={12} rotateX={3} tilt={2.5} baseRotate={-14} bob={2} duration={3200} delay={300}>
              <LeafBranch size={150} />
            </Sway>
          </View>
        </>
      )}
      {density !== 'low' &&
        [...driftingFew, ...(density === 'high' ? driftingMany : [])].map((leaf) => (
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
  topEnd: { position: 'absolute', end: -18, top: -10 },
  topStart: { position: 'absolute', start: -18, top: -10 },
  startBranch: { position: 'absolute', start: -18, top: '30%' },
  endBranch: { position: 'absolute', end: -14, top: '52%' },
});
