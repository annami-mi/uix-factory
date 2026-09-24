<script setup lang="ts">
/**
 * Выбор одного значения из списка. Источник: Figma "select" (Inputs 149:723) = FormField + Field
 * с шевроном. Раскрытый список в Figma не нарисован — спроектирован в коде (токен-first):
 *
 * - **Десктоп** (ширина ≥ breakpoint/md) — всплывашка у поля: Reka UI Select (listbox, typeahead).
 * - **Мобильный** — шторка снизу: Sheet (Reka Dialog) + Reka Listbox.
 * Режим — проп `presentation` (`auto` по ширине экрана, или явно `popover` / `sheet`).
 * До монтирования (SSR) — всегда popover, чтобы гидратация совпадала.
 *
 * Опции в обоих режимах выглядят одинаково: капсулы size/44, подсветка surface/option/highlighted,
 * выбранная — галочка цвета акцента. Материал панели — surface/popover/*.
 */
import { computed, ref, useAttrs } from "vue";
import { Check, ChevronDown } from "@lucide/vue";
import {
  ListboxContent,
  ListboxItem,
  ListboxItemIndicator,
  ListboxRoot,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectViewport,
} from "reka-ui";
import { breakpoints } from "@uix/tokens";
import { useMediaQuery } from "../../composables/useMediaQuery";
import { tokenNumber } from "../../utils/tokens";
import Field from "../Field/Field.vue";
import FormField from "../FormField/FormField.vue";
import Sheet from "../Sheet/Sheet.vue";

export interface SelectOption {
  /** Значение, которое попадает в v-model и в форму */
  value: string;
  /** Видимый текст опции */
  label: string;
  disabled?: boolean;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** Список опций */
    options: SelectOption[];
    /** Видимая подпись над полем; заголовок шторки на мобильном */
    label?: string;
    /** Подсказка под полем */
    hint?: string;
    /** Текст ошибки: заменяет подсказку, ставит `aria-invalid` */
    error?: string;
    /** Текст, пока ничего не выбрано */
    placeholder?: string;
    disabled?: boolean;
    /** Спиннер вместо шеврона (напр. опции грузятся), выбор заблокирован */
    loading?: boolean;
    /** Имя поля в форме (скрытый input) */
    name?: string;
    required?: boolean;
    /** Как раскрывать список: по ширине экрана, всплывашкой или шторкой */
    presentation?: "auto" | "popover" | "sheet";
    /** Явный id триггера; по умолчанию — сгенерированный */
    id?: string;
  }>(),
  { presentation: "auto" },
);

/** Выбранное значение (v-model); `undefined` — ничего не выбрано */
const model = defineModel<string | undefined>();

defineSlots<{
  /** Иконка слева: 24×24, цвет — color/icon/secondary */
  start?: () => unknown;
}>();

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")),
);

const isNarrow = useMediaQuery(`(width < ${breakpoints.md}px)`);
const mode = computed(() =>
  props.presentation === "auto" ? (isNarrow.value ? "sheet" : "popover") : props.presentation,
);

const selected = computed(() => props.options.find((o) => o.value === model.value));
const inactive = computed(() => props.disabled || props.loading);

/** Отступ всплывашки от поля — из токена space/2 (Reka принимает число) */
const sideOffset = computed(() => tokenNumber("--space-2", 8));

const sheetOpen = ref(false);
function onSheetSelect(value: unknown) {
  if (typeof value === "string") model.value = value;
  sheetOpen.value = false;
}
</script>

<template>
  <FormField
    v-bind="rootAttrs"
    :id="id"
    v-slot="{ id: controlId, describedBy, invalid }"
    class="ui-select"
    :label="label"
    :hint="hint"
    :error="error"
    :disabled="disabled"
  >
    <!-- Десктоп: всплывашка (Reka Select) -->
    <SelectRoot
      v-if="mode === 'popover'"
      v-model="model"
      :disabled="inactive"
      :name="name"
      :required="required"
    >
      <Field
        flush
        :invalid="invalid"
        :disabled="disabled"
        :loading="loading"
      >
        <SelectTrigger
          :id="controlId"
          v-bind="controlAttrs"
          data-field-control
          class="ui-select__trigger"
          :data-empty="selected ? undefined : ''"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedBy"
          :aria-busy="loading || undefined"
        >
          <span
            v-if="$slots.start"
            class="ui-select__icon"
            aria-hidden="true"
          ><slot name="start" /></span>
          <span class="ui-select__value">{{ selected?.label ?? placeholder }}</span>
          <ChevronDown
            v-if="!loading"
            class="ui-select__chevron"
            aria-hidden="true"
          />
        </SelectTrigger>
      </Field>

      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="sideOffset"
          class="ui-select-panel ui-select-panel--popover"
        >
          <SelectViewport class="ui-select-panel__list">
            <SelectItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              class="ui-select-option"
            >
              <SelectItemText class="ui-select-option__text">
                {{ option.label }}
              </SelectItemText>
              <SelectItemIndicator class="ui-select-option__check">
                <Check aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <!-- Мобильный: шторка (Sheet + Reka Listbox) -->
    <template v-else>
      <Field
        flush
        :invalid="invalid"
        :disabled="disabled"
        :loading="loading"
      >
        <button
          :id="controlId"
          v-bind="controlAttrs"
          type="button"
          data-field-control
          class="ui-select__trigger"
          :data-empty="selected ? undefined : ''"
          :data-state="sheetOpen ? 'open' : 'closed'"
          :disabled="inactive"
          aria-haspopup="dialog"
          :aria-expanded="sheetOpen"
          :aria-invalid="invalid || undefined"
          :aria-describedby="describedBy"
          :aria-busy="loading || undefined"
          @click="sheetOpen = true"
        >
          <span
            v-if="$slots.start"
            class="ui-select__icon"
            aria-hidden="true"
          ><slot name="start" /></span>
          <span class="ui-select__value">{{ selected?.label ?? placeholder }}</span>
          <ChevronDown
            v-if="!loading"
            class="ui-select__chevron"
            aria-hidden="true"
          />
        </button>
      </Field>
      <input
        v-if="name"
        type="hidden"
        :name="name"
        :value="model ?? ''"
      >

      <Sheet
        v-model:open="sheetOpen"
        :title="label ?? placeholder ?? ''"
      >
        <ListboxRoot
          :model-value="model"
          class="ui-select-panel__list"
          @update:model-value="onSheetSelect"
        >
          <ListboxContent :aria-label="label ?? placeholder">
            <ListboxItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              class="ui-select-option"
            >
              <span class="ui-select-option__text">{{ option.label }}</span>
              <ListboxItemIndicator class="ui-select-option__check">
                <Check aria-hidden="true" />
              </ListboxItemIndicator>
            </ListboxItem>
          </ListboxContent>
        </ListboxRoot>
      </Sheet>
    </template>
  </FormField>
