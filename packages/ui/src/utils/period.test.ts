import { describe, expect, it } from "vitest";
import { isoDay, periodDays, previousPeriod, resolvePeriod } from "./period";

const now = new Date(2026, 8, 24, 23, 30); // 24 сентября, поздний вечер — «сегодня» не уезжает в UTC

describe("period", () => {
  it("isoDay — по местному времени", () => {
    expect(isoDay(now)).toBe("2026-09-24");
  });

  it("пресеты включают сегодняшний день", () => {
    expect(resolvePeriod("today", now)).toEqual({ preset: "today", from: "2026-09-24", to: "2026-09-24" });
    expect(resolvePeriod("7d", now)).toEqual({ preset: "7d", from: "2026-09-18", to: "2026-09-24" });
    expect(periodDays(resolvePeriod("30d", now))).toBe(30);
    expect(periodDays(resolvePeriod("90d", now))).toBe(90);
    expect(resolvePeriod("mtd", now).from).toBe("2026-09-01");
  });

  it("custom сохраняет прежний диапазон", () => {
    expect(resolvePeriod("custom", now, { from: "2026-08-01", to: "2026-08-15" })).toEqual({
      preset: "custom",
      from: "2026-08-01",
      to: "2026-08-15",
    });
  });

  it("прошлый период — той же длины, вплотную", () => {
    expect(previousPeriod({ from: "2026-09-18", to: "2026-09-24" })).toEqual({ from: "2026-09-11", to: "2026-09-17" });
    expect(previousPeriod({ from: "2026-03-01", to: "2026-03-31" })).toEqual({ from: "2026-01-29", to: "2026-02-28" });
  });
});
