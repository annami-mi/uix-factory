<script setup lang="ts">
/**
 * Разделитель. По умолчанию декоративный (скрыт от скринридера); `semantic` — смысловая граница
 * разделов (role=separator). Цвет — color/border/default, толщина — stroke/1.
 */
withDefaults(
  defineProps<{
    orientation?: "horizontal" | "vertical";
    /** Смысловой разделитель (объявляется скринридером) */
    semantic?: boolean;
  }>(),
  { orientation: "horizontal", semantic: false },
);
</script>

<template>
  <hr
    class="ui-divider"
    :data-orientation="orientation"
    :role="semantic ? 'separator' : 'presentation'"
    :aria-orientation="semantic && orientation === 'vertical' ? 'vertical' : undefined"
    :aria-hidden="semantic ? undefined : 'true'"
  >
</template>

<style scoped>
@layer components {
  .ui-divider {
    flex: none;
    align-self: stretch;
    margin: 0;
    border: 0;
    border-block-start: var(--stroke-1) solid var(--color-divider, GrayText);
  }

  .ui-divider[data-orientation="vertical"] {
    border-block-start: 0;
    border-inline-start: var(--stroke-1) solid var(--color-divider, GrayText);
  }
}
</style>
