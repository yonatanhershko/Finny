import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { introPlayed, markIntroPlayed } from '@/lib/launchIntro';
import { useTheme } from '@/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** One arc. It is drawn up to where the sweep (0 to 1 around the ring) has reached. */
function Arc({
  sweep,
  size,
  radius,
  thickness,
  circumference,
  color,
  length,
  offset,
}: {
  sweep: SharedValue<number>;
  size: number;
  radius: number;
  thickness: number;
  circumference: number;
  color: string;
  length: number;
  offset: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    const shown = Math.min(Math.max(sweep.value * circumference - offset, 0), length);
    return { strokeDasharray: [shown, circumference - shown] };
  });
  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      stroke={color}
      strokeWidth={thickness}
      fill="none"
      strokeDashoffset={-offset}
      animatedProps={animatedProps}
    />
  );
}

/**
 * Donut chart. `slices` are integer amounts with a color; arcs are drawn in
 * order, starting at 12 o'clock. Children render in the center.
 * The ring draws itself clockwise once per app launch for each `introKey` (not with
 * "reduce motion"); later changes show at once.
 */
export function Donut({
  slices,
  size = 220,
  thickness = 34,
  introKey,
  children,
}: {
  slices: { key: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  introKey: string;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const sweep = useSharedValue(reduceMotion || introPlayed(introKey) ? 1 : 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((a, s) => a + s.value, 0);
  // Arc geometry is drawing, not money: fractions are fine here.
  const arcs = slices.reduce<{ key: string; color: string; length: number; offset: number }[]>((acc, slice) => {
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].length;
    acc.push({ key: slice.key, color: slice.color, length: (slice.value / total) * circumference, offset });
    return acc;
  }, []);

  useEffect(() => {
    if (reduceMotion || introPlayed(introKey)) {
      sweep.value = 1;
      return;
    }
    if (total === 0) return; // Nothing drawn yet: keep the intro for real data.
    markIntroPlayed(introKey);
    sweep.value = 0;
    sweep.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [total, reduceMotion, sweep, introKey]);

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceMuted} strokeWidth={thickness} fill="none" />
        {total > 0 &&
          arcs.map((arc) => (
            <Arc
              key={arc.key}
              sweep={sweep}
              size={size}
              radius={radius}
              thickness={thickness}
              circumference={circumference}
              color={arc.color}
              length={arc.length}
              offset={arc.offset}
            />
          ))}
      </Svg>
      <View
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
