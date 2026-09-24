<script setup lang="ts">
/**
 * Текстовое поле. Источник: Figma "input" (Inputs 149:723) = FormField (label/hint) + Field (капсула)
 * + нативный <input>. Select строится так же — на FormField + Field, с триггером вместо <input>.
 *
 * Атрибуты (`name`, `autocomplete`, `inputmode`, `required`, `aria-*`…) уходят на <input>,
 * `class`/`style` — на корень. Без `label` полю нужен `aria-label`.
 *
 * Отличие от макета (docs/figma-todo.md): текст 16px (`type/body/lg`, в Figma body/md 14px) —
 * iOS Safari зумит страницу при фокусе на поле с текстом < 16px.
 */
import { computed, ref, useAttrs } from "vue";
import { X } from "@lucide/vue";
import Field from "../Field/Field.vue";
import FormField from "../FormField/FormField.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Видимая подпись над полем (label/sm) */
    label?: string;
    /** Подсказка под полем (body/sm) */
    hint?: string;
    /** Текст ошибки: заменяет подсказку, красит подпись/бордер, ставит `aria-invalid` */
    error?: string;
    placeholder?: string;
    type?: "text" | "email" | "tel" | "url" | "search" | "password";
    disabled?: boolean;
    /** Спиннер справа, поле только для чтения, `aria-busy="true"` */
    loading?: boolean;
    /** Кнопка очистки справа, когда в поле есть текст */
    clearable?: boolean;
    /** Доступное имя кнопки очистки */
    clearLabel?: string;
    /** Явный id поля; по умолчанию — сгенерированный */
    id?: string;
  }>(),
  {
    type: "text",
    clearLabel: "Очистить",
  },
);

/** Значение поля (v-model) */
const model = defineModel<string>({ default: "" });

const emit = defineEmits<{
  /** Поле очищено кнопкой очистки */
  clear: [];
}>();

defineSlots<{
  /** Иконка слева: 24×24, цвет — color/icon/secondary (напр. Search из Lucide) */
  start?: () => unknown;
  /** Иконка или действие справа (после кнопки очистки) */
  end?: () => unknown;
}>();

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")),
);

const input = ref<HTMLInputElement>();
const showClear = computed(() => props.clearable && model.value !== "" && !props.disabled && !props.loading);

function clear() {
  model.value = "";
  emit("clear");
  input.value?.focus();
}

defineExpose({
  /** Перевести фокус в поле */
  focus: () => input.value?.focus(),
});
</script>

<template>
  <FormField
    v-bind="rootAttrs"
    :id="id"
    v-slot="{ id: controlId, describedBy, invalid }"
    class="ui-input"
    :label="label"
    :hint="hint"
    :error="error"
    :disabled="disabled"
  >
    <Field
      :invalid="invalid"
      :disabled="disabled"
      :loading="loading"
    >
      <template
        v-if="$slots.start"
        #start
      >
        <slot name="start" />
      </template>

      <input
        :id="controlId"
        ref="input"
        v-model="model"
        v-bind="controlAttrs"
        data-field-control
        class="ui-input__control"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="loading || undefined"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        :aria-busy="loading || undefined"
      >

      <template
        v-if="showClear || $slots.end"
        #end
      >
        <button
          v-if="showClear"
          type="button"
          class="ui-input__clear"
          :aria-label="clearLabel"
          @click="clear"
        >
          <X aria-hidden="true" />
        </button>
        <slot name="end" />
      </template>
    </Field>
  </FormField>
</template>

<style scoped>
@layer components {
  .ui-input__control {
    flex: 1;
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none; /* фокус показывает капсула Field (:focus-within) */
    background: none;
    color: inherit;
    caret-color: var(--color-accent-default, currentColor);
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
  }

  .ui-input__control::placeholder {
    color: var(--color-text-tertiary, GrayText);
    opacity: 1;
  }

  .ui-input__control:disabled::placeholder {
    color: var(--color-text-disabled, GrayText);
  }

  .ui-input__control:disabled {
    cursor: not-allowed;
  }

  /* Автозаполнение браузера не должно заливать стекло своим фоном */
  .ui-input__control:autofill {
    background-clip: text;
    -webkit-text-fill-color: var(--color-text-primary, FieldText);
  }

  /* Кнопка очистки: иконка 24×24 (Figma trailing), зона касания — size/44 */
  .ui-input__clear {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--size-24);
    block-size: var(--size-24);
    border-radius: var(--radius-full);
    color: inherit;
    cursor: pointer;
  }

  .ui-input__clear::before {
    content: "";
    position: absolute;
    inset: calc((var(--size-24) - var(--size-44)) / 2);
  }

  .ui-input__clear:hover {
    color: var(--color-icon-primary, FieldText);
  }

  .ui-input__clear:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-1);
  }

  .ui-input__clear > :deep(svg) {
    inline-size: var(--size-20);
    block-size: var(--size-20);
  }
}
</style>
