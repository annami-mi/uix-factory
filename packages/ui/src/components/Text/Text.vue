<script setup lang="ts">
/**
 * Текст. Размер — стиль type/body/* (или caption), цвет — роль color/text/* (все ≥ 4.5:1 в каждой схеме).
 * Для подписей к полям — FormField, для заголовков — Heading.
 */
withDefaults(
  defineProps<{
    /** l 18/28 (лид), m 16/24 (основной, по умолчанию), s 14/20 (вторичный), xs 12/16, caption 11/14 */
    size?: "l" | "m" | "s" | "xs" | "caption";
    /** Цвет: primary, secondary (пояснения), tertiary (мета), danger */
    tone?: "primary" | "secondary" | "tertiary" | "danger";
    /** Тег: p, span, div, li… */
    as?: string;
  }>(),
  { size: "m", tone: "primary", as: "p" },
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
    font-family: var(--type-body-m-font-family);
    font-weight: var(--type-body-m-font-weight);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
    color: var(--color-text-primary, CanvasText);
    text-wrap: pretty;
  }

  .ui-text[data-size="l"] {
    font-size: var(--type-body-l-font-size);
    line-height: var(--type-body-l-line-height);
  }

  .ui-text[data-size="s"] {
    font-size: var(--type-body-s-font-size);
    line-height: var(--type-body-s-line-height);
  }

  .ui-text[data-size="xs"] {
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
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
