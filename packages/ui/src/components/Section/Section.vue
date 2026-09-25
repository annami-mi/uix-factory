<script setup lang="ts">
/**
 * Секция страницы: вертикальный ритм лендинга. Отступ сверху/снизу — layout/section (48 → 96px
 * плавно), внутри — Container. `tone="subtle"` — выделенная секция на плашке color/surface/subtle.
 * Для доступности дайте секции заголовок и свяжите его через aria-labelledby (атрибут уходит на <section>).
 */
import type { ContainerSize } from "../../types";
import Container from "../Container/Container.vue";

withDefaults(
  defineProps<{
    /** Ширина контейнера внутри */
    size?: ContainerSize;
    /** default — на фоне страницы, subtle — на плашке */
    tone?: "default" | "subtle";
    /** Тег: section, header, footer, aside */
    as?: string;
  }>(),
  { size: "l", tone: "default", as: "section" },
);

defineSlots<{ default: () => unknown }>();
</script>

<template>
  <component
    :is="as"
    class="ui-section"
    :data-tone="tone"
  >
    <Container :size="size">
      <slot />
    </Container>
  </component>
</template>

<style scoped>
@layer components {
  .ui-section {
    padding-block: var(--layout-section);
  }

  .ui-section[data-tone="subtle"] {
    background: var(--color-surface-subtle, transparent);
  }
}
</style>
