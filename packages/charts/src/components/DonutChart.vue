<script setup lang="ts">
/**
 * Круговая (кольцевая) диаграмма — доля от целого «одним взглядом»: источники трафика, структура выручки.
 * Методика ADR-0007: не больше 6 сегментов (хвост сворачивается в «Другое», цвет `muted`); сегменты по
 * убыванию; кольцо тонкое (толщина — size/chart/bar), зазор 2px в цвет фона, концы скруглены.
 * Для сравнения близких значений — BarChart, не донат.
 *
 * - В центре — итог; при наведении/касании/клавиатуре — выбранная доля (центр заменяет подсказку),
 *   остальные сегменты приглушаются. Легенда — прямые подписи: цвет, название, доля, значение.
 * - Анимация: при появлении сегменты заметаются по кругу, при смене данных — перетекают (пружина).
 * - Адаптивно: в узком контейнере легенда под кольцом, в широком — справа (container query).
 */
import { computed, onMounted, ref } from "vue";
import { arc as d3arc, pie as d3pie } from "d3-shape";
import { useChartContext } from "../core/context";
import { formatValue, type ValueFormat } from "../core/format";
import { chartMetrics } from "../core/metrics";
import { num } from "../core/scale";
import { foldSegments } from "../core/segments";
import type { Datum, TableColumn } from "../core/types";
import { useSize } from "../core/useSize";
import { useSpring } from "../core/useSpring";
import ChartTable from "./ChartTable.vue";

const props = withDefaults(
  defineProps<{
    /** Строки данных: название доли и значение */
    data: Datum[];
    /** Поле названия доли */
    x: string;
    /** Поле значения */
    value: string;
    /** Формат значения (центр, легенда, таблица) */
    valueFormat?: ValueFormat;
    /** Максимум сегментов с «Другое» включительно (методика — ≤ 6) */
    maxSegments?: number;
    /** Подпись свёрнутого хвоста */
    otherLabel?: string;
    /** Подпись итога в центре */
    totalLabel?: string;
    /** Заголовки столбцов табличного двойника */
    xLabel?: string;
    /** Заголовок столбца значений в таблице */
    valueLabel?: string;
    /** Высота кольца: size/chart/{s,m,l} */
    height?: "s" | "m" | "l";
    /** Имя диаграммы без ChartCard */
    label?: string;
    /** Текст пустого состояния */
    emptyText?: string;
  }>(),
  {
    maxSegments: 6,
    otherLabel: "Другое",
    totalLabel: "Всего",
    xLabel: "Категория",
    valueLabel: "Значение",
    height: "m",
    emptyText: "Нет данных за этот период",
  },
);

const ctx = useChartContext(() => props.label ?? "");
const container = ref<HTMLElement>();
const { width, height: boxH } = useSize(container);
const m = ref(chartMetrics());
onMounted(() => (m.value = chartMetrics()));

const fmt = (v: number) => formatValue(v, props.valueFormat ?? { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 });

/* ---------- сегменты: по убыванию, хвост — в «Другое»; цвет — по сущности (core/segments) ---------- */
const segments = computed(() =>
  foldSegments(
    props.data.map((d) => ({ label: String(d[props.x]), value: num(d[props.value]) })),
    props.maxSegments,
    props.otherLabel,
  ),
);
const total = computed(() => segments.value.reduce((sum, s) => sum + s.value, 0));

/* ---------- анимация: заметание и перетекание ---------- */
const values = useSpring(computed(() => segments.value.map((s) => s.value)), { enter: false });
const sweep = useSpring(
  computed(() => [1]),
  { from: 0 },
);

const size = computed(() => Math.max(0, Math.min(width.value, boxH.value)));
const outer = computed(() => size.value / 2 - m.value.ring);
const inner = computed(() => Math.max(0, outer.value - m.value.barMax));
const arcs = computed(() => {
  const vals = segments.value.map((_, i) => Math.max(0, values.value[i] ?? 0));
  const layout = d3pie<number>()
    .sort(null)
    .value((v) => v)
    .endAngle(2 * Math.PI * Math.min(1, sweep.value[0] ?? 1))
    // Зазор 2px в цвет фона — угол на средней окружности
    .padAngle(m.value.barGap / Math.max(1, (outer.value + inner.value) / 2))(vals);
  const gen = d3arc<{ startAngle: number; endAngle: number; padAngle: number }>()
    .innerRadius(inner.value)
    .outerRadius(outer.value)
    .cornerRadius(Math.min(m.value.barRadius, (outer.value - inner.value) / 2));
  return layout.map((a, i) => ({ ...segments.value[i]!, d: gen(a) ?? "" }));
});

