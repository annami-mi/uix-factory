<script setup lang="ts">
/**
 * Столбчатая диаграмма — сравнение величин по категориям: вертикальная или горизонтальная (длинные
 * подписи, рейтинги), несколько серий — группой или стеком (часть целого).
 * Методика ADR-0007: столбец ≤ 24px (size/chart/bar), остальное — воздух; конец-данные скруглён 4px,
 * у базовой линии — прямой угол; между соседними столбцами и сегментами стека — зазор 2px (без обводок);
 * сетка — сплошная тонкая, одна ось значений, легенда при ≥ 2 сериях.
 *
 * Анимация: при появлении столбцы вырастают от базовой линии волной (по категориям); при смене данных
 * значения и шкала перетекают на пружине; скрытая в легенде серия стека сжимается, верхние сегменты
 * оседают. Reduced motion — без анимации.
 * Взаимодействие: наведение/касание на категорию — подложка и подсказка по всем сериям (у стека — итог);
 * клавиатура — стрелки, Home/End, живой регион. Табличный двойник — в ChartCard.
 */
import { computed, onMounted, ref } from "vue";
import { scaleBand, scaleLinear } from "d3-scale";
import { useChartContext } from "../core/context";
import { formatCompact, formatDate, formatValue, type ValueFormat } from "../core/format";
import { chartMetrics, DIGIT_WIDTH, LAYOUT } from "../core/metrics";
import { barPath, fitTicks, niceDomain, num, textWidth, truncate } from "../core/scale";
import type { ChartSeries, Datum, TableColumn } from "../core/types";
import { useSeries } from "../core/useSeries";
import { useSize } from "../core/useSize";
import { useSpring } from "../core/useSpring";
import ChartLegend from "./ChartLegend.vue";
import ChartTable from "./ChartTable.vue";
import ChartTooltip from "./ChartTooltip.vue";

const props = withDefaults(
  defineProps<{
    /** Строки данных: поле категории и числовые поля серий */
    data: Datum[];
    /** Поле категории: строка, число или Date */
    x: string;
    /** Серии: поле и подпись (порядок задаёт цвет) */
    series: ChartSeries[];
    /** Вертикальные столбцы или горизонтальные полосы (длинные подписи, рейтинг) */
    orientation?: "vertical" | "horizontal";
    /** Стек (часть целого) вместо группы; значения — неотрицательные */
    stacked?: boolean;
    /** Ключ серии, которую выделить: остальные — приглушённым серым */
    emphasis?: string;
    /** Формат значения в подсказке и таблице */
    valueFormat?: ValueFormat;
    /** Формат подписей оси значений (по умолчанию компактно) */
    axisFormat?: ValueFormat;
    /** Заголовок столбца категорий в табличном двойнике */
    xLabel?: string;
    /** Формат категории: опции Intl для дат или функция */
    xFormat?: Intl.DateTimeFormatOptions | ((value: unknown) => string);
    /** Высота вертикального графика: size/chart/{s,m,l}; горизонтальный растёт по числу строк */
    height?: "s" | "m" | "l";
    /** Имя графика без ChartCard */
    label?: string;
    /** Подпись итога стека в подсказке и таблице */
    totalLabel?: string;
    /** Текст пустого состояния */
    emptyText?: string;
  }>(),
  {
    orientation: "vertical",
    stacked: false,
    height: "m",
    xLabel: "Категория",
    totalLabel: "Всего",
    emptyText: "Нет данных за этот период",
  },
);

const ctx = useChartContext(() => props.label ?? "");
const container = ref<HTMLElement>();
const { width, height: boxH } = useSize(container);
const m = ref(chartMetrics());
onMounted(() => (m.value = chartMetrics()));

const vertical = computed(() => props.orientation === "vertical");

/* ---------- серии ---------- */
const { hidden, colorOf, visible, toggle, legendItems } = useSeries(
  () => props.series,
  () => props.emphasis,
);

/* ---------- категории ---------- */
function formatX(value: unknown): string {
  if (typeof props.xFormat === "function") return props.xFormat(value);
  if (value instanceof Date) return formatDate(value, props.xFormat ?? { month: "short" });
  return String(value ?? "");
}
const n = computed(() => props.data.length);
const catLabels = computed(() => props.data.map((d) => formatX(d[props.x])));

