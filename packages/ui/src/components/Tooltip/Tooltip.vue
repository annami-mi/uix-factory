<script setup lang="ts">
/**
 * Подсказка при наведении/фокусе. Поведение — Reka UI Tooltip: показывается по наведению и по фокусу
 * с клавиатуры, Esc прячет, контент связан с элементом через aria-describedby. В Figma нет — токен-первый.
 *
 * На сенсорных экранах подсказки нет — туда не кладём ничего важного: только уточнение к тому,
 * что уже понятно. Для кнопок-иконок имя всё равно задаётся `label` у IconButton.
 * Материал — surface/popover/*, задержка — duration/slower.
 */
import { computed } from "vue";
import { TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from "reka-ui";
import { tokenNumber } from "../../utils/tokens";

withDefaults(
  defineProps<{
    /** Текст подсказки */
    content: string;
    /** С какой стороны от элемента */
    side?: "top" | "right" | "bottom" | "left";
  }>(),
  { side: "top" },
);

defineSlots<{
  /** Элемент, к которому подсказка (кнопка, ссылка — фокусируемый) */
  default: () => unknown;
}>();

const delay = computed(() => tokenNumber("--duration-slower", 500));
const offset = computed(() => tokenNumber("--space-2", 8));
</script>

<template>
  <TooltipProvider :delay-duration="delay">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="ui-tooltip"
          :side="side"
          :side-offset="offset"
          :collision-padding="offset"
        >
          {{ content }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<!-- Не scoped: подсказка телепортируется в <body>; класс уникален (ui-tooltip) -->
<style>
@layer components {
  .ui-tooltip {
    z-index: var(--z-index-popover);
    max-inline-size: calc(var(--size-64) * 4);
    padding: var(--space-2) var(--space-3);
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-3);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-body-s-font-family);
    font-weight: var(--type-body-s-font-weight);
    font-size: var(--type-body-s-font-size);
    line-height: var(--type-body-s-line-height);
    transform-origin: var(--reka-tooltip-content-transform-origin);
  }

  .ui-tooltip[data-state="delayed-open"],
  .ui-tooltip[data-state="instant-open"] {
    animation: ui-tooltip-in var(--duration-press) var(--easing-spring-press);
  }

  @keyframes ui-tooltip-in {
    from {
      opacity: 0;
      scale: var(--scale-popover-enter);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-tooltip-in {
      from {
        opacity: 0;
      }
    }
  }
}
</style>