/* ---------- выбор доли: указатель, касание, клавиатура ---------- */
const active = ref<number | null>(null);
function onKey(event: KeyboardEvent) {
  const n = segments.value.length;
  if (!n) return;
  const cur = active.value ?? 0;
  const next =
    event.key === "ArrowRight" || event.key === "ArrowDown" ? (cur + 1) % n
    : event.key === "ArrowLeft" || event.key === "ArrowUp" ? (cur - 1 + n) % n
    : event.key === "Home" ? 0
    : event.key === "End" ? n - 1
    : null;
  if (next === null) return;
  event.preventDefault();
  active.value = next;
}
const share = (v: number) => (total.value ? v / total.value : 0);
const center = computed(() => {
  const s = active.value === null ? null : segments.value[active.value];
  return s
    ? { value: fmt(s.value), label: `${s.label} · ${percent.format(share(s.value))}` }
    : { value: fmt(total.value), label: props.totalLabel };
});
const announcement = computed(() => {
  const s = active.value === null ? null : segments.value[active.value];
  return s ? `${s.label}: ${fmt(s.value)}, ${percent.format(share(s.value))}` : "";
});
const keyboardLabel = computed(
  () => `${ctx.title.value || props.label || "Диаграмма"}. Стрелки — доли по очереди`,
);

/* ---------- табличный двойник ---------- */
const tableColumns = computed<TableColumn[]>(() => [
  { key: "label", label: props.xLabel },
  { key: "value", label: props.valueLabel, numeric: true, format: (v) => fmt(num(v)) },
  { key: "share", label: "Доля", numeric: true, format: (v) => percent.format(num(v)) },
]);
const tableRows = computed(() =>
  segments.value.map((s) => ({ label: s.label, value: s.value, share: share(s.value) })),
);
</script>

