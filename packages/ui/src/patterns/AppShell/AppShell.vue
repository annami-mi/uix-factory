<script setup lang="ts">
/**
 * Каркас приложения (SaaS): навигация + шапка + основной контент. Вариант навигации выбирает
 * composition root (ADR-0008, LookRecipe.appShell): в слот `nav` — SidebarPanel или SidebarRail.
 *
 * - Mobile-first: на узком экране навигация — плавающая таб-панель внизу (её рисует вариант сайдбара),
 *   каркас оставляет под неё место; с breakpoint/m — колонка слева, липкая, на всю высоту окна.
 * - Ссылка «Перейти к содержимому» — первый фокус на странице (клавиатура, скринридер).
 * - Это page shell: здесь допустимы @media по ширине окна (CLAUDE.md), компоненты внутри — на container queries.
 */
withDefaults(
  defineProps<{
    /** Подпись ссылки пропуска навигации */
    skipLabel?: string;
  }>(),
  { skipLabel: "Перейти к содержимому" },
);

defineSlots<{
  /** Навигация: SidebarPanel / SidebarRail */
  nav: () => unknown;
  /** Шапка над контентом: заголовок страницы, поиск, профиль */
  header?: () => unknown;
  /** Основной контент */
  default: () => unknown;
}>();
</script>

<template>
  <div class="ui-app-shell">
    <a
      class="ui-app-shell__skip"
      href="#ui-app-shell-main"
    >{{ skipLabel }}</a>
    <div class="ui-app-shell__nav">
      <slot name="nav" />
    </div>
    <div class="ui-app-shell__body">
      <header
        v-if="$slots.header"
        class="ui-app-shell__header"
      >
        <slot name="header" />
      </header>
      <main
        id="ui-app-shell-main"
        class="ui-app-shell__main"
        tabindex="-1"
      >
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
@layer components {
  /* Mobile-first: колонка контента; снизу — место под плавающую таб-панель (size/56 + отступы + safe area) */
  .ui-app-shell {
    min-block-size: 100dvh;
    padding: var(--space-3) var(--space-3) calc(var(--size-56) + var(--space-8) + env(safe-area-inset-bottom));
  }

  .ui-app-shell__body {
    display: grid;
    align-content: start;
    gap: var(--space-5);
    min-inline-size: 0;
  }

  .ui-app-shell__main:focus {
    outline: none;
  }

  .ui-app-shell__skip {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-start: var(--space-2);
    z-index: var(--z-index-popover);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--surface-accent-default-bg, Highlight);
    color: var(--color-text-on-accent, HighlightText);
    font-family: var(--type-label-m-font-family);
    font-weight: var(--type-label-m-font-weight);
    font-size: var(--type-label-m-font-size);
    line-height: var(--type-label-m-line-height);
    text-decoration: none;
    translate: 0 calc(-100% - var(--space-4));
  }

  .ui-app-shell__skip:focus-visible {
    translate: 0 0;
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  /* С breakpoint/m (768px; в @media нельзя var()): навигация — липкая колонка слева на всю высоту */
  @media (width >= 768px) {
    .ui-app-shell {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--space-5);
      padding: var(--space-3);
    }

    .ui-app-shell__nav {
      position: sticky;
      inset-block-start: var(--space-3);
      block-size: calc(100dvh - 2 * var(--space-3));
    }

    .ui-app-shell__body {
      padding-block: var(--space-3);
      padding-inline-end: var(--space-3);
    }
  }
}
</style>
