import { type ReactNode, useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * Shakes sideways each time `trigger` changes to a truthy value (an error text, or a
 * counter that goes up on every failed attempt). Skipped with "reduce motion".
 */
export function Shake({
  trigger,
  children,
  style,
}: {
  trigger: string | number | null | undefined | false;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));

  useEffect(() => {
    if (!trigger || reduceMotion) return;
    x.set(
      withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 90 }),
        withTiming(-6, { duration: 90 }),
        withTiming(6, { duration: 90 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  }, [trigger, reduceMotion, x]);

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}