<template>
  <div
    class="ui-donut"
    :data-height="props.height"
  >
    <ChartTable
      v-if="ctx.view.value === 'table'"
      :caption="ctx.title.value || label || ''"
      :columns="tableColumns"
      :rows="tableRows"
    />
    <p
      v-else-if="!segments.length"
      class="ui-donut__empty"
    >
      {{ emptyText }}
    </p>
    <div
      v-else
      class="ui-donut__layout"
    >
      <div
        ref="container"
        class="ui-donut__plot"
      >
        <svg
          v-if="size > 0"
          :width="size"
          :height="size"
          aria-hidden="true"
          @pointerleave="active = null"
        >
          <g :transform="`translate(${size / 2}, ${size / 2})`">
            <path
              v-for="(a, i) in arcs"
              :key="a.key"
              class="ui-donut__segment"
              :data-dim="active !== null && active !== i ? '' : undefined"
              :d="a.d"
              :style="{ fill: a.color }"
              @pointerenter="active = i"
              @pointerdown="active = i"
            />
          </g>
        </svg>
        <!-- Центр — итог или выбранная доля (вместо всплывающей подсказки) -->
        <div
          class="ui-donut__center"
          aria-hidden="true"
        >
          <span class="ui-donut__center-value">{{ center.value }}</span>
          <span class="ui-donut__center-label">{{ center.label }}</span>
        </div>
        <div
          class="ui-donut__hit"
          tabindex="0"
          role="group"
          :aria-label="keyboardLabel"
          :style="{ inlineSize: `${size}px`, blockSize: `${size}px` }"
          @focus="active = active ?? 0"
          @blur="active = null"
          @keydown="onKey"
        />
        <p
          class="ui-donut__live"
          aria-live="polite"
        >
          {{ announcement }}
        </p>
      </div>

      <!-- Легенда — прямые подписи всех долей: идентичность не только цветом -->
      <ul class="ui-donut__legend">
        <li
          v-for="(s, i) in segments"
          :key="s.key"
          class="ui-donut__legend-item"
          :data-active="active === i || undefined"
          :data-dim="active !== null && active !== i ? '' : undefined"
          @pointerenter="active = i"
          @pointerleave="active = null"
        >
          <span
            class="ui-donut__swatch"
            :style="{ background: s.color }"
            aria-hidden="true"
          />
          <span class="ui-donut__legend-label">{{ s.label }}</span>
          <span class="ui-donut__legend-share">{{ percent.format(share(s.value)) }}</span>
          <span class="ui-donut__legend-value">{{ fmt(s.value) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
@layer components {
  .ui-donut {
    container-type: inline-size;
    min-inline-size: 0;
  }

  /* Mobile-first: кольцо, под ним легенда; шире size/container/s (640px; в @container нельзя var()) — рядом */
  .ui-donut__layout {
    display: grid;
    gap: var(--space-4);
  }

  @container (min-width: 640px) {
    .ui-donut__layout {
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: var(--space-8);
    }

    .ui-donut__plot {
      inline-size: var(--size-chart-m);
    }

    .ui-donut[data-height="s"] .ui-donut__plot {
      inline-size: var(--size-chart-s);
    }

    .ui-donut[data-height="l"] .ui-donut__plot {
      inline-size: var(--size-chart-l);
    }
  }

  .ui-donut__plot {
    position: relative;
    display: grid;
    place-items: center;
    block-size: var(--size-chart-m);
  }

  .ui-donut[data-height="s"] .ui-donut__plot {
    block-size: var(--size-chart-s);
  }

  .ui-donut[data-height="l"] .ui-donut__plot {
    block-size: var(--size-chart-l);
  }

  svg {
    display: block;
    grid-area: 1 / 1;
  }

  .ui-donut__segment {
    transition: opacity var(--duration-normal) ease;
    cursor: pointer;
  }

  .ui-donut__segment[data-dim] {
    opacity: var(--opacity-30);
  }

  .ui-donut__center {
    grid-area: 1 / 1;
    display: grid;
    justify-items: center;
    max-inline-size: calc(var(--size-chart-m) - 2 * var(--size-chart-bar) - 2 * var(--space-4));
    text-align: center;
    pointer-events: none;
  }

  /* Крупное число — пропорциональные цифры */
  .ui-donut__center-value {
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-heading-m-font-family);
    font-weight: var(--type-heading-m-font-weight);
    font-size: var(--type-heading-m-font-size);
    line-height: var(--type-heading-m-line-height);
  }

  .ui-donut__center-label {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-xs-font-family);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
  }

  /* Фокус-кольцо вокруг диска; указатель проходит к сегментам */
  .ui-donut__hit {
    position: absolute;
    inset: 0;
    margin: auto;
    border-radius: var(--radius-full);
    pointer-events: none;
  }

  .ui-donut__hit:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  /* Общие колонки у всех строк (subgrid) — доли и значения выровнены; ширина — не шире size/grid-item/l */
  .ui-donut__legend {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: var(--space-1) 0;
    max-inline-size: var(--size-grid-item-l);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ui-donut__legend-item {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: center;
    column-gap: var(--space-3);
    min-block-size: var(--size-32);
    padding-inline: var(--space-2);
    border-radius: var(--radius-2);
    font-family: var(--type-body-s-font-family);
    font-size: var(--type-body-s-font-size);
    line-height: var(--type-body-s-line-height);
    transition:
      opacity var(--duration-normal) ease,
      background-color var(--duration-fast) ease;
  }

  .ui-donut__legend-item[data-active] {
    background: var(--surface-ghost-hover-bg, transparent);
  }

  .ui-donut__legend-item[data-dim] {
    opacity: var(--opacity-60);
  }

  .ui-donut__swatch {
    inline-size: var(--space-3);
    block-size: var(--space-3);
    border-radius: var(--radius-1);
  }

  .ui-donut__legend-label {
    overflow: hidden;
    color: var(--color-text-primary, CanvasText);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ui-donut__legend-share {
    text-align: end;
    color: var(--color-text-secondary, CanvasText);
    font-variant-numeric: tabular-nums;
  }

  .ui-donut__legend-value {
    color: var(--color-text-primary, CanvasText);
    font-weight: var(--type-label-s-font-weight);
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  .ui-donut__empty {
    display: grid;
    place-items: center;
    block-size: var(--size-chart-m);
    margin: 0;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-s-font-family);
    font-size: var(--type-body-s-font-size);
  }

  .ui-donut__live {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-donut__segment,
    .ui-donut__legend-item {
      transition: none;
    }
  }
}
</style>
