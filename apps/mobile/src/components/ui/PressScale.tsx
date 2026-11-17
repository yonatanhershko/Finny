import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, type PressableProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export type PressScaleProps = PressableProps & {
  /** Size while held. Default 0.97: small and quick, no haptics or sound. */
  scaleTo?: number;
};

/**
 * The app's Pressable: shrinks a little while held and springs back.
 * Not with "reduce motion".
 *
 * It stays a plain Pressable and moves by setNativeProps, on purpose. Both
 * other ways broke the look on the phone:
 *  - Reanimated's createAnimatedComponent(Pressable) dropped every NativeWind class;
 *  - a NativeWind `transition-*` class left buttons stuck half-faded after
 *    `disabled` went back to false.
 */
export function PressScale({ scaleTo = 0.97, onPressIn, onPressOut, ...props }: PressScaleProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<ComponentRef<typeof Pressable>>(null);
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const id = scale.addListener(({ value }) => {
      ref.current?.setNativeProps({ style: { transform: [{ scale: value }] } });
    });
    return () => scale.removeListener(id);
  }, [scale]);

  return (
    <Pressable
      {...props}
      ref={ref}
      onPressIn={(event) => {
        if (!reduceMotion) Animated.timing(scale, { toValue: scaleTo, duration: 90, useNativeDriver: false }).start();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reduceMotion) {
          Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 7, useNativeDriver: false }).start();
        }
        onPressOut?.(event);
      }}
    />
  );
}
