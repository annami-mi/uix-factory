<script setup lang="ts">
/**
 * Источник: Figma frame "Buttons" (127:566), node type=primary/secondary, size=md.
 * Маппинг зафиксирован в docs/figma-code.md.
 *
 * Состояния default/hover/pressed/disabled/loading — управляются CSS (:hover, :active,
 * :disabled) и одним прокинутым пропом loading. "Focused" — нативный :focus-visible,
 * не отдельный проп: состояние фокуса не должно уметь взводиться вручную мимо клавиатуры.
 *
 * Структура повторяет Figma: корень (layout, hit area) + слой surface (::before) с материалом.
 * Pressed — по канону Liquid Glass (отличие от макета, см. docs/figma-code.md):
 * scale всей кнопки на пружине + стекло светлеет, а из точки касания растекается блик
 * (слой ::after). Блик вспыхивает быстро и гаснет медленно. Layout не меняется.
 *
 * Токены (роли, не значения): surface-{accent,neutral}-{default,hover,pressed,disabled,loading}-*,
 * color-text-on-accent / primary / disabled, color-state-focus, type-label-m-*.
 * Fallback-и — системные цвета CSS, чтобы кнопка оставалась читаемой вне [data-theme].
 */
import { computed, ref } from "vue";
import Spinner from "../Spinner/Spinner.vue";

const props = withDefaults(
  defineProps<{
    /** Роль поверхности, см. packages/tokens surface.accent / surface.neutral */
    /** primary — главное действие, secondary — второстепенное, ghost — без плашки в покое (третьестепенное, тулбары) */
    variant?: "primary" | "secondary" | "ghost";
    /**
     * Размер: m — по умолчанию, комфортный для тача (size/48, label/m 16px); l — крупный CTA (size/56, label/l 18px);
     * s — компактный для тулбаров и плотных десктопных экранов (size/40, label/s 14px), не по умолчанию;
     *   на тач-экране (pointer: coarse) дорастает до size/44 — зона касания.
     */
    size?: "s" | "m" | "l";
    /** Нативный `disabled` (для `as="a"` — `aria-disabled`, клик гасится) */
    disabled?: boolean;
    /** Только спиннер, `aria-busy="true"`, клик заблокирован; лейбл остаётся доступным именем */
    loading?: boolean;
    /** Тег: `button` или `a` — CTA-ссылка с визуалом кнопки (`href` передаётся атрибутом) */
    as?: "button" | "a";
  }>(),
  {
    variant: "primary",
    size: "m",
    disabled: false,
    loading: false,
    as: "button",
  },
);

defineSlots<{
  /** Текст кнопки. В loading скрыт визуально, но остаётся доступным именем для скринридера */
  default?: () => unknown;
  /** Иконка слева: 20×20, цвет — currentColor. Библиотека кита — Lucide (`@lucide/vue`) */
  start?: () => unknown;
  /** Иконка справа: 20×20, цвет — currentColor */
  end?: () => unknown;
}>();

const emit = defineEmits<{
  /** Клик по активной кнопке. В disabled/loading не вызывается (в т.ч. для `as="a"`) */
  click: [event: MouseEvent];
}>();

const inactive = computed(() => props.disabled || props.loading);

function onClick(event: MouseEvent) {
  if (!inactive.value) emit("click", event);
}

