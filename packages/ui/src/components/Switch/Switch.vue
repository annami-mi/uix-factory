<script setup lang="ts">
/**
 * Переключатель — мгновенное вкл/выкл настройки (уведомления, тёмная тема). Для согласий и выбора
 * в форме, который применяется по кнопке «Отправить», — Checkbox. В Figma нет — токен-первый.
 *
 * - Нативный <input type="checkbox" role="switch">: семантика «переключатель, вкл/выкл», пробел,
 *   формы — из коробки.
 * - Трек size/52 × size/32, бегунок size/24 с отступом space/1; выключенный трек ≥ 3:1 к фону
 *   (surface/switch/track-off), включённый — акцент.
 * - Как в iOS: при нажатии бегунок растягивается на пружине и «перетекает» на другую сторону.
 * Атрибуты (`name`, `value`) уходят на <input>, `class`/`style` — на корень.
 */
import { computed, useAttrs, useId } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /** Подпись слева от переключателя */
  label: string;
  /** Пояснение под подписью */
  description?: string;
  disabled?: boolean;
  /** Явный id; по умолчанию — сгенерированный */
  id?: string;
}>();

/** Включён ли (v-model) */
const model = defineModel<boolean>({ default: false });

const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const controlAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")),
);
const generatedId = useId();
const controlId = computed(() => props.id ?? generatedId);
</script>

<template>
  <div
    v-bind="rootAttrs"
    class="ui-switch"
    :data-disabled="disabled || undefined"
  >
    <span class="ui-switch__text">
      <label
        class="ui-switch__label"
        :for="controlId"
      >{{ label }}</label>
      <span
        v-if="description"
        :id="`${controlId}-description`"
        class="ui-switch__description"
      >{{ description }}</span>
    </span>
    <span class="ui-switch__track-wrap">
      <input
        :id="controlId"
        v-model="model"
        v-bind="controlAttrs"
        type="checkbox"
        role="switch"
        class="ui-switch__track"
        :disabled="disabled"
        :aria-describedby="description ? `${controlId}-description` : undefined"
      >
      <span
        class="ui-switch__thumb"
        aria-hidden="true"
      />
    </span>
  </div>
</template>

<style scoped>
@layer components {
  /* Строка: подпись слева, переключатель справа (как в настройках iOS); зона касания ≥ size/44 */
  .ui-switch {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    min-block-size: var(--size-44);
    padding-block: calc((var(--size-44) - var(--size-32)) / 2);
    -webkit-tap-highlight-color: transparent;
  }

  .ui-switch__text {
    display: grid;
    min-inline-size: 0;
    /* первая строка подписи — по центру трека */
    padding-block-start: calc((var(--size-32) - var(--type-body-lg-line-height)) / 2);
  }

  .ui-switch__label {
    font-family: var(--type-body-lg-font-family);
    font-weight: var(--type-body-lg-font-weight);
    font-size: var(--type-body-lg-font-size);
    line-height: var(--type-body-lg-line-height);
    color: var(--color-text-primary, CanvasText);
    cursor: pointer;
  }

  .ui-switch__description {
    font-family: var(--type-body-sm-font-family);
    font-weight: var(--type-body-sm-font-weight);
    font-size: var(--type-body-sm-font-size);
    line-height: var(--type-body-sm-line-height);
    color: var(--color-text-tertiary, CanvasText);
  }

  .ui-switch__track-wrap {
    --_inset: var(--space-1);
    --_thumb: var(--size-24);
    --_stretch: 0px;

    position: relative;
    display: inline-flex;
    flex: none;
    inline-size: var(--size-52);
    block-size: var(--size-32);
  }

  .ui-switch__track {
    appearance: none;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    border-radius: var(--radius-full);
    background: var(--surface-switch-track-off, GrayText);
    cursor: pointer;
    transition: background-color var(--duration-normal) ease-out;
  }

  .ui-switch__track:checked {
    background: var(--surface-switch-track-on, Highlight);
  }

  .ui-switch__track:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  /* Бегунок: слева — выкл, справа — вкл. При нажатии растягивается на space/2 (как в iOS) */
  .ui-switch__thumb {
    position: absolute;
    inset-block-start: var(--_inset);
    inset-inline-start: var(--_inset);
    inline-size: calc(var(--_thumb) + var(--_stretch));
    block-size: var(--_thumb);
    border-radius: var(--radius-full);
    background: var(--surface-switch-thumb, Canvas);
    box-shadow: var(--surface-switch-thumb-shadow, none);
    pointer-events: none;
    transition:
      translate var(--duration-release) var(--easing-spring-release),
      inline-size var(--duration-press) var(--easing-spring-press);
  }

  .ui-switch__track:checked + .ui-switch__thumb {
    translate: calc(var(--size-52) - var(--_thumb) - var(--_stretch) - 2 * var(--_inset)) 0;
  }

  .ui-switch:not([data-disabled]) .ui-switch__track-wrap:active {
    --_stretch: var(--space-2);
  }

  /* Disabled — весь переключатель и подпись приглушены (текст неактивного элемента — вне требования контраста) */
  .ui-switch[data-disabled] .ui-switch__track-wrap {
    opacity: var(--opacity-40);
  }

  .ui-switch__track:disabled {
    cursor: not-allowed;
  }

  .ui-switch[data-disabled] :is(.ui-switch__label, .ui-switch__description) {
    color: var(--color-text-disabled, GrayText);
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-switch__track,
    .ui-switch__thumb {
      transition: none;
    }

    .ui-switch:not([data-disabled]) .ui-switch__track-wrap:active {
      --_stretch: 0px;
    }
  }
}
</style>
