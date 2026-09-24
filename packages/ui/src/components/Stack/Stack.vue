<script setup lang="ts">
/**
 * Стопка: элементы по вертикали или горизонтали с отступом из шкалы space/*.
 * Основной примитив раскладки внутри секций и карточек — вместо ручных margin.
 */
import { computed } from "vue";
import { space, type SpaceKey } from "../../types";

const props = withDefaults(
  defineProps<{
    /** vertical — столбец, horizontal — строка */
    direction?: "vertical" | "horizontal";
    /** Отступ между элементами — ключ шкалы space/* */
    gap?: SpaceKey;
    /** Выравнивание поперёк оси */
    align?: "start" | "center" | "end" | "stretch" | "baseline";
    /** Распределение вдоль оси */
    justify?: "start" | "center" | "end" | "between";
    /** Перенос строк (для horizontal) */
    wrap?: boolean;
    /** Тег: div, ul, nav… */
    as?: string;
  }>(),
  { direction: "vertical", gap: "4", align: "stretch", justify: "start", wrap: false, as: "div" },
);

defineSlots<{ default: () => unknown }>();

const style = computed(() => ({
  "--_gap": space(props.gap),
  "--_align": props.align === "start" || props.align === "end" ? `flex-${props.align}` : props.align,
  "--_justify": props.justify === "between" ? "space-between" : props.justify === "center" ? "center" : `flex-${props.justify}`,
}));
</script>

<template>
  <component
    :is="as"
    class="ui-stack"
    :data-direction="direction"
    :data-wrap="wrap || undefined"
    :style="style"
  >
    <slot />
  </component>
</template>

<style scoped>
@layer components {
  .ui-stack {
    display: flex;
    flex-direction: column;
    align-items: var(--_align);
    justify-content: var(--_justify);
    gap: var(--_gap);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ui-stack[data-direction="horizontal"] {
    flex-direction: row;
  }

  .ui-stack[data-wrap] {
    flex-wrap: wrap;
  }
}
</style>
