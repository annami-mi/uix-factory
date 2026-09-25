<script setup lang="ts">
/**
 * «Хлебные крошки» — путь к текущей странице (каталог → раздел → товар).
 * <nav aria-label> + <ol>; текущая страница — последний пункт, без ссылки, aria-current="page";
 * разделители декоративные. На узком экране строка переносится. В Figma нет — токен-первый.
 */
import type { Component } from "vue";
import { ChevronRight } from "@lucide/vue";

export interface Crumb {
  label: string;
  /** Адрес; у последнего (текущего) пункта не нужен */
  href?: string;
}

withDefaults(
  defineProps<{
    items: Crumb[];
    /** Имя навигации для скринридера */
    label?: string;
    /** Компонент ссылки: NuxtLink, RouterLink; по умолчанию <a> (href → `to` передаёт сам компонент) */
    linkAs?: string | Component;
  }>(),
  { label: "Навигационная цепочка", linkAs: "a" },
);
</script>

<template>
  <nav
    class="ui-breadcrumbs"
    :aria-label="label"
  >
    <ol class="ui-breadcrumbs__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="ui-breadcrumbs__item"
      >
        <span
          v-if="index === items.length - 1"
          class="ui-breadcrumbs__current"
          aria-current="page"
        >{{ item.label }}</span>
        <component
          :is="linkAs"
          v-else
          class="ui-breadcrumbs__link"
          :href="item.href"
          :to="typeof linkAs === 'string' ? undefined : item.href"
        >
          {{ item.label }}
        </component>
        <ChevronRight
          v-if="index < items.length - 1"
          class="ui-breadcrumbs__separator"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
@layer components {
  .ui-breadcrumbs__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--type-body-s-font-family);
    font-weight: var(--type-body-s-font-weight);
    font-size: var(--type-body-s-font-size);
    line-height: var(--type-body-s-line-height);
  }

  .ui-breadcrumbs__item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    margin-inline-end: var(--space-1);
  }

  .ui-breadcrumbs__link {
    border-radius: var(--radius-1);
    color: var(--color-text-secondary, LinkText);
    text-decoration-line: underline;
    text-decoration-color: transparent;
    text-decoration-thickness: var(--stroke-1);
    text-underline-offset: var(--space-1);
    transition: text-decoration-color var(--duration-fast) ease-out;
  }

  .ui-breadcrumbs__link:hover {
    color: var(--color-text-primary, LinkText);
    text-decoration-color: currentColor;
  }

  .ui-breadcrumbs__link:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-breadcrumbs__current {
    color: var(--color-text-primary, CanvasText);
  }

  .ui-breadcrumbs__separator {
    flex: none;
    inline-size: var(--size-16);
    block-size: var(--size-16);
    color: var(--color-icon-secondary, CanvasText);
    stroke-width: var(--stroke-icon);
  }
}
</style>
