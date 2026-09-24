<script setup lang="ts">
/**
 * Многострочное поле. В Figma нет — собрано из тех же частей, что Input (токен-first):
 * FormField (подпись, подсказка/ошибка) + Field `multiline` (материал surface/field/*,
 * скругление radius/6) + нативный <textarea>.
 *
 * - Растёт по содержимому (`autoResize`) от `rows` до `maxRows` строк: CSS `field-sizing: content`,
 *   где он не поддержан (Safari) — пересчёт высоты на JS.
 * - `maxlength` показывает счётчик справа от подсказки; скринридеру лимит сообщается через описание
 *   поля, а не счётчиком на каждое нажатие.
 * - Атрибуты (`name`, `autocomplete`, `required`, `aria-*`) — на <textarea>, `class`/`style` — на корень.
 */
import { computed, nextTick, onMounted, ref, useAttrs, watch } from "vue";
import Field from "../Field/Field.vue";
import FormField from "../FormField/FormField.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Видимая подпись над полем */
    label?: string;
    /** Подсказка под полем */
    hint?: string;
    /** Текст ошибки: заменяет подсказку, ставит `aria-invalid` */
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Высота в строках без текста */
    rows?: number;
    /** Растёт по содержимому до `maxRows` строк, дальше — прокрутка */
    autoResize?: boolean;
    /** Предел роста при `autoResize` */
    maxRows?: number;
    /** Максимум символов: нативный предел + счётчик */
    maxlength?: number;
    /** Текст для скринридера о пределе; `{n}` заменяется на maxlength */
    limitLabel?: string;
    /** Явный id поля; по умолчанию — сгенерированный */
    id?: string;
  }>(),
  {
    rows: 3,
    autoResize: true,
    maxRows: 10,
    limitLabel: "Не больше {n} символов",
  },
);

/** Значение поля (v-model) */
const model = defineModel<string>({ default: "" });

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")),
);

const textarea = ref<HTMLTextAreaElement>();
const limitText = computed(() => props.limitLabel.replace("{n}", String(props.maxlength)));
const sizeVars = computed(() => ({ "--_rows": props.rows, "--_max-rows": props.autoResize ? props.maxRows : props.rows }));

/** Запасной авторост для браузеров без field-sizing (Safari) */
const needsJsResize = ref(false);
function resize() {
  const el = textarea.value;
  if (!el || !props.autoResize || !needsJsResize.value) return;
  el.style.blockSize = "auto";
  el.style.blockSize = `${el.scrollHeight}px`;
}
onMounted(() => {
  needsJsResize.value = !(globalThis.CSS?.supports?.("field-sizing", "content") ?? false);
  resize();
});
watch(model, () => nextTick(resize));

defineExpose({
  /** Перевести фокус в поле */
  focus: () => textarea.value?.focus(),
});
</script>

<template>
  <FormField
    v-bind="rootAttrs"
    :id="id"
    class="ui-textarea"
    :label="label"
    :hint="hint"
    :error="error"
    :disabled="disabled"
  >
    <template #default="{ id: controlId, describedBy, invalid }">
      <Field
        multiline
        :invalid="invalid"
        :disabled="disabled"
      >
        <textarea
          :id="controlId"
          ref="textarea"
          v-model="model"
          v-bind="controlAttrs"
          data-field-control
          class="ui-textarea__control"
          :data-autoresize="autoResize || undefined"
          :style="sizeVars"
          :rows="rows"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxlength="maxlength"
          :aria-invalid="invalid || undefined"
          :aria-describedby="[describedBy, maxlength ? `${controlId}-limit` : undefined].filter(Boolean).join(' ') || undefined"
        />
        <span
          v-if="maxlength"
          :id="`${controlId}-limit`"
          class="ui-textarea__sr"
        >{{ limitText }}</span>
      </Field>
    </template>
    <template
      v-if="maxlength"
      #aside
    >
      <span aria-hidden="true">{{ model.length }} / {{ maxlength }}</span>
    </template>
  </FormField>
</template>

<style scoped>
@layer components {
  .ui-textarea__control {
    flex: 1;
    min-inline-size: 0;
    min-block-size: calc(var(--type-body-lg-line-height) * var(--_rows));
    max-block-size: calc(var(--type-body-lg-line-height) * var(--_max-rows));
    margin: 0;
    padding: 0;
    border: 0;
    outline: none; /* фокус показывает Field (:focus-within) */
    background: none;
    color: inherit;
    caret-color: var(--color-accent-default, currentColor);
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    resize: vertical;
  }

  .ui-textarea__control[data-autoresize] {
    field-sizing: content;
    resize: none;
  }

  .ui-textarea__control::placeholder {
    color: var(--color-text-tertiary, GrayText);
    opacity: 1;
  }

  .ui-textarea__control:disabled {
    cursor: not-allowed;
  }

  .ui-textarea__control:disabled::placeholder {
    color: var(--color-text-disabled, GrayText);
  }

  /* Только для скринридера */
  .ui-textarea__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
