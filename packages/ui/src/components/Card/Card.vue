<script setup lang="ts">
/**
 * Карточка — плашка для группы контента (товар, преимущество, отзыв, тариф).
 * Материал — surface/card/* (в glass — Figma effect/glass/default), скругление radius/6.
 *
 * `as="a"` / `as="button"` (или NuxtLink) — вся карточка кликабельна: подсветка при наведении,
 * scale на пружине при нажатии (как Button), кольцо фокуса. Внутри кликабельной карточки не должно
 * быть других ссылок и кнопок.
 */
import type { Component } from "vue";

withDefaults(
  defineProps<{
    /** Тег/компонент: div, article, li, a, button, NuxtLink */
    as?: string | Component;
    /** Внутренний отступ: m — space/4 (мобильный), l — space/6 */
    padding?: "none" | "m" | "l";
  }>(),
  { as: "div", padding: "m" },
);

defineSlots<{ default: () => unknown }>();
</script>

<template>
  <component
    :is="as"
    class="ui-card"
    :data-padding="padding"
    :data-interactive="as === 'a' || as === 'button' || typeof as !== 'string' ? '' : undefined"
    :type="as === 'button' ? 'button' : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
@layer components {
  .ui-card {
    display: block;
    box-sizing: border-box;
    padding: var(--space-4);
    border: var(--stroke-1) solid var(--surface-card-border, transparent);
    border-radius: var(--radius-6);
    background: var(--surface-card-bg, Canvas);
    box-shadow: var(--surface-card-shadow, none);
    backdrop-filter: var(--surface-card-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    font: inherit;
    text-align: start;
    text-decoration: none;
  }

  .ui-card[data-padding="none"] {
    padding: 0;
    overflow: hidden;
  }

  .ui-card[data-padding="l"] {
    padding: var(--space-6);
  }

  /* Кликабельная карточка */
  .ui-card[data-interactive] {
    inline-size: 100%;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast) ease-out,
      scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-card[data-interactive]:hover {
    background: var(--surface-card-hover-bg, Canvas);
  }

  .ui-card[data-interactive]:active {
    /* карточка крупнее кнопки — лёгкое «вдавливание», а не рост, иначе задевает соседей */
    scale: var(--scale-pressed-surface);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-card[data-interactive]:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-card[data-interactive],
    .ui-card[data-interactive]:active {
      scale: none;
      transition: none;
    }
  }
}
</style>
