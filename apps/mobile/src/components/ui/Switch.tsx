import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB = 26;
const PAD = (TRACK_HEIGHT - THUMB) / 2;
const TRAVEL = TRACK_WIDTH - THUMB - PAD * 2;

/**
 * On/off switch with a small spring. The thumb is at the right when on, in
 * both languages (the layout never mirrors). Respects "reduce motion".
 */
export function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Read by screen readers. */
  label: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    const target = value ? 1 : 0;
    progress.value = reduceMotion ? target : withSpring(target, { damping: 16, stiffness: 220, mass: 0.7 });
  }, [value, reduceMotion, progress]);

  const off = colors.border;
  const on = colors.primary;
  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [off, on]),
  }));
  const thumb = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * TRAVEL },
      // a light squeeze mid-way, so the move feels soft
      { scale: 1 - 0.12 * Math.sin(Math.min(Math.max(progress.value, 0), 1) * Math.PI) },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={{ opacity: disabled ? 0.5 : 1 }}>
      <Animated.View
        style={[
          { width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, padding: PAD },
          track,
        ]}>
        <Animated.View
          style={[
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: colors.surface,
              shadowColor: colors.text,
              shadowOpacity: 0.18,
              shadowRadius: 2,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            },
            thumb,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
