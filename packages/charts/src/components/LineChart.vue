<script setup lang="ts">
/**
 * Линейный график — тренд во времени, одна или несколько серий; `area` — заливка-подложка 10%.
 * Методика ADR-0007: линия 2px, точки ≥ 8px с кольцом 2px в цвет фона, сетка — сплошная тонкая,
 * одна ось Y, легенда при ≥ 2 сериях (кнопки — скрыть/показать), цвет следует за серией.
 *
 * Анимация: при появлении линия прорисовывается слева направо; при смене данных (фильтр, период,
 * скрытие серии) значения и шкала перетекают на пружине. Reduced motion — без анимации.
 * Взаимодействие: перекрестье прилипает к ближайшей точке X, подсказка — все серии в этой точке.
 * Касание — вести пальцем по графику (вертикальная прокрутка страницы не блокируется).
 * Клавиатура — Tab на график, ←/→/Home/End; значения читает живой регион. Табличный двойник — в ChartCard.
 */
import { computed, onMounted, ref, useId } from "vue";
import { extent } from "d3-array";
import { scaleLinear, scalePoint, scaleTime } from "d3-scale";
import { area as d3area, curveLinear, curveMonotoneX, line as d3line } from "d3-shape";
import { useChartContext } from "../core/context";
import { formatCompact, formatDate, formatValue, type ValueFormat } from "../core/format";
import { chartMetrics, DIGIT_WIDTH, LAYOUT } from "../core/metrics";
import { fitTicks, niceDomain, num } from "../core/scale";
import type { ChartSeries, Datum, TableColumn } from "../core/types";
import { useSeries } from "../core/useSeries";
import { useSize } from "../core/useSize";
import { useSpring } from "../core/useSpring";
import ChartLegend from "./ChartLegend.vue";
import ChartTable from "./ChartTable.vue";
import ChartTooltip from "./ChartTooltip.vue";

const props = withDefaults(
  defineProps<{
    /** Строки данных: поле X и числовые поля серий */
    data: Datum[];
    /** Поле оси X: Date, число или строка (категория) */
    x: string;
    /** Серии: поле и подпись (порядок задаёт цвет) */
    series: ChartSeries[];
    /** Подложка под линией (10%) — для одной-двух серий */
    area?: boolean;
    /** Ключ серии, которую выделить: остальные — приглушённым серым (форма «выделение») */
    emphasis?: string;
    /** Формат значения в подсказке и таблице */
    valueFormat?: ValueFormat;
    /** Формат подписей оси Y (по умолчанию компактно: «1,2 тыс.») */
    axisFormat?: ValueFormat;
    /** Заголовок столбца X в табличном двойнике */
    xLabel?: string;
    /** Формат X: опции Intl для дат или функция */
    xFormat?: Intl.DateTimeFormatOptions | ((value: unknown) => string);
    /** Высота: size/chart/{sm,md,lg} */
    height?: "sm" | "md" | "lg";
    /** Сглаживание линии */
    curve?: "smooth" | "linear";
    /** Имя графика без ChartCard (для скринридера и подписи таблицы) */
    label?: string;
    /** Текст пустого состояния */
    emptyText?: string;
  }>(),
  {
    height: "md",
    curve: "smooth",
    xLabel: "Дата",
    emptyText: "Нет данных за этот период",
  },
);

const ctx = useChartContext(() => props.label ?? "");
const uid = useId();
const container = ref<HTMLElement>();
const { width, height: boxH } = useSize(container);
const m = ref(chartMetrics());
onMounted(() => (m.value = chartMetrics()));

/* ---------- серии: видимость и цвет (скрытие не перекрашивает) ---------- */
const { colorOf, visible, toggle, drawOrder, legendItems } = useSeries(
  () => props.series,
  () => props.emphasis,
);

/* ---------- значения X ---------- */
const xValues = computed(() => props.data.map((d) => d[props.x]));
const xKind = computed(() =>
  xValues.value[0] instanceof Date ? "time" : typeof xValues.value[0] === "number" ? "number" : "category",
);
function formatX(value: unknown): string {
  if (typeof props.xFormat === "function") return props.xFormat(value);
  if (value instanceof Date) return formatDate(value, props.xFormat ?? { day: "numeric", month: "short" });
  return String(value);
}

