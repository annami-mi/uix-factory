/**
 * Пружина данных графиков (ADR-0007): значения растут от базовой линии при появлении
 * и перетекают из старых в новые при смене данных (фильтр, период). Затухание ζ и частота ω —
 * токены spring/data/* (почти без перелёта: отскок значения выглядел бы как неверные данные).
 */
export interface SpringState {
  value: number[];
  velocity: number[];
}

export interface SpringParams {
  /** ζ — затухание (1 — без перелёта) */
  damping: number;
  /** ω — собственная частота, рад/с */
  frequency: number;
}

/** Максимальный шаг интегрирования, с — устойчивость при «замёрзшей» вкладке */
const MAX_STEP = 1 / 30;

/**
 * Один шаг пружины к цели (полунеявный Эйлер): a = −ω²(x − x₀) − 2ζω·v.
 * Чистая функция — не мутирует вход, тестируется без таймеров.
 */
export function springStep(state: SpringState, target: number[], dt: number, params: SpringParams): SpringState {
  const h = Math.min(dt, MAX_STEP);
  const { damping: z, frequency: w } = params;
  const value: number[] = [];
  const velocity: number[] = [];
  for (let i = 0; i < target.length; i++) {
    const x = state.value[i] ?? target[i]!;
    const v = state.velocity[i] ?? 0;
    const a = -w * w * (x - target[i]!) - 2 * z * w * v;
    const nv = v + a * h;
    velocity.push(nv);
    value.push(x + nv * h);
  }
  return { value, velocity };
}

/** Пружина успокоилась: отклонение и скорость меньше доли размаха значений */
export function springSettled(state: SpringState, target: number[]): boolean {
  const range = Math.max(1e-9, ...target.map(Math.abs));
  const eps = range * 1e-3;
  return target.every(
    (t, i) => Math.abs((state.value[i] ?? t) - t) < eps && Math.abs(state.velocity[i] ?? 0) < eps * 10,
  );
}

/**
 * Подогнать состояние под новую длину данных: новые точки стартуют с `from`
 * (базовая линия), лишние — отбрасываются.
 */
export function resizeState(state: SpringState, length: number, from: number): SpringState {
  const value = Array.from({ length }, (_, i) => state.value[i] ?? from);
  const velocity = Array.from({ length }, (_, i) => state.velocity[i] ?? 0);
  return { value, velocity };
}
