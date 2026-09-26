<script setup lang="ts">
/**
 * Сайдбар-рельс — компактная навигация приложения: столбик круглых кнопок-иконок.
 * Референс: Client Dashboard (docs/reference-images/bento-contrast/04-client-dashboard.jpg) — рельс слева
 * на странице, круги-иконки, активный — чёрный круг; бренд сверху, поддержка внизу.
 *
 * - Неактивные — материал карточки (surface/card), активный — материал главной кнопки (surface/accent);
 *   подпись — подсказка справа (Tooltip) и доступное имя ссылки (aria-label).
 * - Контракт — общий с SidebarPanel (navigation/types.ts); на узком экране — мобильная таб-панель.
 */
import { computed } from "vue";
import Tooltip from "../../components/Tooltip/Tooltip.vue";
import NavTabBar from "../navigation/NavTabBar.vue";
import type { NavProps } from "../navigation/types";

const props = withDefaults(defineProps<NavProps>(), {
  label: "Основная навигация",
  linkAs: "a",
  tabBarItems: 5,
});

const emit = defineEmits<{
  /** Выбран пункт (для навигации без href или аналитики) */
  navigate: [value: string];
}>();

defineSlots<{
  /** Логотип сверху рельса */
  brand?: () => unknown;
  /** Служебные действия внизу */
  footer?: () => unknown;
}>();

const allItems = computed(() => props.groups.flatMap((g) => g.items));
const tabItems = computed(() => allItems.value.slice(0, props.tabBarItems));
</script>

<template>
  <nav
    class="ui-sidebar-rail"
    :aria-label="label"
  >
    <div
      v-if="$slots.brand"
      class="ui-sidebar-rail__brand"
    >
      <slot name="brand" />
    </div>
    <ul class="ui-sidebar-rail__list">
      <li
        v-for="item in allItems"
        :key="item.value"
      >
        <Tooltip
          :content="item.label"
          side="right"
        >
          <component
            :is="item.href ? linkAs : 'button'"
            class="ui-sidebar-rail__item"
            :href="item.href"
            :to="item.href && typeof linkAs !== 'string' ? item.href : undefined"
            :type="item.href ? undefined : 'button'"
            :aria-label="item.badge !== undefined ? `${item.label}, ${item.badge}` : item.label"
            :aria-current="item.value === current ? 'page' : undefined"
            @click="emit('navigate', item.value)"
          >
            <component
              :is="item.icon"
              class="ui-sidebar-rail__icon"
              aria-hidden="true"
            />
            <span
              v-if="item.badge !== undefined"
              class="ui-sidebar-rail__dot"
              aria-hidden="true"
            />
          </component>
        </Tooltip>
      </li>
    </ul>
    <div
      v-if="$slots.footer"
      class="ui-sidebar-rail__footer"
    >
      <slot name="footer" />
    </div>
  </nav>

  <NavTabBar
    class="ui-sidebar-rail__tab-bar"
    :items="tabItems"
    :current="current"
    :label="label"
    :link-as="linkAs"
    @navigate="emit('navigate', $event)"
  />
</template>

<style scoped>
@layer components {
  /* Mobile-first: на узком экране — таб-панель; с breakpoint/m (768px; в @media нельзя var()) — рельс */
  .ui-sidebar-rail {
    display: none;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    block-size: 100%;
    padding-block: var(--space-2);
  }

  @media (width >= 768px) {
    .ui-sidebar-rail {
      display: flex;
    }

    .ui-sidebar-rail__tab-bar {
      display: none;
    }
  }

  .ui-sidebar-rail__list {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ui-sidebar-rail__item {
    position: relative;
    display: grid;
    place-items: center;
    inline-size: var(--size-48);
    block-size: var(--size-48);
    padding: 0;
    border: var(--stroke-1) solid var(--surface-card-border, transparent);
    border-radius: var(--radius-full);
    background: var(--surface-card-bg, Canvas);
    box-shadow: var(--surface-card-shadow, none);
    backdrop-filter: var(--surface-card-backdrop, none);
    color: var(--color-icon-secondary, CanvasText);
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast) ease-out,
      scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-sidebar-rail__item:hover {
    background: var(--surface-card-hover-bg, Canvas);
    color: var(--color-icon-primary, CanvasText);
  }

  .ui-sidebar-rail__item:active {
    scale: var(--scale-pressed);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-sidebar-rail__item:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  /* Активный — материал главной кнопки (в bento — чёрный круг) */
  .ui-sidebar-rail__item[aria-current="page"] {
    border-color: var(--surface-accent-default-border, transparent);
    background: var(--surface-accent-default-bg, Highlight);
    color: var(--color-text-on-accent, HighlightText);
  }

  .ui-sidebar-rail__icon {
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }

  /* Есть новое — точка цвета spotlight (число — в aria-label и подсказке) */
  .ui-sidebar-rail__dot {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-end: var(--space-2);
    inline-size: var(--space-2);
    block-size: var(--space-2);
    border: var(--stroke-2) solid var(--surface-card-bg, Canvas);
    border-radius: var(--radius-full);
    background: var(--color-spotlight, Highlight);
  }

  .ui-sidebar-rail__footer {
    display: grid;
    gap: var(--space-2);
    margin-block-start: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-sidebar-rail__item,
    .ui-sidebar-rail__item:active {
      scale: none;
      transition: none;
    }
  }
}
</style>
