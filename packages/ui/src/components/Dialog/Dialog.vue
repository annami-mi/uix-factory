<script setup lang="ts">
/**
 * Модальный диалог: подтверждение, короткая форма, подробности.
 * Поведение — Reka UI Dialog: фокус внутри и возвращается на элемент, который открыл диалог,
 * Esc и тап по фону закрывают, скролл страницы заблокирован. В Figma нет — токен-первый.
 *
 * - Десктоп (≥ breakpoint/md) — окно по центру, появляется на пружине.
 * - Мобильный — шторка снизу (Sheet): до кнопок дотягивается большой палец.
 * `presentation` — `auto` (по ширине экрана) или явно `dialog` / `sheet`; до монтирования (SSR) — dialog.
 * Материал — surface/popover/*, затемнение — surface/scrim/*.
 */
import { computed } from "vue";
import { X } from "@lucide/vue";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { breakpoints } from "@uix/tokens";
import { useMediaQuery } from "../../composables/useMediaQuery";
import IconButton from "../IconButton/IconButton.vue";
import Sheet from "../Sheet/Sheet.vue";

const props = withDefaults(
  defineProps<{
    /** Заголовок — видимый и доступное имя диалога */
    title: string;
    /** Пояснение под заголовком (описание диалога) */
    description?: string;
    /** Ширина окна на десктопе: sm — size/container/sm, md — size/container/md */
    size?: "sm" | "md";
    /** Как показывать: по ширине экрана, окном по центру или шторкой */
    presentation?: "auto" | "dialog" | "sheet";
    /** Доступное имя кнопки закрытия */
    closeLabel?: string;
  }>(),
  { size: "sm", presentation: "auto", closeLabel: "Закрыть" },
);

/** Открыт ли диалог (v-model:open) */
const open = defineModel<boolean>("open", { default: false });

defineSlots<{
  /** Содержимое (прокручивается) */
  default: () => unknown;
  /** Действия внизу: «Отмена», «Сохранить» */
  footer?: () => unknown;
}>();

/**
 * Фокус при открытии — на само окно, а не на первую кнопку («Закрыть»): скринридер читает заголовок
 * и описание, кольцо фокуса не загорается на кнопке, которую никто не выбирал. Tab — дальше по окну.
 */
function onOpenAutoFocus(event: Event) {
  event.preventDefault();
  (document.querySelector(".ui-dialog[data-state='open']") as HTMLElement | null)?.focus();
}

const isNarrow = useMediaQuery(`(width < ${breakpoints.md}px)`);
const mode = computed(() =>
  props.presentation === "auto" ? (isNarrow.value ? "sheet" : "dialog") : props.presentation,
);
</script>

<template>
  <Sheet
    v-if="mode === 'sheet'"
    v-model:open="open"
    :title="title"
    :description="description"
    :close-label="closeLabel"
    closable
    initial-focus="container"
  >
    <slot />
    <template
      v-if="$slots.footer"
      #footer
    >
      <slot name="footer" />
    </template>
  </Sheet>

  <DialogRoot
    v-else
    v-model:open="open"
  >
    <DialogPortal>
      <DialogOverlay class="ui-dialog-overlay" />
      <DialogContent
        class="ui-dialog"
        :data-size="size"
        v-bind="description ? {} : { 'aria-describedby': undefined }"
        @open-auto-focus="onOpenAutoFocus"
      >
        <div class="ui-dialog__header">
          <div class="ui-dialog__heading">
            <DialogTitle class="ui-dialog__title">
              {{ title }}
            </DialogTitle>
            <DialogDescription
              v-if="description"
              class="ui-dialog__description"
            >
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose as-child>
            <IconButton
              :label="closeLabel"
              variant="ghost"
            >
              <X />
            </IconButton>
          </DialogClose>
        </div>
        <div class="ui-dialog__body">
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="ui-dialog__footer"
        >
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<!-- Не scoped: окно телепортируется в <body>; классы уникальны (ui-dialog*) -->
<style>
@layer components {
  .ui-dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-index-popover);
    background: var(--surface-scrim-bg, transparent);
    backdrop-filter: var(--surface-scrim-backdrop, none);
  }

  .ui-dialog {
    --_max: var(--size-container-sm);

    position: fixed;
    inset: 0;
    z-index: var(--z-index-popover);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    inline-size: min(var(--_max), 100% - 2 * var(--layout-gutter));
    block-size: fit-content;
    max-block-size: 85dvh;
    margin: auto;
    padding: var(--space-2) var(--space-2) var(--space-4);
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-8);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    outline: none;
  }

  .ui-dialog[data-size="md"] {
    --_max: var(--size-container-md);
  }

  .ui-dialog__header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: 0 0 var(--space-3) var(--space-4);
  }

  .ui-dialog__heading {
    display: grid;
    flex: 1;
    gap: var(--space-1);
    min-inline-size: 0;
    padding-block-start: calc((var(--size-48) - var(--type-heading-md-line-height)) / 2);
  }

  .ui-dialog__title {
    margin: 0;
    font-family: var(--type-heading-md-font-family);
    font-weight: var(--type-heading-md-font-weight);
    font-size: var(--type-heading-md-font-size);
    line-height: var(--type-heading-md-line-height);
  }

  .ui-dialog__description {
    margin: 0;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-md-font-family);
    font-weight: var(--type-body-md-font-weight);
    font-size: var(--type-body-md-font-size);
    line-height: var(--type-body-md-line-height);
  }

  .ui-dialog__body {
    min-block-size: 0;
    padding-inline: var(--space-4);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .ui-dialog__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-4) 0;
  }

  .ui-dialog[data-state="open"] {
    animation: ui-dialog-in var(--duration-press) var(--easing-spring-press);
  }

  .ui-dialog[data-state="closed"] {
    animation: ui-dialog-in var(--duration-fast) ease-in reverse;
  }

  .ui-dialog-overlay[data-state="open"] {
    animation: ui-dialog-fade var(--duration-normal) ease-out;
  }

  .ui-dialog-overlay[data-state="closed"] {
    animation: ui-dialog-fade var(--duration-normal) ease-in reverse;
  }

  @keyframes ui-dialog-in {
    from {
      opacity: 0;
      scale: var(--scale-popover-enter);
    }
  }

  @keyframes ui-dialog-fade {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-dialog[data-state] {
      animation-name: ui-dialog-fade;
    }
  }
}
</style>
