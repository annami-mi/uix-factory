<script setup lang="ts">
/**
 * Спарклайн — форма тренда без осей, внутри KPI и строк таблиц. Одна серия, цвет — слот серии
 * (не статус: хорошо/плохо сообщает дельта с иконкой рядом). Конечная точка ≥ 8px с кольцом.
 * Для скринридера — одна фраза (role="img"): начало, конец, минимум и максимум.
 * Анимация — как у LineChart: прорисовка при появлении, перетекание при смене данных.
 */
import { computed, onMounted, ref, useId } from "vue";
import { scaleLinear } from "d3-scale";
import { area as d3area, curveMonotoneX, line as d3line } from "d3-shape";
import { formatValue, type ValueFormat } from "../core/format";
import { chartMetrics } from "../core/metrics";
import { seriesColor } from "../core/palette";
import { useSize } from "../core/useSize";
import { useSpring } from "../core/useSpring";

const props = withDefaults(
  defineProps<{
    /** Значения по порядку (равный шаг) */
    data: number[];
    /** Что показывает — начало фразы для скринридера («Выручка за 30 дней») */
    label: string;
    /** Слот палитры серий 1…8 */
    series?: number;
    /** Подложка 10% */
    area?: boolean;
    /** Формат чисел во фразе для скринридера */
    valueFormat?: ValueFormat;
  }>(),
  { series: 1, area: true },
);

const uid = useId();
const el = ref<HTMLElement>();
const { width, height } = useSize(el);
const m = ref(chartMetrics());
onMounted(() => (m.value = chartMetrics()));

const color = computed(() => seriesColor(props.series - 1));
const values = useSpring(computed(() => [...props.data]), { enter: false });
const reveal = useSpring(
  computed(() => [1]),
  { from: 0 },
);

/** Поля — радиус точки с кольцом, чтобы конечная точка не обрезалась */
const pad = computed(() => m.value.dot + m.value.ring);
const x = computed(() =>
  scaleLinear()
    .domain([0, Math.max(1, props.data.length - 1)])
    .range([pad.value, width.value - pad.value]),
);
const y = computed(() => {
  const lo = Math.min(...props.data);
  const hi = Math.max(...props.data);
  return scaleLinear()
    .domain(lo === hi ? [lo - 1, hi + 1] : [lo, hi])
    .range([height.value - pad.value, pad.value]);
});
const linePath = computed(
  () =>
    d3line<number>()
      .x((_, i) => x.value(i))
      .y((v) => y.value(v))
      .curve(curveMonotoneX)(values.value) ?? "",
);
const areaPath = computed(
  () =>
    d3area<number>()
      .x((_, i) => x.value(i))
      .y0(height.value)
      .y1((v) => y.value(v))
      .curve(curveMonotoneX)(values.value) ?? "",
);
const last = computed(() => props.data.length - 1);

const summary = computed(() => {
  if (!props.data.length) return `${props.label}: нет данных`;
  const f = (v: number) => formatValue(v, props.valueFormat ?? { maximumFractionDigits: 1 });
  const d = props.data;
  return `${props.label}: от ${f(d[0]!)} до ${f(d[last.value]!)}, минимум ${f(Math.min(...d))}, максимум ${f(Math.max(...d))}`;
});
</script>

<template>
  <div
    ref="el"
    class="ui-sparkline"
    role="img"
    :aria-label="summary"
  >
    <svg
      v-if="width > 0 && data.length > 1"
      :width="width"
      :height="height"
      aria-hidden="true"
    >
      <defs>
        <clipPath :id="`${uid}-reveal`">
          <rect
            :width="width * (reveal[0] ?? 1)"
            :height="height"
          />
        </clipPath>
      </defs>
      <g :clip-path="`url(#${uid}-reveal)`">
        <path
          v-if="area"
          class="ui-sparkline__area"
          :d="areaPath"
          :style="{ fill: color }"
        />
        <path
          class="ui-sparkline__line"
          :d="linePath"
          :stroke-width="m.line"
          :style="{ stroke: color }"
        />
        <circle
          class="ui-sparkline__dot"
          :cx="x(last)"
          :cy="y(values[last] ?? 0)"
          :r="m.dot"
          :stroke-width="m.ring"
          :style="{ fill: color }"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
@layer components {
  .ui-sparkline {
    min-inline-size: 0;
    block-size: var(--size-40);
  }

  svg {
    display: block;
    overflow: visible;
  }

  .ui-sparkline__line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ui-sparkline__area {
    fill-opacity: var(--opacity-10);
  }

  .ui-sparkline__dot {
    stroke: var(--color-chart-surface, Canvas);
  }
}
</style>
