export { FloatingPetals } from './FloatingPetals';
export { March8Banner } from './March8Banner';

/**
 * Show March 8 decorations from March 5 through March 10.
 * Check is timezone-independent (uses local device date).
 */
export function isMarch8Season(): boolean {
  const now = new Date();
  const m = now.getMonth(); // 0-indexed, March = 2
  const d = now.getDate();
  return m === 2 && d >= 5 && d <= 10;
}