/* ---------- шкала значений ---------- */
const totals = computed(() =>
  props.data.map((d) => visible.value.reduce((sum, s) => sum + Math.max(0, num(d[s.key])), 0)),
);
const valueLength = computed(() => (vertical.value ? boxH.value : width.value));
const tickCount = computed(() =>
  vertical.value
    ? Math.max(LAYOUT.minTicksY, Math.floor(valueLength.value / m.value.tickSpacingY))
    : Math.max(LAYOUT.minTicksX, Math.floor(valueLength.value / m.value.tickSpacing)),
);
const targetDomain = computed(() =>
  niceDomain(
    props.stacked ? totals.value : visible.value.flatMap((s) => props.data.map((d) => num(d[s.key]))),
    tickCount.value,
  ),
);
const ticks = computed(() => fitTicks(targetDomain.value, tickCount.value + 1));
// Функции-форматы без дефолтов в withDefaults: Vue отдал бы функцию как значение, а не как фабрику
const axisLabel = (v: number) => (props.axisFormat ? formatValue(v, props.axisFormat) : formatCompact(v));
const valueFmt = computed<ValueFormat>(() => props.valueFormat ?? { maximumFractionDigits: 1 });

/* ---------- раскладка ---------- */
/** Сколько столбцов в полосе категории: у группы — видимые серии, у стека — один */
const slots = computed(() => (props.stacked ? 1 : Math.max(1, visible.value.length)));
/** Толщина группы при максимальном столбце — высота строки горизонтального графика */
const groupMax = computed(() => slots.value * m.value.barMax + (slots.value - 1) * m.value.barGap);
const rowH = computed(() => groupMax.value + 2 * m.value.gap);

const labelWidth = computed(() =>
  Math.min(
    width.value * LAYOUT.barLabelShare,
    Math.max(0, ...catLabels.value.map((l) => textWidth(l, m.value.axisFont, DIGIT_WIDTH))) + m.value.gap,
  ),
);
const left = computed(() =>
  vertical.value
    ? Math.max(...ticks.value.map((t) => axisLabel(t).length)) * m.value.axisFont * DIGIT_WIDTH + m.value.gap
    : labelWidth.value,
);
const top = computed(() => m.value.gap);
const bottom = computed(() => m.value.axisLine + m.value.gap);
/** Справа у горизонтального — половина последней подписи оси (центрована на делении) */
const right = computed(() =>
  vertical.value
    ? m.value.gap
    : (textWidth(axisLabel(ticks.value.at(-1) ?? 0), m.value.axisFont, DIGIT_WIDTH) + m.value.gap) / 2,
);
const plotW = computed(() => Math.max(0, width.value - left.value - right.value));
const plotH = computed(() =>
  vertical.value ? Math.max(0, boxH.value - top.value - bottom.value) : n.value * rowH.value,
);
/** Горизонтальный: высота — по числу строк (адаптивно без фиксированной высоты и вложенной прокрутки) */
const svgH = computed(() => (vertical.value ? boxH.value : top.value + plotH.value + bottom.value));

/** Полоса категории вдоль оси категорий */
const band = computed(() => {
  const s = scaleBand<number>()
    .domain(props.data.map((_, i) => i))
    .range([0, vertical.value ? plotW.value : plotH.value]);
  return { start: (i: number) => s(i) ?? 0, width: s.bandwidth() };
});
/** Толщина столбца: ≤ size/chart/bar, в полосе остаётся ≥ 20% воздуха */
const barW = computed(() => {
  const k = slots.value;
  const room = band.value.width * LAYOUT.bandFill - (k - 1) * m.value.barGap;
  return Math.max(1, Math.min(m.value.barMax, room / k));
});
const groupW = computed(() => slots.value * barW.value + (slots.value - 1) * m.value.barGap);

