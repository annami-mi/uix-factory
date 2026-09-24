/**
 * Число из CSS-токена для библиотек, которым нужны числа (Reka: sideOffset, delayDuration, duration):
 * `tokenNumber("--space-2", 8)` → 8, `tokenNumber("--duration-toast", 5000)` → 5000.
 * На сервере (SSR) и если токен не найден — запасное значение.
 */
export function tokenNumber(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}
