<script setup lang="ts">
/**
 * Группа радиокнопок — выбор одного из немногих видимых вариантов (способ доставки, тариф).
 * В Figma нет — токен-первый, визуально — пара к Checkbox (токены surface/control/*).
 *
 * - Нативные <input type="radio"> в <fieldset>/<legend>: стрелки внутри группы, одна точка Tab,
 *   отправка формы — из коробки. `name` генерируется, если не задан.
 * - Круг size/24 с обводкой ≥ 3:1 к фону; выбранный — акцент и точка; строка — зона касания size/44.
 * - `hint`/`error` группы связаны с <fieldset> через aria-describedby; ошибка ставит aria-invalid.
 * - `variant="tiles"` — плитки-плашки вместо кружков (объём памяти, тариф, размер): короткие варианты,
 *   которые хочется сравнить взглядом; сетка от ширины контейнера (≥ size/grid-item/sm на плитку).
 * - Когда вариантов много (> 5–6) или нужен поиск — Select.
 */
import { computed, useId } from "vue";
import ChoiceTile from "../ChoiceTile/ChoiceTile.vue";

export interface RadioOption {
  value: string;
  label: string;
  /** Пояснение под подписью варианта */
  description?: string;
  disabled?: boolean;
}

const props = defineProps<{
  /** Подпись группы (legend) */
  label: string;
  /** Варианты */
  options: RadioOption[];
  /** Подсказка под группой */
  hint?: string;
  /** Текст ошибки: заменяет подсказку, красит обводку, ставит aria-invalid */
  error?: string;
  /** Вся группа недоступна */
  disabled?: boolean;
  /** Имя в форме; по умолчанию — сгенерированное */
  name?: string;
  /** Раскладка вариантов списка (у плиток — сетка по ширине) */
  orientation?: "vertical" | "horizontal";
  /** Список с кружками или плитки-плашки */
  variant?: "list" | "tiles";
}>();

/** Выбранное значение (v-model) */
const model = defineModel<string | undefined>();

const uid = useId();
const groupName = computed(() => props.name ?? `radio-${uid}`);
const messageId = `${uid}-message`;
const message = computed(() => props.error || props.hint);
</script>

<template>
  <fieldset
    class="ui-radio-group"
    :data-invalid="error ? '' : undefined"
    :data-disabled="disabled || undefined"
    :data-orientation="orientation ?? 'vertical'"
    :data-variant="variant ?? 'list'"
    :disabled="disabled"
    :aria-describedby="message ? messageId : undefined"
  >
    <legend class="ui-radio-group__legend">
      {{ label }}
    </legend>
    <div
      v-if="variant === 'tiles'"
      class="ui-radio-group__tiles"
    >
      <ChoiceTile
        v-for="option in options"
        :id="`${uid}-${option.value}`"
        :key="option.value"
        type="radio"
        :name="groupName"
        :value="option.value"
        :checked="model === option.value"
        :label="option.label"
        :description="option.description"
        :disabled="disabled || option.disabled"
        :invalid="!!error"
        @change="model = option.value"
      />
    </div>
    <div
      v-else
      class="ui-radio-group__options"
    >
      <div
        v-for="option in options"
        :key="option.value"
        class="ui-radio"
        :data-disabled="disabled || option.disabled || undefined"
      >
        <span class="ui-radio__circle-wrap">
          <input
            :id="`${uid}-${option.value}`"
            v-model="model"
            type="radio"
            class="ui-radio__circle"
            :name="groupName"
            :value="option.value"
            :disabled="option.disabled"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="option.description ? `${uid}-${option.value}-description` : undefined"
          >
          <span
            class="ui-radio__dot"
            aria-hidden="true"
          />
        </span>
        <span class="ui-radio__text">
          <label
            class="ui-radio__label"
            :for="`${uid}-${option.value}`"
          >{{ option.label }}</label>
          <span
            v-if="option.description"
            :id="`${uid}-${option.value}-description`"
            class="ui-radio__description"
          >{{ option.description }}</span>
        </span>
      </div>
    </div>
    <p
      v-if="message"
      :id="messageId"
      class="ui-radio-group__message"
    >
      {{ message }}
    </p>
  </fieldset>
</template>

