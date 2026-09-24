<script setup lang="ts">
/**
 * Бейдж — короткая метка статуса или категории («Новинка», «−20%», «В пути»).
 * Тон — color/badge/<tone>/{bg,fg}: тонированная плашка, текст ≥ 4.5:1 на ней в каждой схеме.
 * Не кнопка: для фильтров-«чипсов» нужен интерактивный компонент.
 */
withDefaults(
  defineProps<{
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  }>(),
  { tone: "neutral" },
);

defineSlots<{
  /** Текст бейджа */
  default: () => unknown;
  /** Иконка слева: 16×16 (Lucide) */
  start?: () => unknown;
}>();
</script>

<template>
  <span
    class="ui-badge"
    :data-tone="tone"
  >
    <span
      v-if="$slots.start"
      class="ui-badge__icon"
      aria-hidden="true"
    ><slot name="start" /></span>
    <slot />
  </span>
</template>

<style scoped>
@layer components {
  .ui-badge {
    --_bg: var(--color-badge-neutral-bg, Canvas);
    --_fg: var(--color-badge-neutral-fg, CanvasText);

    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    /* по содержимому, даже внутри растягивающего Stack */
    inline-size: fit-content;
    min-block-size: var(--size-24);
    padding-inline: var(--space-2);
    border-radius: var(--radius-full);
    background: var(--_bg);
    color: var(--_fg);
    font-family: var(--type-label-sm-font-family);
    font-weight: var(--type-label-sm-font-weight);
    font-size: var(--type-label-sm-font-size);
    line-height: var(--type-label-sm-line-height);
    white-space: nowrap;
  }

  .ui-badge[data-tone="accent"] {
    --_bg: var(--color-badge-accent-bg);
    --_fg: var(--color-badge-accent-fg);
  }

  .ui-badge[data-tone="success"] {
    --_bg: var(--color-badge-success-bg);
    --_fg: var(--color-badge-success-fg);
  }

  .ui-badge[data-tone="warning"] {
    --_bg: var(--color-badge-warning-bg);
    --_fg: var(--color-badge-warning-fg);
  }

  .ui-badge[data-tone="danger"] {
    --_bg: var(--color-badge-danger-bg);
    --_fg: var(--color-badge-danger-fg);
  }

  .ui-badge__icon {
    display: inline-flex;
    inline-size: var(--size-16);
    block-size: var(--size-16);
  }

  .ui-badge__icon > :deep(svg) {
    inline-size: 100%;
    block-size: 100%;
    stroke-width: var(--stroke-icon);
  }
}
</style>
