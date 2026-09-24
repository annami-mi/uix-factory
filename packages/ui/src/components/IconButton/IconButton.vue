<script setup lang="ts">
/**
 * Кнопка-иконка. Источник: Figma "Buttons" (127:566), ряд IconButton (те же состояния, что у Button).
 * Это Button с модификатором `ui-button--icon`: квадрат size/48 (круг — radius/full), иконка size/24;
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
    disabled?: boolean;
    loading?: boolean;
    as?: "button" | "a";
  }>(),
  { variant: "secondary", as: "button" },
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
