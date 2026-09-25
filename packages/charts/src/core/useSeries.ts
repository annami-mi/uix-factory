import { computed, ref } from "vue";
import { MUTED, seriesColor } from "./palette";
import type { ChartSeries } from "./types";

/**
 * Серии графика: видимость (легенда-переключатель) и цвет. Цвет — по индексу в полном списке,
 * поэтому скрытие серии не перекрашивает остальные; при выделении (`emphasis`) остальные — серые.
 */
export function useSeries(series: () => ChartSeries[], emphasis: () => string | undefined) {
  const hidden = ref<Set<string>>(new Set());

  const colorOf = (key: string) => {
    const e = emphasis();
    if (e && key !== e) return MUTED;
    return seriesColor(series().findIndex((s) => s.key === key));
  };
  const visible = computed(() => series().filter((s) => !hidden.value.has(s.key)));

  function toggle(key: string) {
    const next = new Set(hidden.value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    hidden.value = next;
  }

  /** Порядок отрисовки: выделенная серия — поверх приглушённых */
  const drawOrder = computed(() =>
    [...visible.value].sort((a, b) => Number(a.key === emphasis()) - Number(b.key === emphasis())),
  );

  const legendItems = computed(() =>
    series().map((s) => ({ key: s.key, label: s.label, color: colorOf(s.key), hidden: hidden.value.has(s.key) })),
  );

  return { hidden, colorOf, visible, toggle, drawOrder, legendItems };
}