/* ---------- геометрия ---------- */
const yTickCount = computed(() => Math.max(LAYOUT.minTicksY, Math.floor(boxH.value / m.value.tickSpacingY)));
/** Целевая «красивая» шкала Y по видимым сериям; базовая линия — 0, если данные неотрицательны */
const targetDomain = computed(() =>
  niceDomain(
    visible.value.flatMap((s) => props.data.map((d) => num(d[s.key]))),
    yTickCount.value,
  ),
);
const ticksY = computed(() => fitTicks(targetDomain.value, yTickCount.value + 1));
// Функции-форматы без дефолтов в withDefaults: Vue отдал бы функцию как значение, а не как фабрику
const axisLabel = (v: number) => (props.axisFormat ? formatValue(v, props.axisFormat) : formatCompact(v));
const valueFmt = computed<ValueFormat>(() => props.valueFormat ?? { maximumFractionDigits: 1 });

/** Левое поле — по самой длинной подписи оси Y */
const left = computed(
  () => Math.max(...ticksY.value.map((t) => axisLabel(t).length)) * m.value.axisFont * DIGIT_WIDTH + m.value.gap,
);
const top = computed(() => m.value.gap);
const bottom = computed(() => m.value.axisLine + m.value.gap);
const right = computed(() => m.value.dot + m.value.ring + m.value.gap);
const plotW = computed(() => Math.max(0, width.value - left.value - right.value));
const plotH = computed(() => Math.max(0, boxH.value - top.value - bottom.value));

const xPositions = computed<number[]>(() => {
  const w = plotW.value;
  if (xKind.value === "time") {
    const [a, b] = extent(xValues.value as Date[]) as [Date, Date];
    const s = scaleTime().domain([a, b]).range([0, w]);
    return (xValues.value as Date[]).map((d) => s(d));
  }
  if (xKind.value === "number") {
    const [a, b] = extent(xValues.value as number[]) as [number, number];
    const s = scaleLinear().domain([a, b]).range([0, w]);
    return (xValues.value as number[]).map((d) => s(d));
  }
  const s = scalePoint<string>().domain((xValues.value as string[]).map(String)).range([0, w]);
  return (xValues.value as string[]).map((d) => s(String(d)) ?? 0);
});

/** Подписи оси X: не чаще size/chart/tick, всегда с первой точки */
const ticksX = computed(() => {
  const n = xValues.value.length;
  if (!n) return [];
  const fit = Math.max(1, Math.floor(plotW.value / m.value.tickSpacing));
  const step = Math.max(1, Math.ceil(n / fit));
  const idx: number[] = [];
  for (let i = 0; i < n; i += step) idx.push(i);
  return idx.map((i) => ({ i, x: xPositions.value[i]!, label: formatX(xValues.value[i]) }));
});

/* ---------- анимация: шкала и значения перетекают, линия прорисовывается ---------- */
const domain = useSpring(computed(() => [...targetDomain.value]), { enter: false });
const allValues = computed(() => props.series.flatMap((s) => props.data.map((d) => num(d[s.key]))));
const animated = useSpring(allValues, { enter: false });
const reveal = useSpring(
  computed(() => [1]),
  { from: 0, enter: true },
);

const y = computed(() =>
  scaleLinear()
    .domain([domain.value[0] ?? 0, domain.value[1] ?? 1])
    .range([plotH.value, 0]),
);
const seriesValues = (key: string) => {
  const si = props.series.findIndex((s) => s.key === key);
  const n = props.data.length;
  return animated.value.slice(si * n, si * n + n);
};
const curveFn = computed(() => (props.curve === "smooth" ? curveMonotoneX : curveLinear));
function linePath(key: string) {
  return (
    d3line<number>()
      .x((_, i) => xPositions.value[i]!)
      .y((v) => y.value(v))
      .curve(curveFn.value)(seriesValues(key)) ?? ""
  );
}
function areaPath(key: string) {
  const base = y.value(Math.max(0, domain.value[0] ?? 0));
  return (
    d3area<number>()
      .x((_, i) => xPositions.value[i]!)
      .y0(base)
      .y1((v) => y.value(v))
      .curve(curveFn.value)(seriesValues(key)) ?? ""
  );
}
const baselineY = computed(() => y.value(Math.max(0, targetDomain.value[0])));

