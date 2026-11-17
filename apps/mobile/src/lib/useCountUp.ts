import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { introPlayed, markIntroPlayed } from '@/lib/launchIntro';

export function useCountUp(target: number, introKey: string, duration = 1500): number {
  const reduceMotion = useReducedMotion();
  // 0 until the intro starts, so a value already loaded does not flash before counting.
  const [shown, setShown] = useState<number | null>(() =>
    reduceMotion || introPlayed(introKey) ? null : 0,
  );
  const startedAt = useRef<number | null>(null);
  const current = useRef(0);

  useEffect(() => {
    if (reduceMotion) return;
    if (startedAt.current === null) {
      // Wait for real data (0 while loading); nothing to count when the value is 0.
      if (target === 0) return;
      if (introPlayed(introKey)) {
        // Already played this launch (another mount of the same screen): show the value.
        const frame = requestAnimationFrame(() => setShown(null));
        return () => cancelAnimationFrame(frame);
      }
      markIntroPlayed(introKey);
      startedAt.current = Date.now();
    }

    // If the value changes mid-count, head for the new value and still end on time.
    const end = startedAt.current + duration;
    const from = current.current;
    const segmentStart = Date.now();
    // Whole amounts count in whole units, so no agorot flicker past on the way.
    const step = target % 100 === 0 ? 100 : 1;
    let frame = 0;
    const tick = () => {
      const left = end - segmentStart;
      const progress = left <= 0 ? 1 : Math.min(1, (Date.now() - segmentStart) / left);
      const eased = 1 - (1 - progress) ** 3;
      current.current = Math.round((from + (target - from) * eased) / step) * step;
      if (progress < 1) {
        setShown(current.current);
        frame = requestAnimationFrame(tick);
      } else {
        setShown(null);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, introKey, duration, reduceMotion]);

  return reduceMotion ? target : (shown ?? target);
}
