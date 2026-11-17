import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { introPlayed, markIntroPlayed } from '@/lib/launchIntro';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Bar fill that grows to `ratio` (0 to 1) instead of jumping. Put it inside a track View.
 * With `introKey`, it grows from 0 only the first time per app launch.
 */
export function ProgressFill({
  ratio,
  introKey,
  className = '',
  style,
}: {
  ratio: number;
  introKey?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const skipIntro = reduceMotion || (introKey !== undefined && introPlayed(introKey));
  const progress = useSharedValue(skipIntro ? ratio : 0);
  useEffect(() => {
    progress.set(reduceMotion ? ratio : withTiming(ratio, { duration: 500 }));
    if (introKey !== undefined) markIntroPlayed(introKey);
  }, [ratio, reduceMotion, progress, introKey]);
  const animated = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return <Animated.View className={`h-full rounded-full ${className}`} style={[animated, style]} />;
}
