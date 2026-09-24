<script setup lang="ts">
/**
 * Заголовок. Уровень (`level` → h1…h6, структура документа) и размер (`size` → стиль type/*)
 * независимы: визуально крупный h2 или скромный h1 — без поломки иерархии для скринридера.
 * hero — плавный 32 → 64px (первый экран), display/heading — стили Figma.
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** Уровень в структуре документа: h1…h6 */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Размер: hero (первый экран), display, lg, md, sm. По умолчанию — по уровню */
    size?: "hero" | "display" | "lg" | "md" | "sm";
  }>(),
  { level: 2 },
);

defineSlots<{ default: () => unknown }>();

const role = computed(() => {
  const size = props.size ?? (props.level === 1 ? "display" : props.level === 2 ? "lg" : props.level === 3 ? "md" : "sm");
  return size === "hero" ? "hero" : size === "display" ? "display" : `heading-${size}`;
});
</script>

<template>
  <component
    :is="`h${level}`"
    class="ui-heading"
    :style="{
      '--_family': `var(--type-${role}-font-family)`,
      '--_weight': `var(--type-${role}-font-weight)`,
      '--_size': `var(--type-${role}-font-size)`,
      '--_line': `var(--type-${role}-line-height)`,
    }"
  >
    <slot />
  </component>
</template>

<style scoped>
@layer components {
  .ui-heading {
    margin: 0;
    font-family: var(--_family);
    font-weight: var(--_weight);
    font-size: var(--_size);
    line-height: var(--_line);
    color: var(--color-text-primary, CanvasText);
    text-wrap: balance;
  }
}
</style>