/* ---------- анимация ---------- */
const domain = useSpring(computed(() => [...targetDomain.value]), { enter: false });
/** Целевые значения всех серий; скрытая серия — 0 (в стеке сжимается, верхние оседают) */
const targets = computed(() =>
  props.series.flatMap((s) =>
    props.data.map((d) => (hidden.value.has(s.key) ? 0 : num(d[s.key]))),
  ),
);
const animated = useSpring(targets, { enter: false });
const grow = useSpring(
  computed(() => [1]),
  { from: 0, enter: true },
);
/** Волна появления: категория i стартует с задержкой, доля общего хода — STAGGER */
const STAGGER = 0.35;
function progress(i: number) {
  const r = grow.value[0] ?? 1;
  if (r >= 1 || n.value < 2) return Math.min(1, r);
  const offset = (STAGGER * i) / (n.value - 1);
  return Math.min(1, Math.max(0, (r - offset) / (1 - STAGGER)));
}
const valueAt = (si: number, i: number) => (animated.value[si * n.value + i] ?? 0) * progress(i);

const scale = computed(() =>
  scaleLinear()
    .domain([domain.value[0] ?? 0, domain.value[1] ?? 1])
    .range(vertical.value ? [plotH.value, 0] : [0, plotW.value]),
);
const zero = computed(() => scale.value(Math.max(0, targetDomain.value[0])));

/* ---------- столбцы ---------- */
interface Bar {
  id: string;
  d: string;
  color: string;
}
/** Верхний сегмент стека категории — единственный со скруглённым концом */
const topSeries = computed(() =>
  props.data.map((d) => {
    let last = -1;
    props.series.forEach((s, si) => {
      if (!hidden.value.has(s.key) && num(d[s.key]) > 0) last = si;
    });
    return last;
  }),
);
const bars = computed<Bar[]>(() => {
  const out: Bar[] = [];
  const o = props.orientation;
  const sc = scale.value;
  const gap = m.value.barGap;
  const r = m.value.barRadius;
  for (let i = 0; i < n.value; i++) {
    const groupStart = band.value.start(i) + (band.value.width - groupW.value) / 2;
    if (props.stacked) {
      let acc = 0;
      let first = true;
      props.series.forEach((s, si) => {
        const v = Math.max(0, valueAt(si, i));
        const lo = acc;
        acc += v;
        let base = sc(lo);
        const end = sc(acc);
        // Зазор 2px в цвет фона между сегментами — за счёт основания верхнего
        if (!first) base += vertical.value ? -gap : gap;
        if (Math.abs(end - base) < LAYOUT.minMark || (vertical.value ? end > base : end < base)) return;
        first = false;
        const d = barPath(o, groupStart, barW.value, base, end, si === topSeries.value[i] ? r : 0);
        out.push({ id: `${s.key}-${i}`, d, color: colorOf(s.key) });
      });
    } else {
      visible.value.forEach((s, slot) => {
        const si = props.series.indexOf(s);
        const pos = groupStart + slot * (barW.value + gap);
        const d = barPath(o, pos, barW.value, zero.value, sc(valueAt(si, i)), r);
        if (d) out.push({ id: `${s.key}-${i}`, d, color: colorOf(s.key) });
      });
    }
  }
  return out;
});

/* ---------- подписи категорий ---------- */
const catTicks = computed(() => {
  if (!n.value) return [];
  if (!vertical.value) {
    return catLabels.value.map((l, i) => ({
      i,
      pos: band.value.start(i) + band.value.width / 2,
      label: truncate(l, labelWidth.value - m.value.gap, m.value.axisFont, DIGIT_WIDTH),
    }));
  }
  const fit = Math.max(1, Math.floor(plotW.value / m.value.tickSpacing));
  const step = Math.max(1, Math.ceil(n.value / fit));
  const out = [];
  for (let i = 0; i < n.value; i += step) {
    out.push({
      i,
      pos: band.value.start(i) + band.value.width / 2,
      label: truncate(catLabels.value[i]!, band.value.width * step - m.value.gap, m.value.axisFont, DIGIT_WIDTH),
    });
  }
  return out;
});

