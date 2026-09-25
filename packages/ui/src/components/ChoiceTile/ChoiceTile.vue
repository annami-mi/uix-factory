<script setup lang="ts">
/**
 * Плитка выбора — вариант RadioGroup / CheckboxGroup `variant="tiles"`: плашка вместо кружка/флажка
 * (объём памяти, тариф, размер). Внутренний компонент групп — отдельно не используется.
 *
 * - Внутри — нативный input (визуально скрыт): стрелки у радио, пробел, формы, скринридер — из коробки.
 *   Вся плитка — <label>, зона касания — вся плашка.
 * - Материал — как у secondary-кнопки (`surface/neutral/*`): в glass — стекло, в neutral — полупрозрачная
 *   плашка без бордера. Выбранная — кольцо `surface/control/checked-border` и значок-галочка в углу
 *   (выбор виден не только цветом). Нажатие — `scale/pressed-surface` на пружине.
 */
import { Check } from "@lucide/vue";

defineProps<{
  /** id нативного input (от группы) */
  id: string;
  /** Радио (один из) или флажок (несколько) */
  type: "radio" | "checkbox";
  /** Имя в форме */
  name?: string;
  /** Значение варианта */
  value: string;
  /** Выбран ли вариант */
  checked: boolean;
  /** Подпись — доступное имя */
  label: string;
  /** Пояснение (цена, срок) — aria-describedby */
  description?: string;
  /** Недоступен */
  disabled?: boolean;
  /** Ошибка группы — красное кольцо, aria-invalid */
  invalid?: boolean;
}>();

const emit = defineEmits<{
  /** Отмечен/снят (для радио — только отмечен) */
  change: [checked: boolean];
}>();
</script>

<template>
  <label
    class="ui-choice-tile"
    :for="id"
    :data-checked="checked || undefined"
    :data-disabled="disabled || undefined"
    :data-invalid="invalid || undefined"
  >
    <input
      :id="id"
      class="ui-choice-tile__input"
      :type="type"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-labelledby="`${id}-label`"
      :aria-describedby="description ? `${id}-description` : undefined"
      @change="emit('change', ($event.target as HTMLInputElement).checked)"
    >
    <!-- Имя — только подпись; описание (цена) — через aria-describedby, а не в имени -->
    <span
      :id="`${id}-label`"
      class="ui-choice-tile__label"
    >{{ label }}</span>
    <span
      v-if="description"
      :id="`${id}-description`"
      class="ui-choice-tile__description"
    >{{ description }}</span>
    <span
      class="ui-choice-tile__mark"
      aria-hidden="true"
    ><Check /></span>
  </label>
</template>