/** <a> не умеет disabled нативно — гасим клик сами, чтобы aria-disabled не был только декорацией */
function onClickCapture(event: MouseEvent) {
  if (props.as === "a" && inactive.value) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
/** iOS Safari не включает :active без touch-обработчика — без него pressed на телефоне не виден */
function noop() {}

/** Точка касания для блика — в %, чтобы не зависеть от текущего scale кнопки */
const pressOrigin = ref<{ x: number; y: number } | null>(null);

function onPointerDown(event: PointerEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  pressOrigin.value = {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

/** С клавиатуры точки касания нет — блик идёт из центра */
function onKeyDown() {
  pressOrigin.value = null;
}

const pressStyle = computed(() =>
  pressOrigin.value
    ? { "--_press-x": `${pressOrigin.value.x}%`, "--_press-y": `${pressOrigin.value.y}%` }
    : undefined,
);
</script>

<template>
  <component
    :is="as"
    class="ui-button"
    :class="[`ui-button--${variant}`]"
    :data-size="size"
    :type="as === 'button' ? 'button' : undefined"
    :disabled="as === 'button' ? inactive : undefined"
    :aria-disabled="as === 'a' && inactive ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :style="pressStyle"
    @click.capture="onClickCapture"
    @click="onClick"
    @touchstart.passive="noop"
    @pointerdown="onPointerDown"
    @keydown="onKeyDown"
  >
    <Spinner
      v-if="loading"
      class="ui-button__spinner"
    />
    <!-- Иконки: слоты не завязаны на библиотеку, кнопка задаёт только размер и цвет -->
    <span
      v-if="$slots.start && !loading"
      class="ui-button__icon"
      aria-hidden="true"
    ><slot name="start" /></span>
    <!-- В loading Figma показывает только спиннер; лейбл остаётся для скринридера -->
    <span class="ui-button__label"><slot /></span>
    <span
      v-if="$slots.end && !loading"
      class="ui-button__icon"
      aria-hidden="true"
    ><slot name="end" /></span>
  </component>
</template>

<style scoped>
@layer components {
  /*
    Состояние задаётся приватными --_*; слой surface (::before) только их читает.
    Так каждое состояние — это одна подмена ролей, а не повтор всех свойств.
  */
  .ui-button {
    position: relative;
    isolation: isolate;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* Размер — внутренние переменные; m по умолчанию, s/lg — ниже */
    --_height: var(--size-48);
    --_padding: var(--space-4);
    --_icon: var(--size-20);
    --_icon-only: var(--size-24);

    gap: var(--space-2);
    min-block-size: var(--_height);
    padding-inline: var(--_padding);
    /* Оптическая компенсация: лейбл визуально садится ниже центра — поднимаем на 1px снизу */
    padding-block-end: var(--space-px);
    border: 0;
    border-radius: var(--radius-full);
    background: none;
    cursor: pointer;
    font-family: var(--type-label-m-font-family);
    font-weight: var(--type-label-m-font-weight);
    font-size: var(--type-label-m-font-size);
    line-height: var(--type-label-m-line-height);
    text-decoration: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    /* Отпускание: мягкая пружина с лёгким отскоком */
    transition: scale var(--duration-release) var(--easing-spring-release);
  }

  .ui-button::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    border: var(--stroke-1) solid var(--_border);
    background: var(--_bg);
    box-shadow: var(--_shadow);
    backdrop-filter: var(--_backdrop);
    transition-property: background-color, border-color, box-shadow;
    transition-duration: var(--duration-normal);
    transition-timing-function: ease-out;
  }

  /* Блик нажатия (Liquid Glass): свет из точки касания, над материалом, под контентом */
  .ui-button::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: radial-gradient(
      circle var(--size-48) at var(--_press-x, 50%) var(--_press-y, 50%),
      var(--_highlight, transparent),
      transparent
    );
    opacity: 0;
    pointer-events: none;
    /* Гаснет медленно — вместе с отскоком scale */
    transition: opacity var(--duration-release) ease-out;
  }

  .ui-button:active:not(:disabled, [aria-disabled="true"])::after {
    opacity: 1;
    /* Вспыхивает быстро */
    transition-duration: var(--duration-fast);
  }

  /* --- primary / accent --- */
  .ui-button--primary {
    --_bg: var(--surface-accent-default-bg, ButtonFace);
    --_border: var(--surface-accent-default-border, ButtonBorder);
    --_shadow: var(--surface-accent-default-shadow, none);
    --_backdrop: var(--surface-accent-default-backdrop, none);
    --_highlight: var(--surface-accent-pressed-highlight, transparent);
    color: var(--color-text-on-accent, ButtonText);
  }

  .ui-button--primary:hover:not(:disabled, [aria-disabled="true"]) {
    --_bg: var(--surface-accent-hover-bg, ButtonFace);
    --_border: var(--surface-accent-hover-border, ButtonBorder);
    --_shadow: var(--surface-accent-hover-shadow, none);
    --_backdrop: var(--surface-accent-hover-backdrop, none);
  }

  .ui-button--primary:active:not(:disabled, [aria-disabled="true"]) {
    --_bg: var(--surface-accent-pressed-bg, ButtonFace);
    --_border: var(--surface-accent-pressed-border, ButtonBorder);
    --_shadow: var(--surface-accent-pressed-shadow, none);
    --_backdrop: var(--surface-accent-pressed-backdrop, none);
  }

  .ui-button--primary:is(:disabled, [aria-disabled="true"]):not([aria-busy="true"]) {
    --_bg: var(--surface-accent-disabled-bg, ButtonFace);
    --_border: var(--surface-accent-disabled-border, transparent);
    --_shadow: var(--surface-accent-disabled-shadow, none);
    --_backdrop: var(--surface-accent-disabled-backdrop, none);
  }

  .ui-button--primary[aria-busy="true"] {
    --_bg: var(--surface-accent-loading-bg, ButtonFace);
    --_border: var(--surface-accent-loading-border, ButtonBorder);
    --_shadow: var(--surface-accent-loading-shadow, none);
    --_backdrop: var(--surface-accent-loading-backdrop, none);
  }

  /* --- secondary / neutral --- */
  .ui-button--secondary {
    --_bg: var(--surface-neutral-default-bg, ButtonFace);
    --_border: var(--surface-neutral-default-border, ButtonBorder);
    --_shadow: var(--surface-neutral-default-shadow, none);
    --_backdrop: var(--surface-neutral-default-backdrop, none);
    --_highlight: var(--surface-neutral-pressed-highlight, transparent);
    color: var(--color-text-primary, ButtonText);
  }

  .ui-button--secondary:hover:not(:disabled, [aria-disabled="true"]) {
    --_bg: var(--surface-neutral-hover-bg, ButtonFace);
    --_border: var(--surface-neutral-hover-border, ButtonBorder);
    --_shadow: var(--surface-neutral-hover-shadow, none);
    --_backdrop: var(--surface-neutral-hover-backdrop, none);
  }

  .ui-button--secondary:active:not(:disabled, [aria-disabled="true"]) {
    --_bg: var(--surface-neutral-pressed-bg, ButtonFace);
    --_border: var(--surface-neutral-pressed-border, ButtonBorder);
    --_shadow: var(--surface-neutral-pressed-shadow, none);
    --_backdrop: var(--surface-neutral-pressed-backdrop, none);
  }

  .ui-button--secondary:is(:disabled, [aria-disabled="true"]):not([aria-busy="true"]) {
    --_bg: var(--surface-neutral-disabled-bg, ButtonFace);
    --_border: var(--surface-neutral-disabled-border, transparent);
    --_shadow: var(--surface-neutral-disabled-shadow, none);
    --_backdrop: var(--surface-neutral-disabled-backdrop, none);
  }

  .ui-button--secondary[aria-busy="true"] {
    --_bg: var(--surface-neutral-loading-bg, ButtonFace);
    --_border: var(--surface-neutral-loading-border, ButtonBorder);
    --_shadow: var(--surface-neutral-loading-shadow, none);
    --_backdrop: var(--surface-neutral-loading-backdrop, none);
  }

  /* --- ghost: без плашки в покое, плашка при наведении/нажатии --- */
  .ui-button--ghost {
    --_bg: var(--surface-ghost-default-bg, transparent);
    --_border: var(--surface-ghost-default-border, transparent);
    --_shadow: var(--surface-ghost-default-shadow, none);
    --_backdrop: var(--surface-ghost-default-backdrop, none);
    --_highlight: var(--surface-ghost-pressed-highlight, transparent);
    color: var(--color-text-primary, ButtonText);
  }

  .ui-button--ghost:hover:not(:disabled, [aria-disabled="true"]) {
    --_bg: var(--surface-ghost-hover-bg, ButtonFace);
    --_border: var(--surface-ghost-hover-border, transparent);
    --_shadow: var(--surface-ghost-hover-shadow, none);
    --_backdrop: var(--surface-ghost-hover-backdrop, none);
  }

  .ui-button--ghost:active:not(:disabled, [aria-disabled="true"]) {
    --_bg: var(--surface-ghost-pressed-bg, ButtonFace);
    --_border: var(--surface-ghost-pressed-border, transparent);
    --_shadow: var(--surface-ghost-pressed-shadow, none);
    --_backdrop: var(--surface-ghost-pressed-backdrop, none);
  }

  .ui-button--ghost:is(:disabled, [aria-disabled="true"]):not([aria-busy="true"]) {
    --_bg: var(--surface-ghost-disabled-bg, transparent);
    --_border: var(--surface-ghost-disabled-border, transparent);
    --_shadow: var(--surface-ghost-disabled-shadow, none);
    --_backdrop: var(--surface-ghost-disabled-backdrop, none);
  }

  .ui-button--ghost[aria-busy="true"] {
    --_bg: var(--surface-ghost-loading-bg, transparent);
    --_border: var(--surface-ghost-loading-border, transparent);
    --_shadow: var(--surface-ghost-loading-shadow, none);
    --_backdrop: var(--surface-ghost-loading-backdrop, none);
  }

  /* --- размеры: высота, поля, кегль (type/label/*), иконка --- */
  .ui-button[data-size="s"] {
    --_height: var(--size-40);
    --_padding: var(--space-3);
    --_icon: var(--size-16);
    --_icon-only: var(--size-20);

    gap: var(--space-1);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
  }

  /* Компактная — только для точного указателя: на тач-экране зона касания не меньше size/44 */
  @media (pointer: coarse) {
    .ui-button[data-size="s"] {
      --_height: var(--size-44);
    }
  }

  .ui-button[data-size="l"] {
    --_height: var(--size-56);
    --_padding: var(--space-6);
    --_icon: var(--size-24);
    --_icon-only: var(--size-24);

    font-family: var(--type-label-l-font-family);
    font-weight: var(--type-label-l-font-weight);
    font-size: var(--type-label-l-font-size);
    line-height: var(--type-label-l-line-height);
  }

  /* --- только иконка (IconButton): квадрат высоты кнопки, иконка крупнее обычной --- */
  .ui-button--icon {
    inline-size: var(--_height);
    padding-inline: 0;
  }

  .ui-button--icon .ui-button__icon {
    inline-size: var(--_icon-only);
    block-size: var(--_icon-only);
  }

  .ui-button--icon .ui-button__label {
    display: none;
  }

  /* --- общие состояния --- */

  /* Pressed: вся кнопка (материал + контент) масштабируется; нажатие — быстрая плотная пружина */
  .ui-button:active:not(:disabled, [aria-disabled="true"]) {
    scale: var(--scale-pressed);
    transition: scale var(--duration-press) var(--easing-spring-press);
  }

  .ui-button:is(:disabled, [aria-disabled="true"]):not([aria-busy="true"]) {
    cursor: not-allowed;
    color: var(--color-text-disabled, GrayText);
  }

  .ui-button[aria-busy="true"] {
    cursor: progress;
  }

  /* Focused (Figma): бордер surface заменяется на stroke/2 цвета state/focus, без внешнего отступа */
  .ui-button:focus-visible {
    /* Прозрачный outline проявляется только в forced-colors режиме */
    outline: var(--stroke-2) solid transparent;
  }

  .ui-button:focus-visible::before {
    border: var(--stroke-2) solid var(--color-state-focus, Highlight);
  }

  /* Loading: только спиннер, лейбл скрыт визуально, но доступен скринридеру */
  .ui-button[aria-busy="true"] .ui-button__label {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* Иконка (Figma: слоты send слева/справа, 20×20). Любая SVG-иконка принимает размер и currentColor */
  .ui-button__icon {
    display: inline-flex;
    flex: none;
    inline-size: var(--_icon);
    block-size: var(--_icon);
  }

  .ui-button__icon > :deep(svg) {
    inline-size: 100%;
    block-size: 100%;
    stroke-width: var(--stroke-icon);
  }

  @media (prefers-reduced-motion: reduce) {
    /* Без движения: pressed остаётся заметным только сменой материала */
    .ui-button,
    .ui-button:active:not(:disabled, [aria-disabled="true"]) {
      scale: none;
      transition: none;
    }

    .ui-button::before {
      transition: none;
    }
  }
}
</style>
