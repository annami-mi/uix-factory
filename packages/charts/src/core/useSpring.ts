import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { tokenNumber } from "@uix/ui";
import { resizeState, springSettled, springStep, type SpringState } from "./spring";

/**
 * Реактивная пружина над массивом чисел: следует за `target` при каждой смене (перетекание данных).
 * `enter` — при монтировании значения растут от `from` (базовая линия), иначе появляются сразу.
 * SSR и prefers-reduced-motion — сразу целевые значения, без анимации.
 */
export function useSpring(target: Ref<number[]>, options: { from?: number; enter?: boolean } = {}) {
  const from = options.from ?? 0;
  const enter = options.enter ?? true;
  const value = ref<number[]>([...target.value]);
  let state: SpringState = { value: [...target.value], velocity: target.value.map(() => 0) };
  let frame = 0;
  let last = 0;
  let animated = false;

  const params = () => ({
    damping: tokenNumber("--spring-data-damping", 0.86),
    frequency: tokenNumber("--spring-data-frequency", 11),
  });

  function tick(now: number) {
    const dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    state = springStep(state, target.value, dt, params());
    if (springSettled(state, target.value)) {
      state = { value: [...target.value], velocity: target.value.map(() => 0) };
      value.value = state.value;
      frame = 0;
      return;
    }
    value.value = state.value;
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (!animated) {
      state = { value: [...target.value], velocity: target.value.map(() => 0) };
      value.value = state.value;
      return;
    }
    state = resizeState(state, target.value.length, from);
    if (!frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  onMounted(() => {
    animated = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!animated || !enter) return;
    // Появление: от базовой линии к данным
    state = { value: target.value.map(() => from), velocity: target.value.map(() => 0) };
    value.value = state.value;
    start();
  });

  watch(target, start, { deep: true });
  onBeforeUnmount(() => cancelAnimationFrame(frame));

  return value;
}
