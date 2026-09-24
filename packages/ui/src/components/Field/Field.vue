<script setup lang="ts">
/**
 * Оболочка поля ввода — капсула со слотами слева/справа и всеми состояниями.
 * Источник: Figma "field" (Inputs 149:723): 48px, padding space/4, gap space/3, иконки 24×24,
 * материал surface/field/*. Общая основа Input и (позже) Select: контрол внутри — любой элемент
 * с атрибутом `data-field-control` (нативный input, кнопка-триггер Select).
 *
 * Состояния: hover — :hover, focused — :focus-within, error/disabled/loading — пропсы.
 * Фокус: плашка surface/field/focused + кольцо surface/field/focused/ring — тема может сделать
 * его прозрачным (glass, neutral: фокус виден по плашке и курсору, как в Figma).
 * Loading показывает спиннер вместо правого слота (как в Figma).
 */
import { ref } from "vue";
import Spinner from "../Spinner/Spinner.vue";

const props = defineProps<{
  /** Ошибка: материал surface/field/error */
  invalid?: boolean;
  disabled?: boolean;
  /** Спиннер вместо правого слота */
  loading?: boolean;
  /** Контрол занимает всю капсулу и сам задаёт отступы (Select: кликабельна вся капсула) */
  flush?: boolean;
  /** Многострочный контрол (Textarea): скругление radius/6 вместо капсулы, выравнивание по верху */
  multiline?: boolean;
}>();

defineSlots<{
  /** Контрол (элемент с атрибутом `data-field-control`) */
  default: () => unknown;
  /** Слева: иконка 24×24 */
  start?: () => unknown;
  /** Справа: иконка или действие (очистить, шеврон Select). В loading заменяется спиннером */
  end?: () => unknown;
}>();

const root = ref<HTMLElement>();

/** Клик по капсуле мимо контрола (отступ, иконка) переводит фокус в контрол, как у нативного поля */
function onPointerDown(event: PointerEvent) {
  if (props.disabled) return;
  const target = event.target as HTMLElement;
  if (target.closest("[data-field-control], button, a, input, textarea, select")) return;
  const control = root.value?.querySelector<HTMLElement>("[data-field-control]");
  if (!control) return;
  event.preventDefault();
  control.focus();
}
</script>

<template>
  <div
    ref="root"
    class="ui-field"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
    :data-loading="loading || undefined"
    :data-flush="flush || undefined"
    :data-multiline="multiline || undefined"
    @pointerdown="onPointerDown"
  >
    <span
      v-if="$slots.start"
      class="ui-field__icon"
      aria-hidden="true"
    ><slot name="start" /></span>
    <slot />
    <span
      v-if="loading"
      class="ui-field__icon"
    ><Spinner /></span>
    <span
      v-else-if="$slots.end"
      class="ui-field__end"
    ><slot name="end" /></span>
  </div>
</template>

<style scoped>
@layer components {
  .ui-field {
    --_bg: var(--surface-field-default-bg, Field);
    --_border: var(--surface-field-default-border, FieldText);
    --_backdrop: var(--surface-field-default-backdrop, none);

    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-block-size: var(--size-48);
    padding-inline: var(--space-4);
    border: var(--stroke-1) solid var(--_border);
    border-radius: var(--radius-full);
    background: var(--_bg);
    backdrop-filter: var(--_backdrop);
    color: var(--color-text-primary, FieldText);
    cursor: text;
    transition-property: background-color, border-color;
    transition-duration: var(--duration-fast);
    transition-timing-function: ease-out;
  }

  .ui-field:hover {
    --_bg: var(--surface-field-hover-bg, Field);
    --_border: var(--surface-field-hover-border, FieldText);
    --_backdrop: var(--surface-field-hover-backdrop, none);
  }

  .ui-field:focus-within {
    --_bg: var(--surface-field-focused-bg, Field);
    --_border: var(--surface-field-focused-border, FieldText);
    --_backdrop: var(--surface-field-focused-backdrop, none);

    /* Кольцо фокуса поверх бордера, внутри капсулы; прозрачное кольцо проявляется в forced-colors */
    outline: var(--stroke-2) solid var(--surface-field-focused-ring, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  /* multiline: капсула не держит высокий текст — скругление radius/6, всё по верхнему краю.
     Отступ сверху/снизу = (size/48 − строка 24px) / 2, чтобы одна строка стояла как в однострочном поле */
  .ui-field[data-multiline] {
    align-items: flex-start;
    padding-block: var(--space-3);
    border-radius: var(--radius-6);
  }

  /* flush: отступы задаёт контрол; остальное (спиннер) — с отступом справа */
  .ui-field[data-flush] {
    gap: 0;
    padding-inline: 0;
  }

  .ui-field[data-flush] > :not([data-field-control]) {
    margin-inline-end: var(--space-4);
  }

  /* Ошибка сохраняет свой бордер и при hover/focus */
  .ui-field[data-invalid] {
    --_bg: var(--surface-field-error-bg, Field);
    --_border: var(--surface-field-error-border, FieldText);
    --_backdrop: var(--surface-field-error-backdrop, none);
  }

  /* Loading: поле активно (только чтение), значение должно читаться — secondary, не disabled
     (в Figma — text/disabled; отличие по контрасту, см. docs/figma-todo.md) */
  .ui-field[data-loading] {
    color: var(--color-text-secondary, FieldText);
  }

  .ui-field[data-disabled] {
    --_bg: var(--surface-field-disabled-bg, Field);
    --_border: var(--surface-field-disabled-border, GrayText);
    --_backdrop: var(--surface-field-disabled-backdrop, none);

    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-field__icon,
  .ui-field__end {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    color: var(--color-icon-secondary, FieldText);
  }

  .ui-field__icon {
    inline-size: var(--size-24);
    block-size: var(--size-24);
  }

  .ui-field[data-disabled] :is(.ui-field__icon, .ui-field__end) {
    color: var(--color-icon-disabled, GrayText);
  }

  .ui-field__icon > :deep(svg) {
    inline-size: 100%;
    block-size: 100%;
  }

  .ui-field :deep(svg) {
    stroke-width: var(--stroke-icon);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-field {
      transition: none;
    }
  }
}
</style>
