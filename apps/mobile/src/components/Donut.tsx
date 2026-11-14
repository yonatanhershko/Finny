import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Donut chart. `slices` are integer amounts with a color; arcs are drawn in
 * order, starting at 12 o'clock. Children render in the center.
 */
export function Donut({
  slices,
  size = 220,
  thickness = 34,
  children,
}: {
  slices: { key: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((a, s) => a + s.value, 0);
  // Arc geometry is drawing, not money: fractions are fine here.
  const arcs = slices.reduce<{ key: string; color: string; length: number; offset: number }[]>((acc, slice) => {
    const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].length;
    acc.push({ key: slice.key, color: slice.color, length: (slice.value / total) * circumference, offset });
    return acc;
  }, []);

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceMuted} strokeWidth={thickness} fill="none" />
        {total > 0 &&
          arcs.map((arc) => (
            <Circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={arc.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
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
