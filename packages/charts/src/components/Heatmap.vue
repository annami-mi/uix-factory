<script setup lang="ts">
/**
 * Тепловая карта — величина на сетке двух измерений (активность по дням недели × часам, когорты).
 * Методика ADR-0007: последовательная шкала одного оттенка `color/chart/sequential/1…7` (светлое — мало;
 * в тёмной схеме якорь перевёрнут токенами), зазор 2px в цвет фона между ячейками, легенда шкалы
 * со значениями концов. Цвет на непрерывной шкале не единственный канал — подсказка и табличный двойник.
 *
 * Адаптивно: размер ячейки — от ширины (квадратная, не больше size/40); подписи колонок прореживаются.
 * Анимация — ячейки проявляются волной по диагонали; при смене данных цвет перетекает.
 * Клавиатура — Tab на карту, стрелки по двум осям, Home/End по строке.
 */
import { computed, onMounted, ref } from "vue";
import { tokenNumber } from "@uix/ui";
import { useChartContext } from "../core/context";
import { formatValue, type ValueFormat } from "../core/format";
import { chartMetrics, DIGIT_WIDTH, LAYOUT } from "../core/metrics";
import { textWidth, truncate } from "../core/scale";
import type { Datum, TableColumn } from "../core/types";
import { useSize } from "../core/useSize";
import ChartTable from "./ChartTable.vue";
import ChartTooltip from "./ChartTooltip.vue";

const props = withDefaults(
  defineProps<{
    /** Подписи строк (ось Y) */
    rows: string[];
    /** Подписи колонок (ось X) */
    columns: string[];
    /** values[строка][колонка] */
    values: number[][];
    /** Формат значения в подсказке, легенде и таблице */
    valueFormat?: ValueFormat;
    /** Заголовок столбца строк в табличном двойнике */
    rowLabel?: string;
    /** Что за величина — в подсказке («Сессии») */
    valueLabel?: string;
    /** Имя карты без ChartCard */
    label?: string;
    /** Текст пустого состояния */
    emptyText?: string;
  }>(),
  { rowLabel: "Строка", valueLabel: "Значение", emptyText: "Нет данных за этот период" },
);

/** Шагов последовательной шкалы: больше ~7 классов глаз не различает */
const STEPS = 7;

const ctx = useChartContext(() => props.label ?? "");
const container = ref<HTMLElement>();
const { width } = useSize(container);
const m = ref(chartMetrics());
/** Максимальная ячейка — size/40 */
const maxCell = ref(40);
onMounted(() => {
  m.value = chartMetrics();
  maxCell.value = tokenNumber("--size-40", 40);
});

const nRows = computed(() => props.rows.length);
const nCols = computed(() => props.columns.length);
const flat = computed(() => props.values.flat().filter((v) => Number.isFinite(v)));
const lo = computed(() => (flat.value.length ? Math.min(...flat.value) : 0));
const hi = computed(() => (flat.value.length ? Math.max(...flat.value) : 1));
const fmt = (v: number) => formatValue(v, props.valueFormat ?? { maximumFractionDigits: 1 });

/** Класс шкалы 0…6 — равные интервалы от минимума до максимума */
function step(v: number) {
  if (hi.value === lo.value) return STEPS - 1;
  return Math.min(STEPS - 1, Math.floor(((v - lo.value) / (hi.value - lo.value)) * STEPS));
}
const colorOf = (v: number) => `var(--color-chart-sequential-${step(v) + 1}, CanvasText)`;

/* ---------- раскладка ---------- */
const left = computed(() =>
  Math.min(
    width.value * LAYOUT.heatmapLabelShare,
    Math.max(0, ...props.rows.map((r) => textWidth(r, m.value.axisFont, DIGIT_WIDTH))) + m.value.gap,
  ),
);
const cell = computed(() => Math.max(0, Math.min(maxCell.value, (width.value - left.value) / Math.max(1, nCols.value))));
/** Высота строки — не меньше строки подписи (на телефоне ячейки узкие, подписи строк не слипаются) */
const cellH = computed(() => Math.max(cell.value, m.value.axisLine + m.value.barGap));
const gridW = computed(() => cell.value * nCols.value);
const gridH = computed(() => cellH.value * nRows.value);
const svgH = computed(() => gridH.value + m.value.gap + m.value.axisLine);

