export { FloatingPetals } from './FloatingPetals';

export function isMarch8Season(): boolean {
  const now = new Date();
  const m = now.getMonth();
  const d = now.getDate();
  return m === 2 && d >= 2 && d <= 10;
}
