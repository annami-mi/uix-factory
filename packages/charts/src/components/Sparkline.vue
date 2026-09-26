<script setup lang="ts">
/**
 * Спарклайн — форма тренда без осей, внутри KPI и строк таблиц. Одна серия, цвет — слот серии
 * (не статус: хорошо/плохо сообщает дельта с иконкой рядом). Конечная точка ≥ 8px с кольцом.
 * Для скринридера — одна фраза (role="img"): начало, конец, минимум и максимум.
 * Анимация — как у LineChart: прорисовка при появлении, перетекание при смене данных.
 *
 * `variant="bars"` — встроенные мини-столбики (bento-contrast, ADR-0008: график живёт прямо в плитке, без
 * осей и рамки): все приглушены (`chart/muted`), один выделен (`chart/highlight` — на белой карточке bento
 * чёрный, на инвертированной плашке — spotlight проекта). `accent` — линия цветом выделения, а не слота серии.
 */
import { computed, onMounted, ref, useId } from "vue";
import { scaleLinear } from "d3-scale";
import { area as d3area, curveMonotoneX, line as d3line } from "d3-shape";
import { formatValue, type ValueFormat } from "../core/format";
import { chartMetrics } from "../core/metrics";
import { seriesColor } from "../core/palette";
import { barPath } from "../core/scale";
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
    /** Подложка 10% (линия) */
    area?: boolean;
    /** Линия тренда или мини-столбики */
    variant?: "line" | "bars";
    /** Индекс выделенного столбика (по умолчанию — последний) */
    highlight?: number;
    /** Линия цветом выделения (chart/highlight), а не слота серии */
    accent?: boolean;
    /** Формат чисел во фразе для скринридера */
    valueFormat?: ValueFormat;
  }>(),
  { series: 1, area: true, variant: "line" },
);

const uid = useId();
const el = ref<HTMLElement>();
const { width, height } = useSize(el);
const m = ref(chartMetrics());
onMounted(() => (m.value = chartMetrics()));

const color = computed(() =>
  props.accent ? "var(--color-chart-highlight, CanvasText)" : seriesColor(props.series - 1),
);
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

/* Мини-столбики: от нуля, зазор space/1, конец скруглён radius/1; вырастают вместе с прорисовкой */
const bars = computed(() => {
  const n = props.data.length;
  if (props.variant !== "bars" || !n || width.value <= 0) return [];
  const gap = m.value.dot;
  const w = Math.max(1, (width.value - gap * (n - 1)) / n);
  const top = Math.max(...props.data, 0) || 1;
  const hl = props.highlight ?? n - 1;
  const grow = reveal.value[0] ?? 1;
  return values.value.map((v, i) => {
    const h = (Math.max(0, v) / top) * height.value * grow;
    return {
      d: barPath("vertical", i * (w + gap), w, height.value, height.value - h, Math.min(m.value.barRadius, w / 2)),
      highlighted: i === hl,
    };
  });
});

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
      v-if="width > 0 && variant === 'bars' && data.length"
      :width="width"
      :height="height"
      aria-hidden="true"
    >
      <path
        v-for="(b, i) in bars"
        :key="i"
        class="ui-sparkline__bar"
        :data-highlighted="b.highlighted || undefined"
        :d="b.d"
      />
    </svg>
    <svg
      v-else-if="width > 0 && data.length > 1"
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

  .ui-sparkline__bar {
    fill: var(--color-chart-muted, GrayText);
  }

  .ui-sparkline__bar[data-highlighted] {
    fill: var(--color-chart-highlight, CanvasText);
  }

  .ui-sparkline__dot {
    stroke: var(--color-chart-surface, Canvas);
  }
}
</style>
