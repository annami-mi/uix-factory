<script setup lang="ts">
/**
 * Сетка карточек: число колонок подбирается по ширине контейнера (auto-fit), без media query —
 * на телефоне 1 колонка, дальше сколько помещается при минимальной ширине ячейки size/grid-item/*.
 * Для раскладки «строго N колонок» задайте `columns` — они тоже ужимаются, если места не хватает.
 */
import { computed } from "vue";
import { space, type SpaceKey } from "../../types";

const props = withDefaults(
  defineProps<{
    /** Минимальная ширина ячейки: s 160 (логотипы), m 260 (карточки), l 340 (крупные карточки) */
    min?: "s" | "m" | "l";
    /** Максимум колонок (ограничивает auto-fit на широком экране) */
    columns?: number;
    /** Отступ между ячейками — ключ шкалы space/* */
    gap?: SpaceKey;
    /** Тег: div, ul… */
    as?: string;
  }>(),
  { min: "m", gap: "4", as: "div" },
);

defineSlots<{ default: () => unknown }>();

const style = computed(() => ({
  "--_min": `var(--size-grid-item-${props.min})`,
  "--_gap": space(props.gap),
  ...(props.columns ? { "--_columns": String(props.columns) } : {}),
}));
</script>

<template>
  <component
    :is="as"
    class="ui-grid"
    :data-columns="columns ? '' : undefined"
    :style="style"
  >
    <slot />
  </component>
</template>

<style scoped>
@layer components {
  .ui-grid {
    display: grid;
    gap: var(--_gap);
    /* min(…, 100%) — на экране уже min ячейка не вылезает за контейнер */
    grid-template-columns: repeat(auto-fit, minmax(min(var(--_min), 100%), 1fr));
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Не больше N колонок: ячейка не уже (100% − зазоры) / N */
  .ui-grid[data-columns] {
    grid-template-columns: repeat(
      auto-fit,
      minmax(max(min(var(--_min), 100%), (100% - (var(--_columns) - 1) * var(--_gap)) / var(--_columns)), 1fr)
    );
  }
}
</style>
