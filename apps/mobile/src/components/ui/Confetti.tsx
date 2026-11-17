import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

const PIECES = 16;
const DURATION = 1300;

// Fixed, evenly spread directions: the burst looks the same every time (no randomness needed).
const pieces = Array.from({ length: PIECES }, (_, index) => {
  const angle = (index / PIECES) * Math.PI * 2 + (index % 2 ? 0.2 : -0.15);
  return {
    dx: Math.cos(angle) * (46 + (index % 3) * 18),
    // more up than down, so it reads as a pop
    up: 40 + (index % 4) * 16 + Math.max(0, -Math.sin(angle)) * 20,
    fall: 70 + (index % 5) * 10,
    spin: (index % 2 ? 1 : -1) * (220 + index * 18),
    size: 6 + (index % 3) * 2,
    round: index % 3 === 0,
    color: index % 4,
  };
});

/**
 * A small one-time confetti pop, centered on its parent. Plays when `play`
 * turns true. Draws nothing when the phone asks for reduced motion.
 * The parent needs `position: relative` (the default) and no overflow clipping.
 */
export function Confetti({ play }: { play: boolean }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const palette = [colors.accent, colors.primary, colors.success, colors.secondary];

  useEffect(() => {
    if (!play || reduceMotion) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
  }, [play, reduceMotion, progress]);

  if (!play || reduceMotion) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.center]}>
      {pieces.map((piece, index) => (
        <Piece key={index} piece={piece} color={palette[piece.color]} progress={progress} />
      ))}
    </View>
  );
}

function Piece({
  piece,
  color,
  progress,
}: {
  piece: (typeof pieces)[number];
  color: string;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // up quickly, then gravity pulls it down
    const y = -piece.up * Math.sin(Math.min(p * 1.6, 1) * (Math.PI / 2)) + piece.fall * p * p;
    return {
      opacity: p === 0 ? 0 : p < 0.65 ? 1 : Math.max(0, 1 - (p - 0.65) / 0.35),
      transform: [{ translateX: piece.dx * p }, { translateY: y }, { rotate: `${piece.spin * p}deg` }],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.6,
          borderRadius: piece.round ? piece.size / 2 : 1.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
