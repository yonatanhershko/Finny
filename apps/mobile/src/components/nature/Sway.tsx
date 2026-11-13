import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Slow, looping 3D sway: the child turns around its vertical and horizontal
 * axes with perspective, tilts a little, and bobs. Used for leaves and the wallet.
 * Stops (art stays) when the phone asks for reduced motion.
 */
export type SwayProps = {
  children: ReactNode;
  /** Degrees each way around the vertical axis. */
  rotateY?: number;
  /** Degrees each way around the horizontal axis. */
  rotateX?: number;
  /** Degrees each way of in-plane tilt, added to `baseRotate`. */
  tilt?: number;
  /** Resting in-plane rotation in degrees. */
  baseRotate?: number;
  /** Points up and down. */
  bob?: number;
  /** One half-swing in milliseconds. */
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export function Sway({
  children,
  rotateY = 30,
  rotateX = 12,
  tilt = 6,
  baseRotate = 0,
  bob = 4,
  duration = 2800,
  delay = 0,
  style,
}: SwayProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) {
      progress.set(0.5);
      return;
    }
    progress.set(0);
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
      ),
    );
  }, [reduceMotion, delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      transform: [
        { perspective: 500 },
        { translateY: interpolate(p, [0, 1], [bob, -bob]) },
        { rotateZ: `${baseRotate + interpolate(p, [0, 1], [-tilt, tilt])}deg` },
        { rotateY: `${interpolate(p, [0, 1], [-rotateY, rotateY])}deg` },
        { rotateX: `${interpolate(p, [0, 1], [rotateX, -rotateX])}deg` },
      ],
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
