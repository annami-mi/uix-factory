import { describe, expect, it } from "vitest";
import { barPath, fitTicks, niceDomain, truncate } from "../src/core/scale";

describe("scale", () => {
  it("niceDomain — от нуля для неотрицательных данных", () => {
    expect(niceDomain([12, 87, 40], 5)).toEqual([0, 100]);
    expect(niceDomain([-20, 35], 5)).toEqual([-20, 40]);
    expect(niceDomain([], 5)).toEqual([0, 1]);
  });

  it("fitTicks не превышает лимит", () => {
    const ticks = fitTicks([0, 20_000], 4);
    expect(ticks.length).toBeLessThanOrEqual(4);
    expect(ticks[0]).toBe(0);
  });

  it("truncate — многоточие по ширине", () => {
    expect(truncate("/pricing", 200, 10, 0.6)).toBe("/pricing");
    expect(truncate("/blog/liquid-glass-design-system", 60, 10, 0.6)).toBe("/blog/liq…");
  });

  it("barPath — скруглён только конец-данные", () => {
    // Вертикальный столбец вверх: основание y=100 — прямые углы, вершина y=40 — дуги
    const d = barPath("vertical", 0, 20, 100, 40, 4);
    expect(d.startsWith("M0,100L0,44Q0,40 4,40")).toBe(true);
    expect(d.endsWith("L20,100Z")).toBe(true);
    // Короче радиуса — радиус не больше длины; нулевая длина — без пути
    expect(barPath("horizontal", 0, 20, 0, 2, 4)).toContain("Q2,0 2,2");
    expect(barPath("vertical", 0, 20, 50, 50, 4)).toBe("");
  });
});
