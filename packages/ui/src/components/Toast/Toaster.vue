<script setup lang="ts">
/**
 * Область уведомлений — ставится один раз в корневой layout. Показывает очередь из useToast().
 * Поведение — Reka UI Toast: объявление скринридером (danger — сразу, остальные — вежливо),
 * пауза таймера при наведении/фокусе, F8 — перейти к уведомлениям, смахивание вправо закрывает.
 *
 * Внизу по центру, шириной size/container/sm (на телефоне — во всю ширину с полями), с учётом safe-area.
 * Материал — surface/popover/*, время показа — duration/toast. В Figma нет — токен-первый.
 */
import { computed } from "vue";
import { CircleAlert, CircleCheck, Info, X } from "@lucide/vue";
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "reka-ui";
import { useToast } from "../../composables/useToast";
import { tokenNumber } from "../../utils/tokens";
import Button from "../Button/Button.vue";
import IconButton from "../IconButton/IconButton.vue";

withDefaults(
  defineProps<{
    /** Имя области уведомлений для скринридера; {hotkey} — сочетание клавиш */
    label?: string;
    /** Доступное имя кнопки закрытия */
    closeLabel?: string;
  }>(),
  { label: "Уведомления ({hotkey})", closeLabel: "Закрыть уведомление" },
);

const { toasts, remove } = useToast();
const duration = computed(() => tokenNumber("--duration-toast", 5000));
const icons = { neutral: Info, success: CircleCheck, danger: CircleAlert } as const;

/** Убрать из очереди после анимации закрытия (duration/normal), иначе она обрывается */
function onOpenChange(id: number, open: boolean) {
  if (!open) setTimeout(() => remove(id), tokenNumber("--duration-normal", 200));
}
</script>

<template>
  <ToastProvider
    :duration="duration"
    swipe-direction="right"
    :label="label"
  >
    <ToastRoot
      v-for="item in toasts"
      :key="item.id"
      class="ui-toast"
      :data-tone="item.tone ?? 'neutral'"
      :type="item.tone === 'danger' ? 'foreground' : 'background'"
      :duration="item.duration"
      :default-open="true"
      @update:open="onOpenChange(item.id, $event)"
    >
      <component
        :is="icons[item.tone ?? 'neutral']"
        class="ui-toast__icon"
        aria-hidden="true"
      />
      <div class="ui-toast__text">
        <ToastTitle class="ui-toast__title">
          {{ item.title }}
        </ToastTitle>
        <ToastDescription
          v-if="item.description"
          class="ui-toast__description"
        >
          {{ item.description }}
        </ToastDescription>
      </div>
      <ToastAction
        v-if="item.action"
        as-child
        :alt-text="item.action.altText"
      >
        <Button
          variant="ghost"
          @click="item.action.onClick"
        >
          {{ item.action.label }}
        </Button>
      </ToastAction>
      <ToastClose as-child>
        <IconButton
          :label="closeLabel"
          variant="ghost"
        >
          <X />
        </IconButton>
      </ToastClose>
    </ToastRoot>
    <ToastViewport class="ui-toast-viewport" />
  </ToastProvider>
</template>

<!-- Не scoped: уведомления рендерятся во viewport; классы уникальны (ui-toast*) -->
<style>
@layer components {
  .ui-toast-viewport {
    position: fixed;
    inset-inline: 0;
    inset-block-end: 0;
    z-index: var(--z-index-popover);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    box-sizing: border-box;
    inline-size: min(var(--size-container-sm) + 2 * var(--layout-gutter), 100%);
    margin: 0 auto;
    padding: var(--space-2) var(--layout-gutter) calc(var(--space-4) + env(safe-area-inset-bottom));
    list-style: none;
    outline: none;
  }

  .ui-toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-1) var(--space-1) var(--space-4);
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-6);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
  }

  .ui-toast__icon {
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    margin-block-start: calc((var(--size-48) - var(--size-20)) / 2);
    stroke-width: var(--stroke-icon);
    color: var(--color-icon-secondary, CanvasText);
  }

  .ui-toast[data-tone="success"] .ui-toast__icon {
    color: var(--color-badge-success-fg, CanvasText);
  }

  .ui-toast[data-tone="danger"] .ui-toast__icon {
    color: var(--color-text-danger, CanvasText);
  }

  .ui-toast__text {
    display: grid;
    flex: 1;
    gap: var(--space-px);
    min-inline-size: 0;
    padding-block: calc((var(--size-48) - var(--type-label-md-line-height)) / 2);
  }

  .ui-toast__title {
    font-family: var(--type-label-md-font-family);
    font-weight: var(--type-label-md-font-weight);
    font-size: var(--type-label-md-font-size);
    line-height: var(--type-label-md-line-height);
  }

  .ui-toast__description {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-md-font-family);
    font-weight: var(--type-body-md-font-weight);
    font-size: var(--type-body-md-font-size);
    line-height: var(--type-body-md-line-height);
  }

  /* Появление снизу на пружине, смахивание вправо — за пальцем */
  .ui-toast[data-state="open"] {
    animation: ui-toast-in var(--duration-release) var(--easing-spring-press);
  }

  .ui-toast[data-state="closed"] {
    animation: ui-toast-out var(--duration-normal) ease-in;
  }

  .ui-toast[data-swipe="move"] {
    translate: var(--reka-toast-swipe-move-x) 0;
  }

  .ui-toast[data-swipe="cancel"] {
    translate: 0 0;
    transition: translate var(--duration-normal) ease-out;
  }

  .ui-toast[data-swipe="end"] {
    animation: ui-toast-swipe-out var(--duration-normal) ease-out;
  }

  @keyframes ui-toast-in {
    from {
      opacity: 0;
      translate: 0 100%;
    }
  }

  @keyframes ui-toast-out {
    to {
      opacity: 0;
    }
  }

  @keyframes ui-toast-swipe-out {
    from {
      translate: var(--reka-toast-swipe-end-x) 0;
    }

    to {
      translate: 100% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-toast[data-state="open"] {
      animation: ui-toast-out var(--duration-normal) ease-out reverse;
    }
  }
}
</style>
