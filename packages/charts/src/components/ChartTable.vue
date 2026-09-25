<script setup lang="ts">
/**
 * Табличный двойник графика — доступный эквивалент (WCAG): те же данные строками.
 * Подпись таблицы — заголовок графика. Широкая таблица прокручивается по горизонтали
 * (область с tabindex — прокрутка доступна с клавиатуры).
 */
import type { Datum, TableColumn } from "../core/types";

defineProps<{
  /** Подпись таблицы — заголовок графика */
  caption: string;
  /** Колонки: поле, заголовок, формат */
  columns: TableColumn[];
  /** Строки данных графика */
  rows: Datum[];
}>();

const cell = (row: Datum, col: TableColumn) => (col.format ? col.format(row[col.key]) : String(row[col.key] ?? "—"));
</script>

<template>
  <div
    class="ui-chart-table"
    tabindex="0"
    role="region"
    :aria-label="caption"
  >
    <table>
      <caption class="ui-chart-table__caption">
        {{ caption }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            :data-numeric="col.numeric || undefined"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="index"
        >
          <component
            :is="colIndex === 0 ? 'th' : 'td'"
            v-for="(col, colIndex) in columns"
            :key="col.key"
            :scope="colIndex === 0 ? 'row' : undefined"
            :data-numeric="col.numeric || undefined"
          >
            {{ cell(row, col) }}
          </component>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
@layer components {
  .ui-chart-table {
    max-inline-size: 100%;
    overflow-x: auto;
    /* Скроллбар невидим, пока указатель не над областью: место занято всегда — без скачка раскладки */
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    transition: scrollbar-color var(--duration-normal) ease;
    border-radius: var(--radius-2);
  }

  .ui-chart-table:focus-visible {
    outline: var(--stroke-2) solid var(--color-state-focus, Highlight);
    outline-offset: var(--stroke-2);
  }

  table {
    inline-size: 100%;
    border-collapse: collapse;
    font-family: var(--type-body-m-font-family);
    font-size: var(--type-body-m-font-size);
    line-height: var(--type-body-m-line-height);
    color: var(--color-text-primary, CanvasText);
  }

  .ui-chart-table__caption {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-block-end: var(--stroke-1) solid var(--color-divider, GrayText);
    text-align: start;
    white-space: nowrap;
  }

  /* Заголовки колонок — label/s 14px, ячейки — body/m 16px (основной текст) */
  thead th {
    color: var(--color-text-secondary, CanvasText);
    font-family: var(--type-label-s-font-family);
    font-weight: var(--type-label-s-font-weight);
    font-size: var(--type-label-s-font-size);
    line-height: var(--type-label-s-line-height);
  }

  tbody th {
    font-weight: var(--type-body-m-font-weight);
  }

  [data-numeric] {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  .ui-chart-table:is(:hover, :focus-visible) {
    scrollbar-color: var(--color-border-default, GrayText) transparent;
  }
}
</style>
