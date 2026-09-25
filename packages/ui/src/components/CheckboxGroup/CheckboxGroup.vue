<script setup lang="ts">
/**
 * Группа флажков — выбор нескольких вариантов (опции товара, интересы, каналы уведомлений).
 * Пара к RadioGroup: <fieldset>/<legend>, `hint`/`error` группы — через aria-describedby.
 *
 * - `variant="list"` — флажки Checkbox строками; `variant="tiles"` — плитки-плашки (как у RadioGroup):
 *   выбранные — кольцо и галочка в углу. Сетка от ширины контейнера.
 * - Значение — массив выбранных `value` в порядке опций (не в порядке кликов).
 */
import { computed, useId } from "vue";
import Checkbox from "../Checkbox/Checkbox.vue";
import ChoiceTile from "../ChoiceTile/ChoiceTile.vue";

export interface CheckboxOption {
  value: string;
  label: string;
  /** Пояснение под подписью варианта */
  description?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** Подпись группы (legend) */
    label: string;
    /** Варианты */
    options: CheckboxOption[];
    /** Подсказка под группой */
    hint?: string;
    /** Текст ошибки: заменяет подсказку, ставит aria-invalid */
    error?: string;
    /** Вся группа недоступна */
    disabled?: boolean;
    /** Имя в форме (одно на все флажки) */
    name?: string;
    /** Список флажков или плитки-плашки */
    variant?: "list" | "tiles";
  }>(),
  { variant: "list" },
);

/** Выбранные значения (v-model) */
const model = defineModel<string[]>({ default: () => [] });

const uid = useId();
const messageId = `${uid}-message`;
const message = computed(() => props.error || props.hint);
const selected = computed(() => new Set(model.value));

function toggle(value: string, checked: boolean) {
  const next = new Set(model.value);
  if (checked) next.add(value);
  else next.delete(value);
  model.value = props.options.map((o) => o.value).filter((v) => next.has(v));
}
</script>

<template>
  <fieldset
    class="ui-checkbox-group"
    :data-invalid="error ? '' : undefined"
    :data-disabled="disabled || undefined"
    :disabled="disabled"
    :aria-describedby="message ? messageId : undefined"
  >
    <legend class="ui-checkbox-group__legend">
      {{ label }}
    </legend>
    <div
      v-if="variant === 'tiles'"
      class="ui-checkbox-group__tiles"
    >
      <ChoiceTile
        v-for="option in options"
        :id="`${uid}-${option.value}`"
        :key="option.value"
        type="checkbox"
        :name="name"
        :value="option.value"
        :checked="selected.has(option.value)"
        :label="option.label"
        :description="option.description"
        :disabled="disabled || option.disabled"
        :invalid="!!error"
        @change="(checked: boolean) => toggle(option.value, checked)"
      />
    </div>
    <div
      v-else
      class="ui-checkbox-group__options"
    >
      <Checkbox
        v-for="option in options"
        :id="`${uid}-${option.value}`"
        :key="option.value"
        :model-value="selected.has(option.value)"
        :label="option.label"
        :description="option.description"
        :disabled="disabled || option.disabled"
        :name="name"
        :value="option.value"
        :aria-invalid="error ? 'true' : undefined"
        @update:model-value="(checked: boolean) => toggle(option.value, checked)"
      />
    </div>
    <p
      v-if="message"
      :id="messageId"
      class="ui-checkbox-group__message"
    >
      {{ message }}
    </p>
  </fieldset>
</template>

<style scoped>
@layer components {
  .ui-checkbox-group {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  .ui-checkbox-group__legend {
    padding: 0;
    margin-block-end: var(--space-2);
    font-family: var(--type-label-xs-font-family);
    font-weight: var(--type-label-xs-font-weight);
    font-size: var(--type-label-xs-font-size);
    line-height: var(--type-label-xs-line-height);
    color: var(--color-text-secondary, CanvasText);
  }

  .ui-checkbox-group__options {
    display: grid;
  }

  /* Плитки: столько колонок, сколько влезает по size/grid-item/s (на телефоне — две) */
  .ui-checkbox-group__tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--size-grid-item-s)), 1fr));
    gap: var(--space-3);
  }

  .ui-checkbox-group__message {
    margin: 0;
    font-family: var(--type-body-xs-font-family);
    font-weight: var(--type-body-xs-font-weight);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
    color: var(--color-text-tertiary, CanvasText);
  }

  .ui-checkbox-group[data-invalid] :is(.ui-checkbox-group__legend, .ui-checkbox-group__message) {
    color: var(--color-text-danger, CanvasText);
  }

  .ui-checkbox-group[data-disabled] .ui-checkbox-group__message {
    color: var(--color-text-disabled, GrayText);
  }
}
</style>