</template>

<style scoped>
@layer components {
  /* Триггер занимает всю капсулу Field (flush) — кликабельно всё поле */
  .ui-select__trigger {
    display: flex;
    flex: 1;
    align-items: center;
    align-self: stretch;
    gap: var(--space-3);
    min-inline-size: 0;
    padding-inline: var(--space-4);
    border: 0;
    border-radius: inherit;
    background: none;
    color: inherit;
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    text-align: start;
    cursor: pointer;
    outline: none; /* фокус показывает капсула Field (:focus-within) */
  }

  .ui-select__trigger:disabled {
    cursor: not-allowed;
  }

  .ui-select__value {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ui-select__trigger[data-empty] .ui-select__value {
    color: var(--color-text-tertiary, GrayText);
  }

  .ui-select__trigger:disabled .ui-select__value {
    color: var(--color-text-disabled, GrayText);
  }

  .ui-select__icon {
    display: inline-flex;
    flex: none;
    inline-size: var(--size-24);
    block-size: var(--size-24);
    color: var(--color-icon-secondary, FieldText);
  }

  .ui-select__icon > :deep(svg) {
    inline-size: 100%;
    block-size: 100%;
  }

  /* Шеврон (Figma: Down → Up в state=opened) */
  .ui-select__chevron {
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    color: var(--color-icon-secondary, FieldText);
    transition: rotate var(--duration-normal) ease-out;
  }

  .ui-select__trigger[data-state="open"] .ui-select__chevron {
    rotate: 180deg;
  }

  .ui-select__trigger:disabled .ui-select__chevron {
    color: var(--color-icon-disabled, GrayText);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-select__chevron {
      transition: none;
    }
  }
}
</style>

<!-- Не scoped: панель телепортируется в <body>; классы уникальны (ui-select-panel*, ui-select-option*) -->
<style>
@layer components {
  /* Всплывашка (десктоп) */
  .ui-select-panel--popover {
    z-index: var(--z-index-popover);
    box-sizing: border-box;
    inline-size: var(--reka-select-trigger-width);
    max-block-size: min(var(--reka-select-content-available-height), calc(var(--size-44) * 7));
    padding: var(--space-1);
    overflow: hidden;
    border: var(--stroke-1) solid var(--surface-popover-border, transparent);
    border-radius: var(--radius-6);
    background: var(--surface-popover-bg, Canvas);
    box-shadow: var(--surface-popover-shadow, none);
    backdrop-filter: var(--surface-popover-backdrop, none);
    color: var(--color-text-primary, CanvasText);
    transform-origin: var(--reka-select-content-transform-origin);
  }

  .ui-select-panel--popover[data-state="open"] {
    animation: ui-select-panel-in var(--duration-press) var(--easing-spring-press);
  }

  .ui-select-panel--popover[data-state="closed"] {
    animation: ui-select-panel-in var(--duration-fast) ease-in reverse;
  }

  @keyframes ui-select-panel-in {
    from {
      opacity: 0;
      scale: var(--scale-popover-enter);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes ui-select-panel-in {
      from {
        opacity: 0;
      }
    }
  }

  .ui-select-panel__list {
    display: grid;
    gap: var(--space-px);
    outline: none;
  }

  /* Опция — одинаковая во всплывашке и в шторке */
  .ui-select-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: var(--size-44);
    padding-inline: var(--space-4);
    border-radius: var(--radius-full);
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    cursor: pointer;
    outline: none;
    user-select: none;
  }

  .ui-select-option[data-highlighted] {
    background: var(--surface-option-highlighted-bg, Highlight);
  }

  .ui-select-option[data-disabled] {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  .ui-select-option__text {
    flex: 1;
    min-inline-size: 0;
  }

  .ui-select-option__check {
    display: inline-flex;
    flex: none;
    color: var(--color-accent-default, currentColor);
  }

  .ui-select-option__check > svg {
    inline-size: var(--size-20);
    block-size: var(--size-20);
    stroke-width: var(--stroke-icon);
  }
}
</style>
