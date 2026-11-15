import { useEffect } from 'react';
import { I18nManager, Platform, Text, View } from 'react-native';
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

/** True when a flex row lays its first child at the right edge right now. */
function rowStartsAtRight(): boolean {
  if (Platform.OS === 'web') {
    return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  }
  return I18nManager.isRTL;
}

/**
 * Text whose letters hop one after another, a tiny bounce. Calm, looping.
 * Each letter is its own view, so the row decides the order: put the letters
 * in the order the eye should read them. `rtl` is the text's own direction.
 */
export function JumpingText({ text, color, rtl = false }: { text: string; color: string; rtl?: boolean }) {
  const letters = Array.from(text);
  // Hebrew has to read right to left. If the row already starts at the right,
  // logical order is right; if it starts at the left, flip the letters.
  const flipped = rtl !== rowStartsAtRight();
  const ordered = flipped ? [...letters].reverse() : letters;
  return (
    <View accessibilityRole="text" accessibilityLabel={text} style={{ flexDirection: 'row' }}>
      {ordered.map((char, i) => (
        <Letter
          key={`${i}-${char}`}
          char={char}
          // The hop wave follows the reading order, not the screen order.
          index={flipped ? ordered.length - 1 - i : i}
          color={color}
        />
      ))}
    </View>
  );
}
