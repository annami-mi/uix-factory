<script setup lang="ts">
/**
 * Легенда: всегда при ≥ 2 сериях (идентичность не только цветом). Каждый пункт — кнопка-переключатель
 * (aria-pressed): скрыть/показать серию; последнюю видимую скрыть нельзя. Образец повторяет метку —
 * короткая линия у линий, прямоугольник у столбцов. Текст — токены текста, не цвет серии.
 */
export interface LegendItem {
  key: string;
  label: string;
  color: string;
  hidden?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** Серии: ключ, подпись, цвет, скрыта ли */
    items: LegendItem[];
    /** Форма образца: как метка графика */
    shape?: "line" | "rect";
  }>(),
  { shape: "line" },
);

const emit = defineEmits<{
  /** Переключить видимость серии */
  toggle: [key: string];
}>();

const visibleCount = () => props.items.filter((i) => !i.hidden).length;
</script>

<template>
  <ul class="ui-chart-legend">
    <li
      v-for="item in items"
      :key="item.key"
    >
      <button
        type="button"
        class="ui-chart-legend__item"
        :aria-pressed="!item.hidden"
        :aria-disabled="!item.hidden && visibleCount() === 1 ? 'true' : undefined"
        @click="!(!item.hidden && visibleCount() === 1) && emit('toggle', item.key)"
      >
        <span
          class="ui-chart-legend__swatch"
          :data-shape="shape"
          :style="{ '--_color': item.color }"
          aria-hidden="true"
        />
        {{ item.label }}
      </button>
    </li>
  </ul>
</template>

<style scoped>
@layer components {
  .ui-chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ui-chart-legend__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--size-32);
    padding-inline: var(--space-2);
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-md-font-family);
    font-weight: var(--type-body-md-font-weight);
    font-size: var(--type-body-md-font-size);
    line-height: var(--type-body-md-line-height);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast) ease-out,
      opacity var(--duration-fast) ease-out;
  }

  /* Зона касания — size/44 при визуальной высоте size/32 */
  .ui-chart-legend__item::after {
    content: "";
    position: absolute;
    inset: calc((var(--size-32) - var(--size-44)) / 2) 0;
  }

  .ui-chart-legend__item:hover {
    background: var(--surface-ghost-hover-bg, Canvas);
  }

  .ui-chart-legend__item:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  /* Скрытая серия: образец пустой, текст приглушён (не только цвет — ещё и форма образца) */
  .ui-chart-legend__item[aria-pressed="false"] {
    color: var(--color-text-tertiary, GrayText);
  }

  .ui-chart-legend__item[aria-disabled="true"] {
    cursor: default;
  }

  .ui-chart-legend__swatch {
    flex: none;
    inline-size: var(--space-4);
    block-size: var(--stroke-2);
    border-radius: var(--radius-full);
    background: var(--_color);
  }

  .ui-chart-legend__swatch[data-shape="rect"] {
    inline-size: var(--space-3);
    block-size: var(--space-3);
    border-radius: var(--radius-1);
  }

  .ui-chart-legend__item[aria-pressed="false"] .ui-chart-legend__swatch {
    background: none;
    box-shadow: inset 0 0 0 var(--stroke-1) var(--_color);
  }
}
</style>
