<script setup lang="ts">
/**
 * Числовое поле со степпером «− число +» — количество товара, гостей, этажей.
 * Поведение — Reka UI NumberField: роль spinbutton, стрелки ↑/↓, PageUp/PageDown, ввод с клавиатуры,
 * min/max/step, формат числа по локали. В Figma нет — токен-первый.
 *
 * Собрано из FormField (подпись, подсказка/ошибка) + Field (flush: материал surface/field/*).
 * Кнопки − / + — ghost, 48×48 (зона касания); у предела — недоступны.
 */
import { computed, useAttrs } from "vue";
import { Minus, Plus } from "@lucide/vue";
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from "reka-ui";
import Field from "../Field/Field.vue";
import FormField from "../FormField/FormField.vue";

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    /** Текст ошибки: заменяет подсказку, ставит aria-invalid */
    error?: string;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    /** Имя в форме */
    name?: string;
    /** Формат: Intl.NumberFormat (напр. { style: "unit", unit: "kilogram" }) */
    formatOptions?: Intl.NumberFormatOptions;
    /** Локаль формата числа */
    locale?: string;
    decrementLabel?: string;
    incrementLabel?: string;
    id?: string;
  }>(),
  { step: 1, locale: "ru-RU", decrementLabel: "Уменьшить", incrementLabel: "Увеличить" },
);

/** Значение (v-model) */
const model = defineModel<number>();

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
</script>

<template>
  <FormField
    v-bind="rootAttrs"
    :id="id"
    class="ui-number-field"
    :label="label"
    :hint="hint"
    :error="error"
    :disabled="disabled"
  >
    <template #default="{ id: controlId, describedBy, invalid }">
      <NumberFieldRoot
        v-model="model"
        class="ui-number-field__root"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :name="name"
        :format-options="formatOptions"
        :locale="locale"
      >
        <Field
          flush
          :invalid="invalid"
          :disabled="disabled"
        >
          <NumberFieldDecrement
            class="ui-number-field__step"
            :aria-label="decrementLabel"
          >
            <Minus aria-hidden="true" />
          </NumberFieldDecrement>
          <NumberFieldInput
            :id="controlId"
            data-field-control
            class="ui-number-field__input"
            :aria-invalid="invalid || undefined"
            :aria-describedby="describedBy"
          />
          <NumberFieldIncrement
            class="ui-number-field__step"
            :aria-label="incrementLabel"
          >
            <Plus aria-hidden="true" />
          </NumberFieldIncrement>
        </Field>
      </NumberFieldRoot>
    </template>
  </FormField>
</template>

<style scoped>
@layer components {
  .ui-number-field__root {
    display: grid;
  }

  .ui-number-field__input {
    flex: 1;
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none; /* фокус показывает Field (:focus-within) */
    background: none;
    color: inherit;
    caret-color: var(--color-accent-default, currentColor);
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-label-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .ui-number-field__step {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    inline-size: var(--size-48);
    block-size: var(--size-48);
    margin-block: calc(-1 * var(--stroke-1));
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-icon-primary, CanvasText);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--duration-fast) ease-out,
      scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-number-field__step:hover:not(:disabled) {
    background: var(--surface-ghost-hover-bg, Canvas);
  }

  .ui-number-field__step:active:not(:disabled) {
    scale: var(--scale-pressed);
    background: var(--surface-ghost-pressed-bg, Canvas);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-number-field__step:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: calc(-1 * var(--stroke-2));
  }

  .ui-number-field__step:disabled {
    color: var(--color-icon-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-number-field__step > :deep(svg) {
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-number-field__step,
    .ui-number-field__step:active:not(:disabled) {
      scale: none;
      transition: none;
    }
  }
}
</style>
