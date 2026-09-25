<script setup lang="ts">
/**
 * Подпись + подсказка/ошибка вокруг любого контрола формы (Input, позже Select, Textarea).
 * Источник: Figma "input"/"select" (Inputs 149:723): label (Figma label/s → код label/xs) — поле — hint (Figma body/s → код body/xs), gap space/2.
 *
 * Связывает контрол с подписью и описанием: отдаёт в слот `id`, `describedBy`, `invalid` —
 * контрол ставит их на себя (`id`, `aria-describedby`, `aria-invalid`). Ошибка заменяет подсказку
 * (в Figma error красит тот же hint).
 */
import { computed, useId } from "vue";

const props = defineProps<{
  /** Видимая подпись. Без неё контролу нужен `aria-label` */
  label?: string;
  /** Подсказка под полем */
  hint?: string;
  /** Текст ошибки: заменяет подсказку и переводит поле в invalid */
  error?: string;
  /** Состояние disabled (гасит подсказку) */
  disabled?: boolean;
  /** Явный id контрола; по умолчанию — сгенерированный */
  id?: string;
}>();

defineSlots<{
  /** Контрол формы; получает id и aria-атрибуты для связи с подписью и подсказкой */
  default: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => unknown;
  /** Справа от подсказки (напр. счётчик символов Textarea) */
  aside?: () => unknown;
}>();

const generatedId = useId();
const controlId = computed(() => props.id ?? generatedId);
const messageId = computed(() => `${controlId.value}-message`);
const message = computed(() => props.error || props.hint);
const invalid = computed(() => Boolean(props.error));
</script>

<template>
  <div
    class="ui-form-field"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
  >
    <label
      v-if="label"
      class="ui-form-field__label"
      :for="controlId"
    >{{ label }}</label>
    <slot
      :id="controlId"
      :described-by="message ? messageId : undefined"
      :invalid="invalid"
    />
    <div
      v-if="message || $slots.aside"
      class="ui-form-field__footer"
    >
      <p
        v-if="message"
        :id="messageId"
        class="ui-form-field__message"
      >
        {{ message }}
      </p>
      <span
        v-if="$slots.aside"
        class="ui-form-field__aside"
      ><slot name="aside" /></span>
    </div>
  </div>
</template>

<style scoped>
@layer components {
  .ui-form-field {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
  }

  .ui-form-field__label {
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
    color: var(--color-text-secondary, CanvasText);
  }

  .ui-form-field__footer {
    display: flex;
    gap: var(--space-3);
  }

  .ui-form-field__message {
    flex: 1;
    margin: 0;
    font-family: var(--type-body-xs-font-family);
    font-weight: var(--type-body-xs-font-weight);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
    color: var(--color-text-tertiary, CanvasText);
  }

  .ui-form-field__aside {
    flex: none;
    margin-inline-start: auto;
    font-family: var(--type-body-xs-font-family);
    font-weight: var(--type-body-xs-font-weight);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
    color: var(--color-text-tertiary, CanvasText);
    font-variant-numeric: tabular-nums;
  }

  /* Ошибка красит подпись и сообщение (Figma input/state=error) */
  .ui-form-field[data-invalid] :is(.ui-form-field__label, .ui-form-field__message) {
    color: var(--color-text-danger, CanvasText);
  }

  /* Disabled гасит только сообщение, подпись остаётся читаемой (Figma input/state=disabled) */
  .ui-form-field[data-disabled] .ui-form-field__message {
    color: var(--color-text-disabled, GrayText);
  }
}
</style>
