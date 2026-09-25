<script setup lang="ts">
/**
 * Вкладки — сегментированный контрол в стиле Liquid Glass: дорожка-плашка и плашка активной вкладки,
 * которая перетекает на пружине. Поведение — Reka UI Tabs: роли tablist/tab/tabpanel, стрелки/Home/End,
 * активация по стрелкам. В Figma нет — токен-первый (surface/segmented/*).
 *
 * - `stretch` — вкладки делят ширину поровну (мобильный, 2–4 вкладки); иначе — по содержимому,
 *   лишнее прокручивается по горизонтали.
 * - Панель вкладки — слот с именем value.
 */
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

withDefaults(
  defineProps<{
    items: TabItem[];
    /** Доступное имя списка вкладок */
    label: string;
    /** Вкладки на всю ширину поровну */
    stretch?: boolean;
  }>(),
  { stretch: false },
);

/** Активная вкладка (v-model) */
const model = defineModel<string>();

defineSlots<Record<string, (props: { item: TabItem }) => unknown>>();
</script>

<template>
  <TabsRoot
    v-model="model"
    class="ui-tabs"
    :default-value="items[0]?.value"
  >
    <div class="ui-tabs__scroll">
      <TabsList
        class="ui-tabs__list"
        :aria-label="label"
        :data-stretch="stretch || undefined"
      >
        <TabsIndicator class="ui-tabs__indicator" />
        <TabsTrigger
          v-for="item in items"
          :key="item.value"
          :value="item.value"
          :disabled="item.disabled"
          class="ui-tabs__trigger"
        >
          {{ item.label }}
        </TabsTrigger>
      </TabsList>
    </div>
    <TabsContent
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      class="ui-tabs__panel"
    >
      <slot
        :name="item.value"
        :item="item"
      />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
@layer components {
  .ui-tabs {
    display: grid;
    gap: var(--space-4);
    min-inline-size: 0;
  }

  /* Много вкладок на узком экране — горизонтальная прокрутка без полосы */
  .ui-tabs__scroll {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ui-tabs__list {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    gap: var(--space-1);
    padding: var(--space-1);
    border-radius: var(--radius-full);
    background: var(--surface-segmented-track, Canvas);
  }

  .ui-tabs__list[data-stretch] {
    display: flex;
  }

  .ui-tabs__list[data-stretch] .ui-tabs__trigger {
    flex: 1;
  }

  /* Плашка активной вкладки — позиция и ширина от Reka, перетекает на пружине */
  .ui-tabs__indicator {
    position: absolute;
    inset-block: var(--space-1);
    inset-inline-start: 0;
    z-index: -1;
    inline-size: var(--reka-tabs-indicator-size);
    translate: var(--reka-tabs-indicator-position) 0;
    border: var(--stroke-1) solid var(--surface-segmented-indicator-border, transparent);
    border-radius: var(--radius-full);
    background: var(--surface-segmented-indicator, Canvas);
    box-shadow: var(--surface-segmented-indicator-shadow, none);
    transition:
      translate var(--duration-release) var(--easing-spring-release),
      inline-size var(--duration-release) var(--easing-spring-release);
  }

  .ui-tabs__trigger {
    flex: none;
    min-block-size: var(--size-40);
    padding-inline: var(--space-4);
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
    white-space: nowrap;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: color var(--duration-fast) ease-out;
  }

  .ui-tabs__trigger:hover:not([data-disabled]),
  .ui-tabs__trigger[data-state="active"] {
    color: var(--color-text-primary, CanvasText);
  }

  .ui-tabs__trigger:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  .ui-tabs__trigger[data-disabled] {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-tabs__panel {
    min-inline-size: 0;
    border-radius: var(--radius-2);
  }

  .ui-tabs__panel:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-tabs__indicator,
    .ui-tabs__trigger {
      transition: none;
    }
  }
}
</style>