/* ---------- перекрестье, подсказка, клавиатура ---------- */
const active = ref<number | null>(null);
function nearest(px: number) {
  let best = 0;
  let dist = Infinity;
  xPositions.value.forEach((x, i) => {
    const d = Math.abs(x - px);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}
function onPointer(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  active.value = nearest(event.clientX - rect.left - left.value);
}
function onKey(event: KeyboardEvent) {
  const n = props.data.length;
  if (!n) return;
  const cur = active.value ?? 0;
  const next =
    event.key === "ArrowRight" ? Math.min(n - 1, cur + 1)
    : event.key === "ArrowLeft" ? Math.max(0, cur - 1)
    : event.key === "Home" ? 0
    : event.key === "End" ? n - 1
    : null;
  if (next === null) return;
  event.preventDefault();
  active.value = next;
}
const tooltipRows = computed(() =>
  active.value === null
    ? []
    : drawOrder.value
        .slice()
        .reverse()
        .map((s) => ({
          key: s.key,
          label: s.label,
          value: formatValue(num(props.data[active.value!]![s.key]), valueFmt.value),
          color: colorOf(s.key),
        })),
);
const announcement = computed(() =>
  active.value === null
    ? ""
    : `${formatX(xValues.value[active.value])}: ${tooltipRows.value.map((r) => `${r.label} ${r.value}`).join(", ")}`,
);

/* ---------- табличный двойник ---------- */
const tableColumns = computed<TableColumn[]>(() => [
  { key: props.x, label: props.xLabel, format: formatX },
  ...props.series.map((s) => ({
    key: s.key,
    label: s.label,
    numeric: true,
    format: (v: unknown) => formatValue(num(v), valueFmt.value),
  })),
]);
const keyboardLabel = computed(
  () => `${ctx.title.value || props.label || "График"}. Стрелки влево и вправо — значения по точкам`,
);
</script>

<template>
  <div
    class="ui-line-chart"
    :data-height="props.height"
  >
    <ChartTable
      v-if="ctx.view.value === 'table'"
      :caption="ctx.title.value || label || ''"
      :columns="tableColumns"
      :rows="data"
    />
    <template v-else>
      <ChartLegend
        v-if="series.length > 1"
        class="ui-line-chart__legend"
        :items="legendItems"
        @toggle="toggle"
      />
      <p
        v-if="!data.length"
        class="ui-line-chart__empty"
      >
        {{ emptyText }}
      </p>
      <div
        v-else
        ref="container"
        class="ui-line-chart__plot"
      >
        <svg
          v-if="width > 0"
          :width="width"
          :height="boxH"
          aria-hidden="true"
        >
          <defs>
            <clipPath :id="`${uid}-reveal`">
              <rect
                :x="-m.ring - m.dot"
                :y="-top"
                :width="(plotW + 2 * (m.ring + m.dot)) * (reveal[0] ?? 1)"
                :height="boxH"
              />
            </clipPath>
          </defs>
          <g :transform="`translate(${left}, ${top})`">
            <!-- Сетка и подписи Y: сплошные тонкие линии, подписи — текстом третьего уровня -->
            <g
              v-for="t in ticksY"
              :key="`y-${t}`"
              class="ui-line-chart__tick"
              :transform="`translate(0, ${y(t)})`"
            >
              <line
                class="ui-line-chart__grid"
                :x2="plotW"
              />
              <text
                class="ui-line-chart__axis-label"
                :x="-m.gap"
                dy="0.32em"
                text-anchor="end"
              >{{ axisLabel(t) }}</text>
            </g>
            <line
              class="ui-line-chart__baseline"
              :y1="baselineY"
              :y2="baselineY"
              :x2="plotW"
            />

            <g :clip-path="`url(#${uid}-reveal)`">
              <template v-if="area">
                <path
                  v-for="s in drawOrder"
                  :key="`area-${s.key}`"
                  class="ui-line-chart__area"
                  :d="areaPath(s.key)"
                  :style="{ fill: colorOf(s.key) }"
                />
              </template>
              <path
                v-for="s in drawOrder"
                :key="`line-${s.key}`"
                class="ui-line-chart__line"
                :d="linePath(s.key)"
                :style="{ stroke: colorOf(s.key) }"
                :stroke-width="m.line"
              />
              <!-- Конечные точки: ≥ 8px, кольцо 2px в цвет фона -->
              <circle
                v-for="s in drawOrder"
                :key="`end-${s.key}`"
                class="ui-line-chart__dot"
                :cx="xPositions[data.length - 1]"
                :cy="y(seriesValues(s.key)[data.length - 1] ?? 0)"
                :r="m.dot"
                :stroke-width="m.ring"
                :style="{ fill: colorOf(s.key) }"
              />
            </g>

            <!-- Перекрестье и точки активной даты -->
            <g
              v-if="active !== null"
              class="ui-line-chart__crosshair"
              :style="{ transform: `translateX(${xPositions[active]}px)` }"
            >
              <line
                class="ui-line-chart__crosshair-line"
                :y2="plotH"
              />
              <circle
                v-for="s in drawOrder"
                :key="`active-${s.key}`"
                class="ui-line-chart__dot"
                :cy="y(seriesValues(s.key)[active] ?? 0)"
                :r="m.dot"
                :stroke-width="m.ring"
                :style="{ fill: colorOf(s.key) }"
              />
            </g>

            <text
              v-for="t in ticksX"
              :key="`x-${t.i}`"
              class="ui-line-chart__axis-label"
              :x="t.x"
              :y="plotH + m.gap + m.axisLine / 2"
              dy="0.32em"
              :text-anchor="t.i === 0 ? 'start' : t.x > plotW - m.tickSpacing / 2 ? 'end' : 'middle'"
            >{{ t.label }}</text>
          </g>
        </svg>

        <!-- Слой взаимодействия: указатель, касание, клавиатура -->
        <div
          class="ui-line-chart__hit"
          tabindex="0"
          role="group"
          :aria-label="keyboardLabel"
          @pointermove="onPointer"
          @pointerdown="onPointer"
          @pointerleave="active = null"
          @focus="active = active ?? data.length - 1"
          @blur="active = null"
          @keydown="onKey"
        />
        <ChartTooltip
          v-if="active !== null && width > 0"
          :title="formatX(xValues[active])"
          :rows="tooltipRows"
          :x="left + (xPositions[active] ?? 0)"
          :container-width="width"
        />
        <p
          class="ui-line-chart__live"
          aria-live="polite"
        >
          {{ announcement }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
@layer components {
  .ui-line-chart {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
  }

  .ui-line-chart__plot {
    position: relative;
    block-size: var(--size-chart-md);
  }

  .ui-line-chart[data-height="sm"] .ui-line-chart__plot {
    block-size: var(--size-chart-sm);
  }

  .ui-line-chart[data-height="lg"] .ui-line-chart__plot {
    block-size: var(--size-chart-lg);
  }

  svg {
    display: block;
    overflow: visible;
  }

  .ui-line-chart__grid {
    stroke: var(--color-chart-grid, GrayText);
    stroke-width: var(--stroke-1);
    shape-rendering: crispedges;
  }

  .ui-line-chart__baseline {
    stroke: var(--color-chart-axis, GrayText);
    stroke-width: var(--stroke-1);
    shape-rendering: crispedges;
  }

  .ui-line-chart__axis-label {
    fill: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-caption-font-family);
    font-size: var(--type-caption-font-size);
    font-variant-numeric: tabular-nums;
  }

  .ui-line-chart__line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Подложка — оттенок серии на 10% (заливка, а не насыщенный блок) */
  .ui-line-chart__area {
    fill-opacity: var(--opacity-10);
  }

  .ui-line-chart__dot {
    stroke: var(--color-chart-surface, Canvas);
  }

  .ui-line-chart__crosshair {
    transition: transform var(--duration-press) var(--easing-spring-press);
  }

  .ui-line-chart__crosshair-line {
    stroke: var(--color-chart-axis, GrayText);
    stroke-width: var(--stroke-1);
  }

  /* Слой взаимодействия поверх графика: по X — перекрестье, по Y — прокрутка страницы */
  .ui-line-chart__hit {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-2);
    cursor: crosshair;
    touch-action: pan-y;
  }

  .ui-line-chart__hit:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-line-chart__legend {
    margin-inline: calc(-1 * var(--space-2));
  }

  .ui-line-chart__empty {
    display: grid;
    place-items: center;
    block-size: var(--size-chart-md);
    margin: 0;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-md-font-family);
    font-size: var(--type-body-md-font-size);
  }

  .ui-line-chart__live {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-line-chart__crosshair {
      transition: none;
    }
  }
}
</style>
