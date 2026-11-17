import { useEffect } from 'react';
import { type DimensionValue, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Grey block that pulses softly while content loads. Still when "reduce motion" is on. */
export function Skeleton({ width = '100%', height = 16 }: { width?: DimensionValue; height?: number }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  useEffect(() => {
    if (reduceMotion) return;
    pulse.set(withRepeat(withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [reduceMotion, pulse]);

  return <Animated.View className="rounded-lg bg-surface-muted" style={[{ width, height }, animated]} />;
}

/** A few card-shaped rows: the loading look of any list or summary. */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <View className="gap-3 py-4">
      <View className="items-center gap-2 pb-2">
        <Skeleton width="40%" height={14} />
        <Skeleton width="55%" height={34} />
      </View>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={64} />
      ))}
    </View>
  );
}
