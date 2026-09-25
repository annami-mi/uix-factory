<script setup lang="ts">
/**
 * Флажок. В Figma нет — токен-first: нативный <input type="checkbox"> (семантика, клавиатура,
 * формы — из коробки), нарисованный как квадрат 24 со скруглением radius/2.
 *
 * - Вся строка (флажок + подпись) — зона касания ≥ size/44.
 * - Пустой флажок — плашка с обводкой: граница ≥ 3:1 к фону (WCAG 1.4.11), токены surface/control/*.
 * - Отмеченный — цвет акцента и галочка; `indeterminate` — черта.
 * - Нажатие — scale на пружине, как у Button; фокус с клавиатуры — кольцо color/state/focus.
 * - `description` и `error` связаны с флажком через aria-describedby; ошибка ставит aria-invalid.
 * Атрибуты (`name`, `value`, `required`) уходят на <input>, `class`/`style` — на корень.
 */
import { computed, useAttrs, useId } from "vue";
import { Check, Minus } from "@lucide/vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** Подпись справа от флажка (или слот по умолчанию) */
  label?: string;
  /** Пояснение под подписью */
  description?: string;
  /** Текст ошибки (напр. «Нужно согласие»): красит обводку, ставит aria-invalid */
  error?: string;
  disabled?: boolean;
  /** «Частично» — для «выбрать всё», когда выбрана часть */
  indeterminate?: boolean;
  /** Явный id; по умолчанию — сгенерированный */
  id?: string;
}>();

/** Отмечен ли (v-model) */
const model = defineModel<boolean>({ default: false });

defineSlots<{
  /** Подпись с разметкой (ссылка на условия и т.п.); вместо пропа `label` */
  default?: () => unknown;
}>();

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")),
);

const generatedId = useId();
const controlId = computed(() => props.id ?? generatedId);
const describedBy = computed(
  () =>
    [props.description && `${controlId.value}-description`, props.error && `${controlId.value}-error`]
      .filter(Boolean)
      .join(" ") || undefined,
);
</script>

<template>
  <div
    v-bind="rootAttrs"
    class="ui-checkbox"
    :data-invalid="error ? '' : undefined"
    :data-disabled="disabled || undefined"
  >
    <!-- Имя флажка — только подпись; описание вне <label>, связано через aria-describedby -->
    <div class="ui-checkbox__row">
      <span class="ui-checkbox__box-wrap">
        <input
          :id="controlId"
          v-model="model"
          v-bind="controlAttrs"
          type="checkbox"
          class="ui-checkbox__box"
          :indeterminate="indeterminate"
          :disabled="disabled"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="describedBy"
        >
        <Minus
          v-if="indeterminate"
          class="ui-checkbox__mark"
          aria-hidden="true"
        />
        <Check
          v-else-if="model"
          class="ui-checkbox__mark"
          aria-hidden="true"
        />
      </span>
      <span class="ui-checkbox__text">
        <label
          class="ui-checkbox__label"
          :for="controlId"
        ><slot>{{ label }}</slot></label>
        <span
          v-if="description"
          :id="`${controlId}-description`"
          class="ui-checkbox__description"
        >{{ description }}</span>
      </span>
    </div>
    <p
      v-if="error"
      :id="`${controlId}-error`"
      class="ui-checkbox__error"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
@layer components {
  .ui-checkbox {
    display: grid;
  }

  /* Строка — зона касания ≥ size/44; флажок и первая строка подписи на одной оси */
  .ui-checkbox__row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    min-block-size: var(--size-44);
    padding-block: calc((var(--size-44) - var(--size-24)) / 2);
    -webkit-tap-highlight-color: transparent;
  }

  .ui-checkbox__box,
  .ui-checkbox__label {
    cursor: pointer;
  }

  .ui-checkbox__box-wrap {
    position: relative;
    display: inline-flex;
    flex: none;
    inline-size: var(--size-24);
    block-size: var(--size-24);
    transition: scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-checkbox__box {
    appearance: none;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    border: var(--stroke-2) solid var(--surface-control-default-border, FieldText);
    border-radius: var(--radius-2);
    background: var(--surface-control-default-bg, Field);
    transition-property: background-color, border-color;
    transition-duration: var(--duration-fast);
    transition-timing-function: ease-out;
  }

  .ui-checkbox__row:hover .ui-checkbox__box:not(:disabled, :checked, :indeterminate) {
    border-color: var(--surface-control-hover-border, FieldText);
    background: var(--surface-control-hover-bg, Field);
  }

  .ui-checkbox__box:is(:checked, :indeterminate) {
    border-color: var(--surface-control-checked-border, Highlight);
    background: var(--surface-control-checked-bg, Highlight);
  }

  .ui-checkbox__box:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-checkbox[data-invalid] .ui-checkbox__box:not(:checked, :indeterminate) {
    border-color: var(--surface-control-error-border, FieldText);
  }

  /* Нажатие — как у Button: scale на пружине */
  .ui-checkbox:not([data-disabled]) .ui-checkbox__row:active .ui-checkbox__box-wrap {
    scale: var(--scale-pressed);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-checkbox__mark {
    position: absolute;
    inset: calc((var(--size-24) - var(--size-20)) / 2);
    inline-size: var(--size-20);
    block-size: var(--size-20);
    color: var(--surface-control-checked-mark, HighlightText);
    stroke-width: var(--stroke-3);
    pointer-events: none;
    animation: ui-checkbox-mark var(--duration-press) var(--easing-spring-press);
  }

  @keyframes ui-checkbox-mark {
    from {
      scale: 0;
    }
  }

  .ui-checkbox__text {
    display: grid;
    min-inline-size: 0;
  }

  .ui-checkbox__label {
    font-family: var(--type-body-m-font-family);
    font-weight: var(--type-body-m-font-weight);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
    color: var(--color-text-primary, CanvasText);
  }

  .ui-checkbox__description,
  .ui-checkbox__error {
    font-family: var(--type-body-xs-font-family);
    font-weight: var(--type-body-xs-font-weight);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
    color: var(--color-text-tertiary, CanvasText);
  }

  /* Ошибка — под подписью, по её левому краю */
  .ui-checkbox__error {
    margin: 0;
    padding-inline-start: calc(var(--size-24) + var(--space-3));
    color: var(--color-text-danger, CanvasText);
  }

  /* Disabled: неактивный флажок и текст */
  .ui-checkbox[data-disabled] :is(.ui-checkbox__box, .ui-checkbox__label) {
    cursor: not-allowed;
  }

  .ui-checkbox__box:disabled {
    border-color: var(--surface-control-disabled-border, GrayText);
    background: var(--surface-control-disabled-bg, Field);
  }

  .ui-checkbox[data-disabled] :is(.ui-checkbox__label, .ui-checkbox__description, .ui-checkbox__mark) {
    color: var(--color-text-disabled, GrayText);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-checkbox__box-wrap,
    .ui-checkbox:not([data-disabled]) .ui-checkbox__row:active .ui-checkbox__box-wrap {
      scale: none;
      transition: none;
    }

    .ui-checkbox__box {
      transition: none;
    }

    .ui-checkbox__mark {
      animation: none;
    }
  }
}
</style>
