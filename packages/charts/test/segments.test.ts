import { describe, expect, it } from "vitest";
import { MUTED, seriesColor } from "../src/core/palette";
import { foldSegments } from "../src/core/segments";

const items = [
  { label: "A", value: 10 },
  { label: "B", value: 50 },
  { label: "C", value: 0 },
  { label: "D", value: 30 },
  { label: "E", value: 5 },
  { label: "F", value: 3 },
];

describe("foldSegments", () => {
  it("по убыванию, без нулевых; цвет — по индексу во входном списке", () => {
    const s = foldSegments(items, 6, "Другое");
    expect(s.map((x) => x.label)).toEqual(["B", "D", "A", "E", "F"]);
    expect(s[0]!.color).toBe(seriesColor(1));
    expect(s[1]!.color).toBe(seriesColor(3));
  });

  it("хвост сверх лимита — одна доля «Другое» muted", () => {
    const s = foldSegments(items, 3, "Другое");
    expect(s.map((x) => x.label)).toEqual(["B", "D", "Другое"]);
    expect(s[2]).toMatchObject({ key: "__other", value: 18, color: MUTED });
  });

  it("лимит не меньше двух; пусто — пусто", () => {
    expect(foldSegments(items, 1, "Другое")).toHaveLength(2);
    expect(foldSegments([], 6, "Другое")).toEqual([]);
  });
});