<style scoped>
@layer components {
  .ui-radio-group {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .ui-radio-group__legend {
    padding: 0;
    margin-block-end: var(--space-2);
    font-family: var(--type-label-sm-font-family);
    font-weight: var(--type-label-sm-font-weight);
    font-size: var(--type-label-sm-font-size);
    line-height: var(--type-label-sm-line-height);
    color: var(--color-text-secondary, CanvasText);
  }

  .ui-radio-group__options {
    display: grid;
  }

  .ui-radio-group[data-orientation="horizontal"] .ui-radio-group__options {
    display: flex;
    flex-wrap: wrap;
    column-gap: var(--space-6);
  }

  /* Плитки: столько колонок, сколько влезает по size/grid-item/sm (на телефоне — две) */
  .ui-radio-group__tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-grid-item-sm)), 1fr));
    gap: var(--space-3);
  }

  .ui-radio-group__message {
    margin: 0;
    font-family: var(--type-body-sm-font-family);
    font-weight: var(--type-body-sm-font-weight);
    font-size: var(--type-body-sm-font-size);
    line-height: var(--type-body-sm-line-height);
    color: var(--color-text-tertiary, CanvasText);
  }

  .ui-radio-group[data-invalid] :is(.ui-radio-group__legend, .ui-radio-group__message) {
    color: var(--color-text-danger, CanvasText);
  }

  /* Вариант — строка с зоной касания ≥ size/44 */
  .ui-radio {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    min-block-size: var(--size-44);
    padding-block: calc((var(--size-44) - var(--size-24)) / 2);
    -webkit-tap-highlight-color: transparent;
  }

  .ui-radio__circle-wrap {
    position: relative;
    display: inline-flex;
    flex: none;
    inline-size: var(--size-24);
    block-size: var(--size-24);
    transition: scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-radio__circle {
    appearance: none;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    border: var(--stroke-2) solid var(--surface-control-default-border, FieldText);
    border-radius: var(--radius-full);
    background: var(--surface-control-default-bg, Field);
    cursor: pointer;
    transition-property: background-color, border-color;
    transition-duration: var(--duration-fast);
    transition-timing-function: ease-out;
  }

  .ui-radio:hover .ui-radio__circle:not(:disabled, :checked) {
    border-color: var(--surface-control-hover-border, FieldText);
    background: var(--surface-control-hover-bg, Field);
  }

  .ui-radio__circle:checked {
    border-color: var(--surface-control-checked-border, Highlight);
    background: var(--surface-control-checked-bg, Highlight);
  }

  .ui-radio__circle:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  .ui-radio-group[data-invalid] .ui-radio__circle:not(:checked) {
    border-color: var(--surface-control-error-border, FieldText);
  }

  /* Точка выбранного варианта: size/8 = space/2, появляется на пружине */
  .ui-radio__dot {
    position: absolute;
    inset: calc((var(--size-24) - var(--space-2)) / 2);
    border-radius: var(--radius-full);
    background: var(--surface-control-checked-mark, HighlightText);
    scale: 0;
    pointer-events: none;
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-radio__circle:checked + .ui-radio__dot {
    scale: 1;
  }

  .ui-radio:not([data-disabled]):active .ui-radio__circle-wrap {
    scale: var(--scale-pressed);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-radio__text {
    display: grid;
    min-inline-size: 0;
  }

  .ui-radio__label {
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    color: var(--color-text-primary, CanvasText);
    cursor: pointer;
  }

  .ui-radio__description {
    font-family: var(--type-body-sm-font-family);
    font-weight: var(--type-body-sm-font-weight);
    font-size: var(--type-body-sm-font-size);
    line-height: var(--type-body-sm-line-height);
    color: var(--color-text-tertiary, CanvasText);
  }

  /* Disabled — вся группа или отдельный вариант */
  .ui-radio__circle:disabled {
    border-color: var(--surface-control-disabled-border, GrayText);
    background: var(--surface-control-disabled-bg, Field);
    cursor: not-allowed;
  }

  .ui-radio__circle:disabled:checked + .ui-radio__dot {
    background: var(--color-text-disabled, GrayText);
  }

  .ui-radio[data-disabled] :is(.ui-radio__label, .ui-radio__description) {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-radio-group[data-disabled] .ui-radio-group__message {
    color: var(--color-text-disabled, GrayText);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-radio__circle-wrap,
    .ui-radio:not([data-disabled]):active .ui-radio__circle-wrap,
    .ui-radio__dot {
      scale: none;
      transition: none;
    }

    .ui-radio__dot {
      opacity: 0;
    }

    .ui-radio__circle:checked + .ui-radio__dot {
      opacity: 1;
    }

    .ui-radio__circle {
      transition: none;
    }
  }
}
</style>
