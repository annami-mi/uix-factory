<script setup lang="ts">
/**
 * Текст. Размер — стиль type/body/* (или caption), цвет — роль color/text/* (все ≥ 4.5:1 в каждой схеме).
 * Для подписей к полям — FormField, для заголовков — Heading.
 */
withDefaults(
  defineProps<{
    /** lg 16/24 (основной на мобильном), md 14/20, sm 12/16, caption 11/14 */
    size?: "lg" | "md" | "sm" | "caption";
    /** Цвет: primary, secondary (пояснения), tertiary (мета), danger */
    tone?: "primary" | "secondary" | "tertiary" | "danger";
    /** Тег: p, span, div, li… */
    as?: string;
  }>(),
  { size: "lg", tone: "primary", as: "p" },
);

defineSlots<{ default: () => unknown }>();
</script>

<template>
  <component
    :is="as"
    class="ui-text"
    :data-size="size"
    :data-tone="tone"
  >
    <slot />
  </component>
</template>

<style scoped>
@layer components {
  .ui-text {
    margin: 0;
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    color: var(--color-text-primary, CanvasText);
    text-wrap: pretty;
  }

  .ui-text[data-size="md"] {
    font-size: var(--type-body-md-font-size);
    line-height: var(--type-body-md-line-height);
  }

  .ui-text[data-size="sm"] {
    font-size: var(--type-body-sm-font-size);
    line-height: var(--type-body-sm-line-height);
  }

  .ui-text[data-size="caption"] {
    font-size: var(--type-caption-font-size);
    line-height: var(--type-caption-line-height);
  }

  .ui-text[data-tone="secondary"] {
    color: var(--color-text-secondary, CanvasText);
  }

  .ui-text[data-tone="tertiary"] {
    color: var(--color-text-tertiary, CanvasText);
  }

  .ui-text[data-tone="danger"] {
    color: var(--color-text-danger, CanvasText);
  }
}
</style>
