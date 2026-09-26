<script setup lang="ts">
/**
 * Мобильная таб-панель — форма навигации приложения на узком экране для любого варианта сайдбара
 * (референс — Apple HIG, Tab bar: до 5 разделов, иконка + подпись, внизу, над безопасной зоной).
 * Внутренний компонент паттернов: сам по себе не используется. Материал — стекло всплывающих
 * панелей (surface/popover/*): панель плавает над контентом.
 */
import type { Component } from "vue";
import type { NavItem } from "./types";

defineProps<{
  /** Разделы (до 5 — первые пункты навигации) */
  items: NavItem[];
  /** Активный раздел — aria-current="page" */
  current?: string;
  /** Доступное имя навигации */
  label: string;
  /** Компонент ссылки: NuxtLink, RouterLink или "a" */
  linkAs: string | Component;
}>();

const emit = defineEmits<{ navigate: [value: string] }>();
</script>

<template>
  <nav
    class="ui-tab-bar"
    :aria-label="label"
  >
    <ul class="ui-tab-bar__list">
      <li
        v-for="item in items"
        :key="item.value"
      >
        <component
          :is="item.href ? linkAs : 'button'"
          class="ui-tab-bar__item"
          :href="item.href"
          :to="item.href && typeof linkAs !== 'string' ? item.href : undefined"
          :type="item.href ? undefined : 'button'"
          :aria-current="item.value === current ? 'page' : undefined"
          @click="emit('navigate', item.value)"
        >
          <component
            :is="item.icon"
            class="ui-tab-bar__icon"
            aria-hidden="true"
          />
          <span class="ui-tab-bar__label">{{ item.label }}</span>
        </component>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
@layer components {
  .ui-tab-bar {
    position: fixed;
    inset-inline: var(--space-3);
    inset-block-end: calc(var(--space-3) + env(safe-area-inset-bottom));
    z-index: var(--z-index-popover);
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-full);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
  }

  .ui-tab-bar__list {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    margin: 0;
    padding: var(--space-1);
    list-style: none;
  }

  /* Пункт — зона касания size/56: иконка над подписью */
  .ui-tab-bar__item {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: var(--space-px);
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: var(--size-56);
    padding: 0;
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-secondary, CanvasText);
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-tab-bar__item:active {
    scale: var(--scale-pressed-surface);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-tab-bar__item:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  /* Активный раздел — цвет акцента и плашка под иконкой (не только цвет) */
  .ui-tab-bar__item[aria-current="page"] {
    color: var(--color-text-primary, CanvasText);
  }

  .ui-tab-bar__icon {
    inline-size: var(--size-24);
    block-size: var(--size-24);
    padding: var(--space-1) var(--space-3);
    box-sizing: content-box;
    border-radius: var(--radius-full);
    stroke-width: var(--stroke-icon);
    transition: background-color var(--duration-fast) ease-out;
  }

  .ui-tab-bar__item[aria-current="page"] .ui-tab-bar__icon {
    background: var(--surface-accent-default-bg, Highlight);
    color: var(--color-text-on-accent, HighlightText);
  }

  /* Длинная подпись — многоточием (полное название — доступное имя ссылки) */
  .ui-tab-bar__label {
    max-inline-size: 100%;
    padding-inline: var(--space-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-tab-bar__item,
    .ui-tab-bar__item:active {
      scale: none;
      transition: none;
    }
  }
}
</style>
