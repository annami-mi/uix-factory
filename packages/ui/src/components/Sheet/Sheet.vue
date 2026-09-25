<script setup lang="ts">
/**
 * Шторка снизу — модальная панель для мобильных (Select на узком экране, позже меню, фильтры).
 * Поведение — Reka UI Dialog: фокус внутри, Esc и тап по затемнению закрывают, фокус возвращается
 * на элемент, открывший шторку, скролл страницы блокируется.
 *
 * Токены: surface/popover/* (материал, как у всплывашки), surface/scrim/* (затемнение),
 * radius/sheet, пружина duration/press + easing/spring-press. Учитывает safe-area iPhone.
 * В Figma не нарисована (токен-first).
 */
import { X } from "@lucide/vue";
import { DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogRoot, DialogTitle } from "reka-ui";
import IconButton from "../IconButton/IconButton.vue";

const props = withDefaults(
  defineProps<{
    /** Заголовок шторки — видимый и доступное имя диалога */
    title: string;
    /** Пояснение под заголовком (описание диалога для скринридера) */
    description?: string;
    /** Кнопка «Закрыть» в шапке (для диалогов; у Select закрытие — выбор, Esc, тап по фону) */
    closable?: boolean;
    /** Доступное имя кнопки закрытия */
    closeLabel?: string;
    /**
     * Куда ставить фокус при открытии: first — первый фокусируемый элемент (список Select — сразу
     * стрелками), container — сама шторка (диалоги: скринридер читает заголовок, без кольца на «Закрыть»)
     */
    initialFocus?: "first" | "container";
  }>(),
  { closable: false, closeLabel: "Закрыть", initialFocus: "first" },
);

/** Фокус на саму шторку вместо первого элемента (initialFocus="container") */
function onOpenAutoFocus(event: Event) {
  if (props.initialFocus !== "container") return;
  event.preventDefault();
  (document.querySelector(".ui-sheet[data-state='open']") as HTMLElement | null)?.focus();
}

/** Открыта ли шторка (v-model:open) */
const open = defineModel<boolean>("open", { default: false });

defineSlots<{
  /** Содержимое шторки (прокручивается) */
  default: () => unknown;
  /** Действия внизу — закреплены, не уезжают при прокрутке */
  footer?: () => unknown;
}>();
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="ui-sheet-overlay" />
      <DialogContent
        class="ui-sheet"
        v-bind="description ? {} : { 'aria-describedby': undefined }"
        @open-auto-focus="onOpenAutoFocus"
      >
        <span
          class="ui-sheet__handle"
          aria-hidden="true"
        />
        <div
          class="ui-sheet__header"
          :data-closable="closable || undefined"
        >
          <div class="ui-sheet__heading">
            <DialogTitle class="ui-sheet__title">
              {{ title }}
            </DialogTitle>
            <DialogDescription
              v-if="description"
              class="ui-sheet__description"
            >
              {{ description }}
            </DialogDescription>
          </div>
          <DialogClose
            v-if="closable"
            as-child
          >
            <IconButton
              :label="closeLabel"
              variant="ghost"
            >
              <X />
            </IconButton>
          </DialogClose>
        </div>
        <div class="ui-sheet__body">
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="ui-sheet__footer"
        >
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<!-- Не scoped: содержимое телепортируется в <body>; классы уникальны (ui-sheet*) -->
<style>
@layer components {
  .ui-sheet-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-index-popover);
    background: var(--surface-scrim-bg, transparent);
    backdrop-filter: var(--surface-scrim-backdrop, none);
  }

  .ui-sheet {
    position: fixed;
    inset-inline: 0;
    inset-block-end: 0;
    z-index: var(--z-index-popover);
    display: flex;
    flex-direction: column;
    max-block-size: 85dvh;
    padding: var(--space-2) var(--space-2) calc(var(--space-2) + env(safe-area-inset-bottom));
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-block-end: 0;
    border-start-start-radius: var(--radius-sheet);
    border-start-end-radius: var(--radius-sheet);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    outline: none;
  }

  .ui-sheet__handle {
    flex: none;
    align-self: center;
    inline-size: var(--size-36);
    block-size: var(--space-1);
    margin-block-end: var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-border-strong, GrayText);
  }

  .ui-sheet__header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2) var(--space-3) var(--space-4);
  }

  .ui-sheet__heading {
    display: grid;
    flex: 1;
    gap: var(--space-1);
    min-inline-size: 0;
  }

  /* С кнопкой закрытия: первая строка заголовка — на оси кнопки (size/48) */
  .ui-sheet__header[data-closable] .ui-sheet__heading {
    padding-block-start: calc((var(--size-48) - var(--type-heading-s-line-height)) / 2);
  }

  .ui-sheet__description {
    margin: 0;
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-s-font-family);
    font-weight: var(--type-body-s-font-weight);
    font-size: var(--type-body-s-font-size);
    line-height: var(--type-body-s-line-height);
  }

  .ui-sheet__footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-2) 0;
  }

  .ui-sheet__footer > * {
    flex: 1 1 auto;
  }

  .ui-sheet__title {
    margin: 0;
    font-family: var(--type-heading-s-font-family);
    font-weight: var(--type-heading-s-font-weight);
    font-size: var(--type-heading-s-font-size);
    line-height: var(--type-heading-s-line-height);
  }

  .ui-sheet__body {
    min-block-size: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    /* Без скроллбара: шторка — мобильный паттерн, листают пальцем (прокрутка, клавиатура и колесо работают) */
    scrollbar-width: none;
  }

  /* Выезд снизу на пружине, уход — быстро; затемнение — плавно */
  .ui-sheet[data-state="open"] {
    animation: ui-sheet-in var(--duration-release) var(--easing-spring-press);
  }

  .ui-sheet[data-state="closed"] {
    animation: ui-sheet-out var(--duration-normal) ease-in;
  }

  .ui-sheet-overlay[data-state="open"] {
    animation: ui-sheet-fade-in var(--duration-normal) ease-out;
  }

  .ui-sheet-overlay[data-state="closed"] {
    animation: ui-sheet-fade-in var(--duration-normal) ease-in reverse;
  }

  @keyframes ui-sheet-in {
    from {
      translate: 0 100%;
    }
  }

  @keyframes ui-sheet-out {
    to {
      translate: 0 100%;
    }
  }

  @keyframes ui-sheet-fade-in {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-sheet[data-state] {
      animation-name: ui-sheet-fade-in;
      animation-timing-function: ease-out;
    }

    .ui-sheet[data-state="closed"] {
      animation-direction: reverse;
    }
  }
}
</style>
