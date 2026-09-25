<script setup lang="ts">
/**
 * Карточка графика — <figure> с заголовком (figcaption), описанием, действиями и переключателем
 * «График / Таблица» (табличный двойник — доступный эквивалент любого графика, ADR-0007).
 *
 * - `loading` — перезагрузка данных: прежний рендер остаётся, приглушённый (без скелетона и скачка
 *   раскладки), `aria-busy`.
 * - Фильтры периода и измерений — не здесь, а одной строкой над всеми графиками (правило методики).
 */
import { computed, provide, ref } from "vue";
import { ChartLine, Table2 } from "@lucide/vue";
import { Card, Heading, IconButton, Text } from "@uix/ui";
import { chartContextKey } from "../core/context";

const props = withDefaults(
  defineProps<{
    /** Заголовок графика (figcaption) — и имя таблицы-двойника */
    title: string;
    /** Подзаголовок: что и за какой период */
    description?: string;
    /** Уровень заголовка — по структуре страницы (под h1 дашборда — 2) */
    headingLevel?: 2 | 3 | 4;
    /** Идёт перезагрузка данных */
    loading?: boolean;
    /** Подписи переключателя вида */
    tableLabel?: string;
    /** Подпись кнопки возврата к графику */
    chartLabel?: string;
  }>(),
  { headingLevel: 3, loading: false, tableLabel: "Показать таблицей", chartLabel: "Показать графиком" },
);

defineSlots<{
  /** График (LineChart, BarChart…) — в режиме «Таблица» сам покажет табличный двойник */
  default: () => unknown;
  /** Действия справа от заголовка (меню, экспорт) */
  actions?: () => unknown;
}>();

const view = ref<"chart" | "table">("chart");
provide(chartContextKey, {
  view,
  loading: computed(() => props.loading),
  title: computed(() => props.title),
});
</script>

<template>
  <Card
    as="figure"
    class="ui-chart-card"
    :aria-busy="loading ? 'true' : undefined"
  >
    <div class="ui-chart-card__header">
      <figcaption class="ui-chart-card__caption">
        <Heading
          :level="headingLevel"
          size="sm"
        >
          {{ title }}
        </Heading>
        <Text
          v-if="description"
          size="md"
          tone="secondary"
        >
          {{ description }}
        </Text>
      </figcaption>
      <div class="ui-chart-card__actions">
        <slot name="actions" />
        <IconButton
          variant="ghost"
          :label="view === 'chart' ? tableLabel : chartLabel"
          @click="view = view === 'chart' ? 'table' : 'chart'"
        >
          <Table2 v-if="view === 'chart'" />
          <ChartLine v-else />
        </IconButton>
      </div>
    </div>
    <div
      class="ui-chart-card__body"
      :data-loading="loading || undefined"
    >
      <slot />
    </div>
  </Card>
</template>

<style scoped>
@layer components {
  .ui-chart-card {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    min-inline-size: 0;
  }

  .ui-chart-card__header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .ui-chart-card__caption {
    display: grid;
    flex: 1;
    gap: var(--space-1);
    min-inline-size: 0;
    /* первая строка — на оси кнопки size/48 */
    padding-block-start: calc((var(--size-48) - var(--type-heading-sm-line-height)) / 2);
  }

  .ui-chart-card__actions {
    display: flex;
    flex: none;
    gap: var(--space-1);
    margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) 0 0;
  }

  .ui-chart-card__body {
    min-inline-size: 0;
    transition: opacity var(--duration-normal) ease-out;
  }

  /* Перезагрузка: прежний рендер приглушён — без скелетона и скачка раскладки */
  .ui-chart-card__body[data-loading] {
    opacity: var(--opacity-50);
  }
}
</style>
