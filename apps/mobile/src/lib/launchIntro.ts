/**
 * Intro animations (donut sweep, bar grow) play once per app launch for each key.
 * Kept in memory only, so a fresh launch plays them again.
 */
const played = new Set<string>();

export function introPlayed(key: string): boolean {
  return played.has(key);
}

export function markIntroPlayed(key: string): void {
  played.add(key);
}
