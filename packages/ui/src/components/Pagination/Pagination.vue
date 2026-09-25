<script setup lang="ts">
/**
 * Постраничная навигация (каталог, список заказов). Поведение и расчёт страниц — Reka UI Pagination:
 * первая/последняя всегда видны, между ними — «…». В Figma нет — токен-первый.
 *
 * - `hrefFor(page)` — страницы становятся ссылками (<a href>): каталог индексируется поисковиками и
 *   открывается в новой вкладке (SSG/Nuxt). Без него — кнопки и событие `update:page`.
 * - Кнопки 44×44 (зона касания), текущая — плашка акцента (surface/accent/default) и aria-current="page".
 * - На узком экране — `siblingCount` 0: «1 … 5 … 20» помещается в строку.
 */
import { computed } from "vue";
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from "reka-ui";
import { breakpoints } from "@uix/tokens";
import { useMediaQuery } from "../../composables/useMediaQuery";

const props = withDefaults(
  defineProps<{
    /** Всего элементов */
    total: number;
    /** Элементов на странице */
    pageSize?: number;
    /** Адрес страницы — страницы становятся ссылками */
    hrefFor?: (page: number) => string;
    /** Имя навигации для скринридера */
    label?: string;
    /** Доступное имя кнопки страницы; {n} — номер (по умолчанию у Reka — «Page N») */
    pageLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
  }>(),
  {
    pageSize: 20,
    label: "Страницы",
    pageLabel: "Страница {n}",
    prevLabel: "Предыдущая страница",
    nextLabel: "Следующая страница",
  },
);

/** Текущая страница, с 1 (v-model:page) */
const page = defineModel<number>("page", { default: 1 });

const isNarrow = useMediaQuery(`(width < ${breakpoints.m}px)`);
const siblings = computed(() => (isNarrow.value ? 0 : 1));
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const linkProps = (p: number) => (props.hrefFor ? { as: "a", href: props.hrefFor(p) } : {});
</script>

<template>
  <nav
    class="ui-pagination"
    :aria-label="label"
  >
    <PaginationRoot
      v-model:page="page"
      :total="total"
      :items-per-page="pageSize"
      :sibling-count="siblings"
      show-edges
    >
      <PaginationList
        v-slot="{ items }"
        class="ui-pagination__list"
      >
        <PaginationPrev
          class="ui-pagination__item"
          :aria-label="prevLabel"
          v-bind="page > 1 ? linkProps(page - 1) : {}"
        >
          <ChevronLeft aria-hidden="true" />
        </PaginationPrev>
        <template
          v-for="(item, index) in items"
          :key="index"
        >
          <PaginationListItem
            v-if="item.type === 'page'"
            class="ui-pagination__item"
            :value="item.value"
            :aria-label="pageLabel.replace('{n}', String(item.value))"
            :aria-current="item.value === page ? 'page' : undefined"
            v-bind="linkProps(item.value)"
          >
            {{ item.value }}
          </PaginationListItem>
          <PaginationEllipsis
            v-else
            class="ui-pagination__ellipsis"
            :index="index"
          >
            …
          </PaginationEllipsis>
        </template>
        <PaginationNext
          class="ui-pagination__item"
          :aria-label="nextLabel"
          v-bind="page < pages ? linkProps(page + 1) : {}"
        >
          <ChevronRight aria-hidden="true" />
        </PaginationNext>
      </PaginationList>
    </PaginationRoot>
  </nav>
</template>

<style scoped>
@layer components {
  .ui-pagination__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
  }

  .ui-pagination__item,
  .ui-pagination__ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--size-44);
    block-size: var(--size-44);
    padding-inline: var(--space-2);
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-primary, CanvasText);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
    font-variant-numeric: tabular-nums;
    text-decoration: none;
  }

  .ui-pagination__ellipsis {
    color: var(--color-text-tertiary, CanvasText);
  }

  .ui-pagination__item {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background-color var(--duration-fast) ease-out;
  }

  .ui-pagination__item:hover:not([data-selected], :disabled) {
    background: var(--surface-ghost-hover-bg, Canvas);
  }

  .ui-pagination__item[data-selected] {
    background: var(--surface-accent-default-bg, Highlight);
    color: var(--color-text-on-accent, HighlightText);
  }

  .ui-pagination__item:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-pagination__item:disabled {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-pagination__item > :deep(svg) {
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }
}
</style>
