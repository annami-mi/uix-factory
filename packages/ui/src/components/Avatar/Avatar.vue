<script setup lang="ts">
/**
 * Аватар: фото или инициалы (если фото нет или не загрузилось).
 * Размеры — size/32, /40, /48; круг radius/full. Имя — доступное имя (alt у фото, aria-label у инициалов).
 * `decorative` — рядом уже написано имя, аватар скрыт от скринридера (без дублирования).
 */
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    /** Имя: подпись для скринридера и источник инициалов */
    name: string;
    /** URL фото */
    src?: string;
    size?: "s" | "m" | "l";
    /** Имя уже есть рядом текстом — скрыть аватар от скринридера */
    decorative?: boolean;
  }>(),
  { size: "m", decorative: false },
);

const failed = ref(false);
watch(
  () => props.src,
  () => (failed.value = false),
);

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join(""),
);
</script>

<template>
  <span
    class="ui-avatar"
    :data-size="size"
    :role="!decorative && (!src || failed) ? 'img' : undefined"
    :aria-label="!decorative && (!src || failed) ? name : undefined"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <img
      v-if="src && !failed"
      class="ui-avatar__img"
      :src="src"
      :alt="decorative ? '' : name"
      @error="failed = true"
    >
    <span
      v-else
      class="ui-avatar__initials"
      aria-hidden="true"
    >{{ initials }}</span>
  </span>
</template>

<style scoped>
@layer components {
  .ui-avatar {
    --_size: var(--size-40);

    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    inline-size: var(--_size);
    block-size: var(--_size);
    overflow: hidden;
    border-radius: var(--radius-full);
    background: var(--color-surface-hover, Canvas);
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
  }

  .ui-avatar[data-size="s"] {
    --_size: var(--size-32);

    font-size: var(--type-label-xs-font-size);
  }

  .ui-avatar[data-size="l"] {
    --_size: var(--size-48);
  }

  .ui-avatar__img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}
</style>
