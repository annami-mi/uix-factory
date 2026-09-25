<script setup lang="ts">
/**
 * Подсказка графика: значения всех серий в точке. Значение — главное (крупно), подпись серии — вторична;
 * ключ серии — короткий штрих её цвета (у столбцов — квадрат). Текст — токены текста.
 * Декоративная для скринридера (aria-hidden): то же сообщает живой регион графика и табличный двойник.
 * Материал — surface/popover/*; позиция — `x` (px от левого края графика), по ширине не вылезает.
 */
export interface TooltipRow {
  key: string;
  label: string;
  value: string;
  color: string;
}

defineProps<{
  /** Заголовок: дата/категория точки */
  title: string;
  /** Строки: серия, значение, цвет */
  rows: TooltipRow[];
  /** Позиция перекрестья, px от левого края контейнера */
  x: number;
  /** Смещение сверху, px (горизонтальные столбцы — у строки) */
  y?: number;
  /** Ширина контейнера — чтобы подсказка не вылезала за край */
  containerWidth: number;
  /** Ключ серии: штрих (линии) или квадрат (столбцы) */
  shape?: "line" | "rect";
}>();
</script>

<template>
  <div
    class="ui-chart-tooltip"
    aria-hidden="true"
    :style="{
      '--_x': `${x}px`,
      '--_y': `${y ?? 0}px`,
      '--_flip': x > containerWidth / 2 ? 1 : 0,
    }"
  >
    <div class="ui-chart-tooltip__title">
      {{ title }}
    </div>
    <div
      v-for="row in rows"
      :key="row.key"
      class="ui-chart-tooltip__row"
    >
      <span
        class="ui-chart-tooltip__key"
        :data-shape="shape ?? 'line'"
        :style="{ background: row.color }"
      />
      <span class="ui-chart-tooltip__value">{{ row.value }}</span>
      <span class="ui-chart-tooltip__label">{{ row.label }}</span>
    </div>
  </div>
</template>

<style scoped>
@layer components {
  /* У точки: справа от перекрестья, в правой половине — слева от него (не вылезает за край) */
  .ui-chart-tooltip {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 1;
    display: grid;
    gap: var(--space-1);
    min-inline-size: calc(var(--size-48) * 3);
    padding: var(--space-2) var(--space-3);
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-3);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    pointer-events: none;
    translate: calc(var(--_x) + var(--space-3) - var(--_flip) * (100% + 2 * var(--space-3))) var(--_y);
    transition: translate var(--duration-press) var(--easing-spring-press);
  }

  .ui-chart-tooltip__title {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
  }

  .ui-chart-tooltip__row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    white-space: nowrap;
  }

  .ui-chart-tooltip__key {
    flex: none;
    inline-size: var(--space-3);
    block-size: var(--stroke-2);
    border-radius: var(--radius-full);
  }

  .ui-chart-tooltip__key[data-shape="rect"] {
    block-size: var(--space-3);
    border-radius: var(--radius-1);
  }

  /* Значение — главное: крупнее и ярче подписи */
  .ui-chart-tooltip__value {
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
    font-variant-numeric: tabular-nums;
  }

  .ui-chart-tooltip__label {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-xs-font-family);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-chart-tooltip {
      transition: none;
    }
  }
}
</style>
