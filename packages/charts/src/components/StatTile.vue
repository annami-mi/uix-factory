<script setup lang="ts">
/**
 * Плитка KPI — «число и есть график»: подпись, крупное значение, дельта к прошлому периоду, спарклайн.
 * `tone="inverted"` — контрастная плашка (bento-contrast); `trendVariant="bars"` — встроенные мини-столбики.
 * Ряд KPI — `Grid min="s"` из @uix/ui (контейнерная раскладка: 1–2 колонки на телефоне, 4 на десктопе).
 *
 * - Значение — пропорциональные цифры (не tabular: крупное число с моноширинными цифрами «разваливается»);
 *   при появлении и смене — счётчик на пружине данных. Скринридер читает итог, не промежуточные числа.
 * - Дельта знает, хорошо ли «вверх» (`upIsGood`): рост оттока — плохо. Смысл — иконкой и текстом,
 *   цвет — токен статуса текста (не только цветом, методика ADR-0007).
 * - `loading` — прежнее значение приглушено, без скелетона.
 */
import { computed } from "vue";
import { Minus, TrendingDown, TrendingUp } from "@lucide/vue";
import { Card } from "@uix/ui";
import { formatDelta, formatValue, type ValueFormat } from "../core/format";
import { useSpring } from "../core/useSpring";
import Sparkline from "./Sparkline.vue";

const props = withDefaults(
  defineProps<{
    /** Название показателя */
    label: string;
    /** Значение показателя */
    value: number;
    /** Формат значения (Intl или функция) */
    valueFormat?: ValueFormat;
    /** Изменение к прошлому периоду, доля: 0.125 → +12,5 % */
    delta?: number;
    /** С чем сравнение: «к июлю» */
    deltaLabel?: string;
    /** Рост — хорошо (выручка) или плохо (отток, ошибки) */
    upIsGood?: boolean;
    /** Значения за период — спарклайн */
    trend?: number[];
    /** Слот палитры спарклайна */
    series?: number;
    /** Встроенный график: линия тренда или мини-столбики (bento-contrast) */
    trendVariant?: "line" | "bars";
    /** Обычная плитка или инвертированная плашка (Card tone) */
    tone?: "default" | "inverted";
    /** Идёт перезагрузка — прежнее значение приглушено */
    loading?: boolean;
  }>(),
  { upIsGood: true, series: 1, loading: false, trendVariant: "line", tone: "default" },
);

const fmt = (v: number) => formatValue(v, props.valueFormat ?? { maximumFractionDigits: 1 });
const counter = useSpring(computed(() => [props.value]));
/** Промежуточные значения — с той же точностью, что итог (без «дрожащих» дробей у целых) */
const shown = computed(() => {
  const v = counter.value[0] ?? props.value;
  return fmt(Number.isInteger(props.value) ? Math.round(v) : v);
});

const deltaTone = computed(() => {
  if (props.delta === undefined || props.delta === 0) return "neutral";
  return props.delta > 0 === props.upIsGood ? "good" : "bad";
});
const deltaText = computed(() =>
  props.delta === undefined ? "" : formatDelta(props.delta, { style: "percent", maximumFractionDigits: 1 }),
);
const deltaSr = computed(() => {
  if (props.delta === undefined) return "";
  const verdict = deltaTone.value === "good" ? "хорошо" : deltaTone.value === "bad" ? "плохо" : "без изменений";
  return `${deltaText.value} ${props.deltaLabel ?? ""} — ${verdict}`.replace(/\s+/g, " ");
});
</script>

<template>
  <Card
    class="ui-stat-tile"
    :tone="tone"
    :data-loading="loading || undefined"
    :aria-busy="loading ? 'true' : undefined"
  >
    <p class="ui-stat-tile__label">
      {{ label }}
    </p>
    <p class="ui-stat-tile__value">
      <span aria-hidden="true">{{ shown }}</span>
      <span class="ui-stat-tile__sr">{{ fmt(value) }}</span>
    </p>
    <p
      v-if="delta !== undefined"
      class="ui-stat-tile__delta"
      :data-tone="deltaTone"
    >
      <span
        class="ui-stat-tile__delta-value"
        aria-hidden="true"
      >
        <TrendingUp v-if="delta > 0" />
        <TrendingDown v-else-if="delta < 0" />
        <Minus v-else />
        {{ deltaText }}
      </span>
      <span
        v-if="deltaLabel"
        class="ui-stat-tile__delta-label"
        aria-hidden="true"
      >{{ deltaLabel }}</span>
      <span class="ui-stat-tile__sr">{{ deltaSr }}</span>
    </p>
    <Sparkline
      v-if="trend?.length"
      class="ui-stat-tile__trend"
      :data="trend"
      :label="`${label}, динамика`"
      :series="series"
      :variant="trendVariant"
      :accent="tone === 'inverted'"
      :value-format="valueFormat"
    />
  </Card>
</template>

<style scoped>
@layer components {
  .ui-stat-tile {
    display: grid;
    align-content: start;
    gap: var(--space-1);
    min-inline-size: 0;
    transition: opacity var(--duration-normal) ease;
  }

  .ui-stat-tile[data-loading] {
    opacity: var(--opacity-50);
  }

  .ui-stat-tile p {
    margin: 0;
  }

  .ui-stat-tile__label {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
  }

  /* Крупное число — пропорциональные цифры, тот же гротеск */
  .ui-stat-tile__value {
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-heading-l-font-family);
    font-weight: var(--type-heading-l-font-weight);
    font-size: var(--type-heading-l-font-size);
    line-height: var(--type-heading-l-line-height);
    white-space: nowrap;
  }

  .ui-stat-tile__delta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: var(--space-2);
    font-family: var(--type-body-xs-font-family);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
  }

  .ui-stat-tile__delta-value {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-weight: var(--type-label-xs-font-weight);
  }

  .ui-stat-tile__delta-value svg {
    inline-size: var(--size-16);
    block-size: var(--size-16);
    stroke-width: var(--stroke-icon);
  }

  .ui-stat-tile__delta[data-tone="good"] .ui-stat-tile__delta-value {
    color: var(--color-status-success, CanvasText);
  }

  .ui-stat-tile__delta[data-tone="bad"] .ui-stat-tile__delta-value {
    color: var(--color-status-danger, CanvasText);
  }

  .ui-stat-tile__delta[data-tone="neutral"] .ui-stat-tile__delta-value,
  .ui-stat-tile__delta-label {
    color: var(--color-text-secondary, CanvasText);
  }

  .ui-stat-tile__trend {
    margin-block-start: var(--space-2);
  }

  .ui-stat-tile__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-stat-tile {
      transition: none;
    }
  }
}
</style>
