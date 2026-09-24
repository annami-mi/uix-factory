<script setup lang="ts">
/**
 * Индикатор загрузки. Источник: Figma "spiner" (Buttons 127:566): 20×20, штрих stroke/2,
 * белый 30% → currentColor с opacity/30, оборот — 4 фазы × 400ms.
 * Декоративный (aria-hidden): состояние загрузки сообщает контрол (`aria-busy`), а не спиннер.
 * Используется в Button и Field.
 */
</script>

<template>
  <span
    class="ui-spinner"
    aria-hidden="true"
  />
</template>

<style scoped>
@layer components {
  .ui-spinner {
    display: inline-block;
    flex: none;
    inline-size: var(--size-20);
    block-size: var(--size-20);
    border-radius: var(--radius-full);
    border: var(--stroke-2) solid currentColor;
    border-inline-end-color: transparent;
    opacity: var(--opacity-30);
    animation: ui-spinner-spin var(--duration-spinner) linear infinite;
  }

  /* Индикатор загрузки несёт смысл, поэтому не останавливается совсем — только замедляется */
  @media (prefers-reduced-motion: reduce) {
    .ui-spinner {
      animation-duration: var(--duration-spinner-reduced);
    }
  }

  @keyframes ui-spinner-spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
