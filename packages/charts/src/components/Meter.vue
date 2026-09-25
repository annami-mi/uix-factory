<script setup lang="ts">
/**
 * Шкала заполнения — использование лимита, квоты, места (role="meter"). Одна величина к пределу:
 * дорожка — тонкая, заливка — слот серии; у порогов — статус (warning/critical) **иконкой и текстом**,
 * цвет заливки — токен статуса графиков (не только цветом, методика ADR-0007).
 * Анимация — заливка растёт при появлении и перетекает при смене значения (пружина данных).
 */
import { computed, useId } from "vue";
import { CircleAlert, TriangleAlert } from "@lucide/vue";
import { formatValue, type ValueFormat } from "../core/format";
import { useSpring } from "../core/useSpring";

const props = withDefaults(
  defineProps<{
    /** Что измеряем — имя шкалы */
    label: string;
    /** Текущее значение */
    value: number;
    /** Предел (лимит, квота) */
    max: number;
    /** Формат значений «X из Y» */
    valueFormat?: ValueFormat;
    /** Доли предела: с какого заполнения предупреждать и тревожить */
    warning?: number;
    /** Доля предела, с которой — «исчерпан» */
    critical?: number;
    /** Подписи состояний */
    warningText?: string;
    /** Подпись критического уровня */
    criticalText?: string;
  }>(),
  { warning: 0.8, critical: 0.95, warningText: "Почти исчерпан", criticalText: "Лимит исчерпан" },
);

const id = useId();
const ratio = computed(() => (props.max > 0 ? Math.min(1, Math.max(0, props.value / props.max)) : 0));
const fill = useSpring(computed(() => [ratio.value]));
const level = computed(() =>
  ratio.value >= props.critical ? "critical" : ratio.value >= props.warning ? "warning" : "normal",
);
const fmt = (v: number) => formatValue(v, props.valueFormat ?? { maximumFractionDigits: 0 });
const valueText = computed(() => `${fmt(props.value)} из ${fmt(props.max)}`);
const statusText = computed(() =>
  level.value === "critical" ? props.criticalText : level.value === "warning" ? props.warningText : "",
);
</script>

<template>
  <div
    class="ui-meter"
    :data-level="level"
  >
    <div class="ui-meter__header">
      <span
        :id="`${id}-label`"
        class="ui-meter__label"
      >{{ label }}</span>
      <span class="ui-meter__value">{{ valueText }}</span>
    </div>
    <div
      class="ui-meter__track"
      role="meter"
      :aria-labelledby="`${id}-label`"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuetext="statusText ? `${valueText}. ${statusText}` : valueText"
    >
      <div
        class="ui-meter__fill"
        :style="{ transform: `scaleX(${fill[0] ?? ratio})` }"
      />
    </div>
    <p
      v-if="statusText"
      class="ui-meter__status"
      aria-hidden="true"
    >
      <CircleAlert v-if="level === 'critical'" />
      <TriangleAlert v-else />
      {{ statusText }}
    </p>
  </div>
</template>

<style scoped>
@layer components {
  .ui-meter {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
  }

  .ui-meter__header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .ui-meter__label {
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-label-md-font-family);
    font-weight: var(--type-label-md-font-weight);
    font-size: var(--type-label-md-font-size);
    line-height: var(--type-label-md-line-height);
  }

  .ui-meter__value {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-sm-font-family);
    font-size: var(--type-body-sm-font-size);
    line-height: var(--type-body-sm-line-height);
    font-variant-numeric: tabular-nums;
  }

  /* Дорожка — тонкая, скругление — как у конца столбца */
  .ui-meter__track {
    overflow: hidden;
    block-size: var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-chart-grid, GrayText);
  }

  .ui-meter__fill {
    block-size: 100%;
    border-radius: var(--radius-full);
    background: var(--color-chart-series-1, Highlight);
    transform-origin: left center;
  }

  .ui-meter[data-level="warning"] .ui-meter__fill {
    background: var(--color-chart-status-warning, Highlight);
  }

  .ui-meter[data-level="critical"] .ui-meter__fill {
    background: var(--color-chart-status-critical, Highlight);
  }

  .ui-meter__status {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin: 0;
    font-family: var(--type-body-sm-font-family);
    font-size: var(--type-body-sm-font-size);
    line-height: var(--type-body-sm-line-height);
    color: var(--color-status-warning, CanvasText);
  }

  .ui-meter[data-level="critical"] .ui-meter__status {
    color: var(--color-status-danger, CanvasText);
  }

  .ui-meter__status svg {
    flex: none;
    inline-size: var(--size-16);
    block-size: var(--size-16);
    stroke-width: var(--stroke-icon);
  }
}
</style>
