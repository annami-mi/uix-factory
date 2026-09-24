<script setup lang="ts">
/**
 * Меню действий по кнопке («…», профиль, «Сортировать»). Поведение — Reka UI DropdownMenu:
 * роль menu/menuitem, стрелки, typeahead, Esc возвращает фокус на кнопку. В Figma нет — токен-первый.
 *
 * - Пункты — массив `items`: действие (`item`), разделитель (`separator`), подпись группы (`label`).
 *   Выбор — событие `select` со значением пункта.
 * - Материал панели и вид пунктов — как у Select (surface/popover/*, surface/option/highlighted);
 *   опасное действие («Удалить») — color/text/danger.
 * - Кнопка открытия — слот (Button / IconButton): её доступное имя — имя меню.
 */
import { computed, type Component } from "vue";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "reka-ui";
import { tokenNumber } from "../../utils/tokens";

export type MenuEntry =
  | { type?: "item"; value: string; label: string; icon?: Component; danger?: boolean; disabled?: boolean }
  | { type: "separator" }
  | { type: "label"; label: string };

withDefaults(
  defineProps<{
    items: MenuEntry[];
    /** Выравнивание панели относительно кнопки */
    align?: "start" | "center" | "end";
  }>(),
  { align: "start" },
);

const emit = defineEmits<{
  /** Выбран пункт — значение `value` */
  select: [value: string];
}>();

defineSlots<{
  /** Кнопка открытия меню (Button, IconButton) */
  default: () => unknown;
}>();

const offset = computed(() => tokenNumber("--space-2", 8));
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        class="ui-menu"
        :align="align"
        :side-offset="offset"
        :collision-padding="offset"
      >
        <template
          v-for="(entry, index) in items"
          :key="entry.type === 'separator' ? `separator-${index}` : entry.type === 'label' ? `label-${index}` : entry.value"
        >
          <DropdownMenuSeparator
            v-if="entry.type === 'separator'"
            class="ui-menu__separator"
          />
          <DropdownMenuLabel
            v-else-if="entry.type === 'label'"
            class="ui-menu__label"
          >
            {{ entry.label }}
          </DropdownMenuLabel>
          <DropdownMenuItem
            v-else
            class="ui-menu__item"
            :data-danger="entry.danger || undefined"
            :disabled="entry.disabled"
            @select="emit('select', entry.value)"
          >
            <component
              :is="entry.icon"
              v-if="entry.icon"
              class="ui-menu__icon"
              aria-hidden="true"
            />
            {{ entry.label }}
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<!-- Не scoped: панель телепортируется в <body>; классы уникальны (ui-menu*) -->
<style>
@layer components {
  .ui-menu {
    z-index: var(--z-index-popover);
    box-sizing: border-box;
    display: grid;
    gap: var(--space-px);
    /* не уже 4 × size/48 — пункты с иконкой и текстом не жмутся */
    min-inline-size: calc(var(--size-48) * 4);
    max-block-size: var(--reka-dropdown-menu-content-available-height);
    padding: var(--space-1);
    overflow-y: auto;
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-6);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    transform-origin: var(--reka-dropdown-menu-content-transform-origin);
  }

  .ui-menu[data-state="open"] {
    animation: ui-menu-in var(--duration-press) var(--easing-spring-press);
  }

  .ui-menu[data-state="closed"] {
    animation: ui-menu-in var(--duration-fast) ease-in reverse;
  }

  @keyframes ui-menu-in {
    from {
      opacity: 0;
      scale: var(--scale-popover-enter);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-menu-in {
      from {
        opacity: 0;
      }
    }
  }

  .ui-menu__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-block-size: var(--size-44);
    padding-inline: var(--space-4);
    border-radius: var(--radius-full);
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    cursor: pointer;
    outline: none;
    user-select: none;
  }

  .ui-menu__item[data-highlighted] {
    background: var(--surface-option-highlighted-bg, Highlight);
  }

  .ui-menu__item[data-danger] {
    color: var(--color-text-danger, CanvasText);
  }

  .ui-menu__item[data-disabled] {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-menu__icon {
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }

  .ui-menu__separator {
    block-size: var(--stroke-1);
    margin-block: var(--space-1);
    background: var(--color-border-default, GrayText);
  }

  .ui-menu__label {
    padding: var(--space-2) var(--space-4) var(--space-1);
    color: var(--color-text-tertiary, CanvasText);
    font-family: var(--type-label-sm-font-family);
    font-weight: var(--type-label-sm-font-weight);
    font-size: var(--type-label-sm-font-size);
    line-height: var(--type-label-sm-line-height);
  }
}
</style>