/* ---------- наведение, подсказка, клавиатура ---------- */
const active = ref<number | null>(null);
function onPointer(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const p = vertical.value ? event.clientX - rect.left - left.value : event.clientY - rect.top - top.value;
  const i = Math.floor(p / (band.value.width || 1));
  active.value = i >= 0 && i < n.value ? i : null;
}
function onKey(event: KeyboardEvent) {
  if (!n.value) return;
  const cur = active.value ?? 0;
  const next =
    event.key === "ArrowRight" || event.key === "ArrowDown" ? Math.min(n.value - 1, cur + 1)
    : event.key === "ArrowLeft" || event.key === "ArrowUp" ? Math.max(0, cur - 1)
    : event.key === "Home" ? 0
    : event.key === "End" ? n.value - 1
    : null;
  if (next === null) return;
  event.preventDefault();
  active.value = next;
}
const tooltipRows = computed(() => {
  if (active.value === null) return [];
  const d = props.data[active.value]!;
  const rows = visible.value.map((s) => ({
    key: s.key,
    label: s.label,
    value: formatValue(num(d[s.key]), valueFmt.value),
    color: colorOf(s.key),
  }));
  // В стеке верхний сегмент — сверху и в подсказке
  if (props.stacked) {
    rows.reverse();
    if (visible.value.length > 1) {
      rows.push({
        key: "__total",
        label: props.totalLabel,
        value: formatValue(totals.value[active.value]!, valueFmt.value),
        color: "transparent",
      });
    }
  }
  return rows;
});
const tooltipPos = computed(() => {
  if (active.value === null) return { x: 0, y: 0 };
  const mid = band.value.start(active.value) + band.value.width / 2;
  if (vertical.value) return { x: left.value + mid, y: 0 };
  // Горизонтальный: под строкой, от конца самой длинной полосы (не закрывает подпись и саму полосу)
  const d = props.data[active.value]!;
  const ends = visible.value.map((s) => num(d[s.key]));
  const end = props.stacked ? totals.value[active.value]! : Math.max(0, ...ends);
  return { x: left.value + scale.value(end), y: top.value + band.value.start(active.value) + band.value.width };
});
const announcement = computed(() =>
  active.value === null
    ? ""
    : `${catLabels.value[active.value]}: ${tooltipRows.value.map((r) => `${r.label} ${r.value}`).join(", ")}`,
);
const keyboardLabel = computed(() => {
  const name = ctx.title.value || props.label || "График";
  return `${name}. Стрелки — значения по категориям`;
});

/* ---------- табличный двойник ---------- */
const tableColumns = computed<TableColumn[]>(() => {
  const format = (v: unknown) => formatValue(num(v), valueFmt.value);
  const cols: TableColumn[] = [
    { key: props.x, label: props.xLabel, format: formatX },
    ...props.series.map((s) => ({ key: s.key, label: s.label, numeric: true, format })),
  ];
  if (props.stacked && props.series.length > 1) cols.push({ key: "__total", label: props.totalLabel, numeric: true, format });
  return cols;
});
const tableRows = computed(() =>
  props.stacked
    ? props.data.map((d) => ({ ...d, __total: props.series.reduce((sum, s) => sum + num(d[s.key]), 0) }))
    : props.data,
);
</script>