/** Подписи колонок: не теснее ширины самой длинной подписи */
const colTicks = computed(() => {
  const widest = Math.max(0, ...props.columns.map((c) => textWidth(c, m.value.axisFont, DIGIT_WIDTH))) + m.value.gap;
  const every = Math.max(1, Math.ceil(widest / Math.max(1, cell.value)));
  return props.columns.map((label, j) => ({ j, label })).filter(({ j }) => j % every === 0);
});

/* ---------- наведение и клавиатура ---------- */
const active = ref<[number, number] | null>(null);
function onPointer(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const j = Math.floor((event.clientX - rect.left - left.value) / (cell.value || 1));
  const i = Math.floor((event.clientY - rect.top) / (cellH.value || 1));
  active.value = i >= 0 && i < nRows.value && j >= 0 && j < nCols.value ? [i, j] : null;
}
function onKey(event: KeyboardEvent) {
  const [i, j] = active.value ?? [0, 0];
  const moves: Record<string, [number, number]> = {
    ArrowUp: [Math.max(0, i - 1), j],
    ArrowDown: [Math.min(nRows.value - 1, i + 1), j],
    ArrowLeft: [i, Math.max(0, j - 1)],
    ArrowRight: [i, Math.min(nCols.value - 1, j + 1)],
    Home: [i, 0],
    End: [i, nCols.value - 1],
  };
  const next = moves[event.key];
  if (!next) return;
  event.preventDefault();
  active.value = next;
}
const activeValue = computed(() => (active.value ? (props.values[active.value[0]]?.[active.value[1]] ?? 0) : 0));
const activeTitle = computed(() =>
  active.value ? `${props.rows[active.value[0]]}, ${props.columns[active.value[1]]}` : "",
);
const announcement = computed(() =>
  active.value ? `${activeTitle.value}: ${props.valueLabel} ${fmt(activeValue.value)}` : "",
);
const keyboardLabel = computed(
  () => `${ctx.title.value || props.label || "Тепловая карта"}. Стрелки — значения по ячейкам`,
);

/* ---------- легенда шкалы и таблица ---------- */
const legendSteps = Array.from({ length: STEPS }, (_, k) => `var(--color-chart-sequential-${k + 1}, CanvasText)`);
const tableColumns = computed<TableColumn[]>(() => [
  { key: "__row", label: props.rowLabel },
  ...props.columns.map((c, j) => ({ key: `c${j}`, label: c, numeric: true, format: (v: unknown) => fmt(Number(v)) })),
]);
const tableRows = computed<Datum[]>(() =>
  props.rows.map((r, i) => Object.fromEntries([["__row", r], ...props.columns.map((_, j) => [`c${j}`, props.values[i]?.[j] ?? 0])])),
);
</script>

