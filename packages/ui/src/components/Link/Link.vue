<script setup lang="ts">
/**
 * Текстовая ссылка. В Figma нет — токен-первый.
 *
 * - Цвет — color/text/link (≥ 4.5:1 на фоне и плашках в каждой схеме; акцент как текст
 *   на тёмном фоне не проходит), подчёркивание — ссылку можно отличить не только по цвету (WCAG 1.4.1).
 * - `as` — любой компонент ссылки (NuxtLink, RouterLink); по умолчанию <a>.
 * - `external` — новая вкладка (`target="_blank"`, `rel="noopener noreferrer"`), иконка ↗ и
 *   пояснение для скринридера.
 * Атрибуты (`href`, `to`, `download`…) уходят на ссылку.
 */
import type { Component } from "vue";
import { ArrowUpRight } from "@lucide/vue";

withDefaults(
  defineProps<{
    /** Тег или компонент ссылки: "a", NuxtLink, RouterLink */
    as?: string | Component;
    /** Внешняя ссылка: откроется в новой вкладке */
    external?: boolean;
    /** Текст для скринридера у внешней ссылки */
    externalLabel?: string;
  }>(),
  { as: "a", externalLabel: "(откроется в новой вкладке)" },
);

defineSlots<{
  /** Текст ссылки */
  default: () => unknown;
}>();
</script>

<template>
  <component
    :is="as"
    class="ui-link"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
  >
    <slot /><template v-if="external">
      <ArrowUpRight
        class="ui-link__external"
        aria-hidden="true"
      /><span class="ui-link__sr">{{ externalLabel }}</span>
    </template>
  </component>
</template>

<style scoped>
@layer components {
  .ui-link {
    color: var(--color-text-link, LinkText);
    text-decoration-line: underline;
    text-decoration-thickness: var(--stroke-1);
    text-underline-offset: var(--space-1);
    border-radius: var(--radius-1);
    cursor: pointer;
    transition: text-decoration-thickness var(--duration-fast) ease-out;
  }

  .ui-link:hover {
    text-decoration-thickness: var(--stroke-2);
  }

  .ui-link:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  /* Иконка — по высоте строки текста, не ломает перенос */
  .ui-link__external {
    display: inline-block;
    inline-size: 1em;
    block-size: 1em;
    margin-inline-start: var(--space-px);
    vertical-align: text-bottom;
    stroke-width: var(--stroke-icon);
  }

  .ui-link__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-link {
      transition: none;
    }
  }
}
</style>
