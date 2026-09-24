<script setup lang="ts">
/**
 * Сообщение в потоке страницы: «Доставка задерживается», «Заказ оформлен», ошибка формы.
 * Тонированная плашка тона (color/badge/<tone>/bg), иконка тона, текст ≥ 4.5:1 на плашке.
 * В Figma нет — токен-первый.
 *
 * - Статичное сообщение — без роли (обычный контент). `live` — сообщение появилось в ответ
 *   на действие: danger/warning объявляются сразу (role=alert), остальные — вежливо (role=status).
 * - `dismissible` — кнопка «Закрыть», событие `dismiss` (скрывает родитель).
 * - Действия — слот `#actions` (Button variant="secondary"/"ghost").
 */
import { computed } from "vue";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "@lucide/vue";
import IconButton from "../IconButton/IconButton.vue";

const props = withDefaults(
  defineProps<{
    tone?: "neutral" | "info" | "success" | "warning" | "danger";
    /** Заголовок: коротко, что произошло */
    title?: string;
    /** Появилось в ответ на действие — объявить скринридером */
    live?: boolean;
    /** Кнопка «Закрыть» */
    dismissible?: boolean;
    /** Доступное имя кнопки закрытия */
    closeLabel?: string;
  }>(),
  { tone: "info", live: false, dismissible: false, closeLabel: "Закрыть" },
);

defineEmits<{
  /** Нажата кнопка «Закрыть» */
  dismiss: [];
}>();

defineSlots<{
  /** Текст сообщения */
  default?: () => unknown;
  /** Действия: «Повторить», «Подробнее» */
  actions?: () => unknown;
}>();

const icon = computed(
  () => ({ neutral: Info, info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert })[props.tone],
);
const role = computed(() =>
  props.live ? (props.tone === "danger" || props.tone === "warning" ? "alert" : "status") : undefined,
);
/** Токены тона: info использует акцентный тон бейджа */
const badgeTone = computed(() => (props.tone === "info" ? "accent" : props.tone));
</script>

<template>
  <div
    class="ui-alert"
    :role="role"
    :style="{ '--_bg': `var(--color-badge-${badgeTone}-bg)`, '--_icon': `var(--color-badge-${badgeTone}-fg)` }"
  >
    <component
      :is="icon"
      class="ui-alert__icon"
      aria-hidden="true"
    />
    <div class="ui-alert__content">
      <p
        v-if="title"
        class="ui-alert__title"
      >
        {{ title }}
      </p>
      <div
        v-if="$slots.default"
        class="ui-alert__text"
      >
        <slot />
      </div>
      <div
        v-if="$slots.actions"
        class="ui-alert__actions"
      >
        <slot name="actions" />
      </div>
    </div>
    <IconButton
      v-if="dismissible"
      class="ui-alert__close"
      :label="closeLabel"
      variant="ghost"
      @click="$emit('dismiss')"
    >
      <X />
    </IconButton>
  </div>
</template>

<style scoped>
@layer components {
  .ui-alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--radius-6);
    background: var(--_bg, Canvas);
    color: var(--color-text-primary, CanvasText);
  }

  .ui-alert__icon {
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    margin-block-start: calc((var(--type-body-lg-line-height) - var(--size-20)) / 2);
    color: var(--_icon, currentColor);
    stroke-width: var(--stroke-icon);
  }

  .ui-alert__content {
    display: grid;
    flex: 1;
    gap: var(--space-1);
    min-inline-size: 0;
  }

  .ui-alert__title {
    margin: 0;
    font-family: var(--type-label-lg-font-family);
    font-weight: var(--type-label-lg-font-weight);
    font-size: var(--type-label-lg-font-size);
    line-height: var(--type-body-lg-line-height);
  }

  .ui-alert__text {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-body-md-font-family);
    font-weight: var(--type-body-md-font-weight);
    font-size: var(--type-body-md-font-size);
    line-height: var(--type-body-md-line-height);
  }

  .ui-alert__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-block-start: var(--space-2);
  }

  /* Кнопка закрытия выходит в поле отступа, чтобы не раздувать высоту плашки */
  .ui-alert__close {
    margin: calc(-1 * var(--space-3)) calc(-1 * var(--space-3)) calc(-1 * var(--space-3)) 0;
  }
}
</style>
