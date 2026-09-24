<script setup lang="ts">
/**
 * Контейнер страницы: центрирует контент, ограничивает ширину, даёт поля по краям.
 * Ширина — size/container/{sm,md,lg} (или full), поля — layout/gutter (16 → 40px плавно, без media query).
 */
import type { ContainerSize } from "../../types";

withDefaults(
  defineProps<{
    /** Максимальная ширина: sm 640 (текст, формы), md 960, lg 1200 (лендинг), full — без ограничения */
    size?: ContainerSize;
    /** Тег */
    as?: string;
  }>(),
  { size: "lg", as: "div" },
);

defineSlots<{ default: () => unknown }>();
</script>

<template>
  <component
    :is="as"
    class="ui-container"
    :data-size="size"
  >
    <slot />
  </component>
</template>

<style scoped>
@layer components {
  .ui-container {
    --_max: var(--size-container-lg);

    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: calc(var(--_max) + 2 * var(--layout-gutter));
    margin-inline: auto;
    padding-inline: var(--layout-gutter);
  }

  .ui-container[data-size="sm"] {
    --_max: var(--size-container-sm);
  }

  .ui-container[data-size="md"] {
    --_max: var(--size-container-md);
  }

  .ui-container[data-size="full"] {
    max-inline-size: none;
  }
}
</style>
