import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Letter({ char, index, color }: { char: string; index: number; color: string }) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    lift.set(
      withDelay(
        index * 90,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 220, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
            withTiming(0, { duration: 900 }),
          ),
          -1,
        ),
      ),
    );
  }, [reduceMotion, index, lift]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.get() }] }));

  return (
    <Animated.View style={style}>
      <Text style={{ color, fontSize: 18, fontWeight: '500' }}>{char === ' ' ? '\u00A0' : char}</Text>
    </Animated.View>
  );
}

/** Text whose letters hop one after another, a tiny bounce. Calm, looping. */
export function JumpingText({ text, color }: { text: string; color: string }) {
  return (
    <View accessibilityRole="text" accessibilityLabel={text} style={{ flexDirection: 'row' }}>
      {Array.from(text).map((char, i) => (
        <Letter key={`${i}-${char}`} char={char} index={i} color={color} />
      ))}
    </View>
  );
}
