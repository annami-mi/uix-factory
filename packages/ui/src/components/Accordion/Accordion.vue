<script setup lang="ts">
/**
 * Аккордеон — раскрывающиеся разделы (FAQ, условия, характеристики товара).
 * Поведение — Reka UI Accordion: кнопки-заголовки с aria-expanded/aria-controls, стрелки/Home/End
 * между заголовками, панели связаны с заголовками. В Figma нет — токен-первый.
 *
 * - Заголовок — `headingLevel` (h2…h4) для структуры страницы; строка ≥ size/56 — зона касания.
 * - Раскрытие — высота на пружине (duration/press + easing/spring-press), при reduced motion — сразу.
 * - Содержимое: строка `content` или слот `#<value>` для разметки.
 */
import { ChevronDown } from "@lucide/vue";
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from "reka-ui";

export interface AccordionEntry {
  value: string;
  title: string;
  /** Текст раздела; для разметки — слот с именем value */
  content?: string;
  disabled?: boolean;
}

withDefaults(
  defineProps<{
    items: AccordionEntry[];
    /** single — открыт один раздел, multiple — несколько */
    type?: "single" | "multiple";
    /** Уровень заголовков разделов в структуре страницы */
    headingLevel?: 2 | 3 | 4;
  }>(),
  { type: "single", headingLevel: 3 },
);

/** Открытые разделы (v-model): value или массив value (multiple) */
const model = defineModel<string | string[]>();

defineSlots<Record<string, (props: { item: AccordionEntry }) => unknown>>();
</script>

<template>
  <AccordionRoot
    v-model="model"
    class="ui-accordion"
    :type="type"
    collapsible
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
      class="ui-accordion__item"
    >
      <AccordionHeader
        :as="`h${headingLevel}`"
        class="ui-accordion__header"
      >
        <AccordionTrigger class="ui-accordion__trigger">
          <span class="ui-accordion__title">{{ item.title }}</span>
          <ChevronDown
            class="ui-accordion__chevron"
            aria-hidden="true"
          />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="ui-accordion__content">
        <div class="ui-accordion__body">
          <slot
            :name="item.value"
            :item="item"
          >
            {{ item.content }}
          </slot>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<style scoped>
@layer components {
  .ui-accordion {
    display: grid;
  }

  .ui-accordion__item {
    border-block-end: var(--stroke-1) solid var(--color-divider, GrayText);
  }

  .ui-accordion__header {
    margin: 0;
  }

  .ui-accordion__trigger {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    inline-size: 100%;
    min-block-size: var(--size-56);
    padding: var(--space-4) 0;
    border: 0;
    border-radius: var(--radius-2);
    background: none;
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-heading-s-font-family);
    font-weight: var(--type-heading-s-font-weight);
    font-size: var(--type-heading-s-font-size);
    line-height: var(--type-heading-s-line-height);
    text-align: start;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .ui-accordion__trigger:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-accordion__trigger[data-disabled] {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-accordion__title {
    flex: 1;
    min-inline-size: 0;
  }

  .ui-accordion__chevron {
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    color: var(--color-icon-secondary, CanvasText);
    stroke-width: var(--stroke-icon);
    transition: rotate var(--duration-press) var(--easing-spring-press);
  }

  .ui-accordion__trigger[data-state="open"] .ui-accordion__chevron {
    rotate: 180deg;
  }

  .ui-accordion__content {
    overflow: hidden;
  }

  .ui-accordion__content[data-state="open"] {
    animation: ui-accordion-open var(--duration-press) var(--easing-spring-press);
  }

  .ui-accordion__content[data-state="closed"] {
    animation: ui-accordion-close var(--duration-normal) ease-in;
  }

  .ui-accordion__body {
    padding-block-end: var(--space-4);
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-m-font-family);
    font-weight: var(--type-body-m-font-weight);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
  }

  @keyframes ui-accordion-open {
    from {
      block-size: 0;
    }

    to {
      block-size: var(--reka-accordion-content-height);
    }
  }

  @keyframes ui-accordion-close {
    from {
      block-size: var(--reka-accordion-content-height);
    }

    to {
      block-size: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-accordion__content[data-state] {
      animation: none;
    }

    .ui-accordion__chevron {
      transition: none;
    }
  }
}
</style>
