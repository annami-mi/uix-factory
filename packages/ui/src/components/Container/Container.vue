<script setup lang="ts">
/**
 * Контейнер страницы: центрирует контент, ограничивает ширину, даёт поля по краям.
 * Ширина — size/container/{s,m,l} (или full), поля — layout/gutter (16 → 40px плавно, без media query).
 */
import type { ContainerSize } from "../../types";

withDefaults(
  defineProps<{
    /** Максимальная ширина: s 640 (текст, формы), m 960, l 1200 (лендинг), full — без ограничения */
    size?: ContainerSize;
    /** Тег */
    as?: string;
  }>(),
  { size: "l", as: "div" },
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
    --_max: var(--size-container-l);

    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: calc(var(--_max) + 2 * var(--layout-gutter));
    margin-inline: auto;
    padding-inline: var(--layout-gutter);
  }

  .ui-container[data-size="s"] {
    --_max: var(--size-container-s);
  }

  .ui-container[data-size="m"] {
    --_max: var(--size-container-m);
  }

  .ui-container[data-size="full"] {
    max-inline-size: none;
  }
}
</style>
