<script setup lang="ts">
/**
 * Заглушка на время загрузки. Декоративная (aria-hidden): загрузку сообщает контейнер —
 * поставьте `aria-busy="true"` на область, которая грузится.
 * Цвет — surface/skeleton/{bg,shine}, блик пробегает за duration/spinner; при reduced motion — без блика.
 */
withDefaults(
  defineProps<{
    /** text — строки текста, rect — картинка/карточка, circle — аватар */
    shape?: "text" | "rect" | "circle";
    /** Число строк для text (последняя короче) */
    lines?: number;
  }>(),
  { shape: "text", lines: 1 },
);
</script>

<template>
  <span
    class="ui-skeleton-group"
    aria-hidden="true"
  >
    <template v-if="shape === 'text'">
      <span
        v-for="n in lines"
        :key="n"
        class="ui-skeleton"
        data-shape="text"
        :data-last="n === lines && lines > 1 ? '' : undefined"
      />
    </template>
    <span
      v-else
      class="ui-skeleton"
      :data-shape="shape"
    />
  </span>
</template>

<style scoped>
@layer components {
  .ui-skeleton-group {
    display: grid;
    gap: var(--space-2);
    inline-size: 100%;
  }

  .ui-skeleton {
    display: block;
    border-radius: var(--radius-2);
    background:
      linear-gradient(90deg, transparent, var(--surface-skeleton-shine, transparent), transparent) 0 0 / 50% 100% no-repeat,
      var(--surface-skeleton-bg, GrayText);
    animation: ui-skeleton-shine var(--duration-spinner) ease-in-out infinite;
  }

  /* Строка — высотой в строку body/m (без «прыжка» при замене на текст) */
  .ui-skeleton[data-shape="text"] {
    block-size: var(--type-body-m-font-size);
    margin-block: calc((var(--type-body-m-line-height) - var(--type-body-m-font-size)) / 2);
    border-radius: var(--radius-full);
  }

  /* Последняя строка абзаца короче — пропорция, а не размер, поэтому в % */
  .ui-skeleton[data-last] {
    inline-size: 60%;
  }

  .ui-skeleton[data-shape="rect"] {
    block-size: 100%;
    min-block-size: var(--size-64);
    border-radius: var(--radius-6);
  }

  .ui-skeleton[data-shape="circle"] {
    inline-size: var(--size-40);
    block-size: var(--size-40);
    border-radius: var(--radius-full);
  }

  /* Блик (50% ширины) проходит от −100% до 200% — полностью заходит и уходит за края */
  @keyframes ui-skeleton-shine {
    from {
      background-position: -100% 0, 0 0;
    }

    to {
      background-position: 200% 0, 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ui-skeleton {
      animation: none;
    }
  }
}
</style>
