import { describe, expect, it } from "vitest";
import { MUTED, seriesColor } from "../src/core/palette";
import { useSeries } from "../src/core/useSeries";

const series = [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
  { key: "c", label: "C" },
];

describe("useSeries", () => {
  it("скрытие серии не перекрашивает остальные (цвет следует за сущностью)", () => {
    const s = useSeries(() => series, () => undefined);
    const before = s.colorOf("c");
    s.toggle("b");
    expect(s.visible.value.map((x) => x.key)).toEqual(["a", "c"]);
    expect(s.colorOf("c")).toBe(before);
    expect(s.colorOf("c")).toBe(seriesColor(2));
    expect(s.legendItems.value[1]).toMatchObject({ key: "b", hidden: true });
    s.toggle("b");
    expect(s.visible.value).toHaveLength(3);
  });

  it("выделение: остальные — muted, выделенная рисуется последней", () => {
    const s = useSeries(() => series, () => "a");
    expect(s.colorOf("a")).toBe(seriesColor(0));
    expect(s.colorOf("b")).toBe(MUTED);
    expect(s.drawOrder.value.at(-1)!.key).toBe("a");
  });
});
