<script setup lang="ts">
/**
 * Кнопка-иконка. Источник: Figma "Buttons" (127:566), ряд IconButton (те же состояния, что у Button).
 * Это Button с модификатором `ui-button--icon`: квадрат высоты кнопки (s 40 / m 48 / l 56, круг — radius/full),
 * иконка s 20 / m, l 24;
 * материал, пружина, блик, loading — от Button. Иконка — слот (Lucide).
 *
 * `label` обязателен: у кнопки без текста доступное имя берётся только из него (aria-label),
 * и он же — подсказка при наведении (title).
 */
import Button from "../Button/Button.vue";

withDefaults(
  defineProps<{
    /** Доступное имя (что делает кнопка): «Закрыть», «Отправить» */
    label: string;
    variant?: "primary" | "secondary" | "ghost";
    /** Размер — как у Button: s (компактный), m (по умолчанию), l */
    size?: "s" | "m" | "l";
    disabled?: boolean;
    loading?: boolean;
    as?: "button" | "a";
  }>(),
  { variant: "secondary", size: "m", as: "button" },
);

defineEmits<{
  /** Клик по активной кнопке. В disabled/loading не вызывается */
  click: [event: MouseEvent];
}>();

defineSlots<{
  /** Иконка 24×24 (Lucide), цвет — currentColor */
  default: () => unknown;
}>();
</script>

<template>
  <Button
    class="ui-button--icon"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :as="as"
    :aria-label="label"
    :title="label"
    @click="$emit('click', $event)"
  >
    <template #start>
      <slot />
    </template>
  </Button>
</template>