<style scoped>
@layer components {
  .ui-choice-tile {
    --_bg: var(--surface-neutral-default-bg, ButtonFace);
    --_border: var(--surface-neutral-default-border, transparent);
    --_shadow: var(--surface-neutral-default-shadow, none);
    --_backdrop: var(--surface-neutral-default-backdrop, none);

    position: relative;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: var(--space-1);
    min-block-size: var(--size-64);
    /* По бокам — место под галочку в углу (симметрично: текст остаётся по центру) */
    padding: var(--space-4) calc(var(--space-2) + var(--size-20));
    border: var(--stroke-1) solid var(--_border);
    border-radius: var(--radius-4);
    background: var(--_bg);
    box-shadow: var(--_shadow);
    backdrop-filter: var(--_backdrop);
    text-align: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      scale var(--duration-release) var(--easing-spring-release),
      background-color var(--duration-fast) ease-out;
  }

  .ui-choice-tile:hover:not([data-disabled]) {
    --_bg: var(--surface-neutral-hover-bg, ButtonFace);
    --_border: var(--surface-neutral-hover-border, transparent);
    --_shadow: var(--surface-neutral-hover-shadow, none);
    --_backdrop: var(--surface-neutral-hover-backdrop, none);
  }

  /* Нажатие — органичный скейл плашки, размеры не меняются */
  .ui-choice-tile:active:not([data-disabled]) {
    --_bg: var(--surface-neutral-pressed-bg, ButtonFace);
    --_border: var(--surface-neutral-pressed-border, transparent);
    --_shadow: var(--surface-neutral-pressed-shadow, none);
    --_backdrop: var(--surface-neutral-pressed-backdrop, none);

    scale: var(--scale-pressed-surface);
    transition:
      scale var(--duration-press) var(--easing-spring-press),
      background-color var(--duration-fast) ease-out;
  }

  /* Кольцо выбора — отдельным слоем: outline остаётся фокусу */
  .ui-choice-tile::after {
    content: "";
    position: absolute;
    inset: calc(-1 * var(--stroke-1));
    border: var(--stroke-2) solid transparent;
    border-radius: inherit;
    pointer-events: none;
    transition: border-color var(--duration-fast) ease-out;
  }

  .ui-choice-tile[data-checked]::after {
    border-color: var(--surface-control-checked-border, Highlight);
  }

  .ui-choice-tile[data-invalid]:not([data-checked])::after {
    border-color: var(--surface-control-error-border, FieldText);
  }

  .ui-choice-tile:has(.ui-choice-tile__input:focus-visible) {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  /* Нативный input — для клавиатуры, форм и скринридера; виден только выбор плитки */
  .ui-choice-tile__input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    opacity: 0;
  }

  .ui-choice-tile__label {
    font-family: var(--type-label-m-font-family);
    font-weight: var(--type-label-m-font-weight);
    font-size: var(--type-label-m-font-size);
    line-height: var(--type-label-m-line-height);
    color: var(--color-text-primary, CanvasText);
  }

  .ui-choice-tile__description {
    font-family: var(--type-body-xs-font-family);
    font-weight: var(--type-body-xs-font-weight);
    font-size: var(--type-body-xs-font-size);
    line-height: var(--type-body-xs-line-height);
    color: var(--color-text-secondary, CanvasText);
  }

  /* Галочка в углу — выбор не только цветом; появляется на пружине */
  .ui-choice-tile__mark {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-end: var(--space-2);
    display: grid;
    place-items: center;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    border-radius: var(--radius-full);
    background: var(--surface-control-checked-bg, Highlight);
    color: var(--surface-control-checked-mark, HighlightText);
    scale: 0;
    transition: scale var(--duration-press) var(--easing-spring-release);
  }

  .ui-choice-tile__mark svg {
    inline-size: var(--size-12);
    block-size: var(--size-12);
    stroke-width: var(--stroke-2);
  }

  .ui-choice-tile[data-checked] .ui-choice-tile__mark {
    scale: 1;
  }

  .ui-choice-tile[data-disabled] {
    --_bg: var(--surface-neutral-disabled-bg, ButtonFace);
    --_border: var(--surface-neutral-disabled-border, transparent);
    --_shadow: var(--surface-neutral-disabled-shadow, none);
    --_backdrop: var(--surface-neutral-disabled-backdrop, none);

    cursor: not-allowed;
  }

  .ui-choice-tile[data-disabled] :is(.ui-choice-tile__label, .ui-choice-tile__description) {
    color: var(--color-text-disabled, GrayText);
  }

  .ui-choice-tile[data-disabled][data-checked]::after {
    border-color: var(--surface-control-disabled-border, GrayText);
  }

  .ui-choice-tile[data-disabled] .ui-choice-tile__mark {
    background: var(--color-text-disabled, GrayText);
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-choice-tile,
    .ui-choice-tile:active:not([data-disabled]),
    .ui-choice-tile__mark {
      scale: none;
      transition: none;
    }

    .ui-choice-tile__mark {
      opacity: 0;
    }

    .ui-choice-tile[data-checked] .ui-choice-tile__mark {
      opacity: 1;
    }
  }
}
</style>