<template>
  <div class="ui-heatmap">
    <ChartTable
      v-if="ctx.view.value === 'table'"
      :caption="ctx.title.value || label || ''"
      :columns="tableColumns"
      :rows="tableRows"
    />
    <template v-else>
      <p
        v-if="!nRows || !nCols"
        class="ui-heatmap__empty"
      >
        {{ emptyText }}
      </p>
      <template v-else>
        <div
          ref="container"
          class="ui-heatmap__plot"
          :style="{ blockSize: `${svgH}px` }"
        >
          <svg
            v-if="width > 0"
            :width="width"
            :height="svgH"
            aria-hidden="true"
          >
            <text
              v-for="(r, i) in rows"
              :key="`r-${i}`"
              class="ui-heatmap__axis-label"
              :data-active="active?.[0] === i || undefined"
              :x="left - m.gap"
              :y="i * cellH + cellH / 2"
              dy="0.32em"
              text-anchor="end"
            >{{ truncate(r, left - m.gap, m.axisFont, DIGIT_WIDTH) }}</text>
            <g :transform="`translate(${left}, 0)`">
              <template
                v-for="(row, i) in values"
                :key="`row-${i}`"
              >
                <!-- Зазор 2px в цвет фона — за счёт ячейки, не обводкой -->
                <rect
                  v-for="(v, j) in row"
                  :key="`c-${i}-${j}`"
                  class="ui-heatmap__cell"
                  :x="j * cell + m.barGap / 2"
                  :y="i * cellH + m.barGap / 2"
                  :width="Math.max(0, cell - m.barGap)"
                  :height="Math.max(0, cellH - m.barGap)"
                  :rx="Math.min(m.barRadius, cell / 4)"
                  :style="{ fill: colorOf(v), '--_t': (i + j) / (nRows + nCols) }"
                />
              </template>
              <rect
                v-if="active"
                class="ui-heatmap__focus"
                :x="active[1] * cell + m.barGap / 2"
                :y="active[0] * cellH + m.barGap / 2"
                :width="Math.max(0, cell - m.barGap)"
                :height="Math.max(0, cellH - m.barGap)"
                :rx="Math.min(m.barRadius, cell / 4)"
                :stroke-width="m.ring"
              />
              <text
                v-for="t in colTicks"
                :key="`col-${t.j}`"
                class="ui-heatmap__axis-label"
                :data-active="active?.[1] === t.j || undefined"
                :x="t.j * cell + cell / 2"
                :y="gridH + m.gap + m.axisLine / 2"
                dy="0.32em"
                text-anchor="middle"
              >{{ t.label }}</text>
            </g>
          </svg>
          <div
            class="ui-heatmap__hit"
            tabindex="0"
            role="group"
            :aria-label="keyboardLabel"
            :style="{ inlineSize: `${left + gridW}px`, blockSize: `${gridH}px` }"
            @pointermove="onPointer"
            @pointerdown="onPointer"
            @pointerleave="active = null"
            @focus="active = active ?? [0, 0]"
            @blur="active = null"
            @keydown="onKey"
          />
          <ChartTooltip
            v-if="active && width > 0"
            :title="activeTitle"
            :rows="[{ key: 'v', label: valueLabel, value: fmt(activeValue), color: colorOf(activeValue) }]"
            :x="left + active[1] * cell + cell / 2"
            :y="(active[0] + 1) * cellH"
            :container-width="width"
            shape="rect"
          />
          <p
            class="ui-heatmap__live"
            aria-live="polite"
          >
            {{ announcement }}
          </p>
        </div>

        <!-- Легенда шкалы: концы — значениями -->
        <div
          class="ui-heatmap__scale"
          aria-hidden="true"
          :style="{ marginInlineStart: `${left}px` }"
        >
          <span>{{ fmt(lo) }}</span>
          <span class="ui-heatmap__ramp">
            <span
              v-for="c in legendSteps"
              :key="c"
              :style="{ background: c }"
            />
          </span>
          <span>{{ fmt(hi) }}</span>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
@layer components {
  .ui-heatmap {
    display: grid;
    gap: var(--space-3);
    min-inline-size: 0;
  }

  .ui-heatmap__plot {
    position: relative;
  }

  svg {
    display: block;
    overflow: visible;
  }

  .ui-heatmap__cell {
    transition: fill var(--duration-slow) ease;
    animation: ui-heatmap-in var(--duration-slower) var(--easing-spring-release) both;
    animation-delay: calc(var(--duration-slower) * var(--_t));
  }

  @keyframes ui-heatmap-in {
    from {
      opacity: 0;
    }
  }

  .ui-heatmap__focus {
    fill: none;
    stroke: var(--color-text-primary, CanvasText);
    pointer-events: none;
  }

  .ui-heatmap__axis-label {
    fill: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-caption-font-family);
    font-size: var(--type-caption-font-size);
    font-variant-numeric: tabular-nums;
  }

  .ui-heatmap__axis-label[data-active] {
    fill: var(--color-text-primary, CanvasText);
  }

  .ui-heatmap__hit {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    border-radius: var(--radius-2);
    touch-action: pan-y;
  }

  .ui-heatmap__hit:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-heatmap__scale {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-caption-font-family);
    font-size: var(--type-caption-font-size);
    line-height: var(--type-caption-line-height);
    font-variant-numeric: tabular-nums;
  }

  .ui-heatmap__ramp {
    display: flex;
    gap: var(--stroke-2);
  }

  .ui-heatmap__ramp span {
    inline-size: var(--space-4);
    block-size: var(--space-2);
    border-radius: var(--radius-1);
  }

  .ui-heatmap__empty {
    display: grid;
    place-items: center;
    block-size: var(--size-chart-m);
    margin: 0;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-s-font-family);
    font-size: var(--type-body-s-font-size);
  }

  .ui-heatmap__live {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-heatmap__cell {
      transition: none;
      animation: none;
    }
  }
}
</style>
