<script setup lang="ts">
/**
 * Сайдбар-панель — развёрнутая навигация приложения на тёмной скруглённой плашке.
 * Референс: Med.+ (docs/reference-images/bento-contrast/02-ehr-med.jpg) — чёрная панель, бренд сверху,
 * пункты «иконка в круге + подпись», активный — цветной круг, служебные действия внизу.
 *
 * - Материал — инвертированная плашка (surface/inverted/*): тёмная в светлой схеме, светлая в тёмной.
 *   Активный пункт — круг цвета spotlight проекта под иконкой и жирная подпись (не только цвет).
 * - Контракт — общий с SidebarRail (navigation/types.ts); на узком экране — мобильная таб-панель.
 * - Ссылки — `linkAs` (NuxtLink/RouterLink), `aria-current="page"` у активного; пункт без `href` — кнопка.
 */
import { computed } from "vue";
import Badge from "../../components/Badge/Badge.vue";
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
  /** Бренд/продукт сверху панели */
  brand?: () => unknown;
  /** Служебные действия внизу: настройки, выход */
  footer?: () => unknown;
}>();

const tabItems = computed(() => props.groups.flatMap((g) => g.items).slice(0, props.tabBarItems));
</script>

<template>
  <nav
    class="ui-sidebar-panel"
    :aria-label="label"
  >
    <div
      v-if="$slots.brand"
      class="ui-sidebar-panel__brand"
    >
      <slot name="brand" />
    </div>
    <div class="ui-sidebar-panel__groups">
      <section
        v-for="(group, gi) in groups"
        :key="gi"
        class="ui-sidebar-panel__group"
      >
        <p
          v-if="group.label"
          class="ui-sidebar-panel__group-label"
        >
          {{ group.label }}
        </p>
        <ul class="ui-sidebar-panel__list">
          <li
            v-for="item in group.items"
            :key="item.value"
          >
            <component
              :is="item.href ? linkAs : 'button'"
              class="ui-sidebar-panel__item"
              :href="item.href"
              :to="item.href && typeof linkAs !== 'string' ? item.href : undefined"
              :type="item.href ? undefined : 'button'"
              :aria-current="item.value === current ? 'page' : undefined"
              @click="emit('navigate', item.value)"
            >
              <span
                class="ui-sidebar-panel__icon"
                aria-hidden="true"
              ><component :is="item.icon" /></span>
              <span class="ui-sidebar-panel__label">{{ item.label }}</span>
              <Badge
                v-if="item.badge !== undefined"
                tone="spotlight"
              >
                {{ item.badge }}
              </Badge>
            </component>
          </li>
        </ul>
      </section>
    </div>
    <div
      v-if="$slots.footer"
      class="ui-sidebar-panel__footer"
    >
      <slot name="footer" />
    </div>
  </nav>

  <NavTabBar
    class="ui-sidebar-panel__tab-bar"
    :items="tabItems"
    :current="current"
    :label="label"
    :link-as="linkAs"
    @navigate="emit('navigate', $event)"
  />
</template>

<style scoped>
@layer components {
  /* Mobile-first: на узком экране — таб-панель; с breakpoint/m (768px; в @media нельзя var()) — панель */
  .ui-sidebar-panel {
    --color-text-primary: var(--color-inverted-text-primary);
    --color-text-secondary: var(--color-inverted-text-secondary);
    --color-text-tertiary: var(--color-inverted-text-tertiary);

    display: none;
    flex-direction: column;
    gap: var(--space-6);
    box-sizing: border-box;
    inline-size: var(--size-grid-item-m);
    block-size: 100%;
    padding: var(--space-4) var(--space-3);
    overflow-y: auto;
    border: var(--stroke-1) solid var(--surface-inverted-border, transparent);
    border-radius: var(--surface-card-radius, var(--radius-6));
    background: var(--surface-inverted-bg, CanvasText);
    color: var(--color-text-primary, Canvas);
    scrollbar-width: none;
  }

  @media (width >= 768px) {
    .ui-sidebar-panel {
      display: flex;
    }

    .ui-sidebar-panel__tab-bar {
      display: none;
    }
  }

  .ui-sidebar-panel__brand {
    padding-inline: var(--space-2);
  }

  .ui-sidebar-panel__groups {
    display: grid;
    gap: var(--space-5);
  }

  .ui-sidebar-panel__group {
    display: grid;
    gap: var(--space-1);
  }

  .ui-sidebar-panel__group-label {
    margin: 0;
    padding-inline: var(--space-3);
    color: var(--color-text-tertiary, Canvas);
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
  }

  .ui-sidebar-panel__list {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Пункт: круг с иконкой + подпись; зона касания — size/44 и больше */
  .ui-sidebar-panel__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    inline-size: 100%;
    min-block-size: var(--size-44);
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-secondary, Canvas);
    font-family: var(--type-label-m-font-family);
    font-weight: var(--type-body-m-font-weight);
    font-size: var(--type-label-m-font-size);
    line-height: var(--type-label-m-line-height);
    text-align: start;
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast) ease-out,
      scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-sidebar-panel__item:hover {
    background: var(--color-inverted-muted, transparent);
  }

  .ui-sidebar-panel__item:active {
    scale: var(--scale-pressed-surface);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-sidebar-panel__item:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-sidebar-panel__icon {
    display: grid;
    flex: none;
    place-items: center;
    inline-size: var(--size-36);
    block-size: var(--size-36);
    border-radius: var(--radius-full);
    transition: background-color var(--duration-fast) ease-out;
  }

  .ui-sidebar-panel__icon > :deep(svg) {
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }

  .ui-sidebar-panel__label {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Активный: круг цвета spotlight под иконкой, подпись ярче и жирнее */
  .ui-sidebar-panel__item[aria-current="page"] {
    color: var(--color-text-primary, Canvas);
    font-weight: var(--type-label-m-font-weight);
  }

  .ui-sidebar-panel__item[aria-current="page"] .ui-sidebar-panel__icon {
    background: var(--color-spotlight, Highlight);
    color: var(--color-on-spotlight, HighlightText);
  }

  .ui-sidebar-panel__footer {
    display: flex;
    gap: var(--space-2);
    margin-block-start: auto;
    padding-inline: var(--space-1);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-sidebar-panel__item,
    .ui-sidebar-panel__item:active {
      scale: none;
      transition: none;
    }
  }
}
</style>
