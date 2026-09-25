import { MUTED, seriesColor } from "./palette";

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Доли для кольцевой диаграммы (методика ADR-0007): только положительные, по убыванию; сверх `max`
 * хвост сворачивается в одну долю «Другое» (цвет muted). Цвет — по сущности: индекс во входном
 * списке, а не место после сортировки, — смена данных не перекрашивает доли.
 */
export function foldSegments(
  items: { label: string; value: number }[],
  max: number,
  otherLabel: string,
): Segment[] {
  const all = items
    .map((item, i) => ({ key: item.label, label: item.label, value: item.value, color: seriesColor(i) }))
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .sort((a, b) => b.value - a.value);
  const limit = Math.max(2, max);
  if (all.length <= limit) return all;
  const head = all.slice(0, limit - 1);
  const rest = all.slice(limit - 1).reduce((sum, s) => sum + s.value, 0);
  return [...head, { key: "__other", label: otherLabel, value: rest, color: MUTED }];
}
