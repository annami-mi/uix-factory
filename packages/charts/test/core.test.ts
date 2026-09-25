import { describe, expect, it } from "vitest";
import { formatCompact, formatDate, formatDelta, formatValue } from "../src/core/format";
import { MUTED, seriesColor } from "../src/core/palette";
import { resizeState, springSettled, springStep, type SpringState } from "../src/core/spring";

const params = { damping: 0.86, frequency: 11 };

/** Прогнать пружину до покоя, вернуть траекторию первого значения */
function run(state: SpringState, target: number[], frames = 240) {
  const track: number[] = [];
  let s = state;
  for (let i = 0; i < frames && !springSettled(s, target); i++) {
    s = springStep(s, target, 1 / 60, params);
    track.push(s.value[0]!);
  }
  return { state: s, track };
}

describe("формат", () => {
  // Intl разделяет разряды неразрывным пробелом — сравниваем без различия пробелов
  const norm = (s: string) => s.replace(/\s/g, " ");

  it("компактно по-русски", () => {
    expect(norm(formatCompact(1284))).toBe("1,3 тыс.");
    expect(norm(formatCompact(4_200_000))).toBe("4,2 млн");
    expect(formatCompact(12)).toBe("12");
  });

  it("значение по опциям и своей функцией", () => {
    expect(norm(formatValue(1234.5, { maximumFractionDigits: 0 }))).toBe("1 235");
    expect(formatValue(3, (v) => `${v} шт.`)).toBe("3 шт.");
  });

  it("изменение со знаком", () => {
    expect(formatDelta(12.5)).toBe("+12,5");
    expect(formatDelta(-3)).toBe("-3");
    expect(formatDelta(0)).toBe("0");
  });

  it("дата", () => {
    expect(formatDate(new Date(2026, 2, 12), { day: "numeric", month: "short" })).toBe("12 мар.");
  });
});

describe("пружина данных", () => {
  it("сходится к цели почти без перелёта (значение не «врёт» отскоком)", () => {
    const { state, track } = run({ value: [0], velocity: [0] }, [100]);
    expect(springSettled(state, [100])).toBe(true);
    expect(Math.max(...track)).toBeLessThan(101); // перелёт < 1 %
    expect(track.length).toBeLessThan(60); // до покоя < 1 с при 60 к/с
  });

  it("перетекает между данными в обе стороны", () => {
    const up = run({ value: [10, 50], velocity: [0, 0] }, [80, 20]);
    expect(up.state.value[0]).toBeCloseTo(80, 0);
    expect(up.state.value[1]).toBeCloseTo(20, 0);
  });

  it("смена длины данных: новые точки стартуют с базовой линии, лишние отбрасываются", () => {
    expect(resizeState({ value: [5, 6], velocity: [1, 1] }, 3, 0)).toEqual({ value: [5, 6, 0], velocity: [1, 1, 0] });
    expect(resizeState({ value: [5, 6, 7], velocity: [1, 1, 1] }, 1, 0)).toEqual({ value: [5], velocity: [1] });
  });

  it("огромный шаг времени (вкладка в фоне) не взрывает пружину", () => {
    const s = springStep({ value: [0], velocity: [0] }, [100], 5, params);
    expect(Number.isFinite(s.value[0])).toBe(true);
    expect(s.value[0]).toBeLessThan(200);
  });
});

describe("цвета серий", () => {
  it("слоты 1…8 по порядку, девятой нет — приглушённый", () => {
    // С безопасным fallback: без токенов метка остаётся видимой
    expect(seriesColor(0)).toBe("var(--color-chart-series-1, CanvasText)");
    expect(seriesColor(7)).toBe("var(--color-chart-series-8, CanvasText)");
    expect(seriesColor(8)).toBe(MUTED);
  });
});