<template>
  <div
    class="ui-bar-chart"
    :data-height="props.height"
    :data-orientation="orientation"
  >
    <ChartTable
      v-if="ctx.view.value === 'table'"
      :caption="ctx.title.value || label || ''"
      :columns="tableColumns"
      :rows="tableRows"
    />
    <template v-else>
      <ChartLegend
        v-if="series.length > 1"
        class="ui-bar-chart__legend"
        shape="rect"
        :items="legendItems"
        @toggle="toggle"
      />
      <p
        v-if="!data.length"
        class="ui-bar-chart__empty"
      >
        {{ emptyText }}
      </p>
      <div
        v-else
        ref="container"
        class="ui-bar-chart__plot"
        :style="vertical ? undefined : { blockSize: `${svgH}px` }"
      >
        <svg
          v-if="width > 0"
          :width="width"
          :height="svgH"
          aria-hidden="true"
        >
          <g :transform="`translate(${left}, ${top})`">
            <!-- Подложка категории под указателем -->
            <rect
              v-if="active !== null"
              class="ui-bar-chart__wash"
              :x="vertical ? band.start(active) : -left"
              :y="vertical ? 0 : band.start(active)"
              :width="vertical ? band.width : left + plotW"
              :height="vertical ? plotH : band.width"
              :rx="m.barRadius"
            />

            <!-- Сетка и подписи значений -->
            <g
              v-for="t in ticks"
              :key="`t-${t}`"
              :transform="vertical ? `translate(0, ${scale(t)})` : `translate(${scale(t)}, 0)`"
            >
              <line
                class="ui-bar-chart__grid"
                :x2="vertical ? plotW : 0"
                :y2="vertical ? 0 : plotH"
              />
              <text
                class="ui-bar-chart__axis-label"
                :x="vertical ? -m.gap : 0"
                :y="vertical ? 0 : plotH + m.gap + m.axisLine / 2"
                dy="0.32em"
                :text-anchor="vertical ? 'end' : 'middle'"
              >{{ axisLabel(t) }}</text>
            </g>

            <path
              v-for="b in bars"
              :key="b.id"
              class="ui-bar-chart__bar"
              :d="b.d"
              :style="{ fill: b.color }"
            />

            <!-- Базовая линия поверх оснований столбцов -->
            <line
              class="ui-bar-chart__baseline"
              :x1="vertical ? 0 : zero"
              :x2="vertical ? plotW : zero"
              :y1="vertical ? zero : 0"
              :y2="vertical ? zero : plotH"
            />

            <!-- Подписи категорий -->
            <text
              v-for="t in catTicks"
              :key="`c-${t.i}`"
              class="ui-bar-chart__axis-label"
              :data-active="t.i === active || undefined"
              :x="vertical ? t.pos : -m.gap"
              :y="vertical ? plotH + m.gap + m.axisLine / 2 : t.pos"
              dy="0.32em"
              :text-anchor="vertical ? 'middle' : 'end'"
            >{{ t.label }}</text>
          </g>
        </svg>

        <div
          class="ui-bar-chart__hit"
          tabindex="0"
          role="group"
          :aria-label="keyboardLabel"
          @pointermove="onPointer"
          @pointerdown="onPointer"
          @pointerleave="active = null"
          @focus="active = active ?? 0"
          @blur="active = null"
          @keydown="onKey"
        />
        <ChartTooltip
          v-if="active !== null && width > 0"
          :title="catLabels[active] ?? ''"
          :rows="tooltipRows"
          :x="tooltipPos.x"
          :y="tooltipPos.y"
          :container-width="width"
          shape="rect"
        />
        <p
          class="ui-bar-chart__live"
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
  .ui-bar-chart {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
  }

  .ui-bar-chart__plot {
    position: relative;
    block-size: var(--size-chart-m);
  }

  .ui-bar-chart[data-height="s"] .ui-bar-chart__plot {
    block-size: var(--size-chart-s);
  }

  .ui-bar-chart[data-height="l"] .ui-bar-chart__plot {
    block-size: var(--size-chart-l);
  }

  svg {
    display: block;
    overflow: visible;
  }

  .ui-bar-chart__grid {
    stroke: var(--color-chart-grid, GrayText);
    stroke-width: var(--stroke-1);
    shape-rendering: crispedges;
  }

  .ui-bar-chart__baseline {
    stroke: var(--color-chart-axis, GrayText);
    stroke-width: var(--stroke-1);
    shape-rendering: crispedges;
  }

  .ui-bar-chart__axis-label {
    fill: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-caption-font-family);
    font-size: var(--type-caption-font-size);
    font-variant-numeric: tabular-nums;
    transition: fill var(--duration-press) ease;
  }

  .ui-bar-chart__axis-label[data-active] {
    fill: var(--color-text-primary, CanvasText);
  }

  .ui-bar-chart__wash {
    fill: var(--color-chart-grid, GrayText);
  }

  .ui-bar-chart__hit {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-2);
    touch-action: pan-y;
  }

  .ui-bar-chart__hit:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-bar-chart__legend {
    margin-inline: calc(-1 * var(--space-2));
  }

  .ui-bar-chart__empty {
    display: grid;
    place-items: center;
    block-size: var(--size-chart-m);
    margin: 0;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-s-font-family);
    font-size: var(--type-body-s-font-size);
  }

  .ui-bar-chart__live {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-bar-chart__axis-label {
      transition: none;
    }
  }
}
</style>
